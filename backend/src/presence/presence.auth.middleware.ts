import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './presence.types';

/**
 * Middleware de autenticação para o namespace /presence.
 *
 * Valida o JWT enviado no handshake do socket e popula `socket.data`
 * com o contexto do usuário, que é então consumido pelo Gateway.
 *
 * Integração com o NestJS existente:
 * O JwtService já configurado no módulo de auth do CRM é injetado aqui.
 *
 * Registro no Gateway (no método afterInit):
 *
 *   afterInit(server: Server) {
 *     server.use(createPresenceAuthMiddleware(this.jwtService));
 *   }
 *
 * O cliente deve enviar o token no handshake:
 *   const socket = io('/presence', {
 *     auth: { token: 'Bearer eyJ...' }
 *   });
 */
export function createPresenceAuthMiddleware(jwtService: JwtService) {
  return async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const raw: string =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization ??
        '';

      const token = raw.replace(/^Bearer\s+/i, '');
      if (!token) {
        return next(new Error('Token de autenticação ausente'));
      }

      // Decodifica e valida o JWT usando o mesmo segredo do CRM
      const payload = jwtService.verify<{
        sub: string;
        tenantId: string;
        nome: string;
        role: UserRole;
      }>(token);

      // Popula socket.data para uso no Gateway
      socket.data = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        nome: payload.nome,
        role: payload.role,
      };

      return next();
    } catch (err) {
      return next(new Error('Token inválido ou expirado'));
    }
  };
}
