import { Injectable } from "@nestjs/common";
import type { LeadOrigin, LeadStatus } from "@valparaiso/shared";
import { PrismaService } from "../prisma/prisma.service";

export interface DateRange {
  from?: Date;
  to?: Date;
}

type LeadCreatedFilter = { createdAt?: { gte?: Date; lt?: Date } };

/**
 * Relatórios do CRM — todos tenant-scoped pelo Prisma extension. As queries
 * evitam N+1 fazendo uma groupBy + um fetch de metadados (ex.: stage names).
 * Intervalos são [from, to) quando presentes; ausência = sem limite. Queries
 * que fazem sentido só com janela (visits, admin-overview) aplicam default
 * conservador (últimos 60 dias) quando o caller não passa nada.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------- helpers --------------------

  private rangeFilter(range: DateRange): LeadCreatedFilter {
    const createdAt: { gte?: Date; lt?: Date } = {};
    if (range.from) createdAt.gte = range.from;
    if (range.to) createdAt.lt = range.to;
    return Object.keys(createdAt).length ? { createdAt } : {};
  }

  private defaultWindow(days: number): DateRange {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    return { from, to };
  }

  // -------------------- public queries --------------------

  /**
   * Funnel — quantos leads há em cada estágio, mais um bucket "sem estágio".
   * Útil para dashboards de supervisor e atendente.
   */
  async funnel(range: DateRange): Promise<{
    stages: Array<{
      stageId: string | null;
      name: string;
      order: number;
      color: string | null;
      isFinal: boolean;
      count: number;
    }>;
    total: number;
  }> {
    const where = {
      archivedAt: null,
      anonymizedAt: null,
      ...this.rangeFilter(range),
    };

    const [grouped, stages, nullBucket] = await Promise.all([
      this.prisma.scoped.lead.groupBy({
        by: ["stageId"],
        where,
        _count: { _all: true },
      }),
      this.prisma.scoped.leadStage.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          order: true,
          color: true,
          isFinal: true,
        },
      }),
      this.prisma.scoped.lead.count({ where: { ...where, stageId: null } }),
    ]);

    const countByStage = new Map<string, number>();
    for (const row of grouped) {
      if (row.stageId) countByStage.set(row.stageId, row._count._all);
    }

    const stageRows = stages.map((s) => ({
      stageId: s.id,
      name: s.name,
      order: s.order,
      color: s.color,
      isFinal: s.isFinal,
      count: countByStage.get(s.id) ?? 0,
    }));

    const rows = [
      ...stageRows,
      {
        stageId: null,
        name: "Sem estágio",
        order: -1,
        color: null,
        isFinal: false,
        count: nullBucket,
      },
    ];

    const total = rows.reduce((acc, r) => acc + r.count, 0);
    return { stages: rows, total };
  }

  /**
   * Origin — contagem de leads por origem e por status, com taxa de
   * conversão (WON / total qualificado).
   */
  async origin(range: DateRange): Promise<{
    rows: Array<{
      origin: LeadOrigin;
      total: number;
      won: number;
      lost: number;
      active: number;
      conversionRate: number;
    }>;
    total: number;
  }> {
    const where = { anonymizedAt: null, ...this.rangeFilter(range) };

    const grouped = await this.prisma.scoped.lead.groupBy({
      by: ["origin", "status"],
      where,
      _count: { _all: true },
    });

    const byOrigin = new Map<
      LeadOrigin,
      { total: number; won: number; lost: number; active: number }
    >();
    for (const row of grouped) {
      const origin = row.origin as LeadOrigin;
      const bucket =
        byOrigin.get(origin) ?? { total: 0, won: 0, lost: 0, active: 0 };
      bucket.total += row._count._all;
      if (row.status === "WON") bucket.won += row._count._all;
      else if (row.status === "LOST" || row.status === "ARCHIVED")
        bucket.lost += row._count._all;
      else bucket.active += row._count._all;
      byOrigin.set(origin, bucket);
    }

    const rows = Array.from(byOrigin.entries())
      .map(([origin, b]) => ({
        origin,
        total: b.total,
        won: b.won,
        lost: b.lost,
        active: b.active,
        conversionRate:
          b.won + b.lost > 0 ? Number((b.won / (b.won + b.lost)).toFixed(4)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const total = rows.reduce((acc, r) => acc + r.total, 0);
    return { rows, total };
  }

  /**
   * My-queue — leads ativos atribuídos ao atendente autenticado, com
   * contagens por status e SLA (> 4h sem contato).
   */
  async myQueue(userId: string): Promise<{
    active: number;
    byStatus: Partial<Record<LeadStatus, number>>;
    slaBreaching: number;
    lastContactMedianMinutes: number | null;
  }> {
    const assignments = await this.prisma.scoped.leadAssignment.findMany({
      where: { assignedToId: userId, active: true },
      select: {
        lead: {
          select: {
            id: true,
            status: true,
            lastContactAt: true,
            createdAt: true,
            archivedAt: true,
            anonymizedAt: true,
          },
        },
      },
    });

    const leads = assignments
      .map((a) => a.lead)
      .filter((l) => !l.archivedAt && !l.anonymizedAt);

    const byStatus: Partial<Record<LeadStatus, number>> = {};
    const SLA_MS = 4 * 60 * 60 * 1000;
    const now = Date.now();
    let slaBreaching = 0;
    const gaps: number[] = [];

    for (const lead of leads) {
      byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
      const ref = lead.lastContactAt ?? lead.createdAt;
      const gap = now - ref.getTime();
      if (gap > SLA_MS) slaBreaching += 1;
      gaps.push(gap);
    }

    gaps.sort((a, b) => a - b);
    const median =
      gaps.length === 0
        ? null
        : Math.round(gaps[Math.floor(gaps.length / 2)] / 60000);

    return {
      active: leads.length,
      byStatus,
      slaBreaching,
      lastContactMedianMinutes: median,
    };
  }

  /**
   * Team — estatísticas por atendente, para supervisor acompanhar carga e
   * performance. Retorna um registro por atendente com carga ativa, leads
   * fechados na janela e tempo médio de resposta.
   */
  async team(range: DateRange): Promise<{
    rows: Array<{
      userId: string;
      name: string;
      email: string;
      active: number;
      wonInRange: number;
      lostInRange: number;
      capacity: number;
      utilizationPct: number;
    }>;
  }> {
    const profiles = await this.prisma.scoped.attendantProfile.findMany({
      select: {
        userId: true,
        maxConcurrent: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const activeGrouped = await this.prisma.scoped.leadAssignment.groupBy({
      by: ["assignedToId"],
      where: { active: true },
      _count: { _all: true },
    });
    const activeMap = new Map<string, number>();
    for (const r of activeGrouped) activeMap.set(r.assignedToId, r._count._all);

    const wonWhere = { status: "WON" as const, ...this.rangeFilter(range) };
    const lostWhere = { status: "LOST" as const, ...this.rangeFilter(range) };

    const [wonAssignments, lostAssignments] = await Promise.all([
      this.prisma.scoped.leadAssignment.findMany({
        where: { lead: wonWhere },
        select: { assignedToId: true },
      }),
      this.prisma.scoped.leadAssignment.findMany({
        where: { lead: lostWhere },
        select: { assignedToId: true },
      }),
    ]);

    const wonMap = new Map<string, number>();
    for (const r of wonAssignments) {
      wonMap.set(r.assignedToId, (wonMap.get(r.assignedToId) ?? 0) + 1);
    }
    const lostMap = new Map<string, number>();
    for (const r of lostAssignments) {
      lostMap.set(r.assignedToId, (lostMap.get(r.assignedToId) ?? 0) + 1);
    }

    const rows = profiles
      .map((p) => {
        const active = activeMap.get(p.userId) ?? 0;
        return {
          userId: p.userId,
          name: p.user.name,
          email: p.user.email,
          active,
          wonInRange: wonMap.get(p.userId) ?? 0,
          lostInRange: lostMap.get(p.userId) ?? 0,
          capacity: p.maxConcurrent,
          utilizationPct:
            p.maxConcurrent > 0
              ? Number(((active / p.maxConcurrent) * 100).toFixed(1))
              : 0,
        };
      })
      .sort((a, b) => b.active - a.active);

    return { rows };
  }

  /**
   * Marketing — conversão por origem × status, performance por campanha
   * (UTM) e submissões por landing page. Foco no funil de aquisição.
   */
  async marketing(range: DateRange): Promise<{
    byOrigin: Array<{
      origin: LeadOrigin;
      total: number;
      won: number;
      conversionRate: number;
    }>;
    byCampaign: Array<{
      campaign: string;
      total: number;
      won: number;
    }>;
    byLanding: Array<{
      pageId: string;
      title: string;
      slug: string;
      submissions: number;
    }>;
  }> {
    const leadWhere = { anonymizedAt: null, ...this.rangeFilter(range) };
    const submissionWhere = this.rangeFilter(range);

    const [originRows, campaignRows, landingGroup, landingPages] =
      await Promise.all([
        this.prisma.scoped.lead.groupBy({
          by: ["origin", "status"],
          where: leadWhere,
          _count: { _all: true },
        }),
        this.prisma.scoped.lead.groupBy({
          by: ["sourceCampaign", "status"],
          where: { ...leadWhere, sourceCampaign: { not: null } },
          _count: { _all: true },
        }),
        this.prisma.scoped.landingSubmission.groupBy({
          by: ["pageId"],
          where: submissionWhere,
          _count: { _all: true },
        }),
        this.prisma.scoped.landingPage.findMany({
          select: { id: true, title: true, slug: true },
        }),
      ]);

    // Origin agg
    const originMap = new Map<LeadOrigin, { total: number; won: number }>();
    for (const r of originRows) {
      const o = r.origin as LeadOrigin;
      const b = originMap.get(o) ?? { total: 0, won: 0 };
      b.total += r._count._all;
      if (r.status === "WON") b.won += r._count._all;
      originMap.set(o, b);
    }
    const byOrigin = Array.from(originMap.entries())
      .map(([origin, b]) => ({
        origin,
        total: b.total,
        won: b.won,
        conversionRate:
          b.total > 0 ? Number((b.won / b.total).toFixed(4)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Campaign agg
    const campaignMap = new Map<string, { total: number; won: number }>();
    for (const r of campaignRows) {
      if (!r.sourceCampaign) continue;
      const b = campaignMap.get(r.sourceCampaign) ?? { total: 0, won: 0 };
      b.total += r._count._all;
      if (r.status === "WON") b.won += r._count._all;
      campaignMap.set(r.sourceCampaign, b);
    }
    const byCampaign = Array.from(campaignMap.entries())
      .map(([campaign, b]) => ({ campaign, total: b.total, won: b.won }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 50);

    // Landing agg
    const pageMap = new Map(landingPages.map((p) => [p.id, p]));
    const byLanding = landingGroup
      .map((r) => {
        const page = pageMap.get(r.pageId);
        return {
          pageId: r.pageId,
          title: page?.title ?? "(página removida)",
          slug: page?.slug ?? "",
          submissions: r._count._all,
        };
      })
      .sort((a, b) => b.submissions - a.submissions);

    return { byOrigin, byCampaign, byLanding };
  }

  /**
   * Visits — distribuição de visitDate dos leads num horizonte de N dias
   * a partir de hoje. Útil para park manager planejar operação.
   */
  async visits(range: DateRange, horizonDays = 60): Promise<{
    days: Array<{ date: string; count: number; groupSizeSum: number }>;
    totalLeads: number;
    totalPeople: number;
  }> {
    const now = new Date();
    const from = range.from ?? now;
    const to =
      range.to ??
      new Date(from.getTime() + horizonDays * 24 * 60 * 60 * 1000);

    const leads = await this.prisma.scoped.lead.findMany({
      where: {
        visitDate: { gte: from, lt: to },
        anonymizedAt: null,
        archivedAt: null,
      },
      select: { visitDate: true, groupSize: true },
    });

    const dayMap = new Map<string, { count: number; groupSizeSum: number }>();
    for (const lead of leads) {
      if (!lead.visitDate) continue;
      const key = lead.visitDate.toISOString().slice(0, 10);
      const b = dayMap.get(key) ?? { count: 0, groupSizeSum: 0 };
      b.count += 1;
      b.groupSizeSum += lead.groupSize ?? 1;
      dayMap.set(key, b);
    }

    const days = Array.from(dayMap.entries())
      .map(([date, b]) => ({ date, count: b.count, groupSizeSum: b.groupSizeSum }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      days,
      totalLeads: leads.length,
      totalPeople: days.reduce((acc, d) => acc + d.groupSizeSum, 0),
    };
  }

  /**
   * Admin overview — cartão inicial do painel admin. Snapshot do período
   * (default 30 dias) com totais, funnel resumido, origem top 5 e carga
   * média por atendente.
   */
  async adminOverview(range: DateRange): Promise<{
    range: { from: string; to: string };
    totals: {
      leads: number;
      newLeads: number;
      won: number;
      lost: number;
      activeAssignments: number;
      attendants: number;
    };
    topOrigins: Array<{ origin: LeadOrigin; count: number }>;
    funnel: Array<{ name: string; count: number }>;
  }> {
    const window = range.from || range.to ? range : this.defaultWindow(30);
    const createdFilter = this.rangeFilter(window);

    const [
      totalLeads,
      newLeads,
      wonLeads,
      lostLeads,
      activeAssignments,
      attendants,
      originGroup,
      stageGroup,
      stages,
    ] = await Promise.all([
      this.prisma.scoped.lead.count({ where: { anonymizedAt: null } }),
      this.prisma.scoped.lead.count({
        where: { anonymizedAt: null, ...createdFilter },
      }),
      this.prisma.scoped.lead.count({
        where: { status: "WON", ...createdFilter },
      }),
      this.prisma.scoped.lead.count({
        where: { status: "LOST", ...createdFilter },
      }),
      this.prisma.scoped.leadAssignment.count({ where: { active: true } }),
      this.prisma.scoped.attendantProfile.count({
        where: { isAvailable: true },
      }),
      this.prisma.scoped.lead.groupBy({
        by: ["origin"],
        where: { anonymizedAt: null, ...createdFilter },
        _count: { _all: true },
      }),
      this.prisma.scoped.lead.groupBy({
        by: ["stageId"],
        where: { anonymizedAt: null, archivedAt: null },
        _count: { _all: true },
      }),
      this.prisma.scoped.leadStage.findMany({
        orderBy: { order: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    const topOrigins = originGroup
      .map((r) => ({ origin: r.origin as LeadOrigin, count: r._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const stageCountMap = new Map<string, number>();
    for (const r of stageGroup) {
      if (r.stageId) stageCountMap.set(r.stageId, r._count._all);
    }
    const funnel = stages.map((s) => ({
      name: s.name,
      count: stageCountMap.get(s.id) ?? 0,
    }));

    return {
      range: {
        from: (window.from ?? new Date(0)).toISOString(),
        to: (window.to ?? new Date()).toISOString(),
      },
      totals: {
        leads: totalLeads,
        newLeads,
        won: wonLeads,
        lost: lostLeads,
        activeAssignments,
        attendants,
      },
      topOrigins,
      funnel,
    };
  }
}
