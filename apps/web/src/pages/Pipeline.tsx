import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  Flame,
  Instagram,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Dialog } from "@/components/ui/Dialog";
import { corretorById, corretores, leads } from "@/lib/mock";
import { money, relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Canal, LeadStatus } from "@/lib/types";

const stages: {
  id: LeadStatus;
  label: string;
  tone:
    | "slate"
    | "sky"
    | "brand"
    | "violet"
    | "amber"
    | "emerald"
    | "rose";
}[] = [
  { id: "novo", label: "Novo", tone: "slate" },
  { id: "qualificado", label: "Qualificado", tone: "sky" },
  { id: "em_atendimento", label: "Em atendimento", tone: "brand" },
  { id: "proposta", label: "Proposta", tone: "violet" },
  { id: "fechado", label: "Fechado", tone: "emerald" },
  { id: "perdido", label: "Perdido", tone: "rose" },
];

const canalIcon: Record<Canal, React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  email: Mail,
  rdstation: Sparkles,
  site: UserIcon,
  walkin: UserIcon,
  indicacao: UserIcon,
  google: Search,
};

function LeadCard({
  lead,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  lead: (typeof leads)[number];
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
}) {
  const Ico = canalIcon[lead.canal];
  const corretor = corretores.find((c) => c.id === lead.corretor_id);
  const scoreTone =
    lead.score >= 75 ? "emerald" : lead.score >= 50 ? "amber" : "rose";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-[12px] border border-slate-200 bg-white hover:border-brand-300 hover:shadow-soft transition-all p-3 cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-40 ring-2 ring-brand-400"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 inline-flex items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <Ico className="h-3 w-3" />
            </div>
            <span className="text-[13px] font-semibold text-slate-900 truncate">
              {lead.nome}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 tabular">
            {lead.telefone}
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 h-6 w-6 inline-flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="text-[12px] text-slate-600 mt-2 line-clamp-2 leading-snug">
        {lead.perfil_resumido}
      </p>

      <div className="mt-2.5 flex items-center gap-1 flex-wrap">
        <Badge
          tone={lead.interesse === "anual" ? "brand" : "aqua"}
          className="text-[10px]"
        >
          {lead.interesse === "anual"
            ? "Anual"
            : lead.interesse === "diario"
            ? "Diário"
            : "?"}
        </Badge>
        {lead.urgencia === "alta" && (
          <Badge tone="rose" className="text-[10px]" dot>
            Urgente
          </Badge>
        )}
        {lead.tags.slice(0, 1).map((t) => (
          <Badge key={t} tone="slate" className="text-[10px]">
            {t}
          </Badge>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-slate-400 font-medium">Score</span>
            <span className="tabular font-semibold text-slate-700">
              {lead.score}
            </span>
          </div>
          <Progress value={lead.score} tone={scoreTone} size="xs" />
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {corretor ? (
            <>
              <Avatar name={corretor.nome} size="xs" />
              <span className="text-[11px] text-slate-600 truncate max-w-[80px]">
                {corretor.nome.split(" ")[0]}
              </span>
            </>
          ) : (
            <span className="text-[11px] text-slate-400">Não alocado</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 tabular">
          <span className="font-semibold text-slate-800">
            {money(lead.valor_estimado)}
          </span>
          <span>•</span>
          <span>{relativeTime(lead.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}

export function Pipeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const corretorFiltro = searchParams.get("corretor") ?? "";
  const [busca, setBusca] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [novoLeadAberto, setNovoLeadAberto] = useState(false);
  const [interesseFiltro, setInteresseFiltro] = useState<"" | "anual" | "diario">("");
  const [urgenciaFiltro, setUrgenciaFiltro] = useState<"" | "alta" | "media" | "baixa">("");
  const [overrideStatus, setOverrideStatus] = useState<Record<string, LeadStatus>>({});
  const [recentMoves, setRecentMoves] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<LeadStatus | null>(null);
  const corretorObj = corretorFiltro ? corretorById(corretorFiltro) : null;

  const effectiveStatus = (l: (typeof leads)[number]): LeadStatus =>
    overrideStatus[l.id] ?? l.status;

  const handleDrop = (stageId: LeadStatus) => {
    setOverStage(null);
    if (!draggingId) return;
    const lead = leads.find((l) => l.id === draggingId);
    if (!lead) return;
    setDraggingId(null);
    if (effectiveStatus(lead) === stageId) return;
    setOverrideStatus((prev) => ({ ...prev, [draggingId]: stageId }));
    setRecentMoves((prev) => [draggingId, ...prev.filter((id) => id !== draggingId)]);
  };

  const leadsBase = useMemo(() => {
    let r = leads;
    if (corretorFiltro) r = r.filter((l) => l.corretor_id === corretorFiltro);
    if (interesseFiltro) r = r.filter((l) => l.interesse === interesseFiltro);
    if (urgenciaFiltro) r = r.filter((l) => l.urgencia === urgenciaFiltro);
    if (busca) {
      const q = busca.toLowerCase();
      r = r.filter(
        (l) =>
          l.nome.toLowerCase().includes(q) ||
          l.telefone.includes(q) ||
          l.perfil_resumido.toLowerCase().includes(q)
      );
    }
    return r;
  }, [corretorFiltro, busca, interesseFiltro, urgenciaFiltro]);

  const filtrosAtivos =
    (corretorFiltro ? 1 : 0) + (interesseFiltro ? 1 : 0) + (urgenciaFiltro ? 1 : 0);

  const totalValue = leadsBase
    .filter((l) => !["fechado", "perdido"].includes(effectiveStatus(l)))
    .reduce((s, l) => s + l.valor_estimado, 0);

  const clearCorretor = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("corretor");
    setSearchParams(next);
  };

  return (
    <>
      <PageHeader
        title="Pipeline de vendas"
        subtitle={`${leadsBase.length} leads${corretorObj ? ` de ${corretorObj.nome}` : ""} • ${money(totalValue)} em pipeline`}
        actions={
          <>
            <Input
              leftIcon={<Search className="h-4 w-4" />}
              placeholder="Buscar lead…"
              className="w-64"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <Button
              variant="outline"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setFiltrosAbertos(true)}
            >
              Filtros{filtrosAtivos > 0 ? ` (${filtrosAtivos})` : ""}
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setNovoLeadAberto(true)}
            >
              Novo lead
            </Button>
          </>
        }
      />

      {corretorObj && (
        <div className="px-7 pt-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200">
            <Avatar name={corretorObj.nome} size="xs" />
            <span className="text-[12px] text-brand-800">
              Filtro: <strong>{corretorObj.nome}</strong>
            </span>
            <button
              onClick={clearCorretor}
              className="h-5 w-5 inline-flex items-center justify-center rounded-full hover:bg-brand-100"
              aria-label="Remover filtro"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <Dialog
        open={filtrosAbertos}
        onClose={() => setFiltrosAbertos(false)}
        title="Filtros do pipeline"
        subtitle="Refine o quadro por corretor, interesse e urgência"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setInteresseFiltro("");
                setUrgenciaFiltro("");
                const next = new URLSearchParams(searchParams);
                next.delete("corretor");
                setSearchParams(next);
              }}
            >
              Limpar tudo
            </Button>
            <Button onClick={() => setFiltrosAbertos(false)}>Aplicar</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider">
              Corretor
            </label>
            <select
              className="mt-2 w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-white text-sm ring-focus"
              value={corretorFiltro}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set("corretor", e.target.value);
                else next.delete("corretor");
                setSearchParams(next);
              }}
            >
              <option value="">Todos os corretores</option>
              {corretores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider">
              Interesse
            </label>
            <div className="mt-2 flex gap-2">
              {(["", "anual", "diario"] as const).map((i) => (
                <button
                  key={i || "all"}
                  onClick={() => setInteresseFiltro(i)}
                  className={cn(
                    "px-3 h-9 rounded-[10px] text-[13px] font-medium border transition",
                    interesseFiltro === i
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {i === "" ? "Todos" : i === "anual" ? "Anual" : "Diário"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider">
              Urgência
            </label>
            <div className="mt-2 flex gap-2">
              {(["", "alta", "media", "baixa"] as const).map((u) => (
                <button
                  key={u || "all"}
                  onClick={() => setUrgenciaFiltro(u)}
                  className={cn(
                    "px-3 h-9 rounded-[10px] text-[13px] font-medium border transition capitalize",
                    urgenciaFiltro === u
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {u === "" ? "Todas" : u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={novoLeadAberto}
        onClose={() => setNovoLeadAberto(false)}
        title="Novo lead"
        subtitle="Cadastro rápido — a IA enriquece o perfil depois"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNovoLeadAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setNovoLeadAberto(false)}>Criar lead</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[12px] font-semibold text-slate-700">Nome</label>
            <Input className="mt-1" placeholder="Nome completo" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700">Telefone</label>
            <Input className="mt-1" placeholder="(98) 9 8888-0000" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700">E-mail</label>
            <Input className="mt-1" placeholder="opcional" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700">Interesse</label>
            <select className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-white text-sm">
              <option>Anual</option>
              <option>Diário</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700">Canal</label>
            <select className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-white text-sm">
              <option>WhatsApp</option>
              <option>Instagram</option>
              <option>Site</option>
              <option>Indicação</option>
              <option>Walk-in</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[12px] font-semibold text-slate-700">Observação</label>
            <textarea
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-[10px] border border-slate-200 bg-white text-sm resize-none"
              placeholder="Perfil do lead, família, preferências…"
            />
          </div>
        </div>
      </Dialog>

      <div className="flex-1 overflow-x-auto">
        <div className="px-7 py-5 flex gap-4 min-w-max">
          {stages.map((stage) => {
            const items = leadsBase
              .filter((l) => effectiveStatus(l) === stage.id)
              .slice()
              .sort((a, b) => {
                const ai = recentMoves.indexOf(a.id);
                const bi = recentMoves.indexOf(b.id);
                if (ai === -1 && bi === -1) return 0;
                if (ai === -1) return 1;
                if (bi === -1) return -1;
                return ai - bi;
              });
            const sum = items.reduce((s, l) => s + l.valor_estimado, 0);
            const isOver = overStage === stage.id;
            return (
              <div
                key={stage.id}
                className="w-[300px] shrink-0"
                onDragOver={(e) => {
                  if (!draggingId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overStage !== stage.id) setOverStage(stage.id);
                }}
                onDragLeave={(e) => {
                  if (
                    e.currentTarget.contains(e.relatedTarget as Node | null)
                  )
                    return;
                  if (overStage === stage.id) setOverStage(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(stage.id);
                }}
              >
                <div className="flex items-center justify-between px-1 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Badge tone={stage.tone} dot>
                      {stage.label}
                    </Badge>
                    <span className="text-[11px] text-slate-400 tabular">
                      {items.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 tabular font-semibold">
                    {money(sum)}
                  </span>
                </div>
                <Card
                  className={cn(
                    "bg-slate-50/60 border-dashed shadow-none transition-colors",
                    isOver && "bg-brand-50/80 border-brand-400 ring-2 ring-brand-300"
                  )}
                >
                  <CardBody className="p-2.5 space-y-2 min-h-[140px] max-h-[calc(100vh-280px)] overflow-y-auto">
                    {items.map((l) => (
                      <LeadCard
                        key={l.id}
                        lead={l}
                        isDragging={draggingId === l.id}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", l.id);
                          setDraggingId(l.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverStage(null);
                        }}
                      />
                    ))}
                    {items.length === 0 && (
                      <div
                        className={cn(
                          "py-6 text-center text-[12px] rounded-[10px] border border-dashed",
                          isOver
                            ? "border-brand-400 text-brand-700 bg-brand-50"
                            : "border-slate-200 text-slate-400"
                        )}
                      >
                        {isOver ? "Solte aqui" : "Nenhum lead nesta etapa"}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
