import { Module } from '@nestjs/common';
import { PresenceGateway } from './presence.gateway';
import { PresenceService } from './presence.service';

/**
 * PresenceModule
 *
 * Registra o Gateway WebSocket e o Service de presença.
 * Deve ser importado no AppModule raiz do NestJS.
 *
 * Pré-requisitos no AppModule:
 *   - RedisModule (ex: @nestjs-modules/ioredis) configurado com a URL do Redis
 *   - Se usar JWT Auth Guard no WS, registrar o AuthModule aqui também
 *
 * Exemplo de importação no AppModule:
 *
 *   @Module({
 *     imports: [
 *       RedisModule.forRoot({ config: { url: process.env.REDIS_URL } }),
 *       PresenceModule,
 *       // ... outros módulos
 *     ],
 *   })
 *   export class AppModule {}
 */
@Module({
  providers: [PresenceGateway, PresenceService],
  exports: [PresenceService, PresenceGateway],
})
export class PresenceModule {}
