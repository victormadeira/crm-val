import type {
  ABTeste,
  AgendaEvento,
  Alerta,
  APIKey,
  Assinatura,
  AuditoriaLog,
  AutomationExec,
  AutomationWorkflow,
  BotConfig,
  BotConversa,
  Cadencia,
  CadenciaExecucao,
  CallGravacao,
  Cliente,
  ConsentTitular,
  ConversaIG,
  ConversaWA,
  CopilotSugestao,
  Corretor,
  BotInterno,
  CanalInterno,
  DMInterna,
  MensagemInterna,
  SlashCommandInterno,
  Atracao,
  OrdemServico,
  Rotina,
  RotinaInstancia,
  ProjetoOp,
  ReuniaoOp,
  Squad,
  HierarquiaUsuario,
  Tarefa,
  Nota,
  Mencao,
  EmailCampanha,
  EventoTracking,
  ForecastCenario,
  ForecastEtapa,
  Insight,
  Integracao,
  JornadaEvento,
  LandingPage,
  Lead,
  LGPDSolicitacao,
  Mensagem,
  MensagemIG,
  MatchCorretor,
  MetaAdSet,
  MetaCampanha,
  MetaCriativo,
  MetaLeadForm,
  PadraoVencedor,
  Pagamento,
  Papel,
  Passaporte,
  Proposta,
  RelatorioCustomizado,
  RoutingDecision,
  RoutingMetrica,
  Segmento,
  SessaoSite,
  TemplateWA,
  Ticket,
  Unidade,
  Webhook,
} from "./types";

const now = Date.now();
const mins = (n: number) => new Date(now - n * 60_000).toISOString();
const hours = (n: number) => new Date(now - n * 3_600_000).toISOString();
const days = (n: number) => new Date(now - n * 86_400_000).toISOString();
const future = (n: number) => new Date(now + n * 86_400_000).toISOString();

/* ───────────────────────── CORRETORES ───────────────────────── */

export const corretores: Corretor[] = [
  {
    id: "c1",
    nome: "Amanda Rocha",
    papel: "corretor",
    taxa_conversao: 0.38,
    taxa_conversao_anual: 0.42,
    taxa_conversao_diario: 0.31,
    tempo_medio_resposta: 4,
    tempo_medio_fechamento: 18,
    leads_ativos: 14,
    max_leads_ativos: 25,
    leads_saudaveis: 12,
    leads_parados: 2,
    taxa_resposta_24h: 0.95,
    health_score: 94,
    especialidade: "anual",
    nps: 9.2,
    taxa_renovacao: 0.74,
    score_composto: 92,
    meta_mensal: 42000,
    receita_mes: 38700,
    turno_inicio: "08:00",
    turno_fim: "18:00",
    ativo: true,
    nivel: "Platina",
    badges: ["Top 1 da semana", "100% de renovação", "Fechadora do mês"],
    posicao_dia: 1,
    delta_posicao: 0,
    copilot_aceite: 0.78,
  },
  {
    id: "c2",
    nome: "Bruno Teixeira",
    papel: "corretor",
    taxa_conversao: 0.34,
    taxa_conversao_anual: 0.3,
    taxa_conversao_diario: 0.4,
    tempo_medio_resposta: 7,
    tempo_medio_fechamento: 22,
    leads_ativos: 19,
    max_leads_ativos: 25,
    leads_saudaveis: 15,
    leads_parados: 4,
    taxa_resposta_24h: 0.82,
    health_score: 81,
    especialidade: "diario",
    nps: 8.7,
    taxa_renovacao: 0.62,
    score_composto: 86,
    meta_mensal: 38000,
    receita_mes: 31200,
    turno_inicio: "10:00",
    turno_fim: "20:00",
    ativo: true,
    nivel: "Ouro",
    badges: ["Mais rápido do mês"],
    posicao_dia: 2,
    delta_posicao: 1,
    copilot_aceite: 0.69,
  },
  {
    id: "c3",
    nome: "Carla Mendes",
    papel: "corretor",
    taxa_conversao: 0.31,
    taxa_conversao_anual: 0.36,
    taxa_conversao_diario: 0.26,
    tempo_medio_resposta: 12,
    tempo_medio_fechamento: 26,
    leads_ativos: 22,
    max_leads_ativos: 25,
    leads_saudaveis: 12,
    leads_parados: 10,
    taxa_resposta_24h: 0.58,
    health_score: 52,
    especialidade: "ambos",
    nps: 8.3,
    taxa_renovacao: 0.58,
    score_composto: 79,
    meta_mensal: 35000,
    receita_mes: 26800,
    turno_inicio: "09:00",
    turno_fim: "18:00",
    ativo: true,
    nivel: "Ouro",
    badges: ["Zero leads parados"],
    posicao_dia: 3,
    delta_posicao: -1,
    copilot_aceite: 0.61,
  },
  {
    id: "c4",
    nome: "Diego Alves",
    papel: "corretor",
    taxa_conversao: 0.28,
    taxa_conversao_anual: 0.22,
    taxa_conversao_diario: 0.34,
    tempo_medio_resposta: 18,
    tempo_medio_fechamento: 31,
    leads_ativos: 11,
    max_leads_ativos: 25,
    leads_saudaveis: 9,
    leads_parados: 2,
    taxa_resposta_24h: 0.78,
    health_score: 75,
    especialidade: "diario",
    nps: 8.0,
    taxa_renovacao: 0.52,
    score_composto: 71,
    meta_mensal: 32000,
    receita_mes: 18400,
    turno_inicio: "11:00",
    turno_fim: "20:00",
    ativo: true,
    nivel: "Prata",
    badges: ["Primeiro fechamento do dia"],
    posicao_dia: 4,
    delta_posicao: 0,
    copilot_aceite: 0.52,
  },
  {
    id: "c5",
    nome: "Eduarda Lima",
    papel: "corretor",
    taxa_conversao: 0.26,
    taxa_conversao_anual: 0.29,
    taxa_conversao_diario: 0.22,
    tempo_medio_resposta: 24,
    tempo_medio_fechamento: 38,
    leads_ativos: 7,
    max_leads_ativos: 25,
    leads_saudaveis: 6,
    leads_parados: 1,
    taxa_resposta_24h: 0.88,
    health_score: 82,
    especialidade: "ambos",
    nps: 7.6,
    taxa_renovacao: 0.48,
    score_composto: 64,
    meta_mensal: 30000,
    receita_mes: 12100,
    turno_inicio: "12:00",
    turno_fim: "21:00",
    ativo: true,
    nivel: "Prata",
    badges: [],
    posicao_dia: 5,
    delta_posicao: -2,
    copilot_aceite: 0.44,
  },
  {
    id: "c6",
    nome: "Felipe Souza",
    papel: "corretor",
    taxa_conversao: 0.22,
    taxa_conversao_anual: 0.18,
    taxa_conversao_diario: 0.26,
    tempo_medio_resposta: 32,
    tempo_medio_fechamento: 42,
    leads_ativos: 16,
    max_leads_ativos: 25,
    leads_saudaveis: 7,
    leads_parados: 9,
    taxa_resposta_24h: 0.45,
    health_score: 40,
    especialidade: "diario",
    nps: 7.1,
    taxa_renovacao: 0.41,
    score_composto: 57,
    meta_mensal: 28000,
    receita_mes: 8900,
    turno_inicio: "10:00",
    turno_fim: "19:00",
    ativo: true,
    nivel: "Bronze",
    badges: [],
    posicao_dia: 6,
    delta_posicao: 2,
    copilot_aceite: 0.33,
  },
];

export const usuarios = [
  { id: "u0", nome: "Renata Carvalho", papel: "gestor" as const },
  { id: "u1", nome: "Marcos Pedrosa", papel: "supervisor" as const },
  ...corretores.map((c) => ({ id: c.id, nome: c.nome, papel: c.papel })),
  { id: "u5", nome: "Luíza Barreto", papel: "sac" as const },
  { id: "u6", nome: "Admin", papel: "admin" as const },
];

/* ───────────────────────── LEADS ───────────────────────── */

const nomesLead = [
  "Patrícia Melo",
  "Ricardo Duarte",
  "Joana Ferreira",
  "Thiago Nunes",
  "Marina Costa",
  "Rafael Oliveira",
  "Beatriz Almeida",
  "Henrique Pires",
  "Camila Rezende",
  "Gustavo Farias",
  "Larissa Siqueira",
  "Otávio Ramos",
  "Juliana Carvalho",
  "Leonardo Vieira",
  "Priscila Matos",
  "Antônio Lopes",
  "Vanessa Monteiro",
  "Eduardo Pacheco",
  "Sabrina Torres",
  "Rodrigo Cordeiro",
  "Isabela Brandão",
  "Pedro Henrique",
  "Natália Queiroz",
  "Vinícius Barbosa",
];

const mensagensRaw = [
  "Oi, vocês têm passaporte anual? Somos 4 pessoas, 2 crianças.",
  "Quanto tá o passaporte pro próximo sábado?",
  "Bom dia, gostaria de saber sobre o passaporte família",
  "Tem desconto pra grupo? Vamos em 8",
  "Queria levar minha filha no feriado, ainda tem vaga?",
  "Sou cliente antigo, como renovo o anual?",
  "Oi! Quero passar o dia aí no domingo",
  "Valor do anual por favor, família com 3 crianças",
  "Boa tarde, vi a propaganda no Instagram, tem promoção?",
  "Preciso de passaporte urgente, aniversário do meu filho sábado",
];

const palavrasMotivador = [
  "família com crianças",
  "temporada de férias",
  "cliente recorrente",
  "indicação de amigo",
  "preço",
  "experiência completa",
  "presente de aniversário",
  "grupo grande",
];

const palavrasObjecao = [
  "preço alto",
  "sazonalidade",
  "incerteza da data",
  "dúvida sobre benefícios",
  "comparando com concorrente",
  "orçamento familiar",
];

const canais: Lead["canal"][] = [
  "whatsapp",
  "instagram",
  "rdstation",
  "site",
  "email",
  "indicacao",
  "walkin",
  "google",
];

const statuses: Lead["status"][] = [
  "novo",
  "qualificado",
  "alocado",
  "em_atendimento",
  "proposta",
  "fechado",
  "perdido",
];

const seedRand = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};
const rand = seedRand(42);

export const leads: Lead[] = Array.from({ length: 48 }).map((_, i) => {
  const nome = nomesLead[i % nomesLead.length];
  const canal = canais[Math.floor(rand() * canais.length)];
  const score = Math.floor(20 + rand() * 80);
  const status =
    i < 8
      ? "novo"
      : i < 18
      ? "qualificado"
      : i < 26
      ? "em_atendimento"
      : i < 32
      ? "proposta"
      : i < 40
      ? "fechado"
      : "perdido";
  const interesse =
    rand() > 0.55 ? "anual" : rand() > 0.25 ? "diario" : "indefinido";
  const urgencia = score > 75 ? "alta" : score > 50 ? "media" : "baixa";
  const valor =
    interesse === "anual"
      ? 1200 + Math.floor(rand() * 1800)
      : 120 + Math.floor(rand() * 180);
  const corretorId = corretores[i % corretores.length].id;

  return {
    id: `l${i + 1}`,
    nome,
    telefone: `(98) 9${8000 + i}-${String(1000 + i).padStart(4, "0")}`,
    email: `${nome.toLowerCase().replace(/\s+/g, ".").replace(/[ãç]/g, "a")}@gmail.com`,
    canal,
    mensagem_raw: mensagensRaw[i % mensagensRaw.length],
    interesse: interesse as Lead["interesse"],
    score,
    status,
    corretor_id: status === "novo" ? undefined : corretorId,
    created_at: days(Math.floor(rand() * 14)),
    updated_at: hours(Math.floor(rand() * 48)),
    last_message_at: hours(Math.floor(rand() * 36)),
    proxima_acao:
      score > 80
        ? "Ligar agora — urgência alta"
        : score > 60
        ? "Enviar proposta personalizada"
        : "Nutrir com conteúdo sobre experiência familiar",
    prazo_acao: score > 75 ? "imediato" : score > 50 ? "24h" : "48h",
    tipo_passaporte_recomendado: interesse,
    confianca_tipo: score > 70 ? "alta" : score > 45 ? "media" : "baixa",
    num_pessoas: 2 + Math.floor(rand() * 5),
    tem_crianca: rand() > 0.4,
    urgencia,
    motivadores: [
      palavrasMotivador[Math.floor(rand() * palavrasMotivador.length)],
      palavrasMotivador[Math.floor(rand() * palavrasMotivador.length)],
    ],
    objecoes: [
      palavrasObjecao[Math.floor(rand() * palavrasObjecao.length)],
    ],
    perfil_resumido:
      interesse === "anual"
        ? "Família de São Luís interessada em frequência recorrente"
        : "Grupo planejando passeio pontual para o fim de semana",
    valor_estimado: valor,
    tags:
      interesse === "anual"
        ? ["crianca", "familia", "recorrente"]
        : ["grupo", "fim_de_semana"],
    routing_reason:
      "Match 92 — especialidade anual + menor tempo médio de resposta no turno atual",
    score_breakdown: {
      intencao: Math.floor(score * 0.3),
      engajamento: Math.floor(score * 0.2),
      perfil: Math.floor(score * 0.15),
      urgencia: Math.floor(score * 0.2),
      fonte: Math.floor(score * 0.15),
    },
  } as Lead;
});

/* ───────────────────────── MENSAGENS (para um lead principal) ───────────────────────── */

export const mensagensPorLead: Record<string, Mensagem[]> = {
  l9: [
    {
      id: "m1",
      lead_id: "l9",
      canal: "whatsapp",
      direcao: "inbound",
      autor: "Camila Rezende",
      conteudo:
        "Oi, boa tarde! Vi o parque no Instagram e fiquei interessada. Queria saber sobre o passaporte anual família 🏖️",
      tipo: "texto",
      sent_at: hours(5.4),
      lida: true,
    },
    {
      id: "m2",
      lead_id: "l9",
      canal: "sistema",
      direcao: "internal",
      autor: "Sistema",
      conteudo: "Lead qualificado — score 82 (urgência alta)",
      tipo: "evento",
      sent_at: hours(5.35),
    },
    {
      id: "m3",
      lead_id: "l9",
      canal: "whatsapp",
      direcao: "outbound",
      autor: "Amanda Rocha",
      conteudo:
        "Oi Camila! Que bom ter você por aqui 💙 O anual família contempla até 5 pessoas com visitas ilimitadas durante 365 dias. Posso te mandar os detalhes dos benefícios?",
      tipo: "texto",
      sent_at: hours(5.2),
      lida: true,
    },
    {
      id: "m4",
      lead_id: "l9",
      canal: "whatsapp",
      direcao: "inbound",
      autor: "Camila Rezende",
      conteudo:
        "Sim! E qual o valor? Somos em 4 (eu, meu marido e 2 crianças de 6 e 9 anos)",
      tipo: "texto",
      sent_at: hours(4.9),
      lida: true,
    },
    {
      id: "m5",
      lead_id: "l9",
      canal: "email",
      direcao: "outbound",
      autor: "Amanda Rocha",
      conteudo:
        "Proposta completa — Passaporte Anual Família (4 pessoas) — R$ 2.890 com 12x sem juros",
      tipo: "documento",
      sent_at: hours(4.7),
      lida: true,
      meta: { assunto: "Sua proposta Aquapark — Família Rezende" },
    },
    {
      id: "m6",
      lead_id: "l9",
      canal: "sistema",
      direcao: "internal",
      autor: "Sistema",
      conteudo: "E-mail aberto pelo lead (+5 pts)",
      tipo: "evento",
      sent_at: hours(4.1),
    },
    {
      id: "m7",
      lead_id: "l9",
      canal: "sistema",
      direcao: "internal",
      autor: "Sistema",
      conteudo: "Lead clicou em link de preços (+12 pts)",
      tipo: "evento",
      sent_at: hours(3.4),
    },
    {
      id: "m8",
      lead_id: "l9",
      canal: "whatsapp",
      direcao: "inbound",
      autor: "Camila Rezende",
      conteudo:
        "Nossa o valor deu uma apertada no orçamento… Vocês têm algum desconto ou parcelamento maior?",
      tipo: "texto",
      sent_at: hours(2.2),
      lida: true,
    },
    {
      id: "m9",
      lead_id: "l9",
      canal: "nota",
      direcao: "internal",
      autor: "Amanda Rocha",
      conteudo:
        "Nota interna: cliente sensível a preço — mas mencionou crianças e abriu proposta. Testar enquadramento por valor anual (R$ 240/mês).",
      tipo: "texto",
      sent_at: hours(2.15),
    },
  ],
};

/* ───────────────────────── COPILOT ───────────────────────── */

export const sugestoes: Record<string, CopilotSugestao> = {
  l9: {
    id: "s1",
    lead_id: "l9",
    tipo: "mensagem",
    urgencia: "agora",
    mensagem_sugerida:
      "Entendo perfeitamente, Camila 🙌 Pensa assim: em 365 dias o investimento fica em menos de R$ 241/mês pra família inteira — e vocês podem vir quantas vezes quiserem. Pra aliviar mais, consigo travar o parcelamento em 12x de R$ 240,83 no cartão. Topa segurar essa condição pra vocês já essa semana?",
    justificativa:
      "Objeção de preço detectada. Cliente com crianças + abriu proposta. Enquadrar por valor mensal funciona em 71% dos casos similares.",
    objecao_detectada: "Preço percebido como alto para o orçamento",
    contra_argumento:
      "Reframe para valor mensal + ilimitado + janela de fechamento curta (sem pressão artificial)",
    alerta: undefined,
    created_at: mins(3),
  },
};

/* ───────────────────────── CLIENTES ───────────────────────── */

export const clientes: Cliente[] = [
  {
    id: "cl1",
    nome: "Mariana Souza",
    cpf: "123.456.789-00",
    telefone: "(98) 98111-2233",
    email: "mariana.souza@gmail.com",
    data_nascimento: "1988-05-14",
    corretor_id: "c1",
    nps: 9,
    criado_em: days(120),
  },
  {
    id: "cl2",
    nome: "Fernando Batista",
    cpf: "456.789.123-00",
    telefone: "(98) 99122-3344",
    email: "fernando.batista@gmail.com",
    data_nascimento: "1982-09-23",
    corretor_id: "c2",
    nps: 8,
    criado_em: days(200),
  },
  {
    id: "cl3",
    nome: "Juliana Coelho",
    cpf: "789.123.456-00",
    telefone: "(98) 99233-4455",
    email: "juliana.coelho@gmail.com",
    data_nascimento: "1990-11-02",
    corretor_id: "c3",
    nps: 10,
    criado_em: days(80),
  },
];

/* ───────────────────────── PASSAPORTES ───────────────────────── */

export const passaportes: Passaporte[] = [
  {
    id: "p1",
    qr_code: "AQ-8F3K-92AB",
    cliente_id: "cl1",
    cliente_nome: "Mariana Souza",
    tipo: "anual_familia",
    vigencia_inicio: days(300),
    vigencia_fim: future(65),
    status: "ativo",
    valor_pago: 2890,
    corretor_id: "c1",
    visitas: [days(120), days(85), days(50), days(22), days(7)],
    renovacoes: 1,
    dias_restantes: 65,
  },
  {
    id: "p2",
    qr_code: "AQ-2B7L-11XZ",
    cliente_id: "cl2",
    cliente_nome: "Fernando Batista",
    tipo: "anual_individual",
    vigencia_inicio: days(330),
    vigencia_fim: future(35),
    status: "ativo",
    valor_pago: 1490,
    corretor_id: "c2",
    visitas: [days(200), days(140), days(90), days(40)],
    renovacoes: 0,
    dias_restantes: 35,
  },
  {
    id: "p3",
    qr_code: "AQ-9D1P-88QM",
    cliente_id: "cl3",
    cliente_nome: "Juliana Coelho",
    tipo: "vip",
    vigencia_inicio: days(60),
    vigencia_fim: future(305),
    status: "ativo",
    valor_pago: 4200,
    corretor_id: "c3",
    visitas: [days(30), days(10)],
    renovacoes: 0,
    dias_restantes: 305,
  },
  {
    id: "p4",
    qr_code: "AQ-5T2W-47RK",
    cliente_id: "cl1",
    cliente_nome: "Ana Paula Ribeiro",
    tipo: "diario",
    vigencia_inicio: days(2),
    vigencia_fim: days(1),
    status: "expirado",
    valor_pago: 180,
    corretor_id: "c4",
    visitas: [days(2)],
    renovacoes: 0,
    dias_restantes: -1,
  },
  {
    id: "p5",
    qr_code: "AQ-7H6M-31FG",
    cliente_id: "cl2",
    cliente_nome: "Roberto Pires",
    tipo: "anual_individual",
    vigencia_inicio: days(350),
    vigencia_fim: future(15),
    status: "ativo",
    valor_pago: 1390,
    corretor_id: "c5",
    visitas: [days(300), days(180), days(60)],
    renovacoes: 0,
    dias_restantes: 15,
  },
  {
    id: "p6",
    qr_code: "AQ-1X4P-55JH",
    cliente_id: "cl4",
    cliente_nome: "Letícia Mourão",
    tipo: "anual_familia",
    vigencia_inicio: days(358),
    vigencia_fim: future(7),
    status: "ativo",
    valor_pago: 3120,
    corretor_id: "c1",
    visitas: [days(240), days(160), days(80), days(30), days(10)],
    renovacoes: 2,
    dias_restantes: 7,
  },
  {
    id: "p7",
    qr_code: "AQ-3G8V-29KP",
    cliente_id: "cl5",
    cliente_nome: "Henrique Dantas",
    tipo: "anual_individual",
    vigencia_inicio: days(362),
    vigencia_fim: future(3),
    status: "ativo",
    valor_pago: 1490,
    corretor_id: "c2",
    visitas: [days(320), days(200), days(120), days(45)],
    renovacoes: 0,
    dias_restantes: 3,
  },
  {
    id: "p8",
    qr_code: "AQ-6Q2R-77WT",
    cliente_id: "cl6",
    cliente_nome: "Sabrina Lopes",
    tipo: "anual_familia",
    vigencia_inicio: days(340),
    vigencia_fim: future(25),
    status: "ativo",
    valor_pago: 2890,
    corretor_id: "c3",
    visitas: [days(260), days(170), days(90)],
    renovacoes: 0,
    dias_restantes: 25,
  },
  {
    id: "p9",
    qr_code: "AQ-4Y9E-63BL",
    cliente_id: "cl7",
    cliente_nome: "Paulo Menezes",
    tipo: "vip",
    vigencia_inicio: days(320),
    vigencia_fim: future(45),
    status: "ativo",
    valor_pago: 4500,
    corretor_id: "c1",
    visitas: [days(280), days(220), days(150), days(90), days(30)],
    renovacoes: 1,
    dias_restantes: 45,
  },
  {
    id: "p10",
    qr_code: "AQ-0N5U-84AD",
    cliente_id: "cl8",
    cliente_nome: "Renata Farias",
    tipo: "anual_individual",
    vigencia_inicio: days(365),
    vigencia_fim: days(0),
    status: "expirado",
    valor_pago: 1390,
    corretor_id: "c4",
    visitas: [days(330), days(220), days(110), days(30)],
    renovacoes: 0,
    dias_restantes: 0,
  },
];

/* ───────────────────────── TICKETS SAC ───────────────────────── */

export const tickets: Ticket[] = [
  {
    id: "t1",
    numero: 10284,
    cliente_id: "cl1",
    cliente_nome: "Mariana Souza",
    passaporte_id: "p1",
    canal: "whatsapp",
    categoria: "acesso",
    prioridade: "alta",
    status: "em_andamento",
    assunto: "QR Code não valida na catraca",
    descricao:
      "Cheguei com a família hoje às 10h e o QR não estava validando. Funcionário ajudou mas demorou 20min.",
    atendente_id: "u5",
    tom_cliente: "insatisfeito",
    sla_horas: 4,
    sla_restante: 1,
    sla_breach: false,
    created_at: hours(3),
  },
  {
    id: "t2",
    numero: 10285,
    cliente_id: "cl3",
    cliente_nome: "Juliana Coelho",
    passaporte_id: "p3",
    canal: "email",
    categoria: "duvida",
    prioridade: "normal",
    status: "aberto",
    assunto: "Como adicionar dependente no anual família?",
    descricao: "Queria incluir meu sobrinho de 8 anos no passaporte família.",
    tom_cliente: "neutro",
    sla_horas: 24,
    sla_restante: 19,
    sla_breach: false,
    created_at: hours(5),
  },
  {
    id: "t3",
    numero: 10286,
    cliente_id: "cl2",
    cliente_nome: "Fernando Batista",
    passaporte_id: "p2",
    canal: "whatsapp",
    categoria: "reclamacao",
    prioridade: "critica",
    status: "em_andamento",
    assunto: "Cobrança duplicada no cartão",
    descricao:
      "Foram 2 débitos de R$1490 no dia 12/04. Preciso do estorno urgente.",
    atendente_id: "u5",
    tom_cliente: "furioso",
    sla_horas: 2,
    sla_restante: -1,
    sla_breach: true,
    created_at: hours(4),
  },
  {
    id: "t4",
    numero: 10287,
    cliente_id: "cl1",
    cliente_nome: "Helena Torres",
    canal: "instagram",
    categoria: "elogio",
    prioridade: "baixa",
    status: "resolvido",
    assunto: "Parabéns pela equipe!",
    descricao: "Quero elogiar o atendimento da Amanda, foi maravilhosa 💙",
    atendente_id: "u5",
    tom_cliente: "satisfeito",
    sla_horas: 48,
    sla_restante: 40,
    sla_breach: false,
    created_at: days(1),
  },
  {
    id: "t5",
    numero: 10288,
    cliente_id: "cl3",
    cliente_nome: "Carlos Eduardo",
    canal: "telefone",
    categoria: "cancelamento",
    prioridade: "alta",
    status: "aguardando",
    assunto: "Solicitação de cancelamento de passaporte anual",
    descricao: "Mudou de cidade, solicita reembolso proporcional.",
    atendente_id: "u5",
    tom_cliente: "neutro",
    sla_horas: 24,
    sla_restante: 8,
    sla_breach: false,
    created_at: hours(16),
  },
  {
    id: "t6",
    numero: 10289,
    cliente_id: "cl2",
    cliente_nome: "Paula Macedo",
    canal: "whatsapp",
    categoria: "pagamento",
    prioridade: "normal",
    status: "aberto",
    assunto: "Boleto de renovação não chegou",
    descricao: "Venceu ontem e não recebi o boleto por e-mail",
    tom_cliente: "neutro",
    sla_horas: 8,
    sla_restante: 5,
    sla_breach: false,
    created_at: hours(3),
  },
];

/* ───────────────────────── INSIGHTS ───────────────────────── */

export const insights: Insight[] = [
  {
    id: "i1",
    lead_id: "l33",
    tipo: "fechado",
    tipo_passaporte: "anual_familia",
    valor: 2890,
    corretor: "Amanda Rocha",
    ciclo_dias: 2,
    gatilho: "Reframe do valor anual para custo mensal equivalente",
    argumentos_funcionaram: [
      "R$ 241/mês pra família inteira",
      "Ilimitado — sem limite de visitas",
      "Calendário de férias próximo",
    ],
    objecoes_apareceram: ["preço inicial alto", "dúvida sobre benefícios"],
    tecnicas_usadas: ["reframe de valor", "criação de urgência suave"],
    resumo:
      "Família com 2 crianças, sensível a preço. Fechou quando valor mensal ficou saliente.",
    tags: ["crianca", "preco_sensivel", "anual"],
    created_at: days(1),
  },
  {
    id: "i2",
    lead_id: "l34",
    tipo: "perdido",
    tipo_passaporte: "anual_individual",
    corretor: "Felipe Souza",
    ciclo_dias: 12,
    gatilho: "Silêncio de 6 dias sem follow-up adequado",
    argumentos_funcionaram: [],
    objecoes_apareceram: ["comparando com concorrente", "prazo de decisão"],
    tecnicas_usadas: ["envio de material padrão"],
    resumo:
      "Lead interessado mas corretor demorou 48h na primeira resposta. Lead esfriou.",
    tags: ["tempo_resposta", "concorrencia"],
    created_at: days(3),
  },
];

/* ───────────────────────── ALERTAS ───────────────────────── */

export const alertas: Alerta[] = [
  {
    id: "a1",
    tipo: "sla_breach",
    severidade: "critical",
    titulo: "SLA estourado — Ticket #10286",
    descricao: "Cobrança duplicada sem resposta há 4h (SLA 2h)",
    ticket_id: "t3",
    created_at: mins(18),
  },
  {
    id: "a2",
    tipo: "lead_parado",
    severidade: "warning",
    titulo: "Lead parado há 7h",
    descricao: "Camila Rezende (score 82) aguardando resposta — Amanda Rocha",
    lead_id: "l9",
    corretor_id: "c1",
    created_at: mins(32),
  },
  {
    id: "a3",
    tipo: "score_cai",
    severidade: "info",
    titulo: "Score caiu 22 pts",
    descricao: "Rafael Oliveira — 48h sem resposta ao corretor",
    lead_id: "l6",
    corretor_id: "c3",
    created_at: hours(1.5),
  },
  {
    id: "a4",
    tipo: "meta",
    severidade: "info",
    titulo: "Meta diária atingida",
    descricao: "Amanda Rocha bateu R$ 3.500 — 117% da meta do dia",
    corretor_id: "c1",
    created_at: hours(2),
  },
  {
    id: "a5",
    tipo: "health_baixa",
    severidade: "critical",
    titulo: "Health crítico — Felipe Souza",
    descricao: "Score 40/100. 9 leads parados, resposta 24h em 45%. Vazão comprometida.",
    corretor_id: "c6",
    created_at: hours(0.5),
    acao_sugerida: "Desafogar 9 leads ou suspender alocação de novos",
  },
  {
    id: "a6",
    tipo: "backlog_alto",
    severidade: "warning",
    titulo: "Backlog alto — Carla Mendes",
    descricao: "10 leads parados (45% do total). Health caiu para 52.",
    corretor_id: "c3",
    created_at: hours(1),
    acao_sugerida: "Realocar 6 leads mais velhos para Eduarda",
  },
  {
    id: "a7",
    tipo: "renovacao_vencendo",
    severidade: "warning",
    titulo: "Passaporte vence em 3 dias",
    descricao: "Henrique Dantas — anual individual R$ 1.490. Sem contato de renovação.",
    passaporte_id: "p7",
    corretor_id: "c2",
    created_at: hours(2.5),
    acao_sugerida: "Iniciar cadência de renovação 7d",
  },
  {
    id: "a8",
    tipo: "renovacao_vencendo",
    severidade: "critical",
    titulo: "Passaporte vence em 7 dias",
    descricao: "Letícia Mourão — anual família R$ 3.120, cliente premium há 2 renovações.",
    passaporte_id: "p6",
    corretor_id: "c1",
    created_at: hours(3),
    acao_sugerida: "Contato direto + oferta de upgrade VIP",
  },
  {
    id: "a9",
    tipo: "sem_resposta",
    severidade: "warning",
    titulo: "Cliente premium sem resposta há 48h",
    descricao: "Roberto Pires (p5) não respondeu tentativa de renovação.",
    passaporte_id: "p5",
    corretor_id: "c5",
    created_at: hours(6),
    acao_sugerida: "Escalar para gestor ou realocar",
  },
  {
    id: "a10",
    tipo: "score_cai",
    severidade: "info",
    titulo: "Taxa de conversão caiu 8pp",
    descricao: "Canal Instagram — últimos 7 dias: 19% → 11%. Campanha saturada?",
    created_at: hours(8),
    acao_sugerida: "Revisar criativos ou reduzir budget",
  },
];

/* ───────────────────────── AGREGADOS ───────────────────────── */

export const receitaSerie = [
  { dia: "01/04", real: 9800, meta: 12000 },
  { dia: "03/04", real: 11200, meta: 12000 },
  { dia: "05/04", real: 13400, meta: 12000 },
  { dia: "07/04", real: 10700, meta: 12000 },
  { dia: "09/04", real: 14100, meta: 12000 },
  { dia: "11/04", real: 15800, meta: 12000 },
  { dia: "13/04", real: 12600, meta: 12000 },
  { dia: "15/04", real: 17200, meta: 12000 },
  { dia: "17/04", real: 16400, meta: 12000 },
  { dia: "19/04", real: 18900, meta: 12000 },
];

export const funil = [
  { etapa: "Novo", count: 324, valor: 412000 },
  { etapa: "Qualificado", count: 218, valor: 378000 },
  { etapa: "Em atendimento", count: 142, valor: 289000 },
  { etapa: "Proposta", count: 74, valor: 198000 },
  { etapa: "Fechado", count: 31, valor: 92800 },
];

export const canaisROI = [
  { canal: "RD Station", volume: 148, taxa: 0.24, ticket: 1820, cpl: 38 },
  { canal: "WhatsApp", volume: 212, taxa: 0.31, ticket: 1640, cpl: 12 },
  { canal: "Instagram", volume: 96, taxa: 0.19, ticket: 1510, cpl: 22 },
  { canal: "Indicação", volume: 54, taxa: 0.48, ticket: 2310, cpl: 0 },
  { canal: "Site", volume: 78, taxa: 0.22, ticket: 1720, cpl: 9 },
  { canal: "Google", volume: 44, taxa: 0.18, ticket: 1480, cpl: 31 },
];

export const heatmap = Array.from({ length: 7 }).map((_, d) =>
  Array.from({ length: 24 }).map((_, h) => {
    const peak =
      (h >= 9 && h <= 12) || (h >= 15 && h <= 19)
        ? 0.6 + Math.random() * 0.4
        : Math.random() * 0.3;
    const weekend = d === 0 || d === 6 ? 0.7 : 1;
    return Math.round(peak * 100 * weekend);
  })
);

export const renovacoesProximas = passaportes
  .filter(
    (p) => p.status === "ativo" && (p.dias_restantes ?? 999) <= 60
  )
  .sort((a, b) => (a.dias_restantes ?? 0) - (b.dias_restantes ?? 0));

