import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "../prisma/prisma.module";
import { CryptoModule } from "../crypto/crypto.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthMiddleware } from "./auth.middleware";
import { RolesGuard } from "./roles.guard";

/**
 * AuthModule — provê AuthService, AuthMiddleware (registrado globalmente
 * no AppModule) e o RolesGuard global. O JwtModule vem registrado sem
 * secret default: tanto sign quanto verify recebem secret explícito por
 * operação (access vs refresh usam chaves diferentes).
 */
@Module({
  imports: [PrismaModule, CryptoModule, JwtModule.register({})],
  providers: [
    AuthService,
    AuthMiddleware,
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
  exports: [AuthService, AuthMiddleware],
})
export class AuthModule {}
