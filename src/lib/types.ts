export type Canal =
  | "whatsapp"
  | "instagram"
  | "rdstation"
  | "site"
  | "email"
  | "walkin"
  | "indicacao"
  | "google";

export type LeadStatus =
  | "novo"
  | "qualificado"
  | "alocado"
  | "em_atendimento"
  | "proposta"
  | "fechado"
  | "perdido"
  | "inativo";

export type TipoPassaporte =
  | "anual_individual"
  | "anual_familia"
  | "diario"
  | "vip";

export type Papel = "admin" | "gestor" | "supervisor" | "corretor" | "sac";

export interface Corretor {
  id: string;
  nome: string;
  papel: Papel;
  taxa_conversao: number;
  taxa_conversao_anual: number;
  taxa_conversao_diario: number;
  tempo_medio_resposta: number;
  tempo_medio_fechamento: number;
  leads_ativos: number;
  max_leads_ativos: number;
  leads_saudaveis: number;
  leads_parados: number;
  taxa_resposta_24h: number;
  health_score: number;
  especialidade: "anual" | "diario" | "ambos";
  nps: number;
  taxa_renovacao: number;
  score_composto: number;
  meta_mensal: number;
  receita_mes: number;
  turno_inicio: string;
  turno_fim: string;
  ativo: boolean;
  nivel: "Bronze" | "Prata" | "Ouro" | "Platina";
  badges: string[];
  posicao_dia: number;
  delta_posicao: number;
  copilot_aceite: number;
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  canal: Canal;
  mensagem_raw?: string;
  interesse: "anual" | "diario" | "indefinido";
  score: number;
  status: LeadStatus;
  corretor_id?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  proxima_acao?: string;
  prazo_acao?: "imediato" | "24h" | "48h" | "semana";
  tipo_passaporte_recomendado: "anual" | "diario" | "indefinido";
  confianca_tipo: "alta" | "media" | "baixa";
  num_pessoas?: number;
  tem_crianca?: boolean;
  urgencia: "alta" | "media" | "baixa";
  motivadores: string[];
  objecoes: string[];
  perfil_resumido: string;
  valor_estimado: number;
  tags: string[];
  routing_reason?: string;
  score_breakdown: {
    intencao: number;
    engajamento: number;
    perfil: number;
    urgencia: number;
    fonte: number;
  };
}

export interface Mensagem {
  id: string;
  lead_id: string;
  canal: Canal | "nota" | "sistema" | "copilot";
  direcao: "inbound" | "outbound" | "internal";
  autor: string;
  conteudo: string;
  tipo: "texto" | "audio" | "imagem" | "documento" | "evento";
  sent_at: string;
  lida?: boolean;
  meta?: Record<string, any>;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  corretor_id: string;
  nps: number;
  criado_em: string;
}

export interface Passaporte {
  id: string;
  qr_code: string;
  cliente_id: string;
  cliente_nome: string;
  tipo: TipoPassaporte;
  vigencia_inicio: string;
  vigencia_fim?: string;
  status: "ativo" | "expirado" | "cancelado" | "suspenso";
  valor_pago: number;
  corretor_id: string;
  visitas: string[];
  renovacoes: number;
  dias_restantes?: number;
}

export interface Ticket {
  id: string;
  numero: number;
  cliente_id: string;
  cliente_nome: string;
  passaporte_id?: string;
  canal: Canal | "telefone" | "presencial";
  categoria:
    | "acesso"
    | "pagamento"
    | "cancelamento"
    | "reclamacao"
    | "elogio"
    | "duvida";
  prioridade: "baixa" | "normal" | "alta" | "critica";
  status: "aberto" | "em_andamento" | "aguardando" | "resolvido" | "fechado";
  assunto: string;
  descricao: string;
  atendente_id?: string;
  tom_cliente: "satisfeito" | "neutro" | "insatisfeito" | "furioso";
  sla_horas: number;
  sla_restante: number;
  sla_breach: boolean;
  created_at: string;
}

export interface CopilotSugestao {
  id: string;
  lead_id: string;
  tipo: "mensagem" | "ligacao" | "email" | "esperar" | "escalate";
  urgencia: "agora" | "em_2h" | "amanha";
  mensagem_sugerida?: string;
  justificativa: string;
  objecao_detectada?: string;
  contra_argumento?: string;
  alerta?: string;
  created_at: string;
}

export interface Insight {
  id: string;
  lead_id: string;
  tipo: "fechado" | "perdido";
  tipo_passaporte: string;
  valor?: number;
  corretor: string;
  ciclo_dias: number;
  gatilho: string;
  argumentos_funcionaram: string[];
  objecoes_apareceram: string[];
  tecnicas_usadas: string[];
  resumo: string;
  tags: string[];
  created_at: string;
}

export type MotivoPerdida =
  | "preco"
  | "momento_errado"
  | "foi_concorrente"
  | "sumiu"
  | "nao_icp"
  | "ja_tinha";

export type AcaoPerdida =
  | "nutrir_7d"
  | "nutrir_15d"
  | "nutrir_30d"
  | "realocar"
  | "downgrade"
  | "arquivar";

