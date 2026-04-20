import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";
import { TenantContext } from "./tenant-context";
import { applyTenantScope } from "./tenant-scope";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Inject(ENV_TOKEN) env: Env) {
    super({
      datasources: { db: { url: env.DATABASE_URL } },
      log:
        env.NODE_ENV === "production"
          ? [{ emit: "event", level: "warn" }, { emit: "event", level: "error" }]
          : [
              { emit: "event", level: "query" },
              { emit: "event", level: "warn" },
              { emit: "event", level: "error" },
            ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Prisma conectado");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Cliente estendido tenant-scoped. Use SEMPRE este em services de domínio.
   * Ele intercepta toda operação em models tenant-scoped e:
   *   - em writes com `data`: injeta `tenantId` (ou valida se já vier)
   *   - em reads/writes com `where`: exige `tenantId` e injeta automaticamente
   *
   * Quando TenantContext.crossTenant === true, bypassa a injeção (apenas pra
   * jobs sistêmicos explicitamente marcados).
   */
  readonly scoped = this.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const decision = applyTenantScope(
            model,
            operation,
            args,
            TenantContext.get()
          );
          if (decision.kind === "bypass") return query(args);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return query(decision.args as any);
        },
      },
    },
  });

  /**
   * Acesso crú (unscoped) — apenas para bootstrap (criar Tenant, rodar
   * migrações programáticas) ou para o próprio módulo de admin. Toda call
   * aqui deve estar dentro de um `TenantContext.runOutsideTenant`.
   */
  get raw(): PrismaClient {
    return this;
  }

  /** Utilitário pra transações preservando o contexto de tenant. */
  async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.$transaction(fn);
  }
}

export type ScopedPrisma = PrismaService["scoped"];
