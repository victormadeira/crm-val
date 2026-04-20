import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  MessageCircle,
  Pause,
  Phone,
  Play,
  Plus,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { pct, relativeTime } from "@/lib/format";
import { cadencias, cadenciasExecucoes } from "@/lib/mock";
import type { Cadencia, CadenciaPasso } from "@/lib/types";

const gatilhoLabel: Record<string, { label: string; tone: string }> = {
  lead_novo: { label: "Novo lead", tone: "brand" },
  lead_sem_resposta: { label: "Sem resposta", tone: "amber" },
  lead_parado_48h: { label: "Parado 48h", tone: "rose" },
  pos_proposta: { label: "Pós-proposta", tone: "violet" },
  pre_vencimento_30d: { label: "Renovação 30d", tone: "emerald" },
  pre_vencimento_7d: { label: "Renovação 7d", tone: "rose" },
  pos_venda: { label: "Pós-venda", tone: "aqua" },
  reativacao: { label: "Reativação", tone: "slate" },
};

const canalIcon = {
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  ligacao: <Phone className="h-3.5 w-3.5" />,
  sms: <MessageCircle className="h-3.5 w-3.5" />,
} as const;

const canalColor = {
  whatsapp: "bg-emerald-50 text-emerald-700 border-emerald-200",
  email: "bg-brand-50 text-brand-700 border-brand-200",
  ligacao: "bg-violet-50 text-violet-700 border-violet-200",
  sms: "bg-amber-50 text-amber-700 border-amber-200",
} as const;