export type ConversaStatus =
  | "ativa"
  | "aguardando_cliente"
  | "aguardando_corretor"
  | "encerrada_ganha"
  | "encerrada_perdida";

export interface ConversaWA {
  id: string;
  lead_id: string;
  corretor_id: string;
  status: ConversaStatus;
  ultima_atividade: string;
  nao_lidas: number;
  fixada?: boolean;
  temperatura: "fria" | "morna" | "quente" | "muito_quente";
  ia_parcial?: {
    objecoes_detectadas: string[];
    gatilhos_positivos: string[];
    proximo_passo_sugerido: string;
  };
  outcome?: {
    tipo: "ganha" | "perdida";
    valor?: number;
    tipo_passaporte?: string;
    motivo_perdida?: MotivoPerdida;
    acao_realizada?: AcaoPerdida;
    resumo_ia: string;
    padroes_identificados?: string[];
    encerrada_em: string;
    encerrada_por: string;
  };
}

export interface PadraoVencedor {
  id: string;
  titulo: string;
  descricao: string;
  exemplo_frase: string;
  uplift_pct: number;
  aplicado_em: number;
  ganhou_em: number;
  tags: string[];
  descoberto_em: string;
  corretor_origem?: string;
}

export interface MatchCorretor {
  corretor_id: string;
  score: number; // 0-100
  razoes: { label: string; peso: number; tipo: "positivo" | "atencao" }[];
  conv_prob: number; // 0-1
}

export interface RoutingDecision {
  id: string;
  lead_id: string;
  etapa: "ingestao" | "qualificacao" | "match" | "alocado";
  status: "ativa" | "alocada" | "override";
  matches: MatchCorretor[];
  escolhido_id?: string;
  escolhido_por: "ia" | "gestor";
  ia_sugeria_id?: string;
  created_at: string;
  alocado_em?: string;
}

export interface RoutingMetrica {
  leads_roteados_ia: number;
  leads_roteados_manual: number;
  overrides: number;
  conv_ia: number;
  conv_manual: number;
  perda_evitada_reais: number;
  fechamentos_extras: number;
  periodo: string;
}

export interface TemplateWA {
  id: string;
  nome: string;
  categoria: "abertura" | "proposta" | "objecao" | "fechamento" | "nutricao";
  conteudo: string;
  variaveis: string[];
}

export interface Alerta {
  id: string;
  tipo:
    | "lead_parado"
    | "sla_breach"
    | "score_cai"
    | "sem_resposta"
    | "meta"
    | "health_baixa"
    | "renovacao_vencendo"
    | "backlog_alto";
  severidade: "info" | "warning" | "critical";
  titulo: string;
  descricao: string;
  lead_id?: string;
  corretor_id?: string;
  ticket_id?: string;
  passaporte_id?: string;
  created_at: string;
  acao_sugerida?: string;
  resolvido?: boolean;
}

export type CadenciaGatilho =
  | "lead_novo"
  | "lead_sem_resposta"
  | "lead_parado_48h"
  | "pos_proposta"
  | "pre_vencimento_30d"
  | "pre_vencimento_7d"
  | "pos_venda"
  | "reativacao";

export interface CadenciaPasso {
  ordem: number;
  delay_horas: number;
  canal: "whatsapp" | "email" | "ligacao" | "sms";
  template_id?: string;
  titulo: string;
  preview: string;
}

export interface Cadencia {
  id: string;
  nome: string;
  descricao: string;
  gatilho: CadenciaGatilho;
  ativa: boolean;
  passos: CadenciaPasso[];
  aplicados: number;
  conversao: number;
  uplift_pct: number;
  criado_em: string;
  ultima_execucao?: string;
}

export interface CadenciaExecucao {
  id: string;
  cadencia_id: string;
  lead_id?: string;
  cliente_id?: string;
  passo_atual: number;
  proximo_disparo: string;
  status: "ativa" | "pausada" | "concluida" | "convertida" | "cancelada";
  iniciada_em: string;
}

/* ─────────────────────────── Instagram DM ─────────────────────────── */

export type IGTipoMensagem =
  | "dm"
  | "story_reply"
  | "comment_reply"
  | "mention"
  | "reel_reply";

export interface ConversaIG {
  id: string;
  lead_id: string;
  ig_handle: string;
  ig_followers: number;
  origem: "story" | "reel" | "post" | "dm_direto" | "ad";
  origem_ref?: string;
  corretor_id: string;
  status: ConversaStatus;
  ultima_atividade: string;
  nao_lidas: number;
  temperatura: "fria" | "morna" | "quente" | "muito_quente";
  verificado: boolean;
  engagement_score: number;
}

export interface MensagemIG {
  id: string;
  conversa_id: string;
  direcao: "inbound" | "outbound";
  autor: string;
  tipo: IGTipoMensagem;
  conteudo: string;
  reel_thumb?: string;
  story_thumb?: string;
  sent_at: string;
  lida?: boolean;
  reacao?: string;
}

/* ─────────────────────────── Meta Ads ─────────────────────────── */

export type MetaObjetivo =
  | "lead_generation"
  | "conversions"
  | "traffic"
  | "reach"
  | "engagement"
  | "messages";

