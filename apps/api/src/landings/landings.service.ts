import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type {
  CreateLandingPageInput,
  LandingSubmissionInput,
  UpdateLandingPageInput,
} from "@valparaiso/shared";
import { AuditService } from "../audit/audit.service";
import type { AuthContext } from "../auth/auth.types";
import { AutomationBus } from "../automation/automation.bus";
import { normalizeBrPhone } from "../leads/phone";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { TenantContext } from "../prisma/tenant-context";

/**
 * Landing Pages — CRUD autenticado + submit público. O submit público
 * precisa:
 *   1. Resolver tenantId pelo slug do tenant (fora de qualquer contexto).
 *   2. Abrir TenantContext para criar LandingSubmission + Lead + Consent.
 *   3. Emitir LEAD_CREATED para a automation engine.
 *
 * Não rodamos auditoria no submit público (não há userId) — só no CRUD.
 */
@Injectable()
export class LandingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly bus: AutomationBus
  ) {}

  // -------------------- CRUD autenticado --------------------

  async list() {
    return this.prisma.scoped.landingPage.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        template: true,
        status: true,
        metaPixelId: true,
        gaId: true,
        clarityId: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async get(id: string) {
    const page = await this.prisma.scoped.landingPage.findUnique({
      where: { id },
    });
    if (!page) throw new NotFoundException("Landing page não encontrada");
    return page;
  }

  async create(input: CreateLandingPageInput, auth: AuthContext) {
    try {
      const page = await this.prisma.scoped.landingPage.create({
        data: scopedData({
          slug: input.slug,
          title: input.title,
          template: input.template,
          document: input.document as Prisma.InputJsonValue,
          metaPixelId: input.metaPixelId ?? null,
          gaId: input.gaId ?? null,
          clarityId: input.clarityId ?? null,
          status: input.status,
          publishedAt: input.status === "PUBLISHED" ? new Date() : null,
        }),
        select: { id: true },
      });
      await this.audit.record({
        action: "landing.create",
        entity: "LandingPage",
        entityId: page.id,
        metadata: { by: auth.userId, slug: input.slug },
      });
      return page;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException("Já existe landing com esse slug");
      }
      throw e;
    }
  }

  async update(id: string, patch: UpdateLandingPageInput, auth: AuthContext) {
    const existing = await this.prisma.scoped.landingPage.findUnique({
      where: { id },
      select: { id: true, status: true, publishedAt: true },
    });
    if (!existing) throw new NotFoundException("Landing page não encontrada");

    const data: Prisma.LandingPageUpdateInput = {};
    if (patch.slug !== undefined) data.slug = patch.slug;
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.template !== undefined) data.template = patch.template;
    if (patch.document !== undefined)
      data.document = patch.document as Prisma.InputJsonValue;
    if (patch.metaPixelId !== undefined)
      data.metaPixelId = patch.metaPixelId ?? null;
    if (patch.gaId !== undefined) data.gaId = patch.gaId ?? null;
    if (patch.clarityId !== undefined) data.clarityId = patch.clarityId ?? null;
    if (patch.status !== undefined) {
      data.status = patch.status;
      if (patch.status === "PUBLISHED" && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    try {
      await this.prisma.scoped.landingPage.update({ where: { id }, data });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException("Slug já em uso");
      }
      throw e;
    }
    await this.audit.record({
      action: "landing.update",
      entity: "LandingPage",
      entityId: id,
      metadata: { by: auth.userId, fields: Object.keys(data) },
    });
  }

  async remove(id: string, auth: AuthContext) {
    try {
      await this.prisma.scoped.landingPage.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new NotFoundException("Landing page não encontrada");
      }
      throw e;
    }
    await this.audit.record({
      action: "landing.delete",
      entity: "LandingPage",
      entityId: id,
      metadata: { by: auth.userId },
    });
  }

  // -------------------- Público --------------------

  async getPublic(
    tenantSlug: string,
    pageSlug: string
  ): Promise<{
    id: string;
    title: string;
    template: string;
    document: Prisma.JsonValue;
    metaPixelId: string | null;
    gaId: string | null;
    clarityId: string | null;
    tenantId: string;
  }> {
    return TenantContext.runOutsideTenant(async () => {
      const tenant = await this.prisma.raw.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      });
      if (!tenant) throw new NotFoundException("Tenant não encontrado");
      const page = await this.prisma.raw.landingPage.findUnique({
        where: {
          tenantId_slug: { tenantId: tenant.id, slug: pageSlug },
        },
        select: {
          id: true,
          title: true,
          template: true,
          document: true,
          metaPixelId: true,
          gaId: true,
          clarityId: true,
          status: true,
          tenantId: true,
        },
      });
      if (!page || page.status !== "PUBLISHED") {
        throw new NotFoundException("Landing page não encontrada");
      }
      const { status: _status, ...rest } = page;
      return rest;
    });
  }

  async submitPublic(
    tenantSlug: string,
    pageSlug: string,
    input: LandingSubmissionInput,
    meta: { ip?: string; userAgent?: string }
  ): Promise<{ leadId: string; submissionId: string }> {
    const tenantId = await TenantContext.runOutsideTenant(async () => {
      const t = await this.prisma.raw.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      });
      if (!t) throw new NotFoundException("Tenant não encontrado");
      const page = await this.prisma.raw.landingPage.findUnique({
        where: { tenantId_slug: { tenantId: t.id, slug: pageSlug } },
        select: { id: true, status: true },
      });
      if (!page || page.status !== "PUBLISHED") {
        throw new NotFoundException("Landing page não encontrada");
      }
      return t.id;
    });

    const phoneE164 = normalizeBrPhone(input.phoneE164);

    return TenantContext.run({ tenantId, userId: "__public__" }, async () => {
      const page = await this.prisma.scoped.landingPage.findUnique({
        where: { tenantId_slug: { tenantId, slug: pageSlug } },
        select: { id: true },
      });
      if (!page) throw new NotFoundException("Landing page sumiu");

      // Consent policyVersionId precisa pertencer ao mesmo tenant.
      if (input.consent) {
        const policy = await this.prisma.scoped.policyVersion.findUnique({
          where: { id: input.consent.policyVersionId },
          select: { id: true },
        });
        if (!policy) {
          throw new BadRequestException("policyVersionId inválido");
        }
      }

      const result = await this.prisma.scoped.$transaction(async (tx) => {
        const existing = await tx.lead.findFirst({
          where: { phoneE164 },
          select: { id: true, anonymizedAt: true },
        });
        const leadId = existing
          ? existing.id
          : (
              await tx.lead.create({
                data: scopedData({
                  name: input.name,
                  phoneE164,
                  email: input.email ?? null,
                  origin: input.origin,
                  sourceCampaign: input.utmCampaign ?? null,
                  sourceFbclid: input.fbclid ?? null,
                  sourceGclid: input.gclid ?? null,
                }),
                select: { id: true },
              })
            ).id;

        if (!existing) {
          await tx.leadEvent.create({
            data: {
              leadId,
              kind: "CREATED",
              payload: {
                origin: input.origin,
                via: "landing",
                pageId: page.id,
              } as Prisma.InputJsonValue,
            },
          });
        }

        if (input.consent) {
          await tx.leadConsent.create({
            data: {
              leadId,
              purpose: input.consent.purpose,
              granted: input.consent.granted,
              channel: "LANDING_PAGE",
              policyVersionId: input.consent.policyVersionId,
              evidence: {
                userAgent: meta.userAgent ?? null,
                ip: meta.ip ?? null,
              } as Prisma.InputJsonValue,
            },
          });
          await tx.leadEvent.create({
            data: {
              leadId,
              kind: input.consent.granted ? "CONSENT_GIVEN" : "CONSENT_REVOKED",
              payload: {
                purpose: input.consent.purpose,
                channel: "LANDING_PAGE",
              } as Prisma.InputJsonValue,
            },
          });
        }

        const submission = await tx.landingSubmission.create({
          data: scopedData({
            pageId: page.id,
            leadId,
            payload: input.payload as Prisma.InputJsonValue,
            userAgent: meta.userAgent ?? null,
            ip: meta.ip ?? null,
            utmSource: input.utmSource ?? null,
            utmMedium: input.utmMedium ?? null,
            utmCampaign: input.utmCampaign ?? null,
            fbclid: input.fbclid ?? null,
            gclid: input.gclid ?? null,
          }),
          select: { id: true },
        });
        return { leadId, submissionId: submission.id, newLead: !existing };
      });

      if (result.newLead) {
        this.bus.publish({
          kind: "LEAD_CREATED",
          tenantId,
          leadId: result.leadId,
          origin: input.origin,
        });
      }

      return { leadId: result.leadId, submissionId: result.submissionId };
    });
  }

  async listSubmissions(pageId: string, limit = 100) {
    const take = Math.min(Math.max(limit, 1), 500);
    return this.prisma.scoped.landingSubmission.findMany({
      where: { pageId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        leadId: true,
        payload: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        fbclid: true,
        gclid: true,
        createdAt: true,
      },
    });
  }
}
