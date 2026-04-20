import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Beer,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  Droplets,
  Flame,
  Gauge,
  HardHat,
  Hourglass,
  KanbanSquare,
  Lock,
  MapPin,
  Paperclip,
  Plus,
  QrCode,
  Search,
  Send,
  Settings2,
  Shield,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Target,
  TrendingUp,
  Users,
  Waves,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/lib/store";
import { PageHeader, PageContent } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { Progress } from "@/components/ui/Progress";
import { relativeTime } from "@/lib/format";
import {
  atracoes,
  rotinas,
  usuariosInternos,
  usuarioInternoById,
  atracaoById,
  rotinaById,
} from "@/lib/mock";
import {
  useOSStore,
  useProjetosStore,
  useReunioesStore,
  useRotinasStore,
} from "@/lib/operacoesStore";
import type {
  ActionItemOp,
  Atracao,
  AtracaoCategoria,
  AtracaoStatus,
  OrdemServico,
  OSStatus,
  OSTipo,
  OSPrioridade,
  ProjetoOp,
  Rotina,
  RotinaInstancia,
  RotinaMomento,
  ReuniaoOp,
} from "@/lib/types";

/* ─────────────────────────── HELPERS ─────────────────────────── */

type TabKey = "os" | "rotinas" | "projetos" | "reunioes" | "atracoes";

const OS_COLS: {
  id: OSStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}[] = [
  { id: "solicitado", label: "Solicitado", icon: ClipboardList, tone: "slate" },
  { id: "agendado", label: "Agendado", icon: CalendarClock, tone: "sky" },
  { id: "em_execucao", label: "Em execução", icon: Wrench, tone: "brand" },
  { id: "aguardando", label: "Aguardando", icon: Hourglass, tone: "amber" },
  { id: "concluido", label: "Concluído", icon: CheckCircle2, tone: "emerald" },
];

const PRIORIDADE_TONE: Record<
  OSPrioridade,
  "rose" | "amber" | "slate" | "sky"
> = {
  critica: "rose",
  alta: "amber",
  normal: "slate",
  baixa: "sky",
};

const PRIORIDADE_LABEL: Record<OSPrioridade, string> = {
  critica: "Crítica",
  alta: "Alta",
  normal: "Normal",
  baixa: "Baixa",
};

const TIPO_ICON: Record<
  OSTipo,
  React.ComponentType<{ className?: string }>
> = {
  preventiva: Sparkles,
  corretiva: Wrench,
  limpeza: Droplets,
  seguranca: Shield,
  compra: ShoppingCart,
  evento: Calendar,
  ti: Zap,
};

const TIPO_LABEL: Record<OSTipo, string> = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
  limpeza: "Limpeza",
  seguranca: "Segurança",
  compra: "Compra",
  evento: "Evento",
  ti: "TI",
};

const CATEGORIA_ICON: Record<
  AtracaoCategoria,
  React.ComponentType<{ className?: string }>
> = {
  toboagua: Waves,
  piscina: Waves,
  kids: Waves,
  bar: Beer,
  catraca: QrCode,
  estrutura: Building2,
  equipamento: Settings2,
};

const CATEGORIA_LABEL: Record<AtracaoCategoria, string> = {
  toboagua: "Toboágua",
  piscina: "Piscina",
  kids: "Kids",
  bar: "Bar",
  catraca: "Catraca",
  estrutura: "Estrutura",
  equipamento: "Equipamento",
};

const ATR_STATUS_TONE: Record<
  AtracaoStatus,
  "emerald" | "amber" | "rose" | "slate"
> = {
  operacional: "emerald",
  manutencao: "amber",
  fora_ar: "rose",
  inativa: "slate",
};

const ATR_STATUS_LABEL: Record<AtracaoStatus, string> = {
  operacional: "Operacional",
  manutencao: "Em manutenção",
  fora_ar: "Fora do ar",
  inativa: "Inativa",
};

const MOMENTO_META: Record<
  RotinaMomento,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: "amber" | "sky" | "violet";
  }
> = {
  abertura: { label: "Abertura", icon: Sunrise, tone: "amber" },
  durante: { label: "Durante o dia", icon: Sun, tone: "sky" },
  fechamento: { label: "Fechamento", icon: Sunset, tone: "violet" },
};

const fmtCurrency = (n?: number) =>
  n != null
    ? n.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : "—";

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "—";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const isOverdue = (iso?: string) => {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
};

const mapPersonaToOpId = (
  personaId: string | undefined,
  papel: string | undefined
): string => {
  if (papel === "gestor" || papel === "admin") return "gestor1";
  if (papel === "supervisor") return "sup1";
  if (papel === "sac") return "sup2";
  if (papel === "corretor" && personaId) return personaId;
  return "gestor1";
};

/* ─────────────────────────── PÁGINA ─────────────────────────── */

export function Operacoes() {
  const persona = useApp((s) => s.persona);
  const currentUserId = useMemo(
    () => mapPersonaToOpId(persona?.id, persona?.papel),
    [persona?.id, persona?.papel]
  );

  const [tab, setTab] = useState<TabKey>("os");
  const [novaOSOpen, setNovaOSOpen] = useState(false);

  const osList = useOSStore((s) => s.items);
  const projetosList = useProjetosStore((s) => s.items);
  const rotinasList = useRotinasStore((s) => s.items);

  const kpis = useMemo(() => {
    const osAbertas = osList.filter((o) => o.status !== "concluido");
    const osCritica = osAbertas.filter((o) => o.prioridade === "critica").length;
    const osVencida = osAbertas.filter(
      (o) => o.agendado_para && isOverdue(o.agendado_para)
    ).length;
    const rotinasHoje = rotinasList.length;
    const rotinasPendentes = rotinasList.filter(
      (r) => r.status === "pendente" || r.status === "atrasada"
    ).length;
    const atracoesForaAr = atracoes.filter(
      (a) => a.status === "fora_ar"
    ).length;
    const atracoesManut = atracoes.filter(
      (a) => a.status === "manutencao"
    ).length;
    return {
      osAbertas: osAbertas.length,
      osCritica,
      osVencida,
      rotinasHoje,
      rotinasPendentes,
      atracoesForaAr,
      atracoesManut,
      projetosAtivos: projetosList.filter((p) => p.status === "em_execucao")
        .length,
    };
  }, [osList, projetosList, rotinasList]);

  return (
    <>
      <PageHeader
        title="Central Operacional"
        subtitle="Ordens de serviço, rotinas, projetos e reuniões do parque"
        actions={
          <div className="flex items-center gap-2">
            {kpis.atracoesForaAr > 0 && (
              <Badge tone="rose" dot>
                {kpis.atracoesForaAr} atração fora do ar
              </Badge>
            )}
            {kpis.osCritica > 0 && (
              <Badge tone="rose" dot>
                {kpis.osCritica} OS crítica
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setNovaOSOpen(true)}
            >
              Nova OS
            </Button>
          </div>
        }
        tabs={
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              {
                id: "os",
                label: "Ordens de Serviço",
                icon: KanbanSquare,
                count: kpis.osAbertas,
              },
              {
                id: "rotinas",
                label: "Rotinas do dia",
                icon: ClipboardCheck,
                count: kpis.rotinasPendentes,
                countTone: "amber",
              },
              {
                id: "projetos",
                label: "Projetos",
                icon: Target,
                count: kpis.projetosAtivos,
              },
              {
                id: "reunioes",
                label: "Reuniões",
                icon: Users,
              },
              {
                id: "atracoes",
                label: "Atrações",
                icon: Waves,
              },
            ]}
          />
        }
      />

      {tab === "os" && <OSTabContent currentUserId={currentUserId} />}
      {tab === "rotinas" && <RotinasTab currentUserId={currentUserId} />}
      {tab === "projetos" && <ProjetosTab currentUserId={currentUserId} />}
      {tab === "reunioes" && <ReunioesTab currentUserId={currentUserId} />}
      {tab === "atracoes" && <AtracoesTab />}

      <NovaOSDialog
        open={novaOSOpen}
        onClose={() => setNovaOSOpen(false)}
        currentUserId={currentUserId}
      />
    </>
  );
}

/* ─────────────────────────── TABS ─────────────────────────── */