export function Cadencias() {
  const [filtro, setFiltro] = useState<"todas" | "ativas" | "pausadas">("todas");
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const [editPassosOpen, setEditPassosOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const getAtiva = (c: Cadencia) =>
    overrides[c.id] !== undefined ? overrides[c.id] : c.ativa;

  const cadenciasView = useMemo(
    () => cadencias.map((c) => ({ ...c, ativa: getAtiva(c) })),
    [overrides]
  );

  const toggleAtiva = (c: Cadencia) => {
    const nova = !getAtiva(c);
    setOverrides((prev) => ({ ...prev, [c.id]: nova }));
    showToast(`Cadência ${nova ? "ativada" : "pausada"}: ${c.nome}`);
  };

  const filtradas = useMemo(() => {
    if (filtro === "ativas") return cadenciasView.filter((c) => c.ativa);
    if (filtro === "pausadas") return cadenciasView.filter((c) => !c.ativa);
    return cadenciasView;
  }, [filtro, cadenciasView]);

  const selecionada = selecionadaId
    ? cadenciasView.find((c) => c.id === selecionadaId) ?? null
    : null;

  const totalAplicados = cadenciasView.reduce((s, c) => s + c.aplicados, 0);
  const ativasCount = cadenciasView.filter((c) => c.ativa).length;
  const execucoesAtivas = cadenciasExecucoes.filter((e) => e.status === "ativa")
    .length;
  const upliftMedio =
    cadenciasView.filter((c) => c.ativa).reduce((s, c) => s + c.uplift_pct, 0) /
    Math.max(cadenciasView.filter((c) => c.ativa).length, 1);

  return (
    <>
      <PageHeader
        title="Cadências"
        subtitle="Fluxos automatizados de follow-up • IA aprende com cada execução"
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<Settings className="h-4 w-4" />}
              onClick={() => setConfigOpen(true)}
            >
              Configurar
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setNovaOpen(true)}
            >
              Nova cadência
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICadencia
            icon={<Zap className="h-4 w-4" />}
            label="Cadências ativas"
            value={ativasCount.toString()}
            sub={`de ${cadencias.length} configuradas`}
            tone="brand"
          />
          <KPICadencia
            icon={<Activity className="h-4 w-4" />}
            label="Em execução agora"
            value={execucoesAtivas.toString()}
            sub="leads e clientes"
            tone="emerald"
          />
          <KPICadencia
            icon={<Target className="h-4 w-4" />}
            label="Total aplicado"
            value={totalAplicados.toString()}
            sub="últimos 90 dias"
            tone="violet"
          />
          <KPICadencia
            icon={<TrendingUp className="h-4 w-4" />}
            label="Uplift médio"
            value={`+${Math.round(upliftMedio)}%`}
            sub="vs. abordagem manual"
            tone="amber"
          />
        </div>

        {/* Info card */}
        <Card className="bg-gradient-to-r from-slate-900 to-brand-900 border-slate-900 text-white">
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-[10px] bg-white/10 border border-white/15 inline-flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-aqua-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold">
                  Cadências resolvem o problema de "lead parado"
                </h3>
                <p className="text-[12px] text-slate-200 mt-1 leading-relaxed max-w-3xl">
                  Quando um corretor deixa um lead sem resposta por 48h, a IA
                  inicia a cadência{" "}
                  <span className="text-aqua-300 font-semibold">
                    Reativação parado 48h
                  </span>{" "}
                  automaticamente — três toques em 5 dias. Se não converter, o
                  lead volta para a fila de realocação.
                </p>
              </div>
              <Badge
                tone="emerald"
                dot
                className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0"
              >
                {execucoesAtivas} leads sendo resgatados
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* Lista */}
        <Card>
          <CardHeader
            title="Biblioteca de cadências"
            subtitle={`${filtradas.length} ${filtradas.length === 1 ? "cadência" : "cadências"}`}
            action={
              <Tabs
                tabs={[
                  { id: "todas", label: "Todas", count: cadencias.length },
                  { id: "ativas", label: "Ativas", count: ativasCount },
                  {
                    id: "pausadas",
                    label: "Pausadas",
                    count: cadencias.length - ativasCount,
                  },
                ]}
                value={filtro}
                onChange={(v) => setFiltro(v as typeof filtro)}
              />
            }
          />
          <CardBody className="pt-0 space-y-3">
            {filtradas.map((c) => (
              <CadenciaCard
                key={c.id}
                c={c}
                onClick={() => setSelecionadaId(c.id)}
              />
            ))}
          </CardBody>
        </Card>
      </PageContent>

      <CadenciaDialog
        cadencia={selecionada}
        onClose={() => setSelecionadaId(null)}
        onToggle={() => selecionada && toggleAtiva(selecionada)}
        onEditPassos={() => setEditPassosOpen(true)}
      />

      <Dialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        size="md"
        title="Configurações globais"
        subtitle="Aplicadas a todas as cadências"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setConfigOpen(false);
                showToast("Configurações salvas");
              }}
            >
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-700">Pausar em feriados nacionais</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-600" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-700">Janela operacional 08:00–20:00</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-600" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-700">Desativar ao detectar churn</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-600" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-slate-700">Aprender com conversão (auto-tuning IA)</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-brand-600" />
          </label>
        </div>
      </Dialog>

      <Dialog
        open={novaOpen}
        onClose={() => setNovaOpen(false)}
        size="md"
        title="Nova cadência"
        subtitle="Crie um fluxo de follow-up automatizado"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovaOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setNovaOpen(false);
                showToast("Cadência criada como rascunho");
              }}
            >
              Criar rascunho
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Nome
            </label>
            <input
              placeholder="Ex: Pós-proposta — 5 dias"
              className="w-full h-9 px-3 rounded-[10px] border border-slate-200 text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Gatilho
            </label>
            <select className="w-full h-9 px-3 rounded-[10px] border border-slate-200 text-[13px] bg-white">
              {Object.entries(gatilhoLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">
              Descrição
            </label>
            <textarea
              rows={3}
              placeholder="Objetivo da cadência..."
              className="w-full px-3 py-2 rounded-[10px] border border-slate-200 text-[13px]"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={editPassosOpen && !!selecionada}
        onClose={() => setEditPassosOpen(false)}
        size="lg"
        title={`Editar passos — ${selecionada?.nome ?? ""}`}
        subtitle="Ajuste canal, delay e copy de cada toque"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditPassosOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setEditPassosOpen(false);
                showToast("Passos atualizados");
              }}
            >
              Salvar passos
            </Button>
          </>
        }
      >
        {selecionada && (
          <div className="space-y-2">
            {selecionada.passos.map((p) => (
              <div
                key={p.ordem}
                className="rounded-[10px] border border-slate-200 p-3 flex items-start gap-3"
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-[9px] border inline-flex items-center justify-center shrink-0",
                    canalColor[p.canal]
                  )}
                >
                  {canalIcon[p.canal]}
                </div>
                <div className="flex-1">
                  <input
                    defaultValue={p.titulo}
                    className="w-full h-8 px-2 rounded-[8px] border border-slate-200 text-[13px] font-semibold"
                  />
                  <textarea
                    defaultValue={p.preview}
                    rows={2}
                    className="mt-1 w-full px-2 py-1 rounded-[8px] border border-slate-200 text-[12px]"
                  />
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    Delay: {p.delay_horas}h
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Dialog>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white text-[13px] font-medium px-4 py-2 rounded-[10px] shadow-pop animate-slide-up"
        >
          {toast}
        </div>
      )}
    </>
  );
}

