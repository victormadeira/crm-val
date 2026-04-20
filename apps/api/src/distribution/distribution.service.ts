import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AssignmentReason } from "@valparaiso/shared";
import { AuditService } from "../audit/audit.service";
import type { AuthContext } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";

/**
 * Distribuição de leads. Prioriza AI, com fallback round-robin.
 *
 * Estratégia:
 *   1. Busca atendentes ativos disponíveis (isAvailable && User.active).
 *   2. Filtra por capacidade livre (assignments ativos < maxConcurrent).
 *   3. Rankeia:
 *        a) Se o lead tem skillsTag / productInterest casando com
 *           AttendantProfile.skillsTags → boost.
 *        b) Ordem final: menor carga ativa, depois lastActiveAt ASC
 *           (quem não atende há mais tempo entra primeiro).
 *   4. Desempate: round-robin determinístico por ordem alfabética do id.
 *
 * Override manual (supervisor) tem precedência total — criamos
 * LeadAssignment com reason=MANUAL_SUPERVISOR e encerramos o anterior.
 */
@Injectable()
export class DistributionService {
  private readonly logger = new Logger(DistributionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async autoAssign(
    leadId: string,
    opts: { reason?: AssignmentReason; aiScore?: number } = {}
  ): Promise<{ assignmentId: string; assignedToId: string } | null> {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        anonymizedAt: true,
        productInterest: true,
        aiScore: true,
      },
    });
    if (!lead) throw new NotFoundException("Lead não encontrado");
    if (lead.anonymizedAt) return null;

    // Já tem assignment ativo? Não dobra.
    const existing = await this.prisma.scoped.leadAssignment.findFirst({
      where: { leadId, active: true },
      select: { id: true },
    });
    if (existing) return null;

    const candidate = await this.pickCandidate({
      productInterest: lead.productInterest ?? null,
    });
    if (!candidate) {
      this.logger.warn(`autoAssign: sem atendentes disponíveis lead=${leadId}`);
      return null;
    }

    const scoreAtTime = opts.aiScore ?? lead.aiScore ?? null;
    const assignment = await this.prisma.scoped.leadAssignment.create({
      data: scopedData({
        leadId,
        assignedToId: candidate.userId,
        reason: opts.reason ?? "AI_SUGGESTION",
        aiScoreAtTime: scoreAtTime,
        active: true,
      }),
      select: { id: true },
    });

    await this.prisma.scoped.leadEvent.create({
      data: {
        leadId,
        kind: "ASSIGNED",
        payload: {
          assignmentId: assignment.id,
          assignedToId: candidate.userId,
          reason: opts.reason ?? "AI_SUGGESTION",
        } as Prisma.InputJsonValue,
      },
    });

    // Toca o lastActiveAt pra o round-robin avançar.
    await this.prisma.scoped.attendantProfile.update({
      where: { userId: candidate.userId },
      data: { lastActiveAt: new Date() },
    });

    await this.audit.record({
      action: "lead.assign_auto",
      entity: "Lead",
      entityId: leadId,
      metadata: {
        assignedToId: candidate.userId,
        reason: opts.reason ?? "AI_SUGGESTION",
      },
    });

    return { assignmentId: assignment.id, assignedToId: candidate.userId };
  }

  async manualAssign(
    leadId: string,
    assignedToId: string,
    auth: AuthContext,
    reason: AssignmentReason = "MANUAL_SUPERVISOR"
  ): Promise<{ assignmentId: string }> {
    const [lead, target] = await Promise.all([
      this.prisma.scoped.lead.findUnique({
        where: { id: leadId },
        select: { id: true, anonymizedAt: true },
      }),
      this.prisma.scoped.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, active: true, role: true },
      }),
    ]);
    if (!lead) throw new NotFoundException("Lead não encontrado");
    if (lead.anonymizedAt)
      throw new BadRequestException("Lead anonimizado não aceita assignment");
    if (!target || !target.active) {
      throw new BadRequestException("Usuário destino inválido ou inativo");
    }

    const assignmentId = await this.prisma.scoped.$transaction(async (tx) => {
      await tx.leadAssignment.updateMany({
        where: { leadId, active: true },
        data: { active: false, endedAt: new Date() },
      });
      const created = await tx.leadAssignment.create({
        data: scopedData({
          leadId,
          assignedToId,
          assignedById: auth.userId,
          reason,
          active: true,
        }),
        select: { id: true },
      });
      await tx.leadEvent.create({
        data: {
          leadId,
          kind: "ASSIGNED",
          actorId: auth.userId,
          payload: {
            assignmentId: created.id,
            assignedToId,
            reason,
          } as Prisma.InputJsonValue,
        },
      });
      return created.id;
    });

    await this.audit.record({
      action: "lead.assign_manual",
      entity: "Lead",
      entityId: leadId,
      metadata: { assignedToId, reason },
    });
    return { assignmentId };
  }

  async unassign(leadId: string, auth: AuthContext): Promise<void> {
    const updated = await this.prisma.scoped.leadAssignment.updateMany({
      where: { leadId, active: true },
      data: { active: false, endedAt: new Date() },
    });
    if (updated.count > 0) {
      await this.prisma.scoped.leadEvent.create({
        data: {
          leadId,
          kind: "UNASSIGNED",
          actorId: auth.userId,
          payload: {} as Prisma.InputJsonValue,
        },
      });
      await this.audit.record({
        action: "lead.unassign",
        entity: "Lead",
        entityId: leadId,
      });
    }
  }

  private async pickCandidate(filters: {
    productInterest: string | null;
  }): Promise<{ userId: string } | null> {
    // Materializamos candidatos com carga em uma única query.
    // É aceitável em MVP — trocar por SQL raw quando passar de ~500 atendentes.
    const profiles = await this.prisma.scoped.attendantProfile.findMany({
      where: {
        isAvailable: true,
        user: { active: true },
      },
      select: {
        userId: true,
        maxConcurrent: true,
        skillsTags: true,
        lastActiveAt: true,
      },
    });
    if (profiles.length === 0) return null;

    const loads = await this.prisma.scoped.leadAssignment.groupBy({
      by: ["assignedToId"],
      where: {
        active: true,
        assignedToId: { in: profiles.map((p) => p.userId) },
      },
      _count: { _all: true },
    });
    const loadMap = new Map<string, number>(
      loads.map((l) => [l.assignedToId, l._count._all])
    );

    const enriched = profiles
      .map((p) => ({
        userId: p.userId,
        capacity: p.maxConcurrent,
        load: loadMap.get(p.userId) ?? 0,
        skillsTags: p.skillsTags,
        lastActiveAt: p.lastActiveAt?.getTime() ?? 0,
      }))
      .filter((p) => p.load < p.capacity);

    if (enriched.length === 0) return null;

    const skillMatch = (tags: string[]): number => {
      if (!filters.productInterest) return 0;
      return tags.some(
        (t) => t.toUpperCase() === filters.productInterest!.toUpperCase()
      )
        ? 1
        : 0;
    };

    enriched.sort((a, b) => {
      // 1) Skill match desc
      const s = skillMatch(b.skillsTags) - skillMatch(a.skillsTags);
      if (s !== 0) return s;
      // 2) Carga asc
      if (a.load !== b.load) return a.load - b.load;
      // 3) Quem atendeu há mais tempo
      if (a.lastActiveAt !== b.lastActiveAt)
        return a.lastActiveAt - b.lastActiveAt;
      // 4) id asc (determinismo)
      return a.userId.localeCompare(b.userId);
    });

    return { userId: enriched[0].userId };
  }
}
