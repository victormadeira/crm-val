import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { TenantContext } from "../prisma/tenant-context";

/**
 * Rotting = "deal parado". Calculado a partir de:
 *   diasInativo = (agora - lead.lastActivityAt) em dias
 *   stage.rottingDays = threshold p/ WARNING (2x p/ ROTTEN)
 *
 * Status:
 *   HEALTHY  — diasInativo < rottingDays
 *   WARNING  — rottingDays <= diasInativo < 2*rottingDays
 *   ROTTEN   — diasInativo >= 2*rottingDays
 *
 * Regras:
 *   - Leads em stage FINAL (WON/LOST/ARCHIVED-like) são sempre HEALTHY.
 *   - Se lastActivityAt é null, usa createdAt como base.
 *
 * markActivity() é chamado por TODO evento que conta como atividade: inbound
 * msg, outbound msg, task concluída, campo editado, proposta aberta, stage
 * change. Reseta rottingStatus pra HEALTHY.
 *
 * recomputeAll() roda a cada hora via cron (AutomationCronService gerencia).
 * Para tenant em uso, essa query é barata porque tem index em lastActivityAt.
 */
@Injectable()
export class RottingService {
  private readonly logger = new Logger(RottingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Marca atividade em um lead + reseta rotting pra HEALTHY. */
  async markActivity(leadId: string): Promise<void> {
    const now = new Date();
    await this.prisma.scoped.lead.update({
      where: { id: leadId },
      data: {
        lastActivityAt: now,
        lastContactAt: now,
        rottingStatus: "HEALTHY",
      },
    });
  }

  /**
   * Recalcula rottingStatus p/ todos os leads ATIVOS cross-tenant. Chamado
   * por um cron horário. Bulk update via raw SQL p/ evitar N queries.
   */
  async recomputeAll(): Promise<{ healthy: number; warning: number; rotten: number }> {
    const stats = { healthy: 0, warning: 0, rotten: 0 };

    await TenantContext.runOutsideTenant(async () => {
      // HEALTHY — inclui leads sem stage ou em stage final
      const r1 = await this.prisma.$executeRaw(Prisma.sql`
        UPDATE "Lead" l
        SET "rottingStatus" = 'HEALTHY'
        WHERE l."anonymizedAt" IS NULL
          AND (
            l."stageId" IS NULL
            OR EXISTS (
              SELECT 1 FROM "PipelineStage" s
              WHERE s."id" = l."stageId" AND s."isFinal" = TRUE
            )
            OR EXISTS (
              SELECT 1 FROM "PipelineStage" s
              WHERE s."id" = l."stageId"
                AND EXTRACT(EPOCH FROM (NOW() - COALESCE(l."lastActivityAt", l."createdAt"))) / 86400 < s."rottingDays"
            )
          )
          AND l."rottingStatus" <> 'HEALTHY'
      `);
      stats.healthy = Number(r1);

      // WARNING — entre rottingDays e 2x rottingDays
      const r2 = await this.prisma.$executeRaw(Prisma.sql`
        UPDATE "Lead" l
        SET "rottingStatus" = 'WARNING'
        FROM "PipelineStage" s
        WHERE s."id" = l."stageId"
          AND s."isFinal" = FALSE
          AND l."anonymizedAt" IS NULL
          AND EXTRACT(EPOCH FROM (NOW() - COALESCE(l."lastActivityAt", l."createdAt"))) / 86400 >= s."rottingDays"
          AND EXTRACT(EPOCH FROM (NOW() - COALESCE(l."lastActivityAt", l."createdAt"))) / 86400 < s."rottingDays" * 2
          AND l."rottingStatus" <> 'WARNING'
      `);
      stats.warning = Number(r2);

      // ROTTEN — >= 2x rottingDays
      const r3 = await this.prisma.$executeRaw(Prisma.sql`
        UPDATE "Lead" l
        SET "rottingStatus" = 'ROTTEN'
        FROM "PipelineStage" s
        WHERE s."id" = l."stageId"
          AND s."isFinal" = FALSE
          AND l."anonymizedAt" IS NULL
          AND EXTRACT(EPOCH FROM (NOW() - COALESCE(l."lastActivityAt", l."createdAt"))) / 86400 >= s."rottingDays" * 2
          AND l."rottingStatus" <> 'ROTTEN'
      `);
      stats.rotten = Number(r3);
    });

    this.logger.log(
      `rotting recompute — healthy=${stats.healthy} warning=${stats.warning} rotten=${stats.rotten}`
    );
    return stats;
  }
}
