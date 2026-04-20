/* eslint-disable no-console */
import { PrismaClient, Prisma } from "@prisma/client";
import argon2 from "argon2";
import { randomUUID } from "node:crypto";

/**
 * Seed idempotente — roda com `pnpm --filter @valparaiso/api exec tsx prisma/seed.ts`.
 * Cria (se ausente):
 *   - Tenant "valparaiso"
 *   - Usuário ADMIN com credenciais definidas em SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 *   - 4 Pipelines (Grupos Escolares, Eventos Corporativos, Pacotes/Convênios, Avulso)
 *     com estágios, blueprint (requiredFields) e auto_tasks
 *   - PolicyVersion v1
 *
 * Nada aqui usa TenantContext — o seed opera em raw PrismaClient direto,
 * fora da guarda de multi-tenancy. NÃO REUTILIZE ESSE PADRÃO em código de
 * aplicação: seeds e scripts admin são o único caso permitido.
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    const tenantId = await upsertTenant(prisma);
    await upsertAdmin(prisma, tenantId);
    await upsertPipelines(prisma, tenantId);
    await upsertPolicy(prisma, tenantId);
    console.log("[seed] OK tenant", tenantId);
  } finally {
    await prisma.$disconnect();
  }
}

async function upsertTenant(prisma: PrismaClient): Promise<string> {
  const slug = "valparaiso";
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) return existing.id;
  const created = await prisma.tenant.create({
    data: {
      id: randomUUID(),
      slug,
      name: "Valparaíso Adventure Park",
    },
  });
  console.log("[seed] tenant criado", created.id);
  return created.id;
}

async function upsertAdmin(prisma: PrismaClient, tenantId: string) {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@valparaiso.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme-local-only";

  const existing = await prisma.user.findFirst({
    where: { tenantId, email },
  });
  if (existing) return;
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.user.create({
    data: {
      tenantId,
      email,
      passwordHash: hash,
      name: "Admin Valparaíso",
      role: "ADMIN",
    },
  });
  console.log(`[seed] admin criado — email=${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn(
      "[seed] SENHA PADRÃO usada (changeme-local-only). Defina SEED_ADMIN_PASSWORD."
    );
  }
}

/**
 * 4 Pipelines por segmento (Acquapark PRD Fase 1). Cada stage tem:
 *  - probability (forecast ponderado)
 *  - rottingDays (2x = ROTTEN)
 *  - requiredFields: [{ field, label }] — campos que o Lead precisa ter
 *    preenchidos em `customFields` (ou em colunas nativas) pra entrar no stage.
 *  - autoTasks: [{ title, dueInDays }] — tasks criadas ao entrar no stage.
 *
 * Se o pipeline "Legacy" migrado da versão anterior existir, ele é mantido —
 * mas os 4 pipelines canônicos ficam como isDefault=true e ordenados à frente.
 */
