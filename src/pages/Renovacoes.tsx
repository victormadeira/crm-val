import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarRange,
  Clock,
  Crown,
  Download,
  Filter,
  MessageCircle,
  Phone,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
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
import { cadencias, corretorById, passaportes } from "@/lib/mock";
import type { Passaporte } from "@/lib/types";

type Faixa = "7d" | "30d" | "60d" | "90d" | "todos";

const tipoLabel = {
  anual_individual: "Anual Individual",
  anual_familia: "Anual Família",
  vip: "VIP",
  diario: "Diário",
} as const;

export function Renovacoes() {
  const [faixa, setFaixa] = useState<Faixa>("30d");
  const [busca, setBusca] = useState("");
  const [abrirId, setAbrirId] = useState<string | null>(null);

  const ativos = passaportes.filter((p) => p.status === "ativo");

  const elegiveis = useMemo(() => {
    const limite =
      faixa === "7d" ? 7 : faixa === "30d" ? 30 : faixa === "60d" ? 60 : faixa === "90d" ? 90 : 9999;
    return ativos
      .filter((p) => (p.dias_restantes ?? 999) <= limite && p.tipo !== "diario")
      .filter((p) =>
        busca
          ? p.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
            p.qr_code.toLowerCase().includes(busca.toLowerCase())
          : true
      )
      .sort((a, b) => (a.dias_restantes ?? 0) - (b.dias_restantes ?? 0));
  }, [faixa, busca]);

  // KPIs
  const em7d = ativos.filter((p) => (p.dias_restantes ?? 999) <= 7).length;
  const em30d = ativos.filter((p) => (p.dias_restantes ?? 999) <= 30).length;
  const em60d = ativos.filter((p) => (p.dias_restantes ?? 999) <= 60).length;
  const em90d = ativos.filter((p) => (p.dias_restantes ?? 999) <= 90).length;

  const receitaEmRisco = ativos
    .filter((p) => (p.dias_restantes ?? 999) <= 30)
    .reduce((s, p) => s + p.valor_pago, 0);

  const cadenciaRenovacao = cadencias.find(
    (c) => c.gatilho === "pre_vencimento_30d"
  );

  return (
    <>
      <PageHeader
        title="Renovações"
        subtitle="Pipeline de passaportes em renovação • Receita recorrente"
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
              Exportar
            </Button>
            <Button leftIcon={<Zap className="h-4 w-4" />}>
              Iniciar cadência em lote
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* Hero — Receita em risco */}
        <Card className="bg-gradient-to-br from-rose-600 via-rose-700 to-orange-700 border-rose-700 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
          <CardBody className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-rose-200 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Receita em risco • próximos 30 dias
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-[34px] font-bold tabular">
                    {money(receitaEmRisco)}
                  </span>
                  <span className="text-sm text-rose-100">
                    em {em30d} passaportes vencendo
                  </span>
                </div>
                <p className="text-[13px] text-rose-50 mt-1 max-w-xl leading-relaxed">
                  Cadência de renovação 30d converte <strong>64%</strong> dos
                  casos — não deixe esse dinheiro escapar. Média de uplift:{" "}
                  <strong>+41%</strong> vs. abordagem manual.
                </p>
              </div>
              <Button
                variant="subtle"
                size="md"
                className="bg-white/15 text-white hover:bg-white/25 border border-white/15 shrink-0"
                leftIcon={<Zap className="h-4 w-4" />}
                rightIcon={<ArrowUpRight className="h-4 w-4" />}
              >
                Aplicar cadência nos {em30d}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPIFaixa
            dias={7}
            count={em7d}
            tone="rose"
            sub="Urgência máxima"
            icon={<Clock className="h-4 w-4" />}
          />
          <KPIFaixa
            dias={30}
            count={em30d}
            tone="amber"
            sub="Cadência ativa"
            icon={<CalendarRange className="h-4 w-4" />}
          />
          <KPIFaixa
            dias={60}
            count={em60d}
            tone="brand"
            sub="Preparando abordagem"
            icon={<Users className="h-4 w-4" />}
          />
          <KPIFaixa
            dias={90}
            count={em90d}
            tone="emerald"
            sub="Monitoramento"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        {/* Lista principal */}
        <Card>
          <CardHeader
            title="Passaportes a renovar"
            subtitle={`${elegiveis.length} passaportes na faixa selecionada`}
            action={
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Cliente ou QR…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-56"
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                />
                <Tabs
                  tabs={[
                    { id: "7d", label: "7d" },
                    { id: "30d", label: "30d" },
                    { id: "60d", label: "60d" },
                    { id: "90d", label: "90d" },
                    { id: "todos", label: "Todos" },
                  ]}
                  value={faixa}
                  onChange={(v) => setFaixa(v as Faixa)}
                />
              </div>
            }
          />
          <CardBody className="pt-0">
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="text-left px-6 py-2.5 font-semibold">
                      Cliente
                    </th>
                    <th className="text-left px-2 py-2.5 font-semibold">
                      Passaporte
                    </th>
                    <th className="text-left px-2 py-2.5 font-semibold">
                      Corretor
                    </th>
                    <th className="text-left px-2 py-2.5 font-semibold">
                      Engajamento
                    </th>
                    <th className="text-left px-2 py-2.5 font-semibold">
                      Valor
                    </th>
                    <th className="text-left px-2 py-2.5 font-semibold">
                      Vencimento
                    </th>
                    <th className="text-right px-6 py-2.5 font-semibold">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {elegiveis.map((p) => (
                    <LinhaRenovacao
                      key={p.id}
                      p={p}
                      onAbrir={() => setAbrirId(p.id)}
                    />
                  ))}
                  {elegiveis.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-slate-400 text-sm"
                      >
                        Nenhum passaporte nessa faixa
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Cadência de renovação em destaque */}
        {cadenciaRenovacao && (
          <Card className="border-brand-200 bg-brand-50/40">
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-[10px] bg-brand-600 text-white inline-flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-bold text-slate-900">
                      {cadenciaRenovacao.nome}
                    </h3>
                    <Badge tone="emerald" dot>
                      Ativa
                    </Badge>
                  </div>
                  <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">
                    {cadenciaRenovacao.descricao}
                  </p>
                  <div className="mt-3 flex items-center gap-5 text-[11px] text-slate-700">
                    <span>
                      Aplicados:{" "}
                      <strong className="tabular">
                        {cadenciaRenovacao.aplicados}
                      </strong>
                    </span>
                    <span>
                      Conversão:{" "}
                      <strong className="tabular text-emerald-700">
                        {pct(cadenciaRenovacao.conversao)}
                      </strong>
                    </span>
                    <span>
                      Uplift:{" "}
                      <strong className="tabular text-brand-700">
                        +{cadenciaRenovacao.uplift_pct}%
                      </strong>
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                >
                  Ver cadência
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </PageContent>

      <RenovarDialog
        passaporteId={abrirId}
        onClose={() => setAbrirId(null)}
      />
    </>
  );
}

function KPIFaixa({
  dias,
  count,
  sub,
  icon,
  tone,
}: {
  dias: number;
  count: number;
  sub: string;
  icon: React.ReactNode;
  tone: "rose" | "amber" | "brand" | "emerald";
}) {
  const toneMap = {
    rose: "from-rose-500 to-rose-600 text-white",
    amber: "from-amber-500 to-orange-500 text-white",
    brand: "from-brand-500 to-brand-600 text-white",
    emerald: "from-emerald-500 to-teal-500 text-white",
  };
  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-[10px] bg-gradient-to-br inline-flex items-center justify-center shadow-soft",
              toneMap[tone]
            )}
          >
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Próximos {dias} dias
            </div>
            <div className="text-[22px] font-bold text-slate-900 tabular leading-tight mt-0.5">
              {count}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">{sub}</div>
      </CardBody>
    </Card>
  );
}