export type MetaStatus = "ativa" | "pausada" | "finalizada" | "rascunho";

export interface MetaCampanha {
  id: string;
  nome: string;
  objetivo: MetaObjetivo;
  status: MetaStatus;
  plataforma: ("instagram" | "facebook" | "messenger" | "audience_network")[];
  orcamento_diario: number;
  investido_total: number;
  data_inicio: string;
  data_fim?: string;
  impressoes: number;
  cliques: number;
  ctr: number;
  cpc: number;
  cpl: number;
  leads: number;
  leads_qualificados: number;
  vendas: number;
  receita: number;
  roas: number;
  criativo_ids: string[];
  publico: string;
}

export interface MetaAdSet {
  id: string;
  campanha_id: string;
  nome: string;
  publico: string;
  faixa_etaria: string;
  localizacao: string[];
  status: MetaStatus;
  orcamento_diario: number;
  impressoes: number;
  cliques: number;
  leads: number;
  cpl: number;
  criativo_ids: string[];
}

export interface MetaCriativo {
  id: string;
  nome: string;
  tipo: "imagem" | "video" | "carrossel" | "reel" | "stories";
  thumb: string;
  copy_principal: string;
  cta: string;
  duracao_s?: number;
  impressoes: number;
  cliques: number;
  ctr: number;
  leads: number;
  cpl: number;
  hook_rate: number;
  tempo_medio_visual: number;
  fadiga: "baixa" | "media" | "alta";
  performance: "ganhador" | "medio" | "ruim";
}

export interface MetaLeadForm {
  id: string;
  nome: string;
  campanha_id?: string;
  campos: string[];
  total_leads: number;
  taxa_conclusao: number;
  qualificados: number;
  ativo: boolean;
}

/* ─────────────────────────── Automations ─────────────────────────── */

export type AutomationNodeTipo =
  | "gatilho"
  | "condicao"
  | "acao"
  | "espera"
  | "divisao"
  | "fim";

export type AutomationGatilho =
  | "lead_novo"
  | "lead_parado"
  | "score_aumenta"
  | "score_cai"
  | "tag_adicionada"
  | "conversa_encerrada"
  | "passaporte_vencendo"
  | "visita_site"
  | "ad_conversao"
  | "data_recorrente";

export type AutomationAcao =
  | "enviar_whatsapp"
  | "enviar_email"
  | "enviar_dm_instagram"
  | "atribuir_corretor"
  | "adicionar_tag"
  | "remover_tag"
  | "alterar_score"
  | "abrir_ticket"
  | "criar_proposta"
  | "atualizar_pipeline"
  | "notificar_gestor"
  | "webhook";

export interface AutomationNode {
  id: string;
  tipo: AutomationNodeTipo;
  label: string;
  config?: Record<string, any>;
  position: { x: number; y: number };
  next?: string[];
}

export interface AutomationWorkflow {
  id: string;
  nome: string;
  descricao: string;
  categoria: "pre_venda" | "pos_venda" | "renovacao" | "reativacao" | "interno";
  ativa: boolean;
  nodes: AutomationNode[];
  iniciadas: number;
  concluidas: number;
  convertidas: number;
  conversao_pct: number;
  receita_gerada: number;
  criada_em: string;
  atualizada_em: string;
  autor: string;
}

/* ─────────────────────────── Propostas ─────────────────────────── */

export type PropostaStatus =
  | "rascunho"
  | "enviada"
  | "visualizada"
  | "aceita"
  | "recusada"
  | "expirada";

export interface PropostaItem {
  descricao: string;
  quantidade: number;
  preco_unit: number;
  desconto_pct: number;
}

export interface Proposta {
  id: string;
  numero: string;
  lead_id?: string;
  cliente_nome: string;
  cliente_email: string;
  corretor_id: string;
  status: PropostaStatus;
  itens: PropostaItem[];
  subtotal: number;
  desconto_total: number;
  total: number;
  parcelas: number;
  validade: string;
  observacoes: string;
  visualizacoes: number;
  criada_em: string;
  enviada_em?: string;
  aceita_em?: string;
  template_id?: string;
}

/* ─────────────────────────── Segmentos ─────────────────────────── */

export type SegmentoOperador =
  | "igual"
  | "diferente"
  | "contem"
  | "nao_contem"
  | "maior"
  | "menor"
  | "entre"
  | "existe";

export interface SegmentoRegra {
  campo: string;
  operador: SegmentoOperador;
  valor: string | number | [number, number];
}

export interface Segmento {
  id: string;
  nome: string;
  descricao: string;
  tipo: "lead" | "cliente" | "visitante";
  logica: "and" | "or";
  regras: SegmentoRegra[];
  tamanho: number;
  ltv_medio: number;
  conversao_pct: number;
  atualizado_em: string;
  cor: "brand" | "aqua" | "violet" | "emerald" | "amber" | "rose";
}

/* ─────────────────────────── Tracking / Pixel ─────────────────────────── */

export type EventoTipo =
  | "pageview"
  | "form_start"
  | "form_submit"
  | "cta_click"
  | "scroll_deep"
  | "video_play"
  | "add_to_cart"
  | "purchase"
  | "lead_generated";

