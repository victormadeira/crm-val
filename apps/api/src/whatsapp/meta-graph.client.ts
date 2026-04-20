import { Inject, Injectable, Logger } from "@nestjs/common";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";

/**
 * Cliente mínimo da Meta Graph API (WhatsApp Cloud). Sem SDK — fetch
 * direto. Motivo: o SDK oficial é instável, não oferece typing por
 * versão e esconde erros de rate limit. Preferimos controlar nós mesmos.
 *
 * Quem chama este cliente deve:
 *   - Ter descriptografado o accessToken via CryptoService.decryptForTenant
 *   - Estar dentro de um job da queue (retry + DLQ viram grátis pela BullMQ)
 */
@Injectable()
export class MetaGraphClient {
  private readonly logger = new Logger(MetaGraphClient.name);
  private readonly baseUrl: string;

  constructor(@Inject(ENV_TOKEN) env: Env) {
    this.baseUrl = `${env.META_GRAPH_API_BASE}/${env.META_GRAPH_API_VERSION}`;
  }

  /**
   * Envia mensagem de texto livre. Só funciona dentro da janela de 24h
   * de atendimento (último inbound do cliente). Se estiver fora, a Meta
   * retorna erro 131051 — nesse caso o caller deve promover para template.
   */
  async sendText(opts: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    text: string;
  }): Promise<MetaSendResponse> {
    return this.post(opts.phoneNumberId, opts.accessToken, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: opts.to,
      type: "text",
      text: { body: opts.text, preview_url: true },
    });
  }

  async sendTemplate(opts: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    name: string;
    languageCode: string;
    components?: unknown[];
  }): Promise<MetaSendResponse> {
    return this.post(opts.phoneNumberId, opts.accessToken, {
      messaging_product: "whatsapp",
      to: opts.to,
      type: "template",
      template: {
        name: opts.name,
        language: { code: opts.languageCode },
        components: opts.components ?? [],
      },
    });
  }

  async sendMedia(opts: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    kind: "image" | "audio" | "video" | "document";
    link: string;
    caption?: string;
    filename?: string;
  }): Promise<MetaSendResponse> {
    const mediaBlock: Record<string, unknown> = { link: opts.link };
    if (opts.caption && opts.kind !== "audio") mediaBlock.caption = opts.caption;
    if (opts.filename && opts.kind === "document") {
      mediaBlock.filename = opts.filename;
    }
    return this.post(opts.phoneNumberId, opts.accessToken, {
      messaging_product: "whatsapp",
      to: opts.to,
      type: opts.kind,
      [opts.kind]: mediaBlock,
    });
  }

  async markRead(opts: {
    phoneNumberId: string;
    accessToken: string;
    waMessageId: string;
  }): Promise<void> {
    await this.post(opts.phoneNumberId, opts.accessToken, {
      messaging_product: "whatsapp",
      status: "read",
      message_id: opts.waMessageId,
    });
  }

  async downloadMedia(opts: {
    mediaId: string;
    accessToken: string;
  }): Promise<{ url: string; mimeType: string; data: Buffer }> {
    const infoRes = await fetch(`${this.baseUrl}/${opts.mediaId}`, {
      headers: { Authorization: `Bearer ${opts.accessToken}` },
    });
    if (!infoRes.ok) {
      throw await toMetaError(infoRes, "GET media info");
    }
    const info = (await infoRes.json()) as {
      url: string;
      mime_type: string;
    };
    const binRes = await fetch(info.url, {
      headers: { Authorization: `Bearer ${opts.accessToken}` },
    });
    if (!binRes.ok) throw await toMetaError(binRes, "GET media binary");
    const buf = Buffer.from(await binRes.arrayBuffer());
    return { url: info.url, mimeType: info.mime_type, data: buf };
  }

  private async post(
    phoneNumberId: string,
    accessToken: string,
    body: unknown
  ): Promise<MetaSendResponse> {
    const res = await fetch(`${this.baseUrl}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await toMetaError(res, "POST /messages");
    const json = (await res.json()) as MetaSendResponse;
    this.logger.debug(
      `meta graph ok phone=${phoneNumberId} msg=${json.messages?.[0]?.id ?? "?"}`
    );
    return json;
  }
}

export interface MetaSendResponse {
  messaging_product: "whatsapp";
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
}

export class MetaGraphError extends Error {
  constructor(
    public readonly stage: string,
    public readonly status: number,
    public readonly code: string | null,
    public readonly body: unknown
  ) {
    super(`Meta ${stage} HTTP ${status} code=${code ?? "n/a"}`);
    this.name = "MetaGraphError";
  }

  /** Errors da Meta marcados como temporários → o worker pode fazer retry. */
  get retryable(): boolean {
    if (this.status >= 500) return true;
    if (this.status === 429) return true;
    // 131016 internal server error from Meta, 131053 media download failure
    const c = this.code ?? "";
    return c === "131016" || c === "131053";
  }
}

async function toMetaError(res: Response, stage: string): Promise<MetaGraphError> {
  let body: unknown = null;
  let code: string | null = null;
  try {
    body = await res.json();
    const err = (body as { error?: { code?: number; message?: string } }).error;
    if (err?.code !== undefined) code = String(err.code);
  } catch {
    body = await res.text().catch(() => null);
  }
  return new MetaGraphError(stage, res.status, code, body);
}
