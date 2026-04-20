import { z } from "zod";

export const PUSH_PLATFORMS = ["IOS", "ANDROID", "WEB"] as const;
export type PushPlatform = (typeof PUSH_PLATFORMS)[number];

/**
 * Registro de push token. Expo entrega tokens no formato
 * `ExponentPushToken[xxxx]` para iOS/Android — o backend usa o Expo Push
 * Service diretamente, sem depender de credenciais FCM próprias.
 */
export const RegisterPushTokenSchema = z.object({
  platform: z.enum(PUSH_PLATFORMS),
  token: z.string().min(10).max(500),
  deviceId: z.string().max(120).optional(),
});
export type RegisterPushTokenInput = z.infer<typeof RegisterPushTokenSchema>;

export const UnregisterPushTokenSchema = z.object({
  token: z.string().min(10).max(500),
});
export type UnregisterPushTokenInput = z.infer<typeof UnregisterPushTokenSchema>;