export const desafios = [
  {
    id: "d1",
    titulo: "Fechar 3 passaportes anuais essa semana",
    progresso: 2,
    total: 3,
    recompensa: "Badge Conversor Anual",
    prazo: "3 dias",
  },
  {
    id: "d2",
    titulo: "Tempo médio de resposta < 5min por 7 dias",
    progresso: 5,
    total: 7,
    recompensa: "Badge Raposa Veloz",
    prazo: "2 dias",
  },
  {
    id: "d3",
    titulo: "Zero leads parados > 6h por 5 dias",
    progresso: 3,
    total: 5,
    recompensa: "Badge Zero Parado",
    prazo: "2 dias",
  },
];

/* ───────────── Alinhamento de nomes/status com conversas WA ───────────── */

const leadOverrides: Record<
  string,
  { nome?: string; corretor_id?: string; status?: Lead["status"] }
> = {
  l33: { nome: "Paula Rezende", corretor_id: "c1", status: "fechado" },
  l34: { nome: "Ricardo Barros", corretor_id: "c6", status: "perdido" },
  l35: { nome: "Mariana Dias", corretor_id: "c2", status: "fechado" },
  l36: { nome: "Carlos Vieira", corretor_id: "c3", status: "perdido" },
  l37: { nome: "Beatriz Lima", corretor_id: "c1", status: "em_atendimento" },
  l38: { nome: "Thiago Paiva", corretor_id: "c4", status: "em_atendimento" },
};
for (const [id, patch] of Object.entries(leadOverrides)) {
  const lead = leads.find((l) => l.id === id);
  if (!lead) continue;
  if (patch.nome) lead.nome = patch.nome;
  if (patch.corretor_id) lead.corretor_id = patch.corretor_id;
  if (patch.status) lead.status = patch.status;
}

/* ───────────────────────── WHATSAPP — CONVERSAS COMPLETAS ───────────────────────── */

type RawMsg = {
  quem: "cliente" | "corretor" | "sistema";
  texto: string;
  m: number; // minutos atrás
  tipo?: "texto" | "audio" | "imagem" | "documento" | "evento";
  duracao?: string;
};

const makeConversa = (
  leadId: string,
  autorCliente: string,
  autorCorretor: string,
  raws: RawMsg[]
): Mensagem[] =>
  raws.map((r, i) => ({
    id: `wa-${leadId}-${i}`,
    lead_id: leadId,
    canal: r.quem === "sistema" ? ("sistema" as const) : ("whatsapp" as const),
    direcao:
      r.quem === "cliente"
        ? ("inbound" as const)
        : r.quem === "sistema"
        ? ("internal" as const)
        : ("outbound" as const),
    autor:
      r.quem === "cliente"
        ? autorCliente
        : r.quem === "corretor"
        ? autorCorretor
        : "Sistema",
    conteudo: r.texto,
    tipo: r.tipo ?? "texto",
    sent_at: mins(r.m),
    lida: r.m > 1,
    meta: r.duracao ? { duracao: r.duracao } : undefined,
  }));

// Conversas ricas por lead — inclui ganhas, perdidas e ativas
export const conversasMensagens: Record<string, Mensagem[]> = {
  // l9 já existe em mensagensPorLead — ativa, em objeção de preço
  l9: mensagensPorLead.l9,

  // GANHA — família, fechou por reframe mensal
  l33: makeConversa("l33", "Paula Rezende", "Amanda Rocha", [
    { quem: "cliente", texto: "Oi, vi a promoção do anual família. Como funciona?", m: 2880 },
    {
      quem: "corretor",
      texto:
        "Oi Paula! Tudo bem? 💙 O anual família é pra até 5 pessoas com visitas ilimitadas por 365 dias. Vocês são quantos?",
      m: 2875,
    },
    { quem: "cliente", texto: "Somos 4 — eu, meu marido e 2 crianças (5 e 9)", m: 2870 },
    {
      quem: "corretor",
      texto:
        "Perfeito! Então em 4 pessoas o investimento é R$ 2.890 — que dá R$ 241/mês pra família toda, ilimitado. Quer que eu mande os benefícios completos?",
      m: 2865,
    },
    { quem: "cliente", texto: "Pode mandar. Mas R$ 2.890 tá salgado viu…", m: 2860 },
    {
      quem: "corretor",
      texto:
        "Entendo Paula 🙌 Pensa assim: uma entrada de diária hoje sai R$ 180 por pessoa. Com 4 pessoas indo só 4x no ano vocês já cobrem o anual — e passam a ir ilimitado. Posso travar em 12x de R$ 240,83 no cartão pra aliviar?",
      m: 2855,
    },
    { quem: "sistema", texto: "Proposta enviada — 12x R$ 240,83", m: 2850, tipo: "evento" },
    { quem: "cliente", texto: "Vou conversar com meu marido hoje à noite e te retorno", m: 2600 },
    {
      quem: "corretor",
      texto:
        "Claro! Só uma coisa — essa condição de 12x é até sexta. Se precisar eu travo pra vocês hoje sem compromisso de pagar agora 😊",
      m: 2595,
    },
    { quem: "cliente", texto: "Ah isso ajuda sim! Por favor trava", m: 2400 },
    { quem: "corretor", texto: "Travado ✅ Reservei até sexta-feira 18h pra vocês.", m: 2395 },
    { quem: "cliente", texto: "Boa noite! Conversamos e queremos fechar 🎉", m: 1200 },
    {
      quem: "corretor",
      texto:
        "Quee maravilha Paula! 🥳 Te mando o link de pagamento agora mesmo. Qualquer coisa me chama.",
      m: 1195,
    },
    { quem: "sistema", texto: "Pagamento confirmado — R$ 2.890 (12x)", m: 900, tipo: "evento" },
    {
      quem: "corretor",
      texto:
        "Pagamento aprovado! 🎊 Seu passaporte família está ativo. Em até 2h você recebe o QR por e-mail. Seja muito bem-vinda à família Aquapark 💙",
      m: 895,
    },
  ]),

  // PERDIDA — foi pro concorrente por preço
  l34: makeConversa("l34", "Ricardo Barros", "Felipe Souza", [
    { quem: "cliente", texto: "Quanto tá o passaporte anual individual?", m: 17280 },
    { quem: "corretor", texto: "Boa tarde! O anual individual tá R$ 1.490.", m: 14400 },
    { quem: "sistema", texto: "Tempo de 1ª resposta: 48h (acima da meta de 5min)", m: 14395, tipo: "evento" },
    { quem: "cliente", texto: "Hm, achei salgado. O Beach Park tá R$ 990", m: 14000 },
    { quem: "corretor", texto: "Entendo, mas nosso parque tem mais atrações.", m: 13000 },
    { quem: "cliente", texto: "Vou pensar", m: 12500 },
    { quem: "corretor", texto: "Ok, qualquer coisa me chama 👍", m: 12400 },
    { quem: "sistema", texto: "Cliente sem resposta há 6 dias", m: 1440, tipo: "evento" },
    {
      quem: "corretor",
      texto: "Oi Ricardo, ainda tem interesse no passaporte?",
      m: 1200,
    },
    { quem: "cliente", texto: "Já fechei com o concorrente, obrigado", m: 600 },
  ]),

  // GANHA — urgência de aniversário, fechou rápido
  l35: makeConversa("l35", "Mariana Dias", "Bruno Teixeira", [
    {
      quem: "cliente",
      texto: "Preciso urgente de passaporte diário pra sábado — aniversário do meu filho 🎂",
      m: 720,
    },
    { quem: "corretor", texto: "Mariana, tudo bem? Claro, quantas pessoas vão?", m: 718 },
    { quem: "cliente", texto: "12 crianças e uns 6 adultos", m: 716 },
    {
      quem: "corretor",
      texto:
        "Que legal! Pra aniversário temos o Combo Festa: grupo de 15+ leva 10% OFF + área reservada do parque aquático + bolo cortesia. Posso fechar esse combo pra você?",
      m: 715,
    },
    { quem: "cliente", texto: "Adorei! Quanto fica?", m: 710 },
    { quem: "corretor", texto: "18 pessoas × R$ 162 (com desconto) = R$ 2.916. Topa?", m: 708 },
    { quem: "cliente", texto: "Topo! Manda o link pra pagar", m: 705 },
    { quem: "sistema", texto: "Pagamento confirmado — R$ 2.916", m: 680, tipo: "evento" },
    { quem: "corretor", texto: "Fechado! 🎉 Área reservada confirmada pra sábado 14h. Bolo cortesia já vai no check-in 🥳", m: 675 },
  ]),

  // PERDIDA — sumiu após proposta
  l36: makeConversa("l36", "Carlos Vieira", "Carla Mendes", [
    { quem: "cliente", texto: "Oi, quanto tá o VIP?", m: 10080 },
    { quem: "corretor", texto: "Oi Carlos! O VIP anual é R$ 4.200. Inclui acesso prioritário, cabana privativa e buffet liberado. Quer os detalhes?", m: 10075 },
    { quem: "cliente", texto: "Pode mandar", m: 10070 },
    { quem: "corretor", texto: "", m: 10065, tipo: "documento" },
    { quem: "corretor", texto: "📄 Proposta_VIP_Carlos_Vieira.pdf", m: 10064 },
    { quem: "sistema", texto: "Proposta visualizada pelo cliente (+5 pts)", m: 10060, tipo: "evento" },
    { quem: "corretor", texto: "Alguma dúvida? Posso explicar qualquer benefício", m: 8640 },
    { quem: "corretor", texto: "Oi Carlos, tudo bem? Alguma novidade sobre o VIP?", m: 4320 },
    { quem: "corretor", texto: "Boa tarde! Qualquer dúvida me avisa 😊", m: 1440 },
    { quem: "sistema", texto: "Lead sem resposta há 7 dias após 3 follow-ups", m: 60, tipo: "evento" },
  ]),

  // ATIVA — quente, aguardando resposta do corretor
  l37: makeConversa("l37", "Beatriz Lima", "Amanda Rocha", [
    { quem: "cliente", texto: "Oi! Vi o parque e queria entender o anual família 😊", m: 180 },
    {
      quem: "corretor",
      texto: "Oi Beatriz! Que alegria 💙 Vocês são quantos na família?",
      m: 178,
    },
    { quem: "cliente", texto: "4 — 2 adultos e 2 crianças (6 e 11)", m: 175 },
    {
      quem: "corretor",
      texto:
        "Perfeito pra vocês! O anual família fica R$ 2.890 — que equivale a R$ 241/mês pra família toda. Ilimitado. Quer os benefícios completos?",
      m: 173,
    },
    { quem: "cliente", texto: "Pode mandar!", m: 170 },
    { quem: "corretor", texto: "📄 Benefícios_Anual_Familia.pdf", m: 168, tipo: "documento" },
    { quem: "sistema", texto: "Proposta aberta (+5 pts)", m: 160, tipo: "evento" },
    { quem: "cliente", texto: "Gostei! Tem parcelamento maior que 12x?", m: 12 },
  ]),

  // ATIVA — morna, aguardando cliente
  l38: makeConversa("l38", "Thiago Paiva", "Diego Alves", [
    { quem: "cliente", texto: "Quanto tá o diário individual?", m: 4320 },
    { quem: "corretor", texto: "Boa tarde Thiago! Individual tá R$ 180 adulto e R$ 120 criança.", m: 4318 },
    { quem: "cliente", texto: "Ok, vou ver com a família", m: 4300 },
    { quem: "corretor", texto: "Ok! Qualquer dúvida me chama 👍", m: 4295 },
    { quem: "corretor", texto: "Oi Thiago, pensou sobre o passeio?", m: 1440 },
  ]),
};

// Override mensagensPorLead with complete set
export const mensagensWA = conversasMensagens;

export const conversasWA: ConversaWA[] = [
  {
    id: "conv-l9",
    lead_id: "l9",
    corretor_id: "c1",
    status: "aguardando_corretor",
    ultima_atividade: mins(12),
    nao_lidas: 2,
    fixada: true,
    temperatura: "muito_quente",
    ia_parcial: {
      objecoes_detectadas: ["Preço percebido como alto"],
      gatilhos_positivos: ["Crianças pequenas", "Abriu proposta", "Interesse em parcelamento"],
      proximo_passo_sugerido:
        "Reframe para valor mensal + oferecer 18x no cartão. 71% de conversão em casos similares.",
    },
  },
  {
    id: "conv-l37",
    lead_id: "l37",
    corretor_id: "c1",
    status: "aguardando_corretor",
    ultima_atividade: mins(12),
    nao_lidas: 1,
    temperatura: "quente",
    ia_parcial: {
      objecoes_detectadas: ["Busca parcelamento estendido"],
      gatilhos_positivos: ["Abriu proposta", "Família", "Resposta rápida"],
      proximo_passo_sugerido: "Oferecer 18x ou 24x. Fechamento provável em até 24h.",
    },
  },
  {
    id: "conv-l35",
    lead_id: "l35",
    corretor_id: "c2",
    status: "encerrada_ganha",
    ultima_atividade: mins(675),
    nao_lidas: 0,
    temperatura: "quente",
    outcome: {
      tipo: "ganha",
      valor: 2916,
      tipo_passaporte: "diario",
      resumo_ia:
        "Venda fechada em menos de 2h. Gatilho: Combo Festa com área reservada + cortesia simbólica (bolo). Cliente veio com urgência de aniversário.",
      padroes_identificados: [
        "Oferta específica para ocasião (aniversário)",
        "Benefício simbólico aumenta percepção de valor",
        "Grupo 15+ → desconto 10% + brinde → fechamento em 1ª sessão",
      ],
      encerrada_em: mins(675),
      encerrada_por: "c2",
    },
  },
  {
    id: "conv-l33",
    lead_id: "l33",
    corretor_id: "c1",
    status: "encerrada_ganha",
    ultima_atividade: mins(895),
    nao_lidas: 0,
    temperatura: "quente",
    outcome: {
      tipo: "ganha",
      valor: 2890,
      tipo_passaporte: "anual_familia",
      resumo_ia:
        "Venda fechada em 48h. Objeção de preço superada com reframe para valor mensal. Ancoragem em diárias + reserva sem compromisso deram segurança à decisão.",
      padroes_identificados: [
        "Reframe de valor anual → mensal (R$ 241/mês)",
        "Ancoragem com diária (R$ 180 × 4 pessoas × 4 visitas)",
        "Reserva com prazo sem pressão de pagamento",
      ],
      encerrada_em: mins(895),
      encerrada_por: "c1",
    },
  },
  {
    id: "conv-l34",
    lead_id: "l34",
    corretor_id: "c6",
    status: "encerrada_perdida",
    ultima_atividade: mins(600),
    nao_lidas: 0,
    temperatura: "fria",
    outcome: {
      tipo: "perdida",
      motivo_perdida: "foi_concorrente",
      acao_realizada: "nutrir_30d",
      resumo_ia:
        "Perda causada por tempo de resposta de 48h na primeira mensagem. Cliente já estava cotando concorrentes. Argumento 'mais atrações' sem prova concreta não converteu.",
      padroes_identificados: [
        "Atraso > 1h na 1ª resposta → queda de 38% na conversão",
        "Argumento sem prova quantitativa perde contra preço",
      ],
      encerrada_em: mins(600),
      encerrada_por: "c6",
    },
  },
  {
    id: "conv-l36",
    lead_id: "l36",
    corretor_id: "c3",
    status: "encerrada_perdida",
    ultima_atividade: mins(60),
    nao_lidas: 0,
    temperatura: "fria",
    outcome: {
      tipo: "perdida",
      motivo_perdida: "sumiu",
      acao_realizada: "nutrir_15d",
      resumo_ia:
        "Proposta VIP enviada e visualizada, mas cliente sumiu. 3 follow-ups sem variação de abordagem. Indicado colocar em cadência de nutrição com conteúdo experiencial.",
      padroes_identificados: [
        "VIP sem demonstração visual (vídeo da cabana) cai 42%",
        "Follow-ups iguais perdem engajamento após 2ª tentativa",
      ],
      encerrada_em: mins(60),
      encerrada_por: "c3",
    },
  },
  {
    id: "conv-l38",
    lead_id: "l38",
    corretor_id: "c4",
    status: "aguardando_cliente",
    ultima_atividade: mins(1440),
    nao_lidas: 0,
    temperatura: "fria",
    ia_parcial: {
      objecoes_detectadas: ["Sem decisão após 24h"],
      gatilhos_positivos: [],
      proximo_passo_sugerido:
        "Enviar vídeo curto das atrações com família. Testar gatilho de calendário (próximo feriado).",
    },
  },
  // Mais conversas ativas distribuídas por outros corretores pra gestor ver volume
  ...Array.from({ length: 12 }).map((_, i) => {
    const cId = corretores[i % corretores.length].id;
    const lId = `l${10 + i}`;
    const temps: ConversaWA["temperatura"][] = ["fria", "morna", "quente", "muito_quente"];
    const statuses: ConversaWA["status"][] = [
      "ativa",
      "aguardando_cliente",
      "aguardando_corretor",
    ];
    return {
      id: `conv-${lId}`,
      lead_id: lId,
      corretor_id: cId,
      status: statuses[i % statuses.length],
      ultima_atividade: mins(30 + i * 45),
      nao_lidas: i % 3 === 0 ? (i % 4) + 1 : 0,
      temperatura: temps[i % temps.length],
    };
  }),
];

/* ───────────────────────── IA — PADRÕES VENCEDORES ───────────────────────── */

export const padroesVencedores: PadraoVencedor[] = [
  {
    id: "pat1",
    titulo: "Reframe para valor mensal",
    descricao:
      "Quando o cliente resiste ao preço anual, apresentar o valor dividido por mês aumenta drasticamente a conversão.",
    exemplo_frase:
      "R$ 2.890 = R$ 241/mês pra família toda, ilimitado",
    uplift_pct: 41,
    aplicado_em: 87,
    ganhou_em: 62,
    tags: ["preco", "familia", "anual"],
    descoberto_em: days(18),
    corretor_origem: "Amanda Rocha",
  },
  {
    id: "pat2",
    titulo: "Ancoragem com diárias",
    descricao:
      "Comparar o anual com o custo de 4-5 diárias para a família equivalente deixa o benefício ilimitado óbvio.",
    exemplo_frase:
      "4 diárias × 4 pessoas = já paga o anual — e depois é ilimitado",
    uplift_pct: 34,
    aplicado_em: 64,
    ganhou_em: 41,
    tags: ["preco", "familia", "anual"],
    descoberto_em: days(12),
    corretor_origem: "Amanda Rocha",
  },
  {
    id: "pat3",
    titulo: "Reserva sem compromisso",
    descricao:
      "Oferecer trava da condição até X dias sem exigir pagamento imediato reduz atrito e aumenta retorno.",
    exemplo_frase: "Travo essa condição até sexta sem você precisar pagar agora",
    uplift_pct: 28,
    aplicado_em: 51,
    ganhou_em: 29,
    tags: ["fechamento", "urgencia_suave"],
    descoberto_em: days(9),
    corretor_origem: "Amanda Rocha",
  },
  {
    id: "pat4",
    titulo: "Combo Festa com brinde simbólico",
    descricao:
      "Para grupos 15+, oferta de desconto + brinde de baixo custo (bolo, foto) converte em 1ª sessão.",
    exemplo_frase:
      "Grupo 15+: 10% OFF + área reservada + bolo cortesia 🎂",
    uplift_pct: 52,
    aplicado_em: 22,
    ganhou_em: 17,
    tags: ["grupo", "evento", "diario"],
    descoberto_em: days(22),
    corretor_origem: "Bruno Teixeira",
  },
  {
    id: "pat5",
    titulo: "Resposta em < 5min na 1ª mensagem",
    descricao:
      "Leads respondidos em menos de 5 minutos convertem 2,4× mais do que os respondidos em mais de 1h.",
    exemplo_frase: "(padrão de tempo — sem frase específica)",
    uplift_pct: 38,
    aplicado_em: 312,
    ganhou_em: 118,
    tags: ["tempo_resposta", "operacional"],
    descoberto_em: days(45),
  },
  {
    id: "pat6",
    titulo: "Vídeo curto da experiência",
    descricao:
      "Enviar vídeo de 30-60s da atração específica que a família quer aumenta abertura e resposta.",
    exemplo_frase: "(vídeo) Piscina de ondas no último feriado — 30s",
    uplift_pct: 24,
    aplicado_em: 48,
    ganhou_em: 22,
    tags: ["conteudo", "visual"],
    descoberto_em: days(7),
    corretor_origem: "Carla Mendes",
  },
  {
    id: "pat7",
    titulo: "Pergunta sobre ocasião antes de cotar",
    descricao:
      "Descobrir o motivo (aniversário, férias, reencontro) antes de preço permite oferta customizada e reduz negociação.",
    exemplo_frase: "Antes do valor: quero entender — é pra uma data especial?",
    uplift_pct: 19,
    aplicado_em: 95,
    ganhou_em: 34,
    tags: ["descoberta", "rapport"],
    descoberto_em: days(28),
  },
];

/* ───────────────────────── IA — ANTIPADRÕES (do que deu errado) ───────────────────────── */

export const antipadroes = [
  {
    id: "anti1",
    titulo: "Argumento sem prova quantitativa",
    descricao: "“Nosso parque tem mais atrações” sem número vs concorrente.",
    perdeu_em: 18,
    solucao: "Trocar por “32 atrações vs 19 do concorrente — 68% a mais”.",
  },
  {
    id: "anti2",
    titulo: "Follow-ups idênticos",
    descricao: "Repetir “qualquer coisa me chama” perde força após 2ª vez.",
    perdeu_em: 24,
    solucao: "Variar o ângulo: enviar benefício novo, caso de uso, depoimento.",
  },
  {
    id: "anti3",
    titulo: "Proposta sem contexto visual",
    descricao: "PDF puro sem vídeo da cabana/experiência para VIP cai 42%.",
    perdeu_em: 11,
    solucao: "Anexar vídeo curto da atração/espaço específico.",
  },
];

/* ───────────────────────── WHATSAPP — TEMPLATES ───────────────────────── */

export const templatesWA: TemplateWA[] = [
  {
    id: "tpl1",
    nome: "Abertura — lead novo",
    categoria: "abertura",
    conteudo:
      "Oi {nome}! Tudo bem? 💙 Aqui é {corretor} do Aquapark Valparaíso. Vi seu interesse em {interesse} — posso te ajudar em alguns pontos?",
    variaveis: ["nome", "corretor", "interesse"],
  },
  {
    id: "tpl2",
    nome: "Proposta — anual família",
    categoria: "proposta",
    conteudo:
      "{nome}, sua proposta do Anual Família (4 pessoas) fica em R$ 2.890 — R$ 241/mês com 12x sem juros. Quer que eu trave essa condição?",
    variaveis: ["nome"],
  },
  {
    id: "tpl3",
    nome: "Reframe — preço",
    categoria: "objecao",
    conteudo:
      "Entendo {nome} 🙌 Pensa assim: em 365 dias o investimento fica em R$ {valor_mensal}/mês pra família inteira — e vocês vão quantas vezes quiserem. Ilimitado.",
    variaveis: ["nome", "valor_mensal"],
  },
  {
    id: "tpl4",
    nome: "Fechamento — trava de condição",
    categoria: "fechamento",
    conteudo:
      "Essa condição de 12x é até {data}. Se precisar eu travo pra vocês hoje sem compromisso de pagar agora 😊",
    variaveis: ["data"],
  },
  {
    id: "tpl5",
    nome: "Nutrição — 15 dias",
    categoria: "nutricao",
    conteudo:
      "Oi {nome}! Tudo bem? Lembrei que vocês estavam pensando no passaporte. Acabou de sair a agenda de férias do próximo feriado — quer que eu reserve?",
    variaveis: ["nome"],
  },
];

/* ───────────────────── IA — ROTEAMENTO INTELIGENTE ───────────────────── */

// Calcula match entre um lead e cada corretor disponível
export function calcularMatch(lead: Lead): MatchCorretor[] {
  const ativos = corretores.filter((c) => c.ativo);
  const matches: MatchCorretor[] = ativos.map((c) => {
    const razoes: MatchCorretor["razoes"] = [];
    let score = 40; // baseline

    // 1. Especialidade
    const interesse = lead.interesse;
    if (
      (interesse === "anual" && c.especialidade === "anual") ||
      (interesse === "diario" && c.especialidade === "diario")
    ) {
      const peso = 22;
      score += peso;
      razoes.push({
        label: `Especialista em ${interesse}`,
        peso,
        tipo: "positivo",
      });
    } else if (c.especialidade === "ambos") {
      score += 8;
      razoes.push({
        label: "Atende ambos os tipos",
        peso: 8,
        tipo: "positivo",
      });
    }

    // 2. Taxa de conversão segmentada
    const convSeg =
      interesse === "anual"
        ? c.taxa_conversao_anual
        : interesse === "diario"
        ? c.taxa_conversao_diario
        : c.taxa_conversao;
    const convBonus = Math.round(convSeg * 80); // 0.42 → 33
    score += convBonus;
    razoes.push({
      label: `Conv ${(convSeg * 100).toFixed(0)}% em ${interesse}`,
      peso: convBonus,
      tipo: convSeg > 0.3 ? "positivo" : "atencao",
    });

    // 3. Capacidade EFETIVA — só conta leads saudáveis, não o estoque total
    // Regra: corretor com muitos leads parados perde prioridade, mesmo que
    // o total "caiba" na capacidade máxima. Evita premiar quem não dá vazão.
    const cargaEfetiva = c.leads_saudaveis / c.max_leads_ativos;
    const pctParados = c.leads_ativos > 0 ? c.leads_parados / c.leads_ativos : 0;

    if (cargaEfetiva >= 0.95) {
      const peso = -40;
      score += peso;
      razoes.push({
        label: `Saturado (${c.leads_saudaveis}/${c.max_leads_ativos} saudáveis) — bloqueado`,
        peso,
        tipo: "atencao",
      });
    } else if (cargaEfetiva > 0.8) {
      const peso = -18;
      score += peso;
      razoes.push({
        label: `Carga efetiva alta (${c.leads_saudaveis} ativos)`,
        peso,
        tipo: "atencao",
      });
    } else if (cargaEfetiva < 0.4) {
      score += 12;
      razoes.push({
        label: `Capacidade livre (${c.leads_saudaveis} saudáveis)`,
        peso: 12,
        tipo: "positivo",
      });
    }

    // 3b. Penaliza backlog podre — quem acumula leads parados perde prioridade
    if (pctParados >= 0.4) {
      const peso = -25;
      score += peso;
      razoes.push({
        label: `${c.leads_parados} leads parados (${Math.round(pctParados * 100)}%) — baixa vazão`,
        peso,
        tipo: "atencao",
      });
    } else if (pctParados >= 0.2) {
      const peso = -10;
      score += peso;
      razoes.push({
        label: `${c.leads_parados} leads parados — atenção à vazão`,
        peso,
        tipo: "atencao",
      });
    }

    // 3c. Health score — sinal agregado (resposta, SLA, conversão recente)
    if (c.health_score < 50) {
      const peso = -15;
      score += peso;
      razoes.push({
        label: `Health ${c.health_score}/100 — fluxo reduzido`,
        peso,
        tipo: "atencao",
      });
    } else if (c.health_score >= 85) {
      score += 8;
      razoes.push({
        label: `Health ${c.health_score}/100 — operação saudável`,
        peso: 8,
        tipo: "positivo",
      });
    }

    // 4. Tempo médio de resposta
    if (c.tempo_medio_resposta <= 5) {
      score += 10;
      razoes.push({
        label: `Resposta rápida (${c.tempo_medio_resposta}min)`,
        peso: 10,
        tipo: "positivo",
      });
    } else if (c.tempo_medio_resposta > 15) {
      score -= 8;
      razoes.push({
        label: `Resposta lenta (${c.tempo_medio_resposta}min)`,
        peso: -8,
        tipo: "atencao",
      });
    }

    // 5. Match por perfil do lead (crianças, família)
    if (lead.tem_crianca && c.nome === "Amanda Rocha") {
      score += 12;
      razoes.push({
        label: "Afinidade com famílias (histórico)",
        peso: 12,
        tipo: "positivo",
      });
    }
    if (lead.num_pessoas && lead.num_pessoas >= 10 && c.especialidade === "diario") {
      score += 10;
      razoes.push({
        label: "Especialista em grupos grandes",
        peso: 10,
        tipo: "positivo",
      });
    }

    // 6. Turno ativo
    const agora = new Date().getHours();
    const inicio = Number(c.turno_inicio.split(":")[0]);
    const fim = Number(c.turno_fim.split(":")[0]);
    const noTurno = agora >= inicio && agora < fim;
    if (noTurno) {
      score += 8;
      razoes.push({
        label: "Online agora",
        peso: 8,
        tipo: "positivo",
      });
    } else {
      score -= 10;
      razoes.push({
        label: "Fora do turno",
        peso: -10,
        tipo: "atencao",
      });
    }

    score = Math.max(0, Math.min(100, score));
    const conv_prob = convSeg * (0.7 + (score - 50) / 150);

    return {
      corretor_id: c.id,
      score,
      razoes: razoes.slice(0, 5),
      conv_prob: Math.max(0, Math.min(0.95, conv_prob)),
    };
  });

  return matches.sort((a, b) => b.score - a.score);
}

// Decisões de roteamento recentes (para o dashboard do gestor)
export const routingDecisions: RoutingDecision[] = [
  {
    id: "rd1",
    lead_id: "l1",
    etapa: "ingestao",
    status: "ativa",
    matches: [],
    escolhido_por: "ia",
    created_at: mins(1),
  },
  {
    id: "rd2",
    lead_id: "l2",
    etapa: "qualificacao",
    status: "ativa",
    matches: [],
    escolhido_por: "ia",
    created_at: mins(2),
  },
  {
    id: "rd3",
    lead_id: "l3",
    etapa: "match",
    status: "ativa",
    matches: [],
    escolhido_por: "ia",
    created_at: mins(3),
  },
  {
    id: "rd4",
    lead_id: "l4",
    etapa: "match",
    status: "ativa",
    matches: [],
    escolhido_por: "ia",
    created_at: mins(4),
  },
  {
    id: "rd5",
    lead_id: "l5",
    etapa: "alocado",
    status: "alocada",
    matches: [],
    escolhido_id: "c1",
    escolhido_por: "ia",
    ia_sugeria_id: "c1",
    created_at: mins(6),
    alocado_em: mins(5),
  },
  {
    id: "rd6",
    lead_id: "l6",
    etapa: "alocado",
    status: "override",
    matches: [],
    escolhido_id: "c3",
    escolhido_por: "gestor",
    ia_sugeria_id: "c2",
    created_at: mins(10),
    alocado_em: mins(8),
  },
  {
    id: "rd7",
    lead_id: "l7",
    etapa: "alocado",
    status: "alocada",
    matches: [],
    escolhido_id: "c2",
    escolhido_por: "ia",
    ia_sugeria_id: "c2",
    created_at: mins(14),
    alocado_em: mins(13),
  },
  {
    id: "rd8",
    lead_id: "l8",
    etapa: "alocado",
    status: "alocada",
    matches: [],
    escolhido_id: "c1",
    escolhido_por: "ia",
    ia_sugeria_id: "c1",
    created_at: mins(22),
    alocado_em: mins(20),
  },
];

// Popular matches dinamicamente para as decisões ativas
routingDecisions.forEach((rd) => {
  const lead = leads.find((l) => l.id === rd.lead_id);
  if (lead) rd.matches = calcularMatch(lead);
});

/* ─── Leads parados candidatos a realocação (por corretor) ─── */
// Gera, para cada corretor com leads_parados > 0, um conjunto determinístico
// de leads "podres" que podem ser desafogados. Leads vêm do pool existente
// com status compatível para não interferir com a lógica de pipeline.
const poolRealocavel = leads.filter(
  (l) =>
    l.corretor_id &&
    (l.status === "alocado" || l.status === "em_atendimento") &&
    !["l33", "l34", "l35", "l36", "l37", "l38", "l9"].includes(l.id)
);

export interface LeadParadoInfo {
  lead_id: string;
  corretor_id: string;
  dias_sem_resposta: number;
  ultima_atividade: string;
  motivo_stall: string;
  risco: "alto" | "medio" | "baixo";
}

const motivosStall = [
  "Sem resposta do corretor há 3+ dias",
  "Lead pediu retorno, não obteve",
  "Objeção não tratada",
  "Sumiu após proposta enviada",
  "Aguardando info do corretor há 5 dias",
  "Follow-up perdido",
];

export const leadsParadosPorCorretor: Record<string, LeadParadoInfo[]> = {};
corretores.forEach((c) => {
  if (c.leads_parados <= 0) return;
  const disponiveis = poolRealocavel.filter((l) => l.corretor_id === c.id);
  const quantos = Math.min(c.leads_parados, disponiveis.length);
  leadsParadosPorCorretor[c.id] = disponiveis.slice(0, quantos).map((l, i) => ({
    lead_id: l.id,
    corretor_id: c.id,
    dias_sem_resposta: 2 + ((i * 3) % 7),
    ultima_atividade: days(2 + ((i * 3) % 7)),
    motivo_stall: motivosStall[i % motivosStall.length],
    risco: i % 3 === 0 ? "alto" : i % 3 === 1 ? "medio" : "baixo",
  }));
});

// Corretores que precisam ser desafogados (health baixo OU backlog >30%)
export function corretoresParaDesafogar() {
  return corretores
    .filter((c) => {
      const pct = c.leads_ativos > 0 ? c.leads_parados / c.leads_ativos : 0;
      return c.health_score < 60 || pct >= 0.35;
    })
    .sort((a, b) => b.leads_parados - a.leads_parados);
}

export const routingMetrica: RoutingMetrica = {
  leads_roteados_ia: 284,
  leads_roteados_manual: 46,
  overrides: 23,
  conv_ia: 0.34,
  conv_manual: 0.22,
  perda_evitada_reais: 28400,
  fechamentos_extras: 12,
  periodo: "últimos 30 dias",
};

// Série para gráfico IA vs Manual
export const conversaoIAvsManual = [
  { semana: "S-4", ia: 0.28, manual: 0.21 },
  { semana: "S-3", ia: 0.31, manual: 0.22 },
  { semana: "S-2", ia: 0.33, manual: 0.23 },
  { semana: "S-1", ia: 0.36, manual: 0.22 },
  { semana: "Atual", ia: 0.37, manual: 0.22 },
];

/* ───────────────────────── HELPERS ───────────────────────── */

