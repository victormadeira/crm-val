/**
 * Minimal HTTP client for the Valparaiso API.
 *
 * - Holds JWT access/refresh tokens in localStorage.
 * - Auto-logs-in with dev credentials (overridable via Vite env) on the first
 *   401 so the SPA boots without a separate login page during development.
 * - Auto-refreshes the access token on 401 and retries the original request.
 *
 * Endpoints are relative to /api/v1 (Vite proxies to localhost:3000 in dev).
 */

const API_BASE = "/api/v1";
const ACCESS_KEY = "vlp.auth.access";
const REFRESH_KEY = "vlp.auth.refresh";

const DEV_EMAIL =
  (import.meta as any).env?.VITE_DEV_ADMIN_EMAIL ?? "admin@valparaiso.local";
const DEV_PASSWORD =
  (import.meta as any).env?.VITE_DEV_ADMIN_PASSWORD ?? "changeme-local-only";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTtl: number;
  refreshTtl: number;
}

interface LoginResponse {
  user: { id: string; tenantId: string; email: string; name: string; role: string };
  tokens: AuthTokens;
}

function readTokens(): AuthTokens | null {
  try {
    const access = localStorage.getItem(ACCESS_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!access || !refresh) return null;
    return { accessToken: access, refreshToken: refresh, accessTtl: 0, refreshTtl: 0 };
  } catch {
    return null;
  }
}

function writeTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string
  ) {
    super(message ?? `HTTP ${status}`);
  }
}

let loginInFlight: Promise<AuthTokens> | null = null;
let refreshInFlight: Promise<AuthTokens> | null = null;

async function devLogin(): Promise<AuthTokens> {
  if (loginInFlight) return loginInFlight;
  loginInFlight = (async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
    });
    if (!res.ok) {
      clearTokens();
      throw new ApiError(res.status, await safeJson(res), "Login falhou");
    }
    const data = (await res.json()) as LoginResponse;
    writeTokens(data.tokens);
    return data.tokens;
  })();
  try {
    return await loginInFlight;
  } finally {
    loginInFlight = null;
  }
}

async function tryRefresh(refreshToken: string): Promise<AuthTokens | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new ApiError(res.status, await safeJson(res));
    const data = (await res.json()) as { tokens: AuthTokens };
    writeTokens(data.tokens);
    return data.tokens;
  })();
  try {
    return await refreshInFlight;
  } catch {
    return null;
  } finally {
    refreshInFlight = null;
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function ensureToken(): Promise<string> {
  const existing = readTokens();
  if (existing?.accessToken) return existing.accessToken;
  const fresh = await devLogin();
  return fresh.accessToken;
}

async function rawRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await safeJson(res);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await ensureToken();
  try {
    return await rawRequest<T>(method, path, body, token);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;
    // 401 — try refresh, then fall back to dev login
    const existing = readTokens();
    let next: AuthTokens | null = null;
    if (existing?.refreshToken) next = await tryRefresh(existing.refreshToken);
    if (!next) {
      clearTokens();
      next = await devLogin();
    }
    return rawRequest<T>(method, path, body, next.accessToken);
  }
}

export const api = {
  get: <T>(path: string) => apiRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>("PATCH", path, body),
  delete: <T>(path: string) => apiRequest<T>("DELETE", path),
};

export function clearSession() {
  clearTokens();
}
