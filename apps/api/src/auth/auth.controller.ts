import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UsePipes,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import {
  LoginInputSchema,
  RefreshInputSchema,
  type LoginInput,
  type RefreshInput,
  type LoginResponse,
} from "@valparaiso/shared";
import { Public } from "../tenant/tenant.guard";
import { AuthService } from "./auth.service";
import { CurrentAuth } from "./auth.decorators";
import type { AuthContext } from "./auth.types";
import { ZodValidationPipe } from "./zod.pipe";

/**
 * Controller de autenticação. /login e /refresh são @Public (sem
 * TenantContext) — a própria rota abre contexto depois de identificar
 * o usuário. /me e /logout exigem access token válido.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post("login")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(LoginInputSchema))
  async login(
    @Body() body: LoginInput,
    @Req() req: Request
  ): Promise<LoginResponse> {
    const { user, tokens } = await this.auth.login(body.email, body.password, {
      userAgent: req.headers["user-agent"] ?? undefined,
      ip: req.ip,
    });
    return { user, tokens };
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post("refresh")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(RefreshInputSchema))
  async refresh(@Body() body: RefreshInput) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@CurrentAuth() auth: AuthContext | undefined): Promise<void> {
    if (!auth) throw new UnauthorizedException();
    await this.auth.logout(auth.sessionId);
  }

  @Get("me")
  me(@CurrentAuth() auth: AuthContext | undefined) {
    if (!auth) throw new UnauthorizedException();
    return {
      userId: auth.userId,
      tenantId: auth.tenantId,
      role: auth.role,
    };
  }
}