export interface EventoTracking {
  id: string;
  tipo: EventoTipo;
  pagina: string;
  lead_id?: string;
  sessao_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  device: "mobile" | "desktop" | "tablet";
  browser: string;
  cidade?: string;
  referrer?: string;
  duracao_s?: number;
  created_at: string;
}

export interface SessaoSite {
  id: string;
  lead_id?: string;
  paginas: number;
  duracao_s: number;
  fonte: string;
  device: "mobile" | "desktop" | "tablet";
  cidade: string;
  converteu: boolean;
  created_at: string;
}

/* ─────────────────────────── Relatórios customizados ─────────────────────────── */

export type RelatorioVisual = "tabela" | "barra" | "linha" | "pizza" | "funil" | "kpi";

export interface RelatorioCustomizado {
  id: string;
  nome: string;
  descricao: string;
  fonte: "leads" | "vendas" | "corretores" | "campanhas" | "tickets" | "passaportes";
  dimensao: string;
  metricas: string[];
  filtros: SegmentoRegra[];
  visual: RelatorioVisual;
  favorito: boolean;
  agendado?: "diario" | "semanal" | "mensal";
  destinatarios?: string[];
  criado_em: string;
  autor: string;
}

/* ─────────────────────────── Integrações / API ─────────────────────────── */

export type IntegracaoStatus = "conectado" | "desconectado" | "erro" | "reautenticar";

export interface Integracao {
  id: string;
  nome: string;
  categoria: "ads" | "pagamento" | "comunicacao" | "operacional" | "analytics" | "automacao";
  icone: string;
  status: IntegracaoStatus;
  conectado_em?: string;
  ultimo_sync?: string;
  descricao: string;
  eventos_24h: number;
}

export interface APIKey {
  id: string;
  nome: string;
  ambiente: "producao" | "sandbox";
  prefixo: string;
  criada_em: string;
  ultimo_uso?: string;
  escopos: string[];
  criada_por: string;
  ativa: boolean;
}

export interface Webhook {
  id: string;
  nome: string;
  url: string;
  eventos: string[];
  ativo: boolean;
  criado_em: string;
  ultimo_disparo?: string;
  status_ultimo: "sucesso" | "falha" | "pendente";
  taxa_sucesso: number;
}

/* ─────────────────────────── Jornada do cliente ─────────────────────────── */

export type JornadaEtapa =
  | "descoberta"
  | "interesse"
  | "consideracao"
  | "decisao"
  | "cliente"
  | "renovacao"
  | "advocacy";

export interface JornadaEvento {
  id: string;
  cliente_id: string;
  etapa: JornadaEtapa;
  tipo: string;
  descricao: string;
  canal?: Canal | "sistema";
  valor?: number;
  created_at: string;
}

/* ─────────────────────────── Auditoria / LGPD ─────────────────────────── */

export type AuditoriaAcao =
  | "login"
  | "logout"
  | "view"
  | "create"
  | "update"
  | "delete"
  | "export"
  | "impersonate"
  | "permission_change"
  | "config_change";

export interface AuditoriaLog {
  id: string;
  ator: string;
  ator_papel: Papel;
  acao: AuditoriaAcao;
  entidade: string;
  entidade_id?: string;
  entidade_label?: string;
  ip: string;
  user_agent: string;
  diff?: { campo: string; antes: any; depois: any }[];
  created_at: string;
}

export type LGPDStatus = "pendente" | "em_analise" | "concluida" | "negada";
export type LGPDTipo = "acesso" | "exclusao" | "portabilidade" | "retificacao" | "anonimizacao" | "revogacao_consentimento";

export interface LGPDSolicitacao {
  id: string;
  titular: string;
  email: string;
  cpf: string;
  tipo: LGPDTipo;
  status: LGPDStatus;
  descricao: string;
  sla_dias: number;
  prazo: string;
  created_at: string;
  concluida_em?: string;
  responsavel?: string;
}

export interface ConsentTitular {
  id: string;
  lead_id?: string;
  cliente_id?: string;
  nome: string;
  marketing_email: boolean;
  marketing_whatsapp: boolean;
  marketing_sms: boolean;
  cookies_analytics: boolean;
  cookies_marketing: boolean;
  atualizado_em: string;
}

/* ─────────────────────────── Execução de automações ─────────────────────────── */

export type ExecStatus = "rodando" | "sucesso" | "falha" | "retry" | "cancelada";

export interface AutomationExec {
  id: string;
  workflow_id: string;
  workflow_nome: string;
  lead_id?: string;
  cliente_id?: string;
  status: ExecStatus;
  node_atual: string;
  iniciada_em: string;
  concluida_em?: string;
  duracao_ms: number;
  tentativas: number;
  log: { node: string; status: ExecStatus; ts: string; msg?: string }[];
}

/* ─────────────────────────── Chatbot IA ─────────────────────────── */

export interface BotConfig {
  id: string;
  nome: string;
  ativo: boolean;
  canal: Canal;
  horario: "24_7" | "comercial" | "fora_do_horario";
  persona: string;
  base_conhecimento: string[];
  handoff_regras: string[];
  conversas_ativas: number;
  taxa_resolucao: number;
  taxa_handoff: number;
  csat: number;
}

