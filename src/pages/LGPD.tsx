import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Cookie,
  FileCheck2,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  UserX,
  XCircle,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Dialog } from "@/components/ui/Dialog";
import { dateShort, relativeTime } from "@/lib/format";
import { consentsTitulares, lgpdSolicitacoes } from "@/lib/mock";
import type { LGPDSolicitacao, LGPDStatus, LGPDTipo } from "@/lib/types";

const tipoLabel: Record<LGPDTipo, string> = {
  acesso: "Acesso aos dados",
  exclusao: "Direito ao esquecimento",
  portabilidade: "Portabilidade",
  retificacao: "Retificação",
  anonimizacao: "Anonimização",
  revogacao_consentimento: "Revogação de consentimento",
};

const statusTone: Record<LGPDStatus, string> = {
  pendente: "amber",
  em_analise: "sky",
  concluida: "emerald",
  negada: "rose",
};

export function LGPD() {
  const [tab, setTab] = useState<"solicitacoes" | "consents" | "politicas">("solicitacoes");
  const [sel, setSel] = useState<LGPDSolicitacao | null>(null);
  const [solicitacoes, setSolicitacoes] = useState(lgpdSolicitacoes);

  const pendentes = solicitacoes.filter((s) => s.status === "pendente" || s.status === "em_analise").length;
  const concluidas = solicitacoes.filter((s) => s.status === "concluida").length;
  const vencidas = solicitacoes.filter((s) => {
    const prazo = new Date(s.prazo).getTime();
    return (s.status === "pendente" || s.status === "em_analise") && prazo < Date.now();
  }).length;

  const handleResolver = (id: string, status: LGPDStatus) => {
    setSolicitacoes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status, concluida_em: new Date().toISOString(), responsavel: "Admin" }
          : s
      )
    );
    setSel(null);
  };

  return (
    <>
      <PageHeader
        title="LGPD & Privacidade"
        subtitle="Direitos dos titulares (ANPD). SLA 15 dias. Base legal e consentimento."
        tabs={
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as any)}
            tabs={[
              { id: "solicitacoes", label: "Solicitações", count: solicitacoes.length },
              { id: "consents", label: "Consentimentos", count: consentsTitulares.length },
              { id: "politicas", label: "Políticas" },
            ]}
          />
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-amber-50 text-amber-600 inline-flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Em andamento</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{pendentes}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Concluídas</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{concluidas}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-rose-50 text-rose-600 inline-flex items-center justify-center">
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">SLA vencido</div>
                <div className="text-[20px] font-semibold tabular text-rose-600">{vencidas}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">DPO designado</div>
                <div className="text-[13px] font-semibold text-slate-900">Diego Costa</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {tab === "solicitacoes" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2.5 px-4">Titular</th>
                    <th className="text-left py-2.5 px-3">Tipo</th>
                    <th className="text-left py-2.5 px-3">Status</th>
                    <th className="text-left py-2.5 px-3">Criada</th>
                    <th className="text-left py-2.5 px-3">Prazo</th>
                    <th className="text-right py-2.5 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {solicitacoes.map((s) => {
                    const venceu = new Date(s.prazo).getTime() < Date.now();
                    return (
                      <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{s.titular}</div>
                          <div className="text-[11px] text-slate-500">{s.email} · {s.cpf}</div>
                        </td>
                        <td className="px-3">{tipoLabel[s.tipo]}</td>
                        <td className="px-3">
                          <Badge tone={statusTone[s.status] as any}>{s.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="px-3 text-[11px] text-slate-500">{dateShort(s.created_at)}</td>
                        <td className="px-3 text-[11px]">
                          <span className={venceu && s.status !== "concluida" ? "text-rose-600 font-semibold" : "text-slate-500"}>
                            {dateShort(s.prazo)} ({relativeTime(s.prazo)})
                          </span>
                        </td>
                        <td className="text-right px-4">
                          <Button size="sm" variant="outline" onClick={() => setSel(s)}>Abrir</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "consents" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2.5 px-4">Titular</th>
                    <th className="text-center py-2.5 px-3"><Mail className="h-3.5 w-3.5 inline" /> Email</th>
                    <th className="text-center py-2.5 px-3"><MessageCircle className="h-3.5 w-3.5 inline" /> WA</th>
                    <th className="text-center py-2.5 px-3"><Phone className="h-3.5 w-3.5 inline" /> SMS</th>
                    <th className="text-center py-2.5 px-3"><Cookie className="h-3.5 w-3.5 inline" /> Analytics</th>
                    <th className="text-center py-2.5 px-3"><Cookie className="h-3.5 w-3.5 inline" /> Marketing</th>
                    <th className="text-right py-2.5 px-4">Atualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {consentsTitulares.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="py-3 px-4 font-semibold text-slate-900">{c.nome}</td>
                      <td className="text-center px-3">{c.marketing_email ? <Check className="h-4 w-4 text-emerald-500 inline" /> : <XCircle className="h-4 w-4 text-slate-300 inline" />}</td>
                      <td className="text-center px-3">{c.marketing_whatsapp ? <Check className="h-4 w-4 text-emerald-500 inline" /> : <XCircle className="h-4 w-4 text-slate-300 inline" />}</td>
                      <td className="text-center px-3">{c.marketing_sms ? <Check className="h-4 w-4 text-emerald-500 inline" /> : <XCircle className="h-4 w-4 text-slate-300 inline" />}</td>
                      <td className="text-center px-3">{c.cookies_analytics ? <Check className="h-4 w-4 text-emerald-500 inline" /> : <XCircle className="h-4 w-4 text-slate-300 inline" />}</td>
                      <td className="text-center px-3">{c.cookies_marketing ? <Check className="h-4 w-4 text-emerald-500 inline" /> : <XCircle className="h-4 w-4 text-slate-300 inline" />}</td>
                      <td className="text-right px-4 text-[11px] text-slate-500">{relativeTime(c.atualizado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "politicas" && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { titulo: "Política de Privacidade", versao: "v3.2", ultima: "2026-02-10", status: "publicada" },
              { titulo: "Termos de Uso", versao: "v2.8", ultima: "2026-01-15", status: "publicada" },
              { titulo: "Política de Cookies", versao: "v1.4", ultima: "2026-02-10", status: "publicada" },
              { titulo: "Relatório de Impacto (RIPD)", versao: "2026", ultima: "2026-01-30", status: "interna" },
            ].map((p) => (
              <Card key={p.titulo}>
                <CardHeader title={p.titulo} />
                <CardBody>
                  <div className="flex items-center justify-between mb-3">
                    <Badge tone={p.status === "publicada" ? "emerald" : "slate"}>{p.status}</Badge>
                    <span className="text-[11px] text-slate-500">{p.versao} · {p.ultima}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" leftIcon={<FileCheck2 className="h-3.5 w-3.5" />}>Ver versão atual</Button>
                    <Button size="sm" variant="outline">Histórico</Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      <Dialog
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel && `Solicitação ${sel.id} — ${tipoLabel[sel.tipo]}`}
        size="lg"
        footer={
          sel && sel.status !== "concluida" && sel.status !== "negada" ? (
            <>
              <Button variant="danger" onClick={() => handleResolver(sel.id, "negada")}>Negar</Button>
              <Button onClick={() => handleResolver(sel.id, "concluida")} leftIcon={<Check className="h-3.5 w-3.5" />}>
                Concluir
              </Button>
            </>
          ) : null
        }
      >
        {sel && (
          <div className="space-y-3 text-[13px]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Titular</div>
                <div className="font-semibold">{sel.titular}</div>
                <div className="text-[11px] text-slate-500">{sel.email}</div>
                <div className="text-[11px] text-slate-500">{sel.cpf}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Status</div>
                <Badge tone={statusTone[sel.status] as any}>{sel.status.replace("_", " ")}</Badge>
                <div className="text-[11px] text-slate-500 mt-2">Prazo legal: 15 dias</div>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase mb-1">Descrição</div>
              <div className="rounded-[10px] bg-slate-50 p-3 text-slate-700">{sel.descricao}</div>
            </div>
            {sel.responsavel && (
              <div className="text-[11px] text-slate-500">Responsável: <span className="font-semibold text-slate-700">{sel.responsavel}</span></div>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