function Tabs({
  value,
  onChange,
  items,
}: {
  value: TabKey;
  onChange: (t: TabKey) => void;
  items: {
    id: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    countTone?: "amber" | "rose" | "slate";
  }[];
}) {
  return (
    <div className="flex items-center gap-1 -mb-[17px] border-b border-transparent overflow-x-auto">
      {items.map((it) => {
        const Icon = it.icon;
        const active = it.id === value;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              "h-10 px-3.5 inline-flex items-center gap-2 text-[13px] font-medium border-b-2 transition ring-focus",
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                active ? "text-brand-600" : "text-slate-400"
              )}
            />
            {it.label}
            {it.count !== undefined && it.count > 0 && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 h-[18px] min-w-[22px] inline-flex items-center justify-center text-[10.5px] font-bold tabular ring-1 ring-inset",
                  active
                    ? "bg-brand-50 text-brand-700 ring-brand-100"
                    : it.countTone === "amber"
                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                      : it.countTone === "rose"
                        ? "bg-rose-50 text-rose-700 ring-rose-200"
                        : "bg-slate-100 text-slate-700 ring-slate-200"
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════ TAB: OS (KANBAN) ═══════════════════════════ */

function OSTabContent({ currentUserId }: { currentUserId: string }) {
  const osList = useOSStore((s) => s.items);
  const setStatus = useOSStore((s) => s.setStatus);
  const [filtroSetor, setFiltroSetor] = useState<string>("todos");
  const [filtroPrio, setFiltroPrio] = useState<string>("todas");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroMinhas, setFiltroMinhas] = useState(false);
  const [busca, setBusca] = useState("");
  const [osAbertaId, setOsAbertaId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<OSStatus | null>(null);

  const osAberta = useMemo(
    () => (osAbertaId ? (osList.find((o) => o.id === osAbertaId) ?? null) : null),
    [osAbertaId, osList]
  );

  const setores = useMemo(() => {
    const s = new Set(osList.map((o) => o.setor));
    return ["todos", ...Array.from(s)];
  }, [osList]);

  const osFiltradas = useMemo(() => {
    return osList.filter((o) => {
      if (filtroSetor !== "todos" && o.setor !== filtroSetor) return false;
      if (filtroPrio !== "todas" && o.prioridade !== filtroPrio) return false;
      if (filtroTipo !== "todos" && o.tipo !== filtroTipo) return false;
      if (filtroMinhas && o.responsavel_id !== currentUserId) return false;
      if (busca) {
        const q = busca.toLowerCase();
        if (
          !o.titulo.toLowerCase().includes(q) &&
          !o.codigo.toLowerCase().includes(q) &&
          !(o.descricao ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [osList, filtroSetor, filtroPrio, filtroTipo, filtroMinhas, busca, currentUserId]);

  const moverOS = (id: string, novoStatus: OSStatus) => setStatus(id, novoStatus);

  return (
    <>
      <PageContent className="!pb-0">
        <OSToolbar
          busca={busca}
          setBusca={setBusca}
          filtroSetor={filtroSetor}
          setFiltroSetor={setFiltroSetor}
          filtroPrio={filtroPrio}
          setFiltroPrio={setFiltroPrio}
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
          filtroMinhas={filtroMinhas}
          setFiltroMinhas={setFiltroMinhas}
          setores={setores}
          totalFiltradas={osFiltradas.length}
        />
      </PageContent>

      <div className="px-7 pb-7 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {OS_COLS.map((col) => {
            const items = osFiltradas
              .filter((o) => o.status === col.id)
              .sort((a, b) => {
                const pa = ["critica", "alta", "normal", "baixa"].indexOf(
                  a.prioridade
                );
                const pb = ["critica", "alta", "normal", "baixa"].indexOf(
                  b.prioridade
                );
                return pa - pb;
              });
            const Icon = col.icon;
            const isOver = dragOverCol === col.id;
            return (
              <div key={col.id} className="w-[320px] shrink-0">
                <div
                  className={cn(
                    "rounded-[14px] border bg-white shadow-soft overflow-hidden transition",
                    isOver
                      ? "border-brand-400 ring-2 ring-brand-500/20"
                      : "border-slate-200"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== col.id) setDragOverCol(col.id);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingId) moverOS(draggingId, col.id);
                    setDragOverCol(null);
                    setDraggingId(null);
                  }}
                >
                  <div className="px-3.5 py-3 flex items-center gap-2 border-b border-slate-100 bg-slate-50/60">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <div className="text-[13px] font-semibold text-slate-900">
                      {col.label}
                    </div>
                    <span className="ml-auto text-[11px] font-semibold text-slate-500 tabular bg-white border border-slate-200 rounded-full px-2 py-0.5">
                      {items.length}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-2 min-h-[200px] max-h-[calc(100vh-330px)] overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="text-[12px] text-slate-400 text-center py-6">
                        Arraste uma OS para cá
                      </div>
                    ) : (
                      items.map((os) => (
                        <OSCard
                          key={os.id}
                          os={os}
                          isDragging={draggingId === os.id}
                          onClick={() => setOsAbertaId(os.id)}
                          onDragStart={() => setDraggingId(os.id)}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverCol(null);
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <OSDetailDialog
        os={osAberta}
        onClose={() => setOsAbertaId(null)}
        onMove={(id, s) => {
          moverOS(id, s);
        }}
      />
    </>
  );
}

function OSToolbar({
  busca,
  setBusca,
  filtroSetor,
  setFiltroSetor,
  filtroPrio,
  setFiltroPrio,
  filtroTipo,
  setFiltroTipo,
  filtroMinhas,
  setFiltroMinhas,
  setores,
  totalFiltradas,
}: {
  busca: string;
  setBusca: (v: string) => void;
  filtroSetor: string;
  setFiltroSetor: (v: string) => void;
  filtroPrio: string;
  setFiltroPrio: (v: string) => void;
  filtroTipo: string;
  setFiltroTipo: (v: string) => void;
  filtroMinhas: boolean;
  setFiltroMinhas: (v: boolean) => void;
  setores: string[];
  totalFiltradas: number;
}) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 shadow-soft p-3 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-[10px] px-3 h-9 min-w-[240px]">
        <Search className="h-3.5 w-3.5 text-slate-500" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por código, título, descrição"
          className="bg-transparent outline-none text-[13px] text-slate-900 placeholder:text-slate-500 flex-1"
        />
      </div>
      <FiltroSelect
        label="Setor"
        value={filtroSetor}
        onChange={setFiltroSetor}
        options={setores.map((s) => ({ value: s, label: s === "todos" ? "Todos setores" : s }))}
      />
      <FiltroSelect
        label="Prioridade"
        value={filtroPrio}
        onChange={setFiltroPrio}
        options={[
          { value: "todas", label: "Todas prioridades" },
          { value: "critica", label: "Crítica" },
          { value: "alta", label: "Alta" },
          { value: "normal", label: "Normal" },
          { value: "baixa", label: "Baixa" },
        ]}
      />
      <FiltroSelect
        label="Tipo"
        value={filtroTipo}
        onChange={setFiltroTipo}
        options={[
          { value: "todos", label: "Todos tipos" },
          { value: "preventiva", label: "Preventiva" },
          { value: "corretiva", label: "Corretiva" },
          { value: "limpeza", label: "Limpeza" },
          { value: "seguranca", label: "Segurança" },
          { value: "compra", label: "Compra" },
          { value: "evento", label: "Evento" },
          { value: "ti", label: "TI" },
        ]}
      />
      <button
        onClick={() => setFiltroMinhas(!filtroMinhas)}
        className={cn(
          "h-9 px-3 rounded-[10px] text-[12.5px] font-medium border transition ring-focus inline-flex items-center gap-1.5",
          filtroMinhas
            ? "bg-brand-50 border-brand-200 text-brand-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        )}
      >
        <HardHat className="h-3.5 w-3.5" />
        Minhas
      </button>
      <div className="ml-auto text-[11.5px] text-slate-500 font-medium">
        {totalFiltradas} OS exibidas
      </div>
    </div>
  );
}

function FiltroSelect({
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
    <label className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-[10px] h-9 px-2.5 text-[12.5px] text-slate-600">
      <span className="text-slate-500 font-medium">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none text-slate-900 font-medium pr-1 cursor-pointer ring-focus"
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

function OSCard({
  os,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  os: OrdemServico;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const projetos = useProjetosStore((s) => s.items);
  const TipoIcon = TIPO_ICON[os.tipo];
  const atr = os.atracao_id ? atracaoById(os.atracao_id) : null;
  const resp = os.responsavel_id ? usuarioInternoById(os.responsavel_id) : null;
  const projeto = os.projeto_id
    ? projetos.find((p) => p.id === os.projeto_id)
    : null;
  const checklistFeitos =
    os.checklist?.filter((c) => c.feito).length ?? 0;
  const checklistTotal = os.checklist?.length ?? 0;
  const overdue = isOverdue(os.agendado_para) && os.status !== "concluido";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "group bg-white rounded-[12px] border border-slate-200 hover:border-brand-300 hover:shadow-pop shadow-soft p-3 cursor-grab active:cursor-grabbing transition ring-focus",
        isDragging && "opacity-40 ring-2 ring-brand-400",
        os.prioridade === "critica" &&
          "border-l-[3px] border-l-rose-500",
        os.prioridade === "alta" &&
          os.prioridade !== "critica" &&
          "border-l-[3px] border-l-amber-500"
      )}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10.5px] font-mono font-bold text-slate-500 tabular">
          {os.codigo}
        </span>
        <Badge tone={PRIORIDADE_TONE[os.prioridade]}>
          {PRIORIDADE_LABEL[os.prioridade]}
        </Badge>
        {os.afeta_seguranca && (
          <Badge tone="rose">
            <ShieldAlert className="h-2.5 w-2.5" /> Segurança
          </Badge>
        )}
        {os.bloqueia_abertura && (
          <Badge tone="amber">
            <AlertTriangle className="h-2.5 w-2.5" /> Bloqueia abertura
          </Badge>
        )}
      </div>
      <div className="mt-1.5 text-[13.5px] font-semibold text-slate-900 leading-snug line-clamp-2">
        {os.titulo}
      </div>
      {atr && (
        <div className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-slate-600 bg-aqua-50 ring-1 ring-inset ring-aqua-100 rounded-full px-2 py-0.5 font-medium">
          <Waves className="h-3 w-3 text-aqua-600" />
          {atr.nome}
        </div>
      )}
      {projeto && (
        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-600">
          <Target className="h-3 w-3 text-slate-400" />
          {projeto.titulo}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <TipoIcon className="h-3 w-3" />
          {TIPO_LABEL[os.tipo]}
        </div>
        {resp ? (
          <div title={resp.nome}>
            <Avatar name={resp.nome} size="xs" />
          </div>
        ) : (
          <div className="text-[10.5px] text-slate-400 italic">Sem responsável</div>
        )}
      </div>
      {checklistTotal > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{
                width: `${(checklistFeitos / checklistTotal) * 100}%`,
              }}
            />
          </div>
          <span className="text-[10.5px] font-semibold text-slate-500 tabular">
            {checklistFeitos}/{checklistTotal}
          </span>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        {os.agendado_para ? (
          <div
            className={cn(
              "inline-flex items-center gap-1",
              overdue && "text-rose-600 font-semibold"
            )}
          >
            <Clock className="h-3 w-3" />
            {fmtDate(os.agendado_para)}
          </div>
        ) : (
          <div className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Criado {relativeTime(os.criado_em)}
          </div>
        )}
        {os.custo_estimado != null && (
          <div className="inline-flex items-center gap-0.5 tabular">
            <DollarSign className="h-3 w-3" />
            {(os.custo_estimado / 1000).toFixed(1)}k
          </div>
        )}
      </div>
    </div>
  );
}

function OSDetailDialog({
  os,
  onClose,
  onMove,
}: {
  os: OrdemServico | null;
  onClose: () => void;
  onMove: (id: string, s: OSStatus) => void;
}) {
  if (!os) return null;
  return <OSDetailDialogInner os={os} onClose={onClose} onMove={onMove} />;
}

function OSDetailDialogInner({
  os,
  onClose,
  onMove,
}: {
  os: OrdemServico;
  onClose: () => void;
  onMove: (id: string, s: OSStatus) => void;
}) {
  const persona = useApp((s) => s.persona);
  const projetos = useProjetosStore((s) => s.items);
  const toggleChecklistItem = useOSStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useOSStore((s) => s.addChecklistItem);
  const removeChecklistItem = useOSStore((s) => s.removeChecklistItem);
  const addComentario = useOSStore((s) => s.addComentario);
  const deleteOS = useOSStore((s) => s.deleteOS);
  const [novoItem, setNovoItem] = useState("");
  const [comentario, setComentario] = useState("");
  const TipoIcon = TIPO_ICON[os.tipo];
  const atr = os.atracao_id ? atracaoById(os.atracao_id) : null;
  const resp = os.responsavel_id ? usuarioInternoById(os.responsavel_id) : null;
  const sol = usuarioInternoById(os.solicitante_id);
  const projeto = os.projeto_id
    ? projetos.find((p) => p.id === os.projeto_id)
    : null;
  const checklistFeitos = os.checklist?.filter((c) => c.feito).length ?? 0;
  const checklistTotal = os.checklist?.length ?? 0;
  const currentUserId = mapPersonaToOpId(persona?.id, persona?.papel);

  const nextStatus: Record<OSStatus, OSStatus | null> = {
    solicitado: "agendado",
    agendado: "em_execucao",
    em_execucao: "aguardando",
    aguardando: "em_execucao",
    concluido: null,
  };
  const concluir: Record<OSStatus, OSStatus | null> = {
    solicitado: null,
    agendado: null,
    em_execucao: "concluido",
    aguardando: "concluido",
    concluido: null,
  };

  return (
    <Dialog
      open={!!os}
      onClose={onClose}
      title={os.titulo}
      subtitle={`${os.codigo} · ${TIPO_LABEL[os.tipo]} · ${os.setor}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <div className="text-[11.5px] text-slate-500">
            Criada {relativeTime(os.criado_em)} por {sol?.nome ?? "—"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(`Excluir ${os.codigo}?`)) {
                  deleteOS(os.id);
                  onClose();
                }
              }}
              className="!text-rose-600 hover:!bg-rose-50"
            >
              Excluir
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
            {concluir[os.status] && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => onMove(os.id, concluir[os.status]!)}
              >
                Concluir OS
              </Button>
            )}
            {nextStatus[os.status] && (
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() => onMove(os.id, nextStatus[os.status]!)}
              >
                Mover para{" "}
                {OS_COLS.find((c) => c.id === nextStatus[os.status])?.label}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center flex-wrap gap-2">
          <Badge tone={PRIORIDADE_TONE[os.prioridade]}>
            {PRIORIDADE_LABEL[os.prioridade]}
          </Badge>
          <Badge tone="slate">
            <TipoIcon className="h-2.5 w-2.5" />
            {TIPO_LABEL[os.tipo]}
          </Badge>
          <Badge tone={statusTone(os.status)} dot>
            {OS_COLS.find((c) => c.id === os.status)?.label}
          </Badge>
          {os.afeta_seguranca && (
            <Badge tone="rose">
              <ShieldAlert className="h-2.5 w-2.5" /> Segurança
            </Badge>
          )}
          {os.bloqueia_abertura && (
            <Badge tone="amber">
              <AlertTriangle className="h-2.5 w-2.5" /> Bloqueia abertura
            </Badge>
          )}
          {os.incidente_ref && (
            <Badge tone="rose">
              <Flame className="h-2.5 w-2.5" /> {os.incidente_ref}
            </Badge>
          )}
        </div>

        {os.descricao && (
          <p className="text-[13.5px] text-slate-700 leading-[1.55]">
            {os.descricao}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="Atração" value={atr?.nome ?? "—"} icon={Waves} />
          <InfoRow
            label="Responsável"
            value={resp?.nome ?? "Não atribuído"}
            icon={HardHat}
          />
          <InfoRow
            label="Solicitante"
            value={sol?.nome ?? "—"}
            icon={Users}
          />
          <InfoRow
            label="Fornecedor"
            value={os.fornecedor ?? "—"}
            icon={Building2}
          />
          <InfoRow
            label="Agendado para"
            value={fmtDate(os.agendado_para)}
            icon={Calendar}
          />
          <InfoRow
            label="Estimativa"
            value={
              os.horas_estimadas
                ? `${os.horas_estimadas}h · ${fmtCurrency(os.custo_estimado)}`
                : fmtCurrency(os.custo_estimado)
            }
            icon={DollarSign}
          />
          {projeto && (
            <InfoRow
              label="Projeto"
              value={projeto.titulo}
              icon={Target}
            />
          )}
          {(os.horas_reais != null || os.custo_real != null) && (
            <InfoRow
              label="Executado"
              value={
                [
                  os.horas_reais != null ? `${os.horas_reais}h` : null,
                  os.custo_real != null ? fmtCurrency(os.custo_real) : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"
              }
              icon={CheckCircle2}
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold text-slate-900">
              Checklist
            </div>
            <div className="text-[11.5px] text-slate-500 font-medium tabular">
              {checklistFeitos}/{checklistTotal} concluídos
            </div>
          </div>
          <div className="space-y-1">
            {(os.checklist ?? []).map((c) => (
              <div
                key={c.id}
                className="group flex items-start gap-2 px-2.5 py-1.5 rounded-[8px] hover:bg-slate-50 transition"
              >
                <input
                  id={`chk-${c.id}`}
                  type="checkbox"
                  checked={c.feito}
                  onChange={() => toggleChecklistItem(os.id, c.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <label
                  htmlFor={`chk-${c.id}`}
                  className={cn(
                    "text-[13px] flex-1 cursor-pointer",
                    c.feito ? "text-slate-500 line-through" : "text-slate-800"
                  )}
                >
                  {c.texto}
                </label>
                {c.obrigatorio && (
                  <Badge tone="slate" className="!text-[9.5px]">
                    Obrigatório
                  </Badge>
                )}
                <button
                  onClick={() => removeChecklistItem(os.id, c.id)}
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 inline-flex items-center justify-center rounded-[6px] text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  title="Remover item"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = novoItem.trim();
              if (!t) return;
              addChecklistItem(os.id, t);
              setNovoItem("");
            }}
            className="mt-2 flex items-center gap-2"
          >
            <input
              value={novoItem}
              onChange={(e) => setNovoItem(e.target.value)}
              placeholder="+ Adicionar item do checklist"
              className="flex-1 h-8 px-2.5 rounded-[8px] border border-slate-200 bg-white text-[13px] text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!novoItem.trim()}
            >
              Adicionar
            </Button>
          </form>
        </div>

        <div>
          <div className="text-[13px] font-semibold text-slate-900 mb-2">
            Comentários
            {os.comentarios && os.comentarios.length > 0 && (
              <span className="ml-2 text-[11px] text-slate-500 font-medium">
                · {os.comentarios.length}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {(os.comentarios ?? []).map((c) => {
              const u = usuarioInternoById(c.autor_id);
              return (
                <div
                  key={c.id}
                  className="flex gap-2.5 bg-slate-50 rounded-[10px] p-3"
                >
                  <Avatar name={u?.nome ?? "?"} size="xs" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <div className="text-[12.5px] font-semibold text-slate-900">
                        {u?.nome ?? "—"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {relativeTime(c.timestamp)}
                      </div>
                    </div>
                    <div className="text-[13px] text-slate-700 mt-0.5 whitespace-pre-wrap">
                      {c.texto}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = comentario.trim();
              if (!t) return;
              addComentario(os.id, currentUserId, t);
              setComentario("");
            }}
            className="mt-2 flex items-start gap-2"
          >
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Adicionar comentário… (⌘+Enter envia)"
              rows={2}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  const t = comentario.trim();
                  if (!t) return;
                  addComentario(os.id, currentUserId, t);
                  setComentario("");
                }
              }}
              className="flex-1 px-3 py-2 rounded-[10px] border border-slate-200 bg-white text-[13px] text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!comentario.trim()}
              leftIcon={<Send className="h-3.5 w-3.5" />}
            >
              Enviar
            </Button>
          </form>
        </div>

        {os.verificado_em && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 ring-1 ring-inset ring-emerald-200 rounded-[10px]">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <div className="text-[12.5px] text-emerald-800">
              <strong>Verificado</strong> {relativeTime(os.verificado_em)} por{" "}
              {usuarioInternoById(os.verificado_por_id ?? "")?.nome ?? "—"}
            </div>
          </div>
        )}

        {os.tags && os.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {os.tags.map((t) => (
              <span
                key={t}
                className="text-[10.5px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-2.5 bg-slate-50 rounded-[10px] p-2.5">
      <div className="h-7 w-7 rounded-[8px] bg-white ring-1 ring-inset ring-slate-200 inline-flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-[13px] font-medium text-slate-900 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

function statusTone(
  s: OSStatus
): "slate" | "sky" | "brand" | "amber" | "emerald" {
  switch (s) {
    case "solicitado":
      return "slate";
    case "agendado":
      return "sky";
    case "em_execucao":
      return "brand";
    case "aguardando":
      return "amber";
    case "concluido":
      return "emerald";
  }
}

/* ═══════════════════════════ TAB: ROTINAS DO DIA ═══════════════════════════ */

function RotinasTab({ currentUserId }: { currentUserId: string }) {
  const instList = useRotinasStore((s) => s.items);
  const toggleItem = useRotinasStore((s) => s.toggleChecklistItem);
  const [rotinaAberta, setRotinaAberta] = useState<{
    rotina: Rotina;
    instancia: RotinaInstancia;
  } | null>(null);

  const grouped: Record<
    RotinaMomento,
    { rotina: Rotina; instancia: RotinaInstancia }[]
  > = { abertura: [], durante: [], fechamento: [] };

  for (const inst of instList) {
    const r = rotinaById(inst.rotina_id);
    if (!r) continue;
    grouped[r.momento].push({ rotina: r, instancia: inst });
  }

  const totalFeitos = instList.filter((i) => i.status === "concluida").length;
  const totalAtrasadas = instList.filter(
    (i) => i.status === "atrasada"
  ).length;

  const openInstancia = rotinaAberta
    ? instList.find((i) => i.id === rotinaAberta.instancia.id)
    : null;
  const openPair = openInstancia && rotinaAberta
    ? { rotina: rotinaAberta.rotina, instancia: openInstancia }
    : null;

  return (
    <PageContent>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-5">
        <KpiCard
          label="Rotinas hoje"
          value={instList.length}
          icon={ClipboardCheck}
          tone="brand"
        />
        <KpiCard
          label="Concluídas"
          value={`${totalFeitos}/${instList.length}`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <KpiCard
          label="Atrasadas"
          value={totalAtrasadas}
          icon={AlertTriangle}
          tone={totalAtrasadas > 0 ? "rose" : "slate"}
        />
        <KpiCard
          label="Conformidade"
          value={`${
            instList.length > 0
              ? Math.round((totalFeitos / instList.length) * 100)
              : 0
          }%`}
          icon={TrendingUp}
          tone="aqua"
        />
      </div>

      <div className="space-y-6">
        {(["abertura", "durante", "fechamento"] as RotinaMomento[]).map(
          (m) => {
            const items = grouped[m];
            if (!items.length) return null;
            const meta = MOMENTO_META[m];
            const Icon = meta.icon;
            return (
              <div key={m}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-[10px] inline-flex items-center justify-center ring-1 ring-inset",
                      meta.tone === "amber"
                        ? "bg-amber-50 ring-amber-200"
                        : meta.tone === "sky"
                          ? "bg-sky-50 ring-sky-200"
                          : "bg-violet-50 ring-violet-200"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        meta.tone === "amber"
                          ? "text-amber-600"
                          : meta.tone === "sky"
                            ? "text-sky-600"
                            : "text-violet-600"
                      )}
                    />
                  </div>
                  <div className="text-[15px] font-semibold text-slate-900">
                    {meta.label}
                  </div>
                  <span className="text-[11.5px] text-slate-500 font-medium">
                    · {items.length}{" "}
                    {items.length === 1 ? "rotina" : "rotinas"}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.map(({ rotina, instancia }) => (
                    <RotinaCard
                      key={instancia.id}
                      rotina={rotina}
                      instancia={instancia}
                      onOpen={() =>
                        setRotinaAberta({ rotina, instancia })
                      }
                      isMine={instancia.responsavel_id === currentUserId}
                    />
                  ))}
                </div>
              </div>
            );
          }
        )}
      </div>

      <RotinaDetailDialog
        data={openPair}
        onClose={() => setRotinaAberta(null)}
        onToggle={toggleItem}
      />
    </PageContent>
  );
}

function RotinaCard({
  rotina,
  instancia,
  onOpen,
  isMine,
}: {
  rotina: Rotina;
  instancia: RotinaInstancia;
  onOpen: () => void;
  isMine: boolean;
}) {
  const resp = usuarioInternoById(instancia.responsavel_id);
  const feitos = instancia.checklist_feitos.length;
  const total = rotina.checklist.length;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
  const atr = rotina.atracao_id ? atracaoById(rotina.atracao_id) : null;

  const statusConfig: Record<
    RotinaInstancia["status"],
    { label: string; tone: "emerald" | "sky" | "slate" | "rose" | "amber" }
  > = {
    concluida: { label: "Concluída", tone: "emerald" },
    em_andamento: { label: "Em andamento", tone: "sky" },
    pendente: { label: "Pendente", tone: "slate" },
    atrasada: { label: "Atrasada", tone: "rose" },
    pulada: { label: "Pulada", tone: "amber" },
  };
  const st = statusConfig[instancia.status];

  return (
    <button
      onClick={onOpen}
      className="group text-left bg-white rounded-[14px] border border-slate-200 shadow-soft hover:shadow-pop hover:border-brand-300 transition ring-focus overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] font-mono font-bold text-slate-500 tabular">
                {rotina.codigo}
              </span>
              <Badge tone={st.tone} dot>
                {st.label}
              </Badge>
              {rotina.bloqueia_abertura && (
                <Badge tone="amber">
                  <AlertTriangle className="h-2.5 w-2.5" /> Bloqueia abertura
                </Badge>
              )}
              {rotina.afeta_seguranca && (
                <Badge tone="rose">
                  <ShieldAlert className="h-2.5 w-2.5" /> Segurança
                </Badge>
              )}
              {isMine && (
                <Badge tone="brand">
                  <HardHat className="h-2.5 w-2.5" /> Minha
                </Badge>
              )}
            </div>
            <div className="text-[14px] font-semibold text-slate-900 mt-1.5 leading-snug">
              {rotina.titulo}
            </div>
            {atr && (
              <div className="mt-1 text-[12px] text-slate-600">
                {atr.nome}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-[11.5px] text-slate-500">
          {rotina.horario && (
            <div className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {rotina.horario}
            </div>
          )}
          {rotina.duracao_min && (
            <div className="inline-flex items-center gap-1">
              <Hourglass className="h-3 w-3" />
              {rotina.duracao_min}min
            </div>
          )}
          {resp && (
            <div className="ml-auto inline-flex items-center gap-1">
              <Avatar name={resp.nome} size="xs" />
              <span className="truncate max-w-[120px]">{resp.nome}</span>
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-600">
              {feitos}/{total} itens
            </span>
            <span className="text-[11px] font-bold text-slate-700 tabular">
              {pct}%
            </span>
          </div>
          <Progress
            value={pct}
            tone={
              pct === 100
                ? "emerald"
                : instancia.status === "atrasada"
                  ? "rose"
                  : "brand"
            }
            size="sm"
          />
        </div>

        {instancia.observacao && (
          <div className="mt-2 text-[11.5px] text-slate-600 bg-slate-50 rounded-[8px] p-2 line-clamp-2">
            {instancia.observacao}
          </div>
        )}
      </div>
      <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/50 flex items-center justify-between">
        <span className="text-[11.5px] font-medium text-slate-600">
          Abrir checklist
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition" />
      </div>
    </button>
  );
}

function RotinaDetailDialog({
  data,
  onClose,
  onToggle,
}: {
  data: { rotina: Rotina; instancia: RotinaInstancia } | null;
  onClose: () => void;
  onToggle: (instanciaId: string, itemId: string) => void;
}) {
  if (!data) return null;
  const { rotina, instancia } = data;
  const resp = usuarioInternoById(instancia.responsavel_id);
  const feitos = instancia.checklist_feitos.length;
  const total = rotina.checklist.length;

  return (
    <Dialog
      open={!!data}
      onClose={onClose}
      title={rotina.titulo}
      subtitle={`${rotina.codigo} · ${rotina.setor} · ${rotina.horario ?? ""}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {rotina.bloqueia_abertura && (
            <Badge tone="amber">
              <AlertTriangle className="h-2.5 w-2.5" /> Bloqueia abertura
            </Badge>
          )}
          {rotina.afeta_seguranca && (
            <Badge tone="rose">
              <ShieldAlert className="h-2.5 w-2.5" /> Afeta segurança
            </Badge>
          )}
          {rotina.obrigatoria && <Badge tone="slate">Obrigatória</Badge>}
          <Badge tone="sky">{rotina.periodicidade}</Badge>
          {resp && (
            <div className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-slate-600">
              <Avatar name={resp.nome} size="xs" />
              {resp.nome}
            </div>
          )}
        </div>

        {rotina.descricao && (
          <p className="text-[13px] text-slate-700">{rotina.descricao}</p>
        )}

        <div className="bg-slate-50 rounded-[12px] p-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-slate-700">
                Progresso
              </span>
              <span className="text-[12px] font-bold text-slate-900 tabular">
                {feitos}/{total}
              </span>
            </div>
            <Progress
              value={total > 0 ? (feitos / total) * 100 : 0}
              tone={feitos === total ? "emerald" : "brand"}
              size="md"
            />
          </div>
        </div>

        <div className="space-y-1">
          {rotina.checklist.map((c) => {
            const feito = instancia.checklist_feitos.includes(c.id);
            return (
              <label
                key={c.id}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-[10px] border transition cursor-pointer",
                  feito
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={feito}
                  onChange={() => onToggle(instancia.id, c.id)}
                  className="mt-0.5 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-[13.5px]",
                      feito
                        ? "text-emerald-800 line-through"
                        : "text-slate-800"
                    )}
                  >
                    {c.texto}
                  </div>
                </div>
                {c.obrigatorio && (
                  <Badge tone="slate" className="!text-[9.5px]">
                    Obrigatório
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "brand" | "aqua" | "emerald" | "rose" | "slate" | "amber" | "sky";
}) {
  const bg = {
    brand: "bg-brand-50 ring-brand-100 text-brand-700",
    aqua: "bg-aqua-50 ring-aqua-100 text-aqua-700",
    emerald: "bg-emerald-50 ring-emerald-100 text-emerald-700",
    rose: "bg-rose-50 ring-rose-100 text-rose-700",
    slate: "bg-slate-50 ring-slate-200 text-slate-700",
    amber: "bg-amber-50 ring-amber-100 text-amber-700",
    sky: "bg-sky-50 ring-sky-100 text-sky-700",
  }[tone];
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 shadow-soft p-4 flex items-center gap-3">
      <div
        className={cn(
          "h-10 w-10 rounded-[10px] inline-flex items-center justify-center ring-1 ring-inset",
          bg
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-[20px] font-bold text-slate-900 tabular">
          {value}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ TAB: PROJETOS ═══════════════════════════ */

function ProjetosTab({ currentUserId }: { currentUserId: string }) {
  const projetos = useProjetosStore((s) => s.items);
  const [filtroStatus, setFiltroStatus] = useState<string>("ativos");
  const [projAbertoId, setProjAbertoId] = useState<string | null>(null);
  const [novoProjOpen, setNovoProjOpen] = useState(false);

  const projAberto = projAbertoId
    ? (projetos.find((p) => p.id === projAbertoId) ?? null)
    : null;

  const projVisiveis = useMemo(() => {
    return projetos.filter((p) => {
      if (p.privado && !p.membros.includes(currentUserId)) return false;
      if (filtroStatus === "ativos" && p.status !== "em_execucao") return false;
      if (filtroStatus === "planejamento" && p.status !== "planejamento")
        return false;
      if (filtroStatus === "concluidos" && p.status !== "concluido")
        return false;
      return true;
    });
  }, [projetos, filtroStatus, currentUserId]);

  return (
    <PageContent>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <FiltroChip
          active={filtroStatus === "ativos"}
          onClick={() => setFiltroStatus("ativos")}
          label="Em execução"
          count={
            projetos.filter(
              (p) =>
                p.status === "em_execucao" &&
                (!p.privado || p.membros.includes(currentUserId))
            ).length
          }
        />
        <FiltroChip
          active={filtroStatus === "planejamento"}
          onClick={() => setFiltroStatus("planejamento")}
          label="Planejamento"
          count={
            projetos.filter(
              (p) =>
                p.status === "planejamento" &&
                (!p.privado || p.membros.includes(currentUserId))
            ).length
          }
        />
        <FiltroChip
          active={filtroStatus === "concluidos"}
          onClick={() => setFiltroStatus("concluidos")}
          label="Concluídos"
        />
        <FiltroChip
          active={filtroStatus === "todos"}
          onClick={() => setFiltroStatus("todos")}
          label="Todos"
        />
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          className="ml-auto"
          onClick={() => setNovoProjOpen(true)}
        >
          Novo projeto
        </Button>
      </div>

      {projVisiveis.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-dashed border-slate-300 p-10 text-center">
          <Target className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <div className="text-[14px] font-semibold text-slate-700">
            Nenhum projeto {filtroStatus !== "todos" ? `em ${filtroStatus}` : ""}
          </div>
          <div className="text-[12.5px] text-slate-500 mt-1 mb-3">
            Crie um projeto para organizar marcos, equipe e OS vinculadas
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setNovoProjOpen(true)}
          >
            Novo projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {projVisiveis.map((p) => (
            <ProjetoCard
              key={p.id}
              projeto={p}
              onOpen={() => setProjAbertoId(p.id)}
            />
          ))}
        </div>
      )}

      <ProjetoDetailDialog
        projeto={projAberto}
        onClose={() => setProjAbertoId(null)}
      />
      <NovoProjetoDialog
        open={novoProjOpen}
        onClose={() => setNovoProjOpen(false)}
        currentUserId={currentUserId}
      />
    </PageContent>
  );
}

function FiltroChip({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-full text-[12px] font-medium transition ring-focus inline-flex items-center gap-1.5",
        active
          ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200"
          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "text-[10.5px] font-bold px-1.5 py-0.5 rounded-full tabular",
            active
              ? "bg-brand-100 text-brand-700"
              : "bg-slate-100 text-slate-600"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ProjetoCard({
  projeto,
  onOpen,
}: {
  projeto: ProjetoOp;
  onOpen: () => void;
}) {
  const osList = useOSStore((s) => s.items);
  const resp = usuarioInternoById(projeto.responsavel_id);
  const marcosConcluidos =
    projeto.marcos?.filter((m) => m.feito).length ?? 0;
  const marcosTotal = projeto.marcos?.length ?? 0;
  const pct = marcosTotal > 0 ? (marcosConcluidos / marcosTotal) * 100 : 0;
  const osDoProj = osList.filter((o) => o.projeto_id === projeto.id);
  const osAbertas = osDoProj.filter((o) => o.status !== "concluido").length;

  const statusConfig: Record<
    ProjetoOp["status"],
    { label: string; tone: "emerald" | "sky" | "amber" | "slate" | "rose" }
  > = {
    planejamento: { label: "Planejamento", tone: "sky" },
    em_execucao: { label: "Em execução", tone: "brand" as "sky" },
    pausado: { label: "Pausado", tone: "amber" },
    concluido: { label: "Concluído", tone: "emerald" },
    cancelado: { label: "Cancelado", tone: "slate" },
  };
  const st = statusConfig[projeto.status];
  const corMap: Record<ProjetoOp["cor"], string> = {
    brand: "from-brand-500 to-brand-700",
    aqua: "from-aqua-500 to-aqua-700",
    emerald: "from-emerald-500 to-emerald-700",
    amber: "from-amber-500 to-amber-700",
    rose: "from-rose-500 to-rose-700",
    violet: "from-violet-500 to-violet-700",
    sky: "from-sky-500 to-sky-700",
    fuchsia: "from-fuchsia-500 to-fuchsia-700",
  };

  return (
    <button
      onClick={onOpen}
      className="group text-left bg-white rounded-[14px] border border-slate-200 shadow-soft hover:shadow-pop hover:border-brand-300 transition ring-focus overflow-hidden"
    >
      <div
        className={cn(
          "h-1.5 w-full bg-gradient-to-r",
          corMap[projeto.cor]
        )}
      />
      <div className="p-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10.5px] font-mono font-bold text-slate-500 tabular">
            {projeto.codigo}
          </span>
          <Badge tone={st.tone} dot>
            {st.label}
          </Badge>
          <Badge tone={PRIORIDADE_TONE[projeto.prioridade]}>
            {PRIORIDADE_LABEL[projeto.prioridade]}
          </Badge>
          {projeto.privado && (
            <Badge tone="slate">
              <Lock className="h-2.5 w-2.5" /> Privado
            </Badge>
          )}
        </div>
        <div className="mt-2 text-[15px] font-semibold text-slate-900 leading-snug">
          {projeto.titulo}
        </div>
        {projeto.descricao && (
          <p className="mt-1 text-[12.5px] text-slate-600 line-clamp-2 leading-[1.45]">
            {projeto.descricao}
          </p>
        )}

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-600">
              {marcosConcluidos}/{marcosTotal} marcos
            </span>
            <span className="text-[11px] font-bold text-slate-700 tabular">
              {Math.round(pct)}%
            </span>
          </div>
          <Progress
            value={pct}
            tone={pct === 100 ? "emerald" : "brand"}
            size="sm"
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[11.5px] text-slate-500">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide font-semibold">
              Prazo
            </span>
            <span
              className={cn(
                "font-semibold",
                isOverdue(projeto.data_fim_prevista) &&
                  projeto.status !== "concluido"
                  ? "text-rose-600"
                  : "text-slate-700"
              )}
            >
              {fmtDate(projeto.data_fim_prevista)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide font-semibold">
              OS abertas
            </span>
            <span className="font-semibold text-slate-700 tabular">
              {osAbertas}/{osDoProj.length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide font-semibold">
              Orçamento
            </span>
            <span className="font-semibold text-slate-700 tabular">
              {projeto.orcamento_estimado
                ? `${Math.round(
                    ((projeto.orcamento_real ?? 0) /
                      projeto.orcamento_estimado) *
                      100
                  )}%`
                : "—"}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center -space-x-1.5">
            {projeto.membros.slice(0, 4).map((m) => {
              const u = usuarioInternoById(m);
              return u ? (
                <div
                  key={m}
                  className="ring-2 ring-white rounded-full"
                  title={u.nome}
                >
                  <Avatar name={u.nome} size="xs" />
                </div>
              ) : null;
            })}
            {projeto.membros.length > 4 && (
              <div className="h-6 w-6 rounded-full bg-slate-100 ring-2 ring-white inline-flex items-center justify-center text-[10px] font-bold text-slate-600 tabular">
                +{projeto.membros.length - 4}
              </div>
            )}
          </div>
          {resp && (
            <div className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
              {resp.nome}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ProjetoDetailDialog({
  projeto,
  onClose,
}: {
  projeto: ProjetoOp | null;
  onClose: () => void;
}) {
  if (!projeto) return null;
  return <ProjetoDetailDialogInner projeto={projeto} onClose={onClose} />;
}

function ProjetoDetailDialogInner({
  projeto,
  onClose,
}: {
  projeto: ProjetoOp;
  onClose: () => void;
}) {
  const osList = useOSStore((s) => s.items);
  const reunioesList = useReunioesStore((s) => s.items);
  const toggleMarco = useProjetosStore((s) => s.toggleMarco);
  const addMarco = useProjetosStore((s) => s.addMarco);
  const removeMarco = useProjetosStore((s) => s.removeMarco);
  const setProjStatus = useProjetosStore((s) => s.setStatus);
  const deleteProjeto = useProjetosStore((s) => s.deleteProjeto);
  const [novoMarco, setNovoMarco] = useState("");
  const [novoMarcoData, setNovoMarcoData] = useState("");

  const resp = usuarioInternoById(projeto.responsavel_id);
  const osDoProj = osList.filter((o) => o.projeto_id === projeto.id);
  const reuDoProj = reunioesList.filter((r) => r.projeto_id === projeto.id);
  const marcosConcluidos =
    projeto.marcos?.filter((m) => m.feito).length ?? 0;
  const marcosTotal = projeto.marcos?.length ?? 0;

  const nextStatus: Record<ProjetoOp["status"], ProjetoOp["status"] | null> = {
    planejamento: "em_execucao",
    em_execucao: "concluido",
    pausado: "em_execucao",
    concluido: null,
    cancelado: null,
  };
  const pausarToggle: Record<ProjetoOp["status"], ProjetoOp["status"] | null> = {
    planejamento: null,
    em_execucao: "pausado",
    pausado: "em_execucao",
    concluido: null,
    cancelado: null,
  };

  return (
    <Dialog
      open={!!projeto}
      onClose={onClose}
      title={projeto.titulo}
      subtitle={`${projeto.codigo} · ${projeto.setor}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Excluir projeto ${projeto.codigo}?`)) {
                deleteProjeto(projeto.id);
                onClose();
              }
            }}
            className="!text-rose-600 hover:!bg-rose-50"
          >
            Excluir
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
            {pausarToggle[projeto.status] && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setProjStatus(projeto.id, pausarToggle[projeto.status]!)
                }
              >
                {projeto.status === "pausado" ? "Retomar" : "Pausar"}
              </Button>
            )}
            {nextStatus[projeto.status] && (
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                onClick={() =>
                  setProjStatus(projeto.id, nextStatus[projeto.status]!)
                }
              >
                {projeto.status === "planejamento"
                  ? "Iniciar projeto"
                  : "Concluir projeto"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone="sky" dot>
            {projeto.status === "em_execucao"
              ? "Em execução"
              : projeto.status === "planejamento"
                ? "Planejamento"
                : projeto.status}
          </Badge>
          <Badge tone={PRIORIDADE_TONE[projeto.prioridade]}>
            {PRIORIDADE_LABEL[projeto.prioridade]}
          </Badge>
          {projeto.privado && (
            <Badge tone="slate">
              <Lock className="h-2.5 w-2.5" /> Privado
            </Badge>
          )}
        </div>

        {projeto.descricao && (
          <p className="text-[13.5px] text-slate-700 leading-[1.55]">
            {projeto.descricao}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="Responsável" value={resp?.nome ?? "—"} icon={HardHat} />
          <InfoRow
            label="Prazo"
            value={fmtDate(projeto.data_fim_prevista)}
            icon={Calendar}
          />
          <InfoRow
            label="Orçamento"
            value={`${fmtCurrency(projeto.orcamento_real)} de ${fmtCurrency(projeto.orcamento_estimado)}`}
            icon={DollarSign}
          />
          <InfoRow
            label="Progresso"
            value={`${marcosConcluidos}/${marcosTotal} marcos`}
            icon={Target}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold text-slate-900">
              Marcos do projeto
            </div>
            <div className="text-[11.5px] text-slate-500 font-medium tabular">
              {marcosConcluidos}/{marcosTotal} concluídos
            </div>
          </div>
          {projeto.marcos && projeto.marcos.length > 0 && (
            <div className="space-y-1">
              {projeto.marcos.map((m) => (
                <div
                  key={m.id}
                  className="group flex items-start gap-2 px-2.5 py-2 rounded-[8px] hover:bg-slate-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={m.feito}
                    onChange={() => toggleMarco(projeto.id, m.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-[13px] font-medium",
                        m.feito
                          ? "text-slate-500 line-through"
                          : "text-slate-900"
                      )}
                    >
                      {m.titulo}
                    </div>
                    <div
                      className={cn(
                        "text-[11px]",
                        isOverdue(m.data) && !m.feito
                          ? "text-rose-600 font-semibold"
                          : "text-slate-500"
                      )}
                    >
                      {fmtDate(m.data)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeMarco(projeto.id, m.id)}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 inline-flex items-center justify-center rounded-[6px] text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Remover marco"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = novoMarco.trim();
              const d = novoMarcoData;
              if (!t || !d) return;
              addMarco(projeto.id, t, d);
              setNovoMarco("");
              setNovoMarcoData("");
            }}
            className="mt-2 flex items-center gap-2"
          >
            <input
              value={novoMarco}
              onChange={(e) => setNovoMarco(e.target.value)}
              placeholder="+ Adicionar marco"
              className="flex-1 h-8 px-2.5 rounded-[8px] border border-slate-200 bg-white text-[13px] text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
            />
            <input
              type="date"
              value={novoMarcoData}
              onChange={(e) => setNovoMarcoData(e.target.value)}
              className="h-8 px-2.5 rounded-[8px] border border-slate-200 bg-white text-[13px] text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!novoMarco.trim() || !novoMarcoData}
            >
              Adicionar
            </Button>
          </form>
        </div>

        {osDoProj.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-slate-900 mb-2">
              Ordens de Serviço vinculadas ({osDoProj.length})
            </div>
            <div className="space-y-1">
              {osDoProj.map((os) => {
                const TipoIcon = TIPO_ICON[os.tipo];
                return (
                  <div
                    key={os.id}
                    className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-[10px]"
                  >
                    <TipoIcon className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="text-[11px] font-mono font-bold text-slate-500 tabular">
                      {os.codigo}
                    </span>
                    <span className="flex-1 text-[13px] text-slate-800 truncate">
                      {os.titulo}
                    </span>
                    <Badge tone={statusTone(os.status)} dot>
                      {OS_COLS.find((c) => c.id === os.status)?.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {reuDoProj.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-slate-900 mb-2">
              Reuniões vinculadas ({reuDoProj.length})
            </div>
            <div className="space-y-1">
              {reuDoProj.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-[10px]"
                >
                  <CalendarCheck className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="text-[11px] font-mono font-bold text-slate-500 tabular">
                    {r.codigo}
                  </span>
                  <span className="flex-1 text-[13px] text-slate-800 truncate">
                    {r.titulo}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {fmtDateTime(r.data_hora_inicio)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-[13px] font-semibold text-slate-900 mb-2">
            Equipe ({projeto.membros.length})
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {projeto.membros.map((m) => {
              const u = usuarioInternoById(m);
              return u ? (
                <div
                  key={m}
                  className="inline-flex items-center gap-1.5 bg-slate-50 rounded-full pl-1 pr-3 py-1"
                >
                  <Avatar name={u.nome} size="xs" />
                  <span className="text-[12px] font-medium text-slate-700">
                    {u.nome}
                  </span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════ TAB: REUNIÕES ═══════════════════════════ */

function ReunioesTab({ currentUserId }: { currentUserId: string }) {
  const reunioesList = useReunioesStore((s) => s.items);
  const [reuAbertaId, setReuAbertaId] = useState<string | null>(null);
  const [novaReuOpen, setNovaReuOpen] = useState(false);

  const reuAberta = reuAbertaId
    ? (reunioesList.find((r) => r.id === reuAbertaId) ?? null)
    : null;

  const proximas = reunioesList
    .filter((r) => r.status === "agendada" || r.status === "em_andamento")
    .sort((a, b) => a.data_hora_inicio.localeCompare(b.data_hora_inicio));
  const passadas = reunioesList
    .filter((r) => r.status === "realizada" || r.status === "cancelada")
    .sort((a, b) => b.data_hora_inicio.localeCompare(a.data_hora_inicio));

  return (
    <PageContent>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Badge tone="brand" dot>
            {proximas.length} próximas
          </Badge>
          <Badge tone="slate">{passadas.length} realizadas</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setNovaReuOpen(true)}
        >
          Agendar reunião
        </Button>
      </div>

      <div className="space-y-5">
        <div>
          <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Próximas
          </div>
          <div className="space-y-2">
            {proximas.length === 0 ? (
              <div className="text-[13px] text-slate-500 bg-white rounded-[14px] border border-dashed border-slate-300 p-8 text-center">
                <CalendarCheck className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                <div className="text-[13.5px] font-semibold text-slate-700">
                  Nenhuma reunião agendada
                </div>
                <div className="text-[12px] text-slate-500 mt-0.5 mb-3">
                  Agende uma reunião para alinhar o time
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setNovaReuOpen(true)}
                >
                  Agendar reunião
                </Button>
              </div>
            ) : (
              proximas.map((r) => (
                <ReuniaoRow
                  key={r.id}
                  reuniao={r}
                  onOpen={() => setReuAbertaId(r.id)}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </div>
        </div>

        {passadas.length > 0 && (
          <div>
            <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Realizadas
            </div>
            <div className="space-y-2">
              {passadas.map((r) => (
                <ReuniaoRow
                  key={r.id}
                  reuniao={r}
                  onOpen={() => setReuAbertaId(r.id)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ReuniaoDetailDialog
        reuniao={reuAberta}
        onClose={() => setReuAbertaId(null)}
      />
      <NovaReuniaoDialog
        open={novaReuOpen}
        onClose={() => setNovaReuOpen(false)}
        currentUserId={currentUserId}
      />
    </PageContent>
  );
}

function ReuniaoRow({
  reuniao,
  onOpen,
  currentUserId,
}: {
  reuniao: ReuniaoOp;
  onOpen: () => void;
  currentUserId: string;
}) {
  const org = usuarioInternoById(reuniao.organizador_id);
  const minhaPart = reuniao.participantes.find(
    (p) => p.user_id === currentUserId
  );
  const tipoLabel: Record<ReuniaoOp["tipo"], string> = {
    briefing_matinal: "Briefing matinal",
    semanal_manut: "Semanal manutenção",
    semanal_seg: "Semanal segurança",
    post_mortem: "Post-mortem",
    planejamento: "Planejamento",
    emergencial: "Emergencial",
  };
  const statusTone: Record<
    ReuniaoOp["status"],
    "brand" | "sky" | "slate" | "rose"
  > = {
    agendada: "sky",
    em_andamento: "brand",
    realizada: "slate",
    cancelada: "rose",
  };

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-[14px] border border-slate-200 shadow-soft hover:shadow-pop hover:border-brand-300 transition ring-focus p-4 flex items-center gap-4"
    >
      <div className="h-14 w-14 shrink-0 rounded-[12px] bg-brand-50 ring-1 ring-inset ring-brand-100 flex flex-col items-center justify-center">
        <div className="text-[10.5px] font-semibold text-brand-600 uppercase">
          {new Date(reuniao.data_hora_inicio).toLocaleDateString("pt-BR", {
            month: "short",
          })}
        </div>
        <div className="text-[18px] font-bold text-brand-700 tabular leading-none">
          {new Date(reuniao.data_hora_inicio).getDate()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10.5px] font-mono font-bold text-slate-500 tabular">
            {reuniao.codigo}
          </span>
          <Badge tone={statusTone[reuniao.status]} dot>
            {reuniao.status}
          </Badge>
          <Badge tone="slate">{tipoLabel[reuniao.tipo]}</Badge>
          {reuniao.recorrente && (
            <Badge tone="sky">
              <CalendarClock className="h-2.5 w-2.5" /> {reuniao.frequencia}
            </Badge>
          )}
          {reuniao.incidente_ref && (
            <Badge tone="rose">
              <Flame className="h-2.5 w-2.5" /> {reuniao.incidente_ref}
            </Badge>
          )}
        </div>
        <div className="text-[14px] font-semibold text-slate-900 mt-0.5">
          {reuniao.titulo}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11.5px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {fmtDateTime(reuniao.data_hora_inicio)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {reuniao.local}
          </span>
          {org && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {org.nome}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        {minhaPart && (
          <Badge
            tone={
              minhaPart.confirmacao === "confirmado"
                ? "emerald"
                : minhaPart.confirmacao === "recusado"
                  ? "rose"
                  : minhaPart.confirmacao === "talvez"
                    ? "amber"
                    : "slate"
            }
          >
            {minhaPart.confirmacao}
          </Badge>
        )}
        <div className="flex items-center -space-x-1.5">
          {reuniao.participantes.slice(0, 3).map((p) => {
            const u = usuarioInternoById(p.user_id);
            return u ? (
              <div
                key={p.user_id}
                className="ring-2 ring-white rounded-full"
                title={u.nome}
              >
                <Avatar name={u.nome} size="xs" />
              </div>
            ) : null;
          })}
          {reuniao.participantes.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-slate-100 ring-2 ring-white inline-flex items-center justify-center text-[10px] font-bold text-slate-600 tabular">
              +{reuniao.participantes.length - 3}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ReuniaoDetailDialog({
  reuniao,
  onClose,
}: {
  reuniao: ReuniaoOp | null;
  onClose: () => void;
}) {
  if (!reuniao) return null;
  return <ReuniaoDetailDialogInner reuniao={reuniao} onClose={onClose} />;
}

function ReuniaoDetailDialogInner({
  reuniao,
  onClose,
}: {
  reuniao: ReuniaoOp;
  onClose: () => void;
}) {
  const persona = useApp((s) => s.persona);
  const currentUserId = mapPersonaToOpId(persona?.id, persona?.papel);
  const createOS = useOSStore((s) => s.createOS);
  const encerrarReuniao = useReunioesStore((s) => s.encerrarReuniao);
  const gerarResumoIA = useReunioesStore((s) => s.gerarResumoIA);
  const setPautaStatus = useReunioesStore((s) => s.setPautaStatus);
  const addActionItem = useReunioesStore((s) => s.addActionItem);
  const marcarConvertido = useReunioesStore((s) => s.marcarActionItemConvertido);
  const setActionItemStatus = useReunioesStore((s) => s.setActionItemStatus);
  const setConfirmacao = useReunioesStore((s) => s.setConfirmacao);
  const deleteReuniao = useReunioesStore((s) => s.deleteReuniao);
  const [aba, setAba] = useState<"pauta" | "ata" | "participantes" | "acoes">(
    "pauta"
  );
  const [novoAIItem, setNovoAIItem] = useState("");
  const [novoAIResp, setNovoAIResp] = useState(currentUserId);
  const [novoAIPrazo, setNovoAIPrazo] = useState("");
  const org = usuarioInternoById(reuniao.organizador_id);

  return (
    <Dialog
      open={!!reuniao}
      onClose={onClose}
      title={reuniao.titulo}
      subtitle={`${reuniao.codigo} · ${fmtDateTime(reuniao.data_hora_inicio)} · ${reuniao.local}`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(`Excluir reunião ${reuniao.codigo}?`)) {
                  deleteReuniao(reuniao.id);
                  onClose();
                }
              }}
              className="!text-rose-600 hover:!bg-rose-50"
            >
              Excluir
            </Button>
            <div className="text-[11.5px] text-slate-500">
              Organizado por {org?.nome ?? "—"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
            {reuniao.status !== "cancelada" && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                onClick={() => {
                  gerarResumoIA(reuniao.id);
                  setAba("ata");
                }}
              >
                Gerar resumo IA
              </Button>
            )}
            {(reuniao.status === "agendada" ||
              reuniao.status === "em_andamento") && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  encerrarReuniao(reuniao.id);
                }}
              >
                Encerrar reunião
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="border-b border-slate-200 mb-4 flex items-center gap-1 -mx-6 px-6">
        {(
          [
            { id: "pauta", label: "Pauta", count: reuniao.pauta.length },
            { id: "ata", label: "Ata", count: undefined },
            {
              id: "participantes",
              label: "Participantes",
              count: reuniao.participantes.length,
            },
            {
              id: "acoes",
              label: "Action items",
              count: reuniao.action_items.length,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={cn(
              "h-9 px-3 text-[12.5px] font-medium border-b-2 transition ring-focus inline-flex items-center gap-1.5",
              aba === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full tabular">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {aba === "pauta" && (
        <div className="space-y-2">
          {reuniao.pauta.map((p) => {
            const pResp = p.responsavel_id
              ? usuarioInternoById(p.responsavel_id)
              : null;
            return (
              <div
                key={p.id}
                className="flex items-start gap-3 p-3 bg-white rounded-[12px] border border-slate-200"
              >
                <div className="h-7 w-7 rounded-[8px] bg-brand-50 ring-1 ring-inset ring-brand-100 inline-flex items-center justify-center text-[11px] font-bold text-brand-700 shrink-0">
                  {p.ordem}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13.5px] font-semibold text-slate-900">
                      {p.titulo}
                    </div>
                    <select
                      value={p.status}
                      onChange={(e) =>
                        setPautaStatus(
                          reuniao.id,
                          p.id,
                          e.target.value as "pendente" | "discutido" | "adiado"
                        )
                      }
                      className="h-6 text-[11px] font-medium bg-white border border-slate-200 rounded-[6px] px-1.5 text-slate-700 outline-none focus:border-brand-400"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="discutido">Discutido</option>
                      <option value="adiado">Adiado</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11.5px] text-slate-500">
                    {pResp && (
                      <span className="inline-flex items-center gap-1">
                        <Avatar name={pResp.nome} size="xs" />
                        {pResp.nome}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Hourglass className="h-3 w-3" />
                      {p.duracao_min}min
                    </span>
                  </div>
                  {p.resultado && (
                    <div className="mt-2 text-[12.5px] text-slate-700 bg-slate-50 rounded-[8px] p-2">
                      {p.resultado}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {reuniao.pauta.length === 0 && (
            <div className="text-[13px] text-slate-500 text-center py-8">
              Nenhum item de pauta registrado
            </div>
          )}
        </div>
      )}

      {aba === "ata" && (
        <div className="space-y-4">
          {reuniao.ata ? (
            <div className="bg-white border border-slate-200 rounded-[12px] p-4">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Ata
              </div>
              <p className="text-[13.5px] text-slate-800 leading-[1.6] whitespace-pre-line">
                {reuniao.ata}
              </p>
            </div>
          ) : (
            <div className="text-[13px] text-slate-500 text-center py-8">
              Ata ainda não preenchida
            </div>
          )}
          {reuniao.decisoes && (
            <div className="bg-emerald-50 ring-1 ring-inset ring-emerald-200 rounded-[12px] p-4">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                Decisões
              </div>
              <p className="text-[13.5px] text-emerald-900 leading-[1.55] whitespace-pre-line">
                {reuniao.decisoes}
              </p>
            </div>
          )}
          {reuniao.resumo_ai && (
            <div className="bg-brand-50 ring-1 ring-inset ring-brand-200 rounded-[12px] p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                <div className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide">
                  Resumo IA
                </div>
              </div>
              <p className="text-[13.5px] text-brand-900 leading-[1.55] whitespace-pre-line">
                {reuniao.resumo_ai}
              </p>
            </div>
          )}
        </div>
      )}

      {aba === "participantes" && (
        <div className="space-y-1.5">
          {reuniao.participantes.map((p) => {
            const u = usuarioInternoById(p.user_id);
            if (!u) return null;
            return (
              <div
                key={p.user_id}
                className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-[10px]"
              >
                <Avatar name={u.nome} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900">
                    {u.nome}
                  </div>
                  <div className="text-[11.5px] text-slate-500">
                    {u.cargo} · {p.role}
                  </div>
                </div>
                {p.user_id === currentUserId &&
                reuniao.status === "agendada" ? (
                  <select
                    value={p.confirmacao}
                    onChange={(e) =>
                      setConfirmacao(
                        reuniao.id,
                        p.user_id,
                        e.target.value as
                          | "pendente"
                          | "confirmado"
                          | "recusado"
                          | "talvez"
                      )
                    }
                    className="h-7 text-[11.5px] font-medium bg-white border border-brand-300 rounded-[6px] px-1.5 text-brand-700 outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="talvez">Talvez</option>
                    <option value="recusado">Recusado</option>
                  </select>
                ) : (
                  <Badge
                    tone={
                      p.confirmacao === "confirmado"
                        ? "emerald"
                        : p.confirmacao === "recusado"
                          ? "rose"
                          : p.confirmacao === "talvez"
                            ? "amber"
                            : "slate"
                    }
                  >
                    {p.confirmacao}
                  </Badge>
                )}
                {reuniao.status === "realizada" && (
                  <Badge tone={p.presente ? "emerald" : "slate"}>
                    {p.presente ? "Presente" : "Ausente"}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {aba === "acoes" && (
        <div className="space-y-3">
          <div className="space-y-2">
            {reuniao.action_items.length === 0 ? (
              <div className="text-[13px] text-slate-500 text-center py-8">
                Nenhum action item registrado
              </div>
            ) : (
              reuniao.action_items.map((ai) => {
                const u = usuarioInternoById(ai.responsavel_id);
                return (
                  <div
                    key={ai.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-[12px] border border-slate-200"
                  >
                    <span className="text-[10.5px] font-mono font-bold text-slate-500 tabular shrink-0">
                      {ai.codigo}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-slate-900">
                        {ai.titulo}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                        {u && (
                          <span className="inline-flex items-center gap-1">
                            <Avatar name={u.nome} size="xs" />
                            {u.nome}
                          </span>
                        )}
                        <span>Prazo {fmtDate(ai.prazo)}</span>
                      </div>
                    </div>
                    {ai.convertido_em_os ? (
                      <Badge tone="sky">
                        <ArrowRight className="h-2.5 w-2.5" /> Virou OS
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nova = createOS({
                            titulo: ai.titulo,
                            descricao: `Gerada a partir do action item ${ai.codigo} da reunião ${reuniao.codigo}`,
                            tipo: "corretiva",
                            prioridade: "normal",
                            setor: "Operacional",
                            responsavel_id: ai.responsavel_id,
                            solicitante_id: currentUserId,
                            agendado_para: ai.prazo,
                          });
                          marcarConvertido(reuniao.id, ai.id, nova.id);
                        }}
                      >
                        Converter em OS
                      </Button>
                    )}
                    <select
                      value={ai.status}
                      onChange={(e) =>
                        setActionItemStatus(
                          reuniao.id,
                          ai.id,
                          e.target.value as ActionItemOp["status"]
                        )
                      }
                      className="h-7 text-[11px] font-medium bg-white border border-slate-200 rounded-[6px] px-1.5 text-slate-700 outline-none focus:border-brand-400"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = novoAIItem.trim();
              if (!t || !novoAIResp || !novoAIPrazo) return;
              addActionItem(reuniao.id, t, novoAIResp, novoAIPrazo);
              setNovoAIItem("");
              setNovoAIPrazo("");
            }}
            className="p-3 bg-slate-50 rounded-[12px] border border-dashed border-slate-300 space-y-2"
          >
            <div className="text-[11.5px] font-semibold text-slate-600 uppercase tracking-wide">
              + Novo action item
            </div>
            <input
              value={novoAIItem}
              onChange={(e) => setNovoAIItem(e.target.value)}
              placeholder="O que precisa ser feito?"
              className="w-full h-9 px-3 rounded-[8px] border border-slate-200 bg-white text-[13px] text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20"
            />
            <div className="flex items-center gap-2">
              <select
                value={novoAIResp}
                onChange={(e) => setNovoAIResp(e.target.value)}
                className="h-9 px-2.5 rounded-[8px] border border-slate-200 bg-white text-[13px] text-slate-900 outline-none focus:border-brand-400 flex-1 min-w-0"
              >
                {usuariosInternos.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={novoAIPrazo}
                onChange={(e) => setNovoAIPrazo(e.target.value)}
                className="h-9 px-2.5 rounded-[8px] border border-slate-200 bg-white text-[13px] text-slate-900 outline-none focus:border-brand-400"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!novoAIItem.trim() || !novoAIPrazo}
              >
                Adicionar
              </Button>
            </div>
          </form>
        </div>
      )}
    </Dialog>
  );
}

/* ═══════════════════════════ TAB: ATRAÇÕES ═══════════════════════════ */

function AtracoesTab() {
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  const [atrAberta, setAtrAberta] = useState<Atracao | null>(null);

  const atracoesFiltradas = atracoes.filter((a) => {
    if (filtroCategoria !== "todas" && a.categoria !== filtroCategoria)
      return false;
    if (filtroStatus !== "todas" && a.status !== filtroStatus) return false;
    if (busca) {
      const q = busca.toLowerCase();
      if (
        !a.nome.toLowerCase().includes(q) &&
        !a.codigo.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <PageContent>
      <div className="bg-white rounded-[14px] border border-slate-200 shadow-soft p-3 flex items-center gap-2 flex-wrap mb-5">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-[10px] px-3 h-9 min-w-[240px]">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou código"
            className="bg-transparent outline-none text-[13px] text-slate-900 placeholder:text-slate-500 flex-1"
          />
        </div>
        <FiltroSelect
          label="Categoria"
          value={filtroCategoria}
          onChange={setFiltroCategoria}
          options={[
            { value: "todas", label: "Todas categorias" },
            { value: "toboagua", label: "Toboáguas" },
            { value: "piscina", label: "Piscinas" },
            { value: "kids", label: "Kids" },
            { value: "bar", label: "Bares" },
            { value: "catraca", label: "Catracas" },
            { value: "estrutura", label: "Estrutura" },
            { value: "equipamento", label: "Equipamento" },
          ]}
        />
        <FiltroSelect
          label="Status"
          value={filtroStatus}
          onChange={setFiltroStatus}
          options={[
            { value: "todas", label: "Todos status" },
            { value: "operacional", label: "Operacional" },
            { value: "manutencao", label: "Em manutenção" },
            { value: "fora_ar", label: "Fora do ar" },
            { value: "inativa", label: "Inativa" },
          ]}
        />
        <div className="ml-auto text-[11.5px] text-slate-500 font-medium">
          {atracoesFiltradas.length} atrações
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {atracoesFiltradas.map((a) => (
          <AtracaoCard key={a.id} atracao={a} onOpen={() => setAtrAberta(a)} />
        ))}
      </div>

      <AtracaoDetailDialog
        atracao={atrAberta}
        onClose={() => setAtrAberta(null)}
      />
    </PageContent>
  );
}

function AtracaoCard({
  atracao,
  onOpen,
}: {
  atracao: Atracao;
  onOpen: () => void;
}) {
  const osList = useOSStore((s) => s.items);
  const Icon = CATEGORIA_ICON[atracao.categoria];
  const osAbertas = osList.filter(
    (o) => o.atracao_id === atracao.id && o.status !== "concluido"
  ).length;
  const resp = usuarioInternoById(atracao.responsavel_id);
  const inspecaoAtrasada =
    atracao.proxima_inspecao &&
    isOverdue(atracao.proxima_inspecao);

  return (
    <button
      onClick={onOpen}
      className="group text-left bg-white rounded-[14px] border border-slate-200 shadow-soft hover:shadow-pop hover:border-brand-300 transition ring-focus p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-12 w-12 rounded-[12px] inline-flex items-center justify-center ring-1 ring-inset shrink-0",
            atracao.status === "operacional"
              ? "bg-aqua-50 ring-aqua-100 text-aqua-600"
              : atracao.status === "manutencao"
                ? "bg-amber-50 ring-amber-200 text-amber-600"
                : atracao.status === "fora_ar"
                  ? "bg-rose-50 ring-rose-200 text-rose-600"
                  : "bg-slate-50 ring-slate-200 text-slate-500"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] font-mono font-bold text-slate-500 tabular">
            {atracao.codigo}
          </div>
          <div className="text-[14px] font-semibold text-slate-900 leading-snug truncate">
            {atracao.nome}
          </div>
          <div className="text-[11.5px] text-slate-500 mt-0.5">
            {CATEGORIA_LABEL[atracao.categoria]}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        <Badge tone={ATR_STATUS_TONE[atracao.status]} dot>
          {ATR_STATUS_LABEL[atracao.status]}
        </Badge>
        {osAbertas > 0 && (
          <Badge tone="amber">
            <Wrench className="h-2.5 w-2.5" /> {osAbertas} OS
          </Badge>
        )}
        {inspecaoAtrasada && (
          <Badge tone="rose">
            <AlertTriangle className="h-2.5 w-2.5" /> Inspeção atrasada
          </Badge>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
            Última manutenção
          </div>
          <div className="text-slate-700 font-semibold">
            {atracao.ultima_manutencao
              ? relativeTime(atracao.ultima_manutencao)
              : "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
            Próx. inspeção
          </div>
          <div
            className={cn(
              "font-semibold",
              inspecaoAtrasada ? "text-rose-600" : "text-slate-700"
            )}
          >
            {fmtDate(atracao.proxima_inspecao)}
          </div>
        </div>
      </div>

      {resp && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Avatar name={resp.nome} size="xs" />
          <span className="truncate">{resp.nome}</span>
        </div>
      )}
    </button>
  );
}

function AtracaoDetailDialog({
  atracao,
  onClose,
}: {
  atracao: Atracao | null;
  onClose: () => void;
}) {
  if (!atracao) return null;
  return <AtracaoDetailDialogInner atracao={atracao} onClose={onClose} />;
}

function AtracaoDetailDialogInner({
  atracao,
  onClose,
}: {
  atracao: Atracao;
  onClose: () => void;
}) {
  const osList = useOSStore((s) => s.items);
  const Icon = CATEGORIA_ICON[atracao.categoria];
  const resp = usuarioInternoById(atracao.responsavel_id);
  const osDaAtracao = osList.filter(
    (o) => o.atracao_id === atracao.id
  );
  const osAbertas = osDaAtracao.filter((o) => o.status !== "concluido");
  const osConcluidas = osDaAtracao.filter((o) => o.status === "concluido");
  const rotinasDaAtracao = rotinas.filter(
    (r) => r.atracao_id === atracao.id
  );

  return (
    <Dialog
      open={!!atracao}
      onClose={onClose}
      title={atracao.nome}
      subtitle={`${atracao.codigo} · ${CATEGORIA_LABEL[atracao.categoria]}`}
      size="lg"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "h-16 w-16 rounded-[14px] inline-flex items-center justify-center ring-1 ring-inset shrink-0",
              atracao.status === "operacional"
                ? "bg-aqua-50 ring-aqua-100 text-aqua-600"
                : atracao.status === "manutencao"
                  ? "bg-amber-50 ring-amber-200 text-amber-600"
                  : atracao.status === "fora_ar"
                    ? "bg-rose-50 ring-rose-200 text-rose-600"
                    : "bg-slate-50 ring-slate-200 text-slate-500"
            )}
          >
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge tone={ATR_STATUS_TONE[atracao.status]} dot>
                {ATR_STATUS_LABEL[atracao.status]}
              </Badge>
              {atracao.capacidade_hora && (
                <Badge tone="slate">
                  <Users className="h-2.5 w-2.5" />{" "}
                  {atracao.capacidade_hora}/h
                </Badge>
              )}
            </div>
          </div>
        </div>

        {atracao.observacoes && (
          <div className="bg-slate-50 rounded-[10px] p-3 text-[13px] text-slate-700">
            {atracao.observacoes}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <InfoRow
            label="Setor"
            value={atracao.setor}
            icon={Building2}
          />
          <InfoRow
            label="Responsável"
            value={resp?.nome ?? "—"}
            icon={HardHat}
          />
          <InfoRow
            label="Última manutenção"
            value={
              atracao.ultima_manutencao
                ? relativeTime(atracao.ultima_manutencao)
                : "—"
            }
            icon={CheckCircle2}
          />
          <InfoRow
            label="Próxima inspeção"
            value={fmtDate(atracao.proxima_inspecao)}
            icon={CalendarClock}
          />
        </div>

        {osAbertas.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-slate-900 mb-2">
              OS abertas ({osAbertas.length})
            </div>
            <div className="space-y-1">
              {osAbertas.map((os) => {
                const TipoIcon = TIPO_ICON[os.tipo];
                return (
                  <div
                    key={os.id}
                    className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-[10px]"
                  >
                    <TipoIcon className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="text-[11px] font-mono font-bold text-slate-500 tabular">
                      {os.codigo}
                    </span>
                    <span className="flex-1 text-[13px] text-slate-800 truncate">
                      {os.titulo}
                    </span>
                    <Badge tone={PRIORIDADE_TONE[os.prioridade]}>
                      {PRIORIDADE_LABEL[os.prioridade]}
                    </Badge>
                    <Badge tone={statusTone(os.status)} dot>
                      {OS_COLS.find((c) => c.id === os.status)?.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {rotinasDaAtracao.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-slate-900 mb-2">
              Rotinas associadas ({rotinasDaAtracao.length})
            </div>
            <div className="space-y-1">
              {rotinasDaAtracao.map((r) => {
                const meta = MOMENTO_META[r.momento];
                const MIcon = meta.icon;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-[10px]"
                  >
                    <MIcon className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="flex-1 text-[13px] text-slate-800 truncate">
                      {r.titulo}
                    </span>
                    <Badge tone="sky">{r.periodicidade}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {osConcluidas.length > 0 && (
          <div>
            <div className="text-[13px] font-semibold text-slate-900 mb-2">
              Histórico de OS ({osConcluidas.length} concluídas)
            </div>
            <div className="text-[12px] text-slate-600 space-y-1">
              {osConcluidas.slice(0, 5).map((os) => (
                <div
                  key={os.id}
                  className="flex items-center gap-2 p-2 rounded-[8px] hover:bg-slate-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="font-mono text-[11px] font-bold text-slate-500 tabular">
                    {os.codigo}
                  </span>
                  <span className="flex-1 truncate">{os.titulo}</span>
                  <span className="text-[11px] text-slate-500">
                    {os.concluido_em ? relativeTime(os.concluido_em) : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════ NOVA OS DIALOG ═══════════════════════════ */

function NovaOSDialog({
  open,
  onClose,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}) {
  const createOS = useOSStore((s) => s.createOS);
  const projetos = useProjetosStore((s) => s.items);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<OSTipo>("corretiva");
  const [prioridade, setPrioridade] = useState<OSPrioridade>("normal");
  const [setor, setSetor] = useState("Manutenção");
  const [atracaoId, setAtracaoId] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [agendadoPara, setAgendadoPara] = useState("");
  const [horasEst, setHorasEst] = useState("");
  const [custoEst, setCustoEst] = useState("");
  const [afetaSeg, setAfetaSeg] = useState(false);
  const [bloqueiaAb, setBloqueiaAb] = useState(false);
  const [novoChkItem, setNovoChkItem] = useState("");
  const [checklist, setChecklist] = useState<
    { texto: string; obrigatorio: boolean }[]
  >([]);

  const reset = () => {
    setTitulo("");
    setDescricao("");
    setTipo("corretiva");
    setPrioridade("normal");
    setSetor("Manutenção");
    setAtracaoId("");
    setProjetoId("");
    setResponsavelId("");
    setAgendadoPara("");
    setHorasEst("");
    setCustoEst("");
    setAfetaSeg(false);
    setBloqueiaAb(false);
    setNovoChkItem("");
    setChecklist([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !setor.trim()) return;
    createOS({
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      tipo,
      prioridade,
      setor: setor.trim(),
      atracao_id: atracaoId || undefined,
      projeto_id: projetoId || undefined,
      responsavel_id: responsavelId || undefined,
      solicitante_id: currentUserId,
      agendado_para: agendadoPara || undefined,
      horas_estimadas: horasEst ? Number(horasEst) : undefined,
      custo_estimado: custoEst ? Number(custoEst) : undefined,
      afeta_seguranca: afetaSeg,
      bloqueia_abertura: bloqueiaAb,
      checklist: checklist.length ? checklist : undefined,
    });
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nova Ordem de Serviço"
      subtitle="Registre uma nova demanda operacional"
      size="xl"
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!titulo.trim() || !setor.trim()}
            onClick={handleSubmit}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Criar OS
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Título *</Label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Trocar bomba do toboágua kamikaze"
            autoFocus
            className={fieldCls}
          />
        </div>

        <div>
          <Label>Descrição</Label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Detalhes, observações, contexto…"
            className={cn(fieldCls, "h-auto py-2 resize-none")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo</Label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as OSTipo)}
              className={fieldCls}
            >
              {(Object.keys(TIPO_LABEL) as OSTipo[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Prioridade</Label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as OSPrioridade)}
              className={fieldCls}
            >
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="normal">Normal</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
          <div>
            <Label>Setor *</Label>
            <input
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              list="setores-list"
              className={fieldCls}
            />
            <datalist id="setores-list">
              <option value="Manutenção" />
              <option value="Operacional" />
              <option value="Segurança" />
              <option value="Limpeza" />
              <option value="TI" />
              <option value="Estrutura" />
              <option value="Bares" />
            </datalist>
          </div>
          <div>
            <Label>Responsável</Label>
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              className={fieldCls}
            >
              <option value="">Sem responsável</option>
              {usuariosInternos.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} · {u.cargo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Atração</Label>
            <select
              value={atracaoId}
              onChange={(e) => setAtracaoId(e.target.value)}
              className={fieldCls}
            >
              <option value="">— Nenhuma —</option>
              {atracoes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Projeto</Label>
            <select
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
              className={fieldCls}
            >
              <option value="">— Nenhum —</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Agendar para</Label>
            <input
              type="datetime-local"
              value={agendadoPara}
              onChange={(e) => setAgendadoPara(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Horas est.</Label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={horasEst}
                onChange={(e) => setHorasEst(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <Label>Custo est. R$</Label>
              <input
                type="number"
                min="0"
                value={custoEst}
                onChange={(e) => setCustoEst(e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={afetaSeg}
              onChange={(e) => setAfetaSeg(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            Afeta segurança
          </label>
          <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={bloqueiaAb}
              onChange={(e) => setBloqueiaAb(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            Bloqueia abertura
          </label>
        </div>

        <div>
          <Label>Checklist inicial (opcional)</Label>
          <div className="space-y-1">
            {checklist.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded-[8px]"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="flex-1 text-[13px] text-slate-800">
                  {c.texto}
                </span>
                {c.obrigatorio && <Badge tone="slate">Obrigatório</Badge>}
                <button
                  type="button"
                  onClick={() =>
                    setChecklist(checklist.filter((_, j) => j !== i))
                  }
                  className="h-6 w-6 inline-flex items-center justify-center rounded-[6px] text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              value={novoChkItem}
              onChange={(e) => setNovoChkItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const t = novoChkItem.trim();
                  if (!t) return;
                  setChecklist([
                    ...checklist,
                    { texto: t, obrigatorio: false },
                  ]);
                  setNovoChkItem("");
                }
              }}
              placeholder="+ Adicionar item ao checklist"
              className={fieldCls}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!novoChkItem.trim()}
              onClick={() => {
                const t = novoChkItem.trim();
                if (!t) return;
                setChecklist([
                  ...checklist,
                  { texto: t, obrigatorio: false },
                ]);
                setNovoChkItem("");
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

/* ═══════════════════════════ NOVO PROJETO DIALOG ═══════════════════════════ */

function NovoProjetoDialog({
  open,
  onClose,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}) {
  const createProjeto = useProjetosStore((s) => s.createProjeto);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [setor, setSetor] = useState("Operacional");
  const [responsavelId, setResponsavelId] = useState(currentUserId);
  const [membros, setMembros] = useState<string[]>([]);
  const [prioridade, setPrioridade] = useState<OSPrioridade>("normal");
  const [dataInicio, setDataInicio] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dataFim, setDataFim] = useState("");
  const [orcamento, setOrcamento] = useState("");
  const [privado, setPrivado] = useState(false);
  const [cor, setCor] = useState<ProjetoOp["cor"]>("brand");
  const [novoMarco, setNovoMarco] = useState("");
  const [novoMarcoData, setNovoMarcoData] = useState("");
  const [marcos, setMarcos] = useState<{ titulo: string; data: string }[]>([]);

  const cores: ProjetoOp["cor"][] = [
    "brand",
    "aqua",
    "emerald",
    "amber",
    "rose",
    "violet",
    "sky",
    "fuchsia",
  ];
  const corHex: Record<ProjetoOp["cor"], string> = {
    brand: "bg-brand-500",
    aqua: "bg-aqua-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
    sky: "bg-sky-500",
    fuchsia: "bg-fuchsia-500",
  };

  const reset = () => {
    setTitulo("");
    setDescricao("");
    setSetor("Operacional");
    setResponsavelId(currentUserId);
    setMembros([]);
    setPrioridade("normal");
    setDataInicio(new Date().toISOString().slice(0, 10));
    setDataFim("");
    setOrcamento("");
    setPrivado(false);
    setCor("brand");
    setMarcos([]);
    setNovoMarco("");
    setNovoMarcoData("");
  };

  const toggleMembro = (id: string) => {
    setMembros((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !dataFim) return;
    createProjeto({
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      setor: setor.trim(),
      responsavel_id: responsavelId,
      membros: membros.includes(responsavelId)
        ? membros
        : [responsavelId, ...membros],
      prioridade,
      data_inicio: new Date(dataInicio).toISOString(),
      data_fim_prevista: new Date(dataFim).toISOString(),
      orcamento_estimado: orcamento ? Number(orcamento) : undefined,
      privado,
      cor,
      marcos: marcos.length
        ? marcos.map((m) => ({
            titulo: m.titulo,
            data: new Date(m.data).toISOString(),
          }))
        : undefined,
    });
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Novo projeto"
      subtitle="Organize marcos, equipe e OS vinculadas"
      size="xl"
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!titulo.trim() || !dataFim}
            onClick={handleSubmit}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Criar projeto
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Título *</Label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Reforma da área kids"
            autoFocus
            className={fieldCls}
          />
        </div>

        <div>
          <Label>Descrição</Label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Escopo e objetivos do projeto…"
            className={cn(fieldCls, "h-auto py-2 resize-none")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Setor</Label>
            <input
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <Label>Prioridade</Label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as OSPrioridade)}
              className={fieldCls}
            >
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="normal">Normal</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
          <div>
            <Label>Responsável *</Label>
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              className={fieldCls}
            >
              {usuariosInternos.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} · {u.cargo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Orçamento R$</Label>
            <input
              type="number"
              min="0"
              value={orcamento}
              onChange={(e) => setOrcamento(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <Label>Início *</Label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <Label>Previsão de término *</Label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className={fieldCls}
            />
          </div>
        </div>

        <div>
          <Label>Cor do projeto</Label>
          <div className="flex items-center gap-2">
            {cores.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                className={cn(
                  "h-7 w-7 rounded-full transition ring-offset-2",
                  corHex[c],
                  cor === c
                    ? "ring-2 ring-slate-900 scale-110"
                    : "hover:scale-110"
                )}
                title={c}
              />
            ))}
          </div>
        </div>

        <div>
          <Label>Equipe</Label>
          <div className="flex flex-wrap gap-1.5">
            {usuariosInternos.map((u) => {
              const active =
                membros.includes(u.id) || u.id === responsavelId;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleMembro(u.id)}
                  disabled={u.id === responsavelId}
                  className={cn(
                    "inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-[11.5px] font-medium transition",
                    active
                      ? "bg-brand-50 ring-1 ring-inset ring-brand-200 text-brand-700"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
                    u.id === responsavelId && "opacity-80 cursor-not-allowed"
                  )}
                >
                  <Avatar name={u.nome} size="xs" />
                  {u.nome.split(" ")[0]}
                  {u.id === responsavelId && (
                    <span className="text-[9px] uppercase font-bold">
                      resp.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={privado}
            onChange={(e) => setPrivado(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Projeto privado (só membros visualizam)
        </label>

        <div>
          <Label>Marcos iniciais (opcional)</Label>
          <div className="space-y-1">
            {marcos.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded-[8px]"
              >
                <Target className="h-3.5 w-3.5 text-slate-400" />
                <span className="flex-1 text-[13px] text-slate-800">
                  {m.titulo}
                </span>
                <span className="text-[11px] text-slate-500">
                  {fmtDate(m.data)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setMarcos(marcos.filter((_, j) => j !== i))
                  }
                  className="h-6 w-6 inline-flex items-center justify-center rounded-[6px] text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              value={novoMarco}
              onChange={(e) => setNovoMarco(e.target.value)}
              placeholder="Título do marco"
              className={fieldCls}
            />
            <input
              type="date"
              value={novoMarcoData}
              onChange={(e) => setNovoMarcoData(e.target.value)}
              className={cn(fieldCls, "!w-[150px]")}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!novoMarco.trim() || !novoMarcoData}
              onClick={() => {
                setMarcos([
                  ...marcos,
                  { titulo: novoMarco.trim(), data: novoMarcoData },
                ]);
                setNovoMarco("");
                setNovoMarcoData("");
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

/* ═══════════════════════════ NOVA REUNIÃO DIALOG ═══════════════════════════ */

function NovaReuniaoDialog({
  open,
  onClose,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
}) {
  const createReuniao = useReunioesStore((s) => s.createReuniao);
  const projetos = useProjetosStore((s) => s.items);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<ReuniaoOp["tipo"]>("planejamento");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [local, setLocal] = useState("Sala de reuniões");
  const [linkOnline, setLinkOnline] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [frequencia, setFrequencia] =
    useState<NonNullable<ReuniaoOp["frequencia"]>>("semanal");
  const [participantes, setParticipantes] = useState<string[]>([currentUserId]);
  const [novoPautaItem, setNovoPautaItem] = useState("");
  const [novoPautaDur, setNovoPautaDur] = useState("15");
  const [pauta, setPauta] = useState<
    { titulo: string; duracao_min: number }[]
  >([]);

  const reset = () => {
    setTitulo("");
    setTipo("planejamento");
    setDataInicio("");
    setDataFim("");
    setLocal("Sala de reuniões");
    setLinkOnline("");
    setProjetoId("");
    setRecorrente(false);
    setFrequencia("semanal");
    setParticipantes([currentUserId]);
    setPauta([]);
    setNovoPautaItem("");
    setNovoPautaDur("15");
  };

  const toggleParticipante = (id: string) => {
    if (id === currentUserId) return;
    setParticipantes((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !dataInicio || !dataFim) return;
    createReuniao({
      titulo: titulo.trim(),
      tipo,
      data_hora_inicio: new Date(dataInicio).toISOString(),
      data_hora_fim: new Date(dataFim).toISOString(),
      local: local.trim(),
      link_online: linkOnline.trim() || undefined,
      organizador_id: currentUserId,
      projeto_id: projetoId || undefined,
      recorrente,
      frequencia: recorrente ? frequencia : undefined,
      participantes,
      pauta: pauta.length ? pauta : undefined,
    });
    reset();
    onClose();
  };

  const tipoLabel: Record<ReuniaoOp["tipo"], string> = {
    briefing_matinal: "Briefing matinal",
    semanal_manut: "Semanal manutenção",
    semanal_seg: "Semanal segurança",
    post_mortem: "Post-mortem",
    planejamento: "Planejamento",
    emergencial: "Emergencial",
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Agendar reunião"
      subtitle="Organize pauta, participantes e recorrência"
      size="xl"
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!titulo.trim() || !dataInicio || !dataFim}
            onClick={handleSubmit}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Agendar
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Título *</Label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Alinhamento semanal de manutenção"
            autoFocus
            className={fieldCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Tipo</Label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ReuniaoOp["tipo"])}
              className={fieldCls}
            >
              {(Object.keys(tipoLabel) as ReuniaoOp["tipo"][]).map((t) => (
                <option key={t} value={t}>
                  {tipoLabel[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Projeto (opcional)</Label>
            <select
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
              className={fieldCls}
            >
              <option value="">— Nenhum —</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Início *</Label>
            <input
              type="datetime-local"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <Label>Término *</Label>
            <input
              type="datetime-local"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <Label>Local</Label>
            <input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <Label>Link online</Label>
            <input
              value={linkOnline}
              onChange={(e) => setLinkOnline(e.target.value)}
              placeholder="https://meet..."
              className={fieldCls}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={recorrente}
              onChange={(e) => setRecorrente(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Recorrente
          </label>
          {recorrente && (
            <select
              value={frequencia}
              onChange={(e) =>
                setFrequencia(
                  e.target.value as NonNullable<ReuniaoOp["frequencia"]>
                )
              }
              className={cn(fieldCls, "!h-8 !w-auto")}
            >
              <option value="diaria">Diária</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
            </select>
          )}
        </div>

        <div>
          <Label>Participantes</Label>
          <div className="flex flex-wrap gap-1.5">
            {usuariosInternos.map((u) => {
              const active = participantes.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleParticipante(u.id)}
                  disabled={u.id === currentUserId}
                  className={cn(
                    "inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-[11.5px] font-medium transition",
                    active
                      ? "bg-brand-50 ring-1 ring-inset ring-brand-200 text-brand-700"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50",
                    u.id === currentUserId && "opacity-80 cursor-not-allowed"
                  )}
                >
                  <Avatar name={u.nome} size="xs" />
                  {u.nome.split(" ")[0]}
                  {u.id === currentUserId && (
                    <span className="text-[9px] uppercase font-bold">
                      org.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Pauta (opcional)</Label>
          <div className="space-y-1">
            {pauta.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded-[8px]"
              >
                <div className="h-6 w-6 rounded-[6px] bg-white ring-1 ring-inset ring-slate-200 inline-flex items-center justify-center text-[10.5px] font-bold text-slate-600 tabular">
                  {i + 1}
                </div>
                <span className="flex-1 text-[13px] text-slate-800">
                  {p.titulo}
                </span>
                <span className="text-[11px] text-slate-500 tabular">
                  {p.duracao_min}min
                </span>
                <button
                  type="button"
                  onClick={() => setPauta(pauta.filter((_, j) => j !== i))}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-[6px] text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              value={novoPautaItem}
              onChange={(e) => setNovoPautaItem(e.target.value)}
              placeholder="Item da pauta"
              className={fieldCls}
            />
            <input
              type="number"
              min="1"
              value={novoPautaDur}
              onChange={(e) => setNovoPautaDur(e.target.value)}
              className={cn(fieldCls, "!w-[90px]")}
              placeholder="min"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!novoPautaItem.trim() || !novoPautaDur}
              onClick={() => {
                setPauta([
                  ...pauta,
                  {
                    titulo: novoPautaItem.trim(),
                    duracao_min: Number(novoPautaDur),
                  },
                ]);
                setNovoPautaItem("");
                setNovoPautaDur("15");
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

/* ─────────────────────────── FORM PRIMITIVES ─────────────────────────── */

const fieldCls =
  "w-full h-9 px-3 rounded-[10px] border border-slate-200 bg-white text-[13px] text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
      {children}
    </div>
  );
}
