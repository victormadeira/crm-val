import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { HandoffInput } from "@valparaiso/shared";
import { AuditService } from "../audit/audit.service";
import { AutomationBus } from "../automation/automation.bus";
import { LeadScoringService } from "../lead-scoring/lead-scoring.service";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import type { AuthContext } from "../auth/auth.types";
import { normalizeBrPhone } from "../leads/phone";

/**
 * Handoff IA → humano. Chamado pelo agente (bot WhatsApp + Claude) quando
 * detecta critérios reais de qualificação. Cria (ou reutiliza) lead no
 * pipeline certo, marca histórico de handoff, injeta customFields
 * vindos da conversa. Idempotente por phone dentro do tenant.
 */
@Injectable()
export class HandoffService {
  private readonly logger = new Logger(HandoffService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly bus: AutomationBus,
    private readonly scoring: LeadScoringService
  ) {}

  async receive(input: HandoffInput, auth: AuthContext) {
    const phoneE164 = normalizeBrPhone(input.phone);

    const pipeline = await this.prisma.scoped.pipeline.findFirst({
      where: { segment: input.segment, isDefault: true },
      select: {
        id: true,
        stages: {
          orderBy: { order: "asc" },
          select: { id: true, name: true },
        },
      },
    });
    if (!pipeline) {
      this.logger.warn(
        `Handoff sem pipeline default para segment=${input.segment} tenant=${auth.tenantId}`
      );
    }

    const firstStageId = pipeline?.stages[0]?.id ?? null;

    const merged = {
      ...(input.customFields ?? {}),
      numParticipantes: input.numParticipants,
      dataPretendida: input.eventDate?.toISOString() ?? null,
      groupType: input.groupType ?? null,
      budgetRange: input.budgetRange ?? null,
      handoffAgentSessionId: input.agentSessionId,
    };

    const existing = await this.prisma.scoped.lead.findFirst({
      where: { phoneE164 },
      select: { id: true, stageId: true },
    });

    let leadId: string;
    let created = false;
    if (existing) {
      leadId = existing.id;
      await this.prisma.scoped.lead.update({
        where: { id: leadId },
        data: {
          segment: input.segment,
          pipelineId: pipeline?.id ?? undefined,
          customFields: merged as Prisma.InputJsonValue,
          lastActivityAt: new Date(),
          rottingStatus: "HEALTHY",
        },
      });
    } else {
      const lead = await this.prisma.scoped.lead.create({
        data: scopedData({
          name: input.clientName,
          phoneE164,
          origin: "WHATSAPP",
          segment: input.segment,
          pipelineId: pipeline?.id ?? null,
          stageId: firstStageId,
          customFields: merged as Prisma.InputJsonValue,
          lastActivityAt: new Date(),
        }),
        select: { id: true },
      });
      leadId = lead.id;
      created = true;
    }

    await this.prisma.scoped.leadNote.create({
      data: {
        leadId,
        authorId: auth.userId,
        body: `[HANDOFF IA] Sessão ${input.agentSessionId}\n\n${input.chatSummary}`,
      },
    });

    await this.prisma.scoped.leadEvent.create({
      data: {
        leadId,
        kind: created ? "CREATED" : "FIELD_UPDATED",
        actorId: auth.userId,
        payload: {
          source: "ai_handoff",
          agentSessionId: input.agentSessionId,
          segment: input.segment,
        } as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      action: "lead.handoff",
      entity: "Lead",
      entityId: leadId,
      metadata: {
        segment: input.segment,
        agentSessionId: input.agentSessionId,
        created,
      },
    });

    await this.scoring.recompute(leadId);

    this.bus.publish({
      kind: created ? "LEAD_CREATED" : "TAG_APPLIED",
      tenantId: auth.tenantId,
      leadId,
      origin: "WHATSAPP",
    });

    return { leadId, created };
  }
}
