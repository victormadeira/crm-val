import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  ConsentPurpose,
  ConsentChannel,
  PrivacyRequestKind,
} from "@valparaiso/shared";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import type { AuthContext } from "../auth/auth.types";

/**
 * LGPD first-class:
 *   - PolicyVersion: versões da política de privacidade. Cada consent
 *     referencia uma versão pontual (prova documental).
 *   - LeadConsent: registro atômico de aceite/revogação. Append: cada
 *     revogação cria uma nova linha com granted=false.
 *   - PrivacyRequest: pedido formal do titular (access/export/deletion/
 *     rectification). Fica em PENDING até o encarregado agir.
 */
@Injectable()
export class LgpdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async listPolicies() {
    return this.prisma.scoped.policyVersion.findMany({
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        version: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  }

  async publishPolicy(input: { version: string; body: string }, auth: AuthContext) {
    const created = await this.prisma.scoped.policyVersion.create({
      data: scopedData({
        version: input.version,
        body: input.body,
      }),
      select: { id: true, version: true, publishedAt: true },
    });
    await this.audit.record({
      action: "policy.publish",
      entity: "PolicyVersion",
      entityId: created.id,
      metadata: { version: created.version, by: auth.userId },
    });
    return created;
  }

  async recordConsent(input: {
    leadId: string;
    purpose: ConsentPurpose;
    channel: ConsentChannel;
    granted: boolean;
    policyVersionId: string;
    ip?: string;
    userAgent?: string;
    evidence?: Record<string, unknown>;
  }) {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id: input.leadId },
      select: { id: true, anonymizedAt: true },
    });
    if (!lead) throw new NotFoundException("Lead não encontrado");
    if (lead.anonymizedAt) {
      throw new BadRequestException("Lead anonimizado não aceita consent");
    }
    const policy = await this.prisma.scoped.policyVersion.findUnique({
      where: { id: input.policyVersionId },
      select: { id: true },
    });
    if (!policy) throw new BadRequestException("PolicyVersion inexistente");

    const consent = await this.prisma.scoped.leadConsent.create({
      data: {
        leadId: input.leadId,
        purpose: input.purpose,
        channel: input.channel,
        granted: input.granted,
        policyVersionId: input.policyVersionId,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        evidence: (input.evidence ?? {}) as Prisma.InputJsonValue,
        revokedAt: input.granted ? null : new Date(),
      },
      select: { id: true, givenAt: true, granted: true },
    });

    await this.prisma.scoped.leadEvent.create({
      data: {
        leadId: input.leadId,
        kind: input.granted ? "CONSENT_GIVEN" : "CONSENT_REVOKED",
        payload: {
          purpose: input.purpose,
          channel: input.channel,
        } as Prisma.InputJsonValue,
      },
    });

    await this.audit.record({
      action: input.granted ? "consent.grant" : "consent.revoke",
      entity: "LeadConsent",
      entityId: consent.id,
      metadata: { leadId: input.leadId, purpose: input.purpose },
      ip: input.ip,
      userAgent: input.userAgent,
    });
    return consent;
  }

  async openPrivacyRequest(input: {
    requesterEmail: string;
    requesterPhone?: string;
    kind: PrivacyRequestKind;
    leadId?: string;
    note?: string;
  }) {
    const request = await this.prisma.scoped.privacyRequest.create({
      data: scopedData({
        requesterEmail: input.requesterEmail.toLowerCase(),
        requesterPhone: input.requesterPhone ?? null,
        kind: input.kind,
        leadId: input.leadId ?? null,
        note: input.note ?? null,
      }),
      select: { id: true, createdAt: true, status: true },
    });
    await this.audit.record({
      action: "privacy.request_opened",
      entity: "PrivacyRequest",
      entityId: request.id,
      metadata: { kind: input.kind },
    });
    return request;
  }

  async listPrivacyRequests() {
    return this.prisma.scoped.privacyRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}
