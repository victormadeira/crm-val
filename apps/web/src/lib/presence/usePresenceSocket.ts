import { useEffect, useRef } from 'react';
import { usePresenceStore } from './presenceStore';
import {
  PresenceSyncPayload,
  PresenceUpdatedPayload,
  PresenceLeftPayload,
  UpdateStatusDto,
} from './presence.types';

// ─────────────────────────────────────────────────────────────────────────────
// usePresenceSocket
//
// Hook que gerencia a conexão Socket.io com o namespace /presence.
// Deve ser montado UMA VEZ na raiz da aplicação (ex: AppShell ou App.tsx)
// por usuários com papel de supervisor/gestor/admin.
//
// Em desenvolvimento (sem servidor WS), o store usa dados mock automaticamente.
// ─────────────────────────────────────────────────────────────────────────────

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';
const HEARTBEAT_INTERVAL = 60_000; // 60 segundos

export function usePresenceSocket(token: string | null) {
  const socketRef = useRef<any>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { _sync, _update, _leave, _setConnected } = usePresenceStore();

  useEffect(() => {
    // Sem token ou sem URL de WS configurada → mantém dados mock
    if (!token || !import.meta.env.VITE_WS_URL) return;

    // Importação dinâmica para não quebrar builds sem socket.io-client instalado
    import('socket.io-client').then(({ io }) => {
      const socket = io(`${WS_URL}/presence`, {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        _setConnected(true);
        // Inicia heartbeat
        heartbeatRef.current = setInterval(() => {
          socket.emit('presence:heartbeat');
        }, HEARTBEAT_INTERVAL);
      });

      socket.on('disconnect', () => {
        _setConnected(false);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      });

      socket.on('presence:sync', (payload: PresenceSyncPayload) => {
        _sync(payload);
      });

      socket.on('presence:updated', (payload: PresenceUpdatedPayload) => {
        _update(payload);
      });

      socket.on('presence:left', (payload: PresenceLeftPayload) => {
        _leave(payload);
      });
    }).catch(() => {
      // socket.io-client não instalado → modo mock silencioso
    });

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      socketRef.current?.disconnect();
    };
  }, [token]);

  /**
   * Emite uma atualização de status do próprio usuário.
   * Chamado pelos hooks de integração do CRM (ex: ao abrir uma conversa).
   */
  const emitStatusUpdate = (dto: UpdateStatusDto) => {
    socketRef.current?.emit('presence:update', dto);
  };

  return { emitStatusUpdate };
}