export const leadById = (id: string) => leads.find((l) => l.id === id);
export const corretorById = (id?: string) =>
  corretores.find((c) => c.id === id);
export const leadsByStatus = (status: Lead["status"]) =>
  leads.filter((l) => l.status === status);
export const leadsByCorretor = (corretorId: string) =>
  leads.filter((l) => l.corretor_id === corretorId);
export const conversaByLead = (leadId: string) =>
  conversasWA.find((c) => c.lead_id === leadId);
export const conversasDoCorretor = (corretorId: string) =>
  conversasWA.filter((c) => c.corretor_id === corretorId);
export const mensagensDaConversa = (leadId: string) =>
  conversasMensagens[leadId] ?? [];

/* ───────────────────────── CADÊNCIAS ───────────────────────── */

export const cadencias: Cadencia[] = [
  {
    id: "cad1",
    nome: "Boas-vindas novo lead",
    descricao:
      "Primeiro contato rápido (<5min) + follow-up em 2h e 24h para leads que chegam fora do horário comercial.",
    gatilho: "lead_novo",
    ativa: true,
    aplicados: 284,
    conversao: 0.38,
    uplift_pct: 18,
    criado_em: days(90),
    ultima_execucao: mins(3),
    passos: [
      {
        ordem: 1,
        delay_horas: 0,
        canal: "whatsapp",
        titulo: "Saudação + confirmação de interesse",
        preview:
          "Oi {{nome}}! Aqui é {{corretor}} do Aquapark Valparaíso. Vi que você se interessou pelo {{tipo}}. Posso te ajudar?",
      },
      {
        ordem: 2,
        delay_horas: 2,
        canal: "whatsapp",
        titulo: "Oferta de valor",
        preview:
          "Separei um resumo rápido: {{beneficios}}. Quer agendar uma visita?",
      },
      {
        ordem: 3,
        delay_horas: 24,
        canal: "whatsapp",
        titulo: "Quebra de objeção preço",
        preview:
          "Se o valor à vista pesar, tenho opção em 12x que sai R$ {{valor_mensal}}/mês. Te mando os detalhes?",
      },
    ],
  },
  {
    id: "cad2",
    nome: "Reativação — lead parado 48h",
    descricao:
      "Para leads que ficaram >48h sem resposta do cliente. Três toques suaves antes de escalar.",
    gatilho: "lead_parado_48h",
    ativa: true,
    aplicados: 164,
    conversao: 0.21,
    uplift_pct: 24,
    criado_em: days(75),
    ultima_execucao: mins(40),
    passos: [
      {
        ordem: 1,
        delay_horas: 0,
        canal: "whatsapp",
        titulo: "Pergunta aberta",
        preview:
          "{{nome}}, ainda dá tempo de fechar para esse final de semana. Quer que eu te mande os detalhes de novo?",
      },
      {
        ordem: 2,
        delay_horas: 48,
        canal: "email",
        titulo: "Material completo por email",
        preview:
          "Enviei o material completo do {{tipo}}. Qualquer dúvida, me chama no WhatsApp.",
      },
      {
        ordem: 3,
        delay_horas: 120,
        canal: "ligacao",
        titulo: "Última tentativa — ligação",
        preview: "Ligação para captar objeção ou encerrar o lead.",
      },
    ],
  },
  {
    id: "cad3",
    nome: "Renovação anual — 30d antes",
    descricao:
      "Inicia 30 dias antes do vencimento. Usa histórico de visitas para personalizar.",
    gatilho: "pre_vencimento_30d",
    ativa: true,
    aplicados: 92,
    conversao: 0.64,
    uplift_pct: 41,
    criado_em: days(150),
    ultima_execucao: hours(4),
    passos: [
      {
        ordem: 1,
        delay_horas: 0,
        canal: "whatsapp",
        titulo: "Lembrete + resumo das visitas",
        preview:
          "{{nome}}, seu passaporte {{tipo}} vence em 30 dias. Você visitou {{num_visitas}} vezes — continua valendo cada centavo!",
      },
      {
        ordem: 2,
        delay_horas: 168,
        canal: "whatsapp",
        titulo: "Oferta de renovação antecipada",
        preview:
          "Renovando até dia {{data}}, garante R$ {{desconto}} de desconto. Topa?",
      },
      {
        ordem: 3,
        delay_horas: 360,
        canal: "ligacao",
        titulo: "Ligação pessoal do corretor",
        preview: "Ligação para fechar ou entender objeção.",
      },
    ],
  },
  {
    id: "cad4",
    nome: "Renovação urgente — 7d antes",
    descricao:
      "Último esforço para renovação. Mais agressiva, oferece upgrade como alternativa.",
    gatilho: "pre_vencimento_7d",
    ativa: true,
    aplicados: 38,
    conversao: 0.48,
    uplift_pct: 27,
    criado_em: days(120),
    ultima_execucao: hours(9),
    passos: [
      {
        ordem: 1,
        delay_horas: 0,
        canal: "whatsapp",
        titulo: "Alerta direto",
        preview:
          "{{nome}}, faltam 7 dias para vencer. Renovação com 1-clique aqui: {{link}}",
      },
      {
        ordem: 2,
        delay_horas: 48,
        canal: "whatsapp",
        titulo: "Upgrade como alternativa",
        preview:
          "Se não for renovar no mesmo plano, topa ver o VIP? Posso te dar {{bonus}} de vantagem.",
      },
      {
        ordem: 3,
        delay_horas: 96,
        canal: "ligacao",
        titulo: "Ligação do corretor",
        preview: "Contato final antes de marcar como perdido.",
      },
    ],
  },
  {
    id: "cad5",
    nome: "Pós-venda — 7d após compra",
    descricao:
      "Garante que o cliente usou o passaporte, captura feedback e sinaliza NPS.",
    gatilho: "pos_venda",
    ativa: true,
    aplicados: 412,
    conversao: 0.82,
    uplift_pct: 12,
    criado_em: days(200),
    ultima_execucao: hours(1),
    passos: [
      {
        ordem: 1,
        delay_horas: 0,
        canal: "whatsapp",
        titulo: "Confirmação + dicas",
        preview:
          "Seu passaporte tá ativo! Algumas dicas pra primeira visita: {{dicas}}",
      },
      {
        ordem: 2,
        delay_horas: 168,
        canal: "whatsapp",
        titulo: "Já usou? Pede feedback",
        preview: "Como foi a experiência? Nota de 0 a 10?",
      },
      {
        ordem: 3,
        delay_horas: 720,
        canal: "email",
        titulo: "Convite para indicar",
        preview: "Indique 1 amigo e ganhe R$ 50 na próxima visita.",
      },
    ],
  },
  {
    id: "cad6",
    nome: "Reativação — inativo 90d",
    descricao:
      "Para clientes que não visitaram o parque em 90 dias. Tenta resgatar antes de perder.",
    gatilho: "reativacao",
    ativa: false,
    aplicados: 0,
    conversao: 0,
    uplift_pct: 0,
    criado_em: days(5),
    passos: [
      {
        ordem: 1,
        delay_horas: 0,
        canal: "whatsapp",
        titulo: "Saudade + novidade",
        preview:
          "{{nome}}, faz tempo! Temos novidades no parque — {{novidade}}. Bora marcar uma visita?",
      },
      {
        ordem: 2,
        delay_horas: 120,
        canal: "email",
        titulo: "Benefício exclusivo",
        preview:
          "Como cliente desde {{data_inicio}}, liberei um desconto exclusivo de R$ {{valor}}.",
      },
    ],
  },
];

export const cadenciasExecucoes: CadenciaExecucao[] = [
  {
    id: "ce1",
    cadencia_id: "cad1",
    lead_id: "l1",
    passo_atual: 1,
    proximo_disparo: future(0.08),
    status: "ativa",
    iniciada_em: mins(5),
  },
  {
    id: "ce2",
    cadencia_id: "cad2",
    lead_id: "l6",
    passo_atual: 2,
    proximo_disparo: future(0.5),
    status: "ativa",
    iniciada_em: days(2),
  },
  {
    id: "ce3",
    cadencia_id: "cad3",
    cliente_id: "cl1",
    passo_atual: 2,
    proximo_disparo: future(3),
    status: "ativa",
    iniciada_em: days(23),
  },
  {
    id: "ce4",
    cadencia_id: "cad4",
    cliente_id: "cl5",
    passo_atual: 1,
    proximo_disparo: future(0.04),
    status: "ativa",
    iniciada_em: hours(4),
  },
  {
    id: "ce5",
    cadencia_id: "cad5",
    cliente_id: "cl3",
    passo_atual: 3,
    proximo_disparo: future(5),
    status: "ativa",
    iniciada_em: days(23),
  },
];

export const cadenciaById = (id: string) =>
  cadencias.find((c) => c.id === id);

export const execucoesPorCadencia = (cadenciaId: string) =>
  cadenciasExecucoes.filter((e) => e.cadencia_id === cadenciaId);

/* ───────────────────────── REVENUE INTELLIGENCE ───────────────────────── */

export interface ForecastPonto {
  dia: string;
  real?: number;
  previsto: number;
  p_baixo: number;
  p_alto: number;
  meta: number;
}

const forecastBase = 14000;
export const forecastSerie: ForecastPonto[] = Array.from({ length: 90 }).map(
  (_, i) => {
    const dia = i < 45 ? i - 44 : i - 44;
    const label =
      dia < 0
        ? `D${dia}`
        : dia === 0
        ? "Hoje"
        : `D+${dia}`;
    const seasonal =
      1 + 0.18 * Math.sin((i / 90) * Math.PI * 2) + (i % 7 === 5 ? 0.25 : 0);
    const noise = (Math.sin(i * 1.37) + 1) / 2;
    const prev = Math.round(forecastBase * seasonal * (0.9 + noise * 0.2));
    const spread = Math.round(prev * 0.18);
    return {
      dia: label,
      real: i < 45 ? Math.round(prev * (0.85 + noise * 0.3)) : undefined,
      previsto: prev,
      p_baixo: prev - spread,
      p_alto: prev + spread,
      meta: 15000,
    };
  }
);

export const projecaoMes = {
  real_mtd: 284000,
  meta_mes: 480000,
  previsto_fim_mes: 472000,
  confianca: 0.82,
  gap: -8000,
  dias_restantes: 11,
  pace_diario_necessario: 17818,
  pace_diario_atual: 15800,
};

export const tracaoCampanhas = [
  {
    id: "cp1",
    nome: "Férias Julho — Família",
    canal: "Meta Ads",
    status: "ativa",
    periodo: "01/07 – 31/07",
    gasto: 18400,
    leads: 412,
    fechamentos: 89,
    receita: 142800,
    roi: 6.76,
    cpl: 44.66,
    cac: 206.74,
    tendencia: "subindo" as const,
  },
  {
    id: "cp2",
    nome: "Black Friday Anual 2025",
    canal: "Google Ads + E-mail",
    status: "ativa",
    periodo: "20/11 – 28/11",
    gasto: 9800,
    leads: 196,
    fechamentos: 71,
    receita: 114300,
    roi: 10.66,
    cpl: 50,
    cac: 138.03,
    tendencia: "subindo" as const,
  },
  {
    id: "cp3",
    nome: "Retargeting WhatsApp",
    canal: "WhatsApp Business",
    status: "ativa",
    periodo: "contínua",
    gasto: 2100,
    leads: 92,
    fechamentos: 34,
    receita: 54800,
    roi: 25.1,
    cpl: 22.83,
    cac: 61.76,
    tendencia: "estavel" as const,
  },
  {
    id: "cp4",
    nome: "Parceria Instagram Influencers",
    canal: "Instagram",
    status: "pausada",
    periodo: "15/09 – 30/09",
    gasto: 4200,
    leads: 58,
    fechamentos: 9,
    receita: 14200,
    roi: 2.38,
    cpl: 72.41,
    cac: 466.67,
    tendencia: "caindo" as const,
  },
  {
    id: "cp5",
    nome: "TV Regional — Feriadão",
    canal: "TV + Rádio",
    status: "encerrada",
    periodo: "20/10 – 12/11",
    gasto: 32000,
    leads: 184,
    fechamentos: 22,
    receita: 34800,
    roi: 0.09,
    cpl: 173.91,
    cac: 1454.55,
    tendencia: "caindo" as const,
  },
];

export const insightsReceita = [
  {
    id: "ir1",
    titulo: "WhatsApp retargeting com ROI 25×",
    descricao:
      "Cada R$ 1 em retargeting de WhatsApp está retornando R$ 25. Estamos subinvestindo — escalar para R$ 8k/mês pode adicionar R$ 160k.",
    tipo: "oportunidade" as const,
    impacto_estimado: 160000,
  },
  {
    id: "ir2",
    titulo: "TV Regional sangrando R$ 32k",
    descricao:
      "CAC de R$ 1.454 contra ticket médio R$ 1.580. Recomendo pausar imediatamente e realocar para WhatsApp + Google.",
    tipo: "risco" as const,
    impacto_estimado: 32000,
  },
  {
    id: "ir3",
    titulo: "Instagram caindo 34% mês a mês",
    descricao:
      "Conv caiu de 0,28 para 0,19 em 45 dias. Parceria com influencers de nicho familiar pode reverter — está pausada há 2 semanas.",
    tipo: "atencao" as const,
    impacto_estimado: 48000,
  },
];

/* ───────────────────────── METAS & COMISSÕES ───────────────────────── */

export interface RegraComissao {
  id: string;
  nome: string;
  tipo_passaporte: "anual_individual" | "anual_familia" | "vip" | "diario" | "renovacao";
  comissao_pct: number;
  bonus_meta: number;
  ativa: boolean;
}

export const regrasComissao: RegraComissao[] = [
  {
    id: "rc1",
    nome: "Anual Família",
    tipo_passaporte: "anual_familia",
    comissao_pct: 0.08,
    bonus_meta: 1200,
    ativa: true,
  },
  {
    id: "rc2",
    nome: "Anual Individual",
    tipo_passaporte: "anual_individual",
    comissao_pct: 0.06,
    bonus_meta: 800,
    ativa: true,
  },
  {
    id: "rc3",
    nome: "VIP",
    tipo_passaporte: "vip",
    comissao_pct: 0.1,
    bonus_meta: 1800,
    ativa: true,
  },
  {
    id: "rc4",
    nome: "Diário",
    tipo_passaporte: "diario",
    comissao_pct: 0.03,
    bonus_meta: 0,
    ativa: true,
  },
  {
    id: "rc5",
    nome: "Renovação (+20% bônus)",
    tipo_passaporte: "renovacao",
    comissao_pct: 0.05,
    bonus_meta: 400,
    ativa: true,
  },
];

export const comissoesPorCorretor = corretores.map((c) => {
  const vendas = c.receita_mes;
  const pct_media = 0.068;
  const comissao = Math.round(vendas * pct_media);
  const atingimento = c.receita_mes / c.meta_mensal;
  const bonus = atingimento >= 1 ? 1500 : atingimento >= 0.9 ? 700 : 0;
  return {
    corretor_id: c.id,
    vendas,
    meta: c.meta_mensal,
    atingimento,
    comissao_base: comissao,
    bonus_meta: bonus,
    total: comissao + bonus,
    pago: false,
    vendas_anual: Math.floor(vendas * 0.62),
    vendas_diario: Math.floor(vendas * 0.18),
    vendas_vip: Math.floor(vendas * 0.2),
    num_fechamentos: Math.floor(vendas / 1800),
  };
});

export const metasTime = {
  meta_total: corretores.reduce((s, c) => s + c.meta_mensal, 0),
  realizado: corretores.reduce((s, c) => s + c.receita_mes, 0),
  previsto: Math.round(
    corretores.reduce((s, c) => s + c.receita_mes, 0) * 1.45
  ),
  dias_mes: 30,
  dia_atual: 19,
};

export const historicoMetas = [
  { mes: "Nov/25", meta: 210000, realizado: 198000 },
  { mes: "Dez/25", meta: 240000, realizado: 267000 },
  { mes: "Jan/26", meta: 220000, realizado: 214000 },
  { mes: "Fev/26", meta: 230000, realizado: 241000 },
  { mes: "Mar/26", meta: 260000, realizado: 253000 },
  { mes: "Abr/26", meta: 280000, realizado: 184000 },
];

/* ───────────────────────── ADMIN ───────────────────────── */

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  ultimo_acesso: string;
  criado_em: string;
  mfa: boolean;
  ip_ultimo?: string;
}

export const usuariosAdmin: UsuarioAdmin[] = [
  {
    id: "u0",
    nome: "Renata Carvalho",
    email: "renata.carvalho@valparaiso.com.br",
    papel: "gestor",
    ativo: true,
    ultimo_acesso: mins(8),
    criado_em: days(420),
    mfa: true,
    ip_ultimo: "177.24.88.12",
  },
  {
    id: "u1",
    nome: "Marcos Pedrosa",
    email: "marcos.pedrosa@valparaiso.com.br",
    papel: "supervisor",
    ativo: true,
    ultimo_acesso: hours(2),
    criado_em: days(380),
    mfa: true,
    ip_ultimo: "189.45.12.8",
  },
  ...corretores.map((c) => ({
    id: c.id,
    nome: c.nome,
    email: `${c.nome.toLowerCase().replace(/\s+/g, ".")}@valparaiso.com.br`,
    papel: c.papel,
    ativo: c.ativo,
    ultimo_acesso: hours(Math.random() * 24),
    criado_em: days(Math.floor(60 + Math.random() * 300)),
    mfa: Math.random() > 0.3,
    ip_ultimo: "177.24." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255),
  })),
  {
    id: "u5",
    nome: "Luíza Barreto",
    email: "luiza.barreto@valparaiso.com.br",
    papel: "sac",
    ativo: true,
    ultimo_acesso: mins(42),
    criado_em: days(120),
    mfa: false,
    ip_ultimo: "177.24.50.22",
  },
  {
    id: "u6",
    nome: "Admin Geral",
    email: "admin@valparaiso.com.br",
    papel: "admin",
    ativo: true,
    ultimo_acesso: hours(1),
    criado_em: days(600),
    mfa: true,
    ip_ultimo: "177.24.12.1",
  },
];

export interface PermissaoModulo {
  modulo: string;
  gestor: boolean;
  supervisor: boolean;
  corretor: boolean;
  sac: boolean;
  admin: boolean;
}

export const permissoesMatriz: PermissaoModulo[] = [
  { modulo: "Dashboard", gestor: true, supervisor: true, corretor: false, sac: false, admin: true },
  { modulo: "Inbox", gestor: true, supervisor: true, corretor: true, sac: true, admin: true },
  { modulo: "Pipeline", gestor: true, supervisor: true, corretor: true, sac: false, admin: true },
  { modulo: "WhatsApp Console", gestor: true, supervisor: true, corretor: true, sac: true, admin: true },
  { modulo: "Roteamento IA", gestor: true, supervisor: true, corretor: false, sac: false, admin: true },
  { modulo: "Ranking", gestor: true, supervisor: true, corretor: true, sac: false, admin: true },
  { modulo: "Passaportes", gestor: true, supervisor: true, corretor: true, sac: true, admin: true },
  { modulo: "SAC", gestor: true, supervisor: true, corretor: false, sac: true, admin: true },
  { modulo: "Gamificação", gestor: true, supervisor: true, corretor: true, sac: false, admin: true },
  { modulo: "Renovações", gestor: true, supervisor: true, corretor: true, sac: false, admin: true },
  { modulo: "Cadências", gestor: true, supervisor: true, corretor: false, sac: false, admin: true },
  { modulo: "Alertas", gestor: true, supervisor: true, corretor: false, sac: false, admin: true },
  { modulo: "Corretores", gestor: true, supervisor: true, corretor: false, sac: false, admin: true },
  { modulo: "Revenue Intelligence", gestor: true, supervisor: false, corretor: false, sac: false, admin: true },
  { modulo: "Canais & ROI", gestor: true, supervisor: true, corretor: false, sac: false, admin: true },
  { modulo: "Metas & Comissões", gestor: true, supervisor: true, corretor: false, sac: false, admin: true },
  { modulo: "Insights", gestor: true, supervisor: true, corretor: false, sac: false, admin: true },
  { modulo: "IA Aprendizado", gestor: true, supervisor: true, corretor: false, sac: false, admin: true },
  { modulo: "Admin", gestor: false, supervisor: false, corretor: false, sac: false, admin: true },
];

export interface EventoAuditoria {
  id: string;
  timestamp: string;
  usuario: string;
  acao: string;
  detalhes: string;
  severidade: "info" | "warning" | "critical";
  ip?: string;
  modulo: string;
}

export const auditoria: EventoAuditoria[] = [
  {
    id: "au1",
    timestamp: mins(3),
    usuario: "Renata Carvalho",
    acao: "Override roteamento",
    detalhes: "Realocou lead l12 de Felipe (c6) para Amanda (c1)",
    severidade: "info",
    ip: "177.24.88.12",
    modulo: "Roteamento",
  },
  {
    id: "au2",
    timestamp: mins(15),
    usuario: "Admin Geral",
    acao: "Alterou permissão",
    detalhes: "Concedeu acesso 'Revenue Intelligence' para supervisor",
    severidade: "warning",
    ip: "177.24.12.1",
    modulo: "Admin",
  },
  {
    id: "au3",
    timestamp: hours(1),
    usuario: "Marcos Pedrosa",
    acao: "Criou cadência",
    detalhes: "Nova cadência 'Reativação 60d' configurada",
    severidade: "info",
    ip: "189.45.12.8",
    modulo: "Cadências",
  },
  {
    id: "au4",
    timestamp: hours(2.2),
    usuario: "Renata Carvalho",
    acao: "Desativou regra",
    detalhes: "Regra de comissão 'VIP antigo 5%' desativada",
    severidade: "warning",
    ip: "177.24.88.12",
    modulo: "Comissões",
  },
  {
    id: "au5",
    timestamp: hours(3),
    usuario: "Felipe Alves",
    acao: "Tentativa de login",
    detalhes: "3 tentativas falhas (senha incorreta)",
    severidade: "critical",
    ip: "189.0.1.44",
    modulo: "Autenticação",
  },
  {
    id: "au6",
    timestamp: hours(4),
    usuario: "Amanda Rocha",
    acao: "Exportou relatório",
    detalhes: "Exportou lista de leads (48 registros) para CSV",
    severidade: "info",
    ip: "177.24.22.9",
    modulo: "Leads",
  },
  {
    id: "au7",
    timestamp: hours(5),
    usuario: "Admin Geral",
    acao: "Atualizou SLA",
    detalhes: "SLA de atendimento SAC alterado de 4h para 3h",
    severidade: "warning",
    ip: "177.24.12.1",
    modulo: "Configurações",
  },
  {
    id: "au8",
    timestamp: hours(8),
    usuario: "Sistema",
    acao: "Backup automático",
    detalhes: "Backup diário concluído (2.4 GB)",
    severidade: "info",
    modulo: "Sistema",
  },
  {
    id: "au9",
    timestamp: days(1),
    usuario: "Renata Carvalho",
    acao: "Cadastrou usuário",
    detalhes: "Novo corretor: Eduarda Lima (c5)",
    severidade: "info",
    ip: "177.24.88.12",
    modulo: "Usuários",
  },
  {
    id: "au10",
    timestamp: days(1.3),
    usuario: "Bruno Teixeira",
    acao: "Editou passaporte",
    detalhes: "Passaporte p3 — alterou vigência_fim",
    severidade: "warning",
    ip: "189.44.78.22",
    modulo: "Passaportes",
  },
];

export const configGerais = [
  { chave: "sla_primeira_resposta_min", valor: 5, descricao: "SLA primeira resposta (min)" },
  { chave: "sla_sac_horas", valor: 3, descricao: "SLA SAC (horas)" },
  { chave: "max_leads_por_corretor", valor: 25, descricao: "Teto de leads ativos por corretor" },
  { chave: "horario_funcionamento", valor: "08:00 – 20:00", descricao: "Horário de atendimento" },
  { chave: "auto_desafogo_horas", valor: 48, descricao: "Horas sem interação = parado" },
  { chave: "renovacao_alerta_dias", valor: 30, descricao: "Dias antes do vencimento p/ alertar" },
  { chave: "comissao_base_default", valor: "6%", descricao: "Comissão padrão" },
  { chave: "ia_roteamento_ativo", valor: "sim", descricao: "IA roteando automaticamente" },
  { chave: "mfa_obrigatorio", valor: "não", descricao: "MFA obrigatório p/ todos" },
];

export const integracoesAdmin = [
  { nome: "WhatsApp Business API", status: "conectado", ultima_sync: mins(2), volume_24h: 1420 },
  { nome: "Instagram Direct", status: "conectado", ultima_sync: mins(5), volume_24h: 218 },
  { nome: "RD Station CRM", status: "conectado", ultima_sync: mins(12), volume_24h: 96 },
  { nome: "Google Ads", status: "conectado", ultima_sync: hours(1), volume_24h: 44 },
  { nome: "Meta Ads", status: "conectado", ultima_sync: hours(1), volume_24h: 212 },
  { nome: "Catraca Parque (QR)", status: "conectado", ultima_sync: mins(1), volume_24h: 328 },
  { nome: "Pagar.me (pagamentos)", status: "conectado", ultima_sync: mins(4), volume_24h: 62 },
  { nome: "SendGrid (e-mail)", status: "degradado", ultima_sync: hours(3), volume_24h: 88 },
];

/* ───────────────────────── CANAIS EXTRAS ───────────────────────── */

export const canalEvolucao = [
  { mes: "Nov", whatsapp: 180, instagram: 120, rdstation: 110, site: 60, google: 48, indicacao: 32 },
  { mes: "Dez", whatsapp: 198, instagram: 128, rdstation: 128, site: 68, google: 42, indicacao: 41 },
  { mes: "Jan", whatsapp: 212, instagram: 104, rdstation: 142, site: 74, google: 38, indicacao: 44 },
  { mes: "Fev", whatsapp: 220, instagram: 96, rdstation: 148, site: 78, google: 44, indicacao: 54 },
];

export const canalDetalhes = [
  {
    canal: "WhatsApp",
    volume: 212,
    taxa: 0.31,
    ticket: 1640,
    cpl: 12,
    cac: 38.7,
    tempo_medio_fechamento: 18,
    ltv: 2840,
    payback_dias: 22,
    tendencia: "subindo" as const,
    observacao: "Melhor ROI geral. Escalar retargeting.",
  },
  {
    canal: "Indicação",
    volume: 54,
    taxa: 0.48,
    ticket: 2310,
    cpl: 0,
    cac: 120,
    tempo_medio_fechamento: 12,
    ltv: 4200,
    payback_dias: 8,
    tendencia: "estavel" as const,
    observacao: "Maior conversão. Programa de indicação está subinvestido.",
  },
  {
    canal: "RD Station",
    volume: 148,
    taxa: 0.24,
    ticket: 1820,
    cpl: 38,
    cac: 158,
    tempo_medio_fechamento: 26,
    ltv: 2960,
    payback_dias: 40,
    tendencia: "subindo" as const,
    observacao: "Consistente. Nutrição de 30d está amadurecendo.",
  },
  {
    canal: "Site",
    volume: 78,
    taxa: 0.22,
    ticket: 1720,
    cpl: 9,
    cac: 41,
    tempo_medio_fechamento: 22,
    ltv: 2580,
    payback_dias: 24,
    tendencia: "estavel" as const,
    observacao: "Alto ROI orgânico. Melhorar CTA de VIP.",
  },
  {
    canal: "Instagram",
    volume: 96,
    taxa: 0.19,
    ticket: 1510,
    cpl: 22,
    cac: 116,
    tempo_medio_fechamento: 28,
    ltv: 2240,
    payback_dias: 34,
    tendencia: "caindo" as const,
    observacao: "Conversão caindo. Retomar parceria de influencers.",
  },
  {
    canal: "Google",
    volume: 44,
    taxa: 0.18,
    ticket: 1480,
    cpl: 31,
    cac: 172,
    tempo_medio_fechamento: 30,
    ltv: 2180,
    payback_dias: 42,
    tendencia: "estavel" as const,
    observacao: "Lead quente mas CAC alto em termos regionais.",
  },
];

/* ───────────────────────── INSTAGRAM DM ───────────────────────── */

export const conversasIG: ConversaIG[] = [
  {
    id: "ig1",
    lead_id: "l1",
    ig_handle: "@julia.cost4",
    ig_followers: 842,
    origem: "story",
    origem_ref: "Story: Carnaval no Valparaíso",
    corretor_id: "c1",
    status: "ativa",
    ultima_atividade: mins(8),
    nao_lidas: 2,
    temperatura: "quente",
    verificado: false,
    engagement_score: 78,
  },
  {
    id: "ig2",
    lead_id: "l2",
    ig_handle: "@rafa.andrade.ma",
    ig_followers: 3120,
    origem: "reel",
    origem_ref: "Reel: Novo tobogã gigante",
    corretor_id: "c2",
    status: "aguardando_corretor",
    ultima_atividade: mins(32),
    nao_lidas: 1,
    temperatura: "muito_quente",
    verificado: true,
    engagement_score: 92,
  },
  {
    id: "ig3",
    lead_id: "l3",
    ig_handle: "@camilafam_",
    ig_followers: 510,
    origem: "ad",
    origem_ref: "Ad: Passaporte família 10% off",
    corretor_id: "c1",
    status: "ativa",
    ultima_atividade: hours(2),
    nao_lidas: 0,
    temperatura: "morna",
    verificado: false,
    engagement_score: 54,
  },
  {
    id: "ig4",
    lead_id: "l4",
    ig_handle: "@pedro_sl",
    ig_followers: 198,
    origem: "dm_direto",
    corretor_id: "c3",
    status: "aguardando_cliente",
    ultima_atividade: hours(6),
    nao_lidas: 0,
    temperatura: "fria",
    verificado: false,
    engagement_score: 28,
  },
];

export const mensagensIG: MensagemIG[] = [
  {
    id: "igm1",
    conversa_id: "ig1",
    direcao: "inbound",
    autor: "Julia",
    tipo: "story_reply",
    conteudo: "vcs abrem no feriado? vou levar minhas sobrinhas 👀",
    story_thumb: "story-carnaval",
    sent_at: mins(45),
    lida: true,
  },
  {
    id: "igm2",
    conversa_id: "ig1",
    direcao: "outbound",
    autor: "Amanda",
    tipo: "dm",
    conteudo: "Oi Julia! Abrimos sim, 9h às 18h. Quantas pessoas vão?",
    sent_at: mins(40),
    lida: true,
  },
  {
    id: "igm3",
    conversa_id: "ig1",
    direcao: "inbound",
    autor: "Julia",
    tipo: "dm",
    conteudo: "eu + 2 adultos + 2 crianças",
    sent_at: mins(12),
    lida: true,
  },
  {
    id: "igm4",
    conversa_id: "ig1",
    direcao: "inbound",
    autor: "Julia",
    tipo: "dm",
    conteudo: "tem desconto pra grupo?",
    sent_at: mins(8),
    lida: false,
  },
  {
    id: "igm5",
    conversa_id: "ig2",
    direcao: "inbound",
    autor: "Rafael",
    tipo: "reel_reply",
    conteudo: "Mano esse tobogã é insano, preço do anual?",
    reel_thumb: "reel-tobogã",
    sent_at: mins(35),
  },
];

/* ───────────────────────── META ADS ───────────────────────── */

export const metaCampanhas: MetaCampanha[] = [
  {
    id: "mc1",
    nome: "Passaporte Anual — Família MA",
    objetivo: "lead_generation",
    status: "ativa",
    plataforma: ["instagram", "facebook"],
    orcamento_diario: 180,
    investido_total: 4820,
    data_inicio: days(27),
    impressoes: 284500,
    cliques: 6210,
    ctr: 2.18,
    cpc: 0.78,
    cpl: 12.4,
    leads: 389,
    leads_qualificados: 241,
    vendas: 78,
    receita: 116100,
    roas: 24.1,
    criativo_ids: ["cr1", "cr2", "cr3"],
    publico: "Pais 28-45 São Luís 40km",
  },
  {
    id: "mc2",
    nome: "Diária Feriadão Páscoa",
    objetivo: "conversions",
    status: "ativa",
    plataforma: ["instagram", "facebook", "messenger"],
    orcamento_diario: 250,
    investido_total: 3100,
    data_inicio: days(12),
    impressoes: 198200,
    cliques: 4890,
    ctr: 2.47,
    cpc: 0.63,
    cpl: 8.9,
    leads: 348,
    leads_qualificados: 189,
    vendas: 54,
    receita: 32400,
    roas: 10.5,
    criativo_ids: ["cr4", "cr5"],
    publico: "Moradores GM São Luís + 45km",
  },
  {
    id: "mc3",
    nome: "Remarketing — Abandonou lead form",
    objetivo: "messages",
    status: "ativa",
    plataforma: ["instagram", "messenger"],
    orcamento_diario: 60,
    investido_total: 740,
    data_inicio: days(18),
    impressoes: 42100,
    cliques: 1920,
    ctr: 4.56,
    cpc: 0.39,
    cpl: 4.1,
    leads: 180,
    leads_qualificados: 122,
    vendas: 31,
    receita: 46200,
    roas: 62.4,
    criativo_ids: ["cr6"],
    publico: "Visitantes site 30d + IG engajadores",
  },
  {
    id: "mc4",
    nome: "Awareness — Novo tobogã",
    objetivo: "reach",
    status: "pausada",
    plataforma: ["instagram"],
    orcamento_diario: 100,
    investido_total: 890,
    data_inicio: days(22),
    data_fim: days(2),
    impressoes: 312400,
    cliques: 3120,
    ctr: 1.0,
    cpc: 0.29,
    cpl: 29.0,
    leads: 31,
    leads_qualificados: 14,
    vendas: 3,
    receita: 5400,
    roas: 6.1,
    criativo_ids: ["cr7"],
    publico: "Todo MA 18-55",
  },
];

