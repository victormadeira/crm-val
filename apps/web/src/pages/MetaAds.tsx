import { useMemo, useState } from "react";
import {
  BarChart3,
  Flame,
  Image as ImageIcon,
  Layers,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { money, number, pct } from "@/lib/format";
import { metaAdSets, metaCampanhas, metaCriativos, metaLeadForms } from "@/lib/mock";

type Tab = "campanhas" | "criativos" | "publicos" | "forms";

const statusTone: Record<string, string> = {
  ativa: "emerald",
  pausada: "amber",
  finalizada: "slate",
  rascunho: "slate",
};

const fadigaTone: Record<string, string> = {
  baixa: "emerald",
  media: "amber",
  alta: "rose",
};

const perfTone: Record<string, string> = {
  ganhador: "emerald",
  medio: "amber",
  ruim: "rose",
};

export function MetaAds() {
  const [tab, setTab] = useState<Tab>("campanhas");
  const [novaCampAberta, setNovaCampAberta] = useState(false);
  const [criativoSelecionado, setCriativoSelecionado] = useState<string | null>(null);
  const [pausadas, setPausadas] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const sincronizar = () => {
    showToast("Sync com Meta Ads iniciado");
  };
  const duplicarCriativo = (nome: string) => {
    showToast(`Criativo "${nome}" duplicado`);
  };

  const investido = metaCampanhas.reduce((s, c) => s + c.investido_total, 0);
  const receita = metaCampanhas.reduce((s, c) => s + c.receita, 0);
  const leadsTot = metaCampanhas.reduce((s, c) => s + c.leads, 0);
  const vendas = metaCampanhas.reduce((s, c) => s + c.vendas, 0);
  const roas = investido > 0 ? receita / investido : 0;
  const cplMedio = leadsTot > 0 ? investido / leadsTot : 0;

  const chartData = useMemo(
    () =>
      metaCampanhas.map((c) => ({
        nome: c.nome.length > 18 ? c.nome.slice(0, 18) + "…" : c.nome,
        CPL: Math.round(c.cpl),
        ROAS: Number(c.roas.toFixed(1)),
        Leads: c.leads,
      })),
    []
  );

  const toggleStatus = (id: string) => {
    setPausadas((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const criativoDetalhe = metaCriativos.find((c) => c.id === criativoSelecionado);

  return (
    <>
      <PageHeader
        title="Meta Ads — campanhas e criativos"
        subtitle="Instagram + Facebook + Messenger unificados. Lead forms sincronizando direto no CRM."
        actions={
          <>
            <Badge tone="emerald" dot>Sincronizado há 8 min</Badge>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={sincronizar}
            >
              Sincronizar
            </Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNovaCampAberta(true)}>
              Nova campanha
            </Button>
          </>
        }
        tabs={
          <Tabs
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            tabs={[
              { id: "campanhas", label: "Campanhas" },
              { id: "criativos", label: "Criativos" },
              { id: "publicos", label: "Ad Sets / Públicos" },
              { id: "forms", label: "Lead Forms" },
            ]}
          />
        }
      />
      <PageContent>
        <div className="grid grid-cols-5 gap-3 mb-5">
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Investido 30d</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{money(investido)}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><Wallet className="h-3 w-3" /> orçamento ativo</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Receita atribuída</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{money(receita)}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><TrendingUp className="h-3 w-3" /> +18% vs. mês ant.</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">ROAS médio</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{roas.toFixed(1)}x</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><Zap className="h-3 w-3" /> meta: 6x</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Leads gerados</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{number(leadsTot)}</div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1"><Target className="h-3 w-3" /> CPL {money(cplMedio)}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Vendas geradas</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{number(vendas)}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><Flame className="h-3 w-3" /> conv. {pct(vendas / Math.max(leadsTot, 1))}</div>
            </CardBody>
          </Card>
        </div>

        {tab === "campanhas" && (
          <>
            <Card className="mb-4">
              <CardHeader title="Performance por campanha" subtitle="CPL vs. ROAS" />
              <CardBody>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="CPL" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                      <Bar yAxisId="right" dataKey="ROAS" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="text-left py-2.5 px-4">Campanha</th>
                      <th className="text-left py-2.5 px-3">Status</th>
                      <th className="text-right py-2.5 px-3">Invest.</th>
                      <th className="text-right py-2.5 px-3">Impres.</th>
                      <th className="text-right py-2.5 px-3">CTR</th>
                      <th className="text-right py-2.5 px-3">CPL</th>
                      <th className="text-right py-2.5 px-3">Leads</th>
                      <th className="text-right py-2.5 px-3">Vendas</th>
                      <th className="text-right py-2.5 px-3">ROAS</th>
                      <th className="text-right py-2.5 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {metaCampanhas.map((c) => {
                      const isPausada = pausadas.has(c.id) ? true : c.status === "pausada";
                      return (
                        <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{c.nome}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{c.publico} • {c.plataforma.join(" / ")}</div>
                          </td>
                          <td className="px-3">
                            <Badge tone={statusTone[isPausada ? "pausada" : c.status] as any}>
                              {isPausada ? "pausada" : c.status}
                            </Badge>
                          </td>
                          <td className="text-right px-3 tabular">{money(c.investido_total)}</td>
                          <td className="text-right px-3 tabular">{number(c.impressoes)}</td>
                          <td className="text-right px-3 tabular">{c.ctr.toFixed(2)}%</td>
                          <td className="text-right px-3 tabular">{money(c.cpl)}</td>
                          <td className="text-right px-3 tabular">{c.leads}</td>
                          <td className="text-right px-3 tabular">{c.vendas}</td>
                          <td className="text-right px-3 tabular font-semibold text-emerald-600">{c.roas.toFixed(1)}x</td>
                          <td className="text-right px-4">
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={isPausada ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                              onClick={() => toggleStatus(c.id)}
                            >
                              {isPausada ? "Ativar" : "Pausar"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {tab === "criativos" && (
          <div className="grid grid-cols-3 gap-4">
            {metaCriativos.map((cr) => (
              <Card key={cr.id} className="overflow-hidden group hover:shadow-pop transition cursor-pointer" onClick={() => setCriativoSelecionado(cr.id)}>
                <div className="h-36 bg-gradient-to-br from-brand-400 via-aqua-400 to-violet-400 relative flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-white/80" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge tone={perfTone[cr.performance] as any}>{cr.performance}</Badge>
                    <Badge tone="slate" className="bg-white/90 text-slate-700">{cr.tipo}</Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge tone={fadigaTone[cr.fadiga] as any}>fadiga {cr.fadiga}</Badge>
                  </div>
                </div>
                <CardBody className="py-3">
                  <div className="text-[13px] font-semibold text-slate-900 line-clamp-1">{cr.nome}</div>
                  <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{cr.copy_principal}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                    <div>
                      <div className="text-slate-400">CPL</div>
                      <div className="font-semibold tabular text-slate-900">{money(cr.cpl)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">CTR</div>
                      <div className="font-semibold tabular text-slate-900">{cr.ctr.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Hook</div>
                      <div className="font-semibold tabular text-slate-900">{cr.hook_rate}%</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {tab === "publicos" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2.5 px-4">Ad Set</th>
                    <th className="text-left py-2.5 px-3">Público</th>
                    <th className="text-left py-2.5 px-3">Idade</th>
                    <th className="text-left py-2.5 px-3">Localização</th>
                    <th className="text-right py-2.5 px-3">Orçamento/dia</th>
                    <th className="text-right py-2.5 px-3">Leads</th>
                    <th className="text-right py-2.5 px-4">CPL</th>
                  </tr>
                </thead>
                <tbody>
                  {metaAdSets.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{a.nome}</td>
                      <td className="px-3 text-slate-600">{a.publico}</td>
                      <td className="px-3">{a.faixa_etaria}</td>
                      <td className="px-3 text-slate-600">{a.localizacao.join(", ")}</td>
                      <td className="text-right px-3 tabular">{money(a.orcamento_diario)}</td>
                      <td className="text-right px-3 tabular">{a.leads}</td>
                      <td className="text-right px-4 tabular">{money(a.cpl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "forms" && (
          <div className="grid grid-cols-3 gap-4">
            {metaLeadForms.map((f) => (
              <Card key={f.id}>
                <CardHeader
                  title={f.nome}
                  subtitle={`${f.campos.length} campos • ${f.ativo ? "ativo" : "inativo"}`}
                  action={<Badge tone={f.ativo ? "emerald" : "slate"}>{f.ativo ? "ativo" : "inativo"}</Badge>}
                />
                <CardBody>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[11px] text-slate-400">Total leads</div>
                      <div className="text-[18px] font-semibold tabular text-slate-900">{f.total_leads}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Qualificados</div>
                      <div className="text-[18px] font-semibold tabular text-emerald-600">{f.qualificados}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1">Taxa de conclusão</div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-aqua-500" style={{ width: `${f.taxa_conclusao * 100}%` }} />
                  </div>
                  <div className="mt-2 text-[12px] tabular text-slate-700">{pct(f.taxa_conclusao)}</div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {f.campos.map((c) => (
                      <Badge key={c} tone="slate" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      <Dialog
        open={novaCampAberta}
        onClose={() => setNovaCampAberta(false)}
        title="Nova campanha"
        subtitle="Crie direto do CRM — sincroniza no Ads Manager"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovaCampAberta(false)}>Cancelar</Button>
            <Button onClick={() => setNovaCampAberta(false)} leftIcon={<Sparkles className="h-3.5 w-3.5" />}>Criar campanha</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Nome da campanha</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-brand-500" placeholder="Ex: Passaporte Anual — Pais 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Objetivo</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white">
                <option>Lead generation</option>
                <option>Conversions</option>
                <option>Messages</option>
                <option>Traffic</option>
                <option>Reach</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Orçamento diário (R$)</label>
              <input type="number" defaultValue={150} className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Plataformas</label>
            <div className="flex gap-2">
              {(["instagram", "facebook", "messenger", "audience_network"] as const).map((p) => (
                <Badge key={p} tone={p === "instagram" || p === "facebook" ? "brand" : "slate"} className="cursor-pointer px-2.5 py-1">{p}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!criativoDetalhe}
        onClose={() => setCriativoSelecionado(null)}
        title={criativoDetalhe?.nome}
        subtitle={criativoDetalhe?.copy_principal}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setCriativoSelecionado(null)}>Fechar</Button>
            <Button
              leftIcon={<Layers className="h-3.5 w-3.5" />}
              onClick={() => {
                if (criativoDetalhe) duplicarCriativo(criativoDetalhe.nome);
                setCriativoSelecionado(null);
              }}
            >
              Duplicar criativo
            </Button>
          </>
        }
      >
        {criativoDetalhe && (
          <div className="space-y-4 text-[13px]">
            <div className="h-48 rounded-[12px] bg-gradient-to-br from-brand-400 via-aqua-400 to-violet-400 flex items-center justify-center">
              <ImageIcon className="h-14 w-14 text-white/80" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <div className="text-[11px] text-slate-400">Impressões</div>
                <div className="font-semibold tabular text-slate-900">{number(criativoDetalhe.impressoes)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">CTR</div>
                <div className="font-semibold tabular text-slate-900">{criativoDetalhe.ctr.toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">CPL</div>
                <div className="font-semibold tabular text-slate-900">{money(criativoDetalhe.cpl)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Hook rate</div>
                <div className="font-semibold tabular text-slate-900">{criativoDetalhe.hook_rate}%</div>
              </div>
            </div>
            <div className="p-3 rounded-[10px] bg-violet-50 border border-violet-100">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 mb-1">
                <Sparkles className="h-3 w-3" /> Diagnóstico IA
              </div>
              <p className="text-[12px] text-slate-700 leading-relaxed">
                Este criativo está com fadiga {criativoDetalhe.fadiga}. Hook rate de {criativoDetalhe.hook_rate}% indica
                {criativoDetalhe.hook_rate > 55 ? " excelente retenção inicial" : " abertura fraca — troque os 3 primeiros segundos."}
                {criativoDetalhe.fadiga === "alta" && " Sugerido pausar e rodar variação."}
              </p>
            </div>
          </div>
        )}
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
