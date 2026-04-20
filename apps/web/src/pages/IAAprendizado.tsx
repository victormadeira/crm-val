import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Brain,
  Check,
  Filter,
  Flame,
  Lightbulb,
  Medal,
  Play,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/cn";
import { money, pct, relativeTime } from "@/lib/format";
import {
  antipadroes,
  conversasWA,
  corretorById,
  leadById,
  padroesVencedores,
} from "@/lib/mock";

export function IAAprendizado() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"todos" | "preco" | "familia" | "grupo" | "tempo_resposta">(
    "todos"
  );
  const [reanalisando, setReanalisando] = useState(false);
  const [treinamento, setTreinamento] = useState<Set<string>>(new Set());

  const padroesFiltrados = useMemo(() => {
    if (filter === "todos") return padroesVencedores;
    return padroesVencedores.filter((p) => p.tags.includes(filter));
  }, [filter]);

  const ganhas = conversasWA.filter(
    (c) => c.outcome?.tipo === "ganha"
  );
  const perdidas = conversasWA.filter(
    (c) => c.outcome?.tipo === "perdida"
  );

  const totalFechado = ganhas.reduce(
    (acc, c) => acc + (c.outcome?.valor ?? 0),
    0
  );

  const taxa =
    (ganhas.length / (ganhas.length + perdidas.length)) * 100;

  return (
    <>
      <PageHeader
        title="IA Aprendizado"
        subtitle="O que o time fez de certo (e errado) — analisado automaticamente"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                const rows = [
                  ["Padrão", "Uplift %", "Aplicado em", "Ganhou em", "Descoberto em"],
                  ...padroesVencedores.map((p) => [
                    p.titulo,
                    String(p.uplift_pct),
                    String(p.aplicado_em),
                    String(p.ganhou_em),
                    p.descoberto_em,
                  ]),
                ];
                const csv = rows
                  .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `ia-aprendizado.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Exportar relatório
            </Button>
            <Button
              leftIcon={<Brain className="h-4 w-4" />}
              loading={reanalisando}
              onClick={() => {
                setReanalisando(true);
                setTimeout(() => setReanalisando(false), 1600);
              }}
            >
              {reanalisando ? "Re-analisando…" : "Re-analisar tudo"}
            </Button>
          </>
        }
      />
      <PageContent className="space-y-6">
        {/* Hero metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Brain className="h-4 w-4" />}
            tone="violet"
            label="Conversas analisadas"
            value={(ganhas.length + perdidas.length).toString()}
            sub="últimos 30 dias"
          />
          <MetricCard
            icon={<Lightbulb className="h-4 w-4" />}
            tone="brand"
            label="Padrões descobertos"
            value={padroesVencedores.length.toString()}
            sub="aplicados pelo time"
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            tone="emerald"
            label="Uplift médio"
            value={`+${Math.round(
              padroesVencedores.reduce((a, p) => a + p.uplift_pct, 0) /
                padroesVencedores.length
            )}%`}
            sub="vs baseline do time"
          />
          <MetricCard
            icon={<Trophy className="h-4 w-4" />}
            tone="amber"
            label="Taxa de fechamento"
            value={`${taxa.toFixed(0)}%`}
            sub={`${money(totalFechado)} fechados`}
          />
        </div>

        {/* Padrões vencedores */}
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" />
                Padrões vencedores descobertos pela IA
              </span>
            }
            subtitle="Frases e estratégias que levaram ao fechamento — rankeadas por uplift"
            action={
              <div className="flex items-center gap-1">
                {(
                  [
                    ["todos", "Todos"],
                    ["preco", "Preço"],
                    ["familia", "Família"],
                    ["grupo", "Grupo"],
                    ["tempo_resposta", "Tempo"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={cn(
                      "h-7 px-2.5 rounded-[8px] text-[11px] font-semibold transition",
                      filter === k
                        ? "bg-brand-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {padroesFiltrados.map((p, idx) => {
                const conversao = (p.ganhou_em / p.aplicado_em) * 100;
                return (
                  <div
                    key={p.id}
                    className="rounded-[12px] border border-slate-200 p-4 hover:border-brand-300 hover:shadow-soft transition bg-gradient-to-br from-white to-brand-50/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-[10px] inline-flex items-center justify-center text-white shrink-0",
                            idx === 0
                              ? "bg-gradient-to-br from-amber-500 to-orange-500"
                              : idx === 1
                              ? "bg-gradient-to-br from-slate-400 to-slate-500"
                              : "bg-gradient-to-br from-brand-500 to-aqua-500"
                          )}
                        >
                          <Medal className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-semibold text-slate-900 leading-tight">
                            {p.titulo}
                          </h4>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Descoberto {relativeTime(p.descoberto_em)} atrás
                            {p.corretor_origem &&
                              ` • por ${p.corretor_origem}`}
                          </div>
                        </div>
                      </div>
                      <Badge
                        tone="emerald"
                        className="text-[11px] font-bold tabular"
                      >
                        +{p.uplift_pct}%
                      </Badge>
                    </div>

                    <p className="text-[12px] text-slate-700 mt-3 leading-relaxed">
                      {p.descricao}
                    </p>

                    <div className="mt-3 rounded-[8px] bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                        Exemplo
                      </div>
                      <p className="text-[12px] text-slate-800 italic mt-0.5">
                        "{p.exemplo_frase}"
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span>
                        Aplicado em{" "}
                        <strong className="text-slate-900 tabular">
                          {p.aplicado_em}
                        </strong>{" "}
                        conversas
                      </span>
                      <span>
                        Conversão{" "}
                        <strong
                          className={cn(
                            "tabular",
                            conversao >= 50
                              ? "text-emerald-600"
                              : "text-slate-900"
                          )}
                        >
                          {conversao.toFixed(0)}%
                        </strong>
                      </span>
                    </div>
                    <Progress
                      value={conversao}
                      tone="emerald"
                      size="xs"
                      className="mt-1.5"
                    />

                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      {p.tags.map((t) => (
                        <Badge key={t} tone="slate" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Duas colunas: Vitórias recentes + Antipadrões */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          {/* Vitórias recentes */}
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Vitórias recentes
                </span>
              }
              subtitle="Análise automática de cada venda fechada"
            />
            <CardBody className="space-y-3">
              {ganhas.map((c) => {
                const lead = leadById(c.lead_id);
                const corr = corretorById(c.corretor_id);
                return (
                  <div
                    key={c.id}
                    className="rounded-[12px] border border-emerald-200 bg-emerald-50/40 p-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar name={lead?.nome ?? "?"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-slate-900 truncate">
                              {lead?.nome}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Fechada por {corr?.nome.split(" ")[0]} •{" "}
                              {relativeTime(c.outcome!.encerrada_em)} atrás
                            </div>
                          </div>
                          <Badge
                            tone="emerald"
                            className="text-[11px] font-bold tabular shrink-0"
                          >
                            {money(c.outcome!.valor ?? 0)}
                          </Badge>
                        </div>

                        <p className="text-[12px] text-slate-700 mt-2 leading-relaxed">
                          {c.outcome!.resumo_ia}
                        </p>

                        {c.outcome!.padroes_identificados && (
                          <ul className="mt-2 space-y-1">
                            {c.outcome!.padroes_identificados.map((p) => (
                              <li
                                key={p}
                                className="text-[11.5px] text-emerald-900 inline-flex items-start gap-1.5 w-full"
                              >
                                <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Play className="h-3 w-3" />}
                            onClick={() => navigate(`/whatsapp?lead=${c.lead_id}`)}
                          >
                            Ver replay
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={
                              treinamento.has(c.id) ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )
                            }
                            onClick={() =>
                              setTreinamento((prev) => {
                                const next = new Set(prev);
                                if (next.has(c.id)) next.delete(c.id);
                                else next.add(c.id);
                                return next;
                              })
                            }
                          >
                            {treinamento.has(c.id)
                              ? "No treinamento"
                              : "Usar no treinamento"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {ganhas.length === 0 && (
                <div className="text-center text-sm text-slate-400 py-8">
                  Nenhuma venda fechada analisada ainda
                </div>
              )}
            </CardBody>
          </Card>

          {/* Antipadrões */}
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                  Antipadrões — o que evitar
                </span>
              }
              subtitle="Comportamentos que estão custando vendas"
            />
            <CardBody className="space-y-3">
              {antipadroes.map((a) => (
                <div
                  key={a.id}
                  className="rounded-[12px] border border-rose-200 bg-rose-50/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <h4 className="text-[13px] font-semibold text-slate-900 leading-tight">
                        {a.titulo}
                      </h4>
                    </div>
                    <Badge tone="rose" className="text-[10px] shrink-0">
                      −{a.perdeu_em} perdas
                    </Badge>
                  </div>
                  <p className="text-[12px] text-slate-700 mt-2 leading-relaxed">
                    {a.descricao}
                  </p>
                  <div className="mt-2 rounded-[8px] bg-white border border-emerald-200 px-2.5 py-1.5 text-[11.5px] text-emerald-900 inline-flex items-start gap-1.5 w-full">
                    <Lightbulb className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Solução:</strong> {a.solucao}
                    </span>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Rodapé — como a IA aprende */}
        <Card className="bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 border-slate-900 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-aqua-500 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand-500 blur-3xl" />
          </div>
          <CardBody className="relative pt-8 pb-8">
            <div className="flex items-start gap-4 max-w-3xl">
              <div className="h-12 w-12 rounded-[12px] bg-white/10 backdrop-blur-sm inline-flex items-center justify-center shrink-0 ring-1 ring-white/20">
                <Bot className="h-5 w-5 text-aqua-300" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold">
                  Como a IA aprende com o time
                </h3>
                <p className="text-[13px] text-slate-300 mt-1.5 leading-relaxed">
                  A cada conversa encerrada, a IA transcreve o áudio, analisa a
                  sequência de mensagens, identifica objeções superadas,
                  gatilhos que funcionaram e os momentos-chave da decisão.
                  Padrões que se repetem em 10+ vendas viram{" "}
                  <strong className="text-white">Padrão Vencedor</strong> — e
                  são oferecidos como sugestão automática para o time todo no
                  Copiloto durante conversas ativas.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-200 bg-white/5 border border-white/10 rounded-[8px] px-2.5 py-1">
                    <Zap className="h-3 w-3 text-aqua-300" />
                    Transcrição em tempo real
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-200 bg-white/5 border border-white/10 rounded-[8px] px-2.5 py-1">
                    <Target className="h-3 w-3 text-aqua-300" />
                    Detecção de objeções
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-200 bg-white/5 border border-white/10 rounded-[8px] px-2.5 py-1">
                    <Flame className="h-3 w-3 text-aqua-300" />
                    Score de temperatura ao vivo
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-200 bg-white/5 border border-white/10 rounded-[8px] px-2.5 py-1">
                    <Sparkles className="h-3 w-3 text-aqua-300" />
                    Sugestão de próxima ação
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </PageContent>
    </>
  );
}

function MetricCard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  tone: "brand" | "violet" | "emerald" | "amber";
  label: string;
  value: string;
  sub: string;
}) {
  const toneMap = {
    brand: "from-brand-500 to-brand-600 text-white",
    violet: "from-violet-500 to-fuchsia-500 text-white",
    emerald: "from-emerald-500 to-teal-500 text-white",
    amber: "from-amber-500 to-orange-500 text-white",
  };
  return (
    <Card>
      <CardBody className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-[10px] bg-gradient-to-br inline-flex items-center justify-center shadow-soft",
              toneMap[tone]
            )}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              {label}
            </div>
            <div className="text-[22px] font-bold text-slate-900 tabular mt-0.5 leading-tight">
              {value}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">{sub}</div>
      </CardBody>
    </Card>
  );
}
