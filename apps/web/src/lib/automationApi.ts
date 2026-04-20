/**
 * Mapper + REST client for /api/v1/automations.
 *
 * The backend models an AutomationFlow as:
 *   { trigger, triggerCfg, graph: { startNodeId, nodes: [{ id, kind, config, next?/trueNext?/falseNext? }] } }
 *
 * The web UI models it as an ordered list of visual nodes where the first one
 * is a "gatilho" (trigger) node with x/y positions and `next: string[]`.
 *
 * The two shapes do not align 1:1, so this module does the lossy conversion in
 * both directions. We stash UI-only metadata (label, position, tipo) in the
 * node's config under `_ui` so round-tripping preserves the canvas layout.
 */

import { api } from "./api";
import type {
  AutomationNode,
  AutomationNodeTipo,
  AutomationWorkflow,
} from "./types";

/* ──────────────── Types mirroring the backend DTOs ──────────────── */

type AutomationTriggerKind =
  | "LEAD_CREATED"
  | "MESSAGE_RECEIVED"
  | "NO_REPLY_TIMEOUT"
  | "TAG_APPLIED"
  | "STAGE_CHANGED"
  | "SCORE_THRESHOLD_CROSSED"
  | "SCHEDULED_CRON";

type AutomationKind =
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

type FlowStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

interface BackendNode {
  id: string;
  kind: AutomationKind;
  config: Record<string, unknown>;
  next?: string | null;
  trueNext?: string | null;
  falseNext?: string | null;
}

interface BackendGraph {
  startNodeId: string;
  nodes: BackendNode[];
}

export interface BackendFlow {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  trigger: AutomationTriggerKind;
  triggerCfg: Record<string, unknown>;
  graph: BackendGraph;
  status: FlowStatus;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string | null;
}

interface WritePayload {
  name: string;
  description?: string;
  trigger: AutomationTriggerKind;
  triggerCfg: Record<string, unknown>;
  graph: BackendGraph;
  status?: FlowStatus;
}

/* ──────────────── Heuristics ──────────────── */

function actionKindFor(node: AutomationNode): AutomationKind {
  const cfgKind = node.config?.kind as AutomationKind | undefined;
  if (cfgKind) return cfgKind;
  const label = (node.label || "").toLowerCase();
  if (label.includes("template")) return "send_whatsapp_template";
  if (label.includes("whatsapp") || label.includes("mensagem")) return "send_whatsapp_text";
  if (label.includes("remove") && label.includes("tag")) return "remove_tag";
  if (label.includes("tag")) return "apply_tag";
  if (label.includes("corretor") || label.includes("atribu")) return "assign_auto";
  if (label.includes("stage") || label.includes("etapa")) return "change_stage";
  if (label.includes("status")) return "change_status";
  if (label.includes("nota") || label.includes("note")) return "add_note";
  if (label.includes("campo") || label.includes("field")) return "set_field";
  return "send_whatsapp_text";
}

function triggerKindFor(gatilho: AutomationNode | undefined): AutomationTriggerKind {
  const cfg = (gatilho?.config?.trigger as string | undefined)?.toUpperCase();
  if (cfg && ["LEAD_CREATED", "MESSAGE_RECEIVED", "NO_REPLY_TIMEOUT", "TAG_APPLIED", "STAGE_CHANGED", "SCORE_THRESHOLD_CROSSED", "SCHEDULED_CRON"].includes(cfg)) {
    return cfg as AutomationTriggerKind;
  }
  const label = (gatilho?.label || "").toLowerCase();
  if (label.includes("tag")) return "TAG_APPLIED";
  if (label.includes("parado") || label.includes("sem resposta")) return "NO_REPLY_TIMEOUT";
  if (label.includes("score")) return "SCORE_THRESHOLD_CROSSED";
  if (label.includes("mensagem")) return "MESSAGE_RECEIVED";
  if (label.includes("stage") || label.includes("etapa")) return "STAGE_CHANGED";
  return "LEAD_CREATED";
}

