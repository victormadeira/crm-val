import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api/client";
import { useAuthStore } from "./auth/store";

/**
 * Setup de notificações. Pede permissão (iOS exige prompt), obtém o
 * ExpoPushToken, e registra no backend. No Android cria um channel default
 * — sem isso Android 8+ não exibe push com som.
 *
 * Chamado uma única vez ao entrar logado. Idempotente no backend.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Atendimentos",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#ff0030",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  try {
    await api.post("/push/tokens", {
      platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
      token,
      deviceId: Device.modelId ?? Device.osInternalBuildId ?? undefined,
    });
  } catch {
    /* falha silencioso — tentaremos novamente no próximo boot */
  }
  return token;
}

/**
 * Desregistra o token no backend. Usa fetch direto porque o wrapper `api`
 * não suporta body em DELETE, e queremos enviar o token específico (um
 * dispositivo pode ter múltiplos tokens históricos).
 */
export async function unregisterPushAsync(token: string): Promise<void> {
  const access = useAuthStore.getState().accessToken;
  if (!access) return;
  try {
    await fetch(`${api.baseUrl}/push/tokens`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch {
    /* ignore */
  }
}
