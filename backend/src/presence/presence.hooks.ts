/**
 * presence.hooks.ts
 *
 * Funções auxiliares para que outros módulos do CRM (WhatsApp, SAC, Bot)
 * atualizem a presença dos usuários de forma transparente.
 *
 * Uso típico — injetar PresenceService e chamar os hooks nos pontos certos:
 *
 *   // No WhatsAppService, quando um corretor abre uma conversa:
 *   await presenceHooks.onChatOpened(tenantId, corretorId, lead);
 *
 *   // No WhatsAppService, quando uma conversa é encerrada:
 *   await presenceHooks.onChatClosed(tenantId, corretorId);
 *
 *   // No VoiceAIService, quando uma ligação começa:
 *   await presenceHooks.onCallStarted(tenantId, userId, lead);
 *
 *   // No BotService, quando o bot processa uma mensagem:
 *   await presenceHooks.onBotProcessing(tenantId, botId, conversa);
 */

import { Injectable } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceGateway } from './presence.gateway';

@Injectable()
export class PresenceHooks {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly presenceGateway: PresenceGateway,
  ) {}

  /**
   * Chamado quando um corretor/SAC abre uma conversa de chat.
   */
  async onChatOpened(
    tenantId: string,
    userId: string,
    lead: { id: string; nome: string },
    channel: 'whatsapp' | 'instagram' = 'whatsapp',
  ): Promise<void> {
    await this.presenceService.updateStatus(tenantId, userId, 'busy_chat', {
      type: channel,
      targetId: lead.id,
      targetName: lead.nome,
      startedAt: new Date().toISOString(),
    });
    this.presenceGateway.broadcastPresenceUpdate(tenantId, userId);
  }

  /**
   * Chamado quando uma conversa de chat é encerrada ou o corretor navega para fora.
   */
  async onChatClosed(tenantId: string, userId: string): Promise<void> {
    await this.presenceService.updateStatus(tenantId, userId, 'online_idle');
    this.presenceGateway.broadcastPresenceUpdate(tenantId, userId);
  }

  /**
   * Chamado quando uma ligação começa.
   */
  async onCallStarted(
    tenantId: string,
    userId: string,
    lead: { id: string; nome: string },
  ): Promise<void> {
    await this.presenceService.updateStatus(tenantId, userId, 'busy_call', {
      type: 'ligacao',
      targetId: lead.id,
      targetName: lead.nome,
      startedAt: new Date().toISOString(),
    });
    this.presenceGateway.broadcastPresenceUpdate(tenantId, userId);
  }

  /**
   * Chamado quando uma ligação termina.
   */
  async onCallEnded(tenantId: string, userId: string): Promise<void> {
    await this.presenceService.updateStatus(tenantId, userId, 'online_idle');
    this.presenceGateway.broadcastPresenceUpdate(tenantId, userId);
  }

  /**
   * Chamado quando um agente de IA (bot) começa a processar uma mensagem.
   */
  async onBotProcessing(
    tenantId: string,
    botId: string,
    conversa: { id: string; leadNome: string },
  ): Promise<void> {
    await this.presenceService.updateStatus(tenantId, botId, 'busy_chat', {
      type: 'bot_processing',
      targetId: conversa.id,
      targetName: conversa.leadNome,
      startedAt: new Date().toISOString(),
    });
    this.presenceGateway.broadcastPresenceUpdate(tenantId, botId);
  }

  /**
   * Atualiza as métricas do dia de um usuário.
   * Chamado pelo serviço de atendimento ao fechar uma conversa.
   */
  async updateDayMetrics(
    tenantId: string,
    userId: string,
    metrics: { atendimentosHoje?: number; tempoMedioResposta?: number; filaAtual?: number },
  ): Promise<void> {
    await this.presenceService.updateMetrics(tenantId, userId, metrics);
    this.presenceGateway.broadcastPresenceUpdate(tenantId, userId);
  }
}
