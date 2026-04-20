import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import type {
  CreateProposalInput,
  UpdateProposalInput,
} from "@valparaiso/shared";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { TenantContext } from "../prisma/tenant-context";
import { RottingService } from "../rotting/rotting.service";
import { LeadScoringService } from "../lead-scoring/lead-scoring.service";
import type { AuthContext } from "../auth/auth.types";

/**
 * Proposal com pixel tracking. O token é a chave pública no link
 * `/p/:token` que abre uma proposta. Quando o cliente abre, o frontend
 * faz GET /proposals/public/:token/view → registra ProposalView, seta
 * openedAt, incrementa openedCount e reseta rotting do lead.
 */
@Injectable()
export class ProposalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rotting: RottingService,
    private readonly scoring: LeadScoringService
  ) {}

  async create(input: CreateProposalInput, auth: AuthContext) {
    const token = randomBytes(24).toString("base64url");
    const proposal = await this.prisma.scoped.proposal.create({
      data: scopedData({
        leadId: input.leadId,
        token,
        title: input.title,
        valueCents: input.valueCents,
        validUntil: input.validUntil ?? null,
        content: input.content as Prisma.InputJsonValue,
        status: "DRAFT",
      }),
      select: { id: true, token: true },
    });

    await this.audit.record({
      action: "proposal.create",
      entity: "Proposal",
      entityId: proposal.id,
      metadata: { leadId: input.leadId, actorId: auth.userId },
    });

    return proposal;
  }

  async list(leadId?: string) {
    return this.prisma.scoped.proposal.findMany({
      where: leadId ? { leadId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async getById(id: string) {
    const p = await this.prisma.scoped.proposal.findUnique({
      where: { id },
      include: { views: { orderBy: { viewedAt: "desc" }, take: 50 } },
    });
    if (!p) throw new NotFoundException("Proposta não encontrada");
    return p;
  }

  async update(id: string, patch: UpdateProposalInput, auth: AuthContext) {
    const existing = await this.prisma.scoped.proposal.findUnique({
      where: { id },
      select: { id: true, leadId: true, status: true, sentAt: true },
    });
    if (!existing) throw new NotFoundException("Proposta não encontrada");

    const data: Prisma.ProposalUpdateInput = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.valueCents !== undefined) data.valueCents = patch.valueCents;
    if (patch.validUntil !== undefined) data.validUntil = patch.validUntil;
    if (patch.content !== undefined) {
      data.content = patch.content as Prisma.InputJsonValue;
    }
    if (patch.status !== undefined) {
      data.status = patch.status;
      if (patch.status === "SENT" && !existing.sentAt) {
        data.sentAt = new Date();
      }
    }

    await this.prisma.scoped.proposal.update({ where: { id }, data });

    if (patch.status === "SENT" && existing.status !== "SENT") {
      await this.prisma.scoped.leadEvent.create({
        data: {
          leadId: existing.leadId,
          kind: "PROPOSAL_SENT",
          actorId: auth.userId,
          payload: { proposalId: id } as Prisma.InputJsonValue,
        },
      });
      await this.rotting.markActivity(existing.leadId);
    }

    await this.audit.record({
      action: "proposal.update",
      entity: "Proposal",
      entityId: id,
      metadata: { fields: Object.keys(patch) },
    });

    await this.scoring.recompute(existing.leadId);
  }

  /**
   * Público — chamado pelo frontend que renderiza a proposta ao cliente.
   * Registra uma view, seta openedAt na primeira abertura, incrementa contador
   * e reseta rotting/recalcula score. Cross-tenant: o token é globalmente único.
   */
  async registerPublicView(
    token: string,
    meta: { ip?: string; userAgent?: string }
  ): Promise<{ ok: true }> {
    const prop = await TenantContext.runOutsideTenant(() =>
      this.prisma.proposal.findUnique({
        where: { token },
        select: {
          id: true,
          tenantId: true,
          leadId: true,
          openedAt: true,
        },
      })
    );
    if (!prop) return { ok: true };

    return TenantContext.run(
      { tenantId: prop.tenantId },
      async () => {
        await this.prisma.scoped.$transaction(async (tx) => {
          await tx.proposalView.create({
            data: {
              proposalId: prop.id,
              ip: meta.ip ?? null,
              userAgent: meta.userAgent ?? null,
            },
          });
          await tx.proposal.update({
            where: { id: prop.id },
            data: {
              openedAt: prop.openedAt ?? new Date(),
              openedCount: { increment: 1 },
              status: prop.openedAt ? undefined : "OPENED",
            },
          });
        });

        if (!prop.openedAt) {
          await this.prisma.scoped.leadEvent.create({
            data: {
              leadId: prop.leadId,
              kind: "PROPOSAL_OPENED",
              payload: { proposalId: prop.id } as Prisma.InputJsonValue,
            },
          });
          await this.rotting.markActivity(prop.leadId);
        }

        await this.scoring.recompute(prop.leadId);
        return { ok: true as const };
      }
    );
  }
}