export interface BotConversa {
  id: string;
  canal: Canal;
  lead_id?: string;
  status: "ativa" | "resolvida_bot" | "handoff" | "abandonada";
  mensagens_bot: number;
  mensagens_humano: number;
  duracao_s: number;
  intencao_detectada: string;
  handoff_motivo?: string;
  iniciada_em: string;
}

/* ─────────────────────────── Voice AI ─────────────────────────── */

export interface CallGravacao {
  id: string;
  lead_id?: string;
  cliente_id?: string;
  corretor_id: string;
  direcao: "inbound" | "outbound";
  duracao_s: number;
  iniciada_em: string;
  sentimento: "positivo" | "neutro" | "negativo";
  score_qualidade: number;
  fala_pct_corretor: number;
  monologo_maior_s: number;
  objecoes_detectadas: string[];
  proximos_passos: string[];
  palavras_proibidas: number;
  resultado: "ganho" | "perdido" | "follow_up" | "sem_resposta";
}

/* ─────────────────────────── Forecast ─────────────────────────── */

export interface ForecastEtapa {
  etapa: LeadStatus;
  leads: number;
  valor_total: number;
  prob_ponderada: number;
  forecast: number;
}

export interface ForecastCenario {
  id: string;
  nome: "pessimista" | "base" | "otimista";
  fechado: number;
  comprometido: number;
  melhor_caso: number;
  meta: number;
  gap: number;
  atingimento_pct: number;
}

/* ─────────────────────────── Pagamentos & Assinaturas ─────────────────────────── */

export type PagamentoStatus = "pendente" | "processando" | "pago" | "falha" | "estornado" | "chargeback";
export type PagamentoMetodo = "pix" | "cartao" | "boleto" | "dinheiro";

export interface Pagamento {
  id: string;
  cliente_nome: string;
  cliente_email: string;
  passaporte_id?: string;
  proposta_id?: string;
  valor: number;
  metodo: PagamentoMetodo;
  status: PagamentoStatus;
  parcelas: number;
  parcela_atual: number;
  gateway: "stripe" | "pagarme" | "mercadopago";
  created_at: string;
  pago_em?: string;
}

export interface Assinatura {
  id: string;
  cliente_nome: string;
  plano: string;
  valor_mensal: number;
  status: "ativa" | "pausada" | "cancelada" | "inadimplente";
  ciclo: "mensal" | "anual";
  proxima_cobranca: string;
  iniciada_em: string;
  churn_risk: "baixo" | "medio" | "alto";
}

/* ─────────────────────────── Agenda ─────────────────────────── */

export type AgendaTipo = "visita_guiada" | "reuniao" | "ligacao_agendada" | "vistoria" | "evento";

export interface AgendaEvento {
  id: string;
  titulo: string;
  tipo: AgendaTipo;
  inicio: string;
  fim: string;
  corretor_id: string;
  lead_id?: string;
  cliente_id?: string;
  local: string;
  observacoes: string;
  status: "agendado" | "confirmado" | "realizado" | "no_show" | "cancelado";
  participantes: string[];
}

/* ─────────────────────────── Landing pages ─────────────────────────── */

export type LPBlocoTipo = "hero" | "beneficios" | "depoimentos" | "formulario" | "cta" | "faq" | "precos" | "galeria";

export interface LPBloco {
  id: string;
  tipo: LPBlocoTipo;
  titulo: string;
  conteudo: string;
  imagens?: string[];
  cta?: string;
  campos?: string[];
}

export type LPElementoTipo =
  | "texto"
  | "imagem"
  | "video"
  | "botao"
  | "forma_retangulo"
  | "forma_circulo"
  | "forma_organica"
  | "icone"
  | "bg_animado";

