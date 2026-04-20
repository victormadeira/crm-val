import { useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Pause,
  QrCode,
  RefreshCw,
  Repeat,
  XCircle,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { dateShort, money, pct, relativeTime } from "@/lib/format";
import { assinaturas, pagamentos } from "@/lib/mock";
import type { PagamentoMetodo, PagamentoStatus } from "@/lib/types";

const statusTone: Record<PagamentoStatus, string> = {
  pago: "emerald",
  pendente: "amber",
  processando: "sky",
  falha: "rose",
  estornado: "slate",
  chargeback: "rose",
};

const metodoIcon: Record<PagamentoMetodo, React.ComponentType<{ className?: string }>> = {
  pix: QrCode,
  cartao: CreditCard,
  boleto: Banknote,
  dinheiro: CircleDollarSign,
};

const churnTone = { baixo: "emerald", medio: "amber", alto: "rose" } as const;

export function Checkout() {
  const [tab, setTab] = useState<"pagamentos" | "assinaturas">("pagamentos");

  const pagos = pagamentos.filter((p) => p.status === "pago");
  const mrr = assinaturas.filter((a) => a.status === "ativa").reduce((s, a) => s + a.valor_mensal, 0);
  const receita30d = pagos.reduce((s, p) => s + p.valor, 0);
  const taxaAprovacao = pagos.length / pagamentos.length;

  return (
    <>
      <PageHeader
        title="Pagamentos & Assinaturas"
        subtitle="Checkout integrado (PIX / cartão / boleto). Recorrência, dunning automatizado."
        tabs={
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as any)}
            tabs={[
              { id: "pagamentos", label: "Pagamentos", count: pagamentos.length },
              { id: "assinaturas", label: "Assinaturas", count: assinaturas.length },
            ]}
          />
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Receita 30d</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{money(receita30d)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">MRR ativo</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{money(mrr)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Taxa aprovação</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{pct(taxaAprovacao)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-rose-50 text-rose-600 inline-flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Inadimplentes</div>
                <div className="text-[20px] font-semibold tabular text-rose-600">
                  {assinaturas.filter((a) => a.status === "inadimplente").length}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {tab === "pagamentos" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2.5 px-4">Cliente</th>
                    <th className="text-left py-2.5 px-3">Método</th>
                    <th className="text-right py-2.5 px-3">Valor</th>
                    <th className="text-left py-2.5 px-3">Status</th>
                    <th className="text-left py-2.5 px-3">Gateway</th>
                    <th className="text-left py-2.5 px-3">Parcelas</th>
                    <th className="text-right py-2.5 px-4">Criado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.map((p) => {
                    const Icon = metodoIcon[p.metodo];
                    return (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{p.cliente_nome}</div>
                          <div className="text-[11px] text-slate-500">{p.cliente_email}</div>
                        </td>
                        <td className="px-3">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-slate-500" />
                            <span className="capitalize">{p.metodo}</span>
                          </span>
                        </td>
                        <td className="text-right px-3 font-semibold tabular">{money(p.valor)}</td>
                        <td className="px-3">
                          <Badge tone={statusTone[p.status] as any}>{p.status}</Badge>
                        </td>
                        <td className="px-3 capitalize text-slate-600">{p.gateway}</td>
                        <td className="px-3 tabular">{p.parcelas > 1 ? `${p.parcela_atual}/${p.parcelas}` : "—"}</td>
                        <td className="text-right px-4 text-[11px] text-slate-500">{relativeTime(p.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "assinaturas" && (
          <div className="grid grid-cols-2 gap-4">
            {assinaturas.map((a) => (
              <Card key={a.id}>
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-[14px] text-slate-900">{a.cliente_nome}</div>
                      <div className="text-[12px] text-slate-500">{a.plano}</div>
                    </div>
                    <Badge tone={
                      a.status === "ativa" ? "emerald" :
                      a.status === "pausada" ? "slate" :
                      a.status === "cancelada" ? "rose" : "amber"
                    }>
                      {a.status}
                    </Badge>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <div className="text-[22px] font-semibold tabular text-slate-900">{money(a.valor_mensal)}</div>
                    <div className="text-[11px] text-slate-500 mb-1">/ {a.ciclo}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-2.5 border-y border-slate-100 text-[11px]">
                    <div>
                      <div className="text-slate-400">Próxima</div>
                      <div className="font-semibold tabular">{dateShort(a.proxima_cobranca)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Desde</div>
                      <div className="font-semibold tabular">{dateShort(a.iniciada_em)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Churn risk</div>
                      <Badge tone={churnTone[a.churn_risk] as any} className="text-[10px]">{a.churn_risk}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    {a.status === "ativa" ? (
                      <>
                        <Button size="sm" variant="outline" leftIcon={<Pause className="h-3.5 w-3.5" />} className="flex-1">Pausar</Button>
                        <Button size="sm" variant="outline" leftIcon={<XCircle className="h-3.5 w-3.5" />}>Cancelar</Button>
                      </>
                    ) : a.status === "inadimplente" ? (
                      <Button size="sm" className="w-full" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Nova cobrança</Button>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full">Reativar</Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </PageContent>
    </>
  );
}
