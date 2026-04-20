import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Contexto por request — carrega o tenantId e (quando aplicável) o userId
 * autenticado. É preenchido pelo TenantGuard e consumido pelo PrismaService
 * para injetar `tenantId` automaticamente em queries create/find/update.
 *
 * Fora de requests com contexto, `get()` retorna undefined e qualquer
 * query tenant-scoped que tente rodar falhará (fail-closed). Admin jobs
 * (migração, cron cross-tenant) precisam chamar `runOutsideTenant`.
 */
export interface TenantContextData {
  tenantId: string;
  userId?: string;
  /**
   * Flag explícita para operações sistêmicas legítimas fora do escopo de
   * tenant (ex: listar tenants, job de anonimização global). Quando true,
   * o middleware do Prisma libera a query. NUNCA setar por input externo.
   */
  crossTenant?: boolean;
}

const storage = new AsyncLocalStorage<TenantContextData>();

export const TenantContext = {
  run<T>(data: TenantContextData, fn: () => T): T {
    return storage.run(data, fn);
  },

  runOutsideTenant<T>(fn: () => T): T {
    return storage.run({ tenantId: "__system__", crossTenant: true }, fn);
  },

  get(): TenantContextData | undefined {
    return storage.getStore();
  },

  require(): TenantContextData {
    const ctx = storage.getStore();
    if (!ctx) {
      throw new Error(
        "TenantContext ausente — request não passou pelo TenantGuard ou job não declarou runOutsideTenant"
      );
    }
    return ctx;
  },
};
