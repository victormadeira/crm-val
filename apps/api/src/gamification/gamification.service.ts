import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";

/**
 * Gamificação simples — pontos acumulados por evento do vendedor.
 * Regras (PRD Fase 4):
 *   +10  lead movido pra próximo stage
 *   +15  proposta enviada
 *   +25  proposta aberta pelo cliente
 *   +50  booking CONFIRMED
 *   +5   task concluída
 *   +20  deal ganho (status WON)
 *
 * Badges (baseados em totalizações mensais):
 *   "sprint_semanal" — 5+ leads movidos em 7d
 *   "caçador_propostas" — 10+ propostas enviadas no mês
 *   "fecha_negocio" — 3+ bookings CONFIRMED no mês
 */
@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async award(
    userId: string,
    reason: string,
    points: number,
    metadata?: Record<string, unknown>,
    badge?: string
  ): Promise<void> {
    await this.prisma.scoped.gamificationEvent.create({
      data: scopedData({
        userId,
        reason,
        points,
        badge: badge ?? null,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      }),
    });
  }

  async leaderboard(days = 30, limit = 20) {
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await this.prisma.scoped.gamificationEvent.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: since } },
      _sum: { points: true },
      _count: true,
      orderBy: { _sum: { points: "desc" } },
      take: limit,
    });

    const users = await this.prisma.scoped.user.findMany({
      where: { id: { in: rows.map((r) => r.userId) } },
      select: { id: true, name: true, email: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return rows.map((r) => ({
      userId: r.userId,
      name: byId.get(r.userId)?.name ?? null,
      email: byId.get(r.userId)?.email ?? null,
      points: r._sum.points ?? 0,
      eventCount: r._count,
    }));
  }

  async userStats(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);
    const [totals, recent, badges] = await Promise.all([
      this.prisma.scoped.gamificationEvent.aggregate({
        where: { userId, createdAt: { gte: since } },
        _sum: { points: true },
        _count: true,
      }),
      this.prisma.scoped.gamificationEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.scoped.gamificationEvent.findMany({
        where: { userId, badge: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { badge: true, createdAt: true, reason: true },
      }),
    ]);
    return {
      points: totals._sum.points ?? 0,
      eventCount: totals._count,
      recent,
      badges,
    };
  }
}
