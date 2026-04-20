import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { TenantContext } from "../prisma/tenant-context";

/**
 * AuditLog é append-only por contrato (nenhum UPDATE/DELETE permitido
 * via código). Este service é o ÚNICO ponto de inserção. Todos os
 * módulos críticos (auth, leads, whatsapp, lgpd) chamam daqui.
 *
 * `action` segue convenção `<entidade>.<verbo>` em minúsculas:
 *   lead.create | lead.update | lead.anonymize | wa.message_sent |
 *   user.login | privacy.request_opened | etc.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const ctx = TenantContext.require();
    await this.prisma.scoped.auditLog.create({
      data: scopedData({
        actorId: ctx.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? {}) as never,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      }),
    });
  }
}
