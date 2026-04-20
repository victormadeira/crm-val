-- =====================================================================
-- Acquapark PRD — Fase 1 a 4
-- Multi-pipeline por segmento, blueprint, rotting, tasks, bookings,
-- proposals com pixel tracking, gamificação.
--
-- Dados de LeadStage são MIGRADOS pra PipelineStage sob um novo Pipeline
-- "Legacy" (segment=AVULSO) por tenant, pra não perder estágios existentes.
-- =====================================================================

-- ---------- ENUMS ----------
CREATE TYPE "PipelineSegment" AS ENUM ('GRUPOS_ESCOLARES', 'EVENTOS_CORPORATIVOS', 'PACOTES_CONVENIOS', 'AVULSO');
CREATE TYPE "RottingStatus" AS ENUM ('HEALTHY', 'WARNING', 'ROTTEN');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE "BookingStatus" AS ENUM ('TENTATIVE', 'CONFIRMED', 'CANCELLED');
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'OPENED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- ---------- EXTENDER LeadEventKind ----------
ALTER TYPE "LeadEventKind" ADD VALUE 'PIPELINE_CHANGED';
ALTER TYPE "LeadEventKind" ADD VALUE 'ROTTING_CHANGED';
ALTER TYPE "LeadEventKind" ADD VALUE 'TASK_CREATED';
ALTER TYPE "LeadEventKind" ADD VALUE 'TASK_COMPLETED';
ALTER TYPE "LeadEventKind" ADD VALUE 'PROPOSAL_SENT';
ALTER TYPE "LeadEventKind" ADD VALUE 'PROPOSAL_OPENED';
ALTER TYPE "LeadEventKind" ADD VALUE 'BOOKING_CREATED';
ALTER TYPE "LeadEventKind" ADD VALUE 'FIELD_UPDATED';

-- ---------- Pipeline ----------
CREATE TABLE "Pipeline" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"  UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "name"      TEXT NOT NULL,
  "segment"   "PipelineSegment" NOT NULL,
  "color"     TEXT,
  "position"  INT NOT NULL DEFAULT 0,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "Pipeline_tenantId_segment_key" ON "Pipeline"("tenantId", "segment");
CREATE INDEX "Pipeline_tenantId_position_idx" ON "Pipeline"("tenantId", "position");

-- ---------- PipelineStage ----------
CREATE TABLE "PipelineStage" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"        UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "pipelineId"      UUID NOT NULL REFERENCES "Pipeline"("id") ON DELETE CASCADE,
  "name"            TEXT NOT NULL,
  "order"           INT NOT NULL,
  "color"           TEXT,
  "isFinal"         BOOLEAN NOT NULL DEFAULT FALSE,
  "probability"     INT NOT NULL DEFAULT 0,
  "rottingDays"     INT NOT NULL DEFAULT 7,
  "requiredFields"  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "autoTasks"       JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX "PipelineStage_pipelineId_name_key" ON "PipelineStage"("pipelineId", "name");
CREATE INDEX "PipelineStage_tenantId_pipelineId_order_idx" ON "PipelineStage"("tenantId", "pipelineId", "order");

-- ---------- MIGRAR LeadStage -> PipelineStage ----------
-- Cria um Pipeline "Legacy" (AVULSO) por tenant que tenha LeadStage, migra os
-- estágios, e atualiza Lead.stageId pra apontar ao novo id.
DO $$
DECLARE
  t RECORD;
  new_pipeline_id UUID;
BEGIN
  -- Adiciona colunas novas em Lead ANTES da migração
  ALTER TABLE "Lead" ADD COLUMN "pipelineId" UUID;
  ALTER TABLE "Lead" ADD COLUMN "segment" "PipelineSegment";
  ALTER TABLE "Lead" ADD COLUMN "lastActivityAt" TIMESTAMPTZ;
  ALTER TABLE "Lead" ADD COLUMN "rottingStatus" "RottingStatus" NOT NULL DEFAULT 'HEALTHY';
  ALTER TABLE "Lead" ADD COLUMN "blueprintCompletion" INT NOT NULL DEFAULT 0;
  ALTER TABLE "Lead" ADD COLUMN "customFields" JSONB NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE "Lead" ADD COLUMN "scoreBreakdown" JSONB;

  FOR t IN SELECT DISTINCT "tenantId" FROM "LeadStage" LOOP
    INSERT INTO "Pipeline" ("id", "tenantId", "name", "segment", "position", "isDefault", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), t."tenantId", 'Legacy', 'AVULSO', 0, TRUE, NOW(), NOW())
    ON CONFLICT ("tenantId", "segment") DO UPDATE SET "name" = EXCLUDED."name"
    RETURNING "id" INTO new_pipeline_id;

    -- Insere estágios
    INSERT INTO "PipelineStage" ("id", "tenantId", "pipelineId", "name", "order", "color", "isFinal", "createdAt")
    SELECT "id", "tenantId", new_pipeline_id, "name", "order", "color", "isFinal", "createdAt"
    FROM "LeadStage" WHERE "tenantId" = t."tenantId";

    -- Atualiza Leads: aponta pipelineId
    UPDATE "Lead" SET "pipelineId" = new_pipeline_id, "segment" = 'AVULSO'
    WHERE "tenantId" = t."tenantId" AND "stageId" IS NOT NULL;
  END LOOP;
