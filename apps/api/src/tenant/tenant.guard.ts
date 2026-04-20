import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

/**
 * Marker — rotas marcadas com @Public() não exigem autenticação nem
 * contexto de tenant (ex: /health, /webhooks/meta, /auth/login).
 */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Shape esperado no Request após o JwtAuthGuard rodar. O TenantMiddleware
 * (ver tenant.middleware.ts) consome esses campos e abre o AsyncLocalStorage.
 */
export interface AuthedRequest {
  tenantId?: string;
  userId?: string;
}

/**
 * TenantGuard — roda DEPOIS do JwtAuthGuard. Apenas valida que tenantId
 * e userId chegaram populados. O contexto de tenant em si é aberto pelo
 * TenantMiddleware, que é o único lugar onde AsyncLocalStorage.run()
 * consegue embrulhar a cadeia inteira (incluindo handlers async).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.tenantId || !req.userId) {
      throw new UnauthorizedException("Autenticação exigida");
    }
    return true;
  }
}
