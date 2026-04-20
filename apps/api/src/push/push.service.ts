import { Injectable, Logger } from "@nestjs/common";
import type {
  RegisterPushTokenInput,
  UnregisterPushTokenInput,
} from "@valparaiso/shared";
import { PrismaService } from "../prisma/prisma.service";
import { scopedData } from "../prisma/scoped-data";
import { ExpoPushClient } from "./expo-push.client";

export interface NotifyInput {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * PushService — central de notificações push. Usa Expo Push Service para
 * todos os dispositivos (iOS/Android/web via Expo). O fluxo:
 *   1. registerToken — mobile chama ao abrir o app (idempotente via upsert).
 *   2. notifyUsers — outros módulos (WaWorker, Automation) chamam quando
 *      há evento relevante para o atendente designado.
 *   3. Tokens que o Expo responde como inválidos são removidos.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expo: ExpoPushClient
  ) {}

  async registerToken(
    userId: string,
    input: RegisterPushTokenInput
  ): Promise<{ id: string }> {
    const existing = await this.prisma.scoped.pushToken.findFirst({
      where: { userId, token: input.token },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.scoped.pushToken.update({
        where: { id: existing.id },
        data: {
          platform: input.platform,
          deviceId: input.deviceId ?? null,
          lastSeenAt: new Date(),
        },
      });
      return { id: existing.id };
    }
    const created = await this.prisma.scoped.pushToken.create({
      data: scopedData({
        userId,
        platform: input.platform,
        token: input.token,
        deviceId: input.deviceId ?? null,
        lastSeenAt: new Date(),
      }),
      select: { id: true },
    });
    return { id: created.id };
  }

  async unregisterToken(
    userId: string,
    input: UnregisterPushTokenInput
  ): Promise<void> {
    await this.prisma.scoped.pushToken.deleteMany({
      where: { userId, token: input.token },
    });
  }

  async notifyUsers(input: NotifyInput): Promise<void> {
    if (input.userIds.length === 0) return;

    const tokens = await this.prisma.scoped.pushToken.findMany({
      where: { userId: { in: input.userIds } },
      select: { id: true, token: true },
    });
    if (tokens.length === 0) return;

    const messages = tokens.map((t) => ({
      to: t.token,
      title: input.title,
      body: input.body,
      data: input.data,
      sound: "default" as const,
      channelId: "default",
    }));

    const { invalidTokens, failedCount } = await this.expo.send(messages);
    if (failedCount > 0) {
      this.logger.warn(
        `Push: ${failedCount}/${messages.length} falharam, ${invalidTokens.length} tokens inválidos`
      );
    }
    if (invalidTokens.length > 0) {
      await this.prisma.scoped.pushToken.deleteMany({
        where: { token: { in: invalidTokens } },
      });
    }
  }
}
