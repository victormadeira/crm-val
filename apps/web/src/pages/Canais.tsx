import { useState, useMemo } from "react";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  DollarSign,
  Download,
  ExternalLink,
  Flame,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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
import { cn } from "@/lib/cn";
import { money, number, pct } from "@/lib/format";
import { canalDetalhes, canalEvolucao } from "@/lib/mock";

type Ordenacao = "roi" | "volume" | "conversao" | "ltv";

export function Canais() {
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("roi");
  const [periodo, setPeriodo] = useState("30d");

  const receitaTotal = canalDetalhes.reduce(
    (s, c) => s + c.volume * c.taxa * c.ticket,
    0
  );
  const investidoTotal = canalDetalhes.reduce(
    (s, c) => s + c.cpl * c.volume,
    0
  );
  const roiMedio = investidoTotal > 0 ? receitaTotal / investidoTotal : 0;
  const leadsTotal = canalDetalhes.reduce((s, c) => s + c.volume, 0);

  const ordenados = useMemo(() => {
    const arr = [...canalDetalhes];
    if (ordenacao === "roi") {
      arr.sort(
        (a, b) =>
          (b.volume * b.taxa * b.ticket) / Math.max(b.cpl * b.volume, 1) -
          (a.volume * a.taxa * a.ticket) / Math.max(a.cpl * a.volume, 1)
      );
    } else if (ordenacao === "volume") arr.sort((a, b) => b.volume - a.volume);
    else if (ordenacao === "conversao") arr.sort((a, b) => b.taxa - a.taxa);
    else arr.sort((a, b) => b.ltv - a.ltv);
    return arr;
  }, [ordenacao]);

  const melhor = ordenados[0];
  const pior = [...canalDetalhes].sort(
    (a, b) =>
      (a.volume * a.taxa * a.ticket) / Math.max(a.cpl * a.volume, 1) -
      (b.volume * b.taxa * b.ticket) / Math.max(b.cpl * b.volume, 1)
  )[0];

  return (
    <>
      <PageHeader
        title="Canais & ROI"
        subtitle="Performance por origem de lead • onde investir e cortar"
        actions={
          <>
            <Tabs
              tabs={[
                { id: "7d", label: "7 dias" },
                { id: "30d", label: "30 dias" },
                { id: "90d", label: "90 dias" },
              ]}
              value={periodo}
              onChange={setPeriodo}
            />
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
              Exportar
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* KPIs topo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPI
            tone="brand"
            label="Leads gerados"
            value={number(leadsTotal)}
            sub={`${canalDetalhes.length} canais ativos`}
            icon={<Users className="h-5 w-5" />}
            delta={12}
          />
          <KPI
            tone="emerald"
            label="Receita atribuída"
            value={money(receitaTotal)}
            sub="convertida em vendas"
            icon={<DollarSign className="h-5 w-5" />}
            delta={8}
          />
          <KPI
            tone="amber"
            label="Investido em mídia"
            value={money(investidoTotal)}
            sub={`CPL médio ${money(Math.round(investidoTotal / leadsTotal))}`}
            icon={<Target className="h-5 w-5" />}
            delta={-3}
          />
          <KPI
            tone="violet"
            label="ROI médio"
            value={`${roiMedio.toFixed(1)}×`}
            sub="cada R$ 1 investido"
            icon={<TrendingUp className="h-5 w-5" />}
            delta={18}
          />
        </div>

        {/* Melhor / pior canal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardBody className="p-5">
              <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-semibold uppercase tracking-wider">
                <Flame className="h-3.5 w-3.5" />
                Melhor canal
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-[22px] font-bold text-slate-900">
                    {melhor.canal}
                  </div>
                  <div className="text-[13px] text-slate-600 mt-1 max-w-md">
                    {melhor.observacao}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500">ROI</div>
                  <div className="text-[32px] font-bold text-emerald-700 tabular leading-none">
                    {(
                      (melhor.volume * melhor.taxa * melhor.ticket) /
                      Math.max(melhor.cpl * melhor.volume, 1)
                    ).toFixed(1)}
                    ×
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" leftIcon={<Zap className="h-3.5 w-3.5" />}>
                  Escalar investimento
                </Button>
                <Badge tone="emerald">
                  LTV {money(melhor.ltv)} • Payback {melhor.payback_dias}d
                </Badge>
              </div>
            </CardBody>
          </Card>

          <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
            <CardBody className="p-5">
              <div className="flex items-center gap-2 text-rose-700 text-[11px] font-semibold uppercase tracking-wider">
                <TrendingDown className="h-3.5 w-3.5" />
                Canal em risco
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-[22px] font-bold text-slate-900">
                    {pior.canal}
                  </div>
                  <div className="text-[13px] text-slate-600 mt-1 max-w-md">
                    {pior.observacao}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500">ROI</div>
                  <div className="text-[32px] font-bold text-rose-700 tabular leading-none">
                    {(
                      (pior.volume * pior.taxa * pior.ticket) /
                      Math.max(pior.cpl * pior.volume, 1)
                    ).toFixed(1)}
                    ×
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button variant="danger" size="sm">
                  Pausar campanha
                </Button>
                <Badge tone="rose">
                  CAC {money(pior.cac)} • Payback {pior.payback_dias}d
                </Badge>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Evolução */}
        <Card>
          <CardHeader
            title="Evolução de leads por canal"
            subtitle="Volume mensal nos últimos 4 meses"
            action={
              <Badge tone="brand">
                <Calendar className="h-3 w-3 mr-1" />
                Mensal
              </Badge>
            }
          />
          <CardBody className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={canalEvolucao}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gwa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gig" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="whatsapp"
                    stroke="#10b981"
                    fill="url(#gwa)"
                    name="WhatsApp"
                  />
                  <Area
                    type="monotone"
                    dataKey="rdstation"
                    stroke="#0ea5e9"
                    fill="url(#grd)"
                    name="RD Station"
                  />
                  <Area
                    type="monotone"
                    dataKey="instagram"
                    stroke="#a855f7"
                    fill="url(#gig)"
                    name="Instagram"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Tabela detalhada */}
        <Card>
          <CardHeader
            title="Comparativo por canal"
            subtitle={`${canalDetalhes.length} canais • ordenado por ${ordenacao === "roi" ? "ROI" : ordenacao === "volume" ? "volume" : ordenacao === "conversao" ? "conversão" : "LTV"}`}
            action={
              <Tabs
                tabs={[
                  { id: "roi", label: "ROI" },
                  { id: "volume", label: "Volume" },
                  { id: "conversao", label: "Conversão" },
                  { id: "ltv", label: "LTV" },
                ]}
                value={ordenacao}
                onChange={(v) => setOrdenacao(v as Ordenacao)}
              />
            }
          />
          <CardBody className="pt-0 overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-2 font-semibold">Canal</th>
                  <th className="py-2 font-semibold text-right">Leads</th>
                  <th className="py-2 font-semibold text-right">Conv</th>
                  <th className="py-2 font-semibold text-right">Ticket</th>
                  <th className="py-2 font-semibold text-right">CPL</th>
                  <th className="py-2 font-semibold text-right">CAC</th>
                  <th className="py-2 font-semibold text-right">LTV</th>
                  <th className="py-2 font-semibold text-right">Payback</th>
                  <th className="py-2 font-semibold text-right">ROI</th>
                  <th className="py-2 font-semibold text-right">Tendência</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((c) => {
                  const receita = c.volume * c.taxa * c.ticket;
                  const investido = c.cpl * c.volume;
                  const roi = investido > 0 ? receita / investido : 0;
                  return (
                    <tr
                      key={c.canal}
                      className="border-b border-slate-50 hover:bg-slate-50/60 transition"
                    >
                      <td className="py-2.5 font-medium text-slate-900">
                        {c.canal}
                      </td>
                      <td className="py-2.5 text-right tabular">
                        {number(c.volume)}
                      </td>
                      <td className="py-2.5 text-right tabular">
                        {pct(c.taxa)}
                      </td>
                      <td className="py-2.5 text-right tabular">
                        {money(c.ticket)}
                      </td>
                      <td className="py-2.5 text-right tabular">
                        {c.cpl === 0 ? (
                          <Badge tone="emerald">Gratuito</Badge>
                        ) : (
                          money(c.cpl)
                        )}
                      </td>
                      <td className="py-2.5 text-right tabular">
                        {money(c.cac)}
                      </td>
                      <td className="py-2.5 text-right tabular">
                        {money(c.ltv)}
                      </td>
                      <td className="py-2.5 text-right tabular">
                        {c.payback_dias}d
                      </td>
                      <td className="py-2.5 text-right tabular font-semibold">
                        <span
                          className={cn(
                            roi >= 3
                              ? "text-emerald-700"
                              : roi >= 1.5
                              ? "text-amber-700"
                              : "text-rose-700"
                          )}
                        >
                          {roi.toFixed(1)}×
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <TendenciaIcon t={c.tendencia} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Insights de alocação */}
        <Card>
          <CardHeader
            title="Recomendações de alocação"
            subtitle="Onde redirecionar orçamento agora"
            action={
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                Ver simulação
              </Button>
            }
          />
          <CardBody className="pt-0 space-y-3">
            <RecomendacaoCanal
              acao="escalar"
              canal="WhatsApp"
              texto="Dobrar verba (R$ 2k → R$ 4k). ROI 25× projetado +R$ 50k/mês em receita adicional."
            />
            <RecomendacaoCanal
              acao="cortar"
              canal="Google Ads regional"
              texto="CAC 4× acima do ticket médio. Pausar e realocar R$ 1.4k para Retargeting."
            />
            <RecomendacaoCanal
              acao="testar"
              canal="Programa de Indicação"
              texto="Conversão 48% e CPL zero. Um programa estruturado (R$ 50 por indicação) pode triplicar volume."
            />
          </CardBody>
        </Card>
      </PageContent>
    </>
  );
}

function KPI({
  tone,
  label,
  value,
  sub,
  icon,
  delta,
}: {
  tone: "brand" | "emerald" | "amber" | "violet";
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  delta: number;
}) {
  const toneMap = {
    brand: "from-brand-500 to-brand-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-orange-500",
    violet: "from-violet-500 to-violet-600",
  };
  const up = delta >= 0;
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-11 w-11 rounded-[11px] bg-gradient-to-br text-white inline-flex items-center justify-center shadow-soft",
              toneMap[tone]
            )}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              {label}
            </div>
            <div className="text-[22px] font-bold text-slate-900 tabular leading-tight">
              {value}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11px] font-semibold",
              up ? "text-emerald-700" : "text-rose-700"
            )}
          >
            {up ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {Math.abs(delta)}%
          </span>
          <span className="text-[11px] text-slate-500 truncate">{sub}</span>
        </div>
      </CardBody>
    </Card>
  );
}

