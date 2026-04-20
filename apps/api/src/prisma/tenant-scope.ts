import type { TenantContextData } from "./tenant-context";

/**
 * Models que carregam `tenantId` direto na tabela. Qualquer model nessa
 * lista é tenant-scoped automaticamente. Models de junção (LeadTagOnLead,
 * LeadNote, LeadEvent, etc.) herdam o escopo via chave estrangeira.
 */
export const TENANT_SCOPED_MODELS = new Set<string>([
  "User",
  "Pipeline",
  "PipelineStage",
  "LeadTag",
  "Lead",
  "LeadImport",
  "Task",
  "Booking",
  "Proposal",
  "GamificationEvent",
  "AttendantProfile",
  "LeadAssignment",
  "WaAccount",
  "WaPhoneNumber",
  "WaConversation",
  "WaMessage",
  "WaTemplate",
  "AutomationFlow",
  "AutomationRun",
  "LandingPage",
  "LandingSubmission",
  "PolicyVersion",
  "PrivacyRequest",
  "AuditLog",
  "PushToken",
]);

export const WRITE_WITH_DATA = new Set<string>([
  "create",
  "createMany",
  "createManyAndReturn",
  "upsert",
]);

export const READ_WRITE_WITH_WHERE = new Set<string>([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "updateManyAndReturn",
  "update",
  "delete",
  "deleteMany",
  "upsert",
]);

export type TenantScopeDecision =
  | { kind: "bypass" }
  | { kind: "apply"; args: Record<string, unknown> };

/**
 * Núcleo da lógica de tenant-scope. Puro — sem dependência de Prisma. É
 * testado unitariamente e usado pelo PrismaService via $extends.
 *
 * Regras:
 *  - Se o model não é tenant-scoped → bypass.
 *  - Se ctx ausente → throw (fail-closed).
 *  - Se ctx.crossTenant → bypass (jobs sistêmicos marcados).
 *  - Em writes com data: injeta tenantId; se já vier divergente, throw.
 *  - Em reads/writes com where: injeta tenantId; se já vier divergente, throw.
 *  - Em upsert: cobre create, update (via where) e update-data.
 */
export function applyTenantScope(
  model: string | undefined,
  operation: string,
  args: unknown,
  ctx: TenantContextData | undefined
): TenantScopeDecision {
  if (!model || !TENANT_SCOPED_MODELS.has(model)) {
    return { kind: "bypass" };
  }
  if (!ctx) {
    throw new Error(
      `Query tenant-scoped em ${model}.${operation} sem TenantContext`
    );
  }
  if (ctx.crossTenant) {
    return { kind: "bypass" };
  }
  const tenantId = ctx.tenantId;
  const a = (args ?? {}) as Record<string, unknown>;

  if (WRITE_WITH_DATA.has(operation)) {
    const data = a.data;
    if (Array.isArray(data)) {
      a.data = data.map((row) => {
        const r = (row ?? {}) as Record<string, unknown>;
        if (r.tenantId !== undefined && r.tenantId !== tenantId) {
          throw new Error(
            `Tentativa de gravar ${model} com tenantId ${String(r.tenantId)} dentro do contexto ${tenantId}`
          );
        }
        return { tenantId, ...r };
      });
    } else if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (d.tenantId !== undefined && d.tenantId !== tenantId) {
        throw new Error(
          `Tentativa de gravar ${model} com tenantId ${String(d.tenantId)} dentro do contexto ${tenantId}`
        );
      }
      d.tenantId = tenantId;
    }
  }

  if (READ_WRITE_WITH_WHERE.has(operation)) {
    const where = (a.where ?? {}) as Record<string, unknown>;
    if (where.tenantId !== undefined && where.tenantId !== tenantId) {
      throw new Error(
        `Query ${model}.${operation} com where.tenantId ${String(where.tenantId)} dentro do contexto ${tenantId}`
      );
    }
    where.tenantId = tenantId;
    a.where = where;
  }

  if (operation === "upsert" && a.create && typeof a.create === "object") {
    const c = a.create as Record<string, unknown>;
    if (c.tenantId !== undefined && c.tenantId !== tenantId) {
      throw new Error(
        `Upsert em ${model} com create.tenantId ${String(c.tenantId)} divergente do contexto ${tenantId}`
      );
    }
    c.tenantId = tenantId;
  }

  return { kind: "apply", args: a };
}
