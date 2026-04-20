import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AtSign,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Code2,
  FileText,
  Filter,
  Flame,
  Folder,
  Globe2,
  GripVertical,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Inbox,
  List,
  ListChecks,
  Lock,
  MessageSquare,
  Minus,
  Pin,
  Plus,
  Quote,
  Search,
  Share2,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Type,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/lib/store";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeTime } from "@/lib/format";
import {
  squads,
  squadById,
  hierarquiaByUser,
  userDisplayName,
  userCargo,
  equipeVisibleTo,
  rotinaInstancias,
  rotinaById,
  atracaoById,
  ordensServico,
  usuarios,
  usuariosExtras,
} from "@/lib/mock";
import { useNotasStore, useTarefasStore, useMencoesStore } from "@/lib/espacoStore";
import type {
  Tarefa,
  TarefaStatus,
  TarefaPrioridade,
  Nota,
  NotaBloco,
  NotaVisibilidade,
  Papel,
  Mencao,
} from "@/lib/types";

/* ───────────────────── HELPERS ───────────────────── */

function mapPersonaToUserId(papel: Papel): string {
  switch (papel) {
    case "gestor":
      return "u0";
    case "supervisor":
      return "u1";
    case "corretor":
      return "c1";
    case "sac":
      return "u5";
    case "admin":
      return "u6";
    default:
      return "u6";
  }
}

const PRIO_TONE: Record<TarefaPrioridade, "rose" | "amber" | "slate" | "sky"> = {
  critica: "rose",
  alta: "amber",
  normal: "slate",
  baixa: "sky",
};
const PRIO_LABEL: Record<TarefaPrioridade, string> = {
  critica: "Crítica",
  alta: "Alta",
  normal: "Normal",
  baixa: "Baixa",
};
const STATUS_TONE: Record<
  TarefaStatus,
  "slate" | "sky" | "brand" | "amber" | "emerald"
