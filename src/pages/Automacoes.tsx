import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Filter,
  GitBranch,
  Mail,
  MessageCircle,
  Pause,
  Play,
  Plus,
  Power,
  Split,
  Sparkles,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { money, number, pct } from "@/lib/format";
import { workflows } from "@/lib/mock";
import type { AutomationNode, AutomationWorkflow } from "@/lib/types";

const nodeColors: Record<string, { bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  gatilho: { bg: "bg-emerald-50", border: "border-emerald-200", icon: Zap },
  condicao: { bg: "bg-violet-50", border: "border-violet-200", icon: Filter },
  acao: { bg: "bg-brand-50", border: "border-brand-200", icon: MessageCircle },
  espera: { bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  divisao: { bg: "bg-sky-50", border: "border-sky-200", icon: Split },
  fim: { bg: "bg-slate-100", border: "border-slate-200", icon: CheckCircle2 },
};

const catColor: Record<string, string> = {
  pre_venda: "brand",
  pos_venda: "emerald",
  renovacao: "amber",
  reativacao: "violet",
  interno: "slate",
};

const templates = [
  { id: "t1", nome: "Boas-vindas lead IG", categoria: "pre_venda", descricao: "Novo lead Instagram → WA em 5min + IA qualifica" },
  { id: "t2", nome: "Cadência renovação D-60", categoria: "renovacao", descricao: "4 toques escalados, desconto progressivo 5→15%" },
  { id: "t3", nome: "NPS + indicação", categoria: "pos_venda", descricao: "7d pós-venda, promotor recebe link de indicação" },
  { id: "t4", nome: "Winback 90d inativo", categoria: "reativacao", descricao: "Cliente sem visita 90d → cupom + story IA" },
  { id: "t5", nome: "Escalonamento SLA", categoria: "interno", descricao: "Lead parado 48h → avisa gestor + rerota" },
];

export function Automacoes() {
  const [aba, setAba] = useState<"ativas" | "todos" | "templates">("ativas");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<AutomationWorkflow | null>(null);
  const [ativas, setAtivas] = useState<Record<string, boolean>>(
    Object.fromEntries(workflows.map((w) => [w.id, w.ativa]))
  );
  const [novoAberto, setNovoAberto] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const usarTemplate = (t: (typeof templates)[number]) => {
    showToast(`Template "${t.nome}" clonado como rascunho`);
  };
  const duplicarWorkflow = (w: AutomationWorkflow) => {
    showToast(`Workflow "${w.nome}" duplicado`);
  };

  const filtered = useMemo(() => {
    let arr = workflows;
    if (aba === "ativas") arr = arr.filter((w) => ativas[w.id]);
    if (busca) arr = arr.filter((w) => w.nome.toLowerCase().includes(busca.toLowerCase()));
    return arr;
  }, [aba, busca, ativas]);

  const toggle = (id: string) => setAtivas((p) => ({ ...p, [id]: !p[id] }));

  const totalIniciadas = workflows.reduce((s, w) => s + w.iniciadas, 0);
  const totalConvertidas = workflows.reduce((s, w) => s + w.convertidas, 0);
  const receitaGerada = workflows.reduce((s, w) => s + w.receita_gerada, 0);
  const convMedia = totalIniciadas > 0 ? totalConvertidas / totalIniciadas : 0;

  return (
    <>
      <PageHeader
        title="Automações — workflows visuais"
        subtitle="Fluxos visuais estilo Zapier/RD Station. Gatilho → condição → ação → espera."
        actions={
          <>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar workflow…"
              className="h-9 rounded-[10px] border border-slate-200 px-3 text-sm w-56"
            />
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNovoAberto(true)}>
              Novo workflow
            </Button>
          </>
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Workflows ativos</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{workflows.filter((w) => ativas[w.id]).length}</div>
              <div className="text-[11px] text-slate-500 mt-1">de {workflows.length} total</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Execuções totais</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{number(totalIniciadas)}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><Activity className="h-3 w-3" /> últimos 30d</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Conversão média</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{pct(convMedia)}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><Target className="h-3 w-3" /> {number(totalConvertidas)} conversões</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Receita gerada</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{money(receitaGerada)}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><Sparkles className="h-3 w-3" /> via automação</div>
            </CardBody>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Button size="sm" variant={aba === "ativas" ? "primary" : "outline"} onClick={() => setAba("ativas")}>
            Ativas
          </Button>
          <Button size="sm" variant={aba === "todos" ? "primary" : "outline"} onClick={() => setAba("todos")}>
            Todos
          </Button>
          <Button size="sm" variant={aba === "templates" ? "primary" : "outline"} onClick={() => setAba("templates")}>
            Biblioteca de templates
          </Button>
        </div>

        {aba === "templates" ? (
          <div className="grid grid-cols-3 gap-4">
            {templates.map((t) => (
              <Card key={t.id} className="hover:shadow-pop transition">
                <CardBody>
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-brand-500 to-aqua-500 text-white inline-flex items-center justify-center">
                      <Workflow className="h-4 w-4" />
                    </div>
                    <Badge tone={catColor[t.categoria] as any}>{t.categoria.replace("_", " ")}</Badge>
                  </div>
                  <h3 className="text-[14px] font-semibold text-slate-900">{t.nome}</h3>
                  <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{t.descricao}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    leftIcon={<Copy className="h-3.5 w-3.5" />}
                    onClick={() => usarTemplate(t)}
                  >
                    Usar template
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((w) => (
              <Card key={w.id}>
                <CardHeader
                  title={w.nome}
                  subtitle={w.descricao}
                  action={
                    <div className="flex items-center gap-2">
                      <Badge tone={catColor[w.categoria] as any}>{w.categoria.replace("_", " ")}</Badge>
                      <button
                        onClick={() => toggle(w.id)}
                        className={cn(
                          "h-6 w-11 rounded-full transition relative",
                          ativas[w.id] ? "bg-emerald-500" : "bg-slate-300"
                        )}
                        aria-label="Ativar/pausar"
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition",
                            ativas[w.id] ? "right-0.5" : "left-0.5"
                          )}
                        />
                      </button>
                    </div>
                  }
                />
                <CardBody>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {w.nodes.slice(0, 5).map((n, i) => {
                      const style = nodeColors[n.tipo];
                      const Icon = style.icon;
                      return (
                        <div key={n.id} className="flex items-center shrink-0">
                          <div className={cn("px-2.5 py-1.5 rounded-[8px] border text-[11px] font-medium inline-flex items-center gap-1.5", style.bg, style.border)}>
                            <Icon className="h-3 w-3" />
                            <span className="max-w-[120px] truncate">{n.label}</span>
                          </div>
                          {i < Math.min(4, w.nodes.length - 1) && <ArrowRight className="h-3 w-3 text-slate-300 mx-1 shrink-0" />}
                        </div>
                      );
                    })}
                    {w.nodes.length > 5 && <span className="text-[11px] text-slate-400 ml-1">+{w.nodes.length - 5}</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                    <div>
                      <div className="text-slate-400">Iniciadas</div>
                      <div className="font-semibold tabular">{number(w.iniciadas)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Convertidas</div>
                      <div className="font-semibold tabular text-emerald-600">{number(w.convertidas)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Conv.</div>
                      <div className="font-semibold tabular">{pct(w.conversao_pct)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Receita</div>
                      <div className="font-semibold tabular">{money(w.receita_gerada)}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    <Button size="sm" variant="outline" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => setSelecionado(w)} className="flex-1">
                      Ver fluxo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Copy className="h-3.5 w-3.5" />}
                      onClick={() => duplicarWorkflow(w)}
                    >
                      Duplicar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </PageContent>

      <Dialog
        open={!!selecionado}
        onClose={() => setSelecionado(null)}
        title={selecionado?.nome}
        subtitle={selecionado?.descricao}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelecionado(null)}>Fechar</Button>
            <Button
              leftIcon={<GitBranch className="h-3.5 w-3.5" />}
              onClick={() => {
                setEditorAberto(true);
                showToast("Editor visual em beta. Mostrando preview.");
              }}
            >
              Editar fluxo
            </Button>
          </>
        }
      >
        {selecionado && <FlowCanvas nodes={selecionado.nodes} />}
      </Dialog>

      <Dialog
        open={novoAberto}
        onClose={() => setNovoAberto(false)}
        title="Novo workflow"
        subtitle="Começe de um template ou em branco"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovoAberto(false)}>Cancelar</Button>
            <Button onClick={() => setNovoAberto(false)} leftIcon={<Workflow className="h-3.5 w-3.5" />}>Criar em branco</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {templates.slice(0, 4).map((t) => (
            <Card key={t.id} className="hover:shadow-pop cursor-pointer">
              <CardBody className="py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-[13px] font-semibold text-slate-900">{t.nome}</span>
                </div>
                <p className="text-[11px] text-slate-500">{t.descricao}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={editorAberto}
        onClose={() => setEditorAberto(false)}
        title="Editor visual"
        subtitle="Arraste nodes e conecte ações (em beta)"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorAberto(false)}>Fechar</Button>
            <Button
              onClick={() => {
                setEditorAberto(false);
                showToast("Alterações salvas no rascunho");
              }}
            >
              Salvar rascunho
            </Button>
          </>
        }
      >
        {selecionado && <FlowCanvas nodes={selecionado.nodes} />}
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

function FlowCanvas({ nodes }: { nodes: AutomationNode[] }) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const maxX = Math.max(...nodes.map((n) => n.position.x)) + 220;
  const maxY = Math.max(...nodes.map((n) => n.position.y)) + 80;
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const offsetY = -minY + 20;

  return (
    <div className="relative overflow-auto bg-slate-50 rounded-[10px] border border-slate-200 p-4" style={{ minHeight: 260 }}>
      <svg className="absolute inset-0 pointer-events-none" width={maxX} height={maxY + offsetY + 40}>
        {nodes.flatMap((n) =>
          (n.next ?? []).map((nextId) => {
            const target = byId[nextId];
            if (!target) return null;
            const x1 = n.position.x + 180 + 16;
            const y1 = n.position.y + offsetY + 24;
            const x2 = target.position.x + 16;
            const y2 = target.position.y + offsetY + 24;
            const mx = (x1 + x2) / 2;
            return (
              <path
                key={`${n.id}-${nextId}`}
                d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                stroke="#94a3b8"
                strokeWidth={1.5}
                fill="none"
                markerEnd="url(#arrow)"
              />
            );
          })
        )}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
        </defs>
      </svg>
      {nodes.map((n) => {
        const style = nodeColors[n.tipo];
        const Icon = style.icon;
        return (
          <div
            key={n.id}
            className={cn(
              "absolute w-[180px] rounded-[10px] border shadow-soft bg-white",
              style.border
            )}
            style={{ left: n.position.x + 16, top: n.position.y + offsetY + 16 }}
          >
            <div className={cn("px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-t-[9px]", style.bg)}>
              <span className="inline-flex items-center gap-1">
                <Icon className="h-3 w-3" /> {n.tipo}
              </span>
            </div>
            <div className="px-2.5 py-2 text-[12px] font-medium text-slate-900">{n.label}</div>
          </div>
        );
      })}
    </div>
  );
}