function tipoFromKind(kind: AutomationKind): AutomationNodeTipo {
  if (kind === "branch") return "condicao";
  if (kind === "wait") return "espera";
  if (kind === "stop") return "fim";
  if (kind === "ai_prompt") return "ia";
  return "acao";
}

function labelFromKind(kind: AutomationKind): string {
  const map: Record<AutomationKind, string> = {
    send_whatsapp_text: "Enviar WhatsApp",
    send_whatsapp_template: "Enviar template",
    apply_tag: "Aplicar tag",
    remove_tag: "Remover tag",
    change_stage: "Alterar etapa",
    change_status: "Alterar status",
    assign_auto: "Atribuir (auto)",
    assign_manual: "Atribuir manual",
    add_note: "Adicionar nota",
    wait: "Esperar",
    set_field: "Atualizar campo",
    branch: "Condição",
    stop: "Fim",
    ai_prompt: "IA (prompt)",
    http_request: "HTTP Request",
    set_vars: "Atualizar variáveis",
  };
  return map[kind];
}

/* ──────────────── UI → backend ──────────────── */

export function uiToBackend(workflow: AutomationWorkflow): WritePayload {
  const gatilho = workflow.nodes.find((n) => n.tipo === "gatilho");
  const nonGatilho = workflow.nodes.filter((n) => n.tipo !== "gatilho");

  if (nonGatilho.length === 0) {
    throw new Error("Fluxo precisa de pelo menos um node além do gatilho.");
  }

  const startNodeId = gatilho?.next?.[0] ?? nonGatilho[0].id;

  const nodes: BackendNode[] = nonGatilho.map((n) => {
    const uiMeta = {
      tipo: n.tipo,
      label: n.label,
      position: n.position,
    };
    const baseConfig = { ...(n.config ?? {}), _ui: uiMeta };

    if (n.tipo === "condicao" || n.tipo === "divisao") {
      return {
        id: n.id,
        kind: "branch" as const,
        config: baseConfig,
        trueNext: n.next?.[0] ?? null,
        falseNext: n.next?.[1] ?? null,
      };
    }
    if (n.tipo === "espera") {
      return {
        id: n.id,
        kind: "wait" as const,
        config: baseConfig,
        next: n.next?.[0] ?? null,
      };
    }
    if (n.tipo === "fim") {
      return { id: n.id, kind: "stop" as const, config: baseConfig };
    }
    if (n.tipo === "ia") {
      return {
        id: n.id,
        kind: "ai_prompt" as const,
        config: baseConfig,
        next: n.next?.[0] ?? null,
      };
    }
    // acao
    return {
      id: n.id,
      kind: actionKindFor(n),
      config: baseConfig,
      next: n.next?.[0] ?? null,
    };
  });

  return {
    name: workflow.nome,
    description: workflow.descricao || undefined,
    trigger: triggerKindFor(gatilho),
    triggerCfg: (gatilho?.config as Record<string, unknown>) ?? {},
    graph: { startNodeId, nodes },
    status: workflow.ativa ? "ACTIVE" : "DRAFT",
  };
}

/* ──────────────── backend → UI ──────────────── */

