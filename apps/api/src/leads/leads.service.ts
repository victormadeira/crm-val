import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  CreateLeadInput,
  MoveLeadInput,
  UpdateLeadInput,
  LeadListQuery,
} from "@valparaiso/shared";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { AutomationBus } from "../automation/automation.bus";
import { LeadScoringService } from "../lead-scoring/lead-scoring.service";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { RottingService } from "../rotting/rotting.service";
import type { AuthContext } from "../auth/auth.types";
import { normalizeBrPhone } from "./phone";
import {
  blueprintCompletion,
  findMissingFields,
  type RequiredFieldSpec,
} from "./blueprint";

interface AutoTaskSpec {
  title: string;
  dueInDays: number;
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly bus: AutomationBus,
    private readonly rotting: RottingService,
    private readonly scoring: LeadScoringService
  ) {}

  async create(
    input: CreateLeadInput,
    auth: AuthContext
  ): Promise<{ id: string }> {
    const phoneE164 = normalizeBrPhone(input.phoneE164);

    // Se veio pipelineId, validar que pertence ao tenant. Se não veio mas
    // veio segment, buscar pipeline default daquele segment.
    let pipelineId = input.pipelineId ?? null;
    let segment = input.segment ?? null;
    if (!pipelineId && segment) {
      const p = await this.prisma.scoped.pipeline.findFirst({
        where: { segment, isDefault: true },
        select: { id: true },
      });
      pipelineId = p?.id ?? null;
    }
    if (pipelineId && !segment) {
      const p = await this.prisma.scoped.pipeline.findUnique({
        where: { id: pipelineId },
        select: { segment: true },
      });
      segment = p?.segment ?? null;
    }

    // Se não veio stageId e há pipeline, usa o primeiro estágio
    let stageId = input.stageId ?? null;
    if (pipelineId && !stageId) {
      const first = await this.prisma.scoped.pipelineStage.findFirst({
        where: { pipelineId },
        orderBy: { order: "asc" },
        select: { id: true },
      });
      stageId = first?.id ?? null;
    }

    try {
      const result = await this.prisma.scoped.$transaction(async (tx) => {
        const lead = await tx.lead.create({
          data: scopedData({
            name: input.name,
            phoneE164,
            origin: input.origin,
            email: input.email ?? null,
            visitDate: input.visitDate ?? null,
            groupSize: input.groupSize ?? null,
            productInterest: input.productInterest ?? null,
            cityGuess: input.cityGuess ?? null,
            pipelineId,
            segment,
            stageId,
            customFields: (input.customFields ?? {}) as Prisma.InputJsonValue,
            sourceCampaign: input.sourceCampaign ?? null,
            sourceAdset: input.sourceAdset ?? null,
            sourceAd: input.sourceAd ?? null,
            sourceFbclid: input.sourceFbclid ?? null,
            sourceGclid: input.sourceGclid ?? null,
            lastActivityAt: new Date(),
          }),
          select: { id: true },
        });

        if (input.tagIds && input.tagIds.length > 0) {
          await tx.leadTagOnLead.createMany({
            data: input.tagIds.map((tagId) => ({ leadId: lead.id, tagId })),
            skipDuplicates: true,
          });
        }

        if (input.consent) {
          await tx.leadConsent.create({
            data: {
              leadId: lead.id,
              purpose: input.consent.purpose,
              granted: input.consent.granted,
              channel: input.consent.channel,
              policyVersionId: input.consent.policyVersionId,
              evidence: (input.consent.evidence ??
                {}) as Prisma.InputJsonValue,
            },
          });
          await tx.leadEvent.create({
            data: {
              leadId: lead.id,
              kind: input.consent.granted ? "CONSENT_GIVEN" : "CONSENT_REVOKED",
              actorId: auth.userId,
              payload: {
                purpose: input.consent.purpose,
                channel: input.consent.channel,
              } as Prisma.InputJsonValue,
            },
          });
        }

        await tx.leadEvent.create({
          data: {
            leadId: lead.id,
            kind: "CREATED",
            actorId: auth.userId,
            payload: {
              origin: input.origin,
              segment,
              pipelineId,
              productInterest: input.productInterest ?? null,
            } as Prisma.InputJsonValue,
          },
        });

        return lead;
      });

      await this.audit.record({
        action: "lead.create",
        entity: "Lead",
        entityId: result.id,
        metadata: { origin: input.origin, segment, pipelineId },
      });

      // Se entrou direto num stage com auto_tasks, criar as tasks agora.
      if (stageId) {
        await this.createAutoTasksForStage(result.id, stageId, "stage_entry");
        await this.recomputeBlueprint(result.id, stageId);
      }

      await this.scoring.recompute(result.id);

      this.bus.publish({
        kind: "LEAD_CREATED",
        tenantId: auth.tenantId,
        leadId: result.id,
        origin: input.origin,
      });

      for (const tagId of input.tagIds ?? []) {
        this.bus.publish({
          kind: "TAG_APPLIED",
          tenantId: auth.tenantId,
          leadId: result.id,
          tagId,
        });
      }

      return result;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(
          "Já existe lead com este telefone neste tenant"
        );
      }
      throw e;
    }
  }

  async list(q: LeadListQuery) {
    const where: Prisma.LeadWhereInput = {
      anonymizedAt: null,
      ...(q.status && { status: q.status }),
      ...(q.pipelineId && { pipelineId: q.pipelineId }),
      ...(q.segment && { segment: q.segment }),
      ...(q.stageId && { stageId: q.stageId }),
      ...(q.rottingStatus && { rottingStatus: q.rottingStatus }),
      ...(q.origin && { origin: q.origin }),
      ...(q.minScore !== undefined && { aiScore: { gte: q.minScore } }),
      ...(q.search && {
        OR: [
          { name: { contains: q.search, mode: "insensitive" } },
          { email: { contains: q.search, mode: "insensitive" } },
          { phoneE164: { contains: q.search } },
        ],
      }),
      ...(q.tagId && { tags: { some: { tagId: q.tagId } } }),
      ...(q.ownerId && {
        assignments: { some: { assignedToId: q.ownerId, active: true } },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.scoped.lead.findMany({
        where,
        orderBy: [{ aiScore: "desc" }, { createdAt: "desc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          id: true,
          name: true,
          phoneE164: true,
          email: true,
          origin: true,
          status: true,
          pipelineId: true,
          segment: true,
          stageId: true,
          rottingStatus: true,
          blueprintCompletion: true,
          aiScore: true,
          lastActivityAt: true,
          createdAt: true,
          lastContactAt: true,
        },
      }),
      this.prisma.scoped.lead.count({ where }),
    ]);

    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async getById(id: string) {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id },
      include: {
        pipeline: true,
        stage: true,
        tags: { include: { tag: true } },
        assignments: {
          where: { active: true },
          include: { assignedTo: { select: { id: true, name: true } } },
        },
        consents: { orderBy: { givenAt: "desc" }, take: 20 },
        notes: { orderBy: { createdAt: "desc" }, take: 50 },
        events: { orderBy: { createdAt: "desc" }, take: 100 },
        tasks: {
          orderBy: [{ status: "asc" }, { dueAt: "asc" }],
          take: 50,
        },
        proposals: { orderBy: { createdAt: "desc" }, take: 20 },
        bookings: { orderBy: { eventDate: "asc" }, take: 20 },
      },
    });
    if (!lead) throw new NotFoundException("Lead não encontrado");
    if (lead.anonymizedAt) {
      throw new NotFoundException("Lead foi anonimizado");
    }
    return lead;
  }

  async update(
    id: string,
    patch: UpdateLeadInput,
    auth: AuthContext
  ): Promise<void> {
    const existing = await this.prisma.scoped.lead.findUnique({
      where: { id },
      select: {
        id: true,
        anonymizedAt: true,
        stageId: true,
        status: true,
        customFields: true,
      },
    });
    if (!existing) throw new NotFoundException("Lead não encontrado");
    if (existing.anonymizedAt) {
      throw new BadRequestException("Lead anonimizado não pode ser editado");
    }

    const changed: Record<string, unknown> = {};
    if (patch.name !== undefined) changed.name = patch.name;
    if (patch.email !== undefined) changed.email = patch.email;
    if (patch.visitDate !== undefined) changed.visitDate = patch.visitDate;
    if (patch.groupSize !== undefined) changed.groupSize = patch.groupSize;
    if (patch.productInterest !== undefined) {
      changed.productInterest = patch.productInterest;
    }
    if (patch.cityGuess !== undefined) changed.cityGuess = patch.cityGuess;
    if (patch.customFields !== undefined) {
      // Merge — não sobrescreve customFields inteiros
      const current = (existing.customFields as Record<string, unknown>) ?? {};
      changed.customFields = {
        ...current,
        ...patch.customFields,
      } as Prisma.InputJsonValue;
    }

    // Qualquer update conta como atividade.
    changed.lastActivityAt = new Date();
    changed.rottingStatus = "HEALTHY";

    await this.prisma.scoped.lead.update({ where: { id }, data: changed });

    await this.prisma.scoped.leadEvent.create({
      data: {
        leadId: id,
        kind: "FIELD_UPDATED",
        actorId: auth.userId,
        payload: { fields: Object.keys(changed) } as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      action: "lead.update",
      entity: "Lead",
      entityId: id,
      metadata: { fields: Object.keys(changed) },
    });

    // Recomputa blueprint + score
    if (existing.stageId) {
      await this.recomputeBlueprint(id, existing.stageId);
    }
    await this.scoring.recompute(id);
  }

  /**
   * Move um lead pra outro stage. Aplica BLUEPRINT VALIDATION:
   *   - Verifica requiredFields do stage DE DESTINO.
   *   - Se faltarem campos e force=false → 422 com lista dos faltantes.
   *   - Se force=true → move e audita o bypass.
   *
   * Ao mover:
   *   - Cria LeadEvent STAGE_CHANGED
   *   - Marca atividade (reset rotting)
   *   - Dispara auto_tasks do stage de destino
   *   - Publica STAGE_CHANGED no bus de automação
   *   - Recalcula blueprintCompletion + score
   */
  async moveToStage(
    id: string,
    input: MoveLeadInput,
    auth: AuthContext
  ): Promise<void> {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id },
      select: {
        id: true,
        anonymizedAt: true,
        stageId: true,
        pipelineId: true,
        name: true,
        email: true,
        phoneE164: true,
        visitDate: true,
        groupSize: true,
        productInterest: true,
        customFields: true,
      },
    });
    if (!lead) throw new NotFoundException("Lead não encontrado");
    if (lead.anonymizedAt) {
      throw new BadRequestException("Lead anonimizado");
    }

    const target = await this.prisma.scoped.pipelineStage.findUnique({
      where: { id: input.stageId },
      select: {
        id: true,
        pipelineId: true,
        name: true,
        requiredFields: true,
        autoTasks: true,
        isFinal: true,
      },
    });
    if (!target) throw new NotFoundException("Estágio de destino não encontrado");

    // Integridade: stage precisa ser do mesmo pipeline que o lead (ou atualiza
    // o pipelineId do lead se ele não tinha um).
    const newPipelineId = target.pipelineId;
    if (lead.pipelineId && lead.pipelineId !== newPipelineId) {
      throw new BadRequestException(
        "Para mover entre pipelines diferentes, use PATCH com pipelineId explicitamente"
      );
    }

    const requiredFields = (target.requiredFields as unknown as RequiredFieldSpec[]) ?? [];
    const missing = findMissingFields(lead as unknown as Record<string, unknown>, requiredFields);

    if (missing.length > 0 && !input.force) {
      throw new UnprocessableEntityException({
        error: "BLUEPRINT_INCOMPLETE",
        message: "Campos obrigatórios faltando para este estágio",
        missing: missing.map((m) => ({ field: m.field, label: m.label })),
      });
    }

    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id },
        data: {
          stageId: input.stageId,
          pipelineId: newPipelineId,
          lastActivityAt: new Date(),
          rottingStatus: "HEALTHY",
        },
      });

      await tx.leadEvent.create({
        data: {
          leadId: id,
          kind: "STAGE_CHANGED",
          actorId: auth.userId,
          payload: {
            from: lead.stageId,
            to: input.stageId,
            stageName: target.name,
            forced: input.force,
          } as Prisma.InputJsonValue,
        },
      });
    });

    await this.audit.record({
      action: input.force ? "lead.move_forced" : "lead.move",
      entity: "Lead",
      entityId: id,
      metadata: {
        from: lead.stageId,
        to: input.stageId,
        missingCount: missing.length,
      },
    });

    // Auto-tasks + blueprint + score + eventos do bus
    await this.createAutoTasksForStage(id, input.stageId, "stage_entry");
    await this.recomputeBlueprint(id, input.stageId);
    await this.scoring.recompute(id);

    this.bus.publish({
      kind: "STAGE_CHANGED",
      tenantId: auth.tenantId,
      leadId: id,
      fromStageId: lead.stageId,
      toStageId: input.stageId,
    });
  }

  async addNote(leadId: string, body: string, auth: AuthContext) {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id: leadId },
      select: { id: true, anonymizedAt: true },
    });
    if (!lead) throw new NotFoundException("Lead não encontrado");
    if (lead.anonymizedAt) {
      throw new BadRequestException("Lead anonimizado não aceita notas");
    }

    const note = await this.prisma.scoped.leadNote.create({
      data: { leadId, authorId: auth.userId, body },
      select: { id: true, createdAt: true },
    });

    await this.prisma.scoped.leadEvent.create({
      data: {
        leadId,
        kind: "NOTE_ADDED",
        actorId: auth.userId,
        payload: { noteId: note.id } as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      action: "lead.note_added",
      entity: "Lead",
      entityId: leadId,
    });

    await this.rotting.markActivity(leadId);
    await this.scoring.recompute(leadId);

    return note;
  }

  async anonymize(id: string, reason: string, auth: AuthContext): Promise<void> {
    const existing = await this.prisma.scoped.lead.findUnique({
      where: { id },
      select: { id: true, anonymizedAt: true },
    });
    if (!existing) throw new NotFoundException("Lead não encontrado");
    if (existing.anonymizedAt) return;

    const now = new Date();
    await this.prisma.scoped.lead.update({
      where: { id },
      data: {
        name: `[anonimizado-${id.slice(0, 8)}]`,
        phoneE164: `+0${id.replace(/-/g, "").slice(0, 14)}`,
        email: null,
        cityGuess: null,
        sourceCampaign: null,
        sourceAdset: null,
        sourceAd: null,
        sourceFbclid: null,
        sourceGclid: null,
        customFields: {} as Prisma.InputJsonValue,
        anonymizedAt: now,
        status: "ARCHIVED",
      },
    });

    await this.prisma.scoped.leadEvent.create({
      data: {
        leadId: id,
        kind: "ANONYMIZED",
        actorId: auth.userId,
        payload: { reason } as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      action: "lead.anonymize",
      entity: "Lead",
      entityId: id,
      metadata: { reason },
    });
  }

  // ============ internos ============

  private async createAutoTasksForStage(
    leadId: string,
    stageId: string,
    source: "stage_entry" | "handoff"
  ): Promise<void> {
    const stage = await this.prisma.scoped.pipelineStage.findUnique({
      where: { id: stageId },
      select: { id: true, autoTasks: true },
    });
    if (!stage) return;
    const autoTasks = (stage.autoTasks as unknown as AutoTaskSpec[]) ?? [];
    if (autoTasks.length === 0) return;

    const rule = `${source}:${stageId}`;
    const now = new Date();
    await this.prisma.scoped.task.createMany({
      data: autoTasks.map((t) =>
        scopedData({
          leadId,
          title: t.title,
          dueAt: new Date(now.getTime() + t.dueInDays * 86_400_000),
          status: "PENDING",
          createdByRule: rule,
        })
      ),
    });

    // Grava um único LeadEvent agregado para não poluir a timeline
    await this.prisma.scoped.leadEvent.create({
      data: {
        leadId,
        kind: "TASK_CREATED",
        payload: {
          count: autoTasks.length,
          source: rule,
          titles: autoTasks.map((t) => t.title),
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async recomputeBlueprint(leadId: string, stageId: string): Promise<void> {
    const [lead, stage] = await Promise.all([
      this.prisma.scoped.lead.findUnique({
        where: { id: leadId },
        select: {
          name: true,
          email: true,
          phoneE164: true,
          visitDate: true,
          groupSize: true,
          productInterest: true,
          customFields: true,
        },
      }),
      this.prisma.scoped.pipelineStage.findUnique({
        where: { id: stageId },
        select: { requiredFields: true },
      }),
    ]);
    if (!lead || !stage) return;
    const required = (stage.requiredFields as unknown as RequiredFieldSpec[]) ?? [];
    const pct = blueprintCompletion(lead as unknown as Record<string, unknown>, required);
    await this.prisma.scoped.lead.update({
      where: { id: leadId },
      data: { blueprintCompletion: pct },
    });
  }
}