function KPICadencia({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "brand" | "emerald" | "violet" | "amber";
}) {
  const toneMap = {
    brand: "from-brand-500 to-brand-600",
    emerald: "from-emerald-500 to-teal-500",
    violet: "from-violet-500 to-fuchsia-500",
    amber: "from-amber-500 to-orange-500",
  };
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-[10px] bg-gradient-to-br text-white inline-flex items-center justify-center shadow-soft",
              toneMap[tone]
            )}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              {label}
            </div>
            <div className="text-[22px] font-bold text-slate-900 tabular leading-tight mt-0.5">
              {value}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">{sub}</div>
      </CardBody>
    </Card>
  );
}

function CadenciaCard({
  c,
  onClick,
}: {
  c: Cadencia;
  onClick: () => void;
}) {
  const gat = gatilhoLabel[c.gatilho];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-[12px] border p-4 transition-all",
        c.ativa
          ? "border-slate-200 bg-white hover:border-brand-300 hover:shadow-soft"
          : "border-slate-200 bg-slate-50/60 opacity-75 hover:opacity-100"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "h-10 w-10 rounded-[10px] inline-flex items-center justify-center shrink-0",
            c.ativa
              ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white"
              : "bg-slate-200 text-slate-500"
          )}
        >
          {c.ativa ? <Zap className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[14px] font-bold text-slate-900">{c.nome}</h4>
            <Badge tone={gat.tone as any} className="text-[10px]">
              {gat.label}
            </Badge>
            {c.ativa ? (
              <Badge tone="emerald" dot>
                Ativa
              </Badge>
            ) : (
              <Badge tone="slate">Pausada</Badge>
            )}
          </div>
          <p className="text-[12px] text-slate-600 mt-1 leading-relaxed line-clamp-2">
            {c.descricao}
          </p>

          {/* Passos visualizados */}
          <div className="flex items-center gap-1 mt-3">
            {c.passos.map((p, i) => (
              <div key={p.ordem} className="flex items-center gap-1">
                <div
                  className={cn(
                    "h-6 w-6 rounded-[7px] border inline-flex items-center justify-center",
                    canalColor[p.canal]
                  )}
                >
                  {canalIcon[p.canal]}
                </div>
                {i < c.passos.length - 1 && (
                  <ArrowRight className="h-2.5 w-2.5 text-slate-300" />
                )}
              </div>
            ))}
            <span className="text-[10px] text-slate-400 ml-2">
              {c.passos.length} passos
            </span>
          </div>
        </div>

        <div className="hidden md:block text-right shrink-0 min-w-[140px]">
          <div className="flex items-center gap-4 justify-end">
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-semibold">
                Aplicados
              </div>
              <div className="text-[15px] font-bold text-slate-900 tabular">
                {c.aplicados}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-semibold">
                Conv
              </div>
              <div className="text-[15px] font-bold text-emerald-700 tabular">
                {c.aplicados > 0 ? pct(c.conversao) : "—"}
              </div>
            </div>
            {c.uplift_pct > 0 && (
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-semibold">
                  Uplift
                </div>
                <div className="text-[15px] font-bold text-brand-700 tabular">
                  +{c.uplift_pct}%
                </div>
              </div>
            )}
          </div>
          {c.ultima_execucao && (
            <div className="text-[10px] text-slate-400 mt-1 tabular">
              Última há {relativeTime(c.ultima_execucao)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function CadenciaDialog({
  cadencia,
  onClose,
  onToggle,
  onEditPassos,
}: {
  cadencia: Cadencia | null;
  onClose: () => void;
  onToggle: () => void;
  onEditPassos: () => void;
}) {
  if (!cadencia) return null;
  const gat = gatilhoLabel[cadencia.gatilho];

  return (
    <Dialog
      open={!!cadencia}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-brand-600" />
          {cadencia.nome}
        </div>
      }
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-[13px] text-slate-600 leading-relaxed">
          {cadencia.descricao}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone={gat.tone as any}>{gat.label}</Badge>
          {cadencia.ativa ? (
            <Badge tone="emerald" dot>
              Em execução
            </Badge>
          ) : (
            <Badge tone="slate">Pausada</Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[10px] bg-slate-50 border border-slate-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Aplicados
            </div>
            <div className="text-xl font-bold tabular text-slate-900 mt-0.5">
              {cadencia.aplicados}
            </div>
          </div>
          <div className="rounded-[10px] bg-emerald-50 border border-emerald-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">
              Conversão
            </div>
            <div className="text-xl font-bold tabular text-emerald-900 mt-0.5">
              {cadencia.aplicados > 0 ? pct(cadencia.conversao) : "—"}
            </div>
          </div>
          <div className="rounded-[10px] bg-brand-50 border border-brand-200 p-3">
            <div className="text-[10px] uppercase tracking-wider text-brand-700 font-semibold">
              Uplift
            </div>
            <div className="text-xl font-bold tabular text-brand-900 mt-0.5">
              {cadencia.uplift_pct > 0 ? `+${cadencia.uplift_pct}%` : "—"}
            </div>
          </div>
        </div>

        {/* Passos detalhados */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Fluxo de {cadencia.passos.length} passos
          </div>
          <div className="space-y-2">
            {cadencia.passos.map((p, i) => (
              <PassoItem
                key={p.ordem}
                passo={p}
                ultimo={i === cadencia.passos.length - 1}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <Button
            variant={cadencia.ativa ? "outline" : "primary"}
            leftIcon={
              cadencia.ativa ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )
            }
            onClick={onToggle}
          >
            {cadencia.ativa ? "Pausar cadência" : "Ativar cadência"}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="outline"
              leftIcon={<Settings className="h-4 w-4" />}
              onClick={onEditPassos}
            >
              Editar passos
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function PassoItem({
  passo,
  ultimo,
}: {
  passo: CadenciaPasso;
  ultimo: boolean;
}) {
  const delay =
    passo.delay_horas === 0
      ? "Imediato"
      : passo.delay_horas < 24
      ? `+${passo.delay_horas}h`
      : `+${Math.round(passo.delay_horas / 24)}d`;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "h-8 w-8 rounded-[9px] border inline-flex items-center justify-center shrink-0",
            canalColor[passo.canal]
          )}
        >
          {canalIcon[passo.canal]}
        </div>
        {!ultimo && <div className="w-px flex-1 bg-slate-200 mt-1" />}
      </div>
      <div className="flex-1 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-900">
            {passo.titulo}
          </span>
          <Badge tone="slate" className="text-[10px]">
            <Clock className="h-2.5 w-2.5 mr-1" />
            {delay}
          </Badge>
          <Badge tone="slate" className="text-[10px] capitalize">
            {passo.canal}
          </Badge>
        </div>
        <div className="mt-1 rounded-[8px] bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-700 italic leading-relaxed">
          "{passo.preview}"
        </div>
      </div>
    </div>
  );
}