export function backendToUi(flow: BackendFlow): AutomationWorkflow {
  if (!flow || typeof flow !== "object") {
    throw new Error("Resposta do servidor inválida (fluxo ausente).");
  }
  const gatilhoId = `gatilho_${(flow.id ?? "new").slice(0, 6)}`;
  const graphNodes = flow.graph?.nodes ?? [];

  // Auto-layout positions when no _ui hints exist.
  const fallbackPositions = new Map<string, { x: number; y: number }>();
  graphNodes.forEach((bn, i) => {
    fallbackPositions.set(bn.id, { x: 260 + i * 320, y: 180 });
  });

  const uiNodes: AutomationNode[] = graphNodes.map((bn) => {
    const uiMeta = (bn.config?._ui ?? {}) as {
      tipo?: AutomationNodeTipo;
      label?: string;
      position?: { x: number; y: number };
    };
    const tipo = uiMeta.tipo ?? tipoFromKind(bn.kind);
    const label = uiMeta.label ?? labelFromKind(bn.kind);
    const position = uiMeta.position ?? fallbackPositions.get(bn.id) ?? { x: 280, y: 180 };
    const next: string[] =
      bn.kind === "branch"
        ? [bn.trueNext, bn.falseNext].filter((x): x is string => !!x)
        : bn.next
          ? [bn.next]
          : [];
    const { _ui: _ignored, ...restConfig } = bn.config ?? {};
    return { id: bn.id, tipo, label, position, config: restConfig, next };
  });

  const startNodeId = flow.graph?.startNodeId ?? graphNodes[0]?.id;
  const trigger = flow.trigger ?? "LEAD_CREATED";
  const gatilho: AutomationNode = {
    id: gatilhoId,
    tipo: "gatilho",
    label: triggerLabel(trigger),
    position: { x: 40, y: 180 },
    next: startNodeId ? [startNodeId] : [],
    config: { trigger, ...(flow.triggerCfg ?? {}) },
  };

  return {
    id: flow.id,
    nome: flow.name ?? "Workflow",
    descricao: flow.description ?? "",
    categoria: "pre_venda",
    ativa: flow.status === "ACTIVE",
    nodes: [gatilho, ...uiNodes],
    iniciadas: 0,
    concluidas: 0,
    convertidas: 0,
    conversao_pct: 0,
    receita_gerada: 0,
    criada_em: flow.createdAt ?? new Date().toISOString(),
    atualizada_em: flow.updatedAt ?? new Date().toISOString(),
    autor: flow.createdByUserId ?? "sistema",
  };
}

function triggerLabel(t: AutomationTriggerKind): string {
  const map: Record<AutomationTriggerKind, string> = {
    LEAD_CREATED: "Lead criado",
    MESSAGE_RECEIVED: "Mensagem recebida",
    NO_REPLY_TIMEOUT: "Sem resposta (timeout)",
    TAG_APPLIED: "Tag aplicada",
    STAGE_CHANGED: "Etapa alterada",
    SCORE_THRESHOLD_CROSSED: "Score cruzou limite",
    SCHEDULED_CRON: "Agendado",
  };
  return map[t];
}

/* ──────────────── HTTP ──────────────── */

export const automationApi = {
  list: () => api.get<BackendFlow[]>("/automations"),
  get: (id: string) => api.get<BackendFlow>(`/automations/${id}`),
  create: (payload: WritePayload) => api.post<BackendFlow>("/automations", payload),
  update: (id: string, payload: Partial<WritePayload>) =>
    api.patch<BackendFlow>(`/automations/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/automations/${id}`),
};

export async function listWorkflows(): Promise<AutomationWorkflow[]> {
  const flows = await automationApi.list();
  return flows.map(backendToUi);
}

/**
 * Some older backends return just `{ id }` on create or nothing on update.
 * This helper refetches the full flow whenever the response is incomplete.
 */
async function ensureFullFlow(
  raw: Partial<BackendFlow> | null | undefined,
  fallbackId?: string
): Promise<BackendFlow> {
  const id = raw?.id ?? fallbackId;
  if (!id) throw new Error("Servidor não retornou um id de fluxo.");
  if (raw && raw.graph && raw.name) return raw as BackendFlow;
  return automationApi.get(id);
}

export async function saveWorkflow(w: AutomationWorkflow): Promise<AutomationWorkflow> {
  const payload = uiToBackend(w);
  const isNew = !w.id || w.id.startsWith("draft_");
  const raw = isNew
    ? await automationApi.create(payload)
    : await automationApi.update(w.id, payload);
  const flow = await ensureFullFlow(raw, isNew ? undefined : w.id);
  return backendToUi(flow);
}

export async function setWorkflowActive(
  id: string,
  active: boolean
): Promise<AutomationWorkflow> {
  const raw = await automationApi.update(id, { status: active ? "ACTIVE" : "PAUSED" });
  const flow = await ensureFullFlow(raw, id);
  return backendToUi(flow);
}

export async function deleteWorkflow(id: string): Promise<void> {
  await automationApi.remove(id);
}
