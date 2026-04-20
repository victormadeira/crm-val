import type { UserRole } from "@valparaiso/shared";

/**
 * Payload assinado no access token. Curto por design — tudo que o guard
 * precisa pra decidir autorização em O(1), sem round-trip ao banco.
 */
export interface JwtAccessPayload {
  sub: string; // userId
  tid: string; // tenantId
  role: UserRole;
  sid: string; // sessionId (p/ revogação via Session.revokedAt no refresh)
}

/**
 * Payload do refresh token — carrega sessionId p/ localização direta e
 * userId p/ falha rápida. O matching real usa HMAC(refresh) == Session.refreshTokenHash.
 */
export interface JwtRefreshPayload {
  sub: string; // userId
  sid: string; // sessionId
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  sessionId: string;
}