export const metaAdSets: MetaAdSet[] = [
  {
    id: "ms1",
    campanha_id: "mc1",
    nome: "Pais — Zona 1 SL",
    publico: "Pais 28-45 • interesses parque / piscina",
    faixa_etaria: "28-45",
    localizacao: ["São Luís", "São José Ribamar"],
    status: "ativa",
    orcamento_diario: 90,
    impressoes: 142000,
    cliques: 3320,
    leads: 214,
    cpl: 11.6,
    criativo_ids: ["cr1", "cr2"],
  },
  {
    id: "ms2",
    campanha_id: "mc1",
    nome: "Pais — Zona 2 Grande SL",
    publico: "Pais 28-45 • renda B/C",
    faixa_etaria: "28-45",
    localizacao: ["Paço do Lumiar", "Raposa"],
    status: "ativa",
    orcamento_diario: 90,
    impressoes: 142500,
    cliques: 2890,
    leads: 175,
    cpl: 13.2,
    criativo_ids: ["cr3"],
  },
  {
    id: "ms3",
    campanha_id: "mc2",
    nome: "Feriado — Interesse parques",
    publico: "Interessados parque aquático",
    faixa_etaria: "22-50",
    localizacao: ["Grande São Luís"],
    status: "ativa",
    orcamento_diario: 250,
    impressoes: 198200,
    cliques: 4890,
    leads: 348,
    cpl: 8.9,
    criativo_ids: ["cr4", "cr5"],
  },
  {
    id: "ms4",
    campanha_id: "mc3",
    nome: "RTG — form abandonado",
    publico: "Form iniciado 7d + engajou IG 30d",
    faixa_etaria: "25-55",
    localizacao: ["Grande São Luís"],
    status: "ativa",
    orcamento_diario: 60,
    impressoes: 42100,
    cliques: 1920,
    leads: 180,
    cpl: 4.1,
    criativo_ids: ["cr6"],
  },
];

export const metaCriativos: MetaCriativo[] = [
  {
    id: "cr1",
    nome: "Reel — Família rindo no tobogã",
    tipo: "reel",
    thumb: "reel-familia",
    copy_principal: "Seu verão inteiro por menos de R$ 120/mês. Passaporte anual família.",
    cta: "Falar no WhatsApp",
    duracao_s: 18,
    impressoes: 84200,
    cliques: 2310,
    ctr: 2.74,
    leads: 178,
    cpl: 9.8,
    hook_rate: 62,
    tempo_medio_visual: 14.2,
    fadiga: "baixa",
    performance: "ganhador",
  },
  {
    id: "cr2",
    nome: "Carrossel — 5 motivos para o anual",
    tipo: "carrossel",
    thumb: "carrossel-beneficios",
    copy_principal: "5 motivos para o passaporte anual em 2026",
    cta: "Saiba mais",
    impressoes: 58200,
    cliques: 1010,
    ctr: 1.74,
    leads: 36,
    cpl: 22.3,
    hook_rate: 41,
    tempo_medio_visual: 6.8,
    fadiga: "media",
    performance: "medio",
  },
  {
    id: "cr3",
    nome: "Imagem — Oferta 10% família",
    tipo: "imagem",
    thumb: "ad-familia-10off",
    copy_principal: "10% OFF no passaporte família até domingo",
    cta: "Quero 10% OFF",
    impressoes: 142500,
    cliques: 2890,
    ctr: 2.03,
    leads: 175,
    cpl: 13.2,
    hook_rate: 38,
    tempo_medio_visual: 3.4,
    fadiga: "alta",
    performance: "medio",
  },
  {
    id: "cr4",
    nome: "Stories — Feriadão Páscoa",
    tipo: "stories",
    thumb: "stories-pascoa",
    copy_principal: "Seu feriado aqui começa em R$ 69",
    cta: "Reservar agora",
    duracao_s: 15,
    impressoes: 102100,
    cliques: 2740,
    ctr: 2.68,
    leads: 218,
    cpl: 7.8,
    hook_rate: 58,
    tempo_medio_visual: 12.9,
    fadiga: "baixa",
    performance: "ganhador",
  },
  {
    id: "cr5",
    nome: "Vídeo — Testemunho Dona Marta",
    tipo: "video",
    thumb: "video-testemunho",
    copy_principal: "Minha neta veio 8x esse ano — valeu cada centavo",
    cta: "Garantir meu anual",
    duracao_s: 28,
    impressoes: 96100,
    cliques: 2150,
    ctr: 2.24,
    leads: 130,
    cpl: 10.2,
    hook_rate: 51,
    tempo_medio_visual: 22.1,
    fadiga: "baixa",
    performance: "ganhador",
  },
  {
    id: "cr6",
    nome: "RTG — Esqueceu algo?",
    tipo: "imagem",
    thumb: "rtg-esqueceu",
    copy_principal: "Você começou a solicitar seu passaporte. Finaliza em 2 cliques?",
    cta: "Finalizar cadastro",
    impressoes: 42100,
    cliques: 1920,
    ctr: 4.56,
    leads: 180,
    cpl: 4.1,
    hook_rate: 71,
    tempo_medio_visual: 4.1,
    fadiga: "media",
    performance: "ganhador",
  },
  {
    id: "cr7",
    nome: "Reel — Novo tobogã gigante",
    tipo: "reel",
    thumb: "reel-tobogan-novo",
    copy_principal: "12 metros de adrenalina. Abre em abril.",
    cta: "Ver parque",
    duracao_s: 12,
    impressoes: 312400,
    cliques: 3120,
    ctr: 1.0,
    leads: 31,
    cpl: 29.0,
    hook_rate: 32,
    tempo_medio_visual: 4.2,
    fadiga: "alta",
    performance: "ruim",
  },
];

export const metaLeadForms: MetaLeadForm[] = [
  {
    id: "lf1",
    nome: "Passaporte Anual Família — form",
    campanha_id: "mc1",
    campos: ["nome", "telefone", "email", "numero_pessoas"],
    total_leads: 389,
    taxa_conclusao: 0.74,
    qualificados: 241,
    ativo: true,
  },
  {
    id: "lf2",
    nome: "Feriadão — form rápido",
    campanha_id: "mc2",
    campos: ["nome", "telefone"],
    total_leads: 348,
    taxa_conclusao: 0.91,
    qualificados: 189,
    ativo: true,
  },
  {
    id: "lf3",
    nome: "VIP — pré-lançamento",
    campos: ["nome", "telefone", "email", "empresa"],
    total_leads: 42,
    taxa_conclusao: 0.64,
    qualificados: 28,
    ativo: false,
  },
];

/* ───────────────────────── AUTOMATIONS ───────────────────────── */

export const workflows: AutomationWorkflow[] = [
  {
    id: "wf1",
    nome: "Lead novo → WA + rota IA",
    descricao: "Recebe lead do ads, manda boas-vindas WA, aloca corretor via IA",
    categoria: "pre_venda",
    ativa: true,
    iniciadas: 1820,
    concluidas: 1740,
    convertidas: 412,
    conversao_pct: 0.225,
    receita_gerada: 612400,
    criada_em: days(62),
    atualizada_em: days(4),
    autor: "Amanda Rocha",
    nodes: [
      { id: "n1", tipo: "gatilho", label: "Novo lead (Ads)", position: { x: 40, y: 40 }, next: ["n2"], config: { evento: "ad_conversao" } },
      { id: "n2", tipo: "acao", label: "Enviar WA boas-vindas", position: { x: 260, y: 40 }, next: ["n3"], config: { template: "ol_boas_vindas" } },
      { id: "n3", tipo: "espera", label: "Aguardar 5 min", position: { x: 480, y: 40 }, next: ["n4"], config: { delay_min: 5 } },
      { id: "n4", tipo: "acao", label: "Roteamento IA", position: { x: 700, y: 40 }, next: ["n5"] },
      { id: "n5", tipo: "fim", label: "Fim", position: { x: 920, y: 40 } },
    ],
  },
  {
    id: "wf2",
    nome: "Renovação D-60 → D-7",
    descricao: "Cadência de renovação com 4 toques, desconto progressivo",
    categoria: "renovacao",
    ativa: true,
    iniciadas: 418,
    concluidas: 412,
    convertidas: 221,
    conversao_pct: 0.536,
    receita_gerada: 358800,
    criada_em: days(90),
    atualizada_em: days(11),
    autor: "Bruno Teixeira",
    nodes: [
      { id: "r1", tipo: "gatilho", label: "Passaporte D-60", position: { x: 40, y: 40 }, next: ["r2"] },
      { id: "r2", tipo: "acao", label: "Enviar e-mail 10% off", position: { x: 260, y: 40 }, next: ["r3"] },
      { id: "r3", tipo: "espera", label: "Espera 15 dias", position: { x: 480, y: 40 }, next: ["r4"] },
      { id: "r4", tipo: "condicao", label: "Renovou?", position: { x: 700, y: 40 }, next: ["r5", "r6"] },
      { id: "r5", tipo: "fim", label: "Fim (ganho)", position: { x: 920, y: -20 } },
      { id: "r6", tipo: "acao", label: "WA 15% off + família", position: { x: 920, y: 100 }, next: ["r7"] },
      { id: "r7", tipo: "fim", label: "Fim", position: { x: 1140, y: 100 } },
    ],
  },
  {
    id: "wf3",
    nome: "Lead parado 48h → Escalar",
    descricao: "Se corretor não responde em 48h, avisa gestor e reroteia",
    categoria: "interno",
    ativa: true,
    iniciadas: 142,
    concluidas: 138,
    convertidas: 61,
    conversao_pct: 0.441,
    receita_gerada: 94800,
    criada_em: days(45),
    atualizada_em: days(2),
    autor: "Sistema",
    nodes: [
      { id: "p1", tipo: "gatilho", label: "Lead parado 48h", position: { x: 40, y: 40 }, next: ["p2"] },
      { id: "p2", tipo: "acao", label: "Notificar gestor", position: { x: 260, y: 40 }, next: ["p3"] },
      { id: "p3", tipo: "acao", label: "Rerotear IA", position: { x: 480, y: 40 }, next: ["p4"] },
      { id: "p4", tipo: "fim", label: "Fim", position: { x: 700, y: 40 } },
    ],
  },
  {
    id: "wf4",
    nome: "Pós-venda NPS + indicação",
    descricao: "7 dias após compra, pede NPS e oferece R$50 por indicação",
    categoria: "pos_venda",
    ativa: true,
    iniciadas: 612,
    concluidas: 589,
    convertidas: 94,
    conversao_pct: 0.16,
    receita_gerada: 142200,
    criada_em: days(75),
    atualizada_em: days(21),
    autor: "Carla Lima",
    nodes: [
      { id: "a1", tipo: "gatilho", label: "Venda fechada", position: { x: 40, y: 40 }, next: ["a2"] },
      { id: "a2", tipo: "espera", label: "Espera 7 dias", position: { x: 260, y: 40 }, next: ["a3"] },
      { id: "a3", tipo: "acao", label: "Enviar NPS", position: { x: 480, y: 40 }, next: ["a4"] },
      { id: "a4", tipo: "condicao", label: "NPS ≥ 9?", position: { x: 700, y: 40 }, next: ["a5", "a6"] },
      { id: "a5", tipo: "acao", label: "Convidar indicar", position: { x: 920, y: -20 }, next: ["a7"] },
      { id: "a6", tipo: "fim", label: "Fim", position: { x: 920, y: 100 } },
      { id: "a7", tipo: "fim", label: "Fim", position: { x: 1140, y: -20 } },
    ],
  },
  {
    id: "wf5",
    nome: "Reativação 90d inativo",
    descricao: "Cliente sem visita 90d recebe cupom + story personalizado IA",
    categoria: "reativacao",
    ativa: false,
    iniciadas: 84,
    concluidas: 79,
    convertidas: 18,
    conversao_pct: 0.228,
    receita_gerada: 22400,
    criada_em: days(30),
    atualizada_em: days(15),
    autor: "Amanda Rocha",
    nodes: [
      { id: "x1", tipo: "gatilho", label: "Cliente 90d sem visita", position: { x: 40, y: 40 }, next: ["x2"] },
      { id: "x2", tipo: "acao", label: "Gerar cupom IA", position: { x: 260, y: 40 }, next: ["x3"] },
      { id: "x3", tipo: "acao", label: "Enviar WA + story", position: { x: 480, y: 40 }, next: ["x4"] },
      { id: "x4", tipo: "fim", label: "Fim", position: { x: 700, y: 40 } },
    ],
  },
];

/* ───────────────────────── PROPOSTAS ───────────────────────── */

export const propostas: Proposta[] = [
  {
    id: "pr1",
    numero: "VP-2026-0412",
    lead_id: "l1",
    cliente_nome: "Julia Costa",
    cliente_email: "julia@email.com",
    corretor_id: "c1",
    status: "enviada",
    itens: [
      { descricao: "Passaporte Anual Família (4 pessoas)", quantidade: 1, preco_unit: 1480, desconto_pct: 10 },
    ],
    subtotal: 1480,
    desconto_total: 148,
    total: 1332,
    parcelas: 12,
    validade: future(5),
    observacoes: "Incluir cashback de R$50 na 1ª renovação.",
    visualizacoes: 3,
    criada_em: hours(4),
    enviada_em: hours(3),
    template_id: "tpl-anual",
  },
  {
    id: "pr2",
    numero: "VP-2026-0411",
    lead_id: "l2",
    cliente_nome: "Rafael Andrade",
    cliente_email: "rafa@email.com",
    corretor_id: "c2",
    status: "visualizada",
    itens: [
      { descricao: "Passaporte Anual Individual", quantidade: 1, preco_unit: 620, desconto_pct: 0 },
      { descricao: "Upgrade VIP (acesso preferencial)", quantidade: 1, preco_unit: 180, desconto_pct: 10 },
    ],
    subtotal: 800,
    desconto_total: 18,
    total: 782,
    parcelas: 6,
    validade: future(2),
    observacoes: "",
    visualizacoes: 7,
    criada_em: days(1),
    enviada_em: days(1),
    template_id: "tpl-anual",
  },
  {
    id: "pr3",
    numero: "VP-2026-0410",
    lead_id: "l5",
    cliente_nome: "Grupo Tânia Corporativo",
    cliente_email: "tania@empresa.com.br",
    corretor_id: "c1",
    status: "aceita",
    itens: [
      { descricao: "Pacote Corporativo 40 pessoas", quantidade: 40, preco_unit: 68, desconto_pct: 15 },
    ],
    subtotal: 2720,
    desconto_total: 408,
    total: 2312,
    parcelas: 3,
    validade: days(2),
    observacoes: "Ativação: 2026-04-28.",
    visualizacoes: 5,
    criada_em: days(3),
    enviada_em: days(3),
    aceita_em: days(1),
  },
  {
    id: "pr4",
    numero: "VP-2026-0409",
    cliente_nome: "Marina Rosa",
    cliente_email: "marina@email.com",
    corretor_id: "c3",
    status: "rascunho",
    itens: [
      { descricao: "Passaporte Diário (2 pessoas)", quantidade: 2, preco_unit: 89, desconto_pct: 0 },
    ],
    subtotal: 178,
    desconto_total: 0,
    total: 178,
    parcelas: 1,
    validade: future(7),
    observacoes: "",
    visualizacoes: 0,
    criada_em: mins(45),
  },
  {
    id: "pr5",
    numero: "VP-2026-0407",
    lead_id: "l6",
    cliente_nome: "Pedro Lima",
    cliente_email: "pedro@email.com",
    corretor_id: "c2",
    status: "recusada",
    itens: [{ descricao: "Passaporte Anual Individual", quantidade: 1, preco_unit: 620, desconto_pct: 0 }],
    subtotal: 620,
    desconto_total: 0,
    total: 620,
    parcelas: 6,
    validade: days(5),
    observacoes: "",
    visualizacoes: 2,
    criada_em: days(8),
    enviada_em: days(8),
  },
  {
    id: "pr6",
    numero: "VP-2026-0402",
    cliente_nome: "Ana Beatriz",
    cliente_email: "ana@email.com",
    corretor_id: "c1",
    status: "expirada",
    itens: [{ descricao: "Passaporte Anual Família (3)", quantidade: 1, preco_unit: 1180, desconto_pct: 5 }],
    subtotal: 1180,
    desconto_total: 59,
    total: 1121,
    parcelas: 10,
    validade: days(3),
    observacoes: "",
    visualizacoes: 1,
    criada_em: days(18),
    enviada_em: days(18),
  },
];

/* ───────────────────────── SEGMENTOS ───────────────────────── */

export const segmentos: Segmento[] = [
  {
    id: "sg1",
    nome: "Pais com filhos 4-12",
    descricao: "Leads declararam ter criança, ticket médio mais alto",
    tipo: "lead",
    logica: "and",
    regras: [
      { campo: "tem_crianca", operador: "igual", valor: "true" },
      { campo: "score", operador: "maior", valor: 60 },
    ],
    tamanho: 284,
    ltv_medio: 2840,
    conversao_pct: 0.34,
    atualizado_em: hours(3),
    cor: "brand",
  },
  {
    id: "sg2",
    nome: "VIP engajado sem comprar",
    descricao: "Engajou ≥5x no IG, ainda não virou cliente",
    tipo: "lead",
    logica: "and",
    regras: [
      { campo: "canal", operador: "igual", valor: "instagram" },
      { campo: "score", operador: "maior", valor: 70 },
      { campo: "status", operador: "diferente", valor: "fechado" },
    ],
    tamanho: 96,
    ltv_medio: 3120,
    conversao_pct: 0.41,
    atualizado_em: hours(8),
    cor: "violet",
  },
  {
    id: "sg3",
    nome: "Renovação próxima 60 dias",
    descricao: "Passaporte venceu/vence em 60d",
    tipo: "cliente",
    logica: "and",
    regras: [
      { campo: "tipo", operador: "igual", valor: "anual" },
      { campo: "dias_restantes", operador: "entre", valor: [0, 60] },
    ],
    tamanho: 412,
    ltv_medio: 1820,
    conversao_pct: 0.62,
    atualizado_em: hours(1),
    cor: "amber",
  },
  {
    id: "sg4",
    nome: "Visitou 5+ vezes no ano",
    descricao: "Super fãs — candidatos a programa de embaixador",
    tipo: "cliente",
    logica: "and",
    regras: [{ campo: "visitas_ano", operador: "maior", valor: 5 }],
    tamanho: 158,
    ltv_medio: 3900,
    conversao_pct: 0.78,
    atualizado_em: days(1),
    cor: "emerald",
  },
  {
    id: "sg5",
    nome: "Abandonou lead form 7d",
    descricao: "Iniciou formulário no site/Ads e não concluiu",
    tipo: "visitante",
    logica: "and",
    regras: [
      { campo: "form_start", operador: "igual", valor: "true" },
      { campo: "form_submit", operador: "igual", valor: "false" },
    ],
    tamanho: 642,
    ltv_medio: 1140,
    conversao_pct: 0.18,
    atualizado_em: mins(30),
    cor: "rose",
  },
  {
    id: "sg6",
    nome: "Grupo escolar / corporativo",
    descricao: "Leads marcados como grupo ≥ 15 pessoas",
    tipo: "lead",
    logica: "and",
    regras: [{ campo: "num_pessoas", operador: "maior", valor: 15 }],
    tamanho: 38,
    ltv_medio: 8400,
    conversao_pct: 0.52,
    atualizado_em: hours(12),
    cor: "aqua",
  },
];

/* ───────────────────────── TRACKING ───────────────────────── */

export const sessoesSite: SessaoSite[] = [
  { id: "s1", lead_id: "l1", paginas: 7, duracao_s: 412, fonte: "instagram/mc1", device: "mobile", cidade: "São Luís", converteu: true, created_at: hours(1) },
  { id: "s2", paginas: 3, duracao_s: 94, fonte: "google/organic", device: "mobile", cidade: "São José Ribamar", converteu: false, created_at: hours(2) },
  { id: "s3", lead_id: "l2", paginas: 12, duracao_s: 680, fonte: "facebook/mc2", device: "desktop", cidade: "Paço do Lumiar", converteu: true, created_at: hours(3) },
  { id: "s4", paginas: 2, duracao_s: 41, fonte: "direct", device: "mobile", cidade: "São Luís", converteu: false, created_at: hours(5) },
  { id: "s5", lead_id: "l3", paginas: 5, duracao_s: 238, fonte: "instagram/mc1", device: "mobile", cidade: "Raposa", converteu: true, created_at: hours(8) },
  { id: "s6", paginas: 9, duracao_s: 520, fonte: "google/cpc", device: "desktop", cidade: "Teresina", converteu: false, created_at: hours(11) },
  { id: "s7", paginas: 4, duracao_s: 155, fonte: "facebook/mc3", device: "mobile", cidade: "São Luís", converteu: false, created_at: hours(14) },
  { id: "s8", lead_id: "l4", paginas: 8, duracao_s: 390, fonte: "instagram/mc2", device: "mobile", cidade: "São Luís", converteu: true, created_at: hours(18) },
];

export const eventosTracking: EventoTracking[] = [
  { id: "ev1", tipo: "pageview", pagina: "/passaporte-anual", sessao_id: "s1", utm_source: "instagram", utm_medium: "paid", utm_campaign: "mc1", utm_content: "cr1", device: "mobile", browser: "Instagram WebView", cidade: "São Luís", created_at: hours(1) },
  { id: "ev2", tipo: "cta_click", pagina: "/passaporte-anual", lead_id: "l1", sessao_id: "s1", utm_source: "instagram", utm_medium: "paid", utm_campaign: "mc1", utm_content: "cr1", device: "mobile", browser: "Instagram WebView", created_at: hours(1) },
  { id: "ev3", tipo: "form_start", pagina: "/comprar", lead_id: "l1", sessao_id: "s1", utm_source: "instagram", utm_medium: "paid", utm_campaign: "mc1", device: "mobile", browser: "Instagram WebView", created_at: hours(1) },
  { id: "ev4", tipo: "form_submit", pagina: "/comprar", lead_id: "l1", sessao_id: "s1", utm_source: "instagram", utm_medium: "paid", utm_campaign: "mc1", device: "mobile", browser: "Instagram WebView", created_at: hours(1) },
  { id: "ev5", tipo: "lead_generated", pagina: "/comprar", lead_id: "l1", sessao_id: "s1", utm_source: "instagram", utm_medium: "paid", utm_campaign: "mc1", device: "mobile", browser: "Instagram WebView", created_at: hours(1) },
  { id: "ev6", tipo: "pageview", pagina: "/", sessao_id: "s2", device: "mobile", browser: "Chrome", cidade: "São José Ribamar", created_at: hours(2) },
  { id: "ev7", tipo: "scroll_deep", pagina: "/diaria", sessao_id: "s3", utm_source: "facebook", utm_medium: "paid", utm_campaign: "mc2", device: "desktop", browser: "Safari", created_at: hours(3) },
  { id: "ev8", tipo: "video_play", pagina: "/atracoes", sessao_id: "s3", utm_source: "facebook", utm_medium: "paid", utm_campaign: "mc2", device: "desktop", browser: "Safari", created_at: hours(3) },
];

/* ───────────────────────── RELATÓRIOS CUSTOMIZADOS ───────────────────────── */

export const relatorios: RelatorioCustomizado[] = [
  {
    id: "rp1",
    nome: "Receita por corretor × canal",
    descricao: "Cruzamento mensal de receita fechada por corretor e canal de origem",
    fonte: "vendas",
    dimensao: "corretor_id,canal",
    metricas: ["receita", "tickets", "conversao"],
    filtros: [],
    visual: "tabela",
    favorito: true,
    agendado: "semanal",
    destinatarios: ["gestor@valparaiso.com"],
    criado_em: days(24),
    autor: "Amanda Rocha",
  },
  {
    id: "rp2",
    nome: "CPL por criativo — IG",
    descricao: "Custo por lead por criativo Instagram, últimos 30 dias",
    fonte: "campanhas",
    dimensao: "criativo_id",
    metricas: ["cpl", "ctr", "leads_qualificados"],
    filtros: [{ campo: "plataforma", operador: "contem", valor: "instagram" }],
    visual: "barra",
    favorito: true,
    criado_em: days(12),
    autor: "Amanda Rocha",
  },
  {
    id: "rp3",
    nome: "Funil: ads → lead → venda",
    descricao: "Funil por campanha, 7 dias",
    fonte: "campanhas",
    dimensao: "campanha_id",
    metricas: ["impressoes", "cliques", "leads", "vendas"],
    filtros: [],
    visual: "funil",
    favorito: true,
    criado_em: days(6),
    autor: "Bruno Teixeira",
  },
  {
    id: "rp4",
    nome: "Renovação por tipo de passaporte",
    descricao: "Taxa de renovação por tipo — anual ind / família / VIP",
    fonte: "passaportes",
    dimensao: "tipo",
    metricas: ["renovacoes", "taxa_renovacao"],
    filtros: [],
    visual: "pizza",
    favorito: false,
    agendado: "mensal",
    destinatarios: ["gestor@valparaiso.com", "amanda@valparaiso.com"],
    criado_em: days(40),
    autor: "Amanda Rocha",
  },
  {
    id: "rp5",
    nome: "SLA SAC por categoria",
    descricao: "Tempo médio até resolução por categoria de ticket",
    fonte: "tickets",
    dimensao: "categoria",
    metricas: ["sla_medio", "abertos"],
    filtros: [],
    visual: "barra",
    favorito: false,
    criado_em: days(9),
    autor: "Carla Lima",
  },
  {
    id: "rp6",
    nome: "Meta vs. realizado mensal",
    descricao: "Progresso de meta por corretor",
    fonte: "corretores",
    dimensao: "corretor_id",
    metricas: ["meta_mensal", "receita_mes"],
    filtros: [],
    visual: "kpi",
    favorito: true,
    criado_em: days(3),
    autor: "Gestor",
  },
];

/* ───────────────────────── INTEGRAÇÕES / API ───────────────────────── */

export const integracoes: Integracao[] = [
  { id: "in1", nome: "Meta Ads Manager", categoria: "ads", icone: "meta", status: "conectado", conectado_em: days(45), ultimo_sync: mins(8), descricao: "Sincroniza campanhas, ad sets e leads de formulário.", eventos_24h: 412 },
  { id: "in2", nome: "Google Ads", categoria: "ads", icone: "google", status: "conectado", conectado_em: days(30), ultimo_sync: mins(12), descricao: "CPC, CTR e conversões via gtag.", eventos_24h: 128 },
  { id: "in3", nome: "WhatsApp Business API", categoria: "comunicacao", icone: "whatsapp", status: "conectado", conectado_em: days(180), ultimo_sync: mins(1), descricao: "Mensageria oficial via BSP certificado.", eventos_24h: 2840 },
  { id: "in4", nome: "Instagram Graph API", categoria: "comunicacao", icone: "instagram", status: "conectado", conectado_em: days(92), ultimo_sync: mins(2), descricao: "DM, story replies e comentários.", eventos_24h: 418 },
  { id: "in5", nome: "Stripe", categoria: "pagamento", icone: "stripe", status: "conectado", conectado_em: days(220), ultimo_sync: mins(6), descricao: "Cobrança recorrente e pagamentos únicos.", eventos_24h: 98 },
  { id: "in6", nome: "Pagar.me", categoria: "pagamento", icone: "pagarme", status: "reautenticar", conectado_em: days(310), ultimo_sync: hours(48), descricao: "Processador PIX + cartão BR.", eventos_24h: 0 },
  { id: "in7", nome: "RD Station", categoria: "automacao", icone: "rd", status: "desconectado", descricao: "Import leads + sincronizar segmentações.", eventos_24h: 0 },
  { id: "in8", nome: "Google Analytics 4", categoria: "analytics", icone: "ga4", status: "conectado", conectado_em: days(45), ultimo_sync: mins(4), descricao: "Eventos de sessão e conversão.", eventos_24h: 3120 },
  { id: "in9", nome: "Catraca AquaPark", categoria: "operacional", icone: "catraca", status: "conectado", conectado_em: days(720), ultimo_sync: mins(1), descricao: "Leitura de QR code em tempo real.", eventos_24h: 1840 },
  { id: "in10", nome: "Zapier", categoria: "automacao", icone: "zapier", status: "erro", conectado_em: days(12), ultimo_sync: hours(30), descricao: "Fluxos custom fora do builder nativo.", eventos_24h: 8 },
];

export const apiKeys: APIKey[] = [
  { id: "k1", nome: "Site oficial — server", ambiente: "producao", prefixo: "vp_live_8a21...", criada_em: days(120), ultimo_uso: mins(4), escopos: ["leads.write", "propostas.read"], criada_por: "Amanda", ativa: true },
  { id: "k2", nome: "Landing page abril — client", ambiente: "producao", prefixo: "vp_pub_f0e2...", criada_em: days(18), ultimo_uso: mins(30), escopos: ["leads.write"], criada_por: "Bruno", ativa: true },
  { id: "k3", nome: "Sandbox dev", ambiente: "sandbox", prefixo: "vp_test_1c9d...", criada_em: days(40), ultimo_uso: hours(6), escopos: ["*"], criada_por: "Admin", ativa: true },
  { id: "k4", nome: "Antigo app parceiro", ambiente: "producao", prefixo: "vp_live_a412...", criada_em: days(380), escopos: ["leads.read"], criada_por: "Admin", ativa: false },
];

export const webhooks: Webhook[] = [
  { id: "wh1", nome: "Slack #vendas → lead fechado", url: "https://hooks.slack.com/T01.../vendas", eventos: ["lead.fechado", "proposta.aceita"], ativo: true, criado_em: days(90), ultimo_disparo: mins(12), status_ultimo: "sucesso", taxa_sucesso: 0.998 },
  { id: "wh2", nome: "ERP financeiro", url: "https://erp.interno/api/hooks/vp", eventos: ["venda.criada", "passaporte.emitido"], ativo: true, criado_em: days(220), ultimo_disparo: mins(20), status_ultimo: "sucesso", taxa_sucesso: 0.991 },
  { id: "wh3", nome: "Parceiro corporativo", url: "https://api.parceiro.com.br/vp", eventos: ["lead.qualificado"], ativo: true, criado_em: days(60), ultimo_disparo: hours(2), status_ultimo: "falha", taxa_sucesso: 0.84 },
  { id: "wh4", nome: "SMS escalation", url: "https://sms.provider/webhook", eventos: ["alerta.critico"], ativo: false, criado_em: days(14), status_ultimo: "pendente", taxa_sucesso: 0 },
];

/* ───────────────────────── JORNADA DO CLIENTE ───────────────────────── */

export const jornadaEventos: JornadaEvento[] = [
  { id: "j1", cliente_id: "cli1", etapa: "descoberta", tipo: "primeira_visita_ig", descricao: "Primeiro clique no reel #mc1", canal: "instagram", created_at: days(62) },
  { id: "j2", cliente_id: "cli1", etapa: "interesse", tipo: "lead_form", descricao: "Preencheu lead form IG", canal: "instagram", created_at: days(60) },
  { id: "j3", cliente_id: "cli1", etapa: "consideracao", tipo: "conversa_wa", descricao: "3 mensagens trocadas com Amanda", canal: "whatsapp", created_at: days(58) },
  { id: "j4", cliente_id: "cli1", etapa: "decisao", tipo: "proposta_aceita", descricao: "Aceitou proposta VP-0210 (R$ 1.332)", canal: "sistema", valor: 1332, created_at: days(57) },
  { id: "j5", cliente_id: "cli1", etapa: "cliente", tipo: "primeira_visita_parque", descricao: "Primeira entrada via catraca", canal: "sistema", created_at: days(48) },
  { id: "j6", cliente_id: "cli1", etapa: "cliente", tipo: "visita_recorrente", descricao: "4ª visita no trimestre", canal: "sistema", created_at: days(12) },
  { id: "j7", cliente_id: "cli1", etapa: "advocacy", tipo: "nps_promotor", descricao: "NPS = 10, indicou 2 amigas", canal: "email", created_at: days(5) },
  { id: "j8", cliente_id: "cli2", etapa: "descoberta", tipo: "primeira_visita_ig", descricao: "Seguiu após reel #tobogã", canal: "instagram", created_at: days(30) },
  { id: "j9", cliente_id: "cli2", etapa: "interesse", tipo: "dm_enviado", descricao: "Mandou DM perguntando valor", canal: "instagram", created_at: days(29) },
  { id: "j10", cliente_id: "cli2", etapa: "consideracao", tipo: "conversa_wa", descricao: "Migrou para WA com Bruno", canal: "whatsapp", created_at: days(28) },
];


/* ═══════════════════════════ TIER 1 — PRODUCTION ═══════════════════════════ */

export const auditoriaLogs: AuditoriaLog[] = [
  { id: "a1", ator: "Gestor Diego", ator_papel: "gestor", acao: "permission_change", entidade: "Corretor", entidade_id: "c2", entidade_label: "Bruno", ip: "187.45.22.10", user_agent: "Chrome 126 / macOS", diff: [{ campo: "papel", antes: "corretor", depois: "supervisor" }], created_at: mins(12) },
  { id: "a2", ator: "Amanda", ator_papel: "corretor", acao: "update", entidade: "Lead", entidade_id: "L-0042", entidade_label: "Maria Silva", ip: "177.12.8.4", user_agent: "Chrome 126 / Windows", diff: [{ campo: "status", antes: "novo", depois: "qualificado" }, { campo: "tag_quente", antes: false, depois: true }], created_at: mins(28) },
  { id: "a3", ator: "Admin", ator_papel: "admin", acao: "config_change", entidade: "SLA", entidade_label: "sla_primeiro_contato", ip: "10.0.0.12", user_agent: "Firefox 128 / Ubuntu", diff: [{ campo: "minutos", antes: 15, depois: 10 }], created_at: hours(2) },
  { id: "a4", ator: "Bruno", ator_papel: "corretor", acao: "export", entidade: "Leads", entidade_label: "exportação CSV (124 linhas)", ip: "189.22.14.8", user_agent: "Safari 17 / iOS", created_at: hours(4) },
  { id: "a5", ator: "Gestor Diego", ator_papel: "gestor", acao: "impersonate", entidade: "Corretor", entidade_id: "c3", entidade_label: "Carla", ip: "187.45.22.10", user_agent: "Chrome 126 / macOS", created_at: hours(6) },
  { id: "a6", ator: "Carla", ator_papel: "corretor", acao: "delete", entidade: "Proposta", entidade_id: "P-018", entidade_label: "Família Costa — R$ 1.332", ip: "177.8.14.1", user_agent: "Chrome Mobile / Android", created_at: hours(9) },
  { id: "a7", ator: "Admin", ator_papel: "admin", acao: "login", entidade: "Sessão", ip: "10.0.0.12", user_agent: "Firefox 128 / Ubuntu", created_at: hours(12) },
  { id: "a8", ator: "Juliana (SAC)", ator_papel: "sac", acao: "create", entidade: "Ticket", entidade_id: "T-0231", entidade_label: "Tobogã gigante — reclamação", ip: "177.45.9.3", user_agent: "Edge 126 / Windows", created_at: hours(14) },
  { id: "a9", ator: "Gestor Diego", ator_papel: "gestor", acao: "config_change", entidade: "Comissão", entidade_label: "regra_passaporte_anual", ip: "187.45.22.10", user_agent: "Chrome 126 / macOS", diff: [{ campo: "pct", antes: 8, depois: 10 }], created_at: days(1) },
  { id: "a10", ator: "Supervisor Paulo", ator_papel: "supervisor", acao: "update", entidade: "Workflow", entidade_id: "wf2", entidade_label: "Cadência 7 toques", ip: "177.8.3.22", user_agent: "Chrome 126 / Windows", diff: [{ campo: "status", antes: "pausado", depois: "ativo" }], created_at: days(1) },
  { id: "a11", ator: "Amanda", ator_papel: "corretor", acao: "view", entidade: "Cliente", entidade_id: "cli1", entidade_label: "Beatriz Santos", ip: "177.12.8.4", user_agent: "Chrome 126 / Windows", created_at: days(2) },
  { id: "a12", ator: "Admin", ator_papel: "admin", acao: "logout", entidade: "Sessão", ip: "10.0.0.12", user_agent: "Firefox 128 / Ubuntu", created_at: days(2) },
];

