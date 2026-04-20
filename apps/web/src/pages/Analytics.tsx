import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle2,
  Download,
  LineChart as LineChartIcon,
  Pause,
  Play,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { money, pct } from "@/lib/format";
import {
  forecastSerie,
  insightsReceita,
  projecaoMes,
  tracaoCampanhas,
} from "@/lib/mock";

type Insight = (typeof insightsReceita)[number];
type Campanha = (typeof tracaoCampanhas)[number];

type CampanhaStatus = "ativa" | "pausada" | "encerrada";

export function Analytics() {
  const [horizonte, setHorizonte] = useState<"30d" | "60d" | "90d">("60d");
  const [cenario, setCenario] = useState<"base" | "otim" | "pess">("base");
  const [planoAberto, setPlanoAberto] = useState(false);
  const [insightAberto, setInsightAberto] = useState<Insight | null>(null);
  const [insightsAplicados, setInsightsAplicados] = useState<Record<string, boolean>>({});
  const [campanhaAberta, setCampanhaAberta] = useState<Campanha | null>(null);
  const [statusCampanha, setStatusCampanha] = useState<Record<string, CampanhaStatus>>(
    () => Object.fromEntries(tracaoCampanhas.map((c) => [c.id, c.status as CampanhaStatus]))
  );
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  const h = horizonte === "30d" ? 60 : horizonte === "60d" ? 75 : 90;
  const serie = forecastSerie.slice(0, h);

  const projetado =
    cenario === "base"
      ? projecaoMes.previsto_fim_mes
      : cenario === "otim"
      ? Math.round(projecaoMes.previsto_fim_mes * 1.12)
      : Math.round(projecaoMes.previsto_fim_mes * 0.88);

  const gap = projetado - projecaoMes.meta_mes;

  const campanhasComStatus = useMemo(
    () =>
      tracaoCampanhas.map((c) => ({
        ...c,
        status: statusCampanha[c.id] ?? (c.status as CampanhaStatus),
      })),
    [statusCampanha]
  );

  const insightsNaoAplicados = insightsReceita.filter((i) => !insightsAplicados[i.id]);
  const impactoPotencial = insightsNaoAplicados.reduce(
    (s, i) => s + (i.tipo === "risco" ? -i.impacto_estimado : i.impacto_estimado),
    0
  );

  function exportar() {
    const linhas: string[] = [];
    linhas.push("Relatório Revenue Intelligence");
    linhas.push(`Horizonte,${horizonte}`);
    linhas.push(`Cenário,${cenario}`);
    linhas.push(`Projetado fim de mês,${projetado}`);
    linhas.push(`Meta,${projecaoMes.meta_mes}`);
    linhas.push(`Gap,${gap}`);
    linhas.push(`Confiança,${Math.round(projecaoMes.confianca * 100)}%`);
    linhas.push("");
    linhas.push("Campanhas");
    linhas.push("Nome,Canal,Status,Gasto,Receita,ROI,Leads,Fechamentos,CAC");
    campanhasComStatus.forEach((c) => {
      linhas.push(
        [c.nome, c.canal, c.status, c.gasto, c.receita, c.roi, c.leads, c.fechamentos, c.cac].join(",")
      );
    });
    linhas.push("");
    linhas.push("Insights IA");
    linhas.push("Tipo,Título,Impacto,Aplicado");
    insightsReceita.forEach((i) => {
      linhas.push(
        [i.tipo, `"${i.titulo.replace(/"/g, '""')}"`, i.impacto_estimado, insightsAplicados[i.id] ? "sim" : "não"].join(",")
      );
    });
    const csv = linhas.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-intelligence-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Relatório CSV exportado");
  }

  function aplicarInsight(i: Insight) {
    setInsightsAplicados((prev) => ({ ...prev, [i.id]: true }));
    setInsightAberto(null);
    showToast(`Ação aplicada: ${i.titulo}`);
  }

  function toggleStatusCampanha(c: Campanha, target: CampanhaStatus) {
    setStatusCampanha((prev) => ({ ...prev, [c.id]: target }));
    const labelMap: Record<CampanhaStatus, string> = {
      ativa: "retomada",
      pausada: "pausada",
      encerrada: "encerrada",
    };
    showToast(`Campanha ${labelMap[target]}: ${c.nome}`);
  }

  return (
    <>
      <PageHeader
        title="Revenue Intelligence"
        subtitle={`Forecast, ROI e tração de campanhas • IA preditiva com ${Math.round(
          projecaoMes.confianca * 100
        )}% de confiança`}
        actions={
          <>
            <Tabs
              tabs={[
                { id: "30d", label: "30d" },
                { id: "60d", label: "60d" },
                { id: "90d", label: "90d" },
              ]}
              value={horizonte}
              onChange={(v) => setHorizonte(v as any)}
            />
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={exportar}
            >
              Exportar relatório
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* Hero previsão */}
        <Card className="overflow-hidden border-2 border-brand-200">
          <div className="p-5 bg-gradient-to-br from-brand-600 via-brand-700 to-aqua-700 text-white">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <div className="text-[11px] uppercase tracking-wider opacity-90 font-semibold flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5" />
                  Previsão IA • fim do mês
                </div>
                <div className="text-[34px] font-bold tabular leading-tight mt-1">
                  {money(projetado)}
                </div>
                <div className="text-[13px] opacity-90 mt-0.5">
                  Meta: {money(projecaoMes.meta_mes)} •{" "}
                  {gap >= 0 ? (
                    <span className="text-emerald-300 font-semibold">
                      +{money(gap)} acima
                    </span>
                  ) : (
                    <span className="text-rose-200 font-semibold">
                      {money(gap)} abaixo
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider opacity-90 font-semibold">
                  Confiança do modelo
                </div>
                <div className="text-[40px] font-bold tabular leading-none">
                  {Math.round(projecaoMes.confianca * 100)}%
                </div>
                <Badge
                  tone="slate"
                  className="mt-1 bg-white/20 text-white ring-white/30"
                >
                  Alta confiança
                </Badge>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <ProjItem
                label="Realizado MTD"
                valor={money(projecaoMes.real_mtd)}
                sub={`${Math.round((projecaoMes.real_mtd / projecaoMes.meta_mes) * 100)}% da meta`}
              />
              <ProjItem
                label="Dias restantes"
                valor={String(projecaoMes.dias_restantes)}
                sub={`até 30/abr`}
              />
              <ProjItem
                label="Ritmo atual"
                valor={money(projecaoMes.pace_diario_atual)}
                sub="por dia"
              />
              <ProjItem
                label="Ritmo necessário"
                valor={money(projecaoMes.pace_diario_necessario)}
                sub={
                  projecaoMes.pace_diario_necessario >
                  projecaoMes.pace_diario_atual
                    ? "+13% acelerar"
                    : "no pace"
                }
                warning={
                  projecaoMes.pace_diario_necessario >
                  projecaoMes.pace_diario_atual
                }
              />
            </div>
          </div>

          <CardBody className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-[12px] text-slate-600">
              <span>Cenário:</span>
              <Tabs
                tabs={[
                  { id: "pess", label: "Pessimista" },
                  { id: "base", label: "Base" },
                  { id: "otim", label: "Otimista" },
                ]}
                value={cenario}
                onChange={(v) => setCenario(v as any)}
              />
            </div>
            <Button leftIcon={<Zap className="h-4 w-4" />} onClick={() => setPlanoAberto(true)}>
              Ver plano de ação IA
            </Button>
          </CardBody>
        </Card>

        {/* Forecast chart */}
        <Card>
          <CardHeader
            title="Forecast de receita"
            subtitle={`Últimos 45d + próximos ${h - 45}d • intervalo de confiança sombreado`}
            action={
              <Badge tone="brand">
                <LineChartIcon className="h-3 w-3 mr-1" />
                Série temporal
              </Badge>
            }
          />
          <CardBody className="pt-0">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={serie}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gconf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="greal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 10 }}
                    interval={Math.floor(serie.length / 10)}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                    formatter={(v: any) => (v ? money(v as number) : "-")}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine
                    x="Hoje"
                    stroke="#64748b"
                    strokeDasharray="3 3"
                    label={{ value: "Hoje", fill: "#64748b", fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="p_alto"
                    stroke="none"
                    fill="url(#gconf)"
                    name="Intervalo"
                  />
                  <Area
                    type="monotone"
                    dataKey="p_baixo"
                    stroke="none"
                    fill="#ffffff"
                    name="—"
                    legendType="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="previsto"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name="Previsto IA"
                  />
                  <Area
                    type="monotone"
                    dataKey="real"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#greal)"
                    name="Real"
                  />
                  <ReferenceLine
                    y={15000}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: "Meta diária", fill: "#f59e0b", fontSize: 10 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Insights IA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {insightsReceita.map((i) => (
            <InsightCard
              key={i.id}
              insight={i}
              aplicado={!!insightsAplicados[i.id]}
              onAbrir={() => setInsightAberto(i)}
              onAplicar={() => aplicarInsight(i)}
            />
          ))}
        </div>

        {/* Tração campanhas */}
        <Card>
          <CardHeader
            title="Tração de campanhas"
            subtitle={`${campanhasComStatus.length} campanhas • ROI consolidado por período`}
            action={
              <Badge tone="violet">
                <Calendar className="h-3 w-3 mr-1" />
                Últimos 90d
              </Badge>
            }
          />
          <CardBody className="pt-0 space-y-3">
            {campanhasComStatus
              .slice()
              .sort((a, b) => b.roi - a.roi)
              .map((cp) => (
                <CampanhaLinha
                  key={cp.id}
                  c={cp}
                  onAbrir={() => setCampanhaAberta(cp)}
                  onPausar={() => toggleStatusCampanha(cp, "pausada")}
                  onRetomar={() => toggleStatusCampanha(cp, "ativa")}
                />
              ))}
          </CardBody>
        </Card>
      </PageContent>

      <PlanoAcaoDialog
        open={planoAberto}
        onClose={() => setPlanoAberto(false)}
        insights={insightsNaoAplicados}
        aplicados={Object.keys(insightsAplicados).length}
        impactoPotencial={impactoPotencial}
        onAplicar={aplicarInsight}
      />

      <InsightDetailDialog
        insight={insightAberto}
        aplicado={insightAberto ? !!insightsAplicados[insightAberto.id] : false}
        onClose={() => setInsightAberto(null)}
        onAplicar={(i) => aplicarInsight(i)}
      />

      <CampanhaDetailDialog
        campanha={campanhaAberta}
        onClose={() => setCampanhaAberta(null)}
        onPausar={(c) => {
          toggleStatusCampanha(c, "pausada");
          setCampanhaAberta({ ...c, status: "pausada" });
        }}
        onRetomar={(c) => {
          toggleStatusCampanha(c, "ativa");
          setCampanhaAberta({ ...c, status: "ativa" });
        }}
        onEncerrar={(c) => {
          toggleStatusCampanha(c, "encerrada");
          setCampanhaAberta(null);
        }}
      />

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

function ProjItem({
  label,
  valor,
  sub,
  warning,
}: {
  label: string;
  valor: string;
  sub: string;
  warning?: boolean;
}) {
  return (
    <div className="bg-white/10 rounded-[10px] p-3 backdrop-blur">
      <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
        {label}
      </div>
      <div className="text-[18px] font-bold tabular">{valor}</div>
      <div className={cn("text-[10px]", warning ? "text-amber-200" : "opacity-80")}>
        {warning && <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />}
        {sub}
      </div>
    </div>
  );
}

const insightConfig = {
  oportunidade: {
    bg: "from-emerald-500 to-teal-600",
    chip: "emerald" as const,
    label: "Oportunidade",
    icon: <Sparkles className="h-4 w-4" />,
  },
  risco: {
    bg: "from-rose-500 to-red-600",
    chip: "rose" as const,
    label: "Risco",
    icon: <TrendingDown className="h-4 w-4" />,
  },
  atencao: {
    bg: "from-amber-500 to-orange-500",
    chip: "amber" as const,
    label: "Atenção",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

function InsightCard({
  insight,
  aplicado,
  onAbrir,
  onAplicar,
}: {
  insight: Insight;
  aplicado: boolean;
  onAbrir: () => void;
  onAplicar: () => void;
}) {
  const config = insightConfig[insight.tipo];

  return (
    <Card
      className={cn(
        "transition",
        aplicado && "opacity-70"
      )}
    >
      <CardBody className="p-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-8 w-8 rounded-[9px] bg-gradient-to-br text-white inline-flex items-center justify-center",
              config.bg
            )}
          >
            {config.icon}
          </div>
          <Badge tone={config.chip}>{config.label}</Badge>
          <span className="ml-auto text-[11px] text-slate-500 tabular font-semibold">
            {insight.tipo === "risco" ? "-" : "+"}
            {money(insight.impacto_estimado)}
          </span>
        </div>
        <div className="mt-3 font-semibold text-slate-900 text-[14px]">
          {insight.titulo}
        </div>
        <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">
          {insight.descricao}
        </p>
        <div className="mt-3 flex items-center gap-2">
          {aplicado ? (
            <Badge tone="emerald" className="h-7 px-2.5">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Aplicada
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onAplicar}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Aplicar ação
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onAbrir}>
            Ver detalhes
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function acoesDoInsight(i: Insight): string[] {
  if (i.tipo === "oportunidade") {
    return [
      "Aumentar verba da campanha vencedora em 40%",
      "Clonar criativo de maior CTR para novo público",
      "Notificar equipe de mídia para monitorar saturação",
      "Agendar revisão em 7 dias para medir impacto",
    ];
  }
  if (i.tipo === "risco") {
    return [
      "Pausar imediatamente a fonte de gasto ineficiente",
      "Realocar verba para canal com ROI >5×",
      "Abrir auditoria de atribuição no período",
      "Notificar financeiro sobre ajuste de forecast",
    ];
  }
  return [
    "Abrir investigação com o time responsável",
    "Reativar campanhas pausadas com novo criativo",
    "Testar segmentação alternativa (A/B)",
    "Revisar em 14 dias com dados do período",
  ];
}

function InsightDetailDialog({
  insight,
  aplicado,
  onClose,
  onAplicar,
}: {
  insight: Insight | null;
  aplicado: boolean;
  onClose: () => void;
  onAplicar: (i: Insight) => void;
}) {
  if (!insight) return null;
  const config = insightConfig[insight.tipo];
  const acoes = acoesDoInsight(insight);

  return (
    <Dialog
      open={!!insight}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2">
          <div
            className={cn(
              "h-7 w-7 rounded-[8px] bg-gradient-to-br text-white inline-flex items-center justify-center",
              config.bg
            )}
          >
            {config.icon}
          </div>
          {insight.titulo}
        </span>
      }
      subtitle={
        <span className="flex items-center gap-2">
          <Badge tone={config.chip}>{config.label}</Badge>
          <span className="text-[12px] text-slate-600">
            Impacto estimado: {insight.tipo === "risco" ? "-" : "+"}
            {money(insight.impacto_estimado)}
          </span>
        </span>
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {!aplicado && (
            <Button
              onClick={() => onAplicar(insight)}
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Aplicar ação
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-[13px] text-slate-700 leading-relaxed">
          {insight.descricao}
        </p>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Plano sugerido pela IA
          </div>
          <ul className="space-y-2">
            {acoes.map((a, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-[13px] text-slate-700"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-[11px] font-semibold shrink-0">
                  {idx + 1}
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
        {aplicado && (
          <div className="rounded-[12px] bg-emerald-50 border border-emerald-200 p-3 text-[12px] text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Ação aplicada. O impacto será consolidado no próximo ciclo de forecast.
          </div>
        )}
      </div>
    </Dialog>
  );
}

function PlanoAcaoDialog({
  open,
  onClose,
  insights,
  aplicados,
  impactoPotencial,
  onAplicar,
}: {
  open: boolean;
  onClose: () => void;
  insights: Insight[];
  aplicados: number;
  impactoPotencial: number;
  onAplicar: (i: Insight) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-brand-600" />
          Plano de ação IA
        </span>
      }
      subtitle={`${insights.length} ações pendentes • ${aplicados} aplicadas • impacto potencial ${money(
        Math.abs(impactoPotencial)
      )}`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      {insights.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-slate-500">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
          Todas as ações foram aplicadas. Nenhuma pendência no momento.
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((i) => {
            const config = insightConfig[i.tipo];
            return (
              <div
                key={i.id}
                className="rounded-[12px] border border-slate-200 p-3 hover:border-brand-300 transition"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-[9px] bg-gradient-to-br text-white inline-flex items-center justify-center shrink-0",
                      config.bg
                    )}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone={config.chip}>{config.label}</Badge>
                      <span className="font-semibold text-slate-900 text-[14px]">
                        {i.titulo}
                      </span>
                      <span className="ml-auto text-[12px] tabular font-semibold text-slate-700">
                        {i.tipo === "risco" ? "-" : "+"}
                        {money(i.impacto_estimado)}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">
                      {i.descricao}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {acoesDoInsight(i)
                        .slice(0, 2)
                        .map((a, idx) => (
                          <li
                            key={idx}
                            className="text-[12px] text-slate-600 flex items-start gap-1.5"
                          >
                            <span className="text-brand-600 font-semibold">
                              •
                            </span>
                            {a}
                          </li>
                        ))}
                    </ul>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        onClick={() => onAplicar(i)}
                        rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}

function CampanhaLinha({
  c,
  onAbrir,
  onPausar,
  onRetomar,
}: {
  c: Campanha;
  onAbrir: () => void;
  onPausar: () => void;
  onRetomar: () => void;
}) {
  const statusConfig = {
    ativa: { tone: "emerald" as const, label: "Ativa", icon: <Play className="h-2.5 w-2.5" /> },
    pausada: { tone: "amber" as const, label: "Pausada", icon: <Pause className="h-2.5 w-2.5" /> },
    encerrada: { tone: "slate" as const, label: "Encerrada", icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
  }[c.status as CampanhaStatus];

  return (
    <div className="p-3 rounded-[12px] border border-slate-200 hover:border-brand-300 transition">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={onAbrir}
          className="flex-1 min-w-0 text-left ring-focus rounded-[8px]"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-[14px] hover:text-brand-700">
              {c.nome}
            </span>
            <Badge tone={statusConfig.tone} className="text-[10px]">
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
            <span className="text-[11px] text-slate-500">{c.canal}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{c.periodo}</div>
        </button>

        <div className="flex items-center gap-4 text-right shrink-0">
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-semibold">
              Gasto
            </div>
            <div className="text-[13px] font-semibold text-slate-900 tabular">
              {money(c.gasto)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-semibold">
              Receita
            </div>
            <div className="text-[13px] font-semibold text-emerald-700 tabular">
              {money(c.receita)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-semibold">
              ROI
            </div>
            <div
              className={cn(
                "text-[18px] font-bold tabular",
                c.roi >= 3
                  ? "text-emerald-700"
                  : c.roi >= 1
                  ? "text-amber-700"
                  : "text-rose-700"
              )}
            >
              {c.roi.toFixed(1)}×
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-semibold">
              Tendência
            </div>
            <div className="flex items-center justify-end">
              {c.tendencia === "subindo" ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : c.tendencia === "caindo" ? (
                <TrendingDown className="h-4 w-4 text-rose-600" />
              ) : (
                <span className="h-0.5 w-4 bg-slate-400 rounded" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="grid grid-cols-3 gap-3 text-[11px] flex-1 min-w-[240px]">
          <div>
            <span className="text-slate-500">Leads: </span>
            <span className="font-semibold text-slate-900 tabular">
              {c.leads}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Fechamentos: </span>
            <span className="font-semibold text-slate-900 tabular">
              {c.fechamentos} ({pct(c.fechamentos / c.leads)})
            </span>
          </div>
          <div>
            <span className="text-slate-500">CAC: </span>
            <span className="font-semibold text-slate-900 tabular">
              {money(c.cac)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {c.status === "ativa" && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Pause className="h-3.5 w-3.5" />}
              onClick={onPausar}
            >
              Pausar
            </Button>
          )}
          {c.status === "pausada" && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Play className="h-3.5 w-3.5" />}
              onClick={onRetomar}
            >
              Retomar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onAbrir}>
            Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
}

function CampanhaDetailDialog({
  campanha,
  onClose,
  onPausar,
  onRetomar,
  onEncerrar,
}: {
  campanha: Campanha | null;
  onClose: () => void;
  onPausar: (c: Campanha) => void;
  onRetomar: (c: Campanha) => void;
  onEncerrar: (c: Campanha) => void;
}) {
  if (!campanha) return null;
  const c = campanha;
  const lucro = c.receita - c.gasto;
  const taxaConv = c.leads > 0 ? c.fechamentos / c.leads : 0;
  return (
    <Dialog
      open={!!campanha}
      onClose={onClose}
      size="lg"
      title={c.nome}
      subtitle={`${c.canal} • ${c.periodo}`}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => onEncerrar(c)}
            className="text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            Encerrar
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {c.status === "ativa" && (
              <Button
                leftIcon={<Pause className="h-4 w-4" />}
                onClick={() => onPausar(c)}
              >
                Pausar campanha
              </Button>
            )}
            {c.status === "pausada" && (
              <Button
                leftIcon={<Play className="h-4 w-4" />}
                onClick={() => onRetomar(c)}
              >
                Retomar campanha
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricTile label="Gasto" value={money(c.gasto)} />
          <MetricTile label="Receita" value={money(c.receita)} tone="emerald" />
          <MetricTile
            label="Lucro"
            value={money(lucro)}
            tone={lucro >= 0 ? "emerald" : "rose"}
          />
          <MetricTile
            label="ROI"
            value={`${c.roi.toFixed(1)}×`}
            tone={c.roi >= 3 ? "emerald" : c.roi >= 1 ? "amber" : "rose"}
          />
          <MetricTile label="Leads" value={String(c.leads)} />
          <MetricTile
            label="Fechamentos"
            value={`${c.fechamentos} (${pct(taxaConv)})`}
          />
          <MetricTile label="CPL" value={money(c.cpl)} />
          <MetricTile label="CAC" value={money(c.cac)} />
        </div>

        <div className="rounded-[12px] border border-slate-200 p-3 bg-slate-50">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
            Recomendação da IA
          </div>
          <p className="text-[13px] text-slate-700 leading-relaxed">
            {c.roi >= 5
              ? "Campanha com performance excepcional. Recomenda-se aumentar verba em 40% e clonar criativos vencedores para públicos semelhantes."
              : c.roi >= 2
              ? "Performance saudável. Manter verba atual e testar novos criativos para evitar saturação."
              : c.roi >= 1
              ? "ROI marginal. Revisar segmentação e criativo antes de escalar; considerar A/B teste."
              : "ROI abaixo do custo. Pausar imediatamente e realocar verba para canais com ROI >3×."}
          </p>
        </div>
      </div>
    </Dialog>
  );
}

function MetricTile({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber" | "rose";
}) {
  const colorMap = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
  };
  return (
    <div className="rounded-[10px] border border-slate-200 bg-white p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </div>
      <div className={cn("text-[16px] font-bold tabular", colorMap[tone])}>
        {value}
      </div>
    </div>
  );
}
