import { useMemo, useState } from "react";
import {
  Copy,
  Download,
  Filter,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trash2,
  Users,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { money, number, pct } from "@/lib/format";
import { segmentos } from "@/lib/mock";
import type { Segmento } from "@/lib/types";

const camposDisponiveis = [
  { id: "score", label: "Score do lead" },
  { id: "canal", label: "Canal de origem" },
  { id: "status", label: "Status" },
  { id: "tem_crianca", label: "Tem criança" },
  { id: "num_pessoas", label: "Nº pessoas" },
  { id: "valor_estimado", label: "Valor estimado" },
  { id: "dias_restantes", label: "Dias p/ vencer" },
  { id: "visitas_ano", label: "Visitas no ano" },
  { id: "nps", label: "NPS" },
  { id: "tipo", label: "Tipo de passaporte" },
];

const operadorLabels: Record<string, string> = {
  igual: "é igual a",
  diferente: "é diferente de",
  contem: "contém",
  nao_contem: "não contém",
  maior: "é maior que",
  menor: "é menor que",
  entre: "entre",
  existe: "existe",
};

export function Segmentos() {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | Segmento["tipo"]>("todos");
  const [selecionado, setSelecionado] = useState<Segmento | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);

  const filtered = useMemo(() => {
    return segmentos.filter((s) => {
      if (busca && !s.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (tipoFiltro !== "todos" && s.tipo !== tipoFiltro) return false;
      return true;
    });
  }, [busca, tipoFiltro]);

  const totalAudiencia = segmentos.reduce((s, x) => s + x.tamanho, 0);
  const ltvMedio = segmentos.reduce((s, x) => s + x.ltv_medio, 0) / segmentos.length;

  return (
    <>
      <PageHeader
        title="Segmentos & audiências"
        subtitle="Listas dinâmicas com query builder. Sincronizam com Meta Ads e fluxos de automação."
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />}>Exportar CSV</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNovoAberto(true)}>
              Novo segmento
            </Button>
          </>
        }
      />
      <PageContent>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center"><Users className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Audiência total</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{number(totalAudiencia)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center"><Target className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">LTV médio</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{money(ltvMedio)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center"><Sparkles className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Segmentos dinâmicos</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{segmentos.length}</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Buscar segmento"
            leftIcon={<Search className="h-3.5 w-3.5" />}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-64"
          />
          <div className="flex gap-1.5">
            {(["todos", "lead", "cliente", "visitante"] as const).map((t) => (
              <Button key={t} size="sm" variant={tipoFiltro === t ? "primary" : "outline"} onClick={() => setTipoFiltro(t)}>
                {t}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} className="hover:shadow-pop transition cursor-pointer" onClick={() => setSelecionado(s)}>
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <Badge tone={s.cor}>{s.tipo}</Badge>
                  <span className="text-[11px] text-slate-400">atualizado {new Date(s.atualizado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900">{s.nome}</h3>
                <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{s.descricao}</p>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <div>
                    <div className="text-slate-400">Tamanho</div>
                    <div className="font-semibold tabular text-slate-900">{number(s.tamanho)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">LTV</div>
                    <div className="font-semibold tabular text-slate-900">{money(s.ltv_medio)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Conv.</div>
                    <div className="font-semibold tabular text-emerald-600">{pct(s.conversao_pct)}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {s.regras.slice(0, 3).map((r, idx) => (
                    <Badge key={idx} tone="slate" className="text-[10px]">
                      {r.campo} {operadorLabels[r.operador]} {String(r.valor)}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </PageContent>

      <Dialog
        open={!!selecionado}
        onClose={() => setSelecionado(null)}
        title={selecionado?.nome}
        subtitle={selecionado?.descricao}
        size="lg"
        footer={
          <>
            <Button variant="outline" leftIcon={<Copy className="h-3.5 w-3.5" />}>Duplicar</Button>
            <Button variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />}>Sincronizar Meta Ads</Button>
            <Button onClick={() => setSelecionado(null)}>Fechar</Button>
          </>
        }
      >
        {selecionado && (
          <div className="space-y-4 text-[13px]">
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardBody className="py-3 text-center">
                  <div className="text-[11px] text-slate-500">Registros</div>
                  <div className="text-[22px] font-semibold text-slate-900 tabular">{number(selecionado.tamanho)}</div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3 text-center">
                  <div className="text-[11px] text-slate-500">LTV médio</div>
                  <div className="text-[22px] font-semibold text-slate-900 tabular">{money(selecionado.ltv_medio)}</div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3 text-center">
                  <div className="text-[11px] text-slate-500">Conversão</div>
                  <div className="text-[22px] font-semibold text-emerald-600 tabular">{pct(selecionado.conversao_pct)}</div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader
                title="Regras"
                subtitle={`Lógica: ${selecionado.logica.toUpperCase()}`}
              />
              <CardBody className="space-y-2">
                {selecionado.regras.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-[10px] bg-slate-50 border border-slate-100">
                    <Badge tone="brand" className="font-mono text-[10px]">{r.campo}</Badge>
                    <span className="text-slate-500">{operadorLabels[r.operador]}</span>
                    <Badge tone="violet" className="font-mono text-[10px]">{String(r.valor)}</Badge>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        )}
      </Dialog>

      <Dialog
        open={novoAberto}
        onClose={() => setNovoAberto(false)}
        title="Novo segmento"
        subtitle="Crie audiências dinâmicas com regras encadeadas"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovoAberto(false)}>Cancelar</Button>
            <Button onClick={() => setNovoAberto(false)} leftIcon={<Filter className="h-3.5 w-3.5" />}>Salvar e calcular</Button>
          </>
        }
      >
        <div className="space-y-4 text-[13px]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Nome</label>
              <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" placeholder="Ex: Pais engajados IG" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Tipo</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white">
                <option>lead</option>
                <option>cliente</option>
                <option>visitante</option>
              </select>
            </div>
          </div>

          <div>
            <div className="text-[12px] font-medium text-slate-700 mb-2">Regras (AND)</div>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-[10px] border border-slate-200 bg-slate-50/60">
                  <select className="h-8 rounded-[8px] border border-slate-200 px-2 text-[12px] bg-white flex-1">
                    {camposDisponiveis.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <select className="h-8 rounded-[8px] border border-slate-200 px-2 text-[12px] bg-white">
                    {Object.entries(operadorLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input className="h-8 rounded-[8px] border border-slate-200 px-2 text-[12px] w-32" placeholder="valor" />
                  <button className="text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />}>Adicionar regra</Button>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-brand-50 to-aqua-50 border-brand-100">
            <CardBody className="py-3 flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <div className="text-[12px] text-slate-700">
                <span className="font-semibold text-slate-900">Preview:</span> aproximadamente <b>142</b> registros vão atender essas regras.
              </div>
            </CardBody>
          </Card>
        </div>
      </Dialog>
    </>
  );
}
