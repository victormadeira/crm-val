import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Job } from "bullmq";
import { AutomationBus } from "../automation/automation.bus";
import { CryptoService } from "../crypto/crypto.service";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { PushService } from "../push/push.service";
import { TenantContext } from "../prisma/tenant-context";
import { MetaGraphClient, MetaGraphError } from "./meta-graph.client";
import {
  type WaInboundJob,
  type WaOutboundJob,
  WaQueue,
} from "./wa.queue";

/**
 * Consumidores das filas BullMQ. São registrados ao bootstrap — rodam no
 * mesmo processo que a API em dev, e separados em produção (mesmo binário,
 * env WORKER=1 futuramente). Cada job roda dentro de `TenantContext.run`
 * para que toda query do Prisma fique escopada automaticamente.
 */
@Injectable()
export class WaWorkerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WaWorkerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly graph: MetaGraphClient,
    private readonly queue: WaQueue,
    private readonly bus: AutomationBus,
    private readonly push: PushService
  ) {}

  onApplicationBootstrap(): void {
    this.queue.registerOutboundProcessor((job) =>
      TenantContext.run(
        { tenantId: job.data.tenantId, userId: "__worker__" },
        () => this.processOutbound(job)
      )
    );
    this.queue.registerInboundProcessor((job) =>
      TenantContext.run(
        { tenantId: job.data.tenantId, userId: "__worker__" },
        () => this.processInbound(job)
      )
    );
  }

  // -------------------- OUTBOUND --------------------

  private async processOutbound(job: Job<WaOutboundJob>): Promise<void> {
    const { messageId } = job.data;
    const msg = await this.prisma.scoped.waMessage.findUnique({
      where: { id: messageId },
      include: {
        phoneNumber: {
          include: {
            account: {
              select: {
                id: true,
                tenantId: true,
                accessToken: true,
              },
            },
          },
        },
        conversation: { select: { id: true, contactWaId: true } },
      },
    });
    if (!msg) {
      this.logger.warn(`outbound: message ${messageId} sumiu`);
      return;
    }
    if (msg.status !== "QUEUED") {
      // Já processada — idempotência.
      return;
    }

    const accessToken = this.crypto.decryptForTenant(
      msg.phoneNumber.account.tenantId,
      msg.phoneNumber.account.accessToken
    );
    const to = msg.conversation.contactWaId;
    const payload = (msg.payload ?? {}) as Record<string, unknown>;

    try {
      let res;
      if (msg.kind === "TEXT") {
        res = await this.graph.sendText({
          phoneNumberId: msg.phoneNumber.phoneNumberId,
          accessToken,
          to,
          text: msg.text ?? String(payload.body ?? ""),
        });
      } else if (msg.kind === "TEMPLATE") {
        res = await this.graph.sendTemplate({
          phoneNumberId: msg.phoneNumber.phoneNumberId,
          accessToken,
          to,
          name: String(payload.name ?? ""),
          languageCode: String(payload.language ?? "pt_BR"),
          components: (payload.components ?? []) as unknown[],
        });
      } else if (
        msg.kind === "IMAGE" ||
        msg.kind === "AUDIO" ||
        msg.kind === "VIDEO" ||
        msg.kind === "DOCUMENT"
      ) {
        res = await this.graph.sendMedia({
          phoneNumberId: msg.phoneNumber.phoneNumberId,
          accessToken,
          to,
          kind: msg.kind.toLowerCase() as
            | "image"
            | "audio"
            | "video"
            | "document",
          link: msg.mediaUrl ?? String(payload.mediaUrl ?? ""),
          caption: msg.text ?? undefined,
          filename: (payload.filename as string | undefined) ?? undefined,
        });
      } else {
        throw new Error(`kind ${msg.kind} não suportado no outbound`);
      }

      const wamid = res.messages?.[0]?.id ?? null;
      const now = new Date();
      await this.prisma.scoped.waMessage.update({
        where: { id: msg.id },
        data: {
          status: "SENT",
          sentAt: now,
          waMessageId: wamid,
        },
      });
      await this.prisma.scoped.waConversation.update({
        where: { id: msg.conversationId },
        data: { lastOutboundAt: now },
      });
    } catch (err) {
      if (err instanceof MetaGraphError && !err.retryable) {
        await this.prisma.scoped.waMessage.update({
          where: { id: msg.id },
          data: {
            status: "FAILED",
            errorCode: err.code ?? String(err.status),
            errorMessage: err.message,
          },
        });
        this.logger.error(
          `outbound FAILED (não-retryable) msg=${msg.id} status=${err.status} code=${err.code}`
        );
        return; // não relança — evita retry fútil
      }
      // retryable → deixa a BullMQ reagendar. Ao esgotar attempts, cai em DLQ.
      this.logger.warn(
        `outbound retry msg=${msg.id} attempt=${job.attemptsMade + 1}: ${String(err)}`
      );
      throw err;
    }
  }

  // -------------------- INBOUND --------------------

  /**
   * Processa um "value" de webhook change — pode conter `messages[]` e/ou
   * `statuses[]`. Atualiza WaMessage inbound/outbound correspondente e a
   * WaConversation (janela 24h).
   */
  private async processInbound(job: Job<WaInboundJob>): Promise<void> {
    const value = job.data.payload as {
      metadata?: { phone_number_id?: string };
      messages?: MetaInboundMessage[];
      statuses?: MetaStatusUpdate[];
    };
    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) return;

    const phone = await this.prisma.scoped.waPhoneNumber.findUnique({
      where: { phoneNumberId },
      select: { id: true },
    });
    if (!phone) {
      this.logger.warn(`inbound: phoneNumberId ${phoneNumberId} desconhecido`);
      return;
    }

    for (const m of value.messages ?? []) {
      await this.ingestInboundMessage(phone.id, m);
    }
    for (const s of value.statuses ?? []) {
      await this.ingestStatus(s);
    }
  }

  private async ingestInboundMessage(
    phoneId: string,
    m: MetaInboundMessage
  ): Promise<void> {
    const contactWaId = m.from;
    const conv = await this.upsertConversation(phoneId, contactWaId);
    const now = new Date();
    const tenantId = TenantContext.require().tenantId;

    // Deduplicação — já recebemos esse wamid?
    if (m.id) {
      const dup = await this.prisma.scoped.waMessage.findUnique({
        where: { waMessageId: m.id },
        select: { id: true },
      });
      if (dup) return;
    }

    const kind = metaTypeToKind(m.type);
    const text =
      m.type === "text"
        ? m.text?.body ?? null
        : m.type === "button"
          ? m.button?.text ?? null
          : m.type === "interactive"
            ? m.interactive?.button_reply?.title ??
              m.interactive?.list_reply?.title ??
              null
            : null;

    await this.prisma.scoped.waMessage.create({
      data: scopedData({
        conversationId: conv.id,
        phoneNumberId: phoneId,
        waMessageId: m.id ?? null,
        direction: "INBOUND",
        kind,
        status: "RECEIVED",
        text,
        mediaUrl: null,
        payload: m as unknown as Prisma.InputJsonValue,
      }),
    });
    await this.prisma.scoped.waConversation.update({
      where: { id: conv.id },
      data: {
        lastInboundAt: now,
        windowExpiresAt: new Date(now.getTime() + 24 * 3_600 * 1_000),
        status: "OPEN",
      },
    });

    this.bus.publish({
      kind: "MESSAGE_RECEIVED",
      tenantId,
      leadId: conv.leadId ?? null,
      conversationId: conv.id,
      text: text ?? undefined,
    });

    if (conv.leadId) {
      await this.notifyAssignees(conv.leadId, text);
    }
  }

  /**
   * Dispara push para atendentes ativos do lead. Falha silencioso — push
   * é best-effort, nunca bloqueia o pipeline de ingestão.
   */
  private async notifyAssignees(
    leadId: string,
    text: string | null
  ): Promise<void> {
    try {
      const [lead, assignments] = await Promise.all([
        this.prisma.scoped.lead.findUnique({
          where: { id: leadId },
          select: { name: true },
        }),
        this.prisma.scoped.leadAssignment.findMany({
          where: { leadId, active: true },
          select: { assignedToId: true },
        }),
      ]);
      if (!lead || assignments.length === 0) return;
      const preview = (text ?? "").trim().slice(0, 140) || "Nova mensagem";
      await this.push.notifyUsers({
        userIds: assignments.map((a) => a.assignedToId),
        title: lead.name,
        body: preview,
        data: { type: "wa_message", leadId },
      });
    } catch (e) {
      this.logger.warn(
        `Push notify falhou p/ lead ${leadId}: ${(e as Error).message}`
      );
    }
  }

  private async ingestStatus(s: MetaStatusUpdate): Promise<void> {
    if (!s.id) return;
    const msg = await this.prisma.scoped.waMessage.findUnique({
      where: { waMessageId: s.id },
      select: { id: true, status: true },
    });
    if (!msg) return;
    const patch: Prisma.WaMessageUpdateInput = {};
    const ts = s.timestamp ? new Date(Number(s.timestamp) * 1000) : new Date();
    switch (s.status) {
      case "sent":
        patch.status = "SENT";
        patch.sentAt = ts;
        break;
      case "delivered":
        patch.status = "DELIVERED";
        patch.deliveredAt = ts;
        break;
      case "read":
        patch.status = "READ";
        patch.readAt = ts;
        break;
      case "failed":
        patch.status = "FAILED";
        patch.errorCode = s.errors?.[0]?.code
          ? String(s.errors[0].code)
          : null;
        patch.errorMessage = s.errors?.[0]?.title ?? null;
        break;
      default:
        return;
    }
    await this.prisma.scoped.waMessage.update({
      where: { id: msg.id },
      data: patch,
    });
  }

  private async upsertConversation(
    phoneId: string,
    contactWaId: string
  ): Promise<{ id: string; leadId: string | null }> {
    const existing = await this.prisma.scoped.waConversation.findFirst({
      where: { phoneNumberId: phoneId, contactWaId },
      select: { id: true, leadId: true },
    });
    if (existing) return existing;

    // Tenta casar com um Lead pelo telefone (+ prefixado).
    const phoneE164 = `+${contactWaId}`;
    const lead = await this.prisma.scoped.lead.findFirst({
      where: { phoneE164 },
      select: { id: true },
    });
    return this.prisma.scoped.waConversation.create({
      data: scopedData({
        phoneNumberId: phoneId,
        contactWaId,
        leadId: lead?.id ?? null,
        status: "OPEN",
      }),
      select: { id: true, leadId: true },
    });
  }
}

function metaTypeToKind(
  type: MetaInboundMessage["type"]
): Prisma.WaMessageCreateInput["kind"] {
  switch (type) {
    case "text":
      return "TEXT";
    case "image":
      return "IMAGE";
    case "audio":
      return "AUDIO";
    case "video":
      return "VIDEO";
    case "document":
      return "DOCUMENT";
    case "sticker":
      return "STICKER";
    case "location":
      return "LOCATION";
    case "contacts":
      return "CONTACTS";
    case "button":
    case "interactive":
      return "INTERACTIVE";
    case "reaction":
      return "REACTION";
    case "system":
      return "SYSTEM";
    default:
      return "UNKNOWN";
  }
}

interface MetaInboundMessage {
  id?: string;
  from: string;
  timestamp?: string;
  type:
    | "text"
    | "image"
    | "audio"
    | "video"
    | "document"
    | "sticker"
    | "location"
    | "contacts"
    | "button"
    | "interactive"
    | "reaction"
    | "system";
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
}

interface MetaStatusUpdate {
  id?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  timestamp?: string;
  errors?: Array<{ code?: number; title?: string }>;
}
