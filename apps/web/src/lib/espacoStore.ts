import { create } from "zustand";
import {
  notas as seedNotas,
  tarefas as seedTarefas,
  mencoes as seedMencoes,
} from "./mock";
import type {
  Nota,
  NotaBloco,
  NotaVisibilidade,
  NotaLink,
  Tarefa,
  TarefaStatus,
  TarefaComentario,
  TarefaChecklistItem,
  Mencao,
} from "./types";

const uid = (pref: string) =>
  `${pref}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* ───────────── NOTAS ───────────── */

type NotaBlocoInput =
  | { tipo: "heading"; nivel: 1 | 2 | 3; texto: string }
  | { tipo: "texto"; markdown: string }
  | { tipo: "checklist"; itens?: { texto: string; concluido: boolean }[] }
  | { tipo: "citacao"; texto: string; autor?: string }
  | { tipo: "codigo"; linguagem?: string; codigo: string }
  | { tipo: "divisor" };

interface NotasState {
  notas: Nota[];
  createNota: (autorId: string, partial?: Partial<Nota>) => string;
  deleteNota: (id: string) => void;
  updateNotaMeta: (id: string, patch: Partial<Omit<Nota, "id" | "blocos">>) => void;
  setBlocos: (id: string, blocos: NotaBloco[]) => void;
  addBloco: (noteId: string, input: NotaBlocoInput, afterBlocoId?: string) => string;
  updateBloco: (noteId: string, blocoId: string, patch: Partial<NotaBloco>) => void;
  removeBloco: (noteId: string, blocoId: string) => void;
  moveBloco: (noteId: string, blocoId: string, direction: "up" | "down") => void;
  toggleChecklistItem: (noteId: string, blocoId: string, itemId: string) => void;
  addChecklistItem: (noteId: string, blocoId: string, texto: string) => void;
  removeChecklistItem: (noteId: string, blocoId: string, itemId: string) => void;
  updateChecklistItemText: (
    noteId: string,
    blocoId: string,
    itemId: string,
    texto: string
  ) => void;
  toggleStar: (id: string) => void;
  togglePin: (id: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  addLink: (id: string, link: NotaLink) => void;
  removeLink: (id: string, index: number) => void;
  setVisibilidade: (id: string, vis: NotaVisibilidade, squadId?: string) => void;
  shareWith: (id: string, userId: string) => void;
  unshareWith: (id: string, userId: string) => void;
}

function buildBloco(input: NotaBlocoInput): NotaBloco {
  const id = uid("b");
  switch (input.tipo) {
    case "heading":
      return { id, tipo: "heading", nivel: input.nivel, texto: input.texto };
    case "texto":
      return { id, tipo: "texto", markdown: input.markdown };
    case "checklist":
      return {
        id,
        tipo: "checklist",
        itens: (input.itens ?? [{ texto: "", concluido: false }]).map((i) => ({
          id: uid("i"),
          texto: i.texto,
          concluido: i.concluido,
        })),
      };
    case "citacao":
      return { id, tipo: "citacao", texto: input.texto, autor: input.autor };
    case "codigo":
      return { id, tipo: "codigo", linguagem: input.linguagem, codigo: input.codigo };
    case "divisor":
      return { id, tipo: "divisor" };
  }
}

export const useNotasStore = create<NotasState>((set, get) => ({
  notas: [...seedNotas],

  createNota: (autorId, partial) => {
    const id = uid("n");
    const now = new Date().toISOString();
    const nota: Nota = {
      id,
      titulo: partial?.titulo ?? "Nova nota",
      emoji: partial?.emoji ?? "📝",
      autor_id: autorId,
      visibilidade: partial?.visibilidade ?? "privada",
      squad_id: partial?.squad_id,
      compartilhada_com: partial?.compartilhada_com ?? [],
      links: partial?.links ?? [],
      blocos: partial?.blocos ?? [
        buildBloco({ tipo: "texto", markdown: "" }),
      ],
      tags: partial?.tags ?? [],
      favorita: false,
      fixada: false,
      pasta: partial?.pasta,
      created_at: now,
      updated_at: now,
    };
    set({ notas: [nota, ...get().notas] });
    return id;
  },

  deleteNota: (id) =>
    set({ notas: get().notas.filter((n) => n.id !== id) }),

  updateNotaMeta: (id, patch) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n
      ),
    }),

  setBlocos: (id, blocos) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id ? { ...n, blocos, updated_at: new Date().toISOString() } : n
      ),
    }),

  addBloco: (noteId, input, afterBlocoId) => {
    const novo = buildBloco(input);
    set({
      notas: get().notas.map((n) => {
        if (n.id !== noteId) return n;
        let blocos: NotaBloco[];
        if (afterBlocoId) {
          const idx = n.blocos.findIndex((b) => b.id === afterBlocoId);
          blocos = [...n.blocos];
          blocos.splice(idx + 1, 0, novo);
        } else {
          blocos = [...n.blocos, novo];
        }
        return { ...n, blocos, updated_at: new Date().toISOString() };
      }),
    });
    return novo.id;
  },

  updateBloco: (noteId, blocoId, patch) =>
    set({
      notas: get().notas.map((n) =>
        n.id === noteId
          ? {
              ...n,
              blocos: n.blocos.map((b) =>
                b.id === blocoId ? ({ ...b, ...patch } as NotaBloco) : b
              ),
              updated_at: new Date().toISOString(),
            }
          : n
      ),
    }),

  removeBloco: (noteId, blocoId) =>
    set({
      notas: get().notas.map((n) =>
        n.id === noteId
          ? {
              ...n,
              blocos: n.blocos.filter((b) => b.id !== blocoId),
              updated_at: new Date().toISOString(),
            }
          : n
      ),
    }),

  moveBloco: (noteId, blocoId, direction) =>
    set({
      notas: get().notas.map((n) => {
        if (n.id !== noteId) return n;
        const idx = n.blocos.findIndex((b) => b.id === blocoId);
        if (idx === -1) return n;
        const target = direction === "up" ? idx - 1 : idx + 1;
        if (target < 0 || target >= n.blocos.length) return n;
        const blocos = [...n.blocos];
        [blocos[idx], blocos[target]] = [blocos[target], blocos[idx]];
        return { ...n, blocos, updated_at: new Date().toISOString() };
      }),
    }),

  toggleChecklistItem: (noteId, blocoId, itemId) =>
    set({
      notas: get().notas.map((n) => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          blocos: n.blocos.map((b) => {
            if (b.id !== blocoId || b.tipo !== "checklist") return b;
            return {
              ...b,
              itens: b.itens.map((i) =>
                i.id === itemId ? { ...i, concluido: !i.concluido } : i
              ),
            };
          }),
          updated_at: new Date().toISOString(),
        };
      }),
    }),

  addChecklistItem: (noteId, blocoId, texto) =>
    set({
      notas: get().notas.map((n) => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          blocos: n.blocos.map((b) => {
            if (b.id !== blocoId || b.tipo !== "checklist") return b;
            return {
              ...b,
              itens: [...b.itens, { id: uid("i"), texto, concluido: false }],
            };
          }),
          updated_at: new Date().toISOString(),
        };
      }),
    }),

  removeChecklistItem: (noteId, blocoId, itemId) =>
    set({
      notas: get().notas.map((n) => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          blocos: n.blocos.map((b) => {
            if (b.id !== blocoId || b.tipo !== "checklist") return b;
            return { ...b, itens: b.itens.filter((i) => i.id !== itemId) };
          }),
          updated_at: new Date().toISOString(),
        };
      }),
    }),

  updateChecklistItemText: (noteId, blocoId, itemId, texto) =>
    set({
      notas: get().notas.map((n) => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          blocos: n.blocos.map((b) => {
            if (b.id !== blocoId || b.tipo !== "checklist") return b;
            return {
              ...b,
              itens: b.itens.map((i) => (i.id === itemId ? { ...i, texto } : i)),
            };
          }),
          updated_at: new Date().toISOString(),
        };
      }),
    }),

  toggleStar: (id) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id ? { ...n, favorita: !n.favorita, updated_at: new Date().toISOString() } : n
      ),
    }),

  togglePin: (id) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id ? { ...n, fixada: !n.fixada, updated_at: new Date().toISOString() } : n
      ),
    }),

  addTag: (id, tag) => {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    set({
      notas: get().notas.map((n) =>
        n.id === id && !n.tags.includes(clean)
          ? { ...n, tags: [...n.tags, clean], updated_at: new Date().toISOString() }
          : n
      ),
    });
  },

  removeTag: (id, tag) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id
          ? { ...n, tags: n.tags.filter((t) => t !== tag), updated_at: new Date().toISOString() }
          : n
      ),
    }),

  addLink: (id, link) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id ? { ...n, links: [...n.links, link], updated_at: new Date().toISOString() } : n
      ),
    }),

  removeLink: (id, index) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id
          ? { ...n, links: n.links.filter((_, i) => i !== index), updated_at: new Date().toISOString() }
          : n
      ),
    }),

  setVisibilidade: (id, vis, squadId) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id
          ? { ...n, visibilidade: vis, squad_id: squadId ?? n.squad_id, updated_at: new Date().toISOString() }
          : n
      ),
    }),

  shareWith: (id, userId) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id && !n.compartilhada_com.includes(userId)
          ? {
              ...n,
              compartilhada_com: [...n.compartilhada_com, userId],
              updated_at: new Date().toISOString(),
            }
          : n
      ),
    }),

  unshareWith: (id, userId) =>
    set({
      notas: get().notas.map((n) =>
        n.id === id
          ? {
              ...n,
              compartilhada_com: n.compartilhada_com.filter((u) => u !== userId),
              updated_at: new Date().toISOString(),
            }
          : n
      ),
    }),
}));

/* ───────────── TAREFAS ───────────── */

interface TarefasState {
  tarefas: Tarefa[];
  createTarefa: (criadorId: string, partial?: Partial<Tarefa>) => string;
  deleteTarefa: (id: string) => void;
  setStatus: (id: string, status: TarefaStatus) => void;
  toggleChecklistItem: (id: string, itemId: string) => void;
  addChecklistItem: (id: string, texto: string) => void;
  addComentario: (id: string, autorId: string, texto: string) => void;
  concluir: (id: string) => void;
  aprovar: (id: string, aprovadorId: string) => void;
  reprovar: (id: string) => void;
}

export const useTarefasStore = create<TarefasState>((set, get) => ({
  tarefas: [...seedTarefas],

  createTarefa: (criadorId, partial) => {
    const id = uid("t");
    const codigo = `TAR-${String(get().tarefas.length + 1).padStart(4, "0")}`;
    const now = new Date().toISOString();
    const t: Tarefa = {
      id,
      codigo,
      titulo: partial?.titulo ?? "Nova tarefa",
      descricao: partial?.descricao ?? "",
      subtipo: partial?.subtipo ?? "generica",
      status: partial?.status ?? "a_fazer",
      prioridade: partial?.prioridade ?? "normal",
      visibilidade: partial?.visibilidade ?? "squad",
      squad_id: partial?.squad_id ?? "sq-comercial",
      criador_id: criadorId,
      responsavel_id: partial?.responsavel_id ?? criadorId,
      participantes: partial?.participantes ?? [],
      aprovadores: partial?.aprovadores ?? [],
      origem: partial?.origem,
      data_prazo: partial?.data_prazo,
      data_inicio: partial?.data_inicio,
      data_conclusao: partial?.data_conclusao,
      estimativa_horas: partial?.estimativa_horas,
      horas_gastas: partial?.horas_gastas,
      checklist: partial?.checklist ?? [],
      comentarios: partial?.comentarios ?? [],
      tags: partial?.tags ?? [],
      bloqueia: partial?.bloqueia,
      created_at: now,
      updated_at: now,
    };
    set({ tarefas: [t, ...get().tarefas] });
    return id;
  },

  deleteTarefa: (id) =>
    set({ tarefas: get().tarefas.filter((t) => t.id !== id) }),

  setStatus: (id, status) =>
    set({
      tarefas: get().tarefas.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              data_conclusao:
                status === "concluida" ? new Date().toISOString() : t.data_conclusao,
              updated_at: new Date().toISOString(),
            }
          : t
      ),
    }),

  toggleChecklistItem: (id, itemId) =>
    set({
      tarefas: get().tarefas.map((t) =>
        t.id === id
          ? {
              ...t,
              checklist: t.checklist.map((c) =>
                c.id === itemId ? { ...c, concluido: !c.concluido } : c
              ),
              updated_at: new Date().toISOString(),
            }
          : t
      ),
    }),

  addChecklistItem: (id, texto) => {
    const novo: TarefaChecklistItem = { id: uid("ci"), texto, concluido: false };
    set({
      tarefas: get().tarefas.map((t) =>
        t.id === id
          ? {
              ...t,
              checklist: [...t.checklist, novo],
              updated_at: new Date().toISOString(),
            }
          : t
      ),
    });
  },

  addComentario: (id, autorId, texto) => {
    const c: TarefaComentario = {
      id: uid("cm"),
      autor_id: autorId,
      texto,
      created_at: new Date().toISOString(),
    };
    set({
      tarefas: get().tarefas.map((t) =>
        t.id === id
          ? {
              ...t,
              comentarios: [...t.comentarios, c],
              updated_at: new Date().toISOString(),
            }
          : t
      ),
    });
  },

  concluir: (id) =>
    set({
      tarefas: get().tarefas.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "concluida",
              data_conclusao: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : t
      ),
    }),

  aprovar: (_id, _aprovadorId) =>
    set({
      tarefas: get().tarefas.map((t) =>
        t.id === _id
          ? {
              ...t,
              status: "em_andamento",
              updated_at: new Date().toISOString(),
            }
          : t
      ),
    }),

  reprovar: (id) =>
    set({
      tarefas: get().tarefas.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "cancelada",
              updated_at: new Date().toISOString(),
            }
          : t
      ),
    }),
}));

/* ───────────── MENÇÕES ───────────── */

interface MencoesState {
  mencoes: Mencao[];
  marcarLida: (id: string) => void;
  marcarTodasLidas: (destinatarioId: string) => void;
}

export const useMencoesStore = create<MencoesState>((set, get) => ({
  mencoes: [...seedMencoes],
  marcarLida: (id) =>
    set({
      mencoes: get().mencoes.map((m) => (m.id === id ? { ...m, lida: true } : m)),
    }),
  marcarTodasLidas: (destinatarioId) =>
    set({
      mencoes: get().mencoes.map((m) =>
        m.destinatario_id === destinatarioId ? { ...m, lida: true } : m
      ),
    }),
}));
