import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Lightbulb,
  Quote,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { number, pct, relativeTime } from "@/lib/format";
import { antipadroes, insights, padroesVencedores } from "@/lib/mock";
import type { PadraoVencedor } from "@/lib/types";

export function Insights() {
  const [aba, setAba] = useState<"padroes" | "antipadroes" | "insights">(
    "padroes"
  );
  const [busca, setBusca] = useState("");
  const [padraoSelecionado, setPadraoSelecionado] =
    useState<PadraoVencedor | null>(null);

  const padroesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return padroesVencedores
      .filter(
        (p) =>
          !termo ||
          p.titulo.toLowerCase().includes(termo) ||
          p.tags.some((t) => t.includes(termo))
      )
      .sort((a, b) => b.uplift_pct - a.uplift_pct);
  }, [busca]);

  const totalAplicacoes = padroesVencedores.reduce(
    (s, p) => s + p.aplicado_em,
    0
  );
  const totalGanhos = padroesVencedores.reduce((s, p) => s + p.ganhou_em, 0);
  const upliftMedio = Math.round(
    padroesVencedores.reduce((s, p) => s + p.uplift_pct, 0) /
      padroesVencedores.length
  );

  const scatterData = padroesVencedores.map((p) => ({
    x: p.aplicado_em,
    y: p.uplift_pct,
    z: p.ganhou_em,
    titulo: p.titulo,
  }));

  return (
    <>
      <PageHeader
        title="Insights Extractor"
        subtitle="Padrões aprendidos automaticamente pela IA a partir de fechamentos e perdidos"
        actions={
          <>
            <Input
              leftIcon={<Search className="h-4 w-4" />}
              placeholder="Buscar padrão..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
              Exportar
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* Hero */}
        <Card className="bg-gradient-to-br from-violet-600 via-indigo-600 to-brand-600 text-white border-0 overflow-hidden">
          <CardBody className="p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-[11px] bg-white/20 backdrop-blur inline-flex items-center justify-center">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider opacity-90 font-semibold">
                    IA aprendeu com {number(totalAplicacoes + 47)} conversas
                  </div>
                  <div className="text-[22px] font-bold leading-tight mt-0.5">
                    {padroesVencedores.length} padrões vencedores identificados
                  </div>
                  <div className="text-[13px] opacity-90 mt-1 max-w-2xl">
                    Descobertas automáticas do que funciona no time. Aplicar
                    esses padrões gerou{" "}
                    <strong>+{upliftMedio}%</strong> de conversão média vs
                    baseline.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <HeroStat label="Aplicações" valor={number(totalAplicacoes)} />
                <HeroStat
                  label="Sucesso"
                  valor={pct(totalGanhos / totalAplicacoes)}
                />
                <HeroStat label="Uplift médio" valor={`+${upliftMedio}%`} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Tabs
          tabs={[
            { id: "padroes", label: "Padrões vencedores", count: padroesVencedores.length },
            { id: "antipadroes", label: "Antipadrões", count: antipadroes.length },
            { id: "insights", label: "Insights brutos", count: insights.length },
          ]}
          value={aba}
          onChange={(v) => setAba(v as any)}
        />

        {aba === "padroes" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {padroesFiltrados.map((p) => (
                <PadraoCard
                  key={p.id}
                  p={p}
                  onOpen={() => setPadraoSelecionado(p)}
                />
              ))}
            </div>

            {/* Scatter impacto vs adoção */}
            <Card>
              <CardHeader
                title="Impacto × Adoção"
                subtitle="Padrões mais úteis estão no canto superior direito"
                action={
                  <Badge tone="violet">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Quadrante de ouro
                  </Badge>
                }
              />
              <CardBody className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 10 }}>
                      <CartesianGrid stroke="#f1f5f9" />
                      <XAxis
                        dataKey="x"
                        name="Aplicações"
                        label={{
                          value: "Quantas vezes foi aplicado",
                          position: "insideBottom",
                          offset: -15,
                          fontSize: 11,
                          fill: "#64748b",
                        }}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        dataKey="y"
                        name="Uplift %"
                        label={{
                          value: "Uplift (%)",
                          angle: -90,
                          position: "insideLeft",
                          fontSize: 11,
                          fill: "#64748b",
                        }}
                        tick={{ fontSize: 11 }}
                      />
                      <ZAxis dataKey="z" range={[60, 300]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                        formatter={(_v: any, _n: any, p: any) =>
                          [p?.payload?.titulo ?? ""]
                        }
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Scatter name="Padrões" data={scatterData} fill="#8b5cf6">
                        {scatterData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              scatterData[i].y >= 40
                                ? "#10b981"
                                : scatterData[i].y >= 25
                                ? "#6366f1"
                                : "#94a3b8"
                            }
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {aba === "antipadroes" && (
          <Card>
            <CardHeader
              title="Antipadrões — o que NÃO fazer"
              subtitle="IA detectou causas comuns de perda"
            />
            <CardBody className="pt-0 space-y-3">
              {antipadroes.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-[12px] border border-rose-200 bg-rose-50/50 flex items-start gap-3"
                >
                  <div className="h-9 w-9 rounded-[9px] bg-rose-100 text-rose-700 inline-flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-[14px]">
                        {a.titulo}
                      </span>
                      <Badge tone="rose" className="text-[10px]">
                        {a.perdeu_em} perdas
                      </Badge>
                    </div>
                    <div className="text-[12px] text-slate-700 mt-1">
                      {a.descricao}
                    </div>
                    <div className="mt-2 p-2 rounded-[8px] bg-white border border-emerald-200 text-[12px] flex items-start gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-emerald-700">
                          Solução:{" "}
                        </span>
                        <span className="text-slate-700">{a.solucao}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    Criar treinamento
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        {aba === "insights" && (
          <Card>
            <CardHeader
              title="Insights brutos (fechamentos e perdidos recentes)"
              subtitle={`${insights.length} conversas analisadas pela IA`}
            />
            <CardBody className="pt-0 space-y-3">
              {insights.map((i) => (
                <div
                  key={i.id}
                  className={cn(
                    "p-3 rounded-[12px] border-l-4 bg-white border-y border-r border-slate-200",
                    i.tipo === "fechado"
                      ? "border-l-emerald-500"
                      : "border-l-rose-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          tone={i.tipo === "fechado" ? "emerald" : "rose"}
                          className="text-[10px]"
                        >
                          {i.tipo === "fechado" ? (
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          ) : (
                            <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {i.tipo === "fechado" ? "Fechado" : "Perdido"}
                        </Badge>
                        <span className="font-semibold text-slate-900 text-[13px]">
                          {i.corretor}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          • {i.tipo_passaporte} • ciclo {i.ciclo_dias}d
                        </span>
                        <span className="ml-auto text-[11px] text-slate-400">
                          há {relativeTime(i.created_at)}
                        </span>
                      </div>
                      <div className="text-[13px] text-slate-700 mt-1">
                        <strong>Gatilho:</strong> {i.gatilho}
                      </div>
                      <div className="text-[12px] text-slate-600 mt-1 italic">
                        {i.resumo}
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {i.argumentos_funcionaram.length > 0 && (
                          <div className="p-2 rounded-[8px] bg-emerald-50 border border-emerald-200">
                            <div className="text-[10px] uppercase font-semibold text-emerald-700">
                              Funcionaram
                            </div>
                            <ul className="text-[11px] text-slate-700 mt-1 space-y-0.5">
                              {i.argumentos_funcionaram.map((a, x) => (
                                <li key={x}>• {a}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {i.objecoes_apareceram.length > 0 && (
                          <div className="p-2 rounded-[8px] bg-amber-50 border border-amber-200">
                            <div className="text-[10px] uppercase font-semibold text-amber-700">
                              Objeções
                            </div>
                            <ul className="text-[11px] text-slate-700 mt-1 space-y-0.5">
                              {i.objecoes_apareceram.map((o, x) => (
                                <li key={x}>• {o}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-1 mt-2">
                        {i.tecnicas_usadas.map((t) => (
                          <Badge key={t} tone="violet" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </PageContent>

      {padraoSelecionado && (
        <PadraoDetalhe
          p={padraoSelecionado}
          onClose={() => setPadraoSelecionado(null)}
        />
      )}
    </>
  );
}

function HeroStat({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-[10px] p-2.5 text-center min-w-[90px]">
      <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">
        {label}
      </div>
      <div className="text-[18px] font-bold tabular leading-none mt-1">
        {valor}
      </div>
    </div>
  );
}

function PadraoCard({
  p,
  onOpen,
}: {
  p: PadraoVencedor;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="text-left p-4 rounded-[14px] border border-slate-200 bg-white hover:border-violet-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-[15px]">
              {p.titulo}
            </span>
          </div>
          <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">
            {p.descricao}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">
            Uplift
          </div>
          <div
            className={cn(
              "text-[26px] font-bold tabular leading-none",
              p.uplift_pct >= 40
                ? "text-emerald-700"
                : p.uplift_pct >= 25
                ? "text-violet-700"
                : "text-slate-700"
            )}
          >
            +{p.uplift_pct}%
          </div>
        </div>
      </div>

      <div className="mt-3 p-2.5 rounded-[10px] bg-violet-50 border border-violet-200 flex items-start gap-2">
        <Quote className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
        <span className="text-[12px] italic text-slate-700 leading-relaxed">
          {p.exemplo_frase}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px]">
        <div className="flex items-center gap-3 text-slate-500">
          <span>
            Aplicado{" "}
            <strong className="tabular text-slate-800">{p.aplicado_em}×</strong>
          </span>
          <span>
            Ganhou{" "}
            <strong className="tabular text-slate-800">
              {p.ganhou_em} ({pct(p.ganhou_em / p.aplicado_em)})
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-violet-600 font-medium">
          Ver detalhe <ChevronRight className="h-3 w-3" />
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-1 mt-2">
        {p.tags.map((t) => (
          <Badge key={t} tone="slate" className="text-[10px]">
            {t}
          </Badge>
        ))}
      </div>
    </button>
  );
}

function PadraoDetalhe({
  p,
  onClose,
}: {
  p: PadraoVencedor;
  onClose: () => void;
}) {
  return (
    <Dialog open onClose={onClose} title={p.titulo} size="lg">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <DetalheStat label="Uplift" valor={`+${p.uplift_pct}%`} tone="emerald" />
          <DetalheStat label="Aplicações" valor={String(p.aplicado_em)} tone="brand" />
          <DetalheStat
            label="Sucesso"
            valor={pct(p.ganhou_em / p.aplicado_em)}
            tone="violet"
          />
          <DetalheStat
            label="Descoberto"
            valor={`há ${relativeTime(p.descoberto_em)}`}
            tone="amber"
          />
        </div>

        <div>
          <div className="text-[11px] uppercase font-semibold text-slate-500 mb-1">
            Descrição
          </div>
          <p className="text-[13px] text-slate-700 leading-relaxed">
            {p.descricao}
          </p>
        </div>

        <div>
          <div className="text-[11px] uppercase font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
            <Quote className="h-3 w-3" />
            Exemplo de frase
          </div>
          <div className="p-3 rounded-[10px] bg-violet-50 border border-violet-200 italic text-[14px] text-slate-800">
            "{p.exemplo_frase}"
          </div>
        </div>

        {p.corretor_origem && (
          <div className="text-[12px] text-slate-600 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Descoberto a partir do trabalho de{" "}
            <strong>{p.corretor_origem}</strong>
          </div>
        )}

        <div className="flex items-center flex-wrap gap-1">
          {p.tags.map((t) => (
            <Badge key={t} tone="slate">
              {t}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
            Criar template
          </Button>
          <Button leftIcon={<Zap className="h-4 w-4" />}>
            Treinar time
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function DetalheStat({
  label,
  valor,
  tone,
}: {
  label: string;
  valor: string;
  tone: "emerald" | "brand" | "violet" | "amber";
}) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    brand: "bg-brand-50 text-brand-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className={cn("p-3 rounded-[10px]", toneMap[tone])}>
      <div className="text-[10px] uppercase font-semibold opacity-70">
        {label}
      </div>
      <div className="text-[18px] font-bold tabular leading-tight">{valor}</div>
    </div>
  );
}