END $$;

-- Drop FK antiga Lead → LeadStage e tabela LeadStage
ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_stageId_fkey";
DROP TABLE "LeadStage";

-- Recria FKs de Lead pras novas tabelas
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_pipelineId_fkey"
  FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE SET NULL;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_stageId_fkey"
  FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL;

-- Novos indices em Lead
DROP INDEX IF EXISTS "Lead_tenantId_stageId_idx";
CREATE INDEX "Lead_tenantId_pipelineId_stageId_idx" ON "Lead"("tenantId", "pipelineId", "stageId");
CREATE INDEX "Lead_tenantId_rottingStatus_idx" ON "Lead"("tenantId", "rottingStatus");
CREATE INDEX "Lead_tenantId_lastActivityAt_idx" ON "Lead"("tenantId", "lastActivityAt");

-- ---------- Task ----------
CREATE TABLE "Task" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"      UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "leadId"        UUID REFERENCES "Lead"("id") ON DELETE CASCADE,
  "assigneeId"    UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "dueAt"         TIMESTAMPTZ,
  "status"        "TaskStatus" NOT NULL DEFAULT 'PENDING',
  "createdByRule" TEXT,
  "completedAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Task_tenantId_status_idx" ON "Task"("tenantId", "status");
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");
CREATE INDEX "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");
CREATE INDEX "Task_tenantId_dueAt_idx" ON "Task"("tenantId", "dueAt");

-- ---------- Booking ----------
CREATE TABLE "Booking" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"        UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "leadId"          UUID REFERENCES "Lead"("id") ON DELETE SET NULL,
  "title"           TEXT NOT NULL,
  "eventDate"       DATE NOT NULL,
  "numParticipants" INT NOT NULL,
  "status"          "BookingStatus" NOT NULL DEFAULT 'TENTATIVE',
  "notes"           TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Booking_tenantId_eventDate_idx" ON "Booking"("tenantId", "eventDate");
CREATE INDEX "Booking_leadId_idx" ON "Booking"("leadId");

-- ---------- Proposal + ProposalView ----------
CREATE TABLE "Proposal" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "leadId"      UUID NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
  "token"       TEXT NOT NULL UNIQUE,
  "title"       TEXT NOT NULL,
  "valueCents"  INT NOT NULL,
  "validUntil"  TIMESTAMPTZ,
  "content"     JSONB NOT NULL,
  "status"      "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "sentAt"      TIMESTAMPTZ,
  "openedAt"    TIMESTAMPTZ,
  "openedCount" INT NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Proposal_tenantId_status_idx" ON "Proposal"("tenantId", "status");
CREATE INDEX "Proposal_leadId_idx" ON "Proposal"("leadId");

CREATE TABLE "ProposalView" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "proposalId" UUID NOT NULL REFERENCES "Proposal"("id") ON DELETE CASCADE,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "viewedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "ProposalView_proposalId_viewedAt_idx" ON "ProposalView"("proposalId", "viewedAt");

-- ---------- GamificationEvent ----------
CREATE TABLE "GamificationEvent" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"  UUID NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "userId"    UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "points"    INT NOT NULL,
  "reason"    TEXT NOT NULL,
  "badge"     TEXT,
  "metadata"  JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "GamificationEvent_tenantId_createdAt_idx" ON "GamificationEvent"("tenantId", "createdAt");
CREATE INDEX "GamificationEvent_userId_createdAt_idx" ON "GamificationEvent"("userId", "createdAt");
