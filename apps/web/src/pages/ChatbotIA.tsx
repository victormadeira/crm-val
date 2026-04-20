import { useState } from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  Instagram as IGIcon,
  MessageCircle,
  Power,
  Settings2,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { pct, relativeTime } from "@/lib/format";
import { botConfigs, botConversas } from "@/lib/mock";
import type { BotConfig } from "@/lib/types";

export function ChatbotIA() {
  const [tab, setTab] = useState<"bots" | "conversas" | "base">("bots");
  const [sel, setSel] = useState<BotConfig | null>(null);
  const [ativos, setAtivos] = useState<Set<string>>(new Set(botConfigs.filter((b) => b.ativo).map((b) => b.id)));

  const toggle = (id: string) => {
    setAtivos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalAtivas = botConfigs.reduce((s, b) => s + b.conversas_ativas, 0);
  const avgResolucao = botConfigs.reduce((s, b) => s + b.taxa_resolucao, 0) / botConfigs.length;
  const avgCsat = botConfigs.reduce((s, b) => s + b.csat, 0) / botConfigs.length;

  return (
    <>
      <PageHeader
        title="Chatbot IA"
        subtitle="Atendimento 24/7 via WhatsApp e Instagram. Handoff inteligente para humanos."
        tabs={
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as any)}
            tabs={[
              { id: "bots", label: "Bots", count: botConfigs.length },
              { id: "conversas", label: "Conversas", count: botConversas.length },
              { id: "base", label: "Base conhecimento" },
            ]}
          />
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Conversas ativas</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{totalAtivas}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Taxa resolução</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{pct(avgResolucao)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">CSAT médio</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{avgCsat.toFixed(1)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-amber-50 text-amber-600 inline-flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Economia mensal</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">R$ 18,4k</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {tab === "bots" && (
          <div className="grid grid-cols-2 gap-4">
            {botConfigs.map((b) => {
              const Icon = b.canal === "instagram" ? IGIcon : MessageCircle;
              const ativo = ativos.has(b.id);
              return (
                <Card key={b.id} className={cn("transition", ativo && "ring-2 ring-brand-100")}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-[12px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-[14px]">{b.nome}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Icon className="h-3 w-3" /> {b.canal} · {b.horario.replace("_", "/")}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggle(b.id)}
                        className={cn("h-6 w-11 rounded-full relative transition", ativo ? "bg-emerald-500" : "bg-slate-300")}
                      >
                        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-all", ativo ? "right-0.5" : "left-0.5")} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-slate-100">
                      <div>
                        <div className="text-[11px] text-slate-400">Ativas</div>
                        <div className="text-[16px] font-semibold tabular">{b.conversas_ativas}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Resolução</div>
                        <div className="text-[16px] font-semibold tabular text-emerald-600">{pct(b.taxa_resolucao)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Handoff</div>
                        <div className="text-[16px] font-semibold tabular text-amber-600">{pct(b.taxa_handoff)}</div>
                      </div>
                    </div>
                    <div className="pt-3 text-[12px] text-slate-600 line-clamp-2 mb-3">
                      <span className="font-semibold text-slate-700">Persona:</span> {b.persona}
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" leftIcon={<Settings2 className="h-3.5 w-3.5" />} onClick={() => setSel(b)} className="flex-1">
                        Configurar
                      </Button>
                      <Button size="sm" variant="outline" leftIcon={<Brain className="h-3.5 w-3.5" />}>
                        Treinar
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "conversas" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2.5 px-4">Canal</th>
                    <th className="text-left py-2.5 px-3">Lead</th>
                    <th className="text-left py-2.5 px-3">Status</th>
                    <th className="text-left py-2.5 px-3">Intenção</th>
                    <th className="text-right py-2.5 px-3">Msgs (bot/humano)</th>
                    <th className="text-right py-2.5 px-3">Duração</th>
                    <th className="text-right py-2.5 px-4">Iniciada</th>
                  </tr>
                </thead>
                <tbody>
                  {botConversas.map((c) => {
                    const Icon = c.canal === "instagram" ? IGIcon : MessageCircle;
                    return (
                      <tr key={c.id} className="border-t border-slate-100">
                        <td className="py-3 px-4"><Icon className="h-4 w-4 text-slate-500 inline mr-1" /> {c.canal}</td>
                        <td className="px-3 font-mono text-[11px]">{c.lead_id ?? "—"}</td>
                        <td className="px-3">
                          <Badge tone={c.status === "resolvida_bot" ? "emerald" : c.status === "handoff" ? "amber" : c.status === "ativa" ? "sky" : "slate"}>
                            {c.status.replace("_", " ")}
                          </Badge>
                          {c.handoff_motivo && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{c.handoff_motivo}</div>
                          )}
                        </td>
                        <td className="px-3 text-slate-600">{c.intencao_detectada.replace(/_/g, " ")}</td>
                        <td className="text-right px-3 tabular">{c.mensagens_bot} / {c.mensagens_humano}</td>
                        <td className="text-right px-3 tabular">{Math.floor(c.duracao_s / 60)}min {c.duracao_s % 60}s</td>
                        <td className="text-right px-4 text-[11px] text-slate-500">{relativeTime(c.iniciada_em)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "base" && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { titulo: "FAQ operacional", docs: 42, ultima: "2d" },
              { titulo: "Preços e pacotes", docs: 18, ultima: "5h" },
              { titulo: "Política de cancelamento", docs: 4, ultima: "12d" },
              { titulo: "Atrações e idade mínima", docs: 32, ultima: "6h" },
            ].map((b) => (
              <Card key={b.titulo}>
                <CardHeader title={b.titulo} subtitle={`${b.docs} documentos · atualizada há ${b.ultima}`} />
                <CardBody className="flex gap-2">
                  <Button size="sm" variant="outline" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>Testar chat</Button>
                  <Button size="sm" variant="outline">Gerenciar fontes</Button>
                  <Button size="sm" variant="outline" leftIcon={<Zap className="h-3.5 w-3.5" />}>Re-embedar</Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      <Dialog
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel && `Configurar ${sel.nome}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setSel(null)}>Cancelar</Button>
            <Button onClick={() => setSel(null)} leftIcon={<Power className="h-3.5 w-3.5" />}>Salvar & reimplantar</Button>
          </>
        }
      >
        {sel && (
          <div className="space-y-3 text-[13px]">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Persona / tom</label>
              <textarea defaultValue={sel.persona} className="w-full rounded-[10px] border border-slate-200 p-3 text-[13px] min-h-[80px]" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Base de conhecimento</label>
              <div className="flex flex-wrap gap-1.5">
                {sel.base_conhecimento.map((b) => (
                  <Badge key={b} tone="aqua">{b}</Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Regras de handoff</label>
              <ul className="space-y-1">
                {sel.handoff_regras.map((r) => (
                  <li key={r} className="flex items-center gap-2 text-[12px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
