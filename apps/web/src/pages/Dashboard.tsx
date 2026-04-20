import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarRange,
  Check,
  Download,
  Flame,
  QrCode,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users2,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Avatar } from "@/components/ui/Avatar";
import {
  canaisROI,
  corretores,
  funil,
  receitaSerie,
  alertas,
  routingMetrica,
} from "@/lib/mock";
import { compact, money, number, pct } from "@/lib/format";
import { cn } from "@/lib/cn";

const MESES_DISPONIVEIS = [
  "Janeiro 2026",
  "Fevereiro 2026",
  "Março 2026",
  "Abril 2026",
  "Últimos 30 dias",
  "Últimos 90 dias",
  "Ano corrente",
];

export function Dashboard() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState("Abril 2026");
  const [periodoAberto, setPeriodoAberto] = useState(false);
  const receitaMes = corretores.reduce((s, c) => s + c.receita_mes, 0);
  const metaMes = corretores.reduce((s, c) => s + c.meta_mensal, 0);
  const forecast = Math.round(receitaMes * 1.22);
  const ticketMedio = Math.round(receitaMes / 82);

  return (
    <>
      <PageHeader
        title="Dashboard executivo"
        subtitle="Visão macro da operação • Atualizado há 12s"
        actions={
          <>
            <div className="relative">
              <Button
                variant="outline"
                leftIcon={<CalendarRange className="h-4 w-4" />}
                onClick={() => setPeriodoAberto((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={periodoAberto}
              >
                {periodo}
              </Button>
              {periodoAberto && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setPeriodoAberto(false)}
                    aria-hidden
                  />
                  <ul
                    role="listbox"
                    className="absolute right-0 mt-1 z-50 w-52 bg-white border border-slate-200 rounded-[12px] shadow-pop p-1 animate-slide-up"
                  >
                    {MESES_DISPONIVEIS.map((m) => (
                      <li key={m}>
                        <button
                          role="option"
                          aria-selected={periodo === m}
                          onClick={() => {
                            setPeriodo(m);
                            setPeriodoAberto(false);
                          }}
                          className={cn(
                            "w-full text-left h-9 px-3 rounded-[8px] text-[13px] flex items-center justify-between transition",
                            periodo === m
                              ? "bg-brand-50 text-brand-700 font-medium"
                              : "text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          {m}
                          {periodo === m && <Check className="h-3.5 w-3.5" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => {
                const csv = `Métrica,Valor\nReceita do mês,${receitaMes}\nMeta do mês,${metaMes}\nForecast 30d,${forecast}\nTicket médio,${ticketMedio}\n`;
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `dashboard-abril-2026.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Exportar
            </Button>
            <Button
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => navigate("/analytics")}
            >
              Análise IA
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* Perda evitada — hero da IA de roteamento */}
        <Card className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 border-emerald-700 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
          <CardBody className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
                  <Shield className="h-3.5 w-3.5" />
                  Roteamento IA • {routingMetrica.periodo}
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-[34px] font-bold tabular">
                    {money(routingMetrica.perda_evitada_reais)}
                  </span>
                  <span className="text-sm text-emerald-100">perda evitada</span>
                </div>
                <p className="text-[13px] text-emerald-50 mt-1 max-w-xl leading-relaxed">
                  {routingMetrica.fechamentos_extras} vendas extras vieram de alocação
                  inteligente — sem sobrecarregar nenhum corretor. Todos recebem
                  leads; a IA escolhe <strong>quem</strong> converte melhor cada perfil.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="rounded-[12px] bg-white/10 border border-white/15 px-4 py-3 backdrop-blur-sm">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-200">
                    Conv IA
                  </div>
                  <div className="text-xl font-bold tabular mt-0.5">
                    {pct(routingMetrica.conv_ia)}
                  </div>
                </div>
                <div className="rounded-[12px] bg-white/5 border border-white/10 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-200">
                    Conv manual
                  </div>
                  <div className="text-xl font-semibold tabular mt-0.5 text-emerald-100">
                    {pct(routingMetrica.conv_manual)}
                  </div>
                </div>
                <Link to="/router">
                  <Button
                    variant="subtle"
                    size="md"
                    className="bg-white/15 text-white hover:bg-white/25 border border-white/15"
                    rightIcon={<ArrowUpRight className="h-4 w-4" />}
                  >
                    Abrir roteamento
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardBody className="pt-5">
              <Stat
                label="Receita do mês"
                value={money(receitaMes)}
                delta={18.4}
                hint="vs. abril/25"
                icon={<Wallet className="h-5 w-5" />}
                tone="brand"
              />
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Meta {money(metaMes)}</span>
                  <span className="tabular font-medium text-slate-700">
                    {pct(receitaMes / metaMes)}
                  </span>
                </div>
                <Progress value={(receitaMes / metaMes) * 100} tone="brand" />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="pt-5">
              <Stat
                label="Forecast 30d"
                value={money(forecast)}
                delta={9.1}
                hint="intervalo ±8%"
                icon={<TrendingUp className="h-5 w-5" />}
                tone="emerald"
              />
              <div className="mt-4 flex items-center gap-2">
                <Badge tone="emerald" dot>
                  Modelo híbrido
                </Badge>
                <Badge tone="slate">Confiança 92%</Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="pt-5">
              <Stat
                label="Ticket médio"
                value={money(ticketMedio)}
                delta={-2.3}
                hint="vendas fechadas"
                icon={<QrCode className="h-5 w-5" />}
                tone="aqua"
              />
              <div className="mt-4 flex items-center gap-2">
                <Badge tone="aqua">Anual 68%</Badge>
                <Badge tone="slate">Diário 32%</Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="pt-5">
              <Stat
                label="Taxa de conversão"
                value="31,4%"
                delta={4.2}
                hint="lead → fechado"
                icon={<Target className="h-5 w-5" />}
                tone="amber"
              />
              <div className="mt-4 flex items-center gap-2">
                <Badge tone="fuchsia">Copilot 72% aceite</Badge>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Receita + Funil */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <Card>
            <CardHeader
              title="Receita × meta"
              subtitle="Últimos 20 dias • atualização diária"
              action={
                <div className="flex items-center gap-2">
                  <Badge tone="brand" dot>
                    Real
                  </Badge>
                  <Badge tone="slate" dot>
                    Meta
                  </Badge>
                </div>
              }
            />
            <CardBody>
              <div className="h-[270px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={receitaSerie}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0B6BCB" stopOpacity={0.24} />
                        <stop offset="100%" stopColor="#0B6BCB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E2E8F0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="dia"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => compact(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        border: "1px solid #E2E8F0",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => money(v)}
                    />
                    <Area
                      type="monotone"
                      dataKey="meta"
                      stroke="#CBD5E1"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      fill="none"
                    />
                    <Area
                      type="monotone"
                      dataKey="real"
                      stroke="#0B6BCB"
                      strokeWidth={2.5}
                      fill="url(#g1)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Funil de conversão"
              subtitle="Pipeline ativo"
              action={<Badge tone="emerald">+12 hoje</Badge>}
            />
            <CardBody>
              <div className="space-y-3">
                {funil.map((f, i) => {
                  const pctW = (f.count / funil[0].count) * 100;
                  const conv =
                    i === 0
                      ? 1
                      : f.count / funil[i - 1].count;
                  return (
                    <div key={f.etapa}>
                      <div className="flex items-center justify-between text-[13px] mb-1.5">
                        <span className="font-medium text-slate-700">
                          {f.etapa}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 tabular">
                          <span className="font-semibold text-slate-900">
                            {number(f.count)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {money(f.valor)}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-7 rounded-[8px] bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-[8px] bg-gradient-to-r transition-all duration-700",
                            i === 4
                              ? "from-emerald-400 to-emerald-600"
                              : "from-brand-400 to-brand-600"
                          )}
                          style={{ width: `${pctW}%` }}
                        />
                        {i > 0 && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular text-slate-600">
                            {pct(conv)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[12px]">
                <span className="text-slate-500">Velocidade do pipeline</span>
                <Badge tone="emerald" dot>
                  6,2 dias médio • -1,4d vs. mar
                </Badge>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Top corretores + Canais */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
          <Card>
            <CardHeader
              title="Top corretores"
              subtitle="Por receita gerada"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                  onClick={() => navigate("/corretores")}
                >
                  Ver todos
                </Button>
              }
            />
            <CardBody className="pt-0">
              <ul className="divide-y divide-slate-100">
                {[...corretores]
                  .sort((a, b) => b.receita_mes - a.receita_mes)
                  .slice(0, 5)
                  .map((c, i) => (
                    <li
                      key={c.id}
                      className="py-3 flex items-center gap-3 first:pt-0 last:pb-0"
                    >
                      <div className="relative">
                        <Avatar name={c.nome} size="md" />
                        {i < 3 && (
                          <span
                            className={cn(
                              "absolute -bottom-1 -right-1 h-4 w-4 rounded-full text-[10px] font-bold text-white inline-flex items-center justify-center ring-2 ring-white",
                              i === 0
                                ? "bg-amber-500"
                                : i === 1
                                ? "bg-slate-400"
                                : "bg-orange-600"
                            )}
                          >
                            {i + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 truncate">
                            {c.nome}
                          </span>
                          <Badge
                            tone={
                              c.nivel === "Platina"
                                ? "violet"
                                : c.nivel === "Ouro"
                                ? "amber"
                                : c.nivel === "Prata"
                                ? "slate"
                                : "rose"
                            }
                            className="text-[10px]"
                          >
                            {c.nivel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500 tabular">
                          <span>Conv {pct(c.taxa_conversao)}</span>
                          <span>•</span>
                          <span>Resp {c.tempo_medio_resposta}min</span>
                          <span>•</span>
                          <span>NPS {c.nps.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="text-right tabular">
                        <div className="text-sm font-semibold text-slate-900">
                          {money(c.receita_mes)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {pct(c.receita_mes / c.meta_mensal)} meta
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="ROI por canal"
              subtitle="Últimos 30 dias"
              action={<Badge tone="aqua">6 canais ativos</Badge>}
            />
            <CardBody>
              <div className="h-[220px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={canaisROI}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E2E8F0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="canal"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        border: "1px solid #E2E8F0",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                      {canaisROI.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            ["#0B6BCB", "#06B6D4", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"][i]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {canaisROI.slice(0, 3).map((c) => (
                  <div
                    key={c.canal}
                    className="rounded-[10px] border border-slate-200 p-2.5"
                  >
                    <div className="text-[11px] text-slate-500">{c.canal}</div>
                    <div className="text-sm font-semibold text-slate-900 tabular mt-0.5">
                      {pct(c.taxa)}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular">
                      CPL {money(c.cpl)}
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Alertas + IA insights */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          <Card>
            <CardHeader
              title="Alertas em tempo real"
              subtitle="Ações que precisam de atenção agora"
              action={<Badge tone="rose" dot>{alertas.length} ativos</Badge>}
            />
            <CardBody className="pt-0">
              <ul className="divide-y divide-slate-100">
                {alertas.map((a) => (
                  <li
                    key={a.id}
                    className="py-3 flex items-start gap-3 first:pt-0"
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-[9px] inline-flex items-center justify-center shrink-0",
                        a.severidade === "critical"
                          ? "bg-rose-50 text-rose-600"
                          : a.severidade === "warning"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-brand-50 text-brand-600"
                      )}
                    >
                      {a.severidade === "critical" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : a.tipo === "meta" ? (
                        <Target className="h-4 w-4" />
                      ) : (
                        <Flame className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">
                        {a.titulo}
                      </div>
                      <div className="text-[12px] text-slate-500 mt-0.5">
                        {a.descricao}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/alertas")}
                    >
                      Resolver
                    </Button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-brand-900 border-slate-900 text-white">
            <CardHeader
              title={
                <span className="text-white flex items-center gap-2">
                  <Bot className="h-4 w-4 text-aqua-300" />
                  Insight da IA • semanal
                </span>
              }
              subtitle={
                <span className="text-slate-300">
                  Produzido automaticamente em cada fechamento
                </span>
              }
            />
            <CardBody>
              <blockquote className="text-[14px] leading-relaxed text-slate-100">
                "Vendas com <strong>reframe para valor mensal</strong> converteram{" "}
                <strong className="text-aqua-300">+41%</strong> em leads sensíveis
                a preço esta semana. Sugira este gatilho proativamente no
                Copilot para leads com tag{" "}
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] text-aqua-200 font-mono">
                  preco_sensivel
                </code>
                ."
              </blockquote>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex-1 rounded-[10px] bg-white/5 border border-white/10 p-3">
                  <div className="text-[11px] text-slate-300 uppercase tracking-wider">
                    Objeções da semana
                  </div>
                  <div className="text-sm font-semibold mt-1">
                    Preço • Sazonalidade • Comparação
                  </div>
                </div>
                <div className="flex-1 rounded-[10px] bg-white/5 border border-white/10 p-3">
                  <div className="text-[11px] text-slate-300 uppercase tracking-wider">
                    Gatilho top
                  </div>
                  <div className="text-sm font-semibold mt-1">
                    Valor mensal
                  </div>
                </div>
              </div>
              <Button
                variant="subtle"
                size="sm"
                className="mt-5 bg-white/10 text-white hover:bg-white/20"
                rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                onClick={() => navigate("/insights")}
              >
                Ver relatório completo
              </Button>
            </CardBody>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
