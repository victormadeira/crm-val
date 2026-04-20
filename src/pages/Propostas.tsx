import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  Filter,
  Mail,
  Plus,
  Send,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { money, number, pct } from "@/lib/format";
import { corretores, propostas } from "@/lib/mock";
import type { Proposta } from "@/lib/types";

const statusTone: Record<Proposta["status"], string> = {
  rascunho: "slate",
  enviada: "sky",
  visualizada: "amber",
  aceita: "emerald",
  recusada: "rose",
  expirada: "slate",
};

export function Propostas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todas" | Proposta["status"]>("todas");
  const [selecionada, setSelecionada] = useState<Proposta | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);
  const [prefill, setPrefill] = useState<{
    nome: string;
    email: string;
    valor: number;
    template: string;
  }>({ nome: "", email: "", valor: 0, template: "anual" });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const copiarLink = (p: Proposta) => {
    const link = `${window.location.origin}/p/${p.numero}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(
        () => showToast(`Link copiado: ${link}`),
        () => showToast("Não foi possível copiar o link")
      );
    } else {
      showToast(`Link: ${link}`);
    }
  };

  const baixarPDF = (p: Proposta) => {
    const linhas = [
      `Proposta ${p.numero}`,
      `Cliente: ${p.cliente_nome} <${p.cliente_email}>`,
      `Status: ${p.status}`,
      `Total: ${p.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      `Parcelas: ${p.parcelas}x`,
      "",
      "Itens:",
      ...p.itens.map(
        (i) =>
          `- ${i.descricao} • ${i.quantidade} x ${i.preco_unit} (-${i.desconto_pct}%)`
      ),
    ];
    const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `proposta-${p.numero}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`Proposta ${p.numero} baixada`);
  };

  const enviarProposta = (p: Proposta) => {
    showToast(`Proposta enviada para ${p.cliente_email}`);
    setSelecionada(null);
  };

  const reenviarProposta = (p: Proposta) => {
    showToast(`Reenvio disparado para ${p.cliente_email}`);
  };

  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      setPrefill({
        nome: searchParams.get("nome") ?? "",
        email: searchParams.get("email") ?? "",
        valor: Number(searchParams.get("valor") ?? 0),
        template: searchParams.get("template") ?? "anual",
      });
      setNovaAberta(true);
    }
  }, [searchParams]);

  const fecharNova = () => {
    setNovaAberta(false);
    if (searchParams.get("novo")) {
      const next = new URLSearchParams(searchParams);
      ["novo", "lead", "nome", "email", "valor", "template"].forEach((k) => next.delete(k));
      setSearchParams(next, { replace: true });
    }
  };

  const filtered = useMemo(() => {
    return propostas.filter((p) => {
      if (busca && !p.cliente_nome.toLowerCase().includes(busca.toLowerCase()) && !p.numero.toLowerCase().includes(busca.toLowerCase())) return false;
      if (statusFiltro !== "todas" && p.status !== statusFiltro) return false;
      return true;
    });
  }, [busca, statusFiltro]);

  const totais = useMemo(() => {
    const emitidas = propostas.length;
    const aceitas = propostas.filter((p) => p.status === "aceita").length;
    const visualizadas = propostas.filter((p) => ["visualizada", "aceita"].includes(p.status)).length;
    const emAberto = propostas.filter((p) => ["enviada", "visualizada"].includes(p.status)).reduce((s, p) => s + p.total, 0);
    const fechadas = propostas.filter((p) => p.status === "aceita").reduce((s, p) => s + p.total, 0);
    return { emitidas, aceitas, visualizadas, emAberto, fechadas, taxaFech: emitidas > 0 ? aceitas / emitidas : 0 };
  }, []);

  const exportar = () => {
    const csv = [
      "Numero,Cliente,Status,Total,Parcelas,Corretor,Criada",
      ...propostas.map((p) => {
        const corretor = corretores.find((c) => c.id === p.corretor_id);
        return `${p.numero},${p.cliente_nome},${p.status},${p.total},${p.parcelas},${corretor?.nome ?? ""},${p.criada_em}`;
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "propostas.csv";
    a.click();
  };

  return (
    <>
      <PageHeader
        title="Propostas comerciais"
        subtitle="Gerador de orçamentos com template, envio por link e rastreamento de visualização"
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={exportar}>
              Exportar
            </Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNovaAberta(true)}>
              Nova proposta
            </Button>
          </>
        }
      />
      <PageContent>
        <div className="grid grid-cols-5 gap-3 mb-5">
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Emitidas 30d</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{totais.emitidas}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Taxa de fechamento</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{pct(totais.taxaFech)}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Visualizadas</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{totais.visualizadas}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Em aberto</div>
              <div className="text-[20px] font-semibold tabular text-amber-600 mt-0.5">{money(totais.emAberto)}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Fechadas</div>
              <div className="text-[20px] font-semibold tabular text-emerald-600 mt-0.5">{money(totais.fechadas)}</div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title={`${filtered.length} propostas`}
            action={
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar cliente ou número"
                  leftIcon={<Filter className="h-3.5 w-3.5" />}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-56"
                />
                <select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value as any)}
                  className="h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white"
                >
                  <option value="todas">Todos os status</option>
                  {(["rascunho", "enviada", "visualizada", "aceita", "recusada", "expirada"] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2.5 px-4">Número</th>
                  <th className="text-left py-2.5 px-3">Cliente</th>
                  <th className="text-left py-2.5 px-3">Corretor</th>
                  <th className="text-right py-2.5 px-3">Total</th>
                  <th className="text-right py-2.5 px-3">Parcelas</th>
                  <th className="text-left py-2.5 px-3">Status</th>
                  <th className="text-right py-2.5 px-3">Views</th>
                  <th className="text-right py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const corretor = corretores.find((c) => c.id === p.corretor_id);
                  return (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelecionada(p)}>
                      <td className="py-3 px-4 font-mono text-[12px] font-semibold text-slate-900">{p.numero}</td>
                      <td className="px-3">
                        <div className="font-semibold text-slate-900">{p.cliente_nome}</div>
                        <div className="text-[11px] text-slate-500">{p.cliente_email}</div>
                      </td>
                      <td className="px-3 text-slate-600">{corretor?.nome ?? "—"}</td>
                      <td className="text-right px-3 tabular font-semibold">{money(p.total)}</td>
                      <td className="text-right px-3 tabular">{p.parcelas}x</td>
                      <td className="px-3"><Badge tone={statusTone[p.status] as any}>{p.status}</Badge></td>
                      <td className="text-right px-3 tabular text-slate-600">{p.visualizacoes}</td>
                      <td className="text-right px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelecionada(p);
                          }}
                        >
                          Ver
                        </Button>
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
        open={!!selecionada}
        onClose={() => setSelecionada(null)}
        title={selecionada?.numero}
        subtitle={selecionada ? `${selecionada.cliente_nome} • ${selecionada.status}` : ""}
        size="xl"
        footer={
          selecionada && (
            <>
              <Button
                variant="outline"
                leftIcon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => copiarLink(selecionada)}
              >
                Copiar link
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                onClick={() => baixarPDF(selecionada)}
              >
                Baixar PDF
              </Button>
              {selecionada.status === "rascunho" ? (
                <Button
                  leftIcon={<Send className="h-3.5 w-3.5" />}
                  onClick={() => enviarProposta(selecionada)}
                >
                  Enviar ao cliente
                </Button>
              ) : selecionada.status === "enviada" || selecionada.status === "visualizada" ? (
                <Button
                  leftIcon={<Mail className="h-3.5 w-3.5" />}
                  onClick={() => reenviarProposta(selecionada)}
                >
                  Reenviar por email
                </Button>
              ) : (
                <Button onClick={() => setSelecionada(null)}>Fechar</Button>
              )}
            </>
          )
        }
      >
        {selecionada && (
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 rounded-[12px] bg-gradient-to-br from-brand-50 via-aqua-50 to-violet-50 border border-brand-100">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Proposta</div>
                <div className="text-[20px] font-semibold text-slate-900 font-mono">{selecionada.numero}</div>
                <div className="text-[12px] text-slate-600 mt-1">Cliente: {selecionada.cliente_nome}</div>
                <div className="text-[12px] text-slate-600">Email: {selecionada.cliente_email}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-500">Total</div>
                <div className="text-[26px] font-semibold text-slate-900 tabular">{money(selecionada.total)}</div>
                <div className="text-[12px] text-slate-600">em até {selecionada.parcelas}x</div>
              </div>
            </div>

            <Card>
              <CardHeader title="Itens" />
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="text-left py-2.5 px-4">Descrição</th>
                      <th className="text-right py-2.5 px-3">Qtd.</th>
                      <th className="text-right py-2.5 px-3">Unit.</th>
                      <th className="text-right py-2.5 px-3">Desc.</th>
                      <th className="text-right py-2.5 px-4">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selecionada.itens.map((i, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="py-3 px-4">{i.descricao}</td>
                        <td className="text-right px-3 tabular">{i.quantidade}</td>
                        <td className="text-right px-3 tabular">{money(i.preco_unit)}</td>
                        <td className="text-right px-3 tabular">{i.desconto_pct}%</td>
                        <td className="text-right px-4 tabular font-semibold">
                          {money(i.quantidade * i.preco_unit * (1 - i.desconto_pct / 100))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/60">
                    <tr>
                      <td colSpan={4} className="text-right py-2 px-3 text-slate-500">Subtotal</td>
                      <td className="text-right px-4 tabular">{money(selecionada.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right py-2 px-3 text-slate-500">Descontos</td>
                      <td className="text-right px-4 tabular text-rose-600">-{money(selecionada.desconto_total)}</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td colSpan={4} className="text-right py-2 px-3 font-semibold">Total</td>
                      <td className="text-right px-4 tabular font-semibold">{money(selecionada.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            {selecionada.observacoes && (
              <Card>
                <CardBody>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Observações</div>
                  <p className="text-[13px] text-slate-700">{selecionada.observacoes}</p>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardBody>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Linha do tempo</div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Criada em {new Date(selecionada.criada_em).toLocaleString("pt-BR")}</div>
                  {selecionada.enviada_em && <div className="flex items-center gap-2"><Send className="h-3.5 w-3.5 text-sky-500" /> Enviada em {new Date(selecionada.enviada_em).toLocaleString("pt-BR")}</div>}
                  {selecionada.visualizacoes > 0 && <div className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-amber-500" /> Visualizada {selecionada.visualizacoes}x</div>}
                  {selecionada.aceita_em && <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Aceita em {new Date(selecionada.aceita_em).toLocaleString("pt-BR")}</div>}
                  {selecionada.status === "recusada" && <div className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 text-rose-500" /> Recusada</div>}
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </Dialog>

      <Dialog
        open={novaAberta}
        onClose={fecharNova}
        title="Nova proposta"
        subtitle={
          prefill.nome
            ? `Pré-preenchida com dados de ${prefill.nome} (do chat)`
            : "Gera orçamento com link único para o cliente"
        }
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={fecharNova}>Cancelar</Button>
            <Button onClick={fecharNova} leftIcon={<FileText className="h-3.5 w-3.5" />}>Criar rascunho</Button>
            <Button onClick={fecharNova} leftIcon={<Send className="h-3.5 w-3.5" />}>Criar e enviar</Button>
          </>
        }
      >
        <div key={`${prefill.nome}|${prefill.email}`} className="space-y-3 text-[13px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Cliente</label>
              <input defaultValue={prefill.nome} className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" placeholder="Nome do cliente" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Email</label>
              <input defaultValue={prefill.email} className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" placeholder="email@exemplo.com" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Template</label>
            <select defaultValue={prefill.template === "diario" ? "Diário" : "Anual família"} className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white">
              <option>Anual família</option>
              <option>Anual individual</option>
              <option>Diário</option>
              <option>Corporativo</option>
              <option>VIP</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Valor estimado</label>
              <input type="number" defaultValue={prefill.valor || 0} className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Desconto %</label>
              <input type="number" defaultValue={0} className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Parcelas</label>
              <input type="number" defaultValue={12} className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" />
            </div>
          </div>
        </div>
      </Dialog>

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
