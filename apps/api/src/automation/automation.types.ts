import type { AutomationTriggerKind } from "@valparaiso/shared";

/**
 * Grafo de automação — estrutura que o editor visual salva em
 * AutomationFlow.graph. Execução é topológica: cada nó decide seu
 * próximo a partir de `next` (string) ou `branches` (condicional).
 *
 * Tipos mantidos estreitos propositalmente — novos kinds exigem
 * registrar um executor em `automation.actions.ts`. Sem catch-all.
 */
export type AutomationNodeKind =
  | "send_whatsapp_text"
  | "send_whatsapp_template"
  | "apply_tag"
  | "remove_tag"
  | "change_stage"
  | "change_status"
  | "assign_auto"
  | "assign_manual"
  | "add_note"
  | "wait"
  | "set_field"
  | "branch"
  | "stop"
  | "ai_prompt"
  | "http_request"
  | "set_vars";

export interface AutomationNodeBase {
  id: string;
  kind: AutomationNodeKind;
  next?: string | null;
}

export interface SendWhatsappTextNode extends AutomationNodeBase {
  kind: "send_whatsapp_text";
  config: { body: string };
}
export interface SendWhatsappTemplateNode extends AutomationNodeBase {
  kind: "send_whatsapp_template";
  config: {
    templateName: string;
    languageCode: string;
    components?: Record<string, unknown>[];
  };
}
export interface ApplyTagNode extends AutomationNodeBase {
  kind: "apply_tag";
  config: { tagId: string };
}
export interface RemoveTagNode extends AutomationNodeBase {
  kind: "remove_tag";
  config: { tagId: string };
}
export interface ChangeStageNode extends AutomationNodeBase {
  kind: "change_stage";
  config: { stageId: string };
}
export interface ChangeStatusNode extends AutomationNodeBase {
  kind: "change_status";
  config: {
    status:
      | "NEW"
      | "CONTACTED"
      | "QUALIFIED"
      | "NEGOTIATING"
      | "WON"
      | "LOST"
      | "ARCHIVED";
  };
}
export interface AssignAutoNode extends AutomationNodeBase {
  kind: "assign_auto";
  config: Record<string, never>;
}
export interface AssignManualNode extends AutomationNodeBase {
  kind: "assign_manual";
  config: { userId: string };
}
export interface AddNoteNode extends AutomationNodeBase {
  kind: "add_note";
  config: { body: string };
}
export interface WaitNode extends AutomationNodeBase {
  kind: "wait";
  config: { seconds: number };
}
export interface SetFieldNode extends AutomationNodeBase {
  kind: "set_field";
  config: {
    field: "productInterest" | "cityGuess" | "ageGuess" | "aiScore";
    value: string | number | null;
  };
}
export interface BranchNode extends AutomationNodeBase {
  kind: "branch";
  /** Condição avaliada contra o Lead no momento da execução. */
  config: {
    field:
      | "status"
      | "stageId"
      | "origin"
      | "productInterest"
      | "aiScore";
    op: "eq" | "neq" | "in" | "gte" | "lte" | "exists";
    value?: string | number | string[] | null;
  };
  /** Se verdadeiro, vai para trueNext; caso contrário, falseNext. `next` é ignorado. */
  trueNext: string | null;
  falseNext: string | null;
}
export interface StopNode extends AutomationNodeBase {
  kind: "stop";
  config: { reason?: string };
}
export interface HttpRequestNode extends AutomationNodeBase {
  kind: "http_request";
  config: {
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    body?: unknown;
    /** Nome da var onde o JSON de resposta é armazenado. Default: http_response. */
    outputVar?: string;
    /** Timeout em ms. Default 10_000, max 30_000. */
    timeoutMs?: number;
  };
}
export interface SetVarsNode extends AutomationNodeBase {
  kind: "set_vars";
  config: {
    /** Mapa nome→valor. Valores podem conter expressões ({{lead.nome}}). */
    vars: Record<string, string>;
  };
}
export interface AiPromptNode extends AutomationNodeBase {
  kind: "ai_prompt";
  config: {
    /** Template do prompt — suporta {{lead.nome}}, {{event.text}}, {{vars.*}}. */
    prompt: string;
    /** Nome da variável onde o texto resposta da IA é armazenado (default: ai_result). */
    outputVar?: string;
    /** Modelo Claude. Default: haiku-4.5. */
    model?: string;
    /** 0..1. Default 0.3. */
    temperature?: number;
    /** Máximo de tokens na resposta. Default 512. */
    maxTokens?: number;
  };
}

export type AutomationNode =
  | SendWhatsappTextNode
  | SendWhatsappTemplateNode
  | ApplyTagNode
  | RemoveTagNode
  | ChangeStageNode
  | ChangeStatusNode
  | AssignAutoNode
  | AssignManualNode
  | AddNoteNode
  | WaitNode
  | SetFieldNode
  | BranchNode
  | StopNode
  | AiPromptNode
  | HttpRequestNode
  | SetVarsNode;

export interface AutomationGraph {
  startNodeId: string;
  nodes: AutomationNode[];
}

/**
 * Eventos publicados em AutomationBus por outros módulos (Leads,
 * WhatsApp). O dispatcher casa cada evento com os flows do tenant
 * cujo `trigger` bate, respeitando `triggerCfg` como filtro.
 */
export type AutomationEvent =
  | {
      kind: "LEAD_CREATED";
      tenantId: string;
      leadId: string;
      origin?: string;
    }
  | {
      kind: "MESSAGE_RECEIVED";
      tenantId: string;
      leadId: string | null;
      conversationId: string;
      text?: string;
    }
  | {
      kind: "TAG_APPLIED";
      tenantId: string;
      leadId: string;
      tagId: string;
    }
  | {
      kind: "STAGE_CHANGED";
      tenantId: string;
      leadId: string;
      fromStageId: string | null;
      toStageId: string;
    }
  | {
      kind: "SCORE_THRESHOLD_CROSSED";
      tenantId: string;
      leadId: string;
      score: number;
      threshold: number;
    }
  | {
      kind: "NO_REPLY_TIMEOUT";
      tenantId: string;
      leadId: string;
      conversationId: string;
      sinceHours: number;
    }
  | {
      kind: "SCHEDULED_CRON_FIRED";
      tenantId: string;
      triggerCfg: unknown;
      firedAt: string;
    };

export type AutomationEventKind = AutomationEvent["kind"];

/** Mapeia AutomationEvent.kind → AutomationTriggerKind (Prisma enum). */
export const EVENT_TO_TRIGGER: Record<
  AutomationEventKind,
  AutomationTriggerKind
> = {
  LEAD_CREATED: "LEAD_CREATED",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  TAG_APPLIED: "TAG_APPLIED",
  STAGE_CHANGED: "STAGE_CHANGED",
  SCORE_THRESHOLD_CROSSED: "SCORE_THRESHOLD_CROSSED",
  NO_REPLY_TIMEOUT: "NO_REPLY_TIMEOUT",
  SCHEDULED_CRON_FIRED: "SCHEDULED_CRON",
};

/**
 * Contexto que acompanha cada execução — persistido no
 * AutomationRun.context como snapshot do evento que disparou.
 */
export interface AutomationRunContext {
  event: AutomationEvent;
  /** Variáveis acumuladas por nós anteriores (ex.: noteId gerado). */
  vars: Record<string, unknown>;
}
