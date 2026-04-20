import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@valparaiso/shared";
import type { AuthContext } from "./auth.types";

export const ROLES_KEY = "requiredRoles";

/**
 * Decorator — use em controllers/handlers para exigir um conjunto de
 * roles. Ex: `@Roles("ADMIN", "SUPERVISOR")`. Sem @Roles, qualquer
 * usuário autenticado passa (o TenantGuard já exigiu auth).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!required || required.length === 0) return true;

    const req = context
      .switchToHttp()
      .getRequest<{ auth?: AuthContext }>();
    const role = req.auth?.role;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException("Permissão insuficiente");
    }
    return true;
  }
}
