import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Headphones,
  Mic,
  Pause,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  Smile,
  Target,
  TrendingDown,
  Volume2,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { pct, relativeTime } from "@/lib/format";
import { callGravacoes, corretores } from "@/lib/mock";
import type { CallGravacao } from "@/lib/types";

const sentTone = { positivo: "emerald", neutro: "slate", negativo: "rose" } as const;
const sentLabel = { positivo: "Positivo", neutro: "Neutro", negativo: "Negativo" } as const;

export function VoiceAI() {
  const [sel, setSel] = useState<CallGravacao | null>(null);
  const [filtroSent, setFiltroSent] = useState<"todas" | "positivo" | "neutro" | "negativo">("todas");

  const lista = useMemo(
    () => callGravacoes.filter((c) => filtroSent === "todas" || c.sentimento === filtroSent),
    [filtroSent]
  );

  const avgScore = Math.round(callGravacoes.reduce((s, c) => s + c.score_qualidade, 0) / callGravacoes.length);
  const totalMin = Math.floor(callGravacoes.reduce((s, c) => s + c.duracao_s, 0) / 60);
  const ganhas = callGravacoes.filter((c) => c.resultado === "ganho").length;
  const objTop = callGravacoes.flatMap((c) => c.objecoes_detectadas);
  const objCount = objTop.reduce<Record<string, number>>((a, o) => ({ ...a, [o]: (a[o] ?? 0) + 1 }), {});
  const objRanked = Object.entries(objCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const corretorNome = (id: string) => corretores.find((c) => c.id === id)?.nome ?? id;

  return (
    <>
      <PageHeader
        title="Voice AI"
        subtitle="Gravação + transcrição + análise automática de chamadas. Estilo Gong/Chorus."
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Chamadas 7d</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{callGravacoes.length}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Score médio</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{avgScore}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Minutos totais</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{totalMin}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-amber-50 text-amber-600 inline-flex items-center justify-center">
                <Smile className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Taxa conversão</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{pct(ganhas / callGravacoes.length)}</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <Card className="col-span-2">
            <CardHeader title="Gravações recentes" subtitle="IA classifica sentimento, objeções e próximos passos" />
            <CardBody>
              <div className="flex gap-1 mb-3">
                {(["todas", "positivo", "neutro", "negativo"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltroSent(f)}
                    className={cn(
                      "px-2.5 h-7 rounded-[8px] text-[11px] font-medium capitalize",
                      filtroSent === f ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {lista.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-[12px] border border-slate-200 p-3 hover:border-brand-200 hover:bg-brand-50/20 cursor-pointer transition"
                    onClick={() => setSel(c)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={corretorNome(c.corretor_id)} size="sm" />
                        <div>
                          <div className="font-semibold text-[13px] text-slate-900">{corretorNome(c.corretor_id)}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            {c.direcao === "inbound" ? <PhoneIncoming className="h-3 w-3" /> : <PhoneOutgoing className="h-3 w-3" />}
                            {c.direcao} · {Math.floor(c.duracao_s / 60)}min · {relativeTime(c.iniciada_em)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={sentTone[c.sentimento] as any}>{sentLabel[c.sentimento]}</Badge>
                        <div className={cn("text-[13px] font-semibold tabular", c.score_qualidade >= 80 ? "text-emerald-600" : c.score_qualidade >= 60 ? "text-amber-600" : "text-rose-600")}>
                          {c.score_qualidade}
                        </div>
                      </div>
                    </div>
                    {c.objecoes_detectadas.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.objecoes_detectadas.map((o) => (
                          <Badge key={o} tone="amber" className="text-[10px]">{o}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Top objeções detectadas" subtitle="Últimos 7 dias" />
            <CardBody>
              <div className="space-y-2">
                {objRanked.map(([obj, count]) => (
                  <div key={obj} className="flex items-center justify-between p-2 rounded-[8px] bg-amber-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-[12px] font-medium text-slate-800">{obj}</span>
                    </div>
                    <Badge tone="amber" className="tabular">{count}x</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-[10px] bg-slate-50 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                  <TrendingDown className="h-3.5 w-3.5" /> Coaching sugerido
                </div>
                Monólogo &gt; 40s detectado em 2 chamadas — treinar técnica de escuta ativa.
              </div>
            </CardBody>
          </Card>
        </div>
      </PageContent>

      <Dialog
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel && `Chamada ${sel.id} — ${corretorNome(sel.corretor_id)}`}
        subtitle={sel && `${Math.floor(sel.duracao_s / 60)}min · ${sel.direcao} · score ${sel.score_qualidade}`}
        size="xl"
        footer={
          <>
            <Button variant="outline" leftIcon={<Play className="h-3.5 w-3.5" />}>Ouvir áudio</Button>
            <Button leftIcon={<Mic className="h-3.5 w-3.5" />}>Ver transcrição completa</Button>
          </>
        }
      >
        {sel && (
          <div className="space-y-4 text-[13px]">
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-[10px] bg-slate-50 p-3">
                <div className="text-[11px] text-slate-400 uppercase">Sentimento</div>
                <Badge tone={sentTone[sel.sentimento] as any}>{sentLabel[sel.sentimento]}</Badge>
              </div>
              <div className="rounded-[10px] bg-slate-50 p-3">
                <div className="text-[11px] text-slate-400 uppercase">Fala corretor</div>
                <div className="text-[16px] font-semibold tabular">{sel.fala_pct_corretor}%</div>
                <div className="text-[10px] text-slate-500">ideal 40-50%</div>
              </div>
              <div className="rounded-[10px] bg-slate-50 p-3">
                <div className="text-[11px] text-slate-400 uppercase">Monólogo máx</div>
                <div className={cn("text-[16px] font-semibold tabular", sel.monologo_maior_s > 40 ? "text-rose-600" : "text-emerald-600")}>
                  {sel.monologo_maior_s}s
                </div>
              </div>
              <div className="rounded-[10px] bg-slate-50 p-3">
                <div className="text-[11px] text-slate-400 uppercase">Palavras proibidas</div>
                <div className={cn("text-[16px] font-semibold tabular", sel.palavras_proibidas > 0 ? "text-rose-600" : "text-emerald-600")}>
                  {sel.palavras_proibidas}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase mb-2">Objeções detectadas</div>
              <div className="flex flex-wrap gap-1">
                {sel.objecoes_detectadas.length > 0 ? (
                  sel.objecoes_detectadas.map((o) => <Badge key={o} tone="amber">{o}</Badge>)
                ) : (
                  <span className="text-slate-500 text-[12px]">Nenhuma</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 uppercase mb-2">Próximos passos sugeridos pela IA</div>
              <ul className="space-y-1">
                {sel.proximos_passos.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[10px] bg-slate-900 text-slate-100 p-3 text-[12px] space-y-2">
              <div className="text-slate-400 text-[10px] uppercase">Trecho da transcrição</div>
              <div><span className="text-emerald-400 font-mono">[00:12] Corretor:</span> Oi, tudo bem? Fala comigo, que família linda!</div>
              <div><span className="text-sky-400 font-mono">[00:18] Lead:</span> Oi, a gente tá querendo saber sobre o anual familiar…</div>
              <div><span className="text-emerald-400 font-mono">[00:24] Corretor:</span> Perfeito! Deixa eu te mostrar uma coisa que vai fazer sentido…</div>
              <div className="text-slate-500 italic">Transcrição completa disponível no botão acima.</div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
