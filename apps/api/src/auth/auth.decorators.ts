import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthContext } from "./auth.types";

/**
 * @CurrentAuth() — injeta o AuthContext já populado pelo AuthMiddleware.
 * Use nos controllers para descobrir userId/tenantId/role/sessionId. Em
 * rotas @Public retorna undefined.
 */
export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext | undefined => {
    const req = ctx.switchToHttp().getRequest<{ auth?: AuthContext }>();
    return req.auth;
  }
);
