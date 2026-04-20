import { useState } from "react";
import {
  Award,
  Crown,
  Flame,
  Medal,
  Rocket,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { corretores, desafios } from "@/lib/mock";
import { money, pct } from "@/lib/format";
import { cn } from "@/lib/cn";

const nivelColor = {
  Platina: "from-violet-500 to-fuchsia-500",
  Ouro: "from-amber-400 to-amber-600",
  Prata: "from-slate-300 to-slate-500",
  Bronze: "from-orange-400 to-orange-600",
};

const badgeIcons = {
  "Top 1 da semana": Crown,
  "100% de renovação": Medal,
  "Fechadora do mês": Trophy,
  "Mais rápido do mês": Zap,
  "Zero leads parados": Flame,
  "Primeiro fechamento do dia": Rocket,
};

export function Gamificacao() {
  const [periodo, setPeriodo] = useState<"hoje" | "semana" | "mes">("mes");
  const [desafioAberto, setDesafioAberto] = useState(false);
  const top = [...corretores].sort(
    (a, b) => b.score_composto - a.score_composto
  );

  return (
    <>
      <PageHeader
        title="Gamificação"
        subtitle="Ranking, conquistas e desafios do time"
        actions={
          <>
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
        {/* Pódio */}
        <Card className="overflow-hidden">
          <CardBody className="pt-8 pb-6 bg-gradient-to-br from-brand-50 via-white to-aqua-50">
            <div className="grid grid-cols-3 gap-4 items-end max-w-3xl mx-auto">
              {[1, 0, 2].map((idx) => {
                const c = top[idx];
                const place = idx + 1;
                const heights = ["h-32", "h-44", "h-24"];
                return (
                  <div key={c.id} className="text-center">
                    <div className="relative inline-block mb-3">
                      <Avatar name={c.nome} size="lg" className="h-16 w-16 ring-4 ring-white shadow-pop" />
                      <div
                        className={cn(
                          "absolute -bottom-2 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full text-white text-xs font-bold inline-flex items-center justify-center ring-2 ring-white",
                          place === 1
                            ? "bg-amber-500"
                            : place === 2
                            ? "bg-slate-400"
                            : "bg-orange-600"
                        )}
                      >
                        {place}
                      </div>
                    </div>
                    <div className="text-[14px] font-semibold text-slate-900">
                      {c.nome}
                    </div>
                    <div className="text-[11px] text-slate-500 tabular">
                      {money(c.receita_mes)}
                    </div>
                    <div
                      className={cn(
                        "mt-3 rounded-t-[12px] bg-gradient-to-t border border-b-0 border-slate-200/60 shadow-soft",
                        heights[idx],
                        place === 1
                          ? "from-amber-100 to-amber-50"
                          : place === 2
                          ? "from-slate-100 to-slate-50"
                          : "from-orange-100 to-orange-50"
                      )}
                    >
                      <div className="pt-3 text-[22px] font-bold tabular text-slate-800">
                        {c.score_composto}
                      </div>
                      {place === 1 && (
                        <Crown className="h-8 w-8 text-amber-500 mx-auto mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Níveis + Desafios */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
          <Card>
            <CardHeader title="Meu nível" subtitle="Evolua subindo seu score composto" />
            <CardBody>
              <div className="rounded-[14px] bg-gradient-to-br from-violet-500 to-fuchsia-600 p-5 text-white shadow-pop">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] opacity-80 uppercase tracking-wider">
                      Nível atual
                    </div>
                    <div className="text-[28px] font-bold tracking-tight mt-1">
                      Platina
                    </div>
                  </div>
                  <Crown className="h-10 w-10 opacity-80" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] opacity-90 mb-1.5">
                    <span>Próximo: Diamante</span>
                    <span className="tabular font-semibold">92 / 100</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: "92%" }}
                    />
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {(["Platina", "Ouro", "Prata", "Bronze"] as const).map((n) => (
                  <li
                    key={n}
                    className="flex items-center gap-3 px-3 py-2 rounded-[10px] border border-slate-200"
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-[8px] bg-gradient-to-br inline-flex items-center justify-center text-white",
                        nivelColor[n]
                      )}
                    >
                      <Medal className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[13px] text-slate-900">
                        {n}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {corretores.filter((c) => c.nivel === n).length} corretores
                      </div>
                    </div>
                    <Badge tone="slate">
                      {n === "Platina"
                        ? "85+ score"
                        : n === "Ouro"
                        ? "70-84"
                        : n === "Prata"
                        ? "55-69"
                        : "0-54"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Desafios ativos"
              subtitle="Configurados pelo supervisor"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDesafioAberto(true)}
                >
                  Criar desafio
                </Button>
              }
            />
            <CardBody className="space-y-3">
              {desafios.map((d) => (
                <div
                  key={d.id}
                  className="rounded-[12px] border border-slate-200 p-4 hover:border-brand-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-[10px] bg-gradient-to-br from-brand-500 to-aqua-500 text-white inline-flex items-center justify-center shrink-0">
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-semibold text-slate-900">
                          {d.titulo}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge tone="violet" className="text-[10px]">
                            <Award className="h-3 w-3" /> {d.recompensa}
                          </Badge>
                          <span className="text-[11px] text-slate-500">
                            Prazo: {d.prazo}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] tabular font-semibold text-slate-700">
                      {d.progresso}/{d.total}
                    </span>
                  </div>
                  <Progress
                    value={(d.progresso / d.total) * 100}
                    tone="brand"
                    className="mt-3"
                  />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Badges */}
        <Card>
          <CardHeader
            title="Conquistas do time"
            subtitle="Todos os badges desbloqueados esta semana"
          />
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {top
                .filter((c) => c.badges.length > 0)
                .flatMap((c) =>
                  c.badges.map((b) => {
                    const Icon =
                      badgeIcons[b as keyof typeof badgeIcons] ?? Star;
                    return (
                      <div
                        key={`${c.id}-${b}`}
                        className="rounded-[12px] border border-slate-200 p-3 hover:border-amber-300 hover:shadow-soft transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-[10px] bg-gradient-to-br from-amber-400 to-orange-500 text-white inline-flex items-center justify-center shrink-0 shadow-soft">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-slate-900 line-clamp-1">
                              {b}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Avatar name={c.nome} size="xs" />
                              <span className="truncate">{c.nome}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
            </div>
          </CardBody>
        </Card>

        {/* Feed de vitórias */}
        <Card>
          <CardHeader
            title="Feed de vitórias"
            subtitle="Em tempo real — ao vivo"
            action={
              <Badge tone="emerald" dot>
                Ao vivo
              </Badge>
            }
          />
          <CardBody className="p-0">
            <ul className="divide-y divide-slate-100">
              {[
                { n: "Amanda Rocha", acao: "fechou passaporte Anual Família", t: "há 3 min" },
                { n: "Bruno Teixeira", acao: "subiu para Ouro 🏆", t: "há 12 min" },
                { n: "Carla Mendes", acao: "desbloqueou badge Zero Parado", t: "há 28 min" },
                { n: "Amanda Rocha", acao: "bateu meta diária (117%)", t: "há 1h" },
                { n: "Diego Alves", acao: "fechou primeira venda do dia 🎉", t: "há 2h" },
              ].map((ev, i) => (
                <li key={i} className="px-5 py-3 flex items-center gap-3">
                  <Avatar name={ev.n} size="sm" />
                  <div className="flex-1">
                    <p className="text-[13px] text-slate-700">
                      <strong className="text-slate-900">{ev.n}</strong>{" "}
                      <span className="text-slate-600">{ev.acao}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 tabular">
                    {ev.t}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </PageContent>

      <Dialog
        open={desafioAberto}
        onClose={() => setDesafioAberto(false)}
        title="Criar desafio"
        subtitle="Defina meta, prazo e recompensa para o time"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDesafioAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setDesafioAberto(false)}>Publicar desafio</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-slate-700">Título</label>
            <Input className="mt-1" placeholder="Ex: 10 anuais em 7 dias" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-slate-700">Meta</label>
              <Input type="number" className="mt-1" placeholder="10" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700">Prazo (dias)</label>
              <Input type="number" className="mt-1" placeholder="7" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700">Recompensa</label>
            <Input className="mt-1" placeholder="Bônus R$ 500 + badge exclusivo" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700">Participantes</label>
            <select className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-white text-sm">
              <option>Todo o time</option>
              <option>Apenas Platina/Ouro</option>
              <option>Especialistas anual</option>
              <option>Seleção manual</option>
            </select>
          </div>
        </div>
      </Dialog>
    </>
  );
}
