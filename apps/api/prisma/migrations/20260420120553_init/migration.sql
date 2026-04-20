-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'ATTENDANT', 'MARKETING', 'FINANCE', 'PARK_MANAGER');

-- CreateEnum
CREATE TYPE "LeadOrigin" AS ENUM ('META_ADS', 'GOOGLE_ADS', 'ORGANIC', 'REFERRAL', 'WALK_IN', 'LANDING_PAGE', 'IMPORT', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductInterest" AS ENUM ('DAILY_PASS', 'ANNUAL_PASS', 'BIRTHDAY_PARTY', 'CORPORATE_EVENT', 'RADICAL_ADVENTURE', 'PROMOTION', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadEventKind" AS ENUM ('CREATED', 'STAGE_CHANGED', 'STATUS_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'TAG_ADDED', 'TAG_REMOVED', 'MESSAGE_IN', 'MESSAGE_OUT', 'NOTE_ADDED', 'SCORE_UPDATED', 'CONSENT_GIVEN', 'CONSENT_REVOKED', 'ANONYMIZED');

-- CreateEnum
CREATE TYPE "AssignmentReason" AS ENUM ('AI_SUGGESTION', 'ROUND_ROBIN', 'MANUAL_SUPERVISOR', 'MANUAL_SELF_CLAIM', 'REASSIGNED');

-- CreateEnum
CREATE TYPE "WaConversationStatus" AS ENUM ('OPEN', 'EXPIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "WaDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WaMessageKind" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACTS', 'INTERACTIVE', 'TEMPLATE', 'REACTION', 'SYSTEM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WaMessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "WaTemplateStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "AutomationTriggerKind" AS ENUM ('LEAD_CREATED', 'MESSAGE_RECEIVED', 'NO_REPLY_TIMEOUT', 'TAG_APPLIED', 'STAGE_CHANGED', 'SCORE_THRESHOLD_CROSSED', 'SCHEDULED_CRON');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'DEAD_LETTERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LandingPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadImportStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('MARKETING', 'TRANSACTIONAL', 'ANALYTICS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ConsentChannel" AS ENUM ('LANDING_PAGE', 'WHATSAPP', 'PHONE', 'IN_PERSON', 'IMPORT');

-- CreateEnum
CREATE TYPE "PrivacyRequestKind" AS ENUM ('ACCESS', 'EXPORT', 'DELETION', 'RECTIFICATION');

-- CreateEnum
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadStage" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTag" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "origin" "LeadOrigin" NOT NULL,
    "email" CITEXT,
    "visitDate" DATE,
    "groupSize" INTEGER,
    "productInterest" "ProductInterest",
    "cityGuess" TEXT,
    "ageGuess" TEXT,
    "aiScore" INTEGER,
    "aiReason" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "stageId" UUID,
    "sourceCampaign" TEXT,
    "sourceAdset" TEXT,
    "sourceAd" TEXT,
    "sourceFbclid" TEXT,
    "sourceGclid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastContactAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "anonymizedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTagOnLead" (
    "leadId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTagOnLead_pkey" PRIMARY KEY ("leadId","tagId")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "kind" "LeadEventKind" NOT NULL,
    "payload" JSONB NOT NULL,
    "actorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEmbedding" (
    "leadId" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "vector" vector(1536) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadEmbedding_pkey" PRIMARY KEY ("leadId")
);

-- CreateTable
CREATE TABLE "AttendantProfile" (
    "userId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "maxConcurrent" INTEGER NOT NULL DEFAULT 40,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "skillsTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastActiveAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendantProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LeadAssignment" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "assignedToId" UUID NOT NULL,
    "assignedById" UUID,
    "reason" "AssignmentReason" NOT NULL,
    "aiScoreAtTime" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaAccount" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "wabaId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "appSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaPhoneNumber" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "displayPhoneE164" TEXT NOT NULL,
    "qualityRating" TEXT,
    "verifiedName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaPhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaConversation" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "leadId" UUID,
    "phoneNumberId" UUID NOT NULL,
    "contactWaId" TEXT NOT NULL,
    "status" "WaConversationStatus" NOT NULL DEFAULT 'OPEN',
    "windowExpiresAt" TIMESTAMP(3),
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "lastReadAtByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaMessage" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "phoneNumberId" UUID NOT NULL,
    "waMessageId" TEXT,
    "direction" "WaDirection" NOT NULL,
    "kind" "WaMessageKind" NOT NULL,
    "status" "WaMessageStatus" NOT NULL,
    "text" TEXT,
    "mediaUrl" TEXT,
    "mediaMimeType" TEXT,
    "payload" JSONB NOT NULL,
    "templateId" UUID,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "sentById" UUID,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaTemplate" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "WaTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "components" JSONB NOT NULL,
    "metaId" TEXT,
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationFlow" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "AutomationTriggerKind" NOT NULL,
    "triggerCfg" JSONB NOT NULL,
    "graph" JSONB NOT NULL,
    "status" "AutomationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "flowId" UUID NOT NULL,
    "leadId" UUID,
    "triggeredById" UUID,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'PENDING',
    "context" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRunStep" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "nodeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AutomationRunStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingPage" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "LandingPageStatus" NOT NULL DEFAULT 'DRAFT',
    "document" JSONB NOT NULL,
    "metaPixelId" TEXT,
    "gaId" TEXT,
    "clarityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingSubmission" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "leadId" UUID,
    "payload" JSONB NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "fbclid" TEXT,
    "gclid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadImport" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "fieldMap" JSONB NOT NULL,
    "fileRef" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "status" "LeadImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errorsSample" JSONB,
    "createdById" UUID NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadConsent" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "channel" "ConsentChannel" NOT NULL,
    "policyVersionId" UUID NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "evidence" JSONB NOT NULL,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "LeadConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "leadId" UUID,
    "requesterEmail" CITEXT NOT NULL,
    "requesterPhone" TEXT,
    "kind" "PrivacyRequestKind" NOT NULL,
    "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" UUID,
    "note" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "LeadStage_tenantId_order_idx" ON "LeadStage"("tenantId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LeadStage_tenantId_name_key" ON "LeadStage"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTag_tenantId_name_key" ON "LeadTag"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Lead_tenantId_stageId_idx" ON "Lead"("tenantId", "stageId");

-- CreateIndex
CREATE INDEX "Lead_tenantId_aiScore_idx" ON "Lead"("tenantId", "aiScore");

-- CreateIndex
CREATE INDEX "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_tenantId_origin_idx" ON "Lead"("tenantId", "origin");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_tenantId_phoneE164_key" ON "Lead"("tenantId", "phoneE164");

-- CreateIndex
CREATE INDEX "LeadTagOnLead_tagId_idx" ON "LeadTagOnLead"("tagId");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_createdAt_idx" ON "LeadNote"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadEvent_leadId_createdAt_idx" ON "LeadEvent"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadEvent_kind_createdAt_idx" ON "LeadEvent"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "AttendantProfile_tenantId_isAvailable_idx" ON "AttendantProfile"("tenantId", "isAvailable");

-- CreateIndex
CREATE INDEX "LeadAssignment_leadId_active_idx" ON "LeadAssignment"("leadId", "active");

-- CreateIndex
CREATE INDEX "LeadAssignment_tenantId_assignedToId_active_idx" ON "LeadAssignment"("tenantId", "assignedToId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "WaAccount_wabaId_key" ON "WaAccount"("wabaId");

-- CreateIndex
CREATE UNIQUE INDEX "WaPhoneNumber_phoneNumberId_key" ON "WaPhoneNumber"("phoneNumberId");

-- CreateIndex
CREATE INDEX "WaPhoneNumber_tenantId_idx" ON "WaPhoneNumber"("tenantId");

-- CreateIndex
CREATE INDEX "WaConversation_tenantId_status_idx" ON "WaConversation"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WaConversation_tenantId_phoneNumberId_contactWaId_key" ON "WaConversation"("tenantId", "phoneNumberId", "contactWaId");

-- CreateIndex
CREATE UNIQUE INDEX "WaMessage_waMessageId_key" ON "WaMessage"("waMessageId");

-- CreateIndex
CREATE INDEX "WaMessage_conversationId_createdAt_idx" ON "WaMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "WaMessage_tenantId_direction_createdAt_idx" ON "WaMessage"("tenantId", "direction", "createdAt");

-- CreateIndex
CREATE INDEX "WaMessage_waMessageId_idx" ON "WaMessage"("waMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "WaTemplate_metaId_key" ON "WaTemplate"("metaId");

-- CreateIndex
CREATE UNIQUE INDEX "WaTemplate_accountId_name_language_key" ON "WaTemplate"("accountId", "name", "language");

-- CreateIndex
CREATE INDEX "AutomationFlow_tenantId_status_idx" ON "AutomationFlow"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AutomationFlow_tenantId_trigger_idx" ON "AutomationFlow"("tenantId", "trigger");

-- CreateIndex
CREATE INDEX "AutomationRun_tenantId_status_idx" ON "AutomationRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AutomationRun_flowId_createdAt_idx" ON "AutomationRun"("flowId", "createdAt");

-- CreateIndex
CREATE INDEX "AutomationRun_leadId_idx" ON "AutomationRun"("leadId");

-- CreateIndex
CREATE INDEX "AutomationRunStep_runId_startedAt_idx" ON "AutomationRunStep"("runId", "startedAt");

-- CreateIndex
CREATE INDEX "LandingPage_tenantId_status_idx" ON "LandingPage"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_tenantId_slug_key" ON "LandingPage"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "LandingSubmission_pageId_createdAt_idx" ON "LandingSubmission"("pageId", "createdAt");

-- CreateIndex
CREATE INDEX "LandingSubmission_tenantId_createdAt_idx" ON "LandingSubmission"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadImport_tenantId_status_idx" ON "LeadImport"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyVersion_tenantId_version_key" ON "PolicyVersion"("tenantId", "version");

-- CreateIndex
CREATE INDEX "LeadConsent_leadId_purpose_idx" ON "LeadConsent"("leadId", "purpose");

-- CreateIndex
CREATE INDEX "PrivacyRequest_tenantId_status_idx" ON "PrivacyRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "PushToken_tenantId_userId_idx" ON "PushToken"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_userId_token_key" ON "PushToken"("userId", "token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadStage" ADD CONSTRAINT "LeadStage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTag" ADD CONSTRAINT "LeadTag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "LeadStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTagOnLead" ADD CONSTRAINT "LeadTagOnLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTagOnLead" ADD CONSTRAINT "LeadTagOnLead_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "LeadTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEmbedding" ADD CONSTRAINT "LeadEmbedding_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendantProfile" ADD CONSTRAINT "AttendantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendantProfile" ADD CONSTRAINT "AttendantProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaAccount" ADD CONSTRAINT "WaAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaPhoneNumber" ADD CONSTRAINT "WaPhoneNumber_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaPhoneNumber" ADD CONSTRAINT "WaPhoneNumber_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaConversation" ADD CONSTRAINT "WaConversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaConversation" ADD CONSTRAINT "WaConversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaConversation" ADD CONSTRAINT "WaConversation_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "WaPhoneNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaMessage" ADD CONSTRAINT "WaMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaMessage" ADD CONSTRAINT "WaMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WaConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaMessage" ADD CONSTRAINT "WaMessage_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "WaPhoneNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaMessage" ADD CONSTRAINT "WaMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WaTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaMessage" ADD CONSTRAINT "WaMessage_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaTemplate" ADD CONSTRAINT "WaTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaTemplate" ADD CONSTRAINT "WaTemplate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationFlow" ADD CONSTRAINT "AutomationFlow_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "AutomationFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRunStep" ADD CONSTRAINT "AutomationRunStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingPage" ADD CONSTRAINT "LandingPage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingSubmission" ADD CONSTRAINT "LandingSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingSubmission" ADD CONSTRAINT "LandingSubmission_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "LandingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandingSubmission" ADD CONSTRAINT "LandingSubmission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadImport" ADD CONSTRAINT "LeadImport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyVersion" ADD CONSTRAINT "PolicyVersion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadConsent" ADD CONSTRAINT "LeadConsent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadConsent" ADD CONSTRAINT "LeadConsent_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
