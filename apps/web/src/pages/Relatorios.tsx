import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  Copy,
  Download,
  Edit,
  FileBarChart,
  Filter,
  Gauge,
  LineChart as LineIcon,
  Mail,
  Pencil,
  PieChart as PieIcon,
  Plus,
  Sparkles,
  Star,
  Table as TableIcon,
  Target,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { relatorios } from "@/lib/mock";
import type { RelatorioCustomizado, RelatorioVisual } from "@/lib/types";

const visualIcon: Record<RelatorioVisual, React.ComponentType<{ className?: string }>> = {
  tabela: TableIcon,
  barra: BarChart3,
  linha: LineIcon,
  pizza: PieIcon,
  funil: Target,
  kpi: Gauge,
};

const fonteLabel: Record<string, string> = {
  leads: "Leads",
  vendas: "Vendas",
  corretores: "Corretores",
  campanhas: "Campanhas",
  tickets: "Tickets SAC",
  passaportes: "Passaportes",
};

export function Relatorios() {
  const [busca, setBusca] = useState("");
  const [apenasFav, setApenasFav] = useState(false);
  const [detalhe, setDetalhe] = useState<RelatorioCustomizado | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);

  const filtered = useMemo(() => {
    return relatorios.filter((r) => {
      if (busca && !r.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (apenasFav && !r.favorito) return false;
      return true;
    });
  }, [busca, apenasFav]);

  const favoritos = relatorios.filter((r) => r.favorito).length;
  const agendados = relatorios.filter((r) => r.agendado).length;

  return (
    <>
      <PageHeader
        title="Relatórios customizados"
        subtitle="Combine qualquer métrica. Agende entrega por e-mail. Export CSV e compartilhe."
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNovoAberto(true)}>
            Novo relatório
          </Button>
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center"><FileBarChart className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Relatórios salvos</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{relatorios.length}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-amber-50 text-amber-600 inline-flex items-center justify-center"><Star className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Favoritos</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{favoritos}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center"><CalendarClock className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Agendados</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{agendados}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center"><Mail className="h-5 w-5" /></div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Entregas 30d</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">84</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Buscar relatório"
            leftIcon={<Filter className="h-3.5 w-3.5" />}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-64"
          />
          <Button size="sm" variant={apenasFav ? "primary" : "outline"} leftIcon={<Star className="h-3.5 w-3.5" />} onClick={() => setApenasFav((v) => !v)}>
            Apenas favoritos
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {filtered.map((r) => {
            const Icon = visualIcon[r.visual];
            return (
              <Card key={r.id} className="hover:shadow-pop transition">
                <CardBody>
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-10 w-10 rounded-[10px] bg-gradient-to-br from-brand-500 to-aqua-500 text-white inline-flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      {r.favorito && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                      {r.agendado && <Badge tone="violet" className="text-[10px]">{r.agendado}</Badge>}
                    </div>
                  </div>
                  <h3 className="text-[14px] font-semibold text-slate-900">{r.nome}</h3>
                  <p className="text-[12px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{r.descricao}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    <Badge tone="slate" className="text-[10px]">{fonteLabel[r.fonte]}</Badge>
                    <Badge tone="aqua" className="text-[10px]">{r.visual}</Badge>
                    {r.metricas.slice(0, 2).map((m) => (
                      <Badge key={m} tone="brand" className="text-[10px]">{m}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="outline" leftIcon={<BarChart3 className="h-3.5 w-3.5" />} onClick={() => setDetalhe(r)} className="flex-1">
                      Abrir
                    </Button>
                    <Button size="sm" variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />}>CSV</Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </PageContent>

      <Dialog
        open={!!detalhe}
        onClose={() => setDetalhe(null)}
        title={detalhe?.nome}
        subtitle={detalhe?.descricao}
        size="xl"
        footer={
          <>
            <Button variant="outline" leftIcon={<Copy className="h-3.5 w-3.5" />}>Duplicar</Button>
            <Button variant="outline" leftIcon={<Pencil className="h-3.5 w-3.5" />}>Editar</Button>
            <Button variant="outline" leftIcon={<Mail className="h-3.5 w-3.5" />}>Agendar</Button>
            <Button leftIcon={<Download className="h-3.5 w-3.5" />}>Exportar CSV</Button>
          </>
        }
      >
        {detalhe && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardBody className="py-3">
                  <div className="text-[11px] text-slate-400">Fonte</div>
                  <div className="text-[14px] font-semibold text-slate-900">{fonteLabel[detalhe.fonte]}</div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3">
                  <div className="text-[11px] text-slate-400">Visual</div>
                  <div className="text-[14px] font-semibold text-slate-900">{detalhe.visual}</div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3">
                  <div className="text-[11px] text-slate-400">Autor</div>
                  <div className="text-[14px] font-semibold text-slate-900">{detalhe.autor}</div>
                </CardBody>
              </Card>
            </div>

            <div className="h-64 rounded-[12px] bg-gradient-to-br from-slate-50 to-brand-50/40 border border-slate-100 flex items-center justify-center flex-col gap-2">
              {(() => {
                const Icon = visualIcon[detalhe.visual];
                return <Icon className="h-14 w-14 text-brand-500/60" />;
              })()}
              <div className="text-[12px] text-slate-500">Preview {detalhe.visual} • {detalhe.metricas.join(" × ")}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader title="Dimensões" />
                <CardBody>
                  <div className="flex flex-wrap gap-1.5">
                    {detalhe.dimensao.split(",").map((d) => (
                      <Badge key={d} tone="brand" className="text-[11px]">{d.trim()}</Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Métricas" />
                <CardBody>
                  <div className="flex flex-wrap gap-1.5">
                    {detalhe.metricas.map((m) => (
                      <Badge key={m} tone="violet" className="text-[11px]">{m}</Badge>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>

            {detalhe.agendado && (
              <Card className="bg-violet-50 border-violet-100">
                <CardBody className="py-3">
                  <div className="flex items-center gap-2 text-[12px] text-slate-700">
                    <CalendarClock className="h-4 w-4 text-violet-600" />
                    <span>Envio <b>{detalhe.agendado}</b> para {detalhe.destinatarios?.join(", ")}</span>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={novoAberto}
        onClose={() => setNovoAberto(false)}
        title="Novo relatório"
        subtitle="Construa relatórios sem código"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovoAberto(false)}>Cancelar</Button>
            <Button onClick={() => setNovoAberto(false)} leftIcon={<Sparkles className="h-3.5 w-3.5" />}>Criar</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Nome</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" placeholder="Receita por corretor…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Fonte de dados</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white">
                {Object.entries(fonteLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Visual</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white">
                {Object.keys(visualIcon).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Métricas</label>
            <div className="flex flex-wrap gap-1.5">
              {["receita", "leads", "conversao", "ticket_medio", "cpl", "ltv", "nps", "sla_medio"].map((m) => (
                <Badge key={m} tone="slate" className="text-[11px] px-2 py-1 cursor-pointer hover:bg-brand-50">{m}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
