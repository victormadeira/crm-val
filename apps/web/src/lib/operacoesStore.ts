import { create } from "zustand";
import {
  ordensServico as seedOS,
  projetosOp as seedProj,
  reunioesOp as seedReu,
  rotinaInstancias as seedRotinas,
} from "./mock";
import type {
  OrdemServico,
  OSStatus,
  OSPrioridade,
  OSTipo,
  OSChecklistItem,
  OSComentario,
  ProjetoOp,
  ProjetoOpStatus,
  ReuniaoOp,
  ActionItemOp,
  RotinaInstancia,
} from "./types";

const uid = (pref: string) =>
  `${pref}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const nowISO = () => new Date().toISOString();

/* ═══════════════════════════ OS STORE ═══════════════════════════ */

export interface NovaOSInput {
  titulo: string;
  descricao?: string;
  tipo: OSTipo;
  prioridade: OSPrioridade;
  setor: string;
  atracao_id?: string;
  projeto_id?: string;
  responsavel_id?: string;
  solicitante_id: string;
  agendado_para?: string;
  horas_estimadas?: number;
  custo_estimado?: number;
  fornecedor?: string;
  afeta_seguranca?: boolean;
  bloqueia_abertura?: boolean;
  checklist?: { texto: string; obrigatorio?: boolean }[];
  tags?: string[];
}

interface OSStore {
  items: OrdemServico[];
  createOS: (input: NovaOSInput) => OrdemServico;
  updateOS: (id: string, patch: Partial<OrdemServico>) => void;
  setStatus: (id: string, status: OSStatus) => void;
  toggleChecklistItem: (osId: string, itemId: string) => void;
  addChecklistItem: (osId: string, texto: string, obrigatorio?: boolean) => void;
  removeChecklistItem: (osId: string, itemId: string) => void;
  addComentario: (osId: string, autorId: string, texto: string) => void;
  deleteOS: (id: string) => void;
}

const osCounter = { n: 42 };

export const useOSStore = create<OSStore>((set) => ({
  items: [...seedOS],
  createOS: (input) => {
    osCounter.n += 1;
    const nova: OrdemServico = {
      id: uid("os"),
      codigo: `OS-${String(10000 + osCounter.n).padStart(5, "0")}`,
      titulo: input.titulo,
      descricao: input.descricao,
      tipo: input.tipo,
      status: "solicitado",
      prioridade: input.prioridade,
      setor: input.setor,
      atracao_id: input.atracao_id,
      projeto_id: input.projeto_id,
      responsavel_id: input.responsavel_id,
      solicitante_id: input.solicitante_id,
      fornecedor: input.fornecedor,
      criado_em: nowISO(),
      agendado_para: input.agendado_para,
      horas_estimadas: input.horas_estimadas,
      custo_estimado: input.custo_estimado,
      afeta_seguranca: input.afeta_seguranca,
      bloqueia_abertura: input.bloqueia_abertura,
      tags: input.tags,
      checklist: input.checklist?.map((c) => ({
        id: uid("c"),
        texto: c.texto,
        feito: false,
        obrigatorio: c.obrigatorio,
      })),
      comentarios: [],
    };
    set((s) => ({ items: [nova, ...s.items] }));
    return nova;
  },
  updateOS: (id, patch) =>
    set((s) => ({
      items: s.items.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),
  setStatus: (id, status) =>
    set((s) => ({
      items: s.items.map((o) => {
        if (o.id !== id) return o;
        const patch: Partial<OrdemServico> = { status };
        const t = nowISO();
        if (status === "em_execucao" && !o.iniciado_em) patch.iniciado_em = t;
        if (status === "concluido" && !o.concluido_em) patch.concluido_em = t;
        return { ...o, ...patch };
      }),
    })),
  toggleChecklistItem: (osId, itemId) =>
    set((s) => ({
      items: s.items.map((o) => {
        if (o.id !== osId || !o.checklist) return o;
        return {
          ...o,
          checklist: o.checklist.map((c) =>
            c.id === itemId ? { ...c, feito: !c.feito } : c
          ),
        };
      }),
    })),
  addChecklistItem: (osId, texto, obrigatorio) =>
    set((s) => ({
      items: s.items.map((o) => {
        if (o.id !== osId) return o;
        const novo: OSChecklistItem = {
          id: uid("c"),
          texto,
          feito: false,
          obrigatorio,
        };
        return { ...o, checklist: [...(o.checklist ?? []), novo] };
      }),
    })),
  removeChecklistItem: (osId, itemId) =>
    set((s) => ({
      items: s.items.map((o) => {
        if (o.id !== osId || !o.checklist) return o;
        return { ...o, checklist: o.checklist.filter((c) => c.id !== itemId) };
      }),
    })),
  addComentario: (osId, autorId, texto) =>
    set((s) => ({
      items: s.items.map((o) => {
        if (o.id !== osId) return o;
        const novo: OSComentario = {
          id: uid("cm"),
          autor_id: autorId,
          texto,
          timestamp: nowISO(),
        };
        return { ...o, comentarios: [...(o.comentarios ?? []), novo] };
      }),
    })),
  deleteOS: (id) =>
    set((s) => ({ items: s.items.filter((o) => o.id !== id) })),
}));

/* ═══════════════════════════ PROJETOS STORE ═══════════════════════════ */

export interface NovoProjetoInput {
  titulo: string;
  descricao?: string;
  setor: string;
  responsavel_id: string;
  membros: string[];
  prioridade: OSPrioridade;
  data_inicio: string;
  data_fim_prevista: string;
  orcamento_estimado?: number;
  privado?: boolean;
  cor: ProjetoOp["cor"];
  marcos?: { titulo: string; data: string }[];
}

interface ProjetosStore {
  items: ProjetoOp[];
  createProjeto: (input: NovoProjetoInput) => ProjetoOp;
  updateProjeto: (id: string, patch: Partial<ProjetoOp>) => void;
  setStatus: (id: string, status: ProjetoOpStatus) => void;
  toggleMarco: (projetoId: string, marcoId: string) => void;
  addMarco: (projetoId: string, titulo: string, data: string) => void;
  removeMarco: (projetoId: string, marcoId: string) => void;
  deleteProjeto: (id: string) => void;
}

const projCounter = { n: 5 };

export const useProjetosStore = create<ProjetosStore>((set) => ({
  items: [...seedProj],
  createProjeto: (input) => {
    projCounter.n += 1;
    const novo: ProjetoOp = {
      id: uid("proj"),
      codigo: `PROJ-${String(projCounter.n).padStart(3, "0")}`,
      titulo: input.titulo,
      descricao: input.descricao,
      status: "planejamento",
      prioridade: input.prioridade,
      setor: input.setor,
      responsavel_id: input.responsavel_id,
      membros: input.membros.length
        ? input.membros
        : [input.responsavel_id],
      data_inicio: input.data_inicio,
      data_fim_prevista: input.data_fim_prevista,
      orcamento_estimado: input.orcamento_estimado,
      privado: input.privado,
      cor: input.cor,
      marcos: input.marcos?.map((m) => ({
        id: uid("m"),
        titulo: m.titulo,
        data: m.data,
        feito: false,
      })),
    };
    set((s) => ({ items: [novo, ...s.items] }));
    return novo;
  },
  updateProjeto: (id, patch) =>
    set((s) => ({
      items: s.items.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  setStatus: (id, status) =>
    set((s) => ({
      items: s.items.map((p) => {
        if (p.id !== id) return p;
        const patch: Partial<ProjetoOp> = { status };
        if (status === "concluido") patch.data_fim_real = nowISO();
        return { ...p, ...patch };
      }),
    })),
  toggleMarco: (projetoId, marcoId) =>
    set((s) => ({
      items: s.items.map((p) => {
        if (p.id !== projetoId || !p.marcos) return p;
        return {
          ...p,
          marcos: p.marcos.map((m) =>
            m.id === marcoId ? { ...m, feito: !m.feito } : m
          ),
        };
      }),
    })),
  addMarco: (projetoId, titulo, data) =>
    set((s) => ({
      items: s.items.map((p) => {
        if (p.id !== projetoId) return p;
        return {
          ...p,
          marcos: [
            ...(p.marcos ?? []),
            { id: uid("m"), titulo, data, feito: false },
          ],
        };
      }),
    })),
  removeMarco: (projetoId, marcoId) =>
    set((s) => ({
      items: s.items.map((p) => {
        if (p.id !== projetoId || !p.marcos) return p;
        return { ...p, marcos: p.marcos.filter((m) => m.id !== marcoId) };
      }),
    })),
  deleteProjeto: (id) =>
    set((s) => ({ items: s.items.filter((p) => p.id !== id) })),
}));

/* ═══════════════════════════ REUNIÕES STORE ═══════════════════════════ */

export interface NovaReuniaoInput {
  titulo: string;
  tipo: ReuniaoOp["tipo"];
  data_hora_inicio: string;
  data_hora_fim: string;
  local: string;
  link_online?: string;
  organizador_id: string;
  projeto_id?: string;
  recorrente: boolean;
  frequencia?: ReuniaoOp["frequencia"];
  participantes: string[];
  pauta?: { titulo: string; duracao_min: number; responsavel_id?: string }[];
}

interface ReunioesStore {
  items: ReuniaoOp[];
  createReuniao: (input: NovaReuniaoInput) => ReuniaoOp;
  updateReuniao: (id: string, patch: Partial<ReuniaoOp>) => void;
  setConfirmacao: (
    reuId: string,
    userId: string,
    conf: "pendente" | "confirmado" | "recusado" | "talvez"
  ) => void;
  encerrarReuniao: (id: string, ata?: string, decisoes?: string) => void;
  gerarResumoIA: (id: string) => void;
  setPautaStatus: (
    reuId: string,
    pautaId: string,
    status: "pendente" | "discutido" | "adiado",
    resultado?: string
  ) => void;
  addActionItem: (
    reuId: string,
    titulo: string,
    responsavelId: string,
    prazo: string
  ) => ActionItemOp;
  marcarActionItemConvertido: (
    reuId: string,
    aiId: string,
    osId: string
  ) => void;
  setActionItemStatus: (
    reuId: string,
    aiId: string,
    status: ActionItemOp["status"]
  ) => void;
  deleteReuniao: (id: string) => void;
}

const reuCounter = { n: 15 };
const aiCounter = { n: 19 };

export const useReunioesStore = create<ReunioesStore>((set) => ({
  items: [...seedReu],
  createReuniao: (input) => {
    reuCounter.n += 1;
    const nova: ReuniaoOp = {
      id: uid("reu"),
      codigo: `REU-${String(reuCounter.n).padStart(4, "0")}`,
      titulo: input.titulo,
      tipo: input.tipo,
      status: "agendada",
      data_hora_inicio: input.data_hora_inicio,
      data_hora_fim: input.data_hora_fim,
      local: input.local,
      link_online: input.link_online,
      organizador_id: input.organizador_id,
      projeto_id: input.projeto_id,
      recorrente: input.recorrente,
      frequencia: input.frequencia,
      pauta:
        input.pauta?.map((p, i) => ({
          id: uid("p"),
          ordem: i + 1,
          titulo: p.titulo,
          duracao_min: p.duracao_min,
          responsavel_id: p.responsavel_id,
          status: "pendente",
        })) ?? [],
      participantes: input.participantes.map((uid) => ({
        user_id: uid,
        confirmacao: uid === input.organizador_id ? "confirmado" : "pendente",
        presente: false,
        role: uid === input.organizador_id ? "organizador" : "participante",
      })),
      action_items: [],
    };
    set((s) => ({ items: [nova, ...s.items] }));
    return nova;
  },
  updateReuniao: (id, patch) =>
    set((s) => ({
      items: s.items.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  setConfirmacao: (reuId, userId, conf) =>
    set((s) => ({
      items: s.items.map((r) => {
        if (r.id !== reuId) return r;
        return {
          ...r,
          participantes: r.participantes.map((p) =>
            p.user_id === userId ? { ...p, confirmacao: conf } : p
          ),
        };
      }),
    })),
  encerrarReuniao: (id, ata, decisoes) =>
    set((s) => ({
      items: s.items.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          status: "realizada",
          ata: ata ?? r.ata,
          decisoes: decisoes ?? r.decisoes,
          participantes: r.participantes.map((p) => ({
            ...p,
            presente: p.confirmacao === "confirmado" ? true : p.presente,
          })),
        };
      }),
    })),
  gerarResumoIA: (id) =>
    set((s) => ({
      items: s.items.map((r) => {
        if (r.id !== id) return r;
        const itens = r.pauta
          .map((p) => `• ${p.titulo}${p.resultado ? ` — ${p.resultado}` : ""}`)
          .join("\n");
        const resumo = [
          `Reunião "${r.titulo}" (${r.tipo.replace("_", " ")}) realizada em ${new Date(r.data_hora_inicio).toLocaleDateString("pt-BR")} no local ${r.local}.`,
          ``,
          `Principais pontos discutidos:`,
          itens,
          ``,
          r.decisoes
            ? `Decisões registradas: ${r.decisoes}`
            : `Sem decisões formais registradas.`,
          r.action_items.length
            ? `${r.action_items.length} action item(s) gerado(s) — ver aba correspondente.`
            : `Nenhum action item gerado.`,
        ].join("\n");
        return { ...r, resumo_ai: resumo };
      }),
    })),
  setPautaStatus: (reuId, pautaId, status, resultado) =>
    set((s) => ({
      items: s.items.map((r) => {
        if (r.id !== reuId) return r;
        return {
          ...r,
          pauta: r.pauta.map((p) =>
            p.id === pautaId
              ? { ...p, status, resultado: resultado ?? p.resultado }
              : p
          ),
        };
      }),
    })),
  addActionItem: (reuId, titulo, responsavelId, prazo) => {
    aiCounter.n += 1;
    const ai: ActionItemOp = {
      id: uid("ai"),
      codigo: `AI-${String(aiCounter.n).padStart(4, "0")}`,
      titulo,
      responsavel_id: responsavelId,
      prazo,
      status: "pendente",
    };
    set((s) => ({
      items: s.items.map((r) =>
        r.id === reuId
          ? { ...r, action_items: [...r.action_items, ai] }
          : r
      ),
    }));
    return ai;
  },
  marcarActionItemConvertido: (reuId, aiId, osId) =>
    set((s) => ({
      items: s.items.map((r) => {
        if (r.id !== reuId) return r;
        return {
          ...r,
          action_items: r.action_items.map((ai) =>
            ai.id === aiId
              ? { ...ai, convertido_em_os: osId, status: "em_andamento" }
              : ai
          ),
        };
      }),
    })),
  setActionItemStatus: (reuId, aiId, status) =>
    set((s) => ({
      items: s.items.map((r) => {
        if (r.id !== reuId) return r;
        return {
          ...r,
          action_items: r.action_items.map((ai) =>
            ai.id === aiId ? { ...ai, status } : ai
          ),
        };
      }),
    })),
  deleteReuniao: (id) =>
    set((s) => ({ items: s.items.filter((r) => r.id !== id) })),
}));

/* ═══════════════════════════ ROTINAS STORE ═══════════════════════════ */

interface RotinasStore {
  items: RotinaInstancia[];
  toggleChecklistItem: (instanciaId: string, itemId: string) => void;
  setObservacao: (instanciaId: string, obs: string) => void;
}

export const useRotinasStore = create<RotinasStore>((set) => ({
  items: [...seedRotinas],
  toggleChecklistItem: (instanciaId, itemId) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.id !== instanciaId) return i;
        const jaFeito = i.checklist_feitos.includes(itemId);
        const novos = jaFeito
          ? i.checklist_feitos.filter((x) => x !== itemId)
          : [...i.checklist_feitos, itemId];
        return {
          ...i,
          checklist_feitos: novos,
          iniciada_em: i.iniciada_em ?? nowISO(),
        };
      }),
    })),
  setObservacao: (instanciaId, obs) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.id === instanciaId ? { ...i, observacao: obs } : i
      ),
    })),
}));
