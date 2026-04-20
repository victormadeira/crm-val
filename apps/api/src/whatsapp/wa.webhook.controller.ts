import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { CryptoService } from "../crypto/crypto.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantContext } from "../prisma/tenant-context";
import { Public } from "../tenant/tenant.guard";
import { WaQueue } from "./wa.queue";

/**
 * Webhook receiver da Meta Cloud API. DOIS endpoints:
 *
 *   GET  /webhooks/meta  — verificação inicial (hub.challenge)
 *   POST /webhooks/meta  — entrega de mensagens/statuses
 *
 * Regras de segurança:
 *   - Ambos @Public (sem JWT) — a autenticação é via HMAC do body.
 *   - O body cru é preservado por `rawBody: true` no bootstrap.
 *   - Para HMAC precisamos do appSecret; descobrimos a WaAccount via
 *     wabaId no payload, descriptografamos e verificamos. Se nenhuma
 *     conta bater, 403.
 *   - Sucesso devolve 200 imediato (Meta penaliza demora); o payload
 *     segue pra fila inbound e é processado async.
 */
@Controller("webhooks/meta")
export class WaWebhookController {
  private readonly logger = new Logger(WaWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly queue: WaQueue
  ) {}

  @Public()
  @Get()
  async verify(
    @Query("hub.mode") mode: string | undefined,
    @Query("hub.verify_token") verifyToken: string | undefined,
    @Query("hub.challenge") challenge: string | undefined
  ): Promise<string> {
    if (mode !== "subscribe" || !verifyToken || !challenge) {
      throw new BadRequestException("Parâmetros de verificação ausentes");
    }
    const ok = await this.findAccountByVerifyToken(verifyToken);
    if (!ok) throw new ForbiddenException("verify_token inválido");
    return challenge;
  }

  @Public()
  @Post()
  @HttpCode(200)
  async receive(
    @Headers("x-hub-signature-256") signature: string | undefined,
    @Req() req: Request
  ): Promise<{ ok: true }> {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw || raw.length === 0) {
      throw new BadRequestException("rawBody ausente — verifique main.ts");
    }

    const body = JSON.parse(raw.toString("utf8")) as MetaWebhookPayload;
    const wabaIds = new Set<string>();
    for (const entry of body.entry ?? []) {
      if (entry.id) wabaIds.add(entry.id);
    }
    if (wabaIds.size === 0) {
      // Evento sem entry (ex: test ping). Confirma 200.
      return { ok: true };
    }

    // Tenta validar contra qualquer account que bata com o wabaId.
    const accounts = await this.findAccountsByWabaIds([...wabaIds]);
    if (accounts.length === 0) {
      throw new ForbiddenException("Nenhuma WaAccount para este WABA");
    }

    const valid = accounts.some((a) =>
      this.crypto.verifyMetaSignature(signature, raw, a.appSecretPlain)
    );
    if (!valid) {
      throw new ForbiddenException("Assinatura HMAC inválida");
    }

    // Enfileira por tenant e por wabaId (um job por entry).
    for (const entry of body.entry ?? []) {
      const account = accounts.find((a) => a.wabaId === entry.id);
      if (!account) continue;
      for (const change of entry.changes ?? []) {
        if (!change.value) continue;
        await this.queue.enqueueInbound({
          tenantId: account.tenantId,
          phoneNumberId:
            change.value.metadata?.phone_number_id ?? "",
          payload: change.value,
        });
      }
    }
    return { ok: true };
  }

  /**
   * Descobre account pelo verify_token — comparação em tempo constante
   * é feita pelo crypto no verifyMetaSignature. Aqui basta igualar string.
   */
  private async findAccountByVerifyToken(verifyToken: string): Promise<boolean> {
    return TenantContext.runOutsideTenant(async () => {
      // Carrega todas as WaAccount ativas e descriptografa o verifyToken
      // por tenant — em produção a lista é pequena (uma por tenant).
      const accounts = await this.prisma.waAccount.findMany({
        select: { tenantId: true, verifyToken: true },
      });
      for (const a of accounts) {
        try {
          const plain = this.crypto.decryptForTenant(a.tenantId, a.verifyToken);
          if (plain === verifyToken) return true;
        } catch (err) {
          this.logger.debug(
            `verify_token decrypt falhou tenant=${a.tenantId}: ${String(err)}`
          );
        }
      }
      return false;
    });
  }

  private async findAccountsByWabaIds(
    wabaIds: string[]
  ): Promise<
    Array<{ id: string; tenantId: string; wabaId: string; appSecretPlain: string }>
  > {
    return TenantContext.runOutsideTenant(async () => {
      const accounts = await this.prisma.waAccount.findMany({
        where: { wabaId: { in: wabaIds } },
        select: { id: true, tenantId: true, wabaId: true, appSecret: true },
      });
      const out = [] as Array<{
        id: string;
        tenantId: string;
        wabaId: string;
        appSecretPlain: string;
      }>;
      for (const a of accounts) {
        try {
          out.push({
            id: a.id,
            tenantId: a.tenantId,
            wabaId: a.wabaId,
            appSecretPlain: this.crypto.decryptForTenant(
              a.tenantId,
              a.appSecret
            ),
          });
        } catch (err) {
          this.logger.warn(
            `decrypt appSecret falhou tenant=${a.tenantId}: ${String(err)}`
          );
        }
      }
      return out;
    });
  }
}

interface MetaWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        messages?: unknown[];
        statuses?: unknown[];
        contacts?: unknown[];
      };
    }>;
  }>;
}
