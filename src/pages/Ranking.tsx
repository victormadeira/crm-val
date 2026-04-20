import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Crown,
  Flame,
  Medal,
  Minus,
  Sparkles,
  Trophy,
  Users2,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { corretores, heatmap, alertas } from "@/lib/mock";
import { money, pct } from "@/lib/format";
import { cn } from "@/lib/cn";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function DeltaIndicator({ delta }: { delta: number }) {
  if (delta === 0)
    return (
      <span className="inline-flex items-center text-[11px] text-slate-400">
        <Minus className="h-3 w-3" />
      </span>
    );
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular",
        up ? "text-emerald-600" : "text-rose-600"
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  );
}

export function Ranking() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<"hoje" | "semana" | "mes">("mes");
  const sorted = [...corretores].sort(
    (a, b) => b.score_composto - a.score_composto
  );
  const teamReceita = corretores.reduce((s, c) => s + c.receita_mes, 0);
  const teamMeta = corretores.reduce((s, c) => s + c.meta_mensal, 0);

  return (
    <>
      <PageHeader
        title="Ranking ao vivo"
        subtitle="Atualiza a cada 30s via WebSocket"
        actions={
          <>
            <Badge tone="emerald" dot>
              <span className="animate-pulse-soft">Ao vivo</span>
            </Badge>
            <Button
              variant={periodo === "hoje" ? "primary" : "outline"}
              onClick={() => setPeriodo("hoje")}
            >
              Hoje
            </Button>
            <Button
              variant={periodo === "semana" ? "primary" : "outline"}
              onClick={() => setPeriodo("semana")}
            >
              Semana
            </Button>
            <Button
              variant={periodo === "mes" ? "primary" : "outline"}
              onClick={() => setPeriodo("mes")}
            >
              Mês
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* Team bar */}
        <Card>
          <CardBody className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-[12px] text-slate-500">Receita do time</div>
                <div className="text-[22px] font-semibold text-slate-900 tabular mt-0.5">
                  {money(teamReceita)}
                </div>
                <Progress
                  className="mt-2"
                  value={(teamReceita / teamMeta) * 100}
                  tone="brand"
                />
                <div className="text-[11px] text-slate-500 mt-1 tabular">
                  {pct(teamReceita / teamMeta)} da meta {money(teamMeta)}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">
                  Tempo médio resposta (hoje)
                </div>
                <div className="text-[22px] font-semibold text-slate-900 tabular mt-0.5">
                  6min
                </div>
                <Badge tone="emerald" className="mt-2">
                  -32% vs. ontem
                </Badge>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Leads ativos</div>
                <div className="text-[22px] font-semibold text-slate-900 tabular mt-0.5">
                  {corretores.reduce((s, c) => s + c.leads_ativos, 0)}
                </div>
                <Badge tone="brand" className="mt-2">
                  {corretores.length} corretores
                </Badge>
              </div>
              <div>
                <div className="text-[12px] text-slate-500">Alertas ativos</div>
                <div className="text-[22px] font-semibold text-slate-900 tabular mt-0.5">
                  {alertas.length}
                </div>
                <Badge tone="rose" className="mt-2" dot>
                  1 SLA crítico
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader
            title="Placar de corretores"
            subtitle="Score composto • conversão × velocidade × renovação × NPS × retenção"
            action={
              <Badge tone="violet" dot>
                <Sparkles className="h-3 w-3" /> IA recalculando
              </Badge>
            }
          />
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="text-left font-semibold py-2.5 pl-5 w-12">
                    Pos
                  </th>
                  <th className="text-left font-semibold py-2.5">Corretor</th>
                  <th className="text-left font-semibold py-2.5">Score</th>
                  <th className="text-right font-semibold py-2.5">Receita</th>
                  <th className="text-right font-semibold py-2.5">Conv</th>
                  <th className="text-right font-semibold py-2.5">Resp</th>
                  <th className="text-right font-semibold py-2.5">NPS</th>
                  <th className="text-right font-semibold py-2.5">Ativos</th>
                  <th className="text-right font-semibold py-2.5 pr-5">
                    Meta
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/corretores?id=${c.id}`)}
                    className={cn(
                      "border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors cursor-pointer",
                      i < 3 && "bg-gradient-to-r from-amber-50/20 to-transparent"
                    )}
                  >
                    <td className="py-3 pl-5">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "h-7 w-7 rounded-lg inline-flex items-center justify-center font-bold tabular text-[13px]",
                            i === 0
                              ? "bg-amber-100 text-amber-800"
                              : i === 1
                              ? "bg-slate-200 text-slate-700"
                              : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-50 text-slate-500"
                          )}
                        >
                          {i + 1}
                        </span>
                        <DeltaIndicator delta={c.delta_posicao} />
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.nome} size="sm" />
                        <div>
                          <div className="font-semibold text-[13px] text-slate-900 flex items-center gap-1.5">
                            {c.nome}
                            {i === 0 && (
                              <Crown className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
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
                            <span className="text-[11px] text-slate-500 capitalize">
                              {c.especialidade}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <Progress
                            value={c.score_composto}
                            tone={
                              c.score_composto >= 85
                                ? "emerald"
                                : c.score_composto >= 70
                                ? "brand"
                                : "amber"
                            }
                            size="sm"
                          />
                        </div>
                        <span className="tabular font-semibold text-slate-900 text-[13px]">
                          {c.score_composto}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right tabular font-semibold text-slate-900">
                      {money(c.receita_mes)}
                    </td>
                    <td className="py-3 text-right tabular text-slate-700">
                      {pct(c.taxa_conversao)}
                    </td>
                    <td className="py-3 text-right tabular text-slate-700">
                      {c.tempo_medio_resposta}min
                    </td>
                    <td className="py-3 text-right tabular text-slate-700">
                      {c.nps.toFixed(1)}
                    </td>
                    <td className="py-3 text-right tabular text-slate-700">
                      <span
                        className={cn(
                          c.leads_ativos > c.max_leads_ativos * 0.8
                            ? "text-rose-600 font-semibold"
                            : ""
                        )}
                      >
                        {c.leads_ativos}/{c.max_leads_ativos}
                      </span>
                    </td>
                    <td className="py-3 pr-5 text-right tabular text-[13px]">
                      <span
                        className={cn(
                          "font-semibold",
                          c.receita_mes / c.meta_mensal >= 1
                            ? "text-emerald-600"
                            : c.receita_mes / c.meta_mensal >= 0.8
                            ? "text-brand-600"
                            : "text-slate-600"
                        )}
                      >
                        {pct(c.receita_mes / c.meta_mensal)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Heatmap + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
          <Card>
            <CardHeader
              title="Heatmap de atividade"
              subtitle="Horas de pico de resposta do time • últimos 7 dias"
            />
            <CardBody>
              <div className="flex">
                <div className="w-10 flex flex-col justify-between py-1 text-[10px] text-slate-400">
                  {days.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-0.5">
                    {heatmap.map((row, i) =>
                      row.map((v, j) => (
                        <div
                          key={`${i}-${j}`}
                          className="aspect-square rounded-[3px]"
                          style={{
                            backgroundColor:
                              v < 15
                                ? "#F1F5F9"
                                : v < 35
                                ? "#C7E0F4"
                                : v < 55
                                ? "#82BDFF"
                                : v < 75
                                ? "#1E7BE6"
                                : "#0B4783",
                          }}
                          title={`${days[i]} ${j}h: ${v} leads respondidos`}
                        />
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-0.5 mt-1 text-[9px] text-slate-400 tabular">
                    {Array.from({ length: 24 }).map((_, h) => (
                      <span key={h} className="text-center">
                        {h % 3 === 0 ? h : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-slate-500">
                <span>Menos</span>
                <div className="flex gap-0.5">
                  {["#F1F5F9", "#C7E0F4", "#82BDFF", "#1E7BE6", "#0B4783"].map(
                    (c) => (
                      <div
                        key={c}
                        className="h-3 w-3 rounded-[2px]"
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
                <span>Mais</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Feed de alertas"
              subtitle="Ações do supervisor"
              action={<Badge tone="rose" dot>{alertas.length}</Badge>}
            />
            <CardBody className="p-0">
              <ul>
                {alertas.map((a) => (
                  <li
                    key={a.id}
                    className="px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          "h-7 w-7 rounded-lg inline-flex items-center justify-center shrink-0",
                          a.severidade === "critical"
                            ? "bg-rose-100 text-rose-600"
                            : a.severidade === "warning"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-brand-100 text-brand-600"
                        )}
                      >
                        <Flame className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900">
                          {a.titulo}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {a.descricao}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[11px] px-2"
                            onClick={() => navigate("/alertas")}
                          >
                            Resolver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] px-2"
                            onClick={() => navigate("/router")}
                          >
                            Reatribuir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </PageContent>
    </>
  );
}