export const lgpdSolicitacoes: LGPDSolicitacao[] = [
  { id: "lg1", titular: "João Batista", email: "joao.batista@email.com", cpf: "***.***.123-00", tipo: "exclusao", status: "em_analise", descricao: "Solicitou exclusão total após não renovar passaporte.", sla_dias: 15, prazo: days(-5), created_at: days(10), responsavel: "Admin" },
  { id: "lg2", titular: "Fernanda Rocha", email: "fer.rocha@gmail.com", cpf: "***.***.456-00", tipo: "acesso", status: "concluida", descricao: "Solicitação de cópia completa dos dados pessoais.", sla_dias: 15, prazo: days(-12), created_at: days(20), concluida_em: days(6), responsavel: "Admin" },
  { id: "lg3", titular: "Roberto Lima", email: "roberto@empresaxyz.com", cpf: "***.***.789-00", tipo: "revogacao_consentimento", status: "concluida", descricao: "Revogou consentimento de marketing por email e SMS.", sla_dias: 15, prazo: days(-3), created_at: days(4), concluida_em: days(3), responsavel: "Juliana (SAC)" },
  { id: "lg4", titular: "Patrícia Mendes", email: "pati.mendes@hotmail.com", cpf: "***.***.012-00", tipo: "portabilidade", status: "pendente", descricao: "Quer migrar dados para outro parque (formato CSV).", sla_dias: 15, prazo: days(-10), created_at: days(5) },
  { id: "lg5", titular: "Eduardo Farias", email: "edu.farias@gmail.com", cpf: "***.***.345-00", tipo: "retificacao", status: "concluida", descricao: "Correção de CPF e data de nascimento.", sla_dias: 5, prazo: days(-1), created_at: days(6), concluida_em: days(4), responsavel: "Admin" },
  { id: "lg6", titular: "Cláudia Souza", email: "claudia.s@yahoo.com", cpf: "***.***.678-00", tipo: "anonimizacao", status: "negada", descricao: "Cliente ativo — anonimização indeferida (base legal: execução contratual).", sla_dias: 15, prazo: days(-14), created_at: days(15), concluida_em: days(12), responsavel: "Admin" },
];

export const consentsTitulares: ConsentTitular[] = clientes.slice(0, 6).map((c, i) => ({
  id: `con${i + 1}`,
  cliente_id: c.id,
  nome: c.nome,
  marketing_email: i % 2 === 0,
  marketing_whatsapp: i !== 2,
  marketing_sms: i > 3,
  cookies_analytics: true,
  cookies_marketing: i % 3 !== 0,
  atualizado_em: days(i * 3 + 2),
}));

export const automationExecs: AutomationExec[] = [
  { id: "ex1", workflow_id: "wf1", workflow_nome: "Boas-vindas novo lead", lead_id: "L-0001", status: "rodando", node_atual: "n3", iniciada_em: mins(1), duracao_ms: 58000, tentativas: 1, log: [{ node: "n1", status: "sucesso", ts: mins(1), msg: "Gatilho: lead.novo" }, { node: "n2", status: "sucesso", ts: mins(1), msg: "Mensagem WA enviada" }, { node: "n3", status: "rodando", ts: mins(0) }] },
  { id: "ex2", workflow_id: "wf2", workflow_nome: "Follow-up 48h", lead_id: "L-0002", status: "sucesso", node_atual: "end", iniciada_em: mins(8), concluida_em: mins(2), duracao_ms: 362000, tentativas: 1, log: [{ node: "n1", status: "sucesso", ts: mins(8) }, { node: "n2", status: "sucesso", ts: mins(6) }, { node: "n3", status: "sucesso", ts: mins(2) }] },
  { id: "ex3", workflow_id: "wf3", workflow_nome: "Qualificação IA", lead_id: "L-0003", status: "falha", node_atual: "n4", iniciada_em: mins(15), concluida_em: mins(14), duracao_ms: 41000, tentativas: 3, log: [{ node: "n1", status: "sucesso", ts: mins(15) }, { node: "n4", status: "falha", ts: mins(14), msg: "Timeout API classificação" }] },
  { id: "ex4", workflow_id: "wf1", workflow_nome: "Boas-vindas novo lead", lead_id: "L-0004", status: "sucesso", node_atual: "end", iniciada_em: mins(25), concluida_em: mins(22), duracao_ms: 182000, tentativas: 1, log: [{ node: "n1", status: "sucesso", ts: mins(25) }, { node: "n2", status: "sucesso", ts: mins(23) }, { node: "n3", status: "sucesso", ts: mins(22) }] },
  { id: "ex5", workflow_id: "wf4", workflow_nome: "Renovação T-30", lead_id: "L-0005", status: "retry", node_atual: "n2", iniciada_em: mins(30), duracao_ms: 1800000, tentativas: 2, log: [{ node: "n1", status: "sucesso", ts: mins(30) }, { node: "n2", status: "falha", ts: mins(29), msg: "Template não aprovado" }, { node: "n2", status: "retry", ts: mins(15) }] },
  { id: "ex6", workflow_id: "wf2", workflow_nome: "Follow-up 48h", lead_id: "L-0006", status: "cancelada", node_atual: "n2", iniciada_em: hours(2), concluida_em: hours(1), duracao_ms: 3600000, tentativas: 1, log: [{ node: "n1", status: "sucesso", ts: hours(2) }, { node: "n2", status: "cancelada", ts: hours(1), msg: "Lead converteu antes" }] },
  { id: "ex7", workflow_id: "wf1", workflow_nome: "Boas-vindas novo lead", lead_id: "L-0007", status: "sucesso", node_atual: "end", iniciada_em: hours(4), concluida_em: hours(3), duracao_ms: 2700000, tentativas: 1, log: [{ node: "n1", status: "sucesso", ts: hours(4) }, { node: "n3", status: "sucesso", ts: hours(3) }] },
  { id: "ex8", workflow_id: "wf3", workflow_nome: "Qualificação IA", lead_id: "L-0008", status: "sucesso", node_atual: "end", iniciada_em: hours(6), concluida_em: hours(5), duracao_ms: 1800000, tentativas: 1, log: [{ node: "n1", status: "sucesso", ts: hours(6) }, { node: "n4", status: "sucesso", ts: hours(5) }] },
];

/* ═══════════════════════════ TIER 2 — DIFFERENTIATORS ═══════════════════════════ */

export const botConfigs: BotConfig[] = [
  { id: "bot1", nome: "Assistente WhatsApp — Vendas", ativo: true, canal: "whatsapp", horario: "24_7", persona: "Atendente simpática, tom informal brasileiro, nunca promete preço sem consultar.", base_conhecimento: ["Preços e pacotes", "Horário de funcionamento", "Política de cancelamento", "Atrações e idade mínima"], handoff_regras: ["Pedido de preço corporativo", "Reclamação", "Cliente mencionou 'gerente'", "3 falhas de intenção"], conversas_ativas: 42, taxa_resolucao: 0.68, taxa_handoff: 0.32, csat: 4.6 },
  { id: "bot2", nome: "Bot Instagram DMs", ativo: true, canal: "instagram", horario: "24_7", persona: "Descontraída, emojis moderados, redireciona para WA em ofertas.", base_conhecimento: ["Atrações", "Fotos por idade", "Aniversários"], handoff_regras: ["Pedido de desconto", "Lead corporativo", "Reclamação"], conversas_ativas: 18, taxa_resolucao: 0.72, taxa_handoff: 0.28, csat: 4.4 },
  { id: "bot3", nome: "SAC Pós-Venda", ativo: true, canal: "whatsapp", horario: "comercial", persona: "Formal, empática, prioriza resolução rápida.", base_conhecimento: ["FAQ operacional", "Reembolso", "Reagendamento", "Acessibilidade"], handoff_regras: ["Reembolso > R$ 500", "Acidente", "Cliente VIP"], conversas_ativas: 9, taxa_resolucao: 0.81, taxa_handoff: 0.19, csat: 4.8 },
];

export const botConversas: BotConversa[] = [
  { id: "bc1", canal: "whatsapp", lead_id: "L-0041", status: "resolvida_bot", mensagens_bot: 7, mensagens_humano: 0, duracao_s: 182, intencao_detectada: "consulta_preco_diaria", iniciada_em: mins(8) },
  { id: "bc2", canal: "whatsapp", lead_id: "L-0042", status: "handoff", mensagens_bot: 4, mensagens_humano: 12, duracao_s: 620, intencao_detectada: "corporativo", handoff_motivo: "Intenção: cotação corporativa (>30 pax)", iniciada_em: mins(22) },
  { id: "bc3", canal: "instagram", status: "ativa", mensagens_bot: 3, mensagens_humano: 0, duracao_s: 48, intencao_detectada: "consulta_horario", iniciada_em: mins(2) },
  { id: "bc4", canal: "whatsapp", lead_id: "L-0043", status: "abandonada", mensagens_bot: 2, mensagens_humano: 0, duracao_s: 900, intencao_detectada: "desconhecida", iniciada_em: hours(1) },
  { id: "bc5", canal: "whatsapp", lead_id: "L-0044", status: "resolvida_bot", mensagens_bot: 5, mensagens_humano: 0, duracao_s: 244, intencao_detectada: "como_chegar", iniciada_em: hours(2) },
  { id: "bc6", canal: "instagram", status: "handoff", mensagens_bot: 3, mensagens_humano: 8, duracao_s: 520, intencao_detectada: "reclamacao", handoff_motivo: "Palavra-chave: 'péssimo'", iniciada_em: hours(3) },
];

export const callGravacoes: CallGravacao[] = [
  { id: "call1", lead_id: "L-0012", corretor_id: "c1", direcao: "outbound", duracao_s: 420, iniciada_em: hours(2), sentimento: "positivo", score_qualidade: 92, fala_pct_corretor: 48, monologo_maior_s: 22, objecoes_detectadas: ["preço alto"], proximos_passos: ["Enviar proposta VIP", "Agendar visita sábado"], palavras_proibidas: 0, resultado: "follow_up" },
  { id: "call2", lead_id: "L-0018", corretor_id: "c2", direcao: "inbound", duracao_s: 680, iniciada_em: hours(4), sentimento: "positivo", score_qualidade: 88, fala_pct_corretor: 41, monologo_maior_s: 18, objecoes_detectadas: ["dia ideal", "lotação"], proximos_passos: ["Enviar link passaporte anual"], palavras_proibidas: 0, resultado: "ganho" },
  { id: "call3", lead_id: "L-0023", corretor_id: "c3", direcao: "outbound", duracao_s: 180, iniciada_em: hours(6), sentimento: "negativo", score_qualidade: 54, fala_pct_corretor: 78, monologo_maior_s: 92, objecoes_detectadas: ["sem interesse", "já tem outro parque"], proximos_passos: [], palavras_proibidas: 2, resultado: "perdido" },
  { id: "call4", lead_id: "L-0028", corretor_id: "c1", direcao: "outbound", duracao_s: 320, iniciada_em: days(1), sentimento: "neutro", score_qualidade: 71, fala_pct_corretor: 55, monologo_maior_s: 34, objecoes_detectadas: ["vai pensar"], proximos_passos: ["Ligar na terça"], palavras_proibidas: 0, resultado: "follow_up" },
  { id: "call5", lead_id: "L-0031", corretor_id: "c2", direcao: "inbound", duracao_s: 540, iniciada_em: days(1), sentimento: "positivo", score_qualidade: 95, fala_pct_corretor: 44, monologo_maior_s: 15, objecoes_detectadas: ["parcelamento"], proximos_passos: ["Enviar link pagamento 12x"], palavras_proibidas: 0, resultado: "ganho" },
  { id: "call6", corretor_id: "c4", direcao: "outbound", duracao_s: 45, iniciada_em: days(2), sentimento: "neutro", score_qualidade: 30, fala_pct_corretor: 92, monologo_maior_s: 45, objecoes_detectadas: [], proximos_passos: [], palavras_proibidas: 0, resultado: "sem_resposta" },
  { id: "call7", lead_id: "L-0035", corretor_id: "c3", direcao: "outbound", duracao_s: 720, iniciada_em: days(2), sentimento: "positivo", score_qualidade: 89, fala_pct_corretor: 46, monologo_maior_s: 24, objecoes_detectadas: ["dúvida idade criança"], proximos_passos: ["Enviar tabela etária"], palavras_proibidas: 0, resultado: "ganho" },
];

export const forecastEtapas: ForecastEtapa[] = [
  { etapa: "novo", leads: 42, valor_total: 56000, prob_ponderada: 0.10, forecast: 5600 },
  { etapa: "qualificado", leads: 28, valor_total: 48000, prob_ponderada: 0.30, forecast: 14400 },
  { etapa: "em_atendimento", leads: 18, valor_total: 34000, prob_ponderada: 0.55, forecast: 18700 },
  { etapa: "proposta", leads: 12, valor_total: 28000, prob_ponderada: 0.75, forecast: 21000 },
  { etapa: "fechado", leads: 8, valor_total: 18000, prob_ponderada: 1.0, forecast: 18000 },
];

export const forecastCenarios: ForecastCenario[] = [
  { id: "fc1", nome: "pessimista", fechado: 18000, comprometido: 28000, melhor_caso: 48000, meta: 120000, gap: -74000, atingimento_pct: 38.3 },
  { id: "fc2", nome: "base", fechado: 18000, comprometido: 39700, melhor_caso: 77700, meta: 120000, gap: -42300, atingimento_pct: 64.8 },
  { id: "fc3", nome: "otimista", fechado: 18000, comprometido: 55000, melhor_caso: 118000, meta: 120000, gap: -2000, atingimento_pct: 98.3 },
];

export const pagamentos: Pagamento[] = [
  { id: "pg1", cliente_nome: "Beatriz Santos", cliente_email: "beatriz@email.com", passaporte_id: "VP-0210", valor: 1332, metodo: "cartao", status: "pago", parcelas: 12, parcela_atual: 3, gateway: "stripe", created_at: days(90), pago_em: days(90) },
  { id: "pg2", cliente_nome: "Carlos Pereira", cliente_email: "carlos@email.com", passaporte_id: "VP-0234", valor: 890, metodo: "pix", status: "pago", parcelas: 1, parcela_atual: 1, gateway: "pagarme", created_at: days(12), pago_em: days(12) },
  { id: "pg3", cliente_nome: "Diana Lopes", cliente_email: "diana.lopes@gmail.com", proposta_id: "P-041", valor: 2240, metodo: "cartao", status: "pendente", parcelas: 10, parcela_atual: 1, gateway: "stripe", created_at: mins(30) },
  { id: "pg4", cliente_nome: "Evandro Nunes", cliente_email: "evandro@email.com", valor: 420, metodo: "pix", status: "processando", parcelas: 1, parcela_atual: 1, gateway: "mercadopago", created_at: mins(5) },
  { id: "pg5", cliente_nome: "Felipe Araújo", cliente_email: "felipe@email.com", passaporte_id: "VP-0189", valor: 1100, metodo: "boleto", status: "falha", parcelas: 1, parcela_atual: 1, gateway: "pagarme", created_at: days(3) },
  { id: "pg6", cliente_nome: "Gabriela Matos", cliente_email: "gabi.matos@email.com", valor: 1800, metodo: "cartao", status: "pago", parcelas: 6, parcela_atual: 6, gateway: "stripe", created_at: days(180), pago_em: days(180) },
  { id: "pg7", cliente_nome: "Henrique Sá", cliente_email: "hsa@email.com", valor: 890, metodo: "cartao", status: "estornado", parcelas: 1, parcela_atual: 1, gateway: "stripe", created_at: days(20), pago_em: days(20) },
  { id: "pg8", cliente_nome: "Isabela Tavares", cliente_email: "isa.t@email.com", valor: 4500, metodo: "pix", status: "pago", parcelas: 1, parcela_atual: 1, gateway: "pagarme", created_at: days(6), pago_em: days(6) },
  { id: "pg9", cliente_nome: "Julio Monteiro", cliente_email: "julio@email.com", valor: 320, metodo: "cartao", status: "chargeback", parcelas: 1, parcela_atual: 1, gateway: "stripe", created_at: days(45), pago_em: days(45) },
  { id: "pg10", cliente_nome: "Karina Alves", cliente_email: "karina@email.com", passaporte_id: "VP-0201", valor: 1332, metodo: "cartao", status: "pago", parcelas: 12, parcela_atual: 8, gateway: "stripe", created_at: days(240), pago_em: days(240) },
];

export const assinaturas: Assinatura[] = [
  { id: "as1", cliente_nome: "Beatriz Santos", plano: "Anual Família (4 pax)", valor_mensal: 111, status: "ativa", ciclo: "mensal", proxima_cobranca: days(-25), iniciada_em: days(90), churn_risk: "baixo" },
  { id: "as2", cliente_nome: "Gabriela Matos", plano: "Anual Individual", valor_mensal: 150, status: "ativa", ciclo: "mensal", proxima_cobranca: days(-10), iniciada_em: days(180), churn_risk: "baixo" },
  { id: "as3", cliente_nome: "Karina Alves", plano: "VIP Família", valor_mensal: 111, status: "ativa", ciclo: "mensal", proxima_cobranca: days(-22), iniciada_em: days(240), churn_risk: "medio" },
  { id: "as4", cliente_nome: "Lucas Barros", plano: "Anual Individual", valor_mensal: 150, status: "inadimplente", ciclo: "mensal", proxima_cobranca: days(-3), iniciada_em: days(120), churn_risk: "alto" },
  { id: "as5", cliente_nome: "Marina Cotrim", plano: "Anual Família", valor_mensal: 111, status: "pausada", ciclo: "mensal", proxima_cobranca: days(-30), iniciada_em: days(200), churn_risk: "alto" },
  { id: "as6", cliente_nome: "Nelson Freitas", plano: "Corporativo Bronze", valor_mensal: 890, status: "ativa", ciclo: "anual", proxima_cobranca: days(-120), iniciada_em: days(240), churn_risk: "baixo" },
  { id: "as7", cliente_nome: "Olga Ribeiro", plano: "Anual Individual", valor_mensal: 150, status: "cancelada", ciclo: "mensal", proxima_cobranca: days(0), iniciada_em: days(300), churn_risk: "alto" },
];

export const agendaEventos: AgendaEvento[] = [
  { id: "ag1", titulo: "Visita guiada — família Ferreira (8 pax)", tipo: "visita_guiada", inicio: days(-1), fim: days(-1), corretor_id: "c1", lead_id: "L-0012", local: "Recepção principal", observacoes: "Família de SP, interesse em anual.", status: "confirmado", participantes: ["Amanda", "Lead: Ferreira (8)"] },
  { id: "ag2", titulo: "Reunião corporativa — TechCorp", tipo: "reuniao", inicio: days(-2), fim: days(-2), corretor_id: "c2", lead_id: "L-0018", local: "Sala reuniões VP", observacoes: "Cotação 120 passaportes — apresentação institucional.", status: "agendado", participantes: ["Bruno", "Diana (TechCorp)", "João (RH)"] },
  { id: "ag3", titulo: "Ligação follow-up — proposta VP-018", tipo: "ligacao_agendada", inicio: mins(-180), fim: mins(-170), corretor_id: "c3", lead_id: "L-0023", local: "Telefone", observacoes: "Enviada proposta terça, fazer follow.", status: "realizado", participantes: ["Carla"] },
  { id: "ag4", titulo: "Vistoria área aquática — Corretor parceiro", tipo: "vistoria", inicio: days(-3), fim: days(-3), corretor_id: "c1", local: "Tobogã gigante", observacoes: "Avaliar estado após reforma.", status: "agendado", participantes: ["Amanda"] },
  { id: "ag5", titulo: "Evento aniversário — Souza (25 pax)", tipo: "evento", inicio: days(-5), fim: days(-5), corretor_id: "c4", cliente_id: "cli2", local: "Área kids", observacoes: "Kit aniversariante VIP.", status: "confirmado", participantes: ["Daniel", "Família Souza"] },
  { id: "ag6", titulo: "Visita guiada — família Alves", tipo: "visita_guiada", inicio: mins(-60), fim: mins(-30), corretor_id: "c2", lead_id: "L-0031", local: "Recepção principal", observacoes: "Primeira visita, demonstrar todas as áreas.", status: "realizado", participantes: ["Bruno", "Família Alves (5)"] },
  { id: "ag7", titulo: "Ligação proposta — Maranhão Ltda", tipo: "ligacao_agendada", inicio: days(-4), fim: days(-4), corretor_id: "c1", local: "Telefone", observacoes: "Apresentar desconto corporativo.", status: "no_show", participantes: ["Amanda"] },
  { id: "ag8", titulo: "Visita guiada — Corporativo Vivo", tipo: "visita_guiada", inicio: days(-7), fim: days(-7), corretor_id: "c3", local: "Recepção principal", observacoes: "30 pax, tour completo + degustação.", status: "cancelado", participantes: ["Carla"] },
];

/* ═══════════════════════════ TIER 3 — GROWTH ═══════════════════════════ */

export const landingPages: LandingPage[] = [
  { id: "lp1", slug: "anual-familia-promo", titulo: "Passaporte Anual Família — Economia de 60%", visitas: 18420, leads_gerados: 1284, conversao_pct: 6.97, ultima_publicacao: days(12), status: "publicada", template: "passaporte_anual", blocos: [
    { id: "b1", tipo: "hero", titulo: "Diversão o ano todo pra família", conteudo: "Passaporte anual por 12x R$ 111 — equivalente a R$ 9,25/visita." },
    { id: "b2", tipo: "beneficios", titulo: "O que está incluso", conteudo: "Acesso ilimitado + estacionamento + desconto em lanchonetes" },
    { id: "b3", tipo: "depoimentos", titulo: "Famílias felizes", conteudo: "3 depoimentos em vídeo" },
    { id: "b4", tipo: "formulario", titulo: "Garanta o seu", conteudo: "Nome, email, WhatsApp" },
    { id: "b5", tipo: "cta", titulo: "Falar com consultor agora", conteudo: "Botão WhatsApp" },
  ]},
  { id: "lp2", slug: "diaria-verao", titulo: "Diária de Verão — Ingresso Antecipado", visitas: 42180, leads_gerados: 2108, conversao_pct: 5.00, ultima_publicacao: days(28), status: "publicada", template: "passaporte_diario", blocos: [
    { id: "b1", tipo: "hero", titulo: "Verão no Aquapark Valparaíso", conteudo: "Ingressos antecipados com 20% off — válido por 90 dias." },
    { id: "b2", tipo: "precos", titulo: "Valores", conteudo: "Adulto R$ 89 | Criança R$ 45" },
    { id: "b3", tipo: "formulario", titulo: "Comprar agora", conteudo: "Checkout em 1 clique" },
  ]},
  { id: "lp3", slug: "corporativo-empresas", titulo: "Experiências Corporativas", visitas: 4820, leads_gerados: 218, conversao_pct: 4.52, ultima_publicacao: days(45), status: "publicada", template: "evento_corporativo", blocos: [
    { id: "b1", tipo: "hero", titulo: "Transforme a confraternização da sua empresa", conteudo: "Pacotes a partir de 30 pax com atendimento dedicado." },
    { id: "b2", tipo: "beneficios", titulo: "Benefícios corporativos", conteudo: "Estacionamento exclusivo, área VIP, buffet" },
    { id: "b3", tipo: "formulario", titulo: "Solicitar proposta", conteudo: "Cotação em até 24h" },
  ]},
  { id: "lp4", slug: "aventura-radical-tirolesa", titulo: "Aventura Radical — Tirolesa & Arvorismo", visitas: 1240, leads_gerados: 42, conversao_pct: 3.39, status: "rascunho", template: "aventura_radical", blocos: [
    { id: "b1", tipo: "hero", titulo: "Do chão aos 25m de queda livre", conteudo: "Tirolesa 400m, arvorismo em 3 níveis, rapel e escalada." },
    { id: "b2", tipo: "precos", titulo: "Ingressos aventura", conteudo: "A partir de R$ 89" },
  ]},
];

export const emailCampanhas: EmailCampanha[] = [
  { id: "ec1", nome: "Renovação T-30 — abril", assunto: "Beatriz, seu passaporte anual vence em 30 dias", preview: "Renove agora com 15% de desconto exclusivo.", segmento_id: "sg1", enviados: 482, entregues: 478, abertos: 312, clicados: 128, descadastros: 2, bounces: 4, status: "enviada", enviada_em: days(6), template: "renovacao" },
  { id: "ec2", nome: "Black Friday 2026", assunto: "Black Friday começou: 40% off no passaporte anual", preview: "Só hoje, até meia-noite.", enviados: 12480, entregues: 12320, abertos: 5820, clicados: 1240, descadastros: 28, bounces: 160, status: "enviada", enviada_em: days(45), template: "promo" },
  { id: "ec3", nome: "Reengajamento inativos 90d", assunto: "Está com saudade da gente?", preview: "Oferta especial pra você voltar.", segmento_id: "sg2", enviados: 2140, entregues: 2108, abertos: 620, clicados: 108, descadastros: 12, bounces: 32, status: "enviada", enviada_em: days(18), template: "reengajamento" },
  { id: "ec4", nome: "Newsletter aquática — maio", assunto: "Novidades do mês + dicas de verão", preview: "Descubra a nova área kids.", enviados: 0, entregues: 0, abertos: 0, clicados: 0, descadastros: 0, bounces: 0, status: "agendada", enviada_em: days(-3), template: "newsletter" },
  { id: "ec5", nome: "Lançamento Corporativo 2026", assunto: "Confraternização de fim de ano chegou", preview: "Garanta sua data antes que esgote.", enviados: 0, entregues: 0, abertos: 0, clicados: 0, descadastros: 0, bounces: 0, status: "rascunho", template: "corporativo" },
  { id: "ec6", nome: "Aniversariantes de abril", assunto: "Presente de aniversário do Aquapark pra você", preview: "Entrada gratuita no seu mês.", enviados: 148, entregues: 146, abertos: 92, clicados: 48, descadastros: 0, bounces: 2, status: "enviada", enviada_em: days(2), template: "aniversario" },
];

export const abTestes: ABTeste[] = [
  { id: "ab1", nome: "CTA botão: 'Comprar agora' vs 'Garanta sua vaga'", hipotese: "Urgência aumenta conversão em mobile.", tipo: "copy", status: "finalizado", variacoes: [
    { nome: "A — Comprar agora", impressoes: 12480, conversoes: 482, taxa: 3.86, uplift_pct: 0 },
    { nome: "B — Garanta sua vaga", impressoes: 12410, conversoes: 612, taxa: 4.93, uplift_pct: 27.7 },
  ], confianca_pct: 98.4, vencedora: "B — Garanta sua vaga", iniciado_em: days(30), finalizado_em: days(8) },
  { id: "ab2", nome: "Criativo reel: tobogã vs piscina ondas", hipotese: "Tobogã gigante gera mais engajamento na faixa 25-34.", tipo: "criativo", status: "rodando", variacoes: [
    { nome: "A — Tobogã", impressoes: 84200, conversoes: 1240, taxa: 1.47, uplift_pct: 0 },
    { nome: "B — Piscina ondas", impressoes: 82100, conversoes: 1480, taxa: 1.80, uplift_pct: 22.4 },
  ], confianca_pct: 87.2, iniciado_em: days(14) },
  { id: "ab3", nome: "Cadência 5 toques vs 8 toques", hipotese: "Cadência longa demais fadiga o lead.", tipo: "cadencia", status: "finalizado", variacoes: [
    { nome: "A — 5 toques", impressoes: 680, conversoes: 112, taxa: 16.47, uplift_pct: 0 },
    { nome: "B — 8 toques", impressoes: 672, conversoes: 88, taxa: 13.09, uplift_pct: -20.5 },
  ], confianca_pct: 94.1, vencedora: "A — 5 toques", iniciado_em: days(45), finalizado_em: days(12) },
  { id: "ab4", nome: "LP Anual Família — hero com vídeo vs foto", hipotese: "Vídeo de família real convence mais que foto.", tipo: "lp", status: "rodando", variacoes: [
    { nome: "A — Foto estúdio", impressoes: 4820, conversoes: 218, taxa: 4.52, uplift_pct: 0 },
    { nome: "B — Vídeo família", impressoes: 4780, conversoes: 312, taxa: 6.53, uplift_pct: 44.4 },
  ], confianca_pct: 96.8, iniciado_em: days(10) },
  { id: "ab5", nome: "Preço diária R$ 89 vs R$ 99", hipotese: "Elasticidade: R$ 99 mantém conversão e aumenta receita.", tipo: "preco", status: "rascunho", variacoes: [
    { nome: "A — R$ 89", impressoes: 0, conversoes: 0, taxa: 0, uplift_pct: 0 },
    { nome: "B — R$ 99", impressoes: 0, conversoes: 0, taxa: 0, uplift_pct: 0 },
  ], confianca_pct: 0, iniciado_em: days(0) },
];

/* ─────────────────────────── COMUNICAÇÃO INTERNA (Aqua Chat) ─────────────────────────── */

export const canaisInternos: CanalInterno[] = [
  // Operacionais
  { id: "ch_geral", nome: "geral", proposito: "Comunicação geral do Parque Valparaíso", tipo: "operacional", privado: false, membros: ["c1","c2","c3","c4","c5","sup1","sup2","gestor1","sac1","sac2","bilh1","bilh2","manut1","seg1"], nao_lidas: 3, criado_em: days(240) },
  { id: "ch_operacoes", nome: "operacoes", proposito: "Coordenação do dia — supervisores e área", tipo: "operacional", privado: false, membros: ["sup1","sup2","gestor1","manut1","seg1","bilh1"], nao_lidas: 12, criado_em: days(240) },
  { id: "ch_bilheteria", nome: "bilheteria", proposito: "Equipe de venda presencial", tipo: "operacional", privado: false, membros: ["bilh1","bilh2","sup1"], nao_lidas: 0, criado_em: days(240) },
  { id: "ch_atendimento", nome: "atendimento", proposito: "SAC, resolução de casos e reembolsos", tipo: "operacional", privado: false, membros: ["sac1","sac2","sup2","gestor1"], nao_lidas: 5, criado_em: days(240) },
  { id: "ch_seguranca", nome: "seguranca", proposito: "Controle de acesso, tentativas suspeitas, patrimônio", tipo: "operacional", privado: false, membros: ["seg1","sup1","sup2"], nao_lidas: 2, criado_em: days(240) },
  { id: "ch_manutencao", nome: "manutencao", proposito: "Manutenção preventiva e corretiva das atrações", tipo: "operacional", privado: false, membros: ["manut1","sup1","gestor1"], nao_lidas: 0, criado_em: days(240) },
  { id: "ch_incidentes", nome: "incidentes", proposito: "Log de todos incidentes — alimentado por IncidenteBot", tipo: "incidente", privado: false, membros: ["sup1","sup2","gestor1","seg1","manut1"], nao_lidas: 1, criado_em: days(240) },
  // Gestão
  { id: "ch_vendas", nome: "vendas", proposito: "Métricas em tempo real, metas, VendasBot", tipo: "gestao", privado: false, membros: ["c1","c2","c3","c4","c5","gestor1","sup2"], nao_lidas: 0, criado_em: days(240) },
  { id: "ch_financeiro", nome: "financeiro", proposito: "Alertas de transação, aprovações, reconciliação", tipo: "gestao", privado: true, membros: ["gestor1","sup2"], nao_lidas: 1, criado_em: days(240) },
  { id: "ch_marketing", nome: "marketing", proposito: "Campanhas Meta Ads, performance, criativos", tipo: "gestao", privado: false, membros: ["gestor1","c1"], nao_lidas: 0, criado_em: days(240) },
  { id: "ch_ti", nome: "ti", proposito: "Alertas de sistema, integrações, catracas, gateway", tipo: "gestao", privado: false, membros: ["gestor1","sup1"], nao_lidas: 0, criado_em: days(240) },
  { id: "ch_diretoria", nome: "diretoria", proposito: "Resumos executivos diários (DiretoriaBot)", tipo: "gestao", privado: true, membros: ["gestor1"], nao_lidas: 0, criado_em: days(240) },
  // Temporários
  { id: "ch_inc_0042", nome: "incidente-20260419-0042", proposito: "Coordenação do incidente crítico no Toboágua Radical", tipo: "incidente", privado: false, membros: ["sup1","gestor1","seg1","manut1"], nao_lidas: 4, criado_em: hours(5) },
  { id: "ch_evento_bradesco", nome: "evento-bradesco-confraternizacao", proposito: "Evento privado 26/04 — 480 pessoas, Bradesco Prime", tipo: "projeto", privado: false, membros: ["c3","gestor1","bilh1","sup1"], nao_lidas: 0, criado_em: days(4) },
  { id: "ch_grupo_dompedroII_0425", nome: "grupo-dompedroII-2026-04-25", proposito: "Escola Dom Pedro II — 320 alunos, turno manhã", tipo: "projeto", privado: false, membros: ["c2","sup1","bilh1"], nao_lidas: 0, criado_em: days(6) },
];