function LinhaRenovacao({
  p,
  onAbrir,
}: {
  p: Passaporte;
  onAbrir: () => void;
}) {
  const corretor = corretorById(p.corretor_id);
  const visitas = p.visitas.length;
  const engajamento =
    visitas >= 5
      ? { label: "Super engajado", tone: "emerald" as const, pct: 95 }
      : visitas >= 3
      ? { label: "Engajado", tone: "brand" as const, pct: 72 }
      : visitas >= 1
      ? { label: "Casual", tone: "amber" as const, pct: 40 }
      : { label: "Nunca visitou", tone: "rose" as const, pct: 12 };

  const dias = p.dias_restantes ?? 0;
  const urgencia =
    dias <= 7 ? "rose" : dias <= 30 ? "amber" : dias <= 60 ? "brand" : "slate";

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="px-6 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={p.cliente_nome} size="sm" />
          <div>
            <div className="font-semibold text-slate-900">{p.cliente_nome}</div>
            <div className="text-[11px] text-slate-500 tabular">
              {p.renovacoes > 0
                ? `${p.renovacoes} renovação${p.renovacoes > 1 ? "ões" : ""}`
                : "Primeira renovação"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center gap-1.5">
          {p.tipo === "vip" && (
            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}
          <div>
            <div className="text-[12px] font-medium text-slate-800">
              {tipoLabel[p.tipo]}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {p.qr_code}
            </div>
          </div>
        </div>
      </td>
      <td className="px-2 py-3">
        {corretor ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={corretor.nome} size="xs" />
            <span className="text-[12px] text-slate-700 truncate max-w-[120px]">
              {corretor.nome.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        )}
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center gap-2">
          <Progress
            value={engajamento.pct}
            tone={engajamento.tone}
            size="sm"
            className="w-16"
          />
          <span className="text-[11px] text-slate-600 whitespace-nowrap">
            {engajamento.label} · {visitas}x
          </span>
        </div>
      </td>
      <td className="px-2 py-3 tabular font-semibold text-slate-900">
        {money(p.valor_pago)}
      </td>
      <td className="px-2 py-3">
        <Badge tone={urgencia}>
          {dias === 0
            ? "Hoje"
            : dias === 1
            ? "Amanhã"
            : `${dias} dias`}
        </Badge>
      </td>
      <td className="px-6 py-3 text-right">
        <Button size="sm" onClick={onAbrir}>
          Renovar
        </Button>
      </td>
    </tr>
  );
}

function RenovarDialog({
  passaporteId,
  onClose,
}: {
  passaporteId: string | null;
  onClose: () => void;
}) {
  const [passo, setPasso] = useState<"escolher" | "enviado">("escolher");
  const p = passaporteId
    ? passaportes.find((pp) => pp.id === passaporteId)
    : null;
  if (!p) return null;

  const corretor = corretorById(p.corretor_id);
  const descontoAntecipado = Math.round(p.valor_pago * 0.08);
  const valorUpgrade = Math.round(p.valor_pago * 1.35);

  const reset = () => {
    setPasso("escolher");
    onClose();
  };

  return (
    <Dialog
      open={!!passaporteId}
      onClose={reset}
      title={
        <span className="inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-brand-600" />
          Renovar {p.cliente_nome}
        </span>
      }
      size="lg"
    >
      {passo === "escolher" ? (
        <div className="space-y-4">
          <div className="rounded-[12px] bg-slate-50 border border-slate-200 p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-[10px] bg-brand-100 text-brand-700 inline-flex items-center justify-center shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-slate-900">
                {tipoLabel[p.tipo]} • {money(p.valor_pago)}
              </div>
              <div className="text-[11px] text-slate-500 tabular">
                {p.qr_code} • {p.visitas.length} visitas • vence em{" "}
                {p.dias_restantes} dias
              </div>
            </div>
            {corretor && (
              <div className="flex items-center gap-2 shrink-0">
                <Avatar name={corretor.nome} size="xs" />
                <span className="text-[11px] text-slate-600">
                  {corretor.nome.split(" ")[0]}
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Escolher abordagem
            </div>
            <div className="space-y-2">
              <OpcaoRenovacao
                titulo="Renovação simples"
                desc={`Mesmo plano, mesmo valor (${money(p.valor_pago)})`}
                badge="Padrão"
                onClick={() => setPasso("enviado")}
              />
              <OpcaoRenovacao
                titulo="Renovação antecipada — desconto"
                desc={`${money(
                  p.valor_pago - descontoAntecipado
                )} se fechar em até 7 dias (economia ${money(
                  descontoAntecipado
                )})`}
                badge="Recomendado"
                destaque
                onClick={() => setPasso("enviado")}
              />
              <OpcaoRenovacao
                titulo="Upgrade para VIP"
                desc={`${money(valorUpgrade)} — acesso prioritário + áreas exclusivas`}
                badge="Upsell"
                onClick={() => setPasso("enviado")}
              />
              <OpcaoRenovacao
                titulo="Aplicar cadência completa (IA)"
                desc="3 toques em 14 dias — WhatsApp → WhatsApp → Ligação. Conversão histórica: 64%"
                badge="Automação"
                onClick={() => setPasso("enviado")}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={reset}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 inline-flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Abordagem iniciada
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
            O primeiro toque foi enviado no WhatsApp. Próximos passos agendados.
            Acompanhe na aba Cadências.
          </p>
          <Button className="mt-5" onClick={reset}>
            Fechar
          </Button>
        </div>
      )}
    </Dialog>
  );
}

function OpcaoRenovacao({
  titulo,
  desc,
  badge,
  onClick,
  destaque,
}: {
  titulo: string;
  desc: string;
  badge: string;
  onClick: () => void;
  destaque?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-[12px] border p-3.5 transition-all",
        destaque
          ? "border-brand-400 bg-brand-50 hover:bg-brand-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-slate-900">
            {titulo}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            {desc}
          </div>
        </div>
        <Badge tone={destaque ? "brand" : "slate"} className="shrink-0">
          {badge}
        </Badge>
      </div>
    </button>
  );
}