export interface LPElemento {
  id: string;
  tipo: LPElementoTipo;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  texto?: string;
  src?: string;
  href?: string;
  iconeNome?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  bg?: string;
  align?: "left" | "center" | "right";
  italic?: boolean;
  underline?: boolean;
  radius?: number;
  rotation?: number;
  shadow?: boolean;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  fit?: "cover" | "contain";
  /* Botão avançado */
  btnVariante?: "solid" | "outline" | "ghost" | "gradient" | "glass";
  btnRadiusPreset?: "sharp" | "rounded" | "pill";
  btnIcon?: string;
  btnIconPos?: "left" | "right";
  btnHoverFx?: "lift" | "glow" | "pulse" | "none";
  btnAcao?: { tipo: "link" | "scroll" | "whatsapp" | "phone" | "email" | "download"; valor: string };
  btnGradientDe?: string;
  btnGradientPara?: string;
  /* Background animado (quando tipo === "bg_animado") */
  bgAnimId?: string;
  /* Forma orgânica (quando tipo === "forma_organica") — id de ORGANIC_SHAPES */
  shapeId?: string;
  /* Stroke para formas SVG (organic + retângulo/círculo) */
  strokeColor?: string;
  strokeWidth?: number;
  /* Flip horizontal/vertical — usado em formas orgânicas assimétricas */
  flipH?: boolean;
  flipV?: boolean;
  /* Tipografia avançada */
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface LandingPage {
  id: string;
  slug: string;
  titulo: string;
  visitas: number;
  leads_gerados: number;
  conversao_pct: number;
  ultima_publicacao?: string;
  status: "rascunho" | "publicada" | "pausada";
  blocos: LPBloco[];
  elementos?: LPElemento[];
  canvasH?: number;
  canvasBg?: string;
  canvasBgImage?: string;
  canvasBgAnimation?: string;
  template:
    | "valparaiso_park"
    | "passaporte_anual"
    | "passaporte_diario"
    | "evento_corporativo"
    | "festa_aniversario"
    | "aventura_radical"
    | "promocoes"
    | "blank";
}

/* ─────────────────────────── Clarity (heatmaps & session stats) ─────────────────────────── */

export interface ClarityMetrics {
  slug: string;
  periodo: "7d" | "30d" | "90d";
  sessoes: number;
  sessoes_unicas: number;
  tempo_medio_s: number;
  scroll_p50: number;
  scroll_p90: number;
  bounce_pct: number;
  rage_clicks: number;
  dead_clicks: number;
  quick_backs: number;
  excessive_scroll: number;
  devices: { mobile: number; desktop: number; tablet: number };
  top_os: { os: string; sessoes: number }[];
  top_paises: { pais: string; sessoes: number }[];
  top_clicks: { seletor: string; cliques: number; rage: number }[];
  scroll_por_secao: { secao: string; pct_visivel: number }[];
  serie_sessoes: { data: string; sessoes: number }[];
  insights_ia: string[];
  atualizado_em: string;
}

export interface ClarityConfig {
  projectId: string;
  apiToken?: string;
  conectado: boolean;
}

/* ─────────────────────────── Email marketing ─────────────────────────── */

export interface EmailCampanha {
  id: string;
  nome: string;
  assunto: string;
  preview: string;
  segmento_id?: string;
  enviados: number;
  entregues: number;
  abertos: number;
  clicados: number;
  descadastros: number;
  bounces: number;
  status: "rascunho" | "agendada" | "enviando" | "enviada" | "pausada";
  enviada_em?: string;
  template: string;
}

/* ─────────────────────────── Testes A/B ─────────────────────────── */

export interface ABTeste {
  id: string;
  nome: string;
  hipotese: string;
  tipo: "criativo" | "copy" | "cadencia" | "lp" | "preco";
  status: "rodando" | "finalizado" | "rascunho";
  variacoes: {
    nome: string;
    impressoes: number;
    conversoes: number;
    taxa: number;
    uplift_pct: number;
  }[];
  confianca_pct: number;
  vencedora?: string;
  iniciado_em: string;
  finalizado_em?: string;
}

/* ─────────────────────────── Comunicação interna (Slack-like) ─────────────────────────── */

export type CanalInternoTipo =
  | "operacional"
  | "gestao"
  | "projeto"
  | "incidente"
  | "dm";

export interface CanalInterno {
  id: string;
  nome: string;
  proposito: string;
  tipo: CanalInternoTipo;
  privado: boolean;
  membros: string[];
  nao_lidas?: number;
  arquivado?: boolean;
  criado_em: string;
}

export type AutorTipo = "user" | "bot" | "system";

export interface UnfurlInterno {
  tipo: "passaporte" | "ingresso" | "lead" | "ticket" | "incidente" | "capacidade";
  ref: string;
  titulo: string;
  subtitulo: string;
  badges?: { label: string; tone: "emerald" | "amber" | "rose" | "sky" | "violet" | "slate" }[];
  cta?: string;
}

export interface ReacaoInterna {
  emoji: string;
  usuarios: string[];
}

export interface AcaoInlineInterna {
  id: string;
  label: string;
  tone: "primary" | "danger" | "outline";
  resultado?: string;
}

export interface AnexoInterno {
  nome: string;
  tipo: "imagem" | "arquivo" | "audio";
  tamanho_kb?: number;
  preview?: string;
}

export interface MensagemInterna {
  id: string;
  canal_id: string;
  autor_tipo: AutorTipo;
  autor_id: string;
  conteudo: string;
  timestamp: string;
  editada?: boolean;
  thread_pai_id?: string;
  thread_respostas?: number;
  thread_ultima_resposta?: string;
  mencoes?: string[];
  mencao_canal?: boolean;
  reacoes?: ReacaoInterna[];
  unfurls?: UnfurlInterno[];
  anexos?: AnexoInterno[];
  acoes_inline?: AcaoInlineInterna[];
  prioridade?: "normal" | "alerta" | "critico";
  fixada?: boolean;
}

export interface BotInterno {
  id: string;
  nome: string;
  descricao: string;
  cor: "brand" | "aqua" | "emerald" | "amber" | "rose" | "violet" | "sky" | "fuchsia";
  canal_default: string;
  ultima_execucao?: string;
  ativo: boolean;
}

export interface SlashCommandInterno {
  comando: string;
  descricao: string;
  exemplo: string;
  categoria: "consulta" | "operacao" | "aprovacao" | "atalho";
}

export interface DMInterna {
  id: string;
  participantes: string[];
  ultima_mensagem?: string;
  ultimo_ts?: string;
  nao_lidas?: number;
}

/* ─────────────────────────── Multi-unidade ─────────────────────────── */

export interface Unidade {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  status: "ativa" | "implantacao" | "inativa";
  usuarios: number;
  leads_mes: number;
  receita_mes: number;
  meta_mes: number;
  nps: number;
  abertura_em: string;
  gerente: string;
}

/* ─────────── Operações — Atrações, OS, Rotinas, Projetos ─────────── */

export type AtracaoCategoria =
  | "toboagua"
  | "piscina"
  | "kids"
  | "bar"
  | "catraca"
  | "estrutura"
  | "equipamento";

export type AtracaoStatus =
  | "operacional"
  | "manutencao"
  | "fora_ar"
  | "inativa";

export interface Atracao {
  id: string;
  nome: string;
  codigo: string;
  categoria: AtracaoCategoria;
  status: AtracaoStatus;
  capacidade_hora?: number;
  ultima_manutencao?: string;
  proxima_inspecao?: string;
  responsavel_id: string;
  setor: string;
  observacoes?: string;
}

export type OSTipo =
  | "preventiva"
  | "corretiva"
  | "limpeza"
  | "seguranca"
  | "compra"
  | "evento"
  | "ti";

export type OSStatus =
  | "solicitado"
  | "agendado"
  | "em_execucao"
  | "aguardando"
  | "concluido";

export type OSPrioridade = "critica" | "alta" | "normal" | "baixa";

export interface OSChecklistItem {
  id: string;
  texto: string;
  feito: boolean;
  obrigatorio?: boolean;
}

export interface OSComentario {
  id: string;
  autor_id: string;
  texto: string;
  timestamp: string;
}

export interface OSAnexo {
  id: string;
  nome: string;
  tipo: "foto_antes" | "foto_depois" | "documento" | "orcamento";
  tamanho_kb?: number;
}

export interface OrdemServico {
  id: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  tipo: OSTipo;
  status: OSStatus;
  prioridade: OSPrioridade;
  atracao_id?: string;
  setor: string;
  solicitante_id: string;
  responsavel_id?: string;
  fornecedor?: string;
  projeto_id?: string;
  incidente_ref?: string;
  criado_em: string;
  agendado_para?: string;
  iniciado_em?: string;
  concluido_em?: string;
  verificado_em?: string;
  verificado_por_id?: string;
  sla_horas?: number;
  custo_estimado?: number;
  custo_real?: number;
  horas_estimadas?: number;
  horas_reais?: number;
  bloqueia_abertura?: boolean;
  afeta_seguranca?: boolean;
  checklist?: OSChecklistItem[];
  comentarios?: OSComentario[];
  anexos?: OSAnexo[];
  tags?: string[];
  ordem_kanban?: number;
}

export type RotinaPeriodicidade =
  | "diaria"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "trimestral";

export type RotinaMomento = "abertura" | "durante" | "fechamento";

export interface RotinaChecklistItem {
  id: string;
  texto: string;
  obrigatorio?: boolean;
}

export interface Rotina {
  id: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  momento: RotinaMomento;
  periodicidade: RotinaPeriodicidade;
  horario?: string;
  duracao_min?: number;
  atracao_id?: string;
  setor: string;
  responsavel_id: string;
  obrigatoria: boolean;
  bloqueia_abertura?: boolean;
  afeta_seguranca?: boolean;
  checklist: RotinaChecklistItem[];
  ativa: boolean;
}

export type RotinaInstanciaStatus = "pendente" | "em_andamento" | "concluida" | "atrasada" | "pulada";

export interface RotinaInstancia {
  id: string;
  rotina_id: string;
  data: string;
  status: RotinaInstanciaStatus;
  responsavel_id: string;
  iniciada_em?: string;
  concluida_em?: string;
  checklist_feitos: string[];
  observacao?: string;
}

export type ProjetoOpStatus =
  | "planejamento"
  | "em_execucao"
  | "pausado"
  | "concluido"
  | "cancelado";

export interface ProjetoOp {
  id: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  status: ProjetoOpStatus;
  prioridade: OSPrioridade;
  setor: string;
  responsavel_id: string;
  membros: string[];
  data_inicio: string;
  data_fim_prevista: string;
  data_fim_real?: string;
  orcamento_estimado?: number;
  orcamento_real?: number;
  privado?: boolean;
  cor: "brand" | "aqua" | "emerald" | "amber" | "rose" | "violet" | "sky" | "fuchsia";
  marcos?: { id: string; titulo: string; data: string; feito: boolean }[];
  atracoes?: string[];
}

export type ReuniaoOpTipo =
  | "briefing_matinal"
  | "semanal_manut"
  | "semanal_seg"
  | "post_mortem"
  | "planejamento"
  | "emergencial";

export type ReuniaoOpStatus = "agendada" | "em_andamento" | "realizada" | "cancelada";

export interface ItemPautaOp {
  id: string;
  ordem: number;
  titulo: string;
  responsavel_id?: string;
  duracao_min: number;
  status: "pendente" | "discutido" | "adiado";
  resultado?: string;
}

export interface ActionItemOp {
  id: string;
  codigo: string;
  titulo: string;
  responsavel_id: string;
  prazo: string;
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  convertido_em_os?: string;
  notas?: string;
}

export interface ParticipanteReuniaoOp {
  user_id: string;
  confirmacao: "pendente" | "confirmado" | "recusado" | "talvez";
  presente: boolean;
  role: "organizador" | "apresentador" | "participante" | "opcional";
}

export interface ReuniaoOp {
  id: string;
  codigo: string;
  titulo: string;
  tipo: ReuniaoOpTipo;
  status: ReuniaoOpStatus;
  data_hora_inicio: string;
  data_hora_fim: string;
  local: string;
  link_online?: string;
  organizador_id: string;
  projeto_id?: string;
  incidente_ref?: string;
  recorrente: boolean;
  frequencia?: "diaria" | "semanal" | "quinzenal" | "mensal";
  pauta: ItemPautaOp[];
  ata?: string;
  decisoes?: string;
  resumo_ai?: string;
  gravacao_url?: string;
  participantes: ParticipanteReuniaoOp[];
  action_items: ActionItemOp[];
}

/* ───────────────────── SQUADS & HIERARQUIA ───────────────────── */

export type SquadId = string;

export interface Squad {
  id: SquadId;
  nome: string;
  slug: string;
  descricao: string;
  cor: string;
  lider_id: string;
  membros_count: number;
  ativa: boolean;
  created_at: string;
}

export interface HierarquiaUsuario {
  user_id: string;
  gestor_id?: string;
  squad_id: SquadId;
  squads_secundarias: SquadId[];
  unidade_id: string;
  cargo: string;
  avatar_cor?: string;
}

/* ───────────────────── TAREFA UNIFICADA ───────────────────── */

export type TarefaSubtipo =
  | "generica"
  | "os"
  | "briefing"
  | "followup"
  | "cobranca"
  | "aprovacao"
  | "entrega"
  | "ligacao"
  | "revisao";

export type TarefaStatus =
  | "backlog"
  | "a_fazer"
  | "em_andamento"
  | "aguardando"
  | "concluida"
  | "cancelada";

export type TarefaPrioridade = "critica" | "alta" | "normal" | "baixa";

export type TarefaVisibilidade = "squad" | "envolvidos" | "publica" | "privada";

export interface TarefaChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
  responsavel_id?: string;
}

