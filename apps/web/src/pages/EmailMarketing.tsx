import { useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  Eye,
  Mail,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  Send,
  TrendingUp,
  UserMinus,
  XCircle,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { number, pct, relativeTime } from "@/lib/format";
import { emailCampanhas } from "@/lib/mock";
import type { EmailCampanha } from "@/lib/types";

const statusTone = {
  rascunho: "slate",
  agendada: "amber",
  enviando: "sky",
  enviada: "emerald",
  pausada: "rose",
} as const;

export function EmailMarketing() {
  const [sel, setSel] = useState<EmailCampanha | null>(null);
  const [nova, setNova] = useState(false);

  const enviadas = emailCampanhas.filter((c) => c.status === "enviada");
  const totalEnv = enviadas.reduce((s, c) => s + c.enviados, 0);
  const totalAbertos = enviadas.reduce((s, c) => s + c.abertos, 0);
  const totalCliques = enviadas.reduce((s, c) => s + c.clicados, 0);
  const taxaAbertura = totalAbertos / Math.max(1, totalEnv);
  const taxaClique = totalCliques / Math.max(1, totalEnv);

  return (
    <>
      <PageHeader
        title="Email marketing"
        subtitle="Campanhas segmentadas, templates drag-and-drop, A/B subject. RD Station parity."
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNova(true)}>
            Nova campanha
          </Button>
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Enviados 30d</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{number(totalEnv)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Taxa abertura</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{pct(taxaAbertura)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Taxa clique</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{pct(taxaClique)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-amber-50 text-amber-600 inline-flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Receita atribuída</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">R$ 82,4k</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2.5 px-4">Campanha</th>
                  <th className="text-left py-2.5 px-3">Status</th>
                  <th className="text-right py-2.5 px-3">Enviados</th>
                  <th className="text-right py-2.5 px-3">Abertura</th>
                  <th className="text-right py-2.5 px-3">CTR</th>
                  <th className="text-right py-2.5 px-3">Descad.</th>
                  <th className="text-right py-2.5 px-3">Enviada</th>
                  <th className="text-right py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {emailCampanhas.map((c) => {
                  const abert = c.entregues > 0 ? c.abertos / c.entregues : 0;
                  const ctr = c.abertos > 0 ? c.clicados / c.abertos : 0;
                  return (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setSel(c)}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.nome}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{c.assunto}</div>
                      </td>
                      <td className="px-3">
                        <Badge tone={statusTone[c.status] as any}>{c.status}</Badge>
                      </td>
                      <td className="text-right px-3 tabular">{number(c.enviados)}</td>
                      <td className="text-right px-3 tabular">{c.status === "enviada" ? pct(abert) : "—"}</td>
                      <td className="text-right px-3 tabular text-brand-600 font-semibold">
                        {c.status === "enviada" ? pct(ctr) : "—"}
                      </td>
                      <td className="text-right px-3 tabular text-rose-600">{c.descadastros || "—"}</td>
                      <td className="text-right px-3 text-[11px] text-slate-500">
                        {c.enviada_em ? relativeTime(c.enviada_em) : "—"}
                      </td>
                      <td className="text-right px-4">
                        <Button size="sm" variant="outline">Abrir</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>

      <Dialog
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.nome}
        subtitle={sel?.assunto}
        size="lg"
        footer={
          sel?.status === "rascunho" || sel?.status === "agendada" ? (
            <>
              <Button variant="outline" leftIcon={<Eye className="h-3.5 w-3.5" />}>Pré-visualizar</Button>
              <Button leftIcon={<Send className="h-3.5 w-3.5" />}>Enviar agora</Button>
            </>
          ) : sel?.status === "enviando" ? (
            <Button variant="danger" leftIcon={<Pause className="h-3.5 w-3.5" />}>Pausar envio</Button>
          ) : null
        }
      >
        {sel && (
          <div className="space-y-4 text-[13px]">
            <div className="rounded-[10px] bg-slate-50 p-3">
              <div className="text-[11px] text-slate-400 uppercase mb-1">Preview text</div>
              <div className="text-slate-700 italic">"{sel.preview}"</div>
            </div>
            {sel.status === "enviada" && (
              <>
                <div className="grid grid-cols-5 gap-2">
                  <Metric label="Enviados" value={number(sel.enviados)} />
                  <Metric label="Entregues" value={number(sel.entregues)} />
                  <Metric label="Abertos" value={number(sel.abertos)} accent="emerald" />
                  <Metric label="Cliques" value={number(sel.clicados)} accent="brand" />
                  <Metric label="Bounces" value={number(sel.bounces)} accent="rose" />
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 uppercase mb-2">Funil</div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Entregues", v: sel.entregues, max: sel.enviados, tone: "bg-slate-400" },
                      { label: "Abertos", v: sel.abertos, max: sel.enviados, tone: "bg-emerald-500" },
                      { label: "Clicados", v: sel.clicados, max: sel.enviados, tone: "bg-brand-500" },
                    ].map((r) => (
                      <div key={r.label}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-slate-600 font-medium">{r.label}</span>
                          <span className="text-slate-500 tabular">{number(r.v)} · {pct(r.v / r.max)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={cn("h-full rounded-full", r.tone)} style={{ width: `${(r.v / r.max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-[12px]">
                  <span className="flex items-center gap-1.5"><UserMinus className="h-3.5 w-3.5 text-rose-500" /> {sel.descadastros} descadastros</span>
                  <span className="flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-amber-500" /> {sel.bounces} bounces</span>
                  <span className="flex items-center gap-1.5 ml-auto"><ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> receita atribuída: R$ 12,4k</span>
                </div>
              </>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={nova}
        onClose={() => setNova(false)}
        title="Nova campanha de email"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setNova(false)}>Cancelar</Button>
            <Button onClick={() => setNova(false)} leftIcon={<Calendar className="h-3.5 w-3.5" />}>Agendar</Button>
            <Button onClick={() => setNova(false)} leftIcon={<Send className="h-3.5 w-3.5" />}>Enviar agora</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Nome interno</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3" placeholder="Ex: Renovação T-30 maio" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Assunto</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3" placeholder="Seu passaporte vence em 30 dias..." />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Preview text</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3" placeholder="Renove agora com 15% off exclusivo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Segmento</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 bg-white">
                <option>Clientes T-30 renovação</option>
                <option>Inativos 90d</option>
                <option>Aniversariantes do mês</option>
                <option>Corporativo</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Template</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 bg-white">
                <option>Renovação</option>
                <option>Promoção</option>
                <option>Newsletter</option>
                <option>Aniversário</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12px] text-slate-600">
            <input type="checkbox" className="rounded" />
            Teste A/B no assunto (50/50)
          </label>
        </div>
      </Dialog>
    </>
  );
}

function Metric({ label, value, accent = "slate" }: { label: string; value: string; accent?: "slate" | "emerald" | "brand" | "rose" }) {
  const col = { slate: "text-slate-900", emerald: "text-emerald-600", brand: "text-brand-600", rose: "text-rose-600" }[accent];
  return (
    <div className="rounded-[10px] bg-slate-50 p-2.5 text-center">
      <div className="text-[10px] text-slate-400 uppercase">{label}</div>
      <div className={cn("text-[16px] font-semibold tabular", col)}>{value}</div>
    </div>
  );
}