function TendenciaIcon({ t }: { t: "subindo" | "caindo" | "estavel" }) {
  if (t === "subindo")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
        <TrendingUp className="h-3.5 w-3.5" />
        Subindo
      </span>
    );
  if (t === "caindo")
    return (
      <span className="inline-flex items-center gap-1 text-rose-700 text-[11px] font-semibold">
        <TrendingDown className="h-3.5 w-3.5" />
        Caindo
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-slate-600 text-[11px] font-semibold">
      <Minus className="h-3.5 w-3.5" />
      Estável
    </span>
  );
}

function RecomendacaoCanal({
  acao,
  canal,
  texto,
}: {
  acao: "escalar" | "cortar" | "testar";
  canal: string;
  texto: string;
}) {
  const config = {
    escalar: {
      bg: "bg-emerald-50 border-emerald-200",
      chip: "emerald" as const,
      label: "Escalar",
      icon: <TrendingUp className="h-4 w-4 text-emerald-700" />,
    },
    cortar: {
      bg: "bg-rose-50 border-rose-200",
      chip: "rose" as const,
      label: "Cortar",
      icon: <TrendingDown className="h-4 w-4 text-rose-700" />,
    },
    testar: {
      bg: "bg-amber-50 border-amber-200",
      chip: "amber" as const,
      label: "Testar",
      icon: <Zap className="h-4 w-4 text-amber-700" />,
    },
  }[acao];

  return (
    <div
      className={cn("rounded-[12px] border p-3 flex items-start gap-3", config.bg)}
    >
      <div className="h-8 w-8 rounded-[9px] bg-white inline-flex items-center justify-center shrink-0">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge tone={config.chip} className="text-[10px]">
            {config.label}
          </Badge>
          <span className="font-semibold text-slate-900 text-[13px]">
            {canal}
          </span>
        </div>
        <div className="text-[12px] text-slate-700 mt-1 leading-relaxed">
          {texto}
        </div>
      </div>
      <Button variant="outline" size="sm">
        Aplicar
      </Button>
    </div>
  );
}
