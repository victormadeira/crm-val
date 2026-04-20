import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import type { UserRole } from "@valparaiso/shared";
import { ENV_TOKEN } from "../config/config.module";
import type { Env } from "../config/env";
import { CryptoService } from "../crypto/crypto.service";
import { PrismaService } from "../prisma/prisma.service";
import { TenantContext } from "../prisma/tenant-context";
import type { JwtAccessPayload, JwtRefreshPayload } from "./auth.types";

const ARGON2_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 1 << 16, // 64 MiB
  timeCost: 3,
  parallelism: 1,
};

/**
 * Parse de TTL estilo "15m" / "30d" / "3600" (segundos) → segundos int.
 * Usado para calcular Session.expiresAt e devolver prazo pro cliente.
 */
function parseTtlSeconds(raw: string): number {
  const trimmed = raw.trim();
  const match = /^(\d+)\s*([smhd])?$/i.exec(trimmed);
  if (!match) {
    throw new Error(`TTL inválido: ${raw}`);
  }
  const n = Number(match[1]);
  const unit = (match[2] ?? "s").toLowerCase();
  switch (unit) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      throw new Error(`TTL unidade desconhecida: ${raw}`);
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTtl: number;
  private readonly refreshTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    @Inject(ENV_TOKEN) private readonly env: Env
  ) {
    this.accessTtl = parseTtlSeconds(env.JWT_ACCESS_TTL);
    this.refreshTtl = parseTtlSeconds(env.JWT_REFRESH_TTL);
  }

  /**
   * Login descobre o usuário globalmente (cross-tenant) por email, faz
   * verify Argon2, abre uma Session e devolve par de tokens. O access token
   * carrega tenantId/userId/role — a partir daqui o middleware abre o ALS.
   */
  async login(
    email: string,
    password: string,
    meta: { userAgent?: string; ip?: string }
  ): Promise<{
    user: {
      id: string;
      tenantId: string;
      email: string;
      name: string;
      role: UserRole;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessTtl: number;
      refreshTtl: number;
    };
  }> {
    const user = await TenantContext.runOutsideTenant(async () => {
      return this.prisma.user.findFirst({
        where: { email: email.toLowerCase(), active: true },
        select: {
          id: true,
          tenantId: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true,
        },
      });
    });

    // Gasta tempo de verify mesmo sem user → evita enum de email.
    const passOk = user
      ? await argon2.verify(user.passwordHash, password)
      : await argon2
          .verify(
            "$argon2id$v=19$m=65536,t=3,p=1$YWFhYWFhYWFhYWFhYWFhYQ$YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE",
            password
          )
          .catch(() => false);

    if (!user || !passOk) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const session = await this.openSession(user.id, meta);

    await TenantContext.runOutsideTenant(() =>
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
    );

    const role = user.role as UserRole;
    const access = await this.signAccess({
      sub: user.id,
      tid: user.tenantId,
      role,
      sid: session.id,
    });
    const refresh = await this.signRefresh({
      sub: user.id,
      sid: session.id,
    });

    // Só agora persiste o hash do refresh — evitamos gravar um hash
    // inválido se o signRefresh falhar.
    await TenantContext.runOutsideTenant(() =>
      this.prisma.session.update({
        where: { id: session.id },
        data: { refreshTokenHash: this.crypto.hashToken(refresh) },
      })
    );

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role,
      },
      tokens: {
        accessToken: access,
        refreshToken: refresh,
        accessTtl: this.accessTtl,
        refreshTtl: this.refreshTtl,
      },
    };
  }

  /**
   * Refresh rotativo: verifica assinatura, compara HMAC contra o hash salvo,
   * revoga a session antiga e emite um novo par. Se o refresh apresentado
   * não bater, revoga tudo do usuário (indício de roubo).
   */
  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    accessTtl: number;
    refreshTtl: number;
  }> {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException("Refresh inválido");
    }

    const incomingHash = this.crypto.hashToken(refreshToken);
    const session = await TenantContext.runOutsideTenant(() =>
      this.prisma.session.findUnique({
        where: { id: payload.sid },
        include: {
          user: {
            select: {
              id: true,
              tenantId: true,
              role: true,
              active: true,
            },
          },
        },
      })
    );

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.userId !== payload.sub ||
      !session.user?.active
    ) {
      throw new UnauthorizedException("Sessão inválida");
    }

    if (session.refreshTokenHash !== incomingHash) {
      // Indício de token vazado — derruba todas as sessions desse usuário.
      await TenantContext.runOutsideTenant(() =>
        this.prisma.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      );
      this.logger.warn(
        `Refresh com hash divergente para user ${session.userId} — sessões revogadas`
      );
      throw new UnauthorizedException("Sessão inválida");
    }

    // Revoga e cria nova.
    const now = new Date();
    await TenantContext.runOutsideTenant(() =>
      this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: now },
      })
    );

    const newSession = await this.openSession(session.userId, {
      userAgent: session.userAgent ?? undefined,
      ip: session.ip ?? undefined,
    });

    const role = session.user!.role as UserRole;
    const newAccess = await this.signAccess({
      sub: session.userId,
      tid: session.user!.tenantId,
      role,
      sid: newSession.id,
    });
    const newRefresh = await this.signRefresh({
      sub: session.userId,
      sid: newSession.id,
    });
    await TenantContext.runOutsideTenant(() =>
      this.prisma.session.update({
        where: { id: newSession.id },
        data: { refreshTokenHash: this.crypto.hashToken(newRefresh) },
      })
    );

    return {
      accessToken: newAccess,
      refreshToken: newRefresh,
      accessTtl: this.accessTtl,
      refreshTtl: this.refreshTtl,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await TenantContext.runOutsideTenant(() =>
      this.prisma.session.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    );
  }

  async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON2_OPTS);
  }

  async verifyAccessToken(token: string): Promise<JwtAccessPayload> {
    return this.jwt.verifyAsync<JwtAccessPayload>(token, {
      secret: this.env.JWT_ACCESS_SECRET,
    });
  }

  private async openSession(
    userId: string,
    meta: { userAgent?: string; ip?: string }
  ): Promise<{ id: string }> {
    const expiresAt = new Date(Date.now() + this.refreshTtl * 1000);
    const created = await TenantContext.runOutsideTenant(() =>
      this.prisma.session.create({
        data: {
          id: randomUUID(),
          userId,
          // placeholder — será atualizado assim que o refresh for assinado.
          refreshTokenHash: "pending",
          userAgent: meta.userAgent ?? null,
          ip: meta.ip ?? null,
          expiresAt,
        },
        select: { id: true },
      })
    );
    return created;
  }

  private signAccess(payload: JwtAccessPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.env.JWT_ACCESS_SECRET,
      expiresIn: this.env.JWT_ACCESS_TTL,
    });
  }

  private signRefresh(payload: JwtRefreshPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.env.JWT_REFRESH_SECRET,
      expiresIn: this.env.JWT_REFRESH_TTL,
    });
  }
}
