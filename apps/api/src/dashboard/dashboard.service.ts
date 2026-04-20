import { Injectable } from "@nestjs/common";
import type { DashboardQuery } from "@valparaiso/shared";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Dashboard executivo — agrega métricas-chave pros admins/supervisores.
 * Tenant-scoped (vem via TenantContext). Foca em velocidade (Redis só
 * após feedback real se virar gargalo).
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(q: DashboardQuery) {
    const now = new Date();
    const since = new Date(now.getTime() - q.days * 86_400_000);

    const [
      leadsByRotting,
      leadsBySegment,
      leadsByStage,
      leadsCreated,
      tasksSummary,
      proposalsSummary,
      bookingsSummary,
      topRules,
    ] = await Promise.all([
      this.prisma.scoped.lead.groupBy({
        by: ["rottingStatus"],
        where: { anonymizedAt: null },
        _count: true,
      }),
      this.prisma.scoped.lead.groupBy({
        by: ["segment"],
        where: { anonymizedAt: null },
        _count: true,
      }),
      this.prisma.scoped.lead.groupBy({
        by: ["stageId"],
        where: { anonymizedAt: null, stageId: { not: null } },
        _count: true,
      }),
      this.prisma.scoped.lead.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.scoped.task.groupBy({
        by: ["status"],
        _count: true,
      }),
      this.prisma.scoped.proposal.groupBy({
        by: ["status"],
        _count: true,
        _sum: { valueCents: true },
      }),
      this.prisma.scoped.booking.groupBy({
        by: ["status"],
        _count: true,
        _sum: { numParticipants: true },
        where: { eventDate: { gte: now } },
      }),
      this.topLeads(10),
    ]);

    // Forecast ponderado: soma valueCents das propostas SENT/OPENED ponderado
    // pela probability do stage atual do lead.
    const forecast = await this.forecast();

    return {
      window: { days: q.days, since: since.toISOString() },
      leadsByRotting: leadsByRotting.map((r) => ({
        rottingStatus: r.rottingStatus,
        count: r._count,
      })),
      leadsBySegment: leadsBySegment.map((r) => ({
        segment: r.segment,
        count: r._count,
      })),
      leadsByStage: leadsByStage.map((r) => ({
        stageId: r.stageId,
        count: r._count,
      })),
      leadsCreatedInWindow: leadsCreated,
      tasks: tasksSummary.map((r) => ({ status: r.status, count: r._count })),
      proposals: proposalsSummary.map((r) => ({
        status: r.status,
        count: r._count,
        valueCents: r._sum.valueCents ?? 0,
      })),
      bookings: bookingsSummary.map((r) => ({
        status: r.status,
        count: r._count,
        numParticipants: r._sum.numParticipants ?? 0,
      })),
      forecast,
      topLeads: topRules,
    };
  }

  private async forecast(): Promise<{
    valueCents: number;
    leadCount: number;
  }> {
    const rows = await this.prisma.scoped.lead.findMany({
      where: {
        anonymizedAt: null,
        status: { in: ["NEW", "QUALIFIED"] },
        stageId: { not: null },
      },
      select: {
        id: true,
        stage: { select: { probability: true } },
        proposals: {
          where: { status: { in: ["SENT", "OPENED", "ACCEPTED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { valueCents: true },
        },
      },
    });

    let valueCents = 0;
    let leadCount = 0;
    for (const r of rows) {
      const p = (r.stage?.probability ?? 0) / 100;
      const value = r.proposals[0]?.valueCents ?? 0;
      if (value > 0) {
        valueCents += Math.round(value * p);
        leadCount += 1;
      }
    }
    return { valueCents, leadCount };
  }

  private async topLeads(limit: number) {
    return this.prisma.scoped.lead.findMany({
      where: { anonymizedAt: null, status: { in: ["NEW", "QUALIFIED"] } },
      orderBy: [{ aiScore: "desc" }, { lastActivityAt: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        segment: true,
        aiScore: true,
        rottingStatus: true,
        blueprintCompletion: true,
        stage: { select: { name: true } },
      },
    });
  }
}
