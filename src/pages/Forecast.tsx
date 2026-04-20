import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, ArrowDownRight, ArrowUpRight, CheckCircle2, Target, TrendingUp, Zap } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { money, pct } from "@/lib/format";
import { forecastCenarios, forecastEtapas } from "@/lib/mock";

const etapaLabel: Record<string, string> = {
  novo: "Novo",
  qualificado: "Qualificado",
  em_atendimento: "Atendimento",
  proposta: "Proposta",
  fechado: "Fechado",
};

export function Forecast() {
  const navigate = useNavigate();
  const [cenario, setCenario] = useState<"pessimista" | "base" | "otimista">("base");
  const [recalculando, setRecalculando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const ativo = forecastCenarios.find((c) => c.nome === cenario)!;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const recalcular = () => {
    setRecalculando(true);
    window.setTimeout(() => {
      setRecalculando(false);
      showToast("Forecast recalculado — confiança 84%");
    }, 900);
  };

  const chartData = forecastEtapas.map((e) => ({
    etapa: etapaLabel[e.etapa] ?? e.etapa,
    valor: e.valor_total,
    forecast: e.forecast,
    prob: Math.round(e.prob_ponderada * 100),
  }));

  return (
    <>
      <PageHeader
        title="Forecast de receita"
        subtitle="Projeção ponderada por probabilidade de fechamento. Cenários pessimista/base/otimista."
        actions={
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Zap className={cn("h-3.5 w-3.5", recalculando && "animate-pulse")} />}
            onClick={recalcular}
            disabled={recalculando}
          >
            {recalculando ? "Recalculando…" : "Recalcular com IA"}
          </Button>
        }
      />
      <PageContent>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {forecastCenarios.map((c) => {
            const isAtivo = cenario === c.nome;
            const positiva = c.atingimento_pct >= 90;
            return (
              <Card
                key={c.id}
                onClick={() => setCenario(c.nome)}
                className={cn(
                  "cursor-pointer transition",
                  isAtivo ? "ring-2 ring-brand-500 shadow-pop" : "hover:shadow-pop"
                )}
              >
                <CardBody>
                  <div className="flex items-center justify-between mb-3">
                    <Badge tone={c.nome === "otimista" ? "emerald" : c.nome === "base" ? "brand" : "rose"} className="capitalize">
                      {c.nome}
                    </Badge>
                    {isAtivo && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase">Melhor caso</div>
                  <div className="text-[24px] font-semibold tabular text-slate-900">{money(c.melhor_caso)}</div>
                  <div className="mt-3 flex items-center gap-2 text-[12px]">
                    <span className="text-slate-500">Atingimento</span>
                    <span className={cn("font-semibold tabular", positiva ? "text-emerald-600" : c.atingimento_pct >= 60 ? "text-amber-600" : "text-rose-600")}>
                      {c.atingimento_pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", positiva ? "bg-emerald-500" : c.atingimento_pct >= 60 ? "bg-amber-500" : "bg-rose-500")}
                      style={{ width: `${Math.min(100, c.atingimento_pct)}%` }}
                    />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Fechado (seguro)</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{money(ativo.fechado)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Comprometido</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{money(ativo.comprometido)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-[10px] inline-flex items-center justify-center", ativo.gap >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                {ativo.gap >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Gap vs. meta</div>
                <div className={cn("text-[20px] font-semibold tabular", ativo.gap >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {money(ativo.gap)}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2">
            <CardHeader
              title="Pipeline ponderado por etapa"
              subtitle="Multiplicador de probabilidade por etapa × valor total do funil"
            />
            <CardBody>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="etapa" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number) => money(v)}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Bar dataKey="valor" fill="#cbd5e1" name="Valor total" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="forecast" name="Forecast ponderado" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={["#fbbf24", "#60a5fa", "#0ea5e9", "#059669", "#047857"][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Detalhamento do funil" />
            <CardBody>
              <div className="space-y-2">
                {forecastEtapas.map((e) => (
                  <div key={e.etapa} className="p-2.5 rounded-[10px] border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-[12px] text-slate-900">{etapaLabel[e.etapa]}</div>
                      <Badge tone="slate" className="text-[10px] tabular">{pct(e.prob_ponderada)}</Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{e.leads} leads · {money(e.valor_total)}</span>
                      <span className="font-semibold text-emerald-600">{money(e.forecast)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-[10px] bg-slate-50 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Insight IA
                </div>
                Cenário base projeta <b>{money(ativo.melhor_caso)}</b>, mas gap de {money(Math.abs(ativo.gap))} exige
                acelerar propostas paradas &gt;5d para atingir meta.
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                leftIcon={<Target className="h-3.5 w-3.5" />}
                onClick={() => navigate("/propostas?status=enviada")}
              >
                Ver propostas críticas
              </Button>
            </CardBody>
          </Card>
        </div>
      </PageContent>

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