export interface TarefaOrigem {
  tipo: "lead" | "os" | "reuniao" | "nota" | "projeto" | "cadencia" | "ticket" | "cliente";
  id: string;
  label: string;
}

export interface TarefaComentario {
  id: string;
  autor_id: string;
  texto: string;
  created_at: string;
}

export interface Tarefa {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  subtipo: TarefaSubtipo;
  status: TarefaStatus;
  prioridade: TarefaPrioridade;
  visibilidade: TarefaVisibilidade;
  squad_id: SquadId;
  criador_id: string;
  responsavel_id?: string;
  participantes: string[];
  aprovadores: string[];
  origem?: TarefaOrigem;
  data_prazo?: string;
  data_inicio?: string;
  data_conclusao?: string;
  estimativa_horas?: number;
  horas_gastas?: number;
  checklist: TarefaChecklistItem[];
  comentarios: TarefaComentario[];
  tags: string[];
  bloqueia?: string[];
  created_at: string;
  updated_at: string;
}

/* ───────────────────────── NOTAS ───────────────────────── */

export type NotaVisibilidade = "privada" | "gestor" | "squad" | "equipe";

export type NotaBloco =
  | { id: string; tipo: "texto"; markdown: string }
  | {
      id: string;
      tipo: "checklist";
      itens: { id: string; texto: string; concluido: boolean }[];
    }
  | { id: string; tipo: "citacao"; texto: string; autor?: string }
  | { id: string; tipo: "codigo"; linguagem?: string; codigo: string }
  | { id: string; tipo: "divisor" }
  | { id: string; tipo: "heading"; nivel: 1 | 2 | 3; texto: string };

export interface NotaLink {
  tipo: "lead" | "os" | "projeto" | "reuniao" | "cliente" | "tarefa";
  id: string;
  label: string;
}

export interface Nota {
  id: string;
  titulo: string;
  emoji?: string;
  autor_id: string;
  visibilidade: NotaVisibilidade;
  squad_id?: SquadId;
  compartilhada_com: string[];
  links: NotaLink[];
  blocos: NotaBloco[];
  tags: string[];
  favorita: boolean;
  fixada: boolean;
  pasta?: string;
  created_at: string;
  updated_at: string;
}

/* ───────────────────────── MENÇÕES ───────────────────────── */

export interface Mencao {
  id: string;
  origem: "aqua_chat" | "reuniao" | "tarefa" | "nota" | "os" | "comentario";
  origem_id: string;
  origem_label: string;
  autor_id: string;
  destinatario_id: string;
  trecho: string;
  url_interno: string;
  lida: boolean;
  created_at: string;
}
