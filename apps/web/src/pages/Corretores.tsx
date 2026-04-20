import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Award,
  Clock,
  Flame,
  HeartPulse,
  LifeBuoy,
  MessageCircle,
  PauseCircle,
  Search,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Progress } from "@/components/ui/Progress";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { money, pct } from "@/lib/format";
import { corretores, leadsByCorretor, leadsParadosPorCorretor } from "@/lib/mock";
import type { Corretor } from "@/lib/types";

type Ordem = "health" | "receita" | "conversao" | "backlog";

export function Corretores() {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("health");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [politicasOpen, setPoliticasOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [politicas, setPoliticas] = useState({
    maxLeads: 40,
    modo: "health" as "round-robin" | "health" | "especialidade",
    slaPrimeiroContato: 15,
    slaResposta: 120,
    pausarHealthAbaixoDe: 55,
    escalarApos: 48,
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 3000);
  };

  const salvarPoliticas = () => {
    setPoliticasOpen(false);
    showToast("Políticas de alocação atualizadas");
  };

  useEffect(() => {
    const id = searchParams.get("id");
    if (id && corretores.some((c) => c.id === id)) {
      setSelecionadoId(id);
      const next = new URLSearchParams(searchParams);
      next.delete("id");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const lista = useMemo(() => {
    const filtrados = corretores.filter((c) =>
      busca ? c.nome.toLowerCase().includes(busca.toLowerCase()) : true
    );
    const sorted = [...filtrados];
    if (ordem === "health") sorted.sort((a, b) => b.health_score - a.health_score);
    else if (ordem === "receita") sorted.sort((a, b) => b.receita_mes - a.receita_mes);
    else if (ordem === "conversao")
      sorted.sort((a, b) => b.taxa_conversao - a.taxa_conversao);
    else if (ordem === "backlog")
      sorted.sort((a, b) => b.leads_parados - a.leads_parados);
    return sorted;
  }, [busca, ordem]);

  const mediaHealth = Math.round(
    corretores.reduce((s, c) => s + c.health_score, 0) / corretores.length
  );
  const comProblema = corretores.filter(
    (c) => c.health_score < 60 || c.leads_parados / Math.max(c.leads_ativos, 1) >= 0.35
  ).length;
  const totalParados = corretores.reduce((s, c) => s + c.leads_parados, 0);
  const totalReceita = corretores.reduce((s, c) => s + c.receita_mes, 0);

  return (
    <>
      <PageHeader
        title="Corretores"
        subtitle="Gestão de time • Health, vazão e performance individual"
        actions={
          <Button
            variant="outline"
            leftIcon={<Shield className="h-4 w-4" />}
            onClick={() => setPoliticasOpen(true)}
          >
            Políticas de alocação
          </Button>
        }
      />

      <PageContent className="space-y-6">
        {/* KPIs do time */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPITime
            icon={<Users className="h-4 w-4" />}
            label="Time ativo"
            value={corretores.filter((c) => c.ativo).length.toString()}
            sub={`de ${corretores.length} total`}
            tone="brand"
          />
          <KPITime
            icon={<HeartPulse className="h-4 w-4" />}
            label="Health médio"
            value={`${mediaHealth}`}
            sub={comProblema > 0 ? `${comProblema} com atenção` : "todos saudáveis"}
            tone={mediaHealth >= 75 ? "emerald" : mediaHealth >= 60 ? "amber" : "rose"}
          />
          <KPITime
            icon={<PauseCircle className="h-4 w-4" />}
            label="Leads parados total"
            value={totalParados.toString()}
            sub="risco de receita"
            tone={totalParados > 15 ? "rose" : "amber"}
          />
          <KPITime
            icon={<Wallet className="h-4 w-4" />}
            label="Receita do time"
            value={money(totalReceita)}
            sub="mês atual"
            tone="violet"
          />
        </div>

        {/* Lista */}
        <Card>
          <CardHeader
            title="Ranking do time"
            subtitle={`${lista.length} corretores`}
            action={
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar corretor…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-48"
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                />
                <Tabs
                  tabs={[
                    { id: "health", label: "Health" },
                    { id: "receita", label: "Receita" },
                    { id: "conversao", label: "Conversão" },
                    { id: "backlog", label: "Backlog" },
                  ]}
                  value={ordem}
                  onChange={(v) => setOrdem(v as Ordem)}
                />
              </div>
            }
          />
          <CardBody className="pt-0 space-y-2">
            {lista.map((c, i) => (
              <CorretorLinha
                key={c.id}
                c={c}
                rank={i + 1}
                onClick={() => setSelecionadoId(c.id)}
              />
            ))}
          </CardBody>
        </Card>
      </PageContent>

      <CorretorDrawer
        corretorId={selecionadoId}
        onClose={() => setSelecionadoId(null)}
      />

      <Dialog
        open={politicasOpen}
        onClose={() => setPoliticasOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-600" />
            <span>Políticas de alocação</span>
          </div>
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPoliticasOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" leftIcon={<Zap className="h-3.5 w-3.5" />} onClick={salvarPoliticas}>
              Salvar políticas
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <div className="text-[12px] font-semibold text-slate-900 mb-2">Modo de distribuição</div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "round-robin", label: "Round-robin", desc: "Distribuição igualitária" },
                { id: "health", label: "Health-based", desc: "Prioriza health alto" },
                { id: "especialidade", label: "Por especialidade", desc: "Match por perfil" },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPoliticas((p) => ({ ...p, modo: m.id }))}
                  className={cn(
                    "text-left rounded-[10px] border p-2.5 transition",
                    politicas.modo === m.id
                      ? "border-brand-500 bg-brand-50 shadow-soft"
                      : "border-slate-200 hover:border-brand-300"
                  )}
                >
                  <div className="text-[12px] font-semibold text-slate-900">{m.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Máx. leads por corretor
              </span>
              <Input
                type="number"
                value={politicas.maxLeads}
                onChange={(e) =>
                  setPoliticas((p) => ({ ...p, maxLeads: Number(e.target.value) }))
                }
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Pausar se health abaixo de
              </span>
              <Input
                type="number"
                value={politicas.pausarHealthAbaixoDe}
                onChange={(e) =>
                  setPoliticas((p) => ({
                    ...p,
                    pausarHealthAbaixoDe: Number(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                SLA 1º contato (min)
              </span>
              <Input
                type="number"
                value={politicas.slaPrimeiroContato}
                onChange={(e) =>
                  setPoliticas((p) => ({
                    ...p,
                    slaPrimeiroContato: Number(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                SLA resposta (min)
              </span>
              <Input
                type="number"
                value={politicas.slaResposta}
                onChange={(e) =>
                  setPoliticas((p) => ({
                    ...p,
                    slaResposta: Number(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </label>
            <label className="block col-span-2">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Escalar lead sem resposta após (horas)
              </span>
              <Input
                type="number"
                value={politicas.escalarApos}
                onChange={(e) =>
                  setPoliticas((p) => ({ ...p, escalarApos: Number(e.target.value) }))
                }
                className="mt-1"
              />
            </label>
          </div>

          <div className="rounded-[10px] bg-slate-50 border border-slate-200 p-3">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 mb-1">
              <Clock className="h-3.5 w-3.5 text-brand-500" /> Como funciona
            </div>
            <div className="text-[11px] text-slate-600 leading-relaxed">
              Leads novos são distribuídos conforme o modo selecionado, respeitando o limite
              máximo e pausando corretores com health baixo. SLAs violados disparam alertas e
              escalam para o gestor após o tempo configurado.
            </div>
          </div>
        </div>
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

function KPITime({
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
  tone: "brand" | "emerald" | "amber" | "rose" | "violet";
}) {
  const toneMap = {
    brand: "from-brand-500 to-brand-600",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-rose-600",
    violet: "from-violet-500 to-fuchsia-500",
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

function CorretorLinha({
  c,
  rank,
  onClick,
}: {
  c: Corretor;
  rank: number;
  onClick: () => void;
}) {
  const pctBacklog =
    c.leads_ativos > 0 ? c.leads_parados / c.leads_ativos : 0;
  const alerta = c.health_score < 60 || pctBacklog >= 0.35;

  const healthTone =
    c.health_score >= 85 ? "emerald" : c.health_score >= 60 ? "amber" : "rose";

  const pctSaud = (c.leads_saudaveis / c.max_leads_ativos) * 100;
  const pctParad = (c.leads_parados / c.max_leads_ativos) * 100;

  const nivelColor = {
    Platina: "violet",
    Ouro: "amber",
    Prata: "slate",
    Bronze: "rose",
  } as const;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-[12px] border p-3.5 transition-all grid grid-cols-[auto_auto_1fr_auto] gap-4 items-center",
        alerta
          ? "border-rose-200 bg-rose-50/30 hover:bg-rose-50/60"
          : "border-slate-200 bg-white hover:border-brand-300 hover:shadow-soft"
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          "h-8 w-8 rounded-full font-bold text-sm inline-flex items-center justify-center shrink-0",
          rank === 1
            ? "bg-amber-500 text-white"
            : rank === 2
            ? "bg-slate-400 text-white"
            : rank === 3
            ? "bg-orange-600 text-white"
            : "bg-slate-100 text-slate-600"
        )}
      >
        {rank}
      </div>

      {/* Avatar + nome */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={c.nome} size="md" />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-slate-900">
              {c.nome}
            </span>
            <Badge tone={nivelColor[c.nivel]} className="text-[9px] h-4">
              {c.nivel}
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500 capitalize tabular">
            {c.especialidade} • {c.tempo_medio_resposta}min resp • Conv{" "}
            {pct(c.taxa_conversao)}
          </div>
        </div>
      </div>

      {/* Health + barras */}
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1.5">
            <HeartPulse
              className={cn(
                "h-3.5 w-3.5",
                healthTone === "emerald"
                  ? "text-emerald-600"
                  : healthTone === "amber"
                  ? "text-amber-600"
                  : "text-rose-600"
              )}
            />
            <span
              className={cn(
                "text-[12px] font-bold tabular",
                healthTone === "emerald"
                  ? "text-emerald-700"
                  : healthTone === "amber"
                  ? "text-amber-700"
                  : "text-rose-700"
              )}
            >
              Health {c.health_score}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 tabular">
            {c.leads_saudaveis}
            <span className="text-emerald-600">✓</span> +{" "}
            {c.leads_parados}
            <span className="text-rose-600">!</span>
          </span>
          {alerta && (
            <Badge tone="rose" className="text-[9px] h-4">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              Atenção
            </Badge>
          )}
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${pctSaud}%` }}
          />
          <div
            className="h-full bg-rose-500"
            style={{ width: `${pctParad}%` }}
          />
        </div>
      </div>

      {/* Receita + meta */}
      <div className="text-right shrink-0 tabular">
        <div className="text-[14px] font-bold text-slate-900">
          {money(c.receita_mes)}
        </div>
        <div className="text-[11px] text-slate-500">
          {pct(c.receita_mes / c.meta_mensal)} da meta
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────── DRAWER ─────────────────────────── */

function CorretorDrawer({
  corretorId,
  onClose,
}: {
  corretorId: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const c = corretorId ? corretores.find((x) => x.id === corretorId) : null;
  if (!c) return null;

  const pctBacklog =
    c.leads_ativos > 0 ? c.leads_parados / c.leads_ativos : 0;
  const alerta = c.health_score < 60 || pctBacklog >= 0.35;

  const meusLeads = leadsByCorretor(c.id);
  const leadsPrparados = leadsParadosPorCorretor[c.id] ?? [];

  // Série fake de performance (7 dias)
  const serie = Array.from({ length: 7 }).map((_, i) => ({
    dia: `D-${6 - i}`,
    conversao: Math.max(
      0,
      Math.round((c.taxa_conversao + (Math.sin(i) * 0.03)) * 100)
    ),
    leads: Math.max(1, Math.round(2 + Math.cos(i) * 2)),
  }));

  return (
    <Dialog
      open={!!corretorId}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <Avatar name={c.nome} size="sm" />
          <span>{c.nome}</span>
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
          >
            {c.nivel}
          </Badge>
        </div>
      }
      size="xl"
    >
      <div className="space-y-5">
        {/* Alerta no topo se houver problema */}
        {alerta && (
          <div className="rounded-[12px] bg-rose-50 border border-rose-200 p-3.5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-rose-900">
                  Corretor com baixa vazão
                </div>
                <div className="text-[12px] text-rose-800 mt-0.5 leading-relaxed">
                  Health {c.health_score}/100, {c.leads_parados} leads parados.
                  Fluxo de novos leads automaticamente reduzido até recuperar.
                </div>
              </div>
              <Button
                size="sm"
                variant="danger"
                leftIcon={<LifeBuoy className="h-3.5 w-3.5" />}
                onClick={() => {
                  onClose();
                  navigate(`/router?desafogar=${c.id}`);
                }}
              >
                Desafogar {c.leads_parados}
              </Button>
            </div>
          </div>
        )}

        {/* Stats principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatBox
            label="Receita / Meta"
            value={money(c.receita_mes)}
            sub={`${pct(c.receita_mes / c.meta_mensal)} da meta`}
            tone="brand"
          />
          <StatBox
            label="Conversão"
            value={pct(c.taxa_conversao)}
            sub={`${c.tempo_medio_fechamento}d ciclo médio`}
            tone="emerald"
          />
          <StatBox
            label="Health score"
            value={`${c.health_score}`}
            sub={`Resposta 24h ${pct(c.taxa_resposta_24h)}`}
            tone={
              c.health_score >= 85 ? "emerald" : c.health_score >= 60 ? "amber" : "rose"
            }
          />
          <StatBox
            label="NPS"
            value={c.nps.toFixed(1)}
            sub={`Renovação ${pct(c.taxa_renovacao)}`}
            tone="violet"
          />
        </div>

        {/* Gráfico conversão 7d */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[13px] font-bold text-slate-900 inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-500" />
              Conversão — últimos 7 dias
            </h4>
            <Badge tone="brand" dot>
              Modelo estimado
            </Badge>
          </div>
          <div className="h-[140px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B6BCB" stopOpacity={0.22} />
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
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => `${v}%`}
                />
                <Area
                  type="monotone"
                  dataKey="conversao"
                  stroke="#0B6BCB"
                  strokeWidth={2}
                  fill="url(#cg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacidade detalhada */}
        <div>
          <h4 className="text-[13px] font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-500" />
            Carga atual
          </h4>
          <div className="rounded-[12px] border border-slate-200 p-3.5">
            <div className="flex items-center justify-between text-[12px] mb-2">
              <span className="text-slate-600">
                <strong className="tabular text-slate-900">
                  {c.leads_ativos}
                </strong>{" "}
                de {c.max_leads_ativos} leads
              </span>
              <span className="text-slate-500 tabular">
                Capacidade efetiva:{" "}
                <strong className="text-slate-900">
                  {Math.round((c.leads_saudaveis / c.max_leads_ativos) * 100)}%
                </strong>
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${(c.leads_saudaveis / c.max_leads_ativos) * 100}%`,
                }}
              />
              <div
                className="h-full bg-rose-500 transition-all"
                style={{
                  width: `${(c.leads_parados / c.max_leads_ativos) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <strong className="tabular text-slate-900">
                  {c.leads_saudaveis}
                </strong>{" "}
                saudáveis
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <strong className="tabular text-slate-900">
                  {c.leads_parados}
                </strong>{" "}
                parados ({Math.round(pctBacklog * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Leads parados (se houver) */}
        {leadsPrparados.length > 0 && (
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-500" />
              Leads parados ({leadsPrparados.length})
            </h4>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {leadsPrparados.map((p) => (
                <div
                  key={p.lead_id}
                  className="rounded-[10px] border border-rose-100 bg-rose-50/30 p-2.5 flex items-center gap-2"
                >
                  <Flame className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <div className="flex-1 min-w-0 text-[11px]">
                    <div className="text-slate-700">{p.motivo_stall}</div>
                    <div className="text-slate-500 tabular">
                      há {p.dias_sem_resposta} dias
                    </div>
                  </div>
                  <Badge
                    tone={
                      p.risco === "alto"
                        ? "rose"
                        : p.risco === "medio"
                        ? "amber"
                        : "slate"
                    }
                    className="text-[9px] h-4"
                  >
                    {p.risco}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {c.badges.length > 0 && (
          <div>
            <h4 className="text-[13px] font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Conquistas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {c.badges.map((b) => (
                <Badge key={b} tone="amber" className="text-[11px]">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {b}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            Turno: {c.turno_inicio}–{c.turno_fim}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MessageCircle className="h-3.5 w-3.5" />}
              onClick={() => {
                onClose();
                navigate(`/whatsapp?corretor=${c.id}`);
              }}
            >
              Ver conversas
            </Button>
            <Button
              size="sm"
              rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
              onClick={() => {
                onClose();
                navigate(`/pipeline?corretor=${c.id}`);
              }}
            >
              Pipeline do corretor
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function StatBox({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "brand" | "emerald" | "amber" | "rose" | "violet";
}) {
  const toneMap = {
    brand: "bg-brand-50 border-brand-200 text-brand-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    rose: "bg-rose-50 border-rose-200 text-rose-900",
    violet: "bg-violet-50 border-violet-200 text-violet-900",
  };
  return (
    <div className={cn("rounded-[12px] border p-3", toneMap[tone])}>
      <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
        {label}
      </div>
      <div className="text-[18px] font-bold tabular mt-0.5">{value}</div>
      <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>
    </div>
  );
}
