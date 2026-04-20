import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { create } from "zustand";

/**
 * Auth store — persiste {access, refresh} no SecureStore do dispositivo.
 * A rotação de refresh é feita aqui porque a API revoga o refresh antigo
 * a cada uso — precisamos atualizar o storage atômico. Se refresh falha,
 * `logout` zera tudo e o AuthGate leva pro LoginScreen.
 */
const TOKENS_KEY = "valparaiso.tokens.v1";
const apiBaseUrl =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://localhost:3000";

export type UserRole =
  | "ADMIN"
  | "SUPERVISOR"
  | "ATTENDANT"
  | "MARKETING"
  | "FINANCE"
  | "PARK_MANAGER";

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: UserRole;
  name?: string;
  email?: string;
}

interface AuthState {
  booted: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  /** Lida e promove tokens do SecureStore na partida. */
  boot: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser) => void;
}

async function saveTokens(
  access: string | null,
  refresh: string | null
): Promise<void> {
  if (!access || !refresh) {
    await SecureStore.deleteItemAsync(TOKENS_KEY);
    return;
  }
  await SecureStore.setItemAsync(
    TOKENS_KEY,
    JSON.stringify({ access, refresh })
  );
}

export const useAuthStore = create<AuthState>((set, get) => ({
  booted: false,
  accessToken: null,
  refreshToken: null,
  user: null,

  async boot() {
    try {
      const raw = await SecureStore.getItemAsync(TOKENS_KEY);
      if (!raw) {
        set({ booted: true });
        return;
      }
      const parsed = JSON.parse(raw) as { access: string; refresh: string };
      set({
        accessToken: parsed.access,
        refreshToken: parsed.refresh,
        booted: true,
      });
      // Revalida — /auth/me confirma que o access ainda é bom. Se 401, roda refresh.
      try {
        const res = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.access}` },
        });
        if (res.ok) {
          const me = (await res.json()) as AuthUser;
          set({ user: me });
          return;
        }
      } catch {
        /* offline — confia no storage e segue; requests vão revalidar */
      }
      const ok = await get().refresh();
      if (!ok) await get().logout();
    } catch {
      set({ booted: true });
    }
  },

  async login(email, password) {
    const res = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { message?: string }
        | null;
      throw new Error(data?.message ?? "Falha no login");
    }
    const data = (await res.json()) as {
      user: { id: string; tenantId: string; role: UserRole; name: string; email: string };
      tokens: { accessToken: string; refreshToken: string };
    };
    await saveTokens(data.tokens.accessToken, data.tokens.refreshToken);
    set({
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      user: {
        userId: data.user.id,
        tenantId: data.user.tenantId,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
      },
    });
  },

  async refresh() {
    const refreshToken = get().refreshToken;
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      await saveTokens(data.accessToken, data.refreshToken);
      set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return true;
    } catch {
      return false;
    }
  },

  async logout() {
    const token = get().accessToken;
    if (token) {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    await saveTokens(null, null);
    set({ accessToken: null, refreshToken: null, user: null });
  },

  setUser(u) {
    set({ user: u });
  },
}));
