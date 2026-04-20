import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Key,
  Link2,
  Plug,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  Webhook as WebhookIcon,
  XCircle,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { number, pct } from "@/lib/format";
import { apiKeys, integracoes, webhooks } from "@/lib/mock";
import type { Integracao } from "@/lib/types";

const catColor: Record<string, string> = {
  ads: "brand",
  comunicacao: "aqua",
  pagamento: "emerald",
  analytics: "violet",
  operacional: "amber",
  automacao: "sky",
};

const statusTone: Record<string, string> = {
  conectado: "emerald",
  desconectado: "slate",
  erro: "rose",
  reautenticar: "amber",
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  conectado: CheckCircle2,
  desconectado: XCircle,
  erro: AlertTriangle,
  reautenticar: RefreshCw,
};

export function Integracoes() {
  const [tab, setTab] = useState<"integracoes" | "apis" | "webhooks">("integracoes");
  const [novaKey, setNovaKey] = useState(false);
  const [novoWebhook, setNovoWebhook] = useState(false);
  const [conectando, setConectando] = useState<Integracao | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const syncNow = (i: Integracao) => {
    showToast(`Sync disparado para ${i.nome}`);
  };
  const reautenticar = (i: Integracao) => {
    setConectando(i);
    showToast(`Reautenticação iniciada em ${i.nome}`);
  };
  const resolverErro = (i: Integracao) => {
    setConectando(i);
    showToast(`Abrindo diagnóstico de ${i.nome}`);
  };
  const copiarApiKey = (prefixo: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${prefixo}${"•".repeat(32)}`);
    }
    showToast(`Chave ${prefixo}… copiada`);
  };

  const conectadas = integracoes.filter((i) => i.status === "conectado").length;
  const problemas = integracoes.filter((i) => i.status === "erro" || i.status === "reautenticar").length;
  const eventos24h = integracoes.reduce((s, i) => s + i.eventos_24h, 0);

  return (
    <>
      <PageHeader
        title="Integrações & API"
        subtitle="Conecte Meta Ads, pagamento, comunicação. Expose API pública + webhooks para ecossistema."
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => tab === "apis" ? setNovaKey(true) : setNovoWebhook(true)}>
            {tab === "integracoes" ? "Nova integração" : tab === "apis" ? "Nova API key" : "Novo webhook"}
          </Button>
        }
        tabs={
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as any)}
            tabs={[
              { id: "integracoes", label: "Integrações", count: integracoes.length },
              { id: "apis", label: "API keys", count: apiKeys.length },
              { id: "webhooks", label: "Webhooks", count: webhooks.length },
            ]}
          />
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center"><Plug className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Conectadas</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{conectadas}<span className="text-slate-400 font-normal text-[14px]"> / {integracoes.length}</span></div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-rose-50 text-rose-600 inline-flex items-center justify-center"><AlertTriangle className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Com problemas</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{problemas}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center"><Zap className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Eventos 24h</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{number(eventos24h)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center"><Shield className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">API keys ativas</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{apiKeys.filter((k) => k.ativa).length}</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {tab === "integracoes" && (
          <div className="grid grid-cols-3 gap-4">
            {integracoes.map((i) => {
              const Icon = statusIcon[i.status];
              return (
                <Card key={i.id} className="hover:shadow-pop transition">
                  <CardBody>
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-11 w-11 rounded-[12px] bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 inline-flex items-center justify-center font-bold text-slate-700 uppercase text-[11px]">
                        {i.nome.slice(0, 2)}
                      </div>
                      <Badge tone={statusTone[i.status] as any} dot>
                        <Icon className="h-3 w-3" /> {i.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="text-[14px] font-semibold text-slate-900">{i.nome}</h3>
                      <Badge tone={catColor[i.categoria] as any} className="text-[10px]">{i.categoria}</Badge>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2">{i.descricao}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                      <div>
                        <div className="text-slate-400">Eventos 24h</div>
                        <div className="font-semibold tabular text-slate-900">{number(i.eventos_24h)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Último sync</div>
                        <div className="font-semibold tabular text-slate-900">
                          {i.ultimo_sync ? new Date(i.ultimo_sync).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      {i.status === "conectado" ? (
                        <>
                          <Button size="sm" variant="outline" leftIcon={<Settings className="h-3.5 w-3.5" />} onClick={() => setConectando(i)} className="flex-1">
                            Configurar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                            onClick={() => syncNow(i)}
                          >
                            Sync
                          </Button>
                        </>
                      ) : i.status === "reautenticar" ? (
                        <Button
                          size="sm"
                          className="w-full"
                          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                          onClick={() => reautenticar(i)}
                        >
                          Reautenticar
                        </Button>
                      ) : i.status === "erro" ? (
                        <Button
                          size="sm"
                          variant="danger"
                          className="w-full"
                          leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}
                          onClick={() => resolverErro(i)}
                        >
                          Resolver erro
                        </Button>
                      ) : (
                        <Button size="sm" className="w-full" leftIcon={<Plug className="h-3.5 w-3.5" />} onClick={() => setConectando(i)}>
                          Conectar
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "apis" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2.5 px-4">Nome</th>
                    <th className="text-left py-2.5 px-3">Ambiente</th>
                    <th className="text-left py-2.5 px-3">Prefixo</th>
                    <th className="text-left py-2.5 px-3">Escopos</th>
                    <th className="text-left py-2.5 px-3">Criada por</th>
                    <th className="text-right py-2.5 px-3">Último uso</th>
                    <th className="text-right py-2.5 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="border-t border-slate-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Key className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-900">{k.nome}</span>
                          {!k.ativa && <Badge tone="slate">inativa</Badge>}
                        </div>
                      </td>
                      <td className="px-3">
                        <Badge tone={k.ambiente === "producao" ? "emerald" : "amber"}>{k.ambiente}</Badge>
                      </td>
                      <td className="px-3 font-mono text-[11px] text-slate-600">{k.prefixo}</td>
                      <td className="px-3">
                        <div className="flex flex-wrap gap-1">
                          {k.escopos.map((e) => (
                            <Badge key={e} tone="slate" className="text-[10px]">{e}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 text-slate-600">{k.criada_por}</td>
                      <td className="text-right px-3 text-slate-500 text-[11px]">
                        {k.ultimo_uso ? new Date(k.ultimo_uso).toLocaleDateString("pt-BR") : "nunca"}
                      </td>
                      <td className="text-right px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Copy className="h-3.5 w-3.5" />}
                          onClick={() => copiarApiKey(k.prefixo)}
                        >
                          Copiar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "webhooks" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2.5 px-4">Nome</th>
                    <th className="text-left py-2.5 px-3">URL</th>
                    <th className="text-left py-2.5 px-3">Eventos</th>
                    <th className="text-left py-2.5 px-3">Último disparo</th>
                    <th className="text-right py-2.5 px-3">Taxa sucesso</th>
                    <th className="text-right py-2.5 px-4">Ativo</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((w) => (
                    <tr key={w.id} className="border-t border-slate-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <WebhookIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-900">{w.nome}</span>
                        </div>
                      </td>
                      <td className="px-3 font-mono text-[11px] text-slate-600 max-w-[280px] truncate">{w.url}</td>
                      <td className="px-3">
                        <div className="flex flex-wrap gap-1">
                          {w.eventos.map((e) => (
                            <Badge key={e} tone="brand" className="text-[10px]">{e}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 text-slate-500 text-[11px]">
                        <Badge tone={w.status_ultimo === "sucesso" ? "emerald" : w.status_ultimo === "falha" ? "rose" : "slate"}>
                          {w.status_ultimo}
                        </Badge>
                        {w.ultimo_disparo && (
                          <span className="ml-2">{new Date(w.ultimo_disparo).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </td>
                      <td className="text-right px-3 tabular">{pct(w.taxa_sucesso)}</td>
                      <td className="text-right px-4">
                        <div className={cn("h-6 w-11 rounded-full inline-block relative", w.ativo ? "bg-emerald-500" : "bg-slate-300")}>
                          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft", w.ativo ? "right-0.5" : "left-0.5")} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </PageContent>

      <Dialog
        open={!!conectando}
        onClose={() => setConectando(null)}
        title={`Conectar ${conectando?.nome}`}
        subtitle={conectando?.descricao}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setConectando(null)}>Cancelar</Button>
            <Button onClick={() => setConectando(null)} leftIcon={<Plug className="h-3.5 w-3.5" />}>Autorizar via OAuth</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <p className="text-slate-600">
            Você será redirecionado para o login de {conectando?.nome}. Ao autorizar, as permissões abaixo serão concedidas ao Aquapark CRM.
          </p>
          <div className="space-y-1.5">
            {["Ler dados", "Criar conteúdo", "Atualizar status", "Receber webhooks"].map((p) => (
              <div key={p} className="flex items-center gap-2 text-[12px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </Dialog>

      <Dialog
        open={novaKey}
        onClose={() => setNovaKey(false)}
        title="Nova API key"
        subtitle="Gere chave para integrações server-to-server"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovaKey(false)}>Cancelar</Button>
            <Button onClick={() => setNovaKey(false)} leftIcon={<Key className="h-3.5 w-3.5" />}>Gerar chave</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Nome</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" placeholder="Ex: Landing page abril" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Ambiente</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white">
                <option>producao</option>
                <option>sandbox</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Expira em</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white">
                <option>30 dias</option>
                <option>90 dias</option>
                <option>1 ano</option>
                <option>sem expiração</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Escopos</label>
            <div className="flex flex-wrap gap-1.5">
              {["leads.read", "leads.write", "propostas.read", "propostas.write", "passaportes.read"].map((s) => (
                <Badge key={s} tone="slate" className="cursor-pointer hover:bg-brand-50">{s}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={novoWebhook}
        onClose={() => setNovoWebhook(false)}
        title="Novo webhook"
        subtitle="Envie eventos HTTP POST para URL de destino"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovoWebhook(false)}>Cancelar</Button>
            <Button onClick={() => setNovoWebhook(false)} leftIcon={<WebhookIcon className="h-3.5 w-3.5" />}>Criar webhook</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Nome</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" placeholder="Ex: Slack #vendas" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">URL</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] font-mono" placeholder="https://…" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Eventos</label>
            <div className="flex flex-wrap gap-1.5">
              {["lead.criado", "lead.qualificado", "lead.fechado", "proposta.aceita", "passaporte.emitido", "alerta.critico"].map((e) => (
                <Badge key={e} tone="slate" className="cursor-pointer hover:bg-brand-50">{e}</Badge>
              ))}
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
