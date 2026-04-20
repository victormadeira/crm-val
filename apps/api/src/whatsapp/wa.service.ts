import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type {
  SendMediaMessageInput,
  SendTemplateMessageInput,
  SendTextMessageInput,
  UpsertWaAccountInput,
} from "@valparaiso/shared";
import { AuditService } from "../audit/audit.service";
import type { AuthContext } from "../auth/auth.types";
import { CryptoService } from "../crypto/crypto.service";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { TenantContext } from "../prisma/tenant-context";
import { WaQueue } from "./wa.queue";

/**
 * Serviço de orquestração do WhatsApp. Fluxo de envio:
 *   1. Valida lead, resolve phoneNumber default.
 *   2. Abre / reusa WaConversation. Se fora da janela 24h, exige template.
 *   3. Cria WaMessage com status=QUEUED e enfileira — retry é da queue.
 *   4. Worker (WaWorkerService) descriptografa token, chama Graph, atualiza.
 */
@Injectable()
export class WaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly queue: WaQueue,
    private readonly audit: AuditService
  ) {}

  async upsertAccount(input: UpsertWaAccountInput, auth: AuthContext) {
    const ctx = TenantContext.require();
    const enc = (plain: string): string =>
      this.crypto.encryptForTenant(ctx.tenantId, plain);

    const account = await this.prisma.scoped.$transaction(async (tx) => {
      const existing = await tx.waAccount.findFirst({
        where: { wabaId: input.wabaId },
        select: { id: true },
      });
      const acc = existing
        ? await tx.waAccount.update({
            where: { id: existing.id },
            data: {
              businessName: input.wabaId,
              accessToken: enc(input.accessToken),
              appSecret: enc(input.appSecret),
              verifyToken: enc(input.verifyToken),
            },
            select: { id: true },
          })
        : await tx.waAccount.create({
            data: scopedData({
              wabaId: input.wabaId,
              businessName: input.wabaId,
              accessToken: enc(input.accessToken),
              appSecret: enc(input.appSecret),
              verifyToken: enc(input.verifyToken),
            }),
            select: { id: true },
          });

      for (const p of input.phoneNumbers) {
        await tx.waPhoneNumber.upsert({
          where: { phoneNumberId: p.phoneNumberId },
          create: scopedData({
            accountId: acc.id,
            phoneNumberId: p.phoneNumberId,
            displayPhoneE164: p.displayPhoneE164,
            verifiedName: p.verifiedName ?? null,
          }),
          update: {
            accountId: acc.id,
            displayPhoneE164: p.displayPhoneE164,
            verifiedName: p.verifiedName ?? null,
          },
        });
      }
      return acc;
    });

    await this.audit.record({
      action: "wa.account_upsert",
      entity: "WaAccount",
      entityId: account.id,
      metadata: { by: auth.userId, wabaId: input.wabaId },
    });
    return account;
  }

  async sendText(input: SendTextMessageInput, auth: AuthContext) {
    const { conversation, phoneNumber } = await this.resolveForLead(input.leadId);
    if (!this.isInsideWindow(conversation.windowExpiresAt)) {
      throw new BadRequestException(
        "Fora da janela de 24h — envie um template aprovado"
      );
    }
    const msg = await this.prisma.scoped.waMessage.create({
      data: scopedData({
        conversationId: conversation.id,
        phoneNumberId: phoneNumber.id,
        direction: "OUTBOUND",
        kind: "TEXT",
        status: "QUEUED",
        text: input.body,
        payload: {
          body: input.body,
        } as Prisma.InputJsonValue,
        sentById: auth.userId,
      }),
      select: { id: true },
    });
    await this.queue.enqueueOutbound({
      kind: "text",
      tenantId: TenantContext.require().tenantId,
      conversationId: conversation.id,
      messageId: msg.id,
    });
    return msg;
  }

  async sendTemplate(input: SendTemplateMessageInput, auth: AuthContext) {
    const { conversation, phoneNumber } = await this.resolveForLead(input.leadId);
    const template = await this.prisma.scoped.waTemplate.findFirst({
      where: {
        accountId: phoneNumber.accountId,
        name: input.templateName,
        language: input.languageCode,
        status: "APPROVED",
      },
      select: { id: true },
    });
    if (!template) {
      throw new BadRequestException(
        `Template ${input.templateName}/${input.languageCode} não aprovado`
      );
    }
    const msg = await this.prisma.scoped.waMessage.create({
      data: scopedData({
        conversationId: conversation.id,
        phoneNumberId: phoneNumber.id,
        direction: "OUTBOUND",
        kind: "TEMPLATE",
        status: "QUEUED",
        templateId: template.id,
        payload: {
          name: input.templateName,
          language: input.languageCode,
          components: input.components ?? [],
        } as Prisma.InputJsonValue,
        sentById: auth.userId,
      }),
      select: { id: true },
    });
    await this.queue.enqueueOutbound({
      kind: "template",
      tenantId: TenantContext.require().tenantId,
      conversationId: conversation.id,
      messageId: msg.id,
    });
    return msg;
  }

  async sendMedia(input: SendMediaMessageInput, auth: AuthContext) {
    const { conversation, phoneNumber } = await this.resolveForLead(input.leadId);
    if (!this.isInsideWindow(conversation.windowExpiresAt)) {
      throw new BadRequestException(
        "Fora da janela de 24h — envie um template com mídia"
      );
    }
    const kindMap = {
      IMAGE: "IMAGE",
      AUDIO: "AUDIO",
      VIDEO: "VIDEO",
      DOCUMENT: "DOCUMENT",
    } as const;
    const msg = await this.prisma.scoped.waMessage.create({
      data: scopedData({
        conversationId: conversation.id,
        phoneNumberId: phoneNumber.id,
        direction: "OUTBOUND",
        kind: kindMap[input.kind],
        status: "QUEUED",
        mediaUrl: input.mediaUrl,
        text: input.caption ?? null,
        payload: {
          kind: input.kind,
          mediaUrl: input.mediaUrl,
          caption: input.caption ?? null,
          filename: input.filename ?? null,
        } as Prisma.InputJsonValue,
        sentById: auth.userId,
      }),
      select: { id: true },
    });
    await this.queue.enqueueOutbound({
      kind: "media",
      tenantId: TenantContext.require().tenantId,
      conversationId: conversation.id,
      messageId: msg.id,
    });
    return msg;
  }

  /**
   * Resolve ou cria a WaConversation para o lead, usando o phoneNumber
   * default da conta WABA. Se houver múltiplas contas WABA, a primeira
   * ativa é escolhida — refinamento futuro: seleção explícita por canal.
   */
  private async resolveForLead(leadId: string) {
    const lead = await this.prisma.scoped.lead.findUnique({
      where: { id: leadId },
      select: { id: true, phoneE164: true, anonymizedAt: true },
    });
    if (!lead) throw new NotFoundException("Lead não encontrado");
    if (lead.anonymizedAt) {
      throw new ForbiddenException("Lead anonimizado não aceita mensagens");
    }
    const phoneNumber = await this.prisma.scoped.waPhoneNumber.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, phoneNumberId: true, accountId: true },
    });
    if (!phoneNumber) {
      throw new BadRequestException(
        "Nenhum número de WhatsApp conectado neste tenant"
      );
    }
    const contactWaId = lead.phoneE164.replace(/^\+/, "");
    const existing = await this.prisma.scoped.waConversation.findFirst({
      where: { phoneNumberId: phoneNumber.id, contactWaId },
      select: { id: true, windowExpiresAt: true, status: true, leadId: true },
    });
    if (existing) {
      if (existing.leadId !== leadId) {
        await this.prisma.scoped.waConversation.update({
          where: { id: existing.id },
          data: { leadId },
        });
      }
      return {
        conversation: {
          id: existing.id,
          windowExpiresAt: existing.windowExpiresAt,
        },
        phoneNumber,
      };
    }
    const created = await this.prisma.scoped.waConversation.create({
      data: scopedData({
        id: randomUUID(),
        leadId,
        phoneNumberId: phoneNumber.id,
        contactWaId,
        status: "OPEN",
      }),
      select: { id: true, windowExpiresAt: true },
    });
    return { conversation: created, phoneNumber };
  }

  private isInsideWindow(expires: Date | null): boolean {
    if (!expires) return false;
    return expires.getTime() > Date.now();
  }
}
