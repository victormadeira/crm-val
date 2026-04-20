/**
 * Templates de workflow pré-definidos, completos e prontos para salvar.
 *
 * Cada template já vem com um grafo coerente (gatilho → nodes → fim),
 * posições em grid de 20px e branches quando fizer sentido. Ao clicar
 * em "Usar template", o objeto retornado por `instantiateTemplate` é
 * enviado ao backend via POST /automations.
 */

import type { AutomationNode, AutomationWorkflow } from "./types";

export interface WorkflowTemplate {
  id: string;
  nome: string;
  categoria: AutomationWorkflow["categoria"];
  descricao: string;
  /** Fábrica para evitar mutação — cada chamada devolve um novo grafo com IDs frescos. */
  buildNodes: () => AutomationNode[];
}

/* ─── Helpers de IDs + posicionamento ─── */

const nid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 7)}`;

/** Distância horizontal entre colunas (múltiplo de 5). */
const COL = 320;
/** Ponto central vertical do canvas. */
const ROW = 200;
/** Offset para ramos true/false. */
const BRANCH_OFFSET = 160;

/* ─────────────────────────── Templates ─────────────────────────── */

/** T1 — Boas-vindas a lead Instagram */
function buildBoasVindasIG(): AutomationNode[] {
  const gatilho = nid("gatilho");
  const espera1 = nid("espera");
  const saudacao = nid("acao");
  const condResposta = nid("cond");
  const atribuir = nid("acao");
  const fimOk = nid("fim");
  const espera2 = nid("espera");
  const followup = nid("acao");
  const fimFollow = nid("fim");

  return [
    {
      id: gatilho,
      tipo: "gatilho",
      label: "Lead Instagram criado",
      position: { x: 40, y: ROW },
      next: [espera1],
      config: { trigger: "LEAD_CREATED", origem: "instagram" },
    },
    {
      id: espera1,
      tipo: "espera",
      label: "Esperar 5 min",
      position: { x: 40 + COL, y: ROW },
      next: [saudacao],
      config: { delay_min: 5 },
    },
    {
      id: saudacao,
      tipo: "acao",
      label: "Enviar WhatsApp (boas-vindas)",
      position: { x: 40 + COL * 2, y: ROW },
      next: [condResposta],
      config: { kind: "send_whatsapp_template", template: "boas_vindas_ig" },
    },
    {
      id: condResposta,
      tipo: "condicao",
      label: "Respondeu em 30 min?",
      position: { x: 40 + COL * 3, y: ROW },
      next: [atribuir, espera2],
      config: { metric: "respondeu", window_min: 30 },
    },
    {
      id: atribuir,
      tipo: "acao",
      label: "Atribuir corretor",
      position: { x: 40 + COL * 4, y: ROW - BRANCH_OFFSET },
      next: [fimOk],
      config: { kind: "assign_auto" },
    },
    {
      id: fimOk,
      tipo: "fim",
      label: "Qualificado",
      position: { x: 40 + COL * 5, y: ROW - BRANCH_OFFSET },
      next: [],
      config: {},
    },
    {
      id: espera2,
      tipo: "espera",
      label: "Esperar 1h",
      position: { x: 40 + COL * 4, y: ROW + BRANCH_OFFSET },
      next: [followup],
      config: { delay_min: 60 },
    },
    {
      id: followup,
      tipo: "acao",
      label: "Enviar follow-up",
      position: { x: 40 + COL * 5, y: ROW + BRANCH_OFFSET },
      next: [fimFollow],
      config: { kind: "send_whatsapp_text" },
    },
    {
      id: fimFollow,
      tipo: "fim",
      label: "Follow-up enviado",
      position: { x: 40 + COL * 6, y: ROW + BRANCH_OFFSET },
      next: [],
      config: {},
    },
  ];
}

/** T2 — Cadência de renovação D-60 */
function buildRenovacaoD60(): AutomationNode[] {
  const gatilho = nid("gatilho");
  const toque1 = nid("acao");
  const esp1 = nid("espera");
  const toque2 = nid("acao");
  const esp2 = nid("espera");
  const toque3 = nid("acao");
  const fim = nid("fim");
  return [
    {
      id: gatilho,
      tipo: "gatilho",
      label: "Passaporte vence em 60 dias",
      position: { x: 40, y: ROW },
      next: [toque1],
      config: { trigger: "SCHEDULED_CRON", rule: "passaporte_d60" },
    },
    {
      id: toque1,
      tipo: "acao",
      label: "WhatsApp — 5% off",
      position: { x: 40 + COL, y: ROW },
      next: [esp1],
      config: { kind: "send_whatsapp_template", template: "renovacao_5off" },
    },
    {
      id: esp1,
      tipo: "espera",
      label: "Esperar 2 dias",
      position: { x: 40 + COL * 2, y: ROW },
      next: [toque2],
      config: { delay_min: 2880 },
    },
    {
      id: toque2,
      tipo: "acao",
      label: "WhatsApp — 10% off",
      position: { x: 40 + COL * 3, y: ROW },
      next: [esp2],
      config: { kind: "send_whatsapp_template", template: "renovacao_10off" },
    },
    {
      id: esp2,
      tipo: "espera",
      label: "Esperar 2 dias",
      position: { x: 40 + COL * 4, y: ROW },
      next: [toque3],
      config: { delay_min: 2880 },
    },
    {
      id: toque3,
      tipo: "acao",
      label: "WhatsApp — 15% off (última chance)",
      position: { x: 40 + COL * 5, y: ROW },
      next: [fim],
      config: { kind: "send_whatsapp_template", template: "renovacao_15off" },
    },
    {
      id: fim,
      tipo: "fim",
      label: "Cadência encerrada",
      position: { x: 40 + COL * 6, y: ROW },
      next: [],
      config: {},
    },
  ];
}

/** T3 — NPS pós-venda + indicação */
function buildNpsIndicacao(): AutomationNode[] {
  const gatilho = nid("gatilho");
  const nps = nid("acao");
  const cond = nid("cond");
  const indic = nid("acao");
  const fimPromo = nid("fim");
  const notificar = nid("acao");
  const fimDetr = nid("fim");
  return [
    {
      id: gatilho,
      tipo: "gatilho",
      label: "7 dias pós-venda",
      position: { x: 40, y: ROW },
      next: [nps],
      config: { trigger: "SCHEDULED_CRON", rule: "pos_venda_d7" },
    },
    {
      id: nps,
      tipo: "acao",
      label: "Enviar pesquisa NPS",
      position: { x: 40 + COL, y: ROW },
      next: [cond],
      config: { kind: "send_whatsapp_template", template: "nps" },
    },
    {
      id: cond,
      tipo: "condicao",
      label: "Score ≥ 9?",
      position: { x: 40 + COL * 2, y: ROW },
      next: [indic, notificar],
      config: { metric: "nps_score", operator: ">=", value: 9 },
    },
    {
      id: indic,
      tipo: "acao",
      label: "Enviar link de indicação",
      position: { x: 40 + COL * 3, y: ROW - BRANCH_OFFSET },
      next: [fimPromo],
      config: { kind: "send_whatsapp_template", template: "indique_ganhe" },
    },
    {
      id: fimPromo,
      tipo: "fim",
      label: "Promotor engajado",
      position: { x: 40 + COL * 4, y: ROW - BRANCH_OFFSET },
      next: [],
      config: {},
    },
    {
      id: notificar,
      tipo: "acao",
      label: "Notificar gestor (detrator)",
      position: { x: 40 + COL * 3, y: ROW + BRANCH_OFFSET },
      next: [fimDetr],
      config: { kind: "add_note", channel: "gestor" },
    },
    {
      id: fimDetr,
      tipo: "fim",
      label: "Caso escalado",
      position: { x: 40 + COL * 4, y: ROW + BRANCH_OFFSET },
      next: [],
      config: {},
    },
  ];
}

/** T4 — Winback 90 dias inativo */
function buildWinback90(): AutomationNode[] {
  const gatilho = nid("gatilho");
  const cupom = nid("acao");
  const esp = nid("espera");
  const cond = nid("cond");
  const atrib = nid("acao");
  const fimQual = nid("fim");
  const tagChurn = nid("acao");
  const fimChurn = nid("fim");
  return [
    {
      id: gatilho,
      tipo: "gatilho",
      label: "Cliente inativo 90 dias",
      position: { x: 40, y: ROW },
      next: [cupom],
      config: { trigger: "NO_REPLY_TIMEOUT", days: 90 },
    },
    {
      id: cupom,
      tipo: "acao",
      label: "Enviar cupom de reativação",
      position: { x: 40 + COL, y: ROW },
      next: [esp],
      config: { kind: "send_whatsapp_template", template: "cupom_winback" },
    },
    {
      id: esp,
      tipo: "espera",
      label: "Esperar 3 dias",
      position: { x: 40 + COL * 2, y: ROW },
      next: [cond],
      config: { delay_min: 4320 },
    },
    {
      id: cond,
      tipo: "condicao",
      label: "Respondeu?",
      position: { x: 40 + COL * 3, y: ROW },
      next: [atrib, tagChurn],
      config: { metric: "respondeu" },
    },
    {
      id: atrib,
      tipo: "acao",
      label: "Atribuir corretor",
      position: { x: 40 + COL * 4, y: ROW - BRANCH_OFFSET },
      next: [fimQual],
      config: { kind: "assign_auto" },
    },
    {
      id: fimQual,
      tipo: "fim",
      label: "Reativado",
      position: { x: 40 + COL * 5, y: ROW - BRANCH_OFFSET },
      next: [],
      config: {},
    },
    {
      id: tagChurn,
      tipo: "acao",
      label: "Aplicar tag 'churn'",
      position: { x: 40 + COL * 4, y: ROW + BRANCH_OFFSET },
      next: [fimChurn],
      config: { kind: "apply_tag", tag: "churn" },
    },
    {
      id: fimChurn,
      tipo: "fim",
      label: "Marcado como churn",
      position: { x: 40 + COL * 5, y: ROW + BRANCH_OFFSET },
      next: [],
      config: {},
    },
  ];
}

/** T5 — Escalonamento SLA interno */
function buildEscalonamentoSla(): AutomationNode[] {
  const gatilho = nid("gatilho");
  const notif = nid("acao");
  const rerota = nid("acao");
  const fim = nid("fim");
  return [
    {
      id: gatilho,
      tipo: "gatilho",
      label: "Lead parado 48h",
      position: { x: 40, y: ROW },
      next: [notif],
      config: { trigger: "NO_REPLY_TIMEOUT", hours: 48 },
    },
    {
      id: notif,
      tipo: "acao",
      label: "Notificar gestor",
      position: { x: 40 + COL, y: ROW },
      next: [rerota],
      config: { kind: "add_note", channel: "gestor" },
    },
    {
      id: rerota,
      tipo: "acao",
      label: "Reatribuir corretor",
      position: { x: 40 + COL * 2, y: ROW },
      next: [fim],
      config: { kind: "assign_auto", strategy: "skip_current" },
    },
    {
      id: fim,
      tipo: "fim",
      label: "SLA recuperado",
      position: { x: 40 + COL * 3, y: ROW },
      next: [],
      config: {},
    },
  ];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "t1",
    nome: "Boas-vindas lead Instagram",
    categoria: "pre_venda",
    descricao: "Novo lead IG → WA em 5 min. Respondeu em 30 min? atribui corretor; senão, follow-up 1h depois.",
    buildNodes: buildBoasVindasIG,
  },
  {
    id: "t2",
    nome: "Cadência renovação D-60",
    categoria: "renovacao",
    descricao: "3 toques escalados 2 em 2 dias, desconto progressivo 5 → 10 → 15% para passaportes vencendo.",
    buildNodes: buildRenovacaoD60,
  },
  {
    id: "t3",
    nome: "NPS + indicação pós-venda",
    categoria: "pos_venda",
    descricao: "7 dias pós-venda: envia NPS. Score ≥ 9 vira link de indicação, abaixo disso notifica gestor.",
    buildNodes: buildNpsIndicacao,
  },
  {
    id: "t4",
    nome: "Winback 90 dias inativo",
    categoria: "reativacao",
    descricao: "Cliente sem interação 90d → cupom. Respondeu? atribui corretor; senão, aplica tag churn.",
    buildNodes: buildWinback90,
  },
  {
    id: "t5",
    nome: "Escalonamento SLA interno",
    categoria: "interno",
    descricao: "Lead parado 48h → avisa gestor e reatribui pulando o corretor atual.",
    buildNodes: buildEscalonamentoSla,
  },
];

export function instantiateTemplate(template: WorkflowTemplate): AutomationWorkflow {
  const nodes = template.buildNodes();
  const now = new Date().toISOString();
  return {
    id: `draft_${Date.now()}`,
    nome: template.nome,
    descricao: template.descricao,
    categoria: template.categoria,
    ativa: false,
    nodes,
    iniciadas: 0,
    concluidas: 0,
    convertidas: 0,
    conversao_pct: 0,
    receita_gerada: 0,
    criada_em: now,
    atualizada_em: now,
    autor: "template",
  };
}
