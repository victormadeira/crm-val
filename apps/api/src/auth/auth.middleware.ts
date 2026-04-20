import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { TenantContext } from "../prisma/tenant-context";
import { AuthService } from "./auth.service";
import type { AuthContext } from "./auth.types";

/**
 * Middleware único de autenticação + abertura do TenantContext. Roda
 * ANTES de qualquer guard (ordem natural do Nest: middleware → guards).
 *
 * Fluxo:
 *   1. Extrai Bearer do header Authorization (se ausente, segue sem auth).
 *   2. Verifica o access token com JWT_ACCESS_SECRET.
 *   3. Popula req.auth / req.tenantId / req.userId.
 *   4. Embrulha next() em TenantContext.run() — assim o ALS cobre todos
 *      os awaits dos handlers async.
 *
 * Se o token estiver presente mas inválido, responde 401 direto (fail-hard).
 * Se ausente, next() sem contexto; rotas @Public funcionam; rotas protegidas
 * serão barradas pelo TenantGuard.
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly auth: AuthService) {}

  async use(
    req: Request & { auth?: AuthContext; tenantId?: string; userId?: string },
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const header = req.headers.authorization ?? "";
    const match = /^Bearer\s+(.+)$/.exec(header);
    if (!match) {
      return next();
    }

    const token = match[1];
    try {
      const payload = await this.auth.verifyAccessToken(token);
      const ctx: AuthContext = {
        userId: payload.sub,
        tenantId: payload.tid,
        role: payload.role,
        sessionId: payload.sid,
      };
      req.auth = ctx;
      req.tenantId = ctx.tenantId;
      req.userId = ctx.userId;
      TenantContext.run({ tenantId: ctx.tenantId, userId: ctx.userId }, () =>
        next()
      );
    } catch {
      res.status(401).json({
        statusCode: 401,
        error: "Unauthorized",
        message: "Token inválido ou expirado",
      });
    }
  }
}
