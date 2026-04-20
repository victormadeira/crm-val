import { useState } from "react";
import { Beaker, CheckCircle2, Play, Plus, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { number, pct, relativeTime } from "@/lib/format";
import { abTestes } from "@/lib/mock";
import type { ABTeste } from "@/lib/types";

const statusTone = { rodando: "sky", finalizado: "emerald", rascunho: "slate" } as const;
const tipoLabel: Record<ABTeste["tipo"], string> = {
  criativo: "Criativo",
  copy: "Copy",
  cadencia: "Cadência",
  lp: "Landing page",
  preco: "Preço",
};

export function TestesAB() {
  const [sel, setSel] = useState<ABTeste | null>(null);
  const [novo, setNovo] = useState(false);

  const rodando = abTestes.filter((t) => t.status === "rodando").length;
  const vencedoras = abTestes.filter((t) => t.status === "finalizado" && t.vencedora).length;
  const upliftMedio = abTestes
    .filter((t) => t.status === "finalizado" && t.vencedora)
    .map((t) => Math.max(...t.variacoes.map((v) => v.uplift_pct)))
    .reduce((a, b) => a + b, 0) / Math.max(1, vencedoras);

  return (
    <>
      <PageHeader
        title="Testes A/B"
        subtitle="Experimentação contínua em criativos, copy, preço e cadência. Significância estatística (Bayesian)."
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNovo(true)}>
            Novo teste
          </Button>
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                <Beaker className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Em rodagem</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{rodando}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Vencedoras</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{vencedoras}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Uplift médio</div>
                <div className="text-[20px] font-semibold tabular text-emerald-600">+{upliftMedio.toFixed(1)}%</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-amber-50 text-amber-600 inline-flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Impacto estimado</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">R$ 184k/mês</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {abTestes.map((t) => (
            <Card key={t.id} className="cursor-pointer hover:shadow-pop transition" onClick={() => setSel(t)}>
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone={statusTone[t.status] as any}>{t.status}</Badge>
                      <Badge tone="slate">{tipoLabel[t.tipo]}</Badge>
                      {t.vencedora && (
                        <Badge tone="emerald" dot>
                          <Trophy className="h-3 w-3" /> {t.vencedora}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-[15px] text-slate-900">{t.nome}</h3>
                    <p className="text-[12px] text-slate-500 mt-1">{t.hipotese}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-[11px] text-slate-400">Confiança</div>
                    <div className={cn("text-[22px] font-semibold tabular", t.confianca_pct >= 95 ? "text-emerald-600" : t.confianca_pct >= 80 ? "text-amber-600" : "text-slate-400")}>
                      {t.confianca_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {t.status !== "rascunho" && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                    {t.variacoes.map((v, i) => (
                      <div key={v.nome} className={cn("p-3 rounded-[10px] border", t.vencedora === v.nome ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200")}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-[12px] text-slate-900">{v.nome}</div>
                          {t.vencedora === v.nome && <Trophy className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <div className="text-[20px] font-semibold tabular text-slate-900">{v.taxa.toFixed(2)}%</div>
                          {v.uplift_pct !== 0 && (
                            <div className={cn("text-[11px] font-semibold tabular flex items-center", v.uplift_pct > 0 ? "text-emerald-600" : "text-rose-600")}>
                              {v.uplift_pct > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {v.uplift_pct > 0 ? "+" : ""}{v.uplift_pct.toFixed(1)}%
                            </div>
                          )}
                          {i === 0 && <Badge tone="slate" className="text-[10px]">controle</Badge>}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular">
                          {number(v.conversoes)} conv. / {number(v.impressoes)} imp.
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", t.vencedora === v.nome ? "bg-emerald-500" : "bg-brand-500")}
                            style={{ width: `${Math.min(100, (v.taxa / Math.max(...t.variacoes.map((vv) => vv.taxa || 0.001))) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Iniciado {relativeTime(t.iniciado_em)}</span>
                  {t.finalizado_em && <span>Finalizado {relativeTime(t.finalizado_em)}</span>}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </PageContent>

      <Dialog
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.nome}
        subtitle={sel?.hipotese}
        size="lg"
        footer={
          sel?.status === "rodando" ? (
            <>
              <Button variant="outline">Encerrar como empate</Button>
              <Button leftIcon={<Trophy className="h-3.5 w-3.5" />}>Declarar vencedora</Button>
            </>
          ) : sel?.status === "rascunho" ? (
            <Button leftIcon={<Play className="h-3.5 w-3.5" />}>Iniciar teste</Button>
          ) : null
        }
      >
        {sel && (
          <div className="space-y-3 text-[13px]">
            <div className="rounded-[10px] bg-slate-900 text-slate-100 p-3 text-[12px]">
              <div className="text-slate-400 text-[10px] uppercase mb-1">Análise bayesiana</div>
              <div>Probabilidade de {sel.vencedora ?? "variante B"} ser a melhor: <b className="text-emerald-400">{sel.confianca_pct.toFixed(1)}%</b></div>
              <div className="text-slate-400 mt-1">
                Metodologia: thinning + Monte Carlo sampling com prior Beta(1,1).
                Mínimo para decisão: 95% de confiança.
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={novo}
        onClose={() => setNovo(false)}
        title="Novo teste A/B"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovo(false)}>Cancelar</Button>
            <Button onClick={() => setNovo(false)} leftIcon={<Play className="h-3.5 w-3.5" />}>Criar e iniciar</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Nome do teste</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3" placeholder="Ex: CTA com urgência" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Hipótese</label>
            <textarea className="w-full rounded-[10px] border border-slate-200 p-3 min-h-[64px]" placeholder="Acreditamos que... porque..." />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Tipo</label>
            <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 bg-white">
              {Object.entries(tipoLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </Dialog>
    </>
  );
}
