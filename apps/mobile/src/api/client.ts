import Constants from "expo-constants";
import { useAuthStore } from "../auth/store";

/**
 * Cliente HTTP minimal — lê baseUrl de Expo Constants e injeta o access
 * token do Zustand automaticamente. Se receber 401, dispara refresh e
 * repete a request uma única vez; se o refresh também falhar, limpa a
 * sessão e deixa o AuthGate redirecionar para login.
 */
const apiBaseUrl =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload?: unknown
  ) {
    super(message);
  }
}

async function raw(
  method: string,
  path: string,
  token: string | null,
  body?: unknown
): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : null) ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const state = useAuthStore.getState();
  let token = state.accessToken;
  let res = await raw(method, path, token, body);
  if (res.status !== 401) return parse<T>(res);

  // Tenta refresh uma única vez.
  const refreshed = await state.refresh();
  if (!refreshed) {
    await state.logout();
    throw new ApiError(401, "Sessão expirada");
  }
  token = useAuthStore.getState().accessToken;
  res = await raw(method, path, token, body);
  return parse<T>(res);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
  baseUrl: apiBaseUrl,
};