export const dmsInternas: DMInterna[] = [
  { id: "dm_diego_amanda", participantes: ["gestor1","c1"], ultima_mensagem: "Fechou, subo o plano amanhã cedo.", ultimo_ts: mins(22), nao_lidas: 0 },
  { id: "dm_diego_sup1", participantes: ["gestor1","sup1"], ultima_mensagem: "Pode liberar a manutenção do Escorregão Kids.", ultimo_ts: mins(45), nao_lidas: 1 },
  { id: "dm_amanda_bia", participantes: ["c1","c2"], ultima_mensagem: "Manda o contato da escola quando puder?", ultimo_ts: hours(2), nao_lidas: 0 },
  { id: "dm_sup2_sac1", participantes: ["sup2","sac1"], ultima_mensagem: "Aprovei o reembolso da Maria Santos.", ultimo_ts: hours(4), nao_lidas: 0 },
];

export const botsInternos: BotInterno[] = [
  { id: "bot_vendas", nome: "VendasBot", descricao: "Atualização horária de ingressos, receita e capacidade no canal #vendas", cor: "emerald", canal_default: "ch_vendas", ultima_execucao: mins(12), ativo: true },
  { id: "bot_capacidade", nome: "CapacidadeBot", descricao: "Alerta quando uma data ultrapassa 70% / 90% de ocupação", cor: "amber", canal_default: "ch_operacoes", ultima_execucao: mins(34), ativo: true },
  { id: "bot_incidente", nome: "IncidenteBot", descricao: "Cria thread dedicada em #incidentes e menciona @canal em severidade crítica", cor: "rose", canal_default: "ch_incidentes", ultima_execucao: hours(5), ativo: true },
  { id: "bot_reembolso", nome: "ReembolsoBot", descricao: "Encaminha aprovações de reembolso para supervisor/gerente conforme valor", cor: "violet", canal_default: "ch_atendimento", ultima_execucao: mins(52), ativo: true },
  { id: "bot_diretoria", nome: "DiretoriaBot", descricao: "Resumo executivo diário às 18h no #diretoria", cor: "sky", canal_default: "ch_diretoria", ultima_execucao: hours(14), ativo: true },
  { id: "bot_consulta", nome: "ConsultaBot", descricao: "Slash commands /passaporte, /ingresso, /capacidade, /incidente", cor: "brand", canal_default: "ch_geral", ultima_execucao: mins(6), ativo: true },
];

export const slashCommandsInternos: SlashCommandInterno[] = [
  { comando: "/passaporte", descricao: "Consulta um passaporte pelo número", exemplo: "/passaporte PASS-0842", categoria: "consulta" },
  { comando: "/ingresso", descricao: "Consulta um ingresso avulso pelo código", exemplo: "/ingresso ING-004521", categoria: "consulta" },
  { comando: "/lead", descricao: "Abre o card do lead no chat", exemplo: "/lead L-0217", categoria: "consulta" },
  { comando: "/capacidade", descricao: "Mostra ocupação de uma data", exemplo: "/capacidade 25/04", categoria: "consulta" },
  { comando: "/incidente", descricao: "Abre formulário para registrar novo incidente", exemplo: "/incidente novo", categoria: "operacao" },
  { comando: "/cortesia", descricao: "Solicita emissão de ingresso cortesia (exige aprovação)", exemplo: "/cortesia", categoria: "aprovacao" },
  { comando: "/bloquear-data", descricao: "Bloqueia venda para uma data específica", exemplo: "/bloquear-data 26/04 motivo=manutencao", categoria: "operacao" },
  { comando: "/convocar", descricao: "Menciona @canal e fixa mensagem no topo", exemplo: "/convocar equipe bilheteria", categoria: "atalho" },
  { comando: "/remind", descricao: "Cria lembrete para você ou alguém", exemplo: "/remind @bia em 30min conferir catraca 3", categoria: "atalho" },
  { comando: "/status", descricao: "Define seu status (ocupado, pausa, em atração)", exemplo: "/status em reunião até 15h", categoria: "atalho" },
  { comando: "/huddle", descricao: "Inicia chamada de voz rápida no canal", exemplo: "/huddle", categoria: "atalho" },
];

// Helper para IDs de usuários não-corretor (supervisores, gestor, SAC, bilheteria, etc.)
export const usuariosInternos: { id: string; nome: string; cargo: string; papel: string; status: "ativo" | "ausente" | "ocupado" | "offline" }[] = [
  { id: "c1", nome: "Amanda Rocha", cargo: "Corretor Platina", papel: "corretor", status: "ativo" },
  { id: "c2", nome: "Bia Nogueira", cargo: "Corretor Ouro", papel: "corretor", status: "ativo" },
  { id: "c3", nome: "Carlos Menezes", cargo: "Corretor B2B", papel: "corretor", status: "ocupado" },
  { id: "c4", nome: "Diana Souza", cargo: "Corretor Prata", papel: "corretor", status: "ausente" },
  { id: "c5", nome: "Eduardo Lima", cargo: "SDR", papel: "corretor", status: "offline" },
  { id: "sup1", nome: "Rafael Torres", cargo: "Supervisor Operacional", papel: "supervisor", status: "ativo" },
  { id: "sup2", nome: "Juliana Prado", cargo: "Supervisora de Atendimento", papel: "supervisor", status: "ativo" },
  { id: "gestor1", nome: "Diego Alves", cargo: "Gestor Comercial", papel: "gestor", status: "ocupado" },
  { id: "sac1", nome: "Paula Ribeiro", cargo: "Atendente SAC", papel: "sac", status: "ativo" },
  { id: "sac2", nome: "Rodrigo Sá", cargo: "Atendente SAC", papel: "sac", status: "ativo" },
  { id: "bilh1", nome: "Camila Vieira", cargo: "Operadora Bilheteria", papel: "corretor", status: "ativo" },
  { id: "bilh2", nome: "Tiago Mendes", cargo: "Operador Bilheteria", papel: "corretor", status: "ausente" },
  { id: "manut1", nome: "Hugo Ferraz", cargo: "Técnico Manutenção", papel: "supervisor", status: "ativo" },
  { id: "seg1", nome: "Márcio Duarte", cargo: "Chefe de Segurança", papel: "supervisor", status: "ativo" },
];

export const usuarioInternoById = (id: string) =>
  usuariosInternos.find((u) => u.id === id);
export const botById = (id: string) => botsInternos.find((b) => b.id === id);

export const mensagensInternas: MensagemInterna[] = [
  // ─── #vendas — VendasBot posta métricas ───
  { id: "m_v1", canal_id: "ch_vendas", autor_tipo: "bot", autor_id: "bot_vendas", conteudo: "**ATUALIZAÇÃO 14h00**\nIngressos vendidos hoje: **847 / 1.200** (70.6% da meta)\n• Online: 412  • Bilheteria: 287  • Revendedores: 148\nReceita: **R$ 42.350**\nPassaportes emitidos hoje: 12\nCapacidade atual: 71% ocupada", timestamp: mins(12), reacoes: [{ emoji: "🔥", usuarios: ["gestor1","c1","c2"] }, { emoji: "🎉", usuarios: ["sup2"] }] },
  { id: "m_v2", canal_id: "ch_vendas", autor_tipo: "user", autor_id: "c1", conteudo: "Bora passar de 1.200 hoje 💪 só restam 353 ingressos e a casa tá cheia.", timestamp: mins(10), reacoes: [{ emoji: "💪", usuarios: ["c2","c3","gestor1"] }] },
  { id: "m_v3", canal_id: "ch_vendas", autor_tipo: "user", autor_id: "gestor1", conteudo: "Time, @canal fechei agora com a escola Dom Pedro II — +320 ingressos para 25/04. Subam no sistema.", timestamp: mins(8), mencao_canal: true, unfurls: [{ tipo: "lead", ref: "L-0217", titulo: "Escola Dom Pedro II — 320 alunos", subtitulo: "Pacote Grupo Escolar • Visita em 25/04", badges: [{ label: "Fechado Ganho", tone: "emerald" }, { label: "R$ 19.200", tone: "sky" }], cta: "Ver oportunidade" }] },
  { id: "m_v4", canal_id: "ch_vendas", autor_tipo: "bot", autor_id: "bot_vendas", conteudo: "**ATUALIZAÇÃO 15h00**\nIngressos vendidos hoje: **982 / 1.200** (81.8%)\nReceita: **R$ 48.910**  •  Capacidade: 82%", timestamp: mins(4), reacoes: [{ emoji: "🚀", usuarios: ["gestor1","c2"] }] },

  // ─── #operacoes — manhã + capacidade ───
  { id: "m_o1", canal_id: "ch_operacoes", autor_tipo: "user", autor_id: "sup1", conteudo: "Bom dia pessoal ☀️ todas as atrações checadas e operando normalmente. Segue o dia.", timestamp: hours(8), reacoes: [{ emoji: "👍", usuarios: ["gestor1","manut1","seg1"] }] },
  { id: "m_o2", canal_id: "ch_operacoes", autor_tipo: "user", autor_id: "manut1", conteudo: "Escorregão Kids em manutenção programada das 10h às 12h. Avisei a bilheteria.", timestamp: hours(7) },
  { id: "m_o3", canal_id: "ch_operacoes", autor_tipo: "bot", autor_id: "bot_capacidade", conteudo: "⚠️ **Atenção** @canal\nCapacidade para **26/04** atingiu **90%**.\nRestam apenas **120 ingressos** disponíveis.\nRecomendo considerar bloqueio de novos lotes para essa data.", timestamp: mins(34), prioridade: "alerta", mencao_canal: true, acoes_inline: [{ id: "bloquear", label: "Bloquear data", tone: "danger" }, { id: "dash", label: "Ver dashboard", tone: "outline" }, { id: "ignorar", label: "Ignorar", tone: "outline" }], unfurls: [{ tipo: "capacidade", ref: "2026-04-26", titulo: "26/04/2026 — Sábado", subtitulo: "1.080/1.200 ingressos • 120 disponíveis • 90% ocupado", badges: [{ label: "Crítico", tone: "amber" }], cta: "Abrir calendário" }] },
  { id: "m_o4", canal_id: "ch_operacoes", autor_tipo: "user", autor_id: "gestor1", conteudo: "Bloqueia sim @Rafael Torres, já vendemos demais para esse sábado.", timestamp: mins(31), mencoes: ["sup1"], thread_respostas: 3, thread_ultima_resposta: mins(28) },
  { id: "m_o5", canal_id: "ch_operacoes", autor_tipo: "user", autor_id: "sup1", conteudo: "Fechou. Bloqueei 26/04 para venda online. Bilheteria segue com 50 lugares reservados.", timestamp: mins(28), reacoes: [{ emoji: "✅", usuarios: ["gestor1","sup2","manut1"] }] },

  // ─── #incidentes — incidente crítico ───
  { id: "m_i1", canal_id: "ch_incidentes", autor_tipo: "bot", autor_id: "bot_incidente", conteudo: "🚨 **INCIDENTE CRÍTICO — INC-0042**\n\nAtração: **Toboágua Radical**\nTipo: Intercorrência Médica\nReportado por: Rafael Torres (Supervisor)\nHora: 14:32\n\n**Ação imediata necessária.** Thread criada: #incidente-20260419-0042", timestamp: hours(5), prioridade: "critico", mencao_canal: true, acoes_inline: [{ id: "sf", label: "Ver no Salesforce", tone: "primary" }, { id: "resolver", label: "Marcar como resolvido", tone: "outline" }], unfurls: [{ tipo: "incidente", ref: "INC-0042", titulo: "INC-0042 — Toboágua Radical", subtitulo: "Intercorrência Médica • Severidade Crítica • Aberto", badges: [{ label: "Crítico", tone: "rose" }, { label: "Aberto", tone: "amber" }], cta: "Abrir no sistema" }], thread_respostas: 7, thread_ultima_resposta: hours(1) },
  { id: "m_i2", canal_id: "ch_incidentes", autor_tipo: "bot", autor_id: "bot_incidente", conteudo: "✅ **INC-0041 resolvido** — Escorregão Kids voltou a operar às 12h07. Sem registros de feridos. Manutenção preventiva concluída.", timestamp: hours(4), reacoes: [{ emoji: "🙏", usuarios: ["gestor1","sup1"] }] },

  // ─── #incidente-20260419-0042 — thread do incidente crítico ───
  { id: "m_tc1", canal_id: "ch_inc_0042", autor_tipo: "user", autor_id: "sup1", conteudo: "Visitante de 58 anos teve mal-estar na saída do toboágua. Equipe médica já no local.", timestamp: hours(5) },
  { id: "m_tc2", canal_id: "ch_inc_0042", autor_tipo: "user", autor_id: "seg1", conteudo: "Área isolada, mantendo fila parada. Sem pânico.", timestamp: hours(5) },
  { id: "m_tc3", canal_id: "ch_inc_0042", autor_tipo: "user", autor_id: "sup1", conteudo: "Visitante estável, SAMU orientou remoção preventiva. Vamos reabrir em 20min.", timestamp: hours(4), reacoes: [{ emoji: "🙏", usuarios: ["gestor1","seg1","manut1"] }] },
  { id: "m_tc4", canal_id: "ch_inc_0042", autor_tipo: "user", autor_id: "gestor1", conteudo: "@Márcio Duarte por favor acompanha o visitante até a ambulância e toma os dados de contato para follow-up nosso.", timestamp: hours(4), mencoes: ["seg1"] },
  { id: "m_tc5", canal_id: "ch_inc_0042", autor_tipo: "user", autor_id: "seg1", conteudo: "Acompanhando. Família agradeceu o atendimento.", timestamp: hours(3) },
  { id: "m_tc6", canal_id: "ch_inc_0042", autor_tipo: "user", autor_id: "sup1", conteudo: "Toboágua Radical reaberto. Relatório completo subido no Salesforce.", timestamp: hours(1), reacoes: [{ emoji: "✅", usuarios: ["gestor1","seg1","manut1","sup2"] }] },

  // ─── #atendimento — SAC + ReembolsoBot ───
  { id: "m_a1", canal_id: "ch_atendimento", autor_tipo: "user", autor_id: "sac1", conteudo: "Cliente Maria Santos ligou pedindo reembolso dos 2 ingressos de 19/04 — cancelou por conta da chuva forte.", timestamp: hours(4), unfurls: [{ tipo: "ticket", ref: "TKT-00847", titulo: "TKT-00847 — Reembolso por chuva", subtitulo: "Maria Santos • 2x Inteira • R$ 180,00", badges: [{ label: "Em análise", tone: "amber" }], cta: "Abrir ticket" }] },
  { id: "m_a2", canal_id: "ch_atendimento", autor_tipo: "bot", autor_id: "bot_reembolso", conteudo: "💰 **Aprovação necessária — TKT-00847**\n\nCliente: **Maria Santos**\nMotivo: Cancelamento por chuva forte\nValor solicitado: **R$ 180,00**\nIngressos: 2x Inteira (19/04)\nHistórico: Cliente desde 2024 • 3 visitas • NPS 9", timestamp: hours(4), prioridade: "alerta", acoes_inline: [{ id: "aprovar", label: "Aprovar", tone: "primary" }, { id: "rejeitar", label: "Rejeitar", tone: "danger" }, { id: "info", label: "Solicitar info", tone: "outline" }] },
  { id: "m_a3", canal_id: "ch_atendimento", autor_tipo: "user", autor_id: "sup2", conteudo: "Aprovado. Faz parte do nosso compromisso em dia de chuva extrema. ✅", timestamp: hours(4), reacoes: [{ emoji: "👏", usuarios: ["sac1","gestor1","sac2"] }] },
  { id: "m_a4", canal_id: "ch_atendimento", autor_tipo: "bot", autor_id: "bot_reembolso", conteudo: "✅ Reembolso **TKT-00847** aprovado por Juliana Prado. Estorno disparado no gateway. Cliente notificada por WhatsApp e e-mail.", timestamp: hours(4), reacoes: [{ emoji: "🎉", usuarios: ["sac1"] }] },
  { id: "m_a5", canal_id: "ch_atendimento", autor_tipo: "user", autor_id: "sac2", conteudo: "Galera, acabei de resolver um caso com passaporte perdido. Emitida 2ª via sem custo. Cliente:", timestamp: mins(52), unfurls: [{ tipo: "passaporte", ref: "PASS-0842", titulo: "PASS-0842 — João Silva", subtitulo: "Família • Ativo até 31/12/2026 • 8 visitas", badges: [{ label: "Ativo", tone: "emerald" }], cta: "Ver passaporte" }], reacoes: [{ emoji: "⭐", usuarios: ["sac1","sup2"] }] },

  // ─── #geral ───
  { id: "m_g1", canal_id: "ch_geral", autor_tipo: "user", autor_id: "gestor1", conteudo: "Equipe, o parque completou **500 mil visitantes** no ano! 🎉 Parabéns a todos.", timestamp: hours(26), reacoes: [{ emoji: "🎉", usuarios: ["c1","c2","c3","sup1","sup2","sac1","bilh1","manut1"] }, { emoji: "🏆", usuarios: ["c1","gestor1"] }, { emoji: "🌊", usuarios: ["c2","bilh1"] }], fixada: true },
  { id: "m_g2", canal_id: "ch_geral", autor_tipo: "user", autor_id: "c1", conteudo: "Isso! Rumo ao 1 milhão 🚀", timestamp: hours(25) },
  { id: "m_g3", canal_id: "ch_geral", autor_tipo: "user", autor_id: "bilh1", conteudo: "Lembrete: uniforme novo disponível no RH a partir de amanhã.", timestamp: hours(3) },
  { id: "m_g4", canal_id: "ch_geral", autor_tipo: "user", autor_id: "sup2", conteudo: "Pessoal, passem no #atendimento — temos uma nota sobre política de reembolso em dias de chuva.", timestamp: mins(40), mencoes: [] },
  { id: "m_g5", canal_id: "ch_geral", autor_tipo: "system", autor_id: "system", conteudo: "Hugo Ferraz entrou no canal.", timestamp: mins(5) },

  // ─── #diretoria — DiretoriaBot resumo ───
  { id: "m_d1", canal_id: "ch_diretoria", autor_tipo: "bot", autor_id: "bot_diretoria", conteudo: "📊 **RESUMO DO DIA — 18/04/2026**\n\n**VISITANTES**\nTotal: **1.243** (meta 1.200) ✅\nPassaportes utilizados: 387  •  Ingressos avulsos: 856\n\n**RECEITA**\nTotal: **R$ 58.420**  •  vs. ontem +12% ✅  •  vs. mesmo dia semana passada +8% ✅\n\n**OPERAÇÕES**\nIncidentes: 2 (0 críticos) ✅\nAtrações fora de operação: 1 (Escorregão Kids — manutenção programada)\nCases SAC abertos: 4 (1 urgente)\n\n**PASSAPORTES**\nEmitidos hoje: 14  •  Renovados: 7  •  Vencendo em 7 dias: 23", timestamp: hours(14), reacoes: [{ emoji: "📈", usuarios: ["gestor1"] }] },

  // ─── #bilheteria ───
  { id: "m_b1", canal_id: "ch_bilheteria", autor_tipo: "user", autor_id: "bilh1", conteudo: "Fila do guichê 2 tá grande, alguém consegue dar suporte?", timestamp: mins(18) },
  { id: "m_b2", canal_id: "ch_bilheteria", autor_tipo: "user", autor_id: "bilh2", conteudo: "Vou pra aí, me dá 3 minutos.", timestamp: mins(16), reacoes: [{ emoji: "🙏", usuarios: ["bilh1"] }] },

  // ─── #seguranca ───
  { id: "m_s1", canal_id: "ch_seguranca", autor_tipo: "bot", autor_id: "bot_consulta", conteudo: "🔒 **Tentativa suspeita detectada**\nQR code `QR-ZC8K2` negado 3x nas últimas 10min (catraca #3).\nIngresso: ING-004128 — já utilizado em 15/04.", timestamp: hours(2), prioridade: "alerta", unfurls: [{ tipo: "ingresso", ref: "ING-004128", titulo: "ING-004128 — Inteira", subtitulo: "Utilizado em 15/04/2026 14h32 • Valor R$ 85,00", badges: [{ label: "Utilizado", tone: "slate" }], cta: "Ver histórico" }] },
  { id: "m_s2", canal_id: "ch_seguranca", autor_tipo: "user", autor_id: "seg1", conteudo: "Já mandei equipe até a catraca 3. Abordagem cordial.", timestamp: hours(2), reacoes: [{ emoji: "👮", usuarios: ["sup1"] }] },

  // ─── #financeiro ───
  { id: "m_f1", canal_id: "ch_financeiro", autor_tipo: "bot", autor_id: "bot_reembolso", conteudo: "💸 **Conciliação do dia**\nReceita bruta: **R$ 48.910**\nReembolsos aprovados: 2 (**R$ 360**)\nChargebacks pendentes: 1 (R$ 170)\nReceita líquida: **R$ 48.380**", timestamp: hours(1) },

  // ─── #evento-bradesco ───
  { id: "m_eb1", canal_id: "ch_evento_bradesco", autor_tipo: "user", autor_id: "c3", conteudo: "Pessoal, confirmado: Bradesco Prime traz **480 pessoas** dia 26/04, turno tarde (13h-18h). Assinatura de contrato amanhã.", timestamp: days(4), fixada: true, unfurls: [{ tipo: "lead", ref: "L-0312", titulo: "Bradesco Prime — Confraternização", subtitulo: "480 pessoas • 26/04 • R$ 34.800", badges: [{ label: "Em negociação", tone: "sky" }], cta: "Abrir proposta" }] },
  { id: "m_eb2", canal_id: "ch_evento_bradesco", autor_tipo: "user", autor_id: "gestor1", conteudo: "Show @Carlos Menezes! Alinha com @Rafael Torres os detalhes da operação.", timestamp: days(4), mencoes: ["c3","sup1"] },
  { id: "m_eb3", canal_id: "ch_evento_bradesco", autor_tipo: "user", autor_id: "sup1", conteudo: "Combinado. Reservamos toda a área da praia artificial e 2 toboáguas exclusivos. Briefing operacional subido no Drive.", timestamp: days(3) },
  { id: "m_eb4", canal_id: "ch_evento_bradesco", autor_tipo: "user", autor_id: "bilh1", conteudo: "QR codes em lote gerados (LOTE-0034). Vou imprimir no dia.", timestamp: days(2), reacoes: [{ emoji: "✅", usuarios: ["c3","sup1","gestor1"] }] },

  // ─── DMs ───
  { id: "m_dm1", canal_id: "dm_diego_amanda", autor_tipo: "user", autor_id: "gestor1", conteudo: "Amanda, consegue me passar o plano para a meta de passaportes em maio?", timestamp: mins(30) },
  { id: "m_dm2", canal_id: "dm_diego_amanda", autor_tipo: "user", autor_id: "c1", conteudo: "Claro! Estou fechando a projeção com base nos leads quentes. Saio em 10min e te mando antes do fim do dia.", timestamp: mins(28) },
  { id: "m_dm3", canal_id: "dm_diego_amanda", autor_tipo: "user", autor_id: "gestor1", conteudo: "Perfeito. Quero subir amanhã cedo na reunião de diretoria.", timestamp: mins(25) },
  { id: "m_dm4", canal_id: "dm_diego_amanda", autor_tipo: "user", autor_id: "c1", conteudo: "Fechou, subo o plano amanhã cedo.", timestamp: mins(22) },

  { id: "m_dm5", canal_id: "dm_diego_sup1", autor_tipo: "user", autor_id: "sup1", conteudo: "Diego, o Escorregão Kids tá com ruído na bomba. Quero parar 2h amanhã cedo pra trocar.", timestamp: hours(1) },
  { id: "m_dm6", canal_id: "dm_diego_sup1", autor_tipo: "user", autor_id: "gestor1", conteudo: "Pode liberar a manutenção do Escorregão Kids.", timestamp: mins(45) },

  { id: "m_dm7", canal_id: "dm_amanda_bia", autor_tipo: "user", autor_id: "c2", conteudo: "Amanda, a escola Dom Pedro II quer saber se dá desconto pra 320 alunos.", timestamp: hours(3) },
  { id: "m_dm8", canal_id: "dm_amanda_bia", autor_tipo: "user", autor_id: "c1", conteudo: "Dá sim até 12% nesse volume. Manda o contato da escola quando puder?", timestamp: hours(2) },
];

