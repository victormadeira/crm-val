import { Injectable, Logger } from "@nestjs/common";

export interface ExpoPushMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

/**
 * Cliente Expo Push. Expo hospeda um gateway (https://exp.host/--/api/v2/push/send)
 * que encaminha para APNs/FCM, portanto o backend só precisa dos tokens
 * `ExponentPushToken[...]` — nenhum segredo além deles. O método `send`
 * faz batch de até 100 mensagens por request (limite Expo).
 *
 * Retorna a lista de tokens considerados inválidos pelo Expo — o caller
 * deve removê-los do banco para parar de tentar.
 */
@Injectable()
export class ExpoPushClient {
  private readonly logger = new Logger(ExpoPushClient.name);
  private static readonly ENDPOINT =
    "https://exp.host/--/api/v2/push/send";
  private static readonly BATCH = 100;

  async send(messages: ExpoPushMessage[]): Promise<{
    invalidTokens: string[];
    failedCount: number;
  }> {
    if (messages.length === 0) return { invalidTokens: [], failedCount: 0 };

    const invalid: string[] = [];
    let failed = 0;

    for (let i = 0; i < messages.length; i += ExpoPushClient.BATCH) {
      const batch = messages.slice(i, i + ExpoPushClient.BATCH);
      try {
        const res = await fetch(ExpoPushClient.ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
          },
          body: JSON.stringify(batch),
        });
        if (!res.ok) {
          failed += batch.length;
          this.logger.warn(
            `Expo push retornou ${res.status} para batch de ${batch.length}`
          );
          continue;
        }
        const payload = (await res.json()) as ExpoPushResponse;
        payload.data.forEach((ticket, idx) => {
          if (ticket.status === "ok") return;
          failed += 1;
          const err = ticket.details?.error;
          if (err === "DeviceNotRegistered" || err === "InvalidCredentials") {
            invalid.push(batch[idx].to);
          }
        });
      } catch (e) {
        failed += batch.length;
        this.logger.error(
          `Falha ao enviar batch Expo push: ${(e as Error).message}`
        );
      }
    }

    return { invalidTokens: invalid, failedCount: failed };
  }
}