> = {
  backlog: "slate",
  a_fazer: "sky",
  em_andamento: "brand",
  aguardando: "amber",
  concluida: "emerald",
  cancelada: "slate",
};
const STATUS_LABEL: Record<TarefaStatus, string> = {
  backlog: "Backlog",
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  aguardando: "Aguardando",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const VIS_ICON: Record<
  NotaVisibilidade,
  React.ComponentType<{ className?: string }>
> = {
  privada: Lock,
  gestor: Users,
  squad: Hash,
  equipe: Globe2,
};
const VIS_LABEL: Record<NotaVisibilidade, string> = {
  privada: "Privada",
  gestor: "Gestor vê",
  squad: "Squad",
  equipe: "Equipe",
};

const EMOJIS = [
  "📝",
  "📌",
  "🎯",
  "💡",
  "🚀",
  "✅",
  "📊",
  "🧠",
  "🔥",
  "⭐",
  "💰",
  "🗣️",
  "📋",
  "📅",
  "🚨",
  "💐",
  "🎉",
  "📈",
  "⚡",
  "🏆",
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const hojeISO = new Date().toISOString().slice(0, 10);

const isOverdue = (prazo?: string, status?: TarefaStatus): boolean => {
  if (!prazo || status === "concluida" || status === "cancelada") return false;
  return prazo < hojeISO;
};

const isDueToday = (prazo?: string): boolean => {
  if (!prazo) return false;
  return prazo === hojeISO;
};

function isVisibleToUser(t: Tarefa, userId: string): boolean {
  if (t.criador_id === userId) return true;
  if (t.responsavel_id === userId) return true;
  if (t.participantes.includes(userId)) return true;
  if (t.aprovadores.includes(userId)) return true;
  const h = hierarquiaByUser(userId);
  if (!h) return false;
  if (t.visibilidade === "publica") return true;
  if (
    t.visibilidade === "squad" &&
    (t.squad_id === h.squad_id || h.squads_secundarias.includes(t.squad_id))
  ) {
    return true;
  }
  const equipe = equipeVisibleTo(userId);
  if (equipe.includes(t.responsavel_id ?? "")) return true;
  if (t.participantes.some((p) => equipe.includes(p))) return true;
  return false;
}

function isNoteVisibleToUser(n: Nota, userId: string): boolean {
  if (n.autor_id === userId) return true;
  if (n.compartilhada_com.includes(userId)) return true;
  const h = hierarquiaByUser(userId);
  if (!h) return false;
  if (n.visibilidade === "equipe") return true;
  if (n.visibilidade === "gestor") {
    const autor = hierarquiaByUser(n.autor_id);
    if (autor?.gestor_id === userId) return true;
    if (equipeVisibleTo(userId).includes(n.autor_id)) return true;
  }
  if (
    n.visibilidade === "squad" &&
    n.squad_id &&
    (n.squad_id === h.squad_id || h.squads_secundarias.includes(n.squad_id))
  ) {
    return true;
  }
  return false;
}

/* ───────────────────── PAGE ───────────────────── */

type TabId = "hoje" | "tarefas" | "notas" | "mencoes";

export function MeuEspaco() {
  const { persona } = useApp();
  if (!persona) return null;
  const currentUserId = mapPersonaToUserId(persona.papel);

  const [tab, setTab] = useState<TabId>("hoje");

  const { tarefas, createTarefa } = useTarefasStore();
  const { notas, createNota } = useNotasStore();
  const { mencoes } = useMencoesStore();

  const visibleTarefas = useMemo(
    () => tarefas.filter((t) => isVisibleToUser(t, currentUserId)),
    [tarefas, currentUserId]
  );
  const visibleNotas = useMemo(
    () => notas.filter((n) => isNoteVisibleToUser(n, currentUserId)),
    [notas, currentUserId]
  );
  const myMencoes = useMemo(
    () => mencoes.filter((m) => m.destinatario_id === currentUserId),
    [mencoes, currentUserId]
  );

  const counts = {
    hoje:
      visibleTarefas.filter((t) => isDueToday(t.data_prazo)).length +
      visibleTarefas.filter((t) => isOverdue(t.data_prazo, t.status)).length,
    tarefas: visibleTarefas.filter(
      (t) => t.status !== "concluida" && t.status !== "cancelada"
    ).length,
    notas: visibleNotas.length,
    mencoes: myMencoes.filter((m) => !m.lida).length,
  };

  const TABS: {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { id: "hoje", label: "Hoje", icon: Sparkles, count: counts.hoje },
    { id: "tarefas", label: "Tarefas", icon: CheckCircle2, count: counts.tarefas },
    { id: "notas", label: "Notas", icon: BookOpen, count: counts.notas },
    { id: "mencoes", label: "Menções", icon: AtSign, count: counts.mencoes },
  ];

  const h = hierarquiaByUser(currentUserId);
  const mySquad = h ? squadById(h.squad_id) : undefined;

  const [pendingNewNoteId, setPendingNewNoteId] = useState<string | null>(null);
  const [pendingNewTarefa, setPendingNewTarefa] = useState(false);

  const handleNew = () => {
    if (tab === "notas") {
      const id = createNota(currentUserId, {
        titulo: "Nova nota",
        emoji: "📝",
        visibilidade: "privada",
      });
      setPendingNewNoteId(id);
    } else if (tab === "tarefas") {
      setPendingNewTarefa(true);
    } else {
      setTab("notas");
      const id = createNota(currentUserId);
      setPendingNewNoteId(id);
    }
  };

  return (
    <>
      <PageHeader
        title="Meu Espaço"
        subtitle={`${persona.nome}${h ? ` · ${h.cargo}` : ""}${
          mySquad ? ` · ${mySquad.nome}` : ""
        }`}
        actions={
          <>
            {counts.mencoes > 0 && (
              <Badge tone="rose" dot>
                {counts.mencoes} menções novas
              </Badge>
            )}
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleNew}
            >
              {tab === "tarefas" ? "Nova tarefa" : "Nova nota"}
            </Button>
          </>
        }
        tabs={<TabBar tabs={TABS} value={tab} onChange={setTab} />}
      />

      <PageContent>
        {tab === "hoje" && (
          <HojeTab userId={currentUserId} tarefas={visibleTarefas} mencoes={myMencoes} />
        )}
        {tab === "tarefas" && (
          <TarefasTab
            userId={currentUserId}
            tarefas={visibleTarefas}
            pendingNew={pendingNewTarefa}
            onPendingNewHandled={() => setPendingNewTarefa(false)}
            onCreate={(partial) => {
              const id = createTarefa(currentUserId, partial);
              return id;
            }}
          />
        )}
        {tab === "notas" && (
          <NotasTab
            userId={currentUserId}
            notas={visibleNotas}
            initialSelectedId={pendingNewNoteId}
            onSelectionApplied={() => setPendingNewNoteId(null)}
          />
        )}
        {tab === "mencoes" && (
          <MencoesTab mencoes={myMencoes} currentUserId={currentUserId} />
        )}
      </PageContent>
    </>
  );
}

/* ───────────────────── TAB BAR ───────────────────── */

function TabBar({
  tabs,
  value,
  onChange,
}: {
  tabs: {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[];
  value: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-100 -mb-5 -mx-0">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "group inline-flex items-center gap-2 px-3 h-10 text-sm font-medium border-b-2 -mb-px transition-colors ring-focus",
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                active ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
              )}
            />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold",
                  active ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────── TAB: HOJE ───────────────────── */

function HojeTab({
  userId,
  tarefas: ts,
  mencoes: ms,
}: {
  userId: string;
  tarefas: Tarefa[];
  mencoes: Mencao[];
}) {
  const atrasadas = ts.filter(
    (t) =>
      isOverdue(t.data_prazo, t.status) &&
      (t.responsavel_id === userId || t.participantes.includes(userId))
  );
  const hoje = ts.filter(
    (t) =>
      isDueToday(t.data_prazo) &&
      t.status !== "concluida" &&
      t.status !== "cancelada" &&
      (t.responsavel_id === userId || t.participantes.includes(userId))
  );
  const aguardandoMim = ts.filter(
    (t) => t.status === "aguardando" && t.aprovadores.includes(userId)
  );
  const mensNaoLidas = ms.filter((m) => !m.lida);

  const rotinasDoDia = rotinaInstancias.filter((r) => r.responsavel_id === userId);
  const osMinhas = ordensServico.filter(
    (o) => o.responsavel_id === userId && o.status !== "concluido"
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KpiCard
          icon={Flame}
          tone="rose"
          label="Atrasadas"
          value={atrasadas.length}
          hint={atrasadas.length ? "precisam de ação" : "nada atrasado"}
        />
        <KpiCard
          icon={Clock}
          tone="brand"
          label="Prazo hoje"
          value={hoje.length}
          hint={`${
            hoje.filter((t) => t.prioridade === "critica" || t.prioridade === "alta")
              .length
          } críticas/altas`}
        />
        <KpiCard
          icon={AtSign}
          tone="amber"
          label="Menções não lidas"
          value={mensNaoLidas.length}
        />
        <KpiCard
          icon={CheckCircle2}
          tone="emerald"
          label="Aguardando minha aprovação"
          value={aguardandoMim.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          title="Prazo hoje"
          subtitle="tarefas que vencem hoje"
          icon={<Clock className="h-4 w-4 text-brand-600" />}
          className="lg:col-span-2"
        >
          {hoje.length === 0 && atrasadas.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Nada urgente por hoje"
              description="Aproveite para cuidar do backlog ou revisar as notas pessoais."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {atrasadas.map((t) => (
                <TarefaRow key={t.id} tarefa={t} atrasada />
              ))}
              {hoje.map((t) => (
                <TarefaRow key={t.id} tarefa={t} />
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Aprovações pendentes"
          subtitle="esperam sua autorização"
          icon={<Sparkles className="h-4 w-4 text-amber-600" />}
        >
          {aguardandoMim.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Sem pendências"
              description="Nenhuma aprovação aguardando você."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {aguardandoMim.map((t) => (
                <TarefaRow key={t.id} tarefa={t} />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {(rotinasDoDia.length > 0 || osMinhas.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rotinasDoDia.length > 0 && (
            <Card
              title="Rotinas do dia"
              subtitle="do operacional"
              icon={<Wrench className="h-4 w-4 text-aqua-600" />}
            >
              <ul className="divide-y divide-slate-100">
                {rotinasDoDia.slice(0, 5).map((ri) => {
                  const r = rotinaById(ri.rotina_id);
                  if (!r) return null;
                  const done = ri.checklist_feitos.length;
                  const total = r.checklist.length;
                  return (
                    <li key={ri.id} className="py-2.5 flex items-center gap-3">
                      <span
                        className={cn(
                          "h-8 w-8 rounded-[10px] inline-flex items-center justify-center",
                          ri.status === "concluida"
                            ? "bg-emerald-50 text-emerald-600"
                            : ri.status === "atrasada"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-aqua-50 text-aqua-600"
                        )}
                      >
                        <Wrench className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {r.titulo}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {done}/{total} · {ri.status}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
          {osMinhas.length > 0 && (
            <Card
              title="Minhas OS abertas"
              subtitle="operações"
              icon={<AlertCircle className="h-4 w-4 text-rose-600" />}
            >
              <ul className="divide-y divide-slate-100">
                {osMinhas.slice(0, 5).map((os) => {
                  const atr = atracaoById(os.atracao_id ?? "");
                  return (
                    <li key={os.id} className="py-2.5 flex items-center gap-3">
                      <Badge
                        tone={os.prioridade === "critica" ? "rose" : "slate"}
                        dot
                      >
                        {os.codigo}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {os.titulo}
                        </div>
                        {atr && (
                          <div className="text-[11px] text-slate-500">{atr.nome}</div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────── TAB: TAREFAS ───────────────────── */

function TarefasTab({
  userId,
  tarefas: ts,
  pendingNew,
  onPendingNewHandled,
  onCreate,
}: {
  userId: string;
  tarefas: Tarefa[];
  pendingNew: boolean;
  onPendingNewHandled: () => void;
  onCreate: (partial: Partial<Tarefa>) => string;
}) {
  const [filterSquad, setFilterSquad] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<TarefaStatus | "all" | "abertas">(
    "abertas"
  );
  const [filterEscopo, setFilterEscopo] = useState<"todas" | "minhas" | "delegadas">(
    "todas"
  );
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  useEffect(() => {
    if (pendingNew) {
      setNewDialogOpen(true);
      onPendingNewHandled();
    }
  }, [pendingNew, onPendingNewHandled]);

  const filtered = useMemo(() => {
    return ts.filter((t) => {
      if (filterSquad !== "all" && t.squad_id !== filterSquad) return false;
      if (filterStatus === "abertas") {
        if (t.status === "concluida" || t.status === "cancelada") return false;
      } else if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterEscopo === "minhas" && t.responsavel_id !== userId) return false;
      if (filterEscopo === "delegadas" && t.criador_id !== userId) return false;
      if (busca) {
        const b = busca.toLowerCase();
        if (
          !t.titulo.toLowerCase().includes(b) &&
          !t.codigo.toLowerCase().includes(b) &&
          !t.descricao.toLowerCase().includes(b)
        )
          return false;
      }
      return true;
    });
  }, [ts, filterSquad, filterStatus, filterEscopo, busca, userId]);

  const porSquad = useMemo(() => {
    const map = new Map<string, Tarefa[]>();
    for (const t of filtered) {
      const arr = map.get(t.squad_id) ?? [];
      arr.push(t);
      map.set(t.squad_id, arr);
    }
    return map;
  }, [filtered]);

  const tarefaSelecionada = selecionada ? ts.find((t) => t.id === selecionada) : null;

  return (
    <>
      <div className="flex items-center flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar tarefa..."
            className="h-9 w-full pl-9 pr-3 text-sm border border-slate-200 rounded-[10px] bg-white ring-focus placeholder:text-slate-400"
          />
        </div>
        <FilterChip
          label="Escopo"
          value={filterEscopo}
          onChange={(v) => setFilterEscopo(v as typeof filterEscopo)}
          options={[
            { value: "todas", label: "Todas (visíveis)" },
            { value: "minhas", label: "Minhas" },
            { value: "delegadas", label: "Criadas por mim" },
          ]}
        />
        <FilterChip
          label="Status"
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as typeof filterStatus)}
          options={[
            { value: "abertas", label: "Em aberto" },
            { value: "all", label: "Todas" },
            { value: "a_fazer", label: "A fazer" },
            { value: "em_andamento", label: "Em andamento" },
            { value: "aguardando", label: "Aguardando" },
            { value: "concluida", label: "Concluídas" },
          ]}
        />
        <FilterChip
          label="Squad"
          value={filterSquad}
          onChange={setFilterSquad}
          options={[
            { value: "all", label: "Todas" },
            ...squads.map((s) => ({ value: s.id, label: s.nome })),
          ]}
        />
        <div className="ml-auto text-xs text-slate-500">
          {filtered.length} tarefa{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-5 w-5" />}
          title="Nada encontrado"
          description="Ajuste os filtros ou limpe a busca."
          action={
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setNewDialogOpen(true)}
            >
              Nova tarefa
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {Array.from(porSquad.entries()).map(([squadId, arr]) => {
            const sq = squadById(squadId);
            return (
              <div key={squadId}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: sq?.cor ?? "#64748b" }}
                  />
                  <h3 className="text-sm font-semibold text-slate-900">
                    {sq?.nome ?? "Sem squad"}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {arr.length} tarefa{arr.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {arr.map((t) => (
                    <TarefaCard
                      key={t.id}
                      tarefa={t}
                      userId={userId}
                      onClick={() => setSelecionada(t.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tarefaSelecionada && (
        <TarefaDetailDialog
          tarefa={tarefaSelecionada}
          onClose={() => setSelecionada(null)}
          userId={userId}
        />
      )}

      {newDialogOpen && (
        <NovaTarefaDialog
          userId={userId}
          onClose={() => setNewDialogOpen(false)}
          onCreate={(partial) => {
            const id = onCreate(partial);
            setNewDialogOpen(false);
            setSelecionada(id);
          }}
        />
      )}
    </>
  );
}

function TarefaCard({
  tarefa,
  userId,
  onClick,
}: {
  tarefa: Tarefa;
  userId: string;
  onClick: () => void;
}) {
  const sq = squadById(tarefa.squad_id);
  const overdue = isOverdue(tarefa.data_prazo, tarefa.status);
  const checklistDone = tarefa.checklist.filter((c) => c.concluido).length;
  const checklistTotal = tarefa.checklist.length;
  const sou = {
    responsavel: tarefa.responsavel_id === userId,
    aprovador: tarefa.aprovadores.includes(userId),
  };
  const isPrio = tarefa.prioridade === "critica" || tarefa.prioridade === "alta";

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left bg-white rounded-[14px] border border-slate-200 shadow-soft p-3.5 hover:shadow-pop hover:border-slate-300 transition-all ring-focus relative overflow-hidden",
        isPrio && "pl-4"
      )}
    >
      {isPrio && (
        <span
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            tarefa.prioridade === "critica" ? "bg-rose-500" : "bg-amber-500"
          )}
        />
      )}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-semibold text-slate-400 tracking-wide">
          {tarefa.codigo}
        </span>
        <div className="flex items-center gap-1">
          <Badge tone={STATUS_TONE[tarefa.status]} className="h-4 px-1.5 text-[10px]">
            {STATUS_LABEL[tarefa.status]}
          </Badge>
          {sou.responsavel && (
            <Badge tone="brand" className="h-4 px-1.5 text-[10px]">
              minha
            </Badge>
          )}
          {sou.aprovador && tarefa.status === "aguardando" && (
            <Badge tone="amber" className="h-4 px-1.5 text-[10px]">
              aprovar
            </Badge>
          )}
        </div>
      </div>

      <div
        className={cn(
          "text-sm font-semibold text-slate-900 mb-1.5 line-clamp-2",
          tarefa.status === "concluida" && "line-through text-slate-500"
        )}
      >
        {tarefa.titulo}
      </div>

      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {sq && (
          <span
            className="inline-flex items-center gap-1 px-1.5 h-4 rounded-full text-[10px] font-medium"
            style={{ backgroundColor: `${sq.cor}15`, color: sq.cor }}
          >
            <Hash className="h-2.5 w-2.5" />
            {sq.nome}
          </span>
        )}
        {tarefa.origem && (
          <span className="inline-flex items-center gap-1 px-1.5 h-4 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 max-w-[140px]">
            <FileText className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{tarefa.origem.label}</span>
          </span>
        )}
      </div>

      {checklistTotal > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
            <span>
              {checklistDone}/{checklistTotal} itens
            </span>
            <span>{Math.round((checklistDone / checklistTotal) * 100)}%</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500"
              style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          {tarefa.responsavel_id && (
            <Avatar name={userDisplayName(tarefa.responsavel_id)} size="xs" />
          )}
          {tarefa.data_prazo && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue && "text-rose-600 font-medium"
              )}
            >
              <Calendar className="h-3 w-3" />
              {fmtDate(tarefa.data_prazo)}
            </span>
          )}
        </div>
        <Badge tone={PRIO_TONE[tarefa.prioridade]} className="h-4 px-1.5 text-[10px]">
          {PRIO_LABEL[tarefa.prioridade]}
        </Badge>
      </div>
    </button>
  );
}

function TarefaRow({ tarefa, atrasada }: { tarefa: Tarefa; atrasada?: boolean }) {
  const sq = squadById(tarefa.squad_id);
  return (
    <li className="py-2.5 flex items-center gap-3">
      <span
        className="h-7 w-7 rounded-[8px] inline-flex items-center justify-center shrink-0"
        style={{
          backgroundColor: sq ? `${sq.cor}18` : "#f1f5f9",
          color: sq?.cor ?? "#475569",
        }}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">
          {tarefa.titulo}
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
          <span>{tarefa.codigo}</span>
          {sq && <span>· {sq.nome}</span>}
          {tarefa.data_prazo && (
            <span className={cn(atrasada && "text-rose-600 font-medium")}>
              · {atrasada ? "atrasou " : "prazo "}
              {fmtDate(tarefa.data_prazo)}
            </span>
          )}
        </div>
      </div>
      <Badge tone={PRIO_TONE[tarefa.prioridade]} className="h-4 px-1.5 text-[10px]">
        {PRIO_LABEL[tarefa.prioridade]}
      </Badge>
      {tarefa.responsavel_id && (
        <Avatar name={userDisplayName(tarefa.responsavel_id)} size="xs" />
      )}
    </li>
  );
}

function TarefaDetailDialog({
  tarefa,
  onClose,
  userId,
}: {
  tarefa: Tarefa;
  onClose: () => void;
  userId: string;
}) {
  const {
    toggleChecklistItem,
    addChecklistItem,
    addComentario,
    concluir,
    aprovar,
    reprovar,
    setStatus,
    deleteTarefa,
  } = useTarefasStore();
  const [novoChecklist, setNovoChecklist] = useState("");
  const [novoComentario, setNovoComentario] = useState("");
  const sq = squadById(tarefa.squad_id);
  const overdue = isOverdue(tarefa.data_prazo, tarefa.status);
  const checklistDone = tarefa.checklist.filter((c) => c.concluido).length;
  const podeAprovar =
    tarefa.aprovadores.includes(userId) && tarefa.status === "aguardando";
  const souResponsavel = tarefa.responsavel_id === userId;
  const souCriador = tarefa.criador_id === userId;

  const addChecklist = () => {
    if (!novoChecklist.trim()) return;
    addChecklistItem(tarefa.id, novoChecklist.trim());
    setNovoChecklist("");
  };

  const addComment = () => {
    if (!novoComentario.trim()) return;
    addComentario(tarefa.id, userId, novoComentario.trim());
    setNovoComentario("");
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone={PRIO_TONE[tarefa.prioridade]} className="h-5 px-2">
            {PRIO_LABEL[tarefa.prioridade]}
          </Badge>
          <Badge tone={STATUS_TONE[tarefa.status]} className="h-5 px-2">
            {STATUS_LABEL[tarefa.status]}
          </Badge>
          {sq && (
            <span
              className="inline-flex items-center gap-1 px-2 h-5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: `${sq.cor}18`, color: sq.cor }}
            >
              <Hash className="h-3 w-3" />
              {sq.nome}
            </span>
          )}
          <span className="text-[11px] text-slate-500">{tarefa.codigo}</span>
        </div>
      }
      subtitle={tarefa.titulo}
      footer={
        <>
          {souCriador && tarefa.status !== "concluida" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Excluir esta tarefa?")) {
                  deleteTarefa(tarefa.id);
                  onClose();
                }
              }}
              className="text-rose-600 hover:bg-rose-50"
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Excluir
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {podeAprovar && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  reprovar(tarefa.id);
                  onClose();
                }}
              >
                Reprovar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  aprovar(tarefa.id, userId);
                  onClose();
                }}
              >
                Aprovar
              </Button>
            </>
          )}
          {souResponsavel && tarefa.status !== "concluida" && !podeAprovar && (
            <>
              {tarefa.status === "a_fazer" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus(tarefa.id, "em_andamento")}
                >
                  Iniciar
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  concluir(tarefa.id);
                  onClose();
                }}
              >
                Marcar como concluída
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-slate-700 whitespace-pre-line">{tarefa.descricao}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow
            icon={<Users className="h-4 w-4" />}
            label="Responsável"
            value={
              tarefa.responsavel_id ? (
                <div className="flex items-center gap-1.5">
                  <Avatar name={userDisplayName(tarefa.responsavel_id)} size="xs" />
                  <span>{userDisplayName(tarefa.responsavel_id)}</span>
                  <span className="text-slate-400 text-[11px]">
                    · {userCargo(tarefa.responsavel_id)}
                  </span>
                </div>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            icon={<Users className="h-4 w-4" />}
            label="Criador"
            value={userDisplayName(tarefa.criador_id)}
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Prazo"
            value={
              tarefa.data_prazo ? (
                <span className={cn(overdue && "text-rose-600 font-medium")}>
                  {fmtDate(tarefa.data_prazo)}
                  {overdue && " · atrasada"}
                </span>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            icon={<Clock className="h-4 w-4" />}
            label="Estimativa / gasto"
            value={
              tarefa.estimativa_horas
                ? `${tarefa.horas_gastas ?? 0}h / ${tarefa.estimativa_horas}h`
                : "—"
            }
          />
          {tarefa.origem && (
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label="Vinculada a"
              value={tarefa.origem.label}
            />
          )}
          {tarefa.aprovadores.length > 0 && (
            <InfoRow
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Aprovadores (cascata)"
              value={tarefa.aprovadores.map(userDisplayName).join(" → ")}
            />
          )}
        </div>

        {tarefa.participantes.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Participantes cross-squad
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {tarefa.participantes.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-2.5 h-6 text-[11px]"
                >
                  <Avatar name={userDisplayName(p)} size="xs" />
                  {userDisplayName(p)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Checklist
            </div>
            <span className="text-[11px] text-slate-500">
              {checklistDone}/{tarefa.checklist.length}
            </span>
          </div>
          {tarefa.checklist.length > 0 && (
            <ul className="space-y-1.5 mb-2">
              {tarefa.checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleChecklistItem(tarefa.id, c.id)}
                    className={cn(
                      "h-5 w-5 rounded-[6px] border inline-flex items-center justify-center transition-all",
                      c.concluido
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "border-slate-300 hover:border-slate-400"
                    )}
                    aria-label={c.concluido ? "Desmarcar" : "Marcar"}
                  >
                    {c.concluido && <Check className="h-3 w-3" />}
                  </button>
                  <span
                    className={cn(
                      "text-sm",
                      c.concluido ? "text-slate-400 line-through" : "text-slate-700"
                    )}
                  >
                    {c.texto}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={novoChecklist}
              onChange={(e) => setNovoChecklist(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addChecklist();
                }
              }}
              placeholder="Adicionar item ao checklist..."
              className="flex-1 h-8 px-3 text-sm border border-slate-200 rounded-[8px] bg-white ring-focus placeholder:text-slate-400"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addChecklist}
              disabled={!novoChecklist.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Comentários
          </div>
          {tarefa.comentarios.length > 0 && (
            <ul className="space-y-2 mb-3">
              {tarefa.comentarios.map((c) => (
                <li key={c.id} className="flex items-start gap-2">
                  <Avatar name={userDisplayName(c.autor_id)} size="sm" />
                  <div className="flex-1 bg-slate-50 rounded-[10px] px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-900">
                        {userDisplayName(c.autor_id)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {relativeTime(c.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-line">
                      {c.texto}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-start gap-2">
            <Avatar name={userDisplayName(userId)} size="sm" />
            <div className="flex-1 flex gap-2">
              <textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    addComment();
                  }
                }}
                placeholder="Comentar... (⌘+Enter para enviar)"
                rows={2}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-[10px] bg-white ring-focus placeholder:text-slate-400 resize-none"
              />
              <Button
                size="sm"
                onClick={addComment}
                disabled={!novoComentario.trim()}
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>

        {tarefa.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            {tarefa.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function NovaTarefaDialog({
  userId,
  onClose,
  onCreate,
}: {
  userId: string;
  onClose: () => void;
  onCreate: (partial: Partial<Tarefa>) => void;
}) {
  const h = hierarquiaByUser(userId);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<TarefaPrioridade>("normal");
  const [squadId, setSquadId] = useState(h?.squad_id ?? "sq-comercial");
  const [prazo, setPrazo] = useState("");

  const canCreate = titulo.trim().length > 0;

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Nova tarefa"
      subtitle="Defina o essencial; refine depois no detalhe."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!canCreate}
            onClick={() =>
              onCreate({
                titulo: titulo.trim(),
                descricao: descricao.trim(),
                prioridade,
                squad_id: squadId,
                data_prazo: prazo || undefined,
                status: "a_fazer",
                visibilidade: "squad",
              })
            }
          >
            Criar tarefa
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Título
          </label>
          <input
            autoFocus
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Ligar para Patrícia Melo"
            className="mt-1 w-full h-10 px-3 text-sm border border-slate-200 rounded-[10px] bg-white ring-focus placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Descrição (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Detalhes, contexto, links..."
            rows={3}
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-[10px] bg-white ring-focus placeholder:text-slate-400 resize-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Squad
            </label>
            <select
              value={squadId}
              onChange={(e) => setSquadId(e.target.value)}
              className="mt-1 w-full h-10 px-2 text-sm border border-slate-200 rounded-[10px] bg-white ring-focus"
            >
              {squads.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Prioridade
            </label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as TarefaPrioridade)}
              className="mt-1 w-full h-10 px-2 text-sm border border-slate-200 rounded-[10px] bg-white ring-focus"
            >
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Prazo
            </label>
            <input
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="mt-1 w-full h-10 px-2 text-sm border border-slate-200 rounded-[10px] bg-white ring-focus"
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}

/* ───────────────────── TAB: NOTAS ───────────────────── */

function NotasTab({
  userId,
  notas: ns,
  initialSelectedId,
  onSelectionApplied,
}: {
  userId: string;
  notas: Nota[];
  initialSelectedId?: string | null;
  onSelectionApplied: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? ns[0]?.id ?? null
  );
  const [filterPasta, setFilterPasta] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [mostrarOutras, setMostrarOutras] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);

  const { createNota } = useNotasStore();

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
      setMostrarOutras(false);
      setFilterPasta(null);
      setOnlyStarred(false);
      setBusca("");
      onSelectionApplied();
    }
  }, [initialSelectedId, onSelectionApplied]);

  const pastas = useMemo(() => {
    const set = new Set<string>();
    ns.forEach((n) => n.pasta && set.add(n.pasta));
    return Array.from(set).sort();
  }, [ns]);

  const minhas = ns.filter((n) => n.autor_id === userId);
  const compartilhadas = ns.filter((n) => n.autor_id !== userId);
  const mostradas = mostrarOutras ? compartilhadas : minhas;

  const filtered = useMemo(() => {
    return mostradas.filter((n) => {
      if (filterPasta && n.pasta !== filterPasta) return false;
      if (onlyStarred && !n.favorita) return false;
      if (busca) {
        const b = busca.toLowerCase();
        const matchTitle = n.titulo.toLowerCase().includes(b);
        const matchTags = n.tags.some((t) => t.toLowerCase().includes(b));
        const matchBlocks = n.blocos.some((bl) => {
          if (bl.tipo === "texto") return bl.markdown.toLowerCase().includes(b);
          if (bl.tipo === "heading") return bl.texto.toLowerCase().includes(b);
          if (bl.tipo === "citacao") return bl.texto.toLowerCase().includes(b);
          if (bl.tipo === "checklist")
            return bl.itens.some((i) => i.texto.toLowerCase().includes(b));
          return false;
        });
        if (!matchTitle && !matchTags && !matchBlocks) return false;
      }
      return true;
    });
  }, [mostradas, filterPasta, busca, onlyStarred]);

  const ordenadas = [...filtered].sort((a, b) => {
    if (a.fixada !== b.fixada) return a.fixada ? -1 : 1;
    return b.updated_at.localeCompare(a.updated_at);
  });

  const selected = ns.find((n) => n.id === selectedId) ?? ordenadas[0];

  const createAndSelect = () => {
    const id = createNota(userId);
    setMostrarOutras(false);
    setFilterPasta(null);
    setOnlyStarred(false);
    setBusca("");
    setSelectedId(id);
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[560px]">
      <aside className="col-span-12 md:col-span-2 bg-white border border-slate-200 rounded-[14px] shadow-soft p-2.5 overflow-y-auto">
        <div className="px-2 pt-1 pb-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Espaços
          </div>
        </div>
        <NotaPastaItem
          icon={FileText}
          label="Minhas notas"
          count={minhas.length}
          active={!mostrarOutras && !filterPasta && !onlyStarred}
          onClick={() => {
            setMostrarOutras(false);
            setFilterPasta(null);
            setOnlyStarred(false);
          }}
        />
        <NotaPastaItem
          icon={Share2}
          label="Compartilhadas"
          count={compartilhadas.length}
          active={mostrarOutras && !filterPasta}
          onClick={() => {
            setMostrarOutras(true);
            setFilterPasta(null);
            setOnlyStarred(false);
          }}
        />
        <NotaPastaItem
          icon={Star}
          label="Favoritas"
          count={ns.filter((n) => n.favorita).length}
          active={onlyStarred}
          onClick={() => {
            setOnlyStarred(!onlyStarred);
            setMostrarOutras(false);
            setFilterPasta(null);
          }}
        />

        {pastas.length > 0 && (
          <>
            <div className="px-2 pt-4 pb-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Pastas
              </div>
            </div>
            {pastas.map((p) => (
              <NotaPastaItem
                key={p}
                icon={Folder}
                label={p}
                count={ns.filter((n) => n.pasta === p).length}
                active={filterPasta === p}
                onClick={() => setFilterPasta(filterPasta === p ? null : p)}
              />
            ))}
          </>
        )}
      </aside>

      <aside className="col-span-12 md:col-span-4 bg-white border border-slate-200 rounded-[14px] shadow-soft flex flex-col min-h-0">
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nos títulos e conteúdo..."
              className="h-9 w-full pl-9 pr-3 text-sm border border-slate-200 rounded-[10px] bg-white ring-focus placeholder:text-slate-400"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 justify-center"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={createAndSelect}
          >
            Nova nota
          </Button>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {ordenadas.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-5 w-5" />}
              title="Sem notas aqui"
              description="Crie uma nova ou mude de pasta."
            />
          ) : (
            ordenadas.map((n) => (
              <NotaListItem
                key={n.id}
                nota={n}
                active={selected?.id === n.id}
                onClick={() => setSelectedId(n.id)}
              />
            ))
          )}
        </ul>
      </aside>

      <main className="col-span-12 md:col-span-6 bg-white border border-slate-200 rounded-[14px] shadow-soft overflow-y-auto">
        {selected ? (
          <NotaEditor
            key={selected.id}
            nota={selected}
            isOwner={selected.autor_id === userId}
            onDelete={() => {
              setSelectedId(null);
            }}
          />
        ) : (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title="Selecione uma nota"
            description="Escolha na lista ao lado ou crie uma nova."
            action={
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={createAndSelect}
              >
                Nova nota
              </Button>
            }
          />
        )}
      </main>
    </div>
  );
}

function NotaPastaItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2.5 h-8 rounded-[8px] text-[13px] font-medium transition-colors ring-focus",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", active ? "text-brand-600" : "text-slate-400")} />
      <span className="flex-1 truncate text-left">{label}</span>
      <span className="text-[10px] text-slate-500 font-normal">{count}</span>
    </button>
  );
}

function NotaListItem({
  nota,
  active,
  onClick,
}: {
  nota: Nota;
  active: boolean;
  onClick: () => void;
}) {
  const preview = nota.blocos.find((b) => b.tipo === "texto");
  const previewText =
    preview && preview.tipo === "texto" ? preview.markdown.slice(0, 110) : "";
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left px-4 py-3 transition-colors ring-focus",
          active ? "bg-brand-50/60" : "hover:bg-slate-50"
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg leading-none pt-0.5 w-5 text-center">
            {nota.emoji ?? "📝"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className={cn(
                  "text-sm truncate flex-1",
                  active ? "font-semibold text-brand-800" : "font-medium text-slate-900"
                )}
              >
                {nota.titulo}
              </span>
              {nota.fixada && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
              {nota.favorita && (
                <Star className="h-3 w-3 text-amber-500 shrink-0 fill-amber-500" />
              )}
            </div>
            {previewText && (
              <p className="text-[11px] text-slate-500 line-clamp-2 mb-1">
                {previewText}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>{relativeTime(nota.updated_at)}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5">
                {renderVisIcon(nota.visibilidade)}
                {VIS_LABEL[nota.visibilidade]}
              </span>
            </div>
          </div>
        </div>
      </button>
    </li>
  );
}

function renderVisIcon(v: NotaVisibilidade) {
  const Ic = VIS_ICON[v];
  return <Ic className="h-2.5 w-2.5" />;
}

/* ───────────────────── NOTA EDITOR (Notion-like) ───────────────────── */

function NotaEditor({
  nota,
  isOwner,
  onDelete,
}: {
  nota: Nota;
  isOwner: boolean;
  onDelete: () => void;
}) {
  const {
    updateNotaMeta,
    deleteNota,
    toggleStar,
    togglePin,
    addBloco,
    updateBloco,
    removeBloco,
    moveBloco,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    updateChecklistItemText,
    addTag,
    removeTag,
    setVisibilidade,
    shareWith,
    unshareWith,
  } = useNotasStore();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [novaTag, setNovaTag] = useState("");

  const sq = nota.squad_id ? squadById(nota.squad_id) : undefined;

  const handleTitleChange = (titulo: string) => {
    updateNotaMeta(nota.id, { titulo });
  };

  const handleAddBloco = (
    afterId?: string,
    tipo: NotaBloco["tipo"] = "texto"
  ) => {
    if (tipo === "heading") {
      return addBloco(nota.id, { tipo: "heading", nivel: 2, texto: "" }, afterId);
    }
    if (tipo === "checklist") {
      return addBloco(nota.id, { tipo: "checklist" }, afterId);
    }
    if (tipo === "citacao") {
      return addBloco(nota.id, { tipo: "citacao", texto: "" }, afterId);
    }
    if (tipo === "codigo") {
      return addBloco(nota.id, { tipo: "codigo", codigo: "" }, afterId);
    }
    if (tipo === "divisor") {
      return addBloco(nota.id, { tipo: "divisor" }, afterId);
    }
    return addBloco(nota.id, { tipo: "texto", markdown: "" }, afterId);
  };

  const handleDelete = () => {
    if (confirm(`Excluir "${nota.titulo}"? Essa ação não pode ser desfeita.`)) {
      deleteNota(nota.id);
      onDelete();
    }
  };

  return (
    <article className="max-w-[720px] mx-auto p-7 relative">
      {/* Toolbar superior */}
      <div className="flex items-center gap-1 mb-4 text-slate-500 text-[11px]">
        <span className="inline-flex items-center gap-1">
          {renderVisIcon(nota.visibilidade)}
          {VIS_LABEL[nota.visibilidade]}
        </span>
        {sq && (
          <>
            <span className="text-slate-300">·</span>
            <span
              className="inline-flex items-center gap-1 px-1.5 h-4 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: `${sq.cor}18`, color: sq.cor }}
            >
              <Hash className="h-2.5 w-2.5" />
              {sq.nome}
            </span>
          </>
        )}
        {nota.pasta && (
          <>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <Folder className="h-3 w-3" />
              {nota.pasta}
            </span>
          </>
        )}
        <span className="text-slate-300">·</span>
        <span>atualizada {relativeTime(nota.updated_at)}</span>

        <div className="ml-auto flex items-center gap-1">
          {isOwner && (
            <>
              <IconBtn
                active={nota.favorita}
                onClick={() => toggleStar(nota.id)}
                label="Favoritar"
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5",
                    nota.favorita && "fill-amber-400 text-amber-500"
                  )}
                />
              </IconBtn>
              <IconBtn
                active={nota.fixada}
                onClick={() => togglePin(nota.id)}
                label="Fixar"
              >
                <Pin
                  className={cn(
                    "h-3.5 w-3.5",
                    nota.fixada && "fill-amber-400 text-amber-500"
                  )}
                />
              </IconBtn>
              <IconBtn
                onClick={() => setShowSettings(true)}
                label="Compartilhar & permissões"
              >
                <Share2 className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn onClick={handleDelete} label="Excluir nota" danger>
                <Trash2 className="h-3.5 w-3.5" />
              </IconBtn>
            </>
          )}
          {!isOwner && (
            <Badge tone="amber" className="h-4 px-1.5 text-[10px]">
              leitura
            </Badge>
          )}
        </div>
      </div>

      {/* Emoji + Título */}
      <header className="mb-5 pb-5 border-b border-slate-100">
        <div className="flex items-start gap-3 mb-2">
          <div className="relative">
            <button
              disabled={!isOwner}
              onClick={() => isOwner && setShowEmojiPicker((s) => !s)}
              className={cn(
                "text-5xl leading-none h-14 w-14 rounded-[12px] inline-flex items-center justify-center transition-colors",
                isOwner && "hover:bg-slate-100",
                !isOwner && "cursor-default"
              )}
              aria-label="Trocar emoji"
            >
              {nota.emoji ?? "📝"}
            </button>
            {showEmojiPicker && isOwner && (
              <EmojiPicker
                onPick={(e) => {
                  updateNotaMeta(nota.id, { emoji: e });
                  setShowEmojiPicker(false);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {isOwner ? (
              <input
                value={nota.titulo}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Sem título"
                className="w-full text-[30px] font-bold text-slate-900 tracking-tight leading-tight bg-transparent outline-none placeholder:text-slate-300"
              />
            ) : (
              <h1 className="text-[30px] font-bold text-slate-900 tracking-tight leading-tight">
                {nota.titulo || "Sem título"}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
              <Avatar name={userDisplayName(nota.autor_id)} size="xs" />
              <span>
                por{" "}
                <strong className="font-medium text-slate-700">
                  {userDisplayName(nota.autor_id)}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {nota.links.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Vinculada a:
            </span>
            {nota.links.map((l, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] font-medium bg-aqua-50 text-aqua-700"
              >
                <FileText className="h-2.5 w-2.5" />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Blocos */}
      <div className="space-y-1">
        {nota.blocos.length === 0 && isOwner && (
          <BlocoEmpty onAdd={(tipo) => handleAddBloco(undefined, tipo)} />
        )}
        {nota.blocos.map((b, idx) => (
          <BlocoEditable
            key={b.id}
            bloco={b}
            isOwner={isOwner}
            isFirst={idx === 0}
            isLast={idx === nota.blocos.length - 1}
            onUpdate={(patch) => updateBloco(nota.id, b.id, patch)}
            onRemove={() => {
              if (nota.blocos.length === 1) {
                // always keep at least one block
                updateBloco(nota.id, b.id, { tipo: "texto", markdown: "" } as never);
                return;
              }
              removeBloco(nota.id, b.id);
            }}
            onMoveUp={() => moveBloco(nota.id, b.id, "up")}
            onMoveDown={() => moveBloco(nota.id, b.id, "down")}
            onAddAfter={(tipo) => {
              handleAddBloco(b.id, tipo);
            }}
            onEnterAfter={() => {
              handleAddBloco(b.id, "texto");
            }}
            onToggleItem={(itemId) => toggleChecklistItem(nota.id, b.id, itemId)}
            onAddItem={(texto) => addChecklistItem(nota.id, b.id, texto)}
            onRemoveItem={(itemId) => removeChecklistItem(nota.id, b.id, itemId)}
            onUpdateItemText={(itemId, texto) =>
              updateChecklistItemText(nota.id, b.id, itemId, texto)
            }
          />
        ))}
        {isOwner && nota.blocos.length > 0 && (
          <BlocoEmpty
            compact
            onAdd={(tipo) =>
              handleAddBloco(nota.blocos[nota.blocos.length - 1].id, tipo)
            }
          />
        )}
      </div>

      {/* Tags */}
      <div className="pt-6 mt-6 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="h-3.5 w-3.5 text-slate-400" />
          {nota.tags.map((t) => (
            <span
              key={t}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 inline-flex items-center gap-1",
                isOwner && "hover:bg-slate-200 group"
              )}
            >
              {t}
              {isOwner && (
                <button
                  onClick={() => removeTag(nota.id, t)}
                  className="h-3 w-3 rounded-full inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remover tag"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </span>
          ))}
          {isOwner && (
            <input
              value={novaTag}
              onChange={(e) => setNovaTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && novaTag.trim()) {
                  addTag(nota.id, novaTag.trim());
                  setNovaTag("");
                } else if (e.key === "Backspace" && !novaTag && nota.tags.length) {
                  removeTag(nota.id, nota.tags[nota.tags.length - 1]);
                }
              }}
              placeholder="Adicionar tag..."
              className="px-2 py-0.5 text-[10px] bg-transparent outline-none placeholder:text-slate-400 min-w-[100px]"
            />
          )}
        </div>
      </div>

      {showSettings && (
        <NotaSettingsDialog
          nota={nota}
          onClose={() => setShowSettings(false)}
          onSetVisibilidade={setVisibilidade}
          onShare={shareWith}
          onUnshare={unshareWith}
        />
      )}
    </article>
  );
}

function IconBtn({
  children,
  onClick,
  active,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "h-7 w-7 inline-flex items-center justify-center rounded-[8px] transition-colors ring-focus",
        danger
          ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          : active
          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );
}

function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("click", h), 0);
    return () => document.removeEventListener("click", h);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="absolute top-16 left-0 z-20 bg-white rounded-[12px] border border-slate-200 shadow-pop p-2 grid grid-cols-5 gap-1 min-w-[220px] animate-slide-up"
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onPick(e)}
          className="h-8 w-8 text-xl rounded-[8px] hover:bg-slate-100 inline-flex items-center justify-center"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────── BLOCO EDITABLE ───────────────────── */

function BlocoEditable({
  bloco,
  isOwner,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddAfter,
  onEnterAfter,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onUpdateItemText,
}: {
  bloco: NotaBloco;
  isOwner: boolean;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<NotaBloco>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddAfter: (tipo: NotaBloco["tipo"]) => void;
  onEnterAfter: () => void;
  onToggleItem: (itemId: string) => void;
  onAddItem: (texto: string) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItemText: (itemId: string, texto: string) => void;
}) {
  const [showSlash, setShowSlash] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative flex items-start gap-1 -mx-8 px-8 py-0.5 rounded-[6px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowSlash(false);
      }}
    >
      {isOwner && (
        <div
          className={cn(
            "absolute left-1 top-0.5 flex items-center gap-0.5 transition-opacity",
            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <button
            onClick={() => setShowSlash(!showSlash)}
            className="h-6 w-6 rounded-[6px] inline-flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Adicionar bloco"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            className="h-6 w-4 rounded-[6px] inline-flex items-center justify-center text-slate-300 hover:text-slate-600 cursor-grab"
            title="Arrastar"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          {showSlash && (
            <SlashMenu
              onPick={(tipo) => {
                onAddAfter(tipo);
                setShowSlash(false);
              }}
              onClose={() => setShowSlash(false)}
            />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <BlocoBody
          bloco={bloco}
          isOwner={isOwner}
          onUpdate={onUpdate}
          onEnterAfter={onEnterAfter}
          onBackspaceEmpty={onRemove}
          onToggleItem={onToggleItem}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onUpdateItemText={onUpdateItemText}
        />
      </div>

      {isOwner && (
        <div
          className={cn(
            "absolute right-1 top-0.5 flex items-center gap-0.5 transition-opacity",
            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {!isFirst && (
            <button
              onClick={onMoveUp}
              className="h-6 w-6 rounded-[6px] inline-flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Mover para cima"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={onMoveDown}
              className="h-6 w-6 rounded-[6px] inline-flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Mover para baixo"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onRemove}
            className="h-6 w-6 rounded-[6px] inline-flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            title="Excluir bloco"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function BlocoBody({
  bloco,
  isOwner,
  onUpdate,
  onEnterAfter,
  onBackspaceEmpty,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  onUpdateItemText,
}: {
  bloco: NotaBloco;
  isOwner: boolean;
  onUpdate: (patch: Partial<NotaBloco>) => void;
  onEnterAfter: () => void;
  onBackspaceEmpty: () => void;
  onToggleItem: (itemId: string) => void;
  onAddItem: (texto: string) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItemText: (itemId: string, texto: string) => void;
}) {
  if (bloco.tipo === "heading") {
    const sizeCls =
      bloco.nivel === 1
        ? "text-2xl font-bold mt-4"
        : bloco.nivel === 2
        ? "text-lg font-semibold mt-3"
        : "text-base font-semibold mt-2";
    return (
      <div className="flex items-start gap-2">
        <select
          disabled={!isOwner}
          value={bloco.nivel}
          onChange={(e) =>
            onUpdate({
              nivel: Number(e.target.value) as 1 | 2 | 3,
            } as Partial<NotaBloco>)
          }
          className={cn(
            "text-[10px] font-semibold text-slate-400 bg-transparent mt-3 outline-none",
            !isOwner && "cursor-default"
          )}
        >
          <option value={1}>H1</option>
          <option value={2}>H2</option>
          <option value={3}>H3</option>
        </select>
        {isOwner ? (
          <input
            value={bloco.texto}
            onChange={(e) => onUpdate({ texto: e.target.value } as Partial<NotaBloco>)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEnterAfter();
              }
              if (e.key === "Backspace" && bloco.texto === "") {
                e.preventDefault();
                onBackspaceEmpty();
              }
            }}
            placeholder={`Título ${bloco.nivel === 1 ? "grande" : bloco.nivel === 2 ? "médio" : "pequeno"}...`}
            className={cn(
              "flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-300",
              sizeCls
            )}
          />
        ) : (
          <h2 className={cn("text-slate-900", sizeCls)}>{bloco.texto}</h2>
        )}
      </div>
    );
  }

  if (bloco.tipo === "texto") {
    return (
      <TextoBloco
        markdown={bloco.markdown}
        isOwner={isOwner}
        onChange={(md) => onUpdate({ markdown: md } as Partial<NotaBloco>)}
        onEnter={onEnterAfter}
        onBackspaceEmpty={onBackspaceEmpty}
      />
    );
  }

  if (bloco.tipo === "checklist") {
    return (
      <ul className="space-y-1">
        {bloco.itens.map((i) => (
          <li key={i.id} className="flex items-start gap-2 group/item">
            <button
              disabled={!isOwner}
              onClick={() => onToggleItem(i.id)}
              className={cn(
                "h-5 w-5 rounded-[6px] border inline-flex items-center justify-center shrink-0 mt-0.5 transition-all",
                i.concluido
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "border-slate-300 hover:border-slate-400",
                !isOwner && "cursor-default opacity-80"
              )}
              aria-label={i.concluido ? "Desmarcar" : "Marcar"}
            >
              {i.concluido && <Check className="h-3 w-3" />}
            </button>
            {isOwner ? (
              <input
                value={i.texto}
                onChange={(e) => onUpdateItemText(i.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddItem("");
                  }
                  if (e.key === "Backspace" && i.texto === "") {
                    e.preventDefault();
                    onRemoveItem(i.id);
                  }
                }}
                placeholder="Tarefa"
                className={cn(
                  "flex-1 bg-transparent outline-none text-[15px] leading-7 placeholder:text-slate-300",
                  i.concluido ? "text-slate-400 line-through" : "text-slate-700"
                )}
              />
            ) : (
              <span
                className={cn(
                  "text-[15px] leading-7",
                  i.concluido ? "text-slate-400 line-through" : "text-slate-700"
                )}
              >
                {i.texto}
              </span>
            )}
            {isOwner && (
              <button
                onClick={() => onRemoveItem(i.id)}
                className="h-5 w-5 rounded-[6px] inline-flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover/item:opacity-100"
                title="Remover item"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </li>
        ))}
        {isOwner && (
          <li>
            <button
              onClick={() => onAddItem("")}
              className="text-[13px] text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 ml-7 mt-1"
            >
              <Plus className="h-3 w-3" />
              Adicionar item
            </button>
          </li>
        )}
      </ul>
    );
  }

  if (bloco.tipo === "citacao") {
    return (
      <blockquote className="border-l-[3px] border-brand-400 pl-4 py-1.5 text-[15px] italic text-slate-600 bg-brand-50/30 rounded-r-[6px]">
        <Quote className="h-3 w-3 text-brand-400 inline mr-1.5 -mt-0.5" />
        {isOwner ? (
          <textarea
            value={bloco.texto}
            onChange={(e) =>
              onUpdate({ texto: e.target.value } as Partial<NotaBloco>)
            }
            placeholder="Escreva a citação..."
            rows={1}
            className="inline-block w-[calc(100%-20px)] bg-transparent outline-none italic resize-none placeholder:text-slate-400"
          />
        ) : (
          bloco.texto
        )}
        {bloco.autor && (
          <footer className="not-italic text-[11px] text-slate-400 mt-1">
            — {bloco.autor}
          </footer>
        )}
      </blockquote>
    );
  }

  if (bloco.tipo === "codigo") {
    return (
      <div className="bg-slate-900 text-slate-100 rounded-[10px] p-3.5 text-[12px] font-mono overflow-x-auto">
        {isOwner ? (
          <textarea
            value={bloco.codigo}
            onChange={(e) =>
              onUpdate({ codigo: e.target.value } as Partial<NotaBloco>)
            }
            placeholder="// código aqui"
            rows={Math.max(2, bloco.codigo.split("\n").length)}
            className="w-full bg-transparent outline-none font-mono text-slate-100 resize-none placeholder:text-slate-500"
          />
        ) : (
          <pre>
            <code>{bloco.codigo}</code>
          </pre>
        )}
      </div>
    );
  }

  if (bloco.tipo === "divisor") {
    return <hr className="border-slate-200 my-3" />;
  }

  return null;
}

function TextoBloco({
  markdown,
  isOwner,
  onChange,
  onEnter,
  onBackspaceEmpty,
}: {
  markdown: string;
  isOwner: boolean;
  onChange: (md: string) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = taRef.current.scrollHeight + "px";
    }
  }, [markdown]);

  if (!isOwner) {
    return (
      <p className="text-[15px] leading-7 text-slate-700 whitespace-pre-line">
        {renderInlineMarkdown(markdown)}
      </p>
    );
  }

  return (
    <textarea
      ref={taRef}
      value={markdown}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onEnter();
        }
        if (e.key === "Backspace" && markdown === "") {
          e.preventDefault();
          onBackspaceEmpty();
        }
      }}
      placeholder="Escreva algo, ou use + à esquerda para adicionar bloco..."
      rows={1}
      className="w-full bg-transparent outline-none text-[15px] leading-7 text-slate-700 resize-none placeholder:text-slate-300"
    />
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/s);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(
        <strong key={key++} className="font-semibold text-slate-900">
          {boldMatch[2]}
        </strong>
      );
      remaining = boldMatch[3];
      continue;
    }
    const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)$/s);
    if (codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-[13px] font-mono text-slate-800"
        >
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
      continue;
    }
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }
  return parts;
}

/* ───────────────────── SLASH MENU / ADD BLOCK ───────────────────── */

const SLASH_ITEMS: {
  tipo: NotaBloco["tipo"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  { tipo: "texto", label: "Texto", icon: Type, hint: "parágrafo comum" },
  { tipo: "heading", label: "Título", icon: Heading2, hint: "H1 / H2 / H3" },
  { tipo: "checklist", label: "Checklist", icon: ListChecks, hint: "to-do list" },
  { tipo: "citacao", label: "Citação", icon: Quote, hint: "destaque" },
  { tipo: "codigo", label: "Código", icon: Code2, hint: "monospace" },
  { tipo: "divisor", label: "Divisor", icon: Minus, hint: "linha horizontal" },
];

function SlashMenu({
  onPick,
  onClose,
}: {
  onPick: (tipo: NotaBloco["tipo"]) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("click", h), 0);
    return () => document.removeEventListener("click", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-7 left-0 z-20 bg-white rounded-[12px] border border-slate-200 shadow-pop p-1.5 min-w-[220px] animate-slide-up"
    >
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-2 py-1">
        Inserir bloco
      </div>
      {SLASH_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.tipo}
            onClick={() => onPick(item.tipo)}
            className="w-full flex items-center gap-2.5 px-2 h-9 rounded-[8px] hover:bg-slate-50 text-left"
          >
            <span className="h-7 w-7 rounded-[8px] bg-slate-100 text-slate-600 inline-flex items-center justify-center">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900">{item.label}</div>
              <div className="text-[10px] text-slate-500">{item.hint}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function BlocoEmpty({
  onAdd,
  compact,
}: {
  onAdd: (tipo: NotaBloco["tipo"]) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    setTimeout(() => document.addEventListener("click", h), 0);
    return () => document.removeEventListener("click", h);
  }, []);

  return (
    <div
      ref={ref}
      className={cn("relative flex items-center gap-2", compact && "py-2")}
    >
      {!compact && (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left py-6 rounded-[10px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-2 border-dashed border-slate-200 hover:border-slate-300 text-sm inline-flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Começar — clique para adicionar um bloco
        </button>
      )}
      {compact && (
        <button
          onClick={() => setOpen(true)}
          className="text-[12px] text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Adicionar bloco
        </button>
      )}
      {open && (
        <div
          className={cn(
            "absolute z-20 bg-white rounded-[12px] border border-slate-200 shadow-pop p-1.5 min-w-[220px] animate-slide-up",
            compact ? "top-7 left-0" : "bottom-2 left-0"
          )}
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-2 py-1">
            Inserir bloco
          </div>
          {SLASH_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.tipo}
                onClick={() => {
                  onAdd(item.tipo);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2 h-9 rounded-[8px] hover:bg-slate-50 text-left"
              >
                <span className="h-7 w-7 rounded-[8px] bg-slate-100 text-slate-600 inline-flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500">{item.hint}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────── NOTA SETTINGS ───────────────────── */

function NotaSettingsDialog({
  nota,
  onClose,
  onSetVisibilidade,
  onShare,
  onUnshare,
}: {
  nota: Nota;
  onClose: () => void;
  onSetVisibilidade: (id: string, vis: NotaVisibilidade, squadId?: string) => void;
  onShare: (id: string, userId: string) => void;
  onUnshare: (id: string, userId: string) => void;
}) {
  const [userQuery, setUserQuery] = useState("");
  const allUsers = [
    ...usuarios.map((u) => ({ id: u.id, nome: u.nome, cargo: "" })),
    ...usuariosExtras.map((u) => ({ id: u.id, nome: u.nome, cargo: u.cargo })),
  ];
  const deduped = Array.from(new Map(allUsers.map((u) => [u.id, u])).values());
  const filteredUsers = userQuery
    ? deduped.filter(
        (u) =>
          u.nome.toLowerCase().includes(userQuery.toLowerCase()) &&
          u.id !== nota.autor_id
      )
    : [];

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title="Compartilhar & permissões"
      subtitle={nota.titulo}
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      <div className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Visibilidade
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(["privada", "gestor", "squad", "equipe"] as NotaVisibilidade[]).map(
              (v) => {
                const Ic = VIS_ICON[v];
                return (
                  <button
                    key={v}
                    onClick={() => onSetVisibilidade(nota.id, v, nota.squad_id)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-[10px] border text-left transition-colors",
                      nota.visibilidade === v
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Ic
                      className={cn(
                        "h-4 w-4",
                        nota.visibilidade === v ? "text-brand-600" : "text-slate-400"
                      )}
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {VIS_LABEL[v]}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {v === "privada" && "Só você (e seu gestor)"}
                        {v === "gestor" && "Gestor direto + superiores"}
                        {v === "squad" && "Todo seu squad"}
                        {v === "equipe" && "Toda a empresa"}
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Compartilhar com pessoas específicas (somente leitura)
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Buscar pessoa..."
              className="h-9 w-full pl-9 pr-3 text-sm border border-slate-200 rounded-[10px] bg-white ring-focus placeholder:text-slate-400"
            />
            {filteredUsers.length > 0 && (
              <ul className="absolute z-10 top-full mt-1 w-full bg-white rounded-[10px] border border-slate-200 shadow-pop max-h-48 overflow-y-auto">
                {filteredUsers.slice(0, 8).map((u) => {
                  const already = nota.compartilhada_com.includes(u.id);
                  return (
                    <li key={u.id}>
                      <button
                        disabled={already}
                        onClick={() => {
                          onShare(nota.id, u.id);
                          setUserQuery("");
                        }}
                        className="w-full flex items-center gap-2 px-3 h-10 text-left hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Avatar name={u.nome} size="xs" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {u.nome}
                          </div>
                          {u.cargo && (
                            <div className="text-[11px] text-slate-500 truncate">
                              {u.cargo}
                            </div>
                          )}
                        </div>
                        {already && (
                          <span className="text-[10px] text-slate-400">já tem acesso</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {nota.compartilhada_com.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {nota.compartilhada_com.map((uid) => (
                <li
                  key={uid}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-[10px]"
                >
                  <Avatar name={userDisplayName(uid)} size="xs" />
                  <span className="flex-1 text-sm text-slate-800">
                    {userDisplayName(uid)}
                  </span>
                  <button
                    onClick={() => onUnshare(nota.id, uid)}
                    className="text-xs text-slate-500 hover:text-rose-600"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}

/* ───────────────────── TAB: MENÇÕES ───────────────────── */

function MencoesTab({
  mencoes: ms,
  currentUserId,
}: {
  mencoes: Mencao[];
  currentUserId: string;
}) {
  const [filter, setFilter] = useState<"nao_lidas" | "todas">("nao_lidas");
  const { marcarLida, marcarTodasLidas } = useMencoesStore();

  const list = useMemo(() => {
    const base = filter === "nao_lidas" ? ms.filter((m) => !m.lida) : ms;
    return [...base].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [ms, filter]);

  const naoLidasTotal = ms.filter((m) => !m.lida).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <FilterChip
          label="Exibindo"
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          options={[
            { value: "nao_lidas", label: "Não lidas" },
            { value: "todas", label: "Todas" },
          ]}
        />
        <div className="ml-auto text-xs text-slate-500">
          {list.length} menç{list.length === 1 ? "ão" : "ões"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Check className="h-4 w-4" />}
          onClick={() => marcarTodasLidas(currentUserId)}
          disabled={naoLidasTotal === 0}
        >
          Marcar todas como lidas
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="Sem menções"
          description="Quando alguém marcar @você em uma tarefa, nota, reunião ou chat, aparece aqui."
        />
      ) : (
        <ul className="bg-white border border-slate-200 rounded-[14px] shadow-soft divide-y divide-slate-100">
          {list.map((m) => (
            <MencaoRow
              key={m.id}
              mencao={m}
              onMarcarLida={() => marcarLida(m.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MencaoRow({
  mencao,
  onMarcarLida,
}: {
  mencao: Mencao;
  onMarcarLida: () => void;
}) {
  const ORIG_ICON: Record<
    Mencao["origem"],
    React.ComponentType<{ className?: string }>
  > = {
    aqua_chat: MessageSquare,
    reuniao: Calendar,
    tarefa: CheckCircle2,
    nota: BookOpen,
    os: Wrench,
    comentario: MessageSquare,
  };
  const ORIG_TONE: Record<Mencao["origem"], string> = {
    aqua_chat: "bg-brand-50 text-brand-700",
    reuniao: "bg-violet-50 text-violet-700",
    tarefa: "bg-aqua-50 text-aqua-700",
    nota: "bg-amber-50 text-amber-700",
    os: "bg-rose-50 text-rose-700",
    comentario: "bg-slate-100 text-slate-700",
  };
  const Icon = ORIG_ICON[mencao.origem];

  return (
    <li
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer",
        mencao.lida ? "hover:bg-slate-50" : "bg-brand-50/30 hover:bg-brand-50/50"
      )}
      onClick={onMarcarLida}
    >
      <span
        className={cn(
          "h-9 w-9 rounded-[10px] inline-flex items-center justify-center shrink-0",
          ORIG_TONE[mencao.origem]
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Avatar name={userDisplayName(mencao.autor_id)} size="xs" />
          <span className="text-sm font-semibold text-slate-900">
            {userDisplayName(mencao.autor_id)}
          </span>
          <span className="text-[11px] text-slate-500">em</span>
          <span className="text-[11px] font-medium text-slate-700">
            {mencao.origem_label}
          </span>
          <span className="text-[10px] text-slate-400 ml-auto">
            {relativeTime(mencao.created_at)}
          </span>
        </div>
        <div className="text-sm text-slate-700 leading-relaxed">{mencao.trecho}</div>
      </div>
      {!mencao.lida && (
        <span
          className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-3"
          title="Não lida"
        />
      )}
    </li>
  );
}

/* ───────────────────── SHARED ───────────────────── */

function Card({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-[14px] shadow-soft",
        className
      )}
    >
      <div className="px-4 pt-3.5 pb-3 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle && <div className="text-[11px] text-slate-500">{subtitle}</div>}
        </div>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "rose" | "amber" | "brand" | "emerald" | "aqua";
  label: string;
  value: number;
  hint?: string;
}) {
  const toneBg: Record<typeof tone, string> = {
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    aqua: "bg-aqua-50 text-aqua-600",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-[14px] shadow-soft p-4 flex items-center gap-3">
      <span
        className={cn(
          "h-10 w-10 rounded-[12px] inline-flex items-center justify-center shrink-0",
          toneBg[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
          {label}
        </div>
        <div className="text-2xl font-bold text-slate-900 leading-tight tabular">
          {value}
        </div>
        {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
          {label}
        </div>
        <div className="text-sm text-slate-700">{value}</div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 h-9 px-2.5 bg-white border border-slate-200 rounded-[10px] text-xs text-slate-600 ring-focus-within">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-slate-700 font-medium outline-none pr-1"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