export const mensagensPorCanal = (canalId: string) =>
  mensagensInternas
    .filter((m) => m.canal_id === canalId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

export const unidades: Unidade[] = [
  { id: "u1", nome: "Valparaíso São Luís (matriz)", cidade: "São Luís", estado: "MA", status: "ativa", usuarios: 42, leads_mes: 1820, receita_mes: 482000, meta_mes: 520000, nps: 72, abertura_em: days(1820), gerente: "Diego (Gestor)" },
  { id: "u2", nome: "Valparaíso Imperatriz", cidade: "Imperatriz", estado: "MA", status: "ativa", usuarios: 18, leads_mes: 620, receita_mes: 182000, meta_mes: 210000, nps: 68, abertura_em: days(420), gerente: "Ricardo Melo" },
  { id: "u3", nome: "Valparaíso Teresina", cidade: "Teresina", estado: "PI", status: "ativa", usuarios: 22, leads_mes: 812, receita_mes: 240000, meta_mes: 260000, nps: 74, abertura_em: days(280), gerente: "Sandra Lopes" },
  { id: "u4", nome: "Valparaíso Belém", cidade: "Belém", estado: "PA", status: "implantacao", usuarios: 8, leads_mes: 120, receita_mes: 28000, meta_mes: 80000, nps: 0, abertura_em: days(-60), gerente: "Paulo Henrique" },
  { id: "u5", nome: "Valparaíso Parnaíba", cidade: "Parnaíba", estado: "PI", status: "inativa", usuarios: 0, leads_mes: 0, receita_mes: 0, meta_mes: 0, nps: 0, abertura_em: days(720), gerente: "—" },
];

/* ──────────────────── OPERAÇÕES — ATRAÇÕES / OS / ROTINAS / PROJETOS / REUNIÕES ──────────────────── */

const hojeISO = new Date().toISOString().slice(0, 10);
const addFut = (n: number) => future(n);

export const atracoes: Atracao[] = [
  { id: "atr_radical", nome: "Toboágua Radical", codigo: "ATR-001", categoria: "toboagua", status: "operacional", capacidade_hora: 280, ultima_manutencao: days(9), proxima_inspecao: future(18), responsavel_id: "manut1", setor: "Manutenção", observacoes: "Plataforma 12m, inclinação 60°. Requer 2 guarda-vidas." },
  { id: "atr_kamikaze", nome: "Toboágua Kamikaze", codigo: "ATR-002", categoria: "toboagua", status: "operacional", capacidade_hora: 240, ultima_manutencao: days(20), proxima_inspecao: future(10), responsavel_id: "manut1", setor: "Manutenção" },
  { id: "atr_rio_lento", nome: "Rio Lento", codigo: "ATR-003", categoria: "piscina", status: "operacional", capacidade_hora: 400, ultima_manutencao: days(4), proxima_inspecao: future(25), responsavel_id: "manut1", setor: "Manutenção" },
  { id: "atr_ondas", nome: "Piscina de Ondas", codigo: "ATR-004", categoria: "piscina", status: "manutencao", capacidade_hora: 600, ultima_manutencao: days(1), proxima_inspecao: future(28), responsavel_id: "manut1", setor: "Manutenção", observacoes: "Gerador de ondas em manutenção preventiva." },
  { id: "atr_escorregao", nome: "Escorregão Kids", codigo: "ATR-005", categoria: "kids", status: "fora_ar", capacidade_hora: 150, ultima_manutencao: hours(5), proxima_inspecao: future(3), responsavel_id: "manut1", setor: "Manutenção", observacoes: "Bomba de recirculação apresentou ruído — OS-0042 aberta." },
  { id: "atr_piscininha", nome: "Piscina Infantil", codigo: "ATR-006", categoria: "kids", status: "operacional", capacidade_hora: 120, ultima_manutencao: days(6), proxima_inspecao: future(20), responsavel_id: "manut1", setor: "Manutenção" },
  { id: "atr_praia", nome: "Praia Artificial", codigo: "ATR-007", categoria: "piscina", status: "operacional", capacidade_hora: 350, ultima_manutencao: days(12), proxima_inspecao: future(15), responsavel_id: "manut1", setor: "Manutenção" },
  { id: "atr_bar_central", nome: "Bar Central", codigo: "ATR-008", categoria: "bar", status: "operacional", capacidade_hora: 180, ultima_manutencao: days(15), proxima_inspecao: future(12), responsavel_id: "sup1", setor: "Operações" },
  { id: "atr_bar_molhado", nome: "Bar Molhado", codigo: "ATR-009", categoria: "bar", status: "operacional", capacidade_hora: 140, ultima_manutencao: days(8), proxima_inspecao: future(22), responsavel_id: "sup1", setor: "Operações" },
  { id: "atr_cat_norte", nome: "Catraca Norte", codigo: "CAT-001", categoria: "catraca", status: "operacional", capacidade_hora: 800, ultima_manutencao: days(3), proxima_inspecao: future(27), responsavel_id: "seg1", setor: "Segurança" },
  { id: "atr_cat_sul", nome: "Catraca Sul", codigo: "CAT-002", categoria: "catraca", status: "manutencao", capacidade_hora: 800, ultima_manutencao: hours(8), proxima_inspecao: future(29), responsavel_id: "seg1", setor: "Segurança", observacoes: "Leitor QR intermitente — aguardando peça." },
  { id: "atr_cat_vip", nome: "Catraca VIP", codigo: "CAT-003", categoria: "catraca", status: "operacional", capacidade_hora: 200, ultima_manutencao: days(7), proxima_inspecao: future(23), responsavel_id: "seg1", setor: "Segurança" },
  { id: "atr_vest_m", nome: "Vestiário Masculino", codigo: "EST-001", categoria: "estrutura", status: "operacional", ultima_manutencao: days(2), proxima_inspecao: future(30), responsavel_id: "sup1", setor: "Operações" },
  { id: "atr_vest_f", nome: "Vestiário Feminino", codigo: "EST-002", categoria: "estrutura", status: "operacional", ultima_manutencao: days(2), proxima_inspecao: future(30), responsavel_id: "sup1", setor: "Operações" },
  { id: "atr_filt_central", nome: "Central de Filtragem", codigo: "EQP-001", categoria: "equipamento", status: "operacional", ultima_manutencao: days(5), proxima_inspecao: future(2), responsavel_id: "manut1", setor: "Manutenção", observacoes: "Inspeção semanal — próxima em 2 dias." },
];

export const ordensServico: OrdemServico[] = [
  // Solicitado
  { id: "os_001", codigo: "OS-00042", titulo: "Trocar bomba do Escorregão Kids", descricao: "Bomba de recirculação apresentou ruído na manhã de hoje. Atração fora de operação até reparo. Incidente INC-0042 relacionado.", tipo: "corretiva", status: "solicitado", prioridade: "critica", atracao_id: "atr_escorregao", setor: "Manutenção", solicitante_id: "sup1", criado_em: hours(4), bloqueia_abertura: false, afeta_seguranca: false, incidente_ref: "INC-0042", horas_estimadas: 4, custo_estimado: 2800, tags: ["bomba", "urgente"], checklist: [ { id: "c1", texto: "Isolar área e sinalizar", feito: false, obrigatorio: true }, { id: "c2", texto: "Desligar hidráulica e elétrica", feito: false, obrigatorio: true }, { id: "c3", texto: "Substituir bomba modelo XYZ-400", feito: false }, { id: "c4", texto: "Testar por 15min antes de liberar", feito: false, obrigatorio: true }, { id: "c5", texto: "Registrar no histórico da atração", feito: false } ] },
  { id: "os_002", codigo: "OS-00041", titulo: "Comprar 200 boias infláveis novas", descricao: "Estoque abaixo do mínimo (12 unidades). Fornecedor usual AquaKid, prazo 7 dias.", tipo: "compra", status: "solicitado", prioridade: "normal", setor: "Operações", solicitante_id: "sup1", criado_em: hours(12), custo_estimado: 4200, fornecedor: "AquaKid Distribuidora", tags: ["estoque", "compra"] },
  { id: "os_003", codigo: "OS-00040", titulo: "Inspeção de extintores — área do Bar Central", tipo: "seguranca", status: "solicitado", prioridade: "alta", atracao_id: "atr_bar_central", setor: "Segurança", solicitante_id: "seg1", criado_em: days(1), horas_estimadas: 2, afeta_seguranca: true, tags: ["extintores", "conformidade"] },

  // Agendado
  { id: "os_004", codigo: "OS-00039", titulo: "Manutenção preventiva — Toboágua Kamikaze", descricao: "Limpeza da pista com produto anti-mofo, inspeção de parafusos da plataforma e troca de colchão de amortecimento.", tipo: "preventiva", status: "agendado", prioridade: "normal", atracao_id: "atr_kamikaze", setor: "Manutenção", solicitante_id: "manut1", responsavel_id: "manut1", criado_em: days(2), agendado_para: addFut(2), horas_estimadas: 6, custo_estimado: 1200, checklist: [ { id: "c1", texto: "Limpeza anti-mofo da pista", feito: false, obrigatorio: true }, { id: "c2", texto: "Inspeção de parafusos plataforma", feito: false, obrigatorio: true }, { id: "c3", texto: "Troca de colchão de amortecimento", feito: false }, { id: "c4", texto: "Registro fotográfico antes/depois", feito: false, obrigatorio: true } ] },
  { id: "os_005", codigo: "OS-00038", titulo: "Instalar 4 câmeras novas — área da Piscina de Ondas", descricao: "Projeto: Instalação Câmeras Q2. Expansão de cobertura CFTV.", tipo: "seguranca", status: "agendado", prioridade: "alta", setor: "Segurança", solicitante_id: "seg1", responsavel_id: "seg1", projeto_id: "proj_cameras", criado_em: days(5), agendado_para: addFut(3), horas_estimadas: 8, custo_estimado: 3600, fornecedor: "VigiaTech CFTV", afeta_seguranca: true, tags: ["cftv", "projeto"] },
  { id: "os_006", codigo: "OS-00037", titulo: "Limpeza profunda dos vestiários", tipo: "limpeza", status: "agendado", prioridade: "normal", atracao_id: "atr_vest_m", setor: "Operações", solicitante_id: "sup1", responsavel_id: "sup1", criado_em: days(1), agendado_para: addFut(1), horas_estimadas: 4, tags: ["limpeza", "vestiario"] },
  { id: "os_007", codigo: "OS-00036", titulo: "Montar estrutura — Evento Bradesco 26/04", descricao: "480 pessoas, Bradesco Prime. Estrutura extra: 4 tendas, 8 mesas VIP, palco de som.", tipo: "evento", status: "agendado", prioridade: "alta", setor: "Operações", solicitante_id: "gestor1", responsavel_id: "sup1", projeto_id: "proj_evento_bradesco", criado_em: days(3), agendado_para: addFut(4), horas_estimadas: 12, custo_estimado: 5800, tags: ["evento", "bradesco"] },

  // Em execução
  { id: "os_008", codigo: "OS-00035", titulo: "Manutenção gerador de ondas — Piscina de Ondas", descricao: "Manutenção preventiva trimestral do motor principal.", tipo: "preventiva", status: "em_execucao", prioridade: "alta", atracao_id: "atr_ondas", setor: "Manutenção", solicitante_id: "manut1", responsavel_id: "manut1", criado_em: days(1), iniciado_em: hours(6), horas_estimadas: 8, horas_reais: 5, custo_estimado: 3200, bloqueia_abertura: false, fornecedor: "HidroMec", checklist: [ { id: "c1", texto: "Desligar sistema hidráulico", feito: true, obrigatorio: true }, { id: "c2", texto: "Limpeza dos rolamentos", feito: true }, { id: "c3", texto: "Troca de óleo do motor", feito: true, obrigatorio: true }, { id: "c4", texto: "Teste de ciclo completo 30min", feito: false, obrigatorio: true }, { id: "c5", texto: "Liberar para operação", feito: false } ] },
  { id: "os_009", codigo: "OS-00034", titulo: "Reparo leitor QR — Catraca Sul", descricao: "Leitor intermitente, provável falha no CCD. Cliente com QR válido está tendo que passar manualmente.", tipo: "corretiva", status: "em_execucao", prioridade: "alta", atracao_id: "atr_cat_sul", setor: "Manutenção", solicitante_id: "seg1", responsavel_id: "manut1", criado_em: hours(10), iniciado_em: hours(3), horas_estimadas: 3, horas_reais: 2, custo_estimado: 680, fornecedor: "CatracaFix", tags: ["catraca", "qr"] },

  // Aguardando
  { id: "os_010", codigo: "OS-00033", titulo: "Troca da motobomba filtro principal", descricao: "Aguardando chegada da peça — previsão 48h.", tipo: "corretiva", status: "aguardando", prioridade: "alta", atracao_id: "atr_filt_central", setor: "Manutenção", solicitante_id: "manut1", responsavel_id: "manut1", criado_em: days(2), iniciado_em: days(1), horas_estimadas: 4, custo_estimado: 2400, fornecedor: "HidroMec", tags: ["peca", "aguardando-fornecedor"], comentarios: [ { id: "com1", autor_id: "manut1", texto: "Peça despachada pela HidroMec, rastreamento BR-884523. Previsão de entrega 48h.", timestamp: hours(6) } ] },
  { id: "os_011", codigo: "OS-00032", titulo: "Aprovação de compra — kit guarda-vidas adicional", descricao: "Solicitação acima do limite do supervisor (R$ 8.500). Aguardando aprovação do gestor.", tipo: "compra", status: "aguardando", prioridade: "normal", setor: "Segurança", solicitante_id: "seg1", responsavel_id: "seg1", criado_em: days(1), custo_estimado: 8500, fornecedor: "SalvaVida Pro", tags: ["aprovacao-pendente"] },
  { id: "os_012", codigo: "OS-00031", titulo: "Pintura — estrutura do Toboágua Radical", descricao: "Aguardando liberação do fornecedor para início (próxima janela sem operação).", tipo: "preventiva", status: "aguardando", prioridade: "baixa", atracao_id: "atr_radical", setor: "Manutenção", solicitante_id: "manut1", responsavel_id: "manut1", criado_em: days(6), horas_estimadas: 16, custo_estimado: 4200, fornecedor: "Pinta Certo", tags: ["pintura"] },

  // Concluído (alguns verificados, outros não)
  { id: "os_013", codigo: "OS-00030", titulo: "Limpeza química — Rio Lento", descricao: "Tratamento químico completo realizado conforme protocolo.", tipo: "limpeza", status: "concluido", prioridade: "normal", atracao_id: "atr_rio_lento", setor: "Manutenção", solicitante_id: "manut1", responsavel_id: "manut1", criado_em: days(4), iniciado_em: days(4), concluido_em: days(4), verificado_em: days(3), verificado_por_id: "sup1", horas_estimadas: 3, horas_reais: 3, custo_real: 480, tags: ["limpeza", "quimica"] },
  { id: "os_014", codigo: "OS-00029", titulo: "Troca de lâmpadas LED — área kids", tipo: "preventiva", status: "concluido", prioridade: "baixa", atracao_id: "atr_piscininha", setor: "Manutenção", solicitante_id: "manut1", responsavel_id: "manut1", criado_em: days(6), iniciado_em: days(5), concluido_em: days(5), horas_reais: 2, custo_real: 320, tags: ["iluminacao"] },
  { id: "os_015", codigo: "OS-00028", titulo: "Inspeção mensal de extintores — todas áreas", tipo: "seguranca", status: "concluido", prioridade: "alta", setor: "Segurança", solicitante_id: "seg1", responsavel_id: "seg1", criado_em: days(8), iniciado_em: days(8), concluido_em: days(8), verificado_em: days(7), verificado_por_id: "gestor1", horas_reais: 4, afeta_seguranca: true, tags: ["extintores", "mensal"] },
  { id: "os_016", codigo: "OS-00027", titulo: "Revisão dos desfibriladores DEA", tipo: "seguranca", status: "concluido", prioridade: "alta", setor: "Segurança", solicitante_id: "seg1", responsavel_id: "seg1", criado_em: days(10), iniciado_em: days(10), concluido_em: days(10), verificado_em: days(10), verificado_por_id: "gestor1", horas_reais: 1.5, afeta_seguranca: true, tags: ["dea", "emergencia"] },
  { id: "os_017", codigo: "OS-00026", titulo: "Configurar novo roteador — Wi-Fi área praia", tipo: "ti", status: "concluido", prioridade: "normal", atracao_id: "atr_praia", setor: "Operações", solicitante_id: "sup1", responsavel_id: "sup1", criado_em: days(9), iniciado_em: days(9), concluido_em: days(8), horas_reais: 2, custo_real: 0, tags: ["wifi", "ti"] },
  { id: "os_018", codigo: "OS-00025", titulo: "Troca de filtros do Bar Molhado", tipo: "preventiva", status: "concluido", prioridade: "normal", atracao_id: "atr_bar_molhado", setor: "Operações", solicitante_id: "sup1", responsavel_id: "sup1", criado_em: days(12), iniciado_em: days(12), concluido_em: days(11), horas_reais: 1, custo_real: 180, tags: ["bar", "filtro"] },
];

export const rotinas: Rotina[] = [
  { id: "rot_abertura_piscinas", codigo: "ROT-001", titulo: "Checagem de pH e cloro — todas piscinas", momento: "abertura", periodicidade: "diaria", horario: "07:30", duracao_min: 30, setor: "Manutenção", responsavel_id: "manut1", obrigatoria: true, bloqueia_abertura: true, afeta_seguranca: true, ativa: true, descricao: "Verificação química obrigatória antes da abertura.", checklist: [ { id: "r1", texto: "pH Piscina de Ondas (6.8-7.6)", obrigatorio: true }, { id: "r2", texto: "pH Rio Lento (6.8-7.6)", obrigatorio: true }, { id: "r3", texto: "pH Piscina Infantil (6.8-7.6)", obrigatorio: true }, { id: "r4", texto: "pH Praia Artificial (6.8-7.6)", obrigatorio: true }, { id: "r5", texto: "Cloro livre Piscina de Ondas (1-3 ppm)", obrigatorio: true }, { id: "r6", texto: "Cloro livre Rio Lento (1-3 ppm)", obrigatorio: true }, { id: "r7", texto: "Cloro livre Piscina Infantil (1-3 ppm)", obrigatorio: true }, { id: "r8", texto: "Cloro livre Praia Artificial (1-3 ppm)", obrigatorio: true } ] },
  { id: "rot_abertura_catracas", codigo: "ROT-002", titulo: "Teste de catracas e QR readers", momento: "abertura", periodicidade: "diaria", horario: "08:15", duracao_min: 15, setor: "Segurança", responsavel_id: "seg1", obrigatoria: true, bloqueia_abertura: true, ativa: true, checklist: [ { id: "r1", texto: "Catraca Norte — teste com QR válido", obrigatorio: true }, { id: "r2", texto: "Catraca Sul — teste com QR válido", obrigatorio: true }, { id: "r3", texto: "Catraca VIP — teste com QR válido", obrigatorio: true }, { id: "r4", texto: "Rede local estável em todas", obrigatorio: true }, { id: "r5", texto: "Impressora de pulseira — teste de emissão" } ] },
  { id: "rot_abertura_emergencia", codigo: "ROT-003", titulo: "Checagem de kits de primeiros socorros e DEA", momento: "abertura", periodicidade: "diaria", horario: "08:30", duracao_min: 20, setor: "Segurança", responsavel_id: "seg1", obrigatoria: true, bloqueia_abertura: true, afeta_seguranca: true, ativa: true, checklist: [ { id: "r1", texto: "Kit 1 (torre norte) — todos itens presentes", obrigatorio: true }, { id: "r2", texto: "Kit 2 (torre sul) — todos itens presentes", obrigatorio: true }, { id: "r3", texto: "Kit 3 (área kids) — todos itens presentes", obrigatorio: true }, { id: "r4", texto: "DEA 1 — bateria OK e eletrodo dentro da validade", obrigatorio: true }, { id: "r5", texto: "DEA 2 — bateria OK e eletrodo dentro da validade", obrigatorio: true } ] },
  { id: "rot_abertura_guardavidas", codigo: "ROT-004", titulo: "Briefing matinal com guarda-vidas", momento: "abertura", periodicidade: "diaria", horario: "08:45", duracao_min: 15, setor: "Segurança", responsavel_id: "seg1", obrigatoria: true, ativa: true, checklist: [ { id: "r1", texto: "Presença completa do time", obrigatorio: true }, { id: "r2", texto: "Posicionamento nas torres definido", obrigatorio: true }, { id: "r3", texto: "Comunicação rádio testada", obrigatorio: true }, { id: "r4", texto: "Alertas/ocorrências da véspera repassadas" } ] },
  { id: "rot_durante_ronda", codigo: "ROT-005", titulo: "Ronda a cada 2h — supervisor operacional", momento: "durante", periodicidade: "diaria", horario: "10:00, 12:00, 14:00, 16:00", duracao_min: 20, setor: "Operações", responsavel_id: "sup1", obrigatoria: true, ativa: true, checklist: [ { id: "r1", texto: "Visita a todas atrações", obrigatorio: true }, { id: "r2", texto: "Verificação de guarda-vidas em posição" }, { id: "r3", texto: "Estoque de toalhas/pulseiras nos postos" }, { id: "r4", texto: "Limpeza visual das áreas comuns" } ] },
  { id: "rot_fechamento_quimico", codigo: "ROT-006", titulo: "Tratamento químico noturno das piscinas", momento: "fechamento", periodicidade: "diaria", horario: "18:30", duracao_min: 45, setor: "Manutenção", responsavel_id: "manut1", obrigatoria: true, afeta_seguranca: true, ativa: true, checklist: [ { id: "r1", texto: "Cloração de choque programada", obrigatorio: true }, { id: "r2", texto: "Aspirador automático ligado", obrigatorio: true }, { id: "r3", texto: "Filtros em retrolavagem", obrigatorio: true }, { id: "r4", texto: "Quantitativos de produto registrados" } ] },
  { id: "rot_fechamento_seguranca", codigo: "ROT-007", titulo: "Checagem final de segurança e catracas", momento: "fechamento", periodicidade: "diaria", horario: "19:00", duracao_min: 20, setor: "Segurança", responsavel_id: "seg1", obrigatoria: true, ativa: true, checklist: [ { id: "r1", texto: "Parque totalmente evacuado", obrigatorio: true }, { id: "r2", texto: "Catracas em modo saída", obrigatorio: true }, { id: "r3", texto: "Câmeras CFTV gravando", obrigatorio: true }, { id: "r4", texto: "Alarme perimetral ativado", obrigatorio: true } ] },
  { id: "rot_semanal_extintor", codigo: "ROT-008", titulo: "Inspeção visual de extintores", momento: "abertura", periodicidade: "semanal", horario: "Segunda 07:00", duracao_min: 30, setor: "Segurança", responsavel_id: "seg1", obrigatoria: true, afeta_seguranca: true, ativa: true, checklist: [ { id: "r1", texto: "Todos extintores com lacre", obrigatorio: true }, { id: "r2", texto: "Pressão na faixa verde", obrigatorio: true }, { id: "r3", texto: "Acesso desobstruído", obrigatorio: true }, { id: "r4", texto: "Sinalização visível" } ] },
];

export const rotinaInstancias: RotinaInstancia[] = [
  { id: "ri_001", rotina_id: "rot_abertura_piscinas", data: hojeISO, status: "concluida", responsavel_id: "manut1", iniciada_em: hours(5), concluida_em: hours(4.5), checklist_feitos: ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"], observacao: "Todos valores dentro da faixa." },
  { id: "ri_002", rotina_id: "rot_abertura_catracas", data: hojeISO, status: "concluida", responsavel_id: "seg1", iniciada_em: hours(4.5), concluida_em: hours(4.3), checklist_feitos: ["r1", "r2", "r3", "r4", "r5"] },
  { id: "ri_003", rotina_id: "rot_abertura_emergencia", data: hojeISO, status: "concluida", responsavel_id: "seg1", iniciada_em: hours(4.3), concluida_em: hours(4), checklist_feitos: ["r1", "r2", "r3", "r4", "r5"] },
  { id: "ri_004", rotina_id: "rot_abertura_guardavidas", data: hojeISO, status: "concluida", responsavel_id: "seg1", iniciada_em: hours(4), concluida_em: hours(3.8), checklist_feitos: ["r1", "r2", "r3", "r4"] },
  { id: "ri_005", rotina_id: "rot_durante_ronda", data: hojeISO, status: "em_andamento", responsavel_id: "sup1", iniciada_em: hours(2), checklist_feitos: ["r1", "r2"] },
  { id: "ri_006", rotina_id: "rot_fechamento_quimico", data: hojeISO, status: "pendente", responsavel_id: "manut1", checklist_feitos: [] },
  { id: "ri_007", rotina_id: "rot_fechamento_seguranca", data: hojeISO, status: "pendente", responsavel_id: "seg1", checklist_feitos: [] },
  { id: "ri_008", rotina_id: "rot_semanal_extintor", data: hojeISO, status: "atrasada", responsavel_id: "seg1", checklist_feitos: [], observacao: "Previsto 07h de segunda, ainda não iniciada." },
];

export const projetosOp: ProjetoOp[] = [
  { id: "proj_cameras", codigo: "PROJ-001", titulo: "Expansão CFTV — Q2 2026", descricao: "Instalação de 16 novas câmeras nas áreas de alta circulação, centralização no mural de segurança com gravação 30 dias.", status: "em_execucao", prioridade: "alta", setor: "Segurança", responsavel_id: "seg1", membros: ["seg1", "gestor1", "manut1"], data_inicio: days(30), data_fim_prevista: future(45), orcamento_estimado: 42000, orcamento_real: 18200, cor: "sky", atracoes: ["atr_ondas", "atr_praia", "atr_cat_norte", "atr_cat_sul"], marcos: [ { id: "m1", titulo: "Projeto aprovado", data: days(30), feito: true }, { id: "m2", titulo: "Equipamentos adquiridos", data: days(10), feito: true }, { id: "m3", titulo: "Instalação 1ª fase (8 câmeras)", data: future(15), feito: false }, { id: "m4", titulo: "Instalação 2ª fase (8 câmeras)", data: future(35), feito: false }, { id: "m5", titulo: "Aceite final + treinamento", data: future(45), feito: false } ] },
  { id: "proj_piscina_infantil", codigo: "PROJ-002", titulo: "Expansão Piscina Infantil", descricao: "Ampliação de 60m² com zona de brinquedos aquáticos, nova cobertura solar e piso antiderrapante.", status: "planejamento", prioridade: "normal", setor: "Manutenção", responsavel_id: "gestor1", membros: ["gestor1", "manut1", "sup1"], data_inicio: future(20), data_fim_prevista: future(110), orcamento_estimado: 180000, cor: "aqua", atracoes: ["atr_piscininha"], marcos: [ { id: "m1", titulo: "Projeto arquitetônico aprovado", data: future(15), feito: false }, { id: "m2", titulo: "Demolição área existente", data: future(30), feito: false }, { id: "m3", titulo: "Obra civil concluída", data: future(80), feito: false }, { id: "m4", titulo: "Inauguração", data: future(110), feito: false } ] },
  { id: "proj_evento_bradesco", codigo: "PROJ-003", titulo: "Evento Bradesco Confraternização — 26/04", descricao: "Operação do evento privado: montagem de estrutura, escalonamento de pessoal, reforço de guarda-vidas, kit reforçado de primeiros socorros.", status: "em_execucao", prioridade: "alta", setor: "Operações", responsavel_id: "sup1", membros: ["sup1", "gestor1", "seg1", "manut1", "bilh1"], data_inicio: days(3), data_fim_prevista: future(7), orcamento_estimado: 18000, orcamento_real: 6400, cor: "violet", marcos: [ { id: "m1", titulo: "Contrato assinado", data: days(3), feito: true }, { id: "m2", titulo: "Estrutura montada", data: future(4), feito: false }, { id: "m3", titulo: "Briefing com time", data: future(5), feito: false }, { id: "m4", titulo: "Evento realizado", data: future(7), feito: false } ] },
  { id: "proj_ppra", codigo: "PROJ-004", titulo: "Renovação PPRA + PCMSO 2026", descricao: "Programa de prevenção de riscos ambientais e controle médico. Obrigatório anualmente, prazo até 31/05.", status: "em_execucao", prioridade: "critica", setor: "Segurança", responsavel_id: "gestor1", membros: ["gestor1", "sup1", "seg1"], data_inicio: days(15), data_fim_prevista: future(40), orcamento_estimado: 22000, orcamento_real: 8000, privado: true, cor: "amber", marcos: [ { id: "m1", titulo: "Contratação da consultoria", data: days(15), feito: true }, { id: "m2", titulo: "Levantamento de riscos", data: days(2), feito: true }, { id: "m3", titulo: "Exames médicos equipe", data: future(20), feito: false }, { id: "m4", titulo: "Entrega dos laudos", data: future(40), feito: false } ] },
  { id: "proj_inc_0042", codigo: "PROJ-005", titulo: "Plano de ação pós-incidente INC-0042", descricao: "Investigação e plano de ação corretiva do incidente no Toboágua Radical. Envolve auditoria de procedimentos, retreinamento de equipe e ajustes de infraestrutura.", status: "em_execucao", prioridade: "critica", setor: "Segurança", responsavel_id: "sup1", membros: ["sup1", "gestor1", "seg1", "manut1"], data_inicio: hours(5), data_fim_prevista: future(14), orcamento_estimado: 12000, cor: "rose", marcos: [ { id: "m1", titulo: "Investigação concluída", data: future(2), feito: false }, { id: "m2", titulo: "Plano de ação aprovado", data: future(4), feito: false }, { id: "m3", titulo: "Retreinamento realizado", data: future(10), feito: false }, { id: "m4", titulo: "Post-mortem público", data: future(14), feito: false } ] },
];

export const reunioesOp: ReuniaoOp[] = [
  { id: "reu_001", codigo: "REU-0012", titulo: "Briefing matinal — operações 19/04", tipo: "briefing_matinal", status: "realizada", data_hora_inicio: hours(6), data_hora_fim: hours(5.7), local: "Sala de Operações", organizador_id: "sup1", recorrente: true, frequencia: "diaria", pauta: [ { id: "p1", ordem: 1, titulo: "Ocorrências da véspera", duracao_min: 5, status: "discutido", resultado: "Sem ocorrências graves. Escorregão Kids com ruído registrado às 19h20." }, { id: "p2", ordem: 2, titulo: "Previsão de público hoje", duracao_min: 3, status: "discutido", resultado: "~1200 visitantes estimados, com pico às 14h." }, { id: "p3", ordem: 3, titulo: "Rotinas de abertura", responsavel_id: "manut1", duracao_min: 5, status: "discutido", resultado: "Todas ok, pH e cloro dentro da faixa." }, { id: "p4", ordem: 4, titulo: "Alertas de manutenção", duracao_min: 5, status: "discutido", resultado: "Catraca Sul com leitor intermitente — OS-00034 em execução." } ], ata: "Briefing realizado com 6 presentes. Principal alerta: Escorregão Kids apresentou ruído na bomba durante a rotina de fechamento da véspera. Hugo vai inspecionar às 8h. Catraca Sul segue em reparo, prazo 4h.", decisoes: "Escorregão Kids permanece fora de operação até parecer do Hugo. Sinalização reforçada.", participantes: [ { user_id: "sup1", confirmacao: "confirmado", presente: true, role: "organizador" }, { user_id: "manut1", confirmacao: "confirmado", presente: true, role: "participante" }, { user_id: "seg1", confirmacao: "confirmado", presente: true, role: "participante" }, { user_id: "bilh1", confirmacao: "confirmado", presente: true, role: "participante" }, { user_id: "gestor1", confirmacao: "confirmado", presente: true, role: "participante" }, { user_id: "sup2", confirmacao: "confirmado", presente: false, role: "opcional" } ], action_items: [ { id: "ai_001", codigo: "AI-0018", titulo: "Inspecionar bomba Escorregão Kids e abrir OS", responsavel_id: "manut1", prazo: hojeISO, status: "concluido", convertido_em_os: "os_001" }, { id: "ai_002", codigo: "AI-0019", titulo: "Reforçar sinalização no Escorregão Kids", responsavel_id: "sup1", prazo: hojeISO, status: "concluido" } ] },
  { id: "reu_002", codigo: "REU-0013", titulo: "Post-mortem INC-0042 — Toboágua Radical", tipo: "post_mortem", status: "agendada", data_hora_inicio: future(1), data_hora_fim: future(1.05), local: "Sala de Operações / Meet: meet.valparaiso/inc0042", organizador_id: "sup1", projeto_id: "proj_inc_0042", incidente_ref: "INC-0042", recorrente: false, pauta: [ { id: "p1", ordem: 1, titulo: "Linha do tempo do incidente", responsavel_id: "seg1", duracao_min: 15, status: "pendente" }, { id: "p2", ordem: 2, titulo: "Análise de causa raiz (5 porquês)", responsavel_id: "sup1", duracao_min: 20, status: "pendente" }, { id: "p3", ordem: 3, titulo: "Plano de ação corretiva", duracao_min: 15, status: "pendente" }, { id: "p4", ordem: 4, titulo: "Comunicação ao público e imprensa", responsavel_id: "gestor1", duracao_min: 10, status: "pendente" } ], participantes: [ { user_id: "sup1", confirmacao: "confirmado", presente: false, role: "organizador" }, { user_id: "gestor1", confirmacao: "confirmado", presente: false, role: "participante" }, { user_id: "seg1", confirmacao: "confirmado", presente: false, role: "apresentador" }, { user_id: "manut1", confirmacao: "confirmado", presente: false, role: "participante" } ], action_items: [] },
  { id: "reu_003", codigo: "REU-0014", titulo: "Semanal de Manutenção — 19/04", tipo: "semanal_manut", status: "agendada", data_hora_inicio: addFut(0.2), data_hora_fim: addFut(0.27), local: "Sala de Manutenção", organizador_id: "manut1", recorrente: true, frequencia: "semanal", pauta: [ { id: "p1", ordem: 1, titulo: "OS abertas da semana", responsavel_id: "manut1", duracao_min: 10, status: "pendente" }, { id: "p2", ordem: 2, titulo: "Planejamento de preventivas", duracao_min: 15, status: "pendente" }, { id: "p3", ordem: 3, titulo: "Estoque de peças críticas", responsavel_id: "manut1", duracao_min: 10, status: "pendente" } ], participantes: [ { user_id: "manut1", confirmacao: "confirmado", presente: false, role: "organizador" }, { user_id: "sup1", confirmacao: "confirmado", presente: false, role: "participante" }, { user_id: "gestor1", confirmacao: "pendente", presente: false, role: "opcional" } ], action_items: [] },
  { id: "reu_004", codigo: "REU-0015", titulo: "Planejamento Evento Bradesco 26/04", tipo: "planejamento", status: "agendada", data_hora_inicio: future(2), data_hora_fim: future(2.08), local: "Auditório Administrativo", organizador_id: "sup1", projeto_id: "proj_evento_bradesco", recorrente: false, pauta: [ { id: "p1", ordem: 1, titulo: "Revisão de cronograma", duracao_min: 10, status: "pendente" }, { id: "p2", ordem: 2, titulo: "Estrutura física — divisão de tarefas", responsavel_id: "manut1", duracao_min: 15, status: "pendente" }, { id: "p3", ordem: 3, titulo: "Reforço de guarda-vidas (480 pessoas)", responsavel_id: "seg1", duracao_min: 10, status: "pendente" }, { id: "p4", ordem: 4, titulo: "Cardápio e suprimentos bar", duracao_min: 10, status: "pendente" } ], participantes: [ { user_id: "sup1", confirmacao: "confirmado", presente: false, role: "organizador" }, { user_id: "gestor1", confirmacao: "confirmado", presente: false, role: "participante" }, { user_id: "manut1", confirmacao: "confirmado", presente: false, role: "apresentador" }, { user_id: "seg1", confirmacao: "confirmado", presente: false, role: "apresentador" }, { user_id: "bilh1", confirmacao: "talvez", presente: false, role: "participante" } ], action_items: [] },
];

export const atracaoById = (id: string) => atracoes.find((a) => a.id === id);
export const projetoOpById = (id: string) => projetosOp.find((p) => p.id === id);
export const rotinaById = (id: string) => rotinas.find((r) => r.id === id);

/* ───────────────────── SQUADS ───────────────────── */

export const squads: Squad[] = [
  {
    id: "sq-comercial",
    nome: "Comercial",
    slug: "comercial",
    descricao: "Vendas, pipeline, atendimento de leads",
    cor: "#2563eb",
    lider_id: "u0",
    membros_count: 9,
    ativa: true,
    created_at: days(420),
  },
  {
    id: "sq-marketing",
    nome: "Marketing",
    slug: "marketing",
    descricao: "Mídia paga, conteúdo, campanhas, branding",
    cor: "#a855f7",
    lider_id: "u-mkt-01",
    membros_count: 5,
    ativa: true,
    created_at: days(420),
  },
  {
    id: "sq-ops",
    nome: "Operações",
    slug: "ops",
    descricao: "Manutenção, parque, segurança, guarda-vidas",
    cor: "#0891b2",
    lider_id: "u-ops-01",
    membros_count: 28,
    ativa: true,
    created_at: days(420),
  },
  {
    id: "sq-sac",
    nome: "SAC",
    slug: "sac",
    descricao: "Atendimento pós-venda, tickets, reclamações",
    cor: "#f59e0b",
    lider_id: "u5",
    membros_count: 6,
    ativa: true,
    created_at: days(420),
  },
  {
    id: "sq-financeiro",
    nome: "Financeiro",
    slug: "financeiro",
    descricao: "Faturamento, cobrança, conciliação, fiscal",
    cor: "#16a34a",
    lider_id: "u-fin-01",
    membros_count: 4,
    ativa: true,
    created_at: days(420),
  },
  {
    id: "sq-rh",
    nome: "Pessoas & RH",
    slug: "rh",
    descricao: "Recrutamento, treinamento, folha, cultura",
    cor: "#ec4899",
    lider_id: "u-rh-01",
    membros_count: 3,
    ativa: true,
    created_at: days(300),
  },
  {
    id: "sq-ti",
    nome: "Tecnologia",
    slug: "ti",
    descricao: "CRM, integrações, BI, infraestrutura",
    cor: "#6366f1",
    lider_id: "u6",
    membros_count: 2,
    ativa: true,
    created_at: days(210),
  },
];

export const squadById = (id: string) => squads.find((s) => s.id === id);

/* ───────────────────── USUÁRIOS EXTRAS (marketing/fin/rh/ops) ───────────────────── */

export const usuariosExtras: { id: string; nome: string; cargo: string; squad_id: string }[] = [
  { id: "u-mkt-01", nome: "Carolina Lima", cargo: "Head de Marketing", squad_id: "sq-marketing" },
  { id: "u-mkt-02", nome: "Pedro Assis", cargo: "Mídia Paga", squad_id: "sq-marketing" },
  { id: "u-mkt-03", nome: "Marina Gouveia", cargo: "Social Media", squad_id: "sq-marketing" },
  { id: "u-mkt-04", nome: "Diego Tavares", cargo: "Designer", squad_id: "sq-marketing" },
  { id: "u-fin-01", nome: "Beatriz Machado", cargo: "Coord. Financeiro", squad_id: "sq-financeiro" },
  { id: "u-fin-02", nome: "Rafael Cunha", cargo: "Analista Financeiro", squad_id: "sq-financeiro" },
  { id: "u-rh-01", nome: "Patrícia Vargas", cargo: "Coord. RH", squad_id: "sq-rh" },
  { id: "u-ops-01", nome: "João Batista", cargo: "Gerente Operacional", squad_id: "sq-ops" },
  { id: "u-ops-02", nome: "Cleiton Rocha", cargo: "Coord. Manutenção", squad_id: "sq-ops" },
  { id: "u-ops-03", nome: "Simone Araújo", cargo: "Coord. Guarda-vidas", squad_id: "sq-ops" },
];

/* ───────────────────── HIERARQUIA ───────────────────── */

export const hierarquiaUsuarios: HierarquiaUsuario[] = [
  { user_id: "u6", squad_id: "sq-ti", squads_secundarias: [], unidade_id: "un-sl", cargo: "CTO", avatar_cor: "#6366f1" },
  { user_id: "u0", gestor_id: "u6", squad_id: "sq-comercial", squads_secundarias: ["sq-marketing"], unidade_id: "un-sl", cargo: "Diretora Comercial", avatar_cor: "#2563eb" },
  { user_id: "u1", gestor_id: "u0", squad_id: "sq-comercial", squads_secundarias: [], unidade_id: "un-sl", cargo: "Supervisor Comercial" },
  { user_id: "c1", gestor_id: "u1", squad_id: "sq-comercial", squads_secundarias: [], unidade_id: "un-sl", cargo: "Corretora Sênior" },
  { user_id: "c2", gestor_id: "u1", squad_id: "sq-comercial", squads_secundarias: [], unidade_id: "un-sl", cargo: "Corretor" },
  { user_id: "c3", gestor_id: "u1", squad_id: "sq-comercial", squads_secundarias: [], unidade_id: "un-sl", cargo: "Corretora" },
  { user_id: "c4", gestor_id: "u1", squad_id: "sq-comercial", squads_secundarias: [], unidade_id: "un-sl", cargo: "Corretor" },
  { user_id: "c5", gestor_id: "u1", squad_id: "sq-comercial", squads_secundarias: [], unidade_id: "un-sl", cargo: "Corretor" },
  { user_id: "u5", gestor_id: "u0", squad_id: "sq-sac", squads_secundarias: [], unidade_id: "un-sl", cargo: "Coord. SAC" },
  { user_id: "u-mkt-01", gestor_id: "u0", squad_id: "sq-marketing", squads_secundarias: [], unidade_id: "un-sl", cargo: "Head de Marketing", avatar_cor: "#a855f7" },
  { user_id: "u-mkt-02", gestor_id: "u-mkt-01", squad_id: "sq-marketing", squads_secundarias: [], unidade_id: "un-sl", cargo: "Mídia Paga" },
  { user_id: "u-mkt-03", gestor_id: "u-mkt-01", squad_id: "sq-marketing", squads_secundarias: [], unidade_id: "un-sl", cargo: "Social Media" },
  { user_id: "u-mkt-04", gestor_id: "u-mkt-01", squad_id: "sq-marketing", squads_secundarias: ["sq-comercial"], unidade_id: "un-sl", cargo: "Designer" },
  { user_id: "u-fin-01", gestor_id: "u6", squad_id: "sq-financeiro", squads_secundarias: [], unidade_id: "un-sl", cargo: "Coord. Financeiro", avatar_cor: "#16a34a" },
  { user_id: "u-fin-02", gestor_id: "u-fin-01", squad_id: "sq-financeiro", squads_secundarias: [], unidade_id: "un-sl", cargo: "Analista Financeiro" },
  { user_id: "u-rh-01", gestor_id: "u6", squad_id: "sq-rh", squads_secundarias: [], unidade_id: "un-sl", cargo: "Coord. RH", avatar_cor: "#ec4899" },
  { user_id: "u-ops-01", gestor_id: "u6", squad_id: "sq-ops", squads_secundarias: [], unidade_id: "un-sl", cargo: "Gerente Operacional", avatar_cor: "#0891b2" },
  { user_id: "u-ops-02", gestor_id: "u-ops-01", squad_id: "sq-ops", squads_secundarias: [], unidade_id: "un-sl", cargo: "Coord. Manutenção" },
  { user_id: "u-ops-03", gestor_id: "u-ops-01", squad_id: "sq-ops", squads_secundarias: [], unidade_id: "un-sl", cargo: "Coord. Guarda-vidas" },
];

export const hierarquiaByUser = (uid: string) =>
  hierarquiaUsuarios.find((h) => h.user_id === uid);

export const userDisplayName = (uid: string): string => {
  const h = usuarios.find((u) => u.id === uid);
  if (h) return h.nome;
  const e = usuariosExtras.find((u) => u.id === uid);
  return e?.nome ?? "Sistema";
};

export const userCargo = (uid: string): string => {
  const h = hierarquiaByUser(uid);
  return h?.cargo ?? "—";
};

export const subordinadosOf = (uid: string): string[] =>
  hierarquiaUsuarios.filter((h) => h.gestor_id === uid).map((h) => h.user_id);

export const equipeVisibleTo = (uid: string): string[] => {
  const direct = subordinadosOf(uid);
  const nested = direct.flatMap(subordinadosOf);
  return Array.from(new Set([uid, ...direct, ...nested]));
};

/* ───────────────────── TAREFAS UNIFICADAS ───────────────────── */

const hojeTarefas = new Date().toISOString().slice(0, 10);
const amanhaTarefas = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const semanaTarefas = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
const ontemTarefas = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const anteontemTarefas = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);

export const tarefas: Tarefa[] = [
  {
    id: "t-001",
    codigo: "TAR-0001",
    titulo: "Revisar copy da campanha de renovação 2026",
    descricao:
      "Validar copy de headline, CTA e disclaimers. Precisamos que o comercial confirme se os benefícios listados estão alinhados com o script atual.",
    subtipo: "revisao",
    status: "em_andamento",
    prioridade: "alta",
    visibilidade: "envolvidos",
    squad_id: "sq-marketing",
    criador_id: "u-mkt-01",
    responsavel_id: "u-mkt-03",
    participantes: ["u1", "u-mkt-04"],
    aprovadores: ["u-mkt-01", "u0"],
    data_prazo: amanhaTarefas,
    estimativa_horas: 4,
    horas_gastas: 1.5,
    checklist: [
      { id: "c1", texto: "Headline aprovado pelo comercial", concluido: true },
      { id: "c2", texto: "CTA testado em 3 variações", concluido: true },
      { id: "c3", texto: "Disclaimers jurídicos revisados", concluido: false },
      { id: "c4", texto: "Aprovação final da Carolina", concluido: false },
    ],
    comentarios: [
      { id: "cm1", autor_id: "u1", texto: "Headline ficou boa. Sugiro trocar 'passe anual' por 'passaporte anual' pra manter padrão.", created_at: hours(8) },
      { id: "cm2", autor_id: "u-mkt-03", texto: "Ajustado!", created_at: hours(6) },
    ],
    tags: ["campanha", "renovacao", "q2"],
    created_at: days(3),
    updated_at: hours(2),
  },
  {
    id: "t-002",
    codigo: "TAR-0002",
    titulo: "Ligar para Patrícia Melo (follow-up proposta)",
    descricao: "Proposta enviada ontem, sem resposta. Tentar contato por WhatsApp primeiro, depois ligar.",
    subtipo: "followup",
    status: "a_fazer",
    prioridade: "alta",
    visibilidade: "squad",
    squad_id: "sq-comercial",
    criador_id: "c1",
    responsavel_id: "c1",
    participantes: [],
    aprovadores: [],
    origem: { tipo: "lead", id: "l1", label: "Patrícia Melo — Anual Família" },
    data_prazo: hojeTarefas,
    estimativa_horas: 0.25,
    checklist: [],
    comentarios: [],
    tags: ["followup"],
    created_at: days(1),
    updated_at: hours(4),
  },
  {
    id: "t-003",
    codigo: "TAR-0003",
    titulo: "Aprovar desconto R$ 820 — Lead Rafael Oliveira",
    descricao: "Corretor solicitou desconto 18% fora da alçada. Cliente pediu ajuste para bater orçamento concorrente.",
    subtipo: "aprovacao",
    status: "aguardando",
    prioridade: "critica",
    visibilidade: "envolvidos",
    squad_id: "sq-comercial",
    criador_id: "c2",
    responsavel_id: "u1",
    participantes: ["c2"],
    aprovadores: ["u1", "u0"],
    origem: { tipo: "lead", id: "l6", label: "Rafael Oliveira — Anual Individual" },
    data_prazo: hojeTarefas,
    checklist: [
      { id: "c1", texto: "Validar histórico de renovação do lead", concluido: true },
      { id: "c2", texto: "Aprovação do supervisor", concluido: false },
      { id: "c3", texto: "Aprovação da diretoria (>15%)", concluido: false },
    ],
    comentarios: [
      { id: "cm1", autor_id: "c2", texto: "Cliente trouxe print da concorrência. Vale o esforço.", created_at: hours(3) },
    ],
    tags: ["aprovacao", "desconto", "urgente"],
    created_at: hours(5),
    updated_at: hours(1),
  },
  {
    id: "t-004",
    codigo: "TAR-0004",
    titulo: "Briefing Instagram — Evento Bradesco 10/05",
    descricao: "Preparar briefing de mídia paga para o evento corporativo Bradesco. Incluir assets, cronograma e orçamento.",
    subtipo: "briefing",
    status: "a_fazer",
    prioridade: "normal",
    visibilidade: "squad",
    squad_id: "sq-marketing",
    criador_id: "u-mkt-01",
    responsavel_id: "u-mkt-02",
    participantes: ["u-mkt-04"],
    aprovadores: ["u-mkt-01"],
    origem: { tipo: "projeto", id: "proj-op-3", label: "Evento Bradesco 10/05" },
    data_prazo: future(3).slice(0, 10),
    estimativa_horas: 6,
    checklist: [
      { id: "c1", texto: "Definir público e segmentação", concluido: false },
      { id: "c2", texto: "Peças criativas (3 variações)", concluido: false },
      { id: "c3", texto: "Cronograma de posts", concluido: false },
      { id: "c4", texto: "Orçamento de impulsionamento", concluido: false },
    ],
    comentarios: [],
    tags: ["evento", "bradesco", "midia-paga"],
    created_at: days(2),
    updated_at: days(1),
  },
  {
    id: "t-005",
    codigo: "TAR-0005",
    titulo: "Cobrança cartão recusado — 4 clientes",
    descricao: "Lista de passaportes com cobrança recorrente recusada no último ciclo. Contatar e reemitir.",
    subtipo: "cobranca",
    status: "em_andamento",
    prioridade: "alta",
    visibilidade: "squad",
    squad_id: "sq-financeiro",
    criador_id: "u-fin-01",
    responsavel_id: "u-fin-02",
    participantes: ["u5"],
    aprovadores: [],
    data_prazo: amanhaTarefas,
    estimativa_horas: 3,
    horas_gastas: 1,
    checklist: [
      { id: "c1", texto: "Cliente #1 — cartão atualizado", concluido: true },
      { id: "c2", texto: "Cliente #2 — aguardando retorno", concluido: false },
      { id: "c3", texto: "Cliente #3 — link reemitido", concluido: true },
      { id: "c4", texto: "Cliente #4 — sem contato", concluido: false },
    ],
    comentarios: [],
    tags: ["inadimplencia", "recorrencia"],
    created_at: days(2),
    updated_at: hours(6),
  },
  {
    id: "t-006",
    codigo: "TAR-0006",
    titulo: "Entregar criativo — banner topo site",
    descricao: "Substituir banner hero do site com criativo da campanha de férias.",
    subtipo: "entrega",
    status: "concluida",
    prioridade: "normal",
    visibilidade: "squad",
    squad_id: "sq-marketing",
    criador_id: "u-mkt-01",
    responsavel_id: "u-mkt-04",
    participantes: ["u6"],
    aprovadores: [],
    data_prazo: ontemTarefas,
    data_conclusao: hours(20),
    estimativa_horas: 3,
    horas_gastas: 3.5,
    checklist: [
      { id: "c1", texto: "Mockup aprovado", concluido: true },
      { id: "c2", texto: "Exportar para web", concluido: true },
      { id: "c3", texto: "Subir via CMS", concluido: true },
    ],
    comentarios: [],
    tags: ["criativo", "site"],
    created_at: days(4),
    updated_at: hours(20),
  },
  {
    id: "t-007",
    codigo: "TAR-0007",
    titulo: "Treinamento novos corretores — Turma 04",
    descricao: "Agendar e ministrar treinamento inicial da turma 04 de corretores. Pauta: CRM, script, objeções.",
    subtipo: "generica",
    status: "a_fazer",
    prioridade: "normal",
    visibilidade: "envolvidos",
    squad_id: "sq-rh",
    criador_id: "u-rh-01",
    responsavel_id: "u-rh-01",
    participantes: ["u0", "u1"],
    aprovadores: ["u0"],
    data_prazo: future(7).slice(0, 10),
    estimativa_horas: 8,
    checklist: [
      { id: "c1", texto: "Confirmar sala + material", concluido: false },
      { id: "c2", texto: "Convite aos novos", concluido: false },
      { id: "c3", texto: "Avaliação pós-treino", concluido: false },
    ],
    comentarios: [],
    tags: ["treinamento", "onboarding"],
    created_at: days(3),
    updated_at: days(1),
  },
  {
    id: "t-008",
    codigo: "TAR-0008",
    titulo: "Revisar permissões LGPD — novos perfis",
    descricao: "Validar matriz de permissões LGPD para os novos perfis criados em março. Reportar à Jurídica.",
    subtipo: "revisao",
    status: "backlog",
    prioridade: "baixa",
    visibilidade: "envolvidos",
    squad_id: "sq-ti",
    criador_id: "u6",
    responsavel_id: "u6",
    participantes: ["u-rh-01"],
    aprovadores: [],
    data_prazo: future(14).slice(0, 10),
    checklist: [],
    comentarios: [],
    tags: ["lgpd", "compliance"],
    created_at: days(1),
    updated_at: days(1),
  },
  {
    id: "t-009",
    codigo: "TAR-0009",
    titulo: "OS-0042 — Troca bomba escorregão kids",
    descricao: "Motor queimou. Fornecedor confirmou envio da peça para amanhã. Bloqueia reabertura da atração.",
    subtipo: "os",
    status: "em_andamento",
    prioridade: "critica",
    visibilidade: "squad",
    squad_id: "sq-ops",
    criador_id: "u-ops-02",
    responsavel_id: "u-ops-02",
    participantes: ["u-ops-01"],
    aprovadores: ["u-ops-01"],
    origem: { tipo: "os", id: "os-0042", label: "OS-0042" },
    data_prazo: amanhaTarefas,
    estimativa_horas: 6,
    horas_gastas: 2,
    checklist: [
      { id: "c1", texto: "Isolar atração", concluido: true },
      { id: "c2", texto: "Receber peça (fornecedor)", concluido: false },
      { id: "c3", texto: "Instalar e testar", concluido: false },
      { id: "c4", texto: "Liberação segurança", concluido: false },
    ],
    comentarios: [],
    tags: ["critica", "manutencao"],
    created_at: days(2),
    updated_at: hours(3),
  },
  {
    id: "t-010",
    codigo: "TAR-0010",
    titulo: "Plano de retenção Q2 — apresentar em reunião",
    descricao: "Consolidar proposta de retenção para renovações Q2 e apresentar na reunião semanal comercial.",
    subtipo: "generica",
    status: "em_andamento",
    prioridade: "alta",
    visibilidade: "squad",
    squad_id: "sq-comercial",
    criador_id: "u0",
    responsavel_id: "u1",
    participantes: ["u-mkt-01"],
    aprovadores: ["u0"],
    data_prazo: future(2).slice(0, 10),
    estimativa_horas: 10,
    horas_gastas: 4,
    checklist: [
      { id: "c1", texto: "Cohort de renovação Q1", concluido: true },
      { id: "c2", texto: "Proposta de cashback", concluido: true },
      { id: "c3", texto: "Slides finais", concluido: false },
    ],
    comentarios: [
      { id: "cm1", autor_id: "u0", texto: "Marcos, foco no cashback. Operamos com margem apertada, precisa ser cirúrgico.", created_at: days(1) },
    ],
    tags: ["retencao", "q2"],
    created_at: days(5),
    updated_at: hours(12),
  },
  {
    id: "t-011",
    codigo: "TAR-0011",
    titulo: "Ticket escalado #3201 — cliente Vanessa",
    descricao: "Cliente reclamou de atendimento e pede reembolso parcial. Escalar com supervisão comercial.",
    subtipo: "generica",
    status: "aguardando",
    prioridade: "alta",
    visibilidade: "envolvidos",
    squad_id: "sq-sac",
    criador_id: "u5",
    responsavel_id: "u5",
    participantes: ["u1", "u-fin-01"],
    aprovadores: ["u0"],
    origem: { tipo: "ticket", id: "t3201", label: "Ticket #3201" },
    data_prazo: amanhaTarefas,
    checklist: [
      { id: "c1", texto: "Ouvir gravação do atendimento", concluido: true },
      { id: "c2", texto: "Proposta de reembolso 30%", concluido: true },
      { id: "c3", texto: "Aprovação financeiro", concluido: false },
    ],
    comentarios: [],
    tags: ["escalado", "reembolso"],
    created_at: days(1),
    updated_at: hours(2),
  },
  {
    id: "t-012",
    codigo: "TAR-0012",
    titulo: "Ligação agendada — Cliente VIP (Eduardo Pacheco)",
    descricao: "Cliente pediu call para renegociar plano corporativo.",
    subtipo: "ligacao",
    status: "a_fazer",
    prioridade: "alta",
    visibilidade: "privada",
    squad_id: "sq-comercial",
    criador_id: "c1",
    responsavel_id: "c1",
    participantes: [],
    aprovadores: [],
    origem: { tipo: "cliente", id: "cli-0054", label: "Eduardo Pacheco" },
    data_prazo: hojeTarefas,
    estimativa_horas: 0.5,
    checklist: [],
    comentarios: [],
    tags: ["vip", "call"],
    created_at: days(1),
    updated_at: hours(8),
  },
  {
    id: "t-013",
    codigo: "TAR-0013",
    titulo: "Atualizar tabela de preços 2026.2",
    descricao: "Alterar tabela no CRM e site. Validar com comercial antes da publicação.",
    subtipo: "generica",
    status: "backlog",
    prioridade: "normal",
    visibilidade: "envolvidos",
    squad_id: "sq-financeiro",
    criador_id: "u-fin-01",
    responsavel_id: "u-fin-02",
    participantes: ["u0", "u-mkt-01"],
    aprovadores: ["u0"],
    data_prazo: future(10).slice(0, 10),
    checklist: [],
    comentarios: [],
    tags: ["precificacao"],
    created_at: days(2),
    updated_at: days(1),
  },
  {
    id: "t-014",
    codigo: "TAR-0014",
    titulo: "Corrigir bug rota /whatsapp (console.error)",
    descricao: "Erro apareceu no Sentry. Investigar e corrigir.",
    subtipo: "generica",
    status: "em_andamento",
    prioridade: "normal",
    visibilidade: "squad",
    squad_id: "sq-ti",
    criador_id: "u6",
    responsavel_id: "u6",
    participantes: [],
    aprovadores: [],
    data_prazo: future(4).slice(0, 10),
    estimativa_horas: 2,
    horas_gastas: 0.5,
    checklist: [],
    comentarios: [],
    tags: ["bug", "sentry"],
    created_at: days(1),
    updated_at: hours(10),
  },
  {
    id: "t-015",
    codigo: "TAR-0015",
    titulo: "Criar posts semana (Instagram + TikTok)",
    descricao: "Pauta editorial semanal aprovada. Produzir e agendar.",
    subtipo: "entrega",
    status: "em_andamento",
    prioridade: "normal",
    visibilidade: "squad",
    squad_id: "sq-marketing",
    criador_id: "u-mkt-01",
    responsavel_id: "u-mkt-03",
    participantes: ["u-mkt-04"],
    aprovadores: [],
    data_prazo: future(2).slice(0, 10),
    estimativa_horas: 8,
    horas_gastas: 3,
    checklist: [
      { id: "c1", texto: "2 posts parque", concluido: true },
      { id: "c2", texto: "3 reels atrações", concluido: false },
      { id: "c3", texto: "1 carrossel promo", concluido: false },
    ],
    comentarios: [],
    tags: ["social", "conteudo"],
    created_at: days(3),
    updated_at: hours(12),
  },
  {
    id: "t-016",
    codigo: "TAR-0016",
    titulo: "Avaliação de desempenho — corretores Q1",
    descricao: "Rodar avaliação 360 da turma comercial. Reuniões individuais com gestor.",
    subtipo: "generica",
    status: "a_fazer",
    prioridade: "normal",
    visibilidade: "envolvidos",
    squad_id: "sq-rh",
    criador_id: "u-rh-01",
    responsavel_id: "u-rh-01",
    participantes: ["u0", "u1"],
    aprovadores: ["u0"],
    data_prazo: future(12).slice(0, 10),
    checklist: [],
    comentarios: [],
    tags: ["avaliacao"],
    created_at: days(4),
    updated_at: days(2),
  },
  {
    id: "t-017",
    codigo: "TAR-0017",
    titulo: "Segurança — ronda extra fim de semana",
    descricao: "Reforço de ronda após incidente INC-0042. Definir escala.",
    subtipo: "generica",
    status: "concluida",
    prioridade: "alta",
    visibilidade: "squad",
    squad_id: "sq-ops",
    criador_id: "u-ops-01",
    responsavel_id: "u-ops-03",
    participantes: [],
    aprovadores: ["u-ops-01"],
    data_prazo: ontemTarefas,
    data_conclusao: hours(30),
    checklist: [],
    comentarios: [],
    tags: ["seguranca", "post-mortem"],
    created_at: days(3),
    updated_at: hours(30),
  },
  {
    id: "t-018",
    codigo: "TAR-0018",
    titulo: "Contrato fornecedor — química piscinas",
    descricao: "Renovar contrato anual com fornecedor. Negociar 5% desconto.",
    subtipo: "aprovacao",
    status: "aguardando",
    prioridade: "normal",
    visibilidade: "envolvidos",
    squad_id: "sq-ops",
    criador_id: "u-ops-02",
    responsavel_id: "u-ops-01",
    participantes: ["u-fin-01"],
    aprovadores: ["u0"],
    data_prazo: future(5).slice(0, 10),
    checklist: [],
    comentarios: [],
    tags: ["contrato", "fornecedor"],
    created_at: days(2),
    updated_at: days(1),
  },
  {
    id: "t-019",
    codigo: "TAR-0019",
    titulo: "Analisar funnel WhatsApp (última semana)",
    descricao: "Drop-off forte em 'proposta → fechado'. Investigar e reportar.",
    subtipo: "generica",
    status: "a_fazer",
    prioridade: "normal",
    visibilidade: "squad",
    squad_id: "sq-comercial",
    criador_id: "u0",
    responsavel_id: "u1",
    participantes: [],
    aprovadores: [],
    data_prazo: future(3).slice(0, 10),
    checklist: [],
    comentarios: [],
    tags: ["analytics", "funnel"],
    created_at: days(1),
    updated_at: hours(20),
  },
  {
    id: "t-020",
    codigo: "TAR-0020",
    titulo: "Publicar release notes — CRM v1.8",
    descricao: "Compilar mudanças da semana e publicar changelog interno no Aqua Chat #geral.",
    subtipo: "entrega",
    status: "a_fazer",
    prioridade: "baixa",
    visibilidade: "publica",
    squad_id: "sq-ti",
    criador_id: "u6",
    responsavel_id: "u6",
    participantes: [],
    aprovadores: [],
    data_prazo: future(1).slice(0, 10),
    estimativa_horas: 1,
    checklist: [],
    comentarios: [],
    tags: ["release", "changelog"],
    created_at: hours(18),
    updated_at: hours(18),
  },
];

export const tarefaById = (id: string) => tarefas.find((t) => t.id === id);

/* ───────────────────── NOTAS (Meu Espaço) ───────────────────── */

export const notas: Nota[] = [
  {
    id: "n-001",
    titulo: "Playbook de objeções — corretor",
    emoji: "🎯",
    autor_id: "c1",
    visibilidade: "squad",
    squad_id: "sq-comercial",
    compartilhada_com: [],
    links: [],
    blocos: [
      { id: "b1", tipo: "heading", nivel: 1, texto: "Playbook pessoal de objeções" },
      { id: "b2", tipo: "texto", markdown: "Lista das objeções mais comuns que recebo via WhatsApp + resposta que mais converte." },
      { id: "b3", tipo: "heading", nivel: 2, texto: "Preço alto" },
      { id: "b4", tipo: "texto", markdown: "Reenquadrar: custo por dia de acesso (R$ 1299 / 365 = R$ 3,56 por dia). Mostrar comparação com parque avulso." },
      { id: "b5", tipo: "heading", nivel: 2, texto: "\"Vou pensar\"" },
      { id: "b6", tipo: "texto", markdown: "Marcar follow-up com gatilho: promoção termina em X dias, ou atração nova abrindo. Nunca deixar em aberto." },
      { id: "b7", tipo: "citacao", texto: "Lead que não tem prazo não fecha. — Marcos (supervisor)", autor: "Marcos" },
      { id: "b8", tipo: "heading", nivel: 2, texto: "Concorrente" },
      { id: "b9", tipo: "checklist", itens: [
        { id: "i1", texto: "Perguntar quem é o concorrente citado", concluido: true },
        { id: "i2", texto: "Listar 3 diferenciais Valparaíso", concluido: true },
        { id: "i3", texto: "Oferecer day-pass experimental", concluido: false },
      ]},
    ],
    tags: ["playbook", "objeções"],
    favorita: true,
    fixada: true,
    pasta: "Vendas",
    created_at: days(30),
    updated_at: hours(18),
  },
  {
    id: "n-002",
    titulo: "Reunião 1:1 com Marcos — 15/04",
    emoji: "🗣️",
    autor_id: "c1",
    visibilidade: "privada",
    compartilhada_com: [],
    links: [
      { tipo: "reuniao", id: "reu-op-2", label: "1:1 Comercial 15/04" },
    ],
    blocos: [
      { id: "b1", tipo: "heading", nivel: 1, texto: "1:1 com Marcos — 15/04" },
      { id: "b2", tipo: "heading", nivel: 2, texto: "Pontos discutidos" },
      { id: "b3", tipo: "checklist", itens: [
        { id: "i1", texto: "Feedback de desempenho Q1", concluido: true },
        { id: "i2", texto: "Plano de crescimento para Q2", concluido: true },
        { id: "i3", texto: "Discutir carga de leads VIP", concluido: false },
      ]},
      { id: "b4", tipo: "heading", nivel: 2, texto: "Meu pedido" },
      { id: "b5", tipo: "texto", markdown: "Quero assumir contas corporativas. Marcos topou mas pediu que eu entregasse 110% da meta por 2 meses antes." },
      { id: "b6", tipo: "divisor" },
      { id: "b7", tipo: "heading", nivel: 2, texto: "Próximos passos" },
      { id: "b8", tipo: "texto", markdown: "Próximo 1:1 em 15/05. Revisar meta e progresso." },
    ],
    tags: ["1:1", "carreira"],
    favorita: false,
    fixada: true,
    pasta: "Carreira",
    created_at: days(4),
    updated_at: days(4),
  },
  {
    id: "n-003",
    titulo: "Rascunho — campanha Dia das Mães",
    emoji: "💐",
    autor_id: "u-mkt-01",
    visibilidade: "squad",
    squad_id: "sq-marketing",
    compartilhada_com: ["u0"],
    links: [],
    blocos: [
      { id: "b1", tipo: "heading", nivel: 1, texto: "Dia das Mães 2026 — brainstorm" },
      { id: "b2", tipo: "heading", nivel: 2, texto: "Conceito" },
      { id: "b3", tipo: "texto", markdown: "Foco em **experiência compartilhada** — família junto, sem tela, sem stress. Storytelling com mães reais do parque." },
      { id: "b4", tipo: "heading", nivel: 2, texto: "Canais" },
      { id: "b5", tipo: "checklist", itens: [
        { id: "i1", texto: "Instagram Reels (3 peças)", concluido: false },
        { id: "i2", texto: "Email com oferta mãe+filho", concluido: false },
        { id: "i3", texto: "Meta Ads (vídeo vertical)", concluido: false },
        { id: "i4", texto: "Landing page dedicada", concluido: false },
      ]},
      { id: "b6", tipo: "heading", nivel: 2, texto: "Budget sugerido" },
      { id: "b7", tipo: "texto", markdown: "R$ 18k de mídia + R$ 4k produção. Discutir com Renata na próxima." },
    ],
    tags: ["campanha", "brainstorm"],
    favorita: true,
    fixada: false,
    pasta: "Campanhas",
    created_at: days(2),
    updated_at: hours(30),
  },
  {
    id: "n-004",
    titulo: "Checklist pré-reunião (template)",
    emoji: "✅",
    autor_id: "u1",
    visibilidade: "equipe",
    compartilhada_com: [],
    links: [],
    blocos: [
      { id: "b1", tipo: "heading", nivel: 1, texto: "Pré-reunião — checklist universal" },
      { id: "b2", tipo: "texto", markdown: "Rodar **antes de qualquer reunião** que eu participar." },
      { id: "b3", tipo: "checklist", itens: [
        { id: "i1", texto: "Pauta enviada 24h antes", concluido: false },
        { id: "i2", texto: "Participantes confirmaram", concluido: false },
        { id: "i3", texto: "Material de apoio preparado", concluido: false },
        { id: "i4", texto: "Objetivo da reunião em 1 frase", concluido: false },
        { id: "i5", texto: "Decisão esperada definida", concluido: false },
      ]},
      { id: "b4", tipo: "citacao", texto: "Reunião sem pauta é conversa cara. — Renata" },
    ],
    tags: ["template", "reuniao"],
    favorita: true,
    fixada: false,
    pasta: "Templates",
    created_at: days(60),
    updated_at: days(10),
  },
  {
    id: "n-005",
    titulo: "Ideias de feature CRM",
    emoji: "💡",
    autor_id: "u6",
    visibilidade: "gestor",
    compartilhada_com: ["u0"],
    links: [],
    blocos: [
      { id: "b1", tipo: "heading", nivel: 1, texto: "Backlog pessoal de ideias" },
      { id: "b2", tipo: "checklist", itens: [
        { id: "i1", texto: "Integrar WhatsApp Business API", concluido: true },
        { id: "i2", texto: "Voice AI para triagem de leads", concluido: true },
        { id: "i3", texto: "Meu Espaço (Notion-like)", concluido: false },
        { id: "i4", texto: "Organograma interativo", concluido: false },
        { id: "i5", texto: "Aprovação em cascata configurável", concluido: false },
      ]},
      { id: "b3", tipo: "divisor" },
      { id: "b4", tipo: "texto", markdown: "Ideias loucas (não priorizadas):" },
      { id: "b5", tipo: "texto", markdown: "- Copilot que sugere desconto no ponto certo da conversa\n- Score de \"risco de cancelamento\" em cada passaporte\n- Simulador de impacto no forecast ao mover lead de etapa" },
    ],
    tags: ["roadmap", "ideias"],
    favorita: false,
    fixada: true,
    pasta: "Produto",
    created_at: days(45),
    updated_at: hours(6),
  },
  {
    id: "n-006",
    titulo: "Anotações — Lead Rafael Oliveira",
    emoji: "📝",
    autor_id: "c1",
    visibilidade: "privada",
    compartilhada_com: [],
    links: [
      { tipo: "lead", id: "l6", label: "Rafael Oliveira" },
      { tipo: "tarefa", id: "t-003", label: "TAR-0003 — Aprovar desconto" },
    ],
    blocos: [
      { id: "b1", tipo: "heading", nivel: 1, texto: "Rafael Oliveira — insights pessoais" },
      { id: "b2", tipo: "texto", markdown: "Cliente sério, decisor rápido. Comprou plano anual no ano passado, renovou no prazo. Mora em bairro de classe média. Leva 2 filhos pequenos." },
      { id: "b3", tipo: "heading", nivel: 2, texto: "O que funciona" },
      { id: "b4", tipo: "checklist", itens: [
        { id: "i1", texto: "Argumentos práticos (evita papo comercial)", concluido: true },
        { id: "i2", texto: "Responder rápido no WhatsApp", concluido: true },
        { id: "i3", texto: "Oferecer algo exclusivo (VIP lane nos finais de semana)", concluido: true },
      ]},
      { id: "b5", tipo: "citacao", texto: "\"Se for bom preço eu fecho hoje.\" — Rafael, última call" },
    ],
    tags: ["lead", "notas-pessoais"],
    favorita: false,
    fixada: false,
    pasta: "Leads",
    created_at: days(7),
    updated_at: days(1),
  },
  {
    id: "n-007",
    titulo: "Incidente INC-0042 — aprendizados",
    emoji: "🚨",
    autor_id: "u-ops-01",
    visibilidade: "squad",
    squad_id: "sq-ops",
    compartilhada_com: ["u0", "u6"],
    links: [
      { tipo: "os", id: "os-0042", label: "OS-0042 — Troca bomba" },
      { tipo: "projeto", id: "proj-op-5", label: "Plano pós-incidente INC-0042" },
    ],
    blocos: [
      { id: "b1", tipo: "heading", nivel: 1, texto: "Post-mortem pessoal — INC-0042" },
      { id: "b2", tipo: "heading", nivel: 2, texto: "O que aconteceu" },
      { id: "b3", tipo: "texto", markdown: "Bomba do escorregão kids queimou durante operação. Ninguém se feriu mas fiquei 4h com atração parada em dia de pico." },
      { id: "b4", tipo: "heading", nivel: 2, texto: "Onde falhei" },
      { id: "b5", tipo: "checklist", itens: [
        { id: "i1", texto: "Não acompanhei checklist de inspeção da semana anterior", concluido: true },
        { id: "i2", texto: "Comunicação com visitantes foi tardia", concluido: true },
        { id: "i3", texto: "Não acionei fornecedor de emergência", concluido: true },
      ]},
      { id: "b6", tipo: "heading", nivel: 2, texto: "O que mudar" },
      { id: "b7", tipo: "texto", markdown: "- Exigir visto físico no checklist semanal\n- Script pronto para evacuação parcial\n- Contrato 24h com fornecedor de peças críticas" },
    ],
    tags: ["post-mortem", "incidente"],
    favorita: true,
    fixada: false,
    pasta: "Operações",
    created_at: days(6),
    updated_at: days(3),
  },
  {
    id: "n-008",
    titulo: "Rascunhos do dia",
    emoji: "📋",
    autor_id: "u0",
    visibilidade: "privada",
    compartilhada_com: [],
    links: [],
    blocos: [
      { id: "b1", tipo: "heading", nivel: 1, texto: "Quick notes" },
      { id: "b2", tipo: "texto", markdown: "Anotações soltas que vou reorganizar depois." },
      { id: "b3", tipo: "checklist", itens: [
        { id: "i1", texto: "Pedir para Carolina rever peças do Dia das Mães", concluido: false },
        { id: "i2", texto: "Ligar para o Beatriz sobre contrato química", concluido: true },
        { id: "i3", texto: "Revisar forecast antes da reunião de sexta", concluido: false },
        { id: "i4", texto: "Comprar presente aniversário da Amanda", concluido: false },
      ]},
      { id: "b4", tipo: "citacao", texto: "O que não tá na nota, não acontece." },
    ],
    tags: ["diário"],
    favorita: false,
    fixada: false,
    created_at: hours(26),
    updated_at: hours(4),
  },
];

export const notaById = (id: string) => notas.find((n) => n.id === id);

/* ───────────────────── MENÇÕES ───────────────────── */

export const mencoes: Mencao[] = [
  {
    id: "m-001",
    origem: "aqua_chat",
    origem_id: "ch-comercial",
    origem_label: "#comercial",
    autor_id: "u1",
    destinatario_id: "c1",
    trecho: "@amanda consegue dar uma olhada no lead da Patrícia hoje? Tá caindo no bucket de sem resposta.",
    url_interno: "/comunicacao?canal=ch-comercial",
    lida: false,
    created_at: hours(2),
  },
  {
    id: "m-002",
    origem: "tarefa",
    origem_id: "t-003",
    origem_label: "TAR-0003 — Aprovar desconto",
    autor_id: "c2",
    destinatario_id: "u1",
    trecho: "@marcos pode aprovar o desconto? Cliente já mandou print do concorrente.",
    url_interno: "/meu-espaco?tarefa=t-003",
    lida: false,
    created_at: hours(3),
  },
  {
    id: "m-003",
    origem: "reuniao",
    origem_id: "reu-op-1",
    origem_label: "Briefing matinal 18/04",
    autor_id: "u-ops-01",
    destinatario_id: "u-ops-02",
    trecho: "Action item: @cleiton fica responsável pela abertura do toboágua depois do reparo.",
    url_interno: "/operacoes?reuniao=reu-op-1",
    lida: true,
    created_at: days(1),
  },
  {
    id: "m-004",
    origem: "comentario",
    origem_id: "t-010",
    origem_label: "TAR-0010 — Plano retenção Q2",
    autor_id: "u0",
    destinatario_id: "u1",
    trecho: "Marcos, foco no cashback. Operamos com margem apertada, precisa ser cirúrgico.",
    url_interno: "/meu-espaco?tarefa=t-010",
    lida: true,
    created_at: days(1),
  },
  {
    id: "m-005",
    origem: "aqua_chat",
    origem_id: "ch-geral",
    origem_label: "#geral",
    autor_id: "u6",
    destinatario_id: "u0",
    trecho: "@renata subi a v1.8 do CRM em produção. Changelog no release notes.",
    url_interno: "/comunicacao?canal=ch-geral",
    lida: false,
    created_at: hours(5),
  },
  {
    id: "m-006",
    origem: "nota",
    origem_id: "n-003",
    origem_label: "Rascunho campanha Dia das Mães",
    autor_id: "u-mkt-01",
    destinatario_id: "u0",
    trecho: "Compartilhou essa nota com você. Veja budget sugerido antes da reunião.",
    url_interno: "/meu-espaco?nota=n-003",
    lida: false,
    created_at: hours(30),
  },
  {
    id: "m-007",
    origem: "tarefa",
    origem_id: "t-007",
    origem_label: "TAR-0007 — Treinamento turma 04",
    autor_id: "u-rh-01",
    destinatario_id: "u1",
    trecho: "@marcos preciso que você participe do dia 1 do treinamento, sessão de script.",
    url_interno: "/meu-espaco?tarefa=t-007",
    lida: false,
    created_at: hours(10),
  },
  {
    id: "m-008",
    origem: "os",
    origem_id: "os-0042",
    origem_label: "OS-0042",
    autor_id: "u-ops-02",
    destinatario_id: "u-ops-01",
    trecho: "Peça confirmada pra amanhã. Se atrasar, acionar fornecedor backup.",
    url_interno: "/operacoes?os=os-0042",
    lida: true,
    created_at: hours(8),
  },
];

export const mencaoById = (id: string) => mencoes.find((m) => m.id === id);