async function upsertPipelines(prisma: PrismaClient, tenantId: string) {
  const pipelines: Array<{
    segment: "GRUPOS_ESCOLARES" | "EVENTOS_CORPORATIVOS" | "PACOTES_CONVENIOS" | "AVULSO";
    name: string;
    color: string;
    position: number;
    stages: Array<{
      name: string;
      order: number;
      color: string;
      isFinal?: boolean;
      probability: number;
      rottingDays: number;
      requiredFields: Array<{ field: string; label: string }>;
      autoTasks: Array<{ title: string; dueInDays: number }>;
    }>;
  }> = [
    {
      segment: "GRUPOS_ESCOLARES",
      name: "Grupos Escolares",
      color: "#36ccc7",
      position: 1,
      stages: [
        {
          name: "Primeiro contato",
          order: 1,
          color: "#36ccc7",
          probability: 10,
          rottingDays: 5,
          requiredFields: [
            { field: "name", label: "Nome do responsável" },
            { field: "phoneE164", label: "Telefone" },
          ],
          autoTasks: [
            { title: "Responder primeiro contato em até 1h", dueInDays: 0 },
          ],
        },
        {
          name: "Qualificação",
          order: 2,
          color: "#94c93b",
          probability: 25,
          rottingDays: 7,
          requiredFields: [
            { field: "customFields.nomeEscola", label: "Nome da escola" },
            { field: "customFields.numParticipantes", label: "Nº de alunos" },
            { field: "customFields.dataPretendida", label: "Data pretendida" },
          ],
          autoTasks: [
            { title: "Bloquear data tentativa no calendário", dueInDays: 1 },
            { title: "Confirmar nº de alunos", dueInDays: 2 },
          ],
        },
        {
          name: "Proposta enviada",
          order: 3,
          color: "#ffcc01",
          probability: 50,
          rottingDays: 5,
          requiredFields: [
            { field: "customFields.valorProposta", label: "Valor da proposta" },
          ],
          autoTasks: [
            { title: "Follow-up em 48h após envio", dueInDays: 2 },
          ],
        },
        {
          name: "Aguardando aprovação diretoria",
          order: 4,
          color: "#ffaa00",
          probability: 70,
          rottingDays: 10,
          requiredFields: [],
          autoTasks: [
            { title: "Ligar para responsável semanalmente", dueInDays: 7 },
          ],
        },
        {
          name: "Contrato & pagamento",
          order: 5,
          color: "#ff5e26",
          probability: 85,
          rottingDays: 5,
          requiredFields: [
            { field: "customFields.valorProposta", label: "Valor fechado" },
          ],
          autoTasks: [
            { title: "Enviar contrato + boleto", dueInDays: 1 },
          ],
        },
        {
          name: "Fechado – ganho",
          order: 6,
          color: "#006938",
          isFinal: true,
          probability: 100,
          rottingDays: 999,
          requiredFields: [],
          autoTasks: [
            { title: "Confirmar reserva no calendário", dueInDays: 1 },
            { title: "Preparar briefing pro operacional", dueInDays: 2 },
          ],
        },
        {
          name: "Fechado – perdido",
          order: 7,
          color: "#666666",
          isFinal: true,
          probability: 0,
          rottingDays: 999,
          requiredFields: [],
          autoTasks: [],
        },
      ],
    },
    {
      segment: "EVENTOS_CORPORATIVOS",
      name: "Eventos Corporativos",
      color: "#003399",
      position: 2,
      stages: [
        {
          name: "Primeiro contato",
          order: 1,
          color: "#36ccc7",
          probability: 10,
          rottingDays: 3,
          requiredFields: [
            { field: "name", label: "Contato" },
            { field: "phoneE164", label: "Telefone" },
            { field: "customFields.empresa", label: "Empresa" },
          ],
          autoTasks: [
            { title: "Responder em até 30min (urgência corporativa)", dueInDays: 0 },
          ],
        },
        {
          name: "Briefing do evento",
          order: 2,
          color: "#94c93b",
          probability: 30,
          rottingDays: 5,
          requiredFields: [
            { field: "customFields.dataEvento", label: "Data do evento" },
            { field: "customFields.numParticipantes", label: "Nº de participantes" },
            { field: "customFields.orcamento", label: "Faixa de orçamento" },
          ],
          autoTasks: [
            { title: "Bloquear data no calendário", dueInDays: 1 },
            { title: "Preparar proposta personalizada", dueInDays: 3 },
          ],
        },
        {
          name: "Proposta enviada",
          order: 3,
          color: "#ffcc01",
          probability: 55,
          rottingDays: 4,
          requiredFields: [
            { field: "customFields.valorProposta", label: "Valor da proposta" },
          ],
          autoTasks: [
            { title: "Follow-up 48h", dueInDays: 2 },
          ],
        },
        {
          name: "Negociação",
          order: 4,
          color: "#ffaa00",
          probability: 75,
          rottingDays: 7,
          requiredFields: [],
          autoTasks: [
            { title: "Agendar call de alinhamento", dueInDays: 3 },
          ],
        },
        {
          name: "Contrato",
          order: 5,
          color: "#ff5e26",
          probability: 90,
          rottingDays: 5,
          requiredFields: [],
          autoTasks: [
            { title: "Enviar contrato + NF adiantada", dueInDays: 1 },
          ],
        },
        {
          name: "Fechado – ganho",
          order: 6,
          color: "#006938",
          isFinal: true,
          probability: 100,
          rottingDays: 999,
          requiredFields: [],
          autoTasks: [
            { title: "Kickoff com operacional", dueInDays: 2 },
          ],
        },
        {
          name: "Fechado – perdido",
          order: 7,
          color: "#666666",
          isFinal: true,
          probability: 0,
          rottingDays: 999,
          requiredFields: [],
          autoTasks: [],
        },
      ],
    },
    {
      segment: "PACOTES_CONVENIOS",
      name: "Pacotes & Convênios",
      color: "#ff0030",
      position: 3,
      stages: [
        {
          name: "Primeiro contato",
          order: 1,
          color: "#36ccc7",
          probability: 15,
          rottingDays: 7,
          requiredFields: [
            { field: "name", label: "Responsável" },
            { field: "customFields.tipoConvenio", label: "Tipo (agência/escola/parceiro)" },
          ],
          autoTasks: [
            { title: "Enviar catálogo de pacotes", dueInDays: 1 },
          ],
        },
        {
          name: "Proposta comercial",
          order: 2,
          color: "#94c93b",
          probability: 35,
          rottingDays: 10,
          requiredFields: [
            { field: "customFields.volumeEstimado", label: "Volume mensal estimado" },
          ],
          autoTasks: [
            { title: "Preparar tabela com desconto escalonado", dueInDays: 3 },
          ],
        },
        {
          name: "Aprovação jurídica",
          order: 3,
          color: "#ffcc01",
          probability: 60,
          rottingDays: 15,
          requiredFields: [],
          autoTasks: [
            { title: "Revisar minuta com jurídico", dueInDays: 5 },
          ],
        },
        {
          name: "Contrato assinado",
          order: 4,
          color: "#ff5e26",
          probability: 90,
          rottingDays: 5,
          requiredFields: [],
          autoTasks: [],
        },
        {
          name: "Ativo",
          order: 5,
          color: "#006938",
          isFinal: true,
          probability: 100,
          rottingDays: 999,
          requiredFields: [],
          autoTasks: [
            { title: "Agendar check-in mensal", dueInDays: 30 },
          ],
        },
        {
          name: "Inativo",
          order: 6,
          color: "#666666",
          isFinal: true,
          probability: 0,
          rottingDays: 999,
          requiredFields: [],
          autoTasks: [],
        },
      ],
    },
    {
      segment: "AVULSO",
      name: "Ingresso Avulso",
      color: "#ffaa00",
      position: 4,
      stages: [
        {
          name: "Novo lead",
          order: 1,
          color: "#36ccc7",
          probability: 20,
          rottingDays: 2,
          requiredFields: [
            { field: "name", label: "Nome" },
            { field: "phoneE164", label: "Telefone" },
          ],
          autoTasks: [
            { title: "Enviar link de compra + promo ativa", dueInDays: 0 },
          ],
        },
        {
          name: "Em conversa",
          order: 2,
          color: "#94c93b",
          probability: 40,
          rottingDays: 3,
          requiredFields: [
            { field: "customFields.dataVisita", label: "Data de visita pretendida" },
          ],
          autoTasks: [],
        },
        {
          name: "Convertido",
          order: 3,
          color: "#006938",
          isFinal: true,
          probability: 100,
          rottingDays: 999,
          requiredFields: [],
          autoTasks: [],
        },
        {
          name: "Perdido",
          order: 4,
          color: "#666666",
          isFinal: true,
          probability: 0,
          rottingDays: 999,
          requiredFields: [],
          autoTasks: [],
        },
      ],
    },
  ];

  for (const p of pipelines) {
    const pipeline = await prisma.pipeline.upsert({
      where: { tenantId_segment: { tenantId, segment: p.segment } },
      create: {
        tenantId,
        name: p.name,
        segment: p.segment,
        color: p.color,
        position: p.position,
        isDefault: true,
      },
      update: {
        name: p.name,
        color: p.color,
        position: p.position,
        isDefault: true,
      },
    });

    for (const s of p.stages) {
      await prisma.pipelineStage.upsert({
        where: {
          pipelineId_name: { pipelineId: pipeline.id, name: s.name },
        },
        create: {
          tenantId,
          pipelineId: pipeline.id,
          name: s.name,
          order: s.order,
          color: s.color,
          isFinal: s.isFinal ?? false,
          probability: s.probability,
          rottingDays: s.rottingDays,
          requiredFields: s.requiredFields as unknown as Prisma.InputJsonValue,
          autoTasks: s.autoTasks as unknown as Prisma.InputJsonValue,
        },
        update: {
          order: s.order,
          color: s.color,
          isFinal: s.isFinal ?? false,
          probability: s.probability,
          rottingDays: s.rottingDays,
          requiredFields: s.requiredFields as unknown as Prisma.InputJsonValue,
          autoTasks: s.autoTasks as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }
  console.log("[seed] 4 pipelines sincronizados");
}

async function upsertPolicy(prisma: PrismaClient, tenantId: string) {
  const version = "v1";
  const existing = await prisma.policyVersion.findUnique({
    where: { tenantId_version: { tenantId, version } },
  });
  if (existing) return;
  await prisma.policyVersion.create({
    data: {
      tenantId,
      version,
      body:
        "Política de privacidade v1 — placeholder. Substitua pela versão " +
        "revisada pelo DPO antes do go-live.",
    },
  });
}

main().catch((err) => {
  console.error("[seed] falhou:", err);
  process.exit(1);
});
