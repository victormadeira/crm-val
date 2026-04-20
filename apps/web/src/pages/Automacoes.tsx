import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Filter,
  GitBranch,
  MessageCircle,
  Pencil,
  Plus,
  Split,
  Sparkles,
  Target,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FlowEditor, type EditorNode, type FlowEditorValue } from "@/components/automations/FlowEditor";
import { cn } from "@/lib/cn";
import { money, number, pct } from "@/lib/format";
import {
  listWorkflows,
  saveWorkflow,
  setWorkflowActive,
} from "@/lib/automationApi";
import {
  WORKFLOW_TEMPLATES,
  instantiateTemplate,
  type WorkflowTemplate,
} from "@/lib/automationTemplates";
import { ApiError } from "@/lib/api";
import type { AutomationNode, AutomationWorkflow } from "@/lib/types";

const nodeColors: Record<string, { bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  gatilho: { bg: "bg-emerald-50", border: "border-emerald-200", icon: Zap },
  condicao: { bg: "bg-violet-50", border: "border-violet-200", icon: Filter },
  acao: { bg: "bg-brand-50", border: "border-brand-200", icon: MessageCircle },
  espera: { bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  divisao: { bg: "bg-sky-50", border: "border-sky-200", icon: Split },
  fim: { bg: "bg-slate-100", border: "border-slate-200", icon: CheckCircle2 },
};

const OWNER_POOL = [
  { name: "Orion", color: "#1e7be6" },
  { name: "Luna", color: "#8b5cf6" },
  { name: "Atlas", color: "#f59e0b" },
  { name: "Maya", color: "#10b981" },
  { name: "Phoenix", color: "#f43f5e" },
  { name: "Nova", color: "#06b6d4" },
  { name: "Kai", color: "#ec4899" },
];

/** Injeta metadados visuais (owner / progresso / status) derivados do workflow pra dar o look "em execução". */
function enrichNodes(w: AutomationWorkflow): EditorNode[] {
  const doneRatio = w.iniciadas > 0 ? w.concluidas / w.iniciadas : 0;
  const total = w.nodes.length;
  return w.nodes.map((n, i) => {
    const pos = total > 1 ? i / (total - 1) : 1;
    // progresso descendente conforme andamento médio do flow
    let progress: number | undefined;
    let status: EditorNode["status"] = "idle";
    if (w.ativa) {
      if (pos <= doneRatio - 0.1) {
        progress = 1;
        status = "done";
      } else if (pos <= doneRatio + 0.1) {
        progress = Math.max(0.15, Math.min(0.95, (doneRatio - pos + 0.1) * 4.5));
        status = "running";
      } else {
        progress = 0;
        status = "idle";
      }
    }
    const owner = n.tipo === "gatilho" || n.tipo === "fim" ? undefined : OWNER_POOL[i % OWNER_POOL.length];
    return {
      ...n,
      owner,
      progress,
      status,
      subtitle: n.config?.template
        ? `template: ${n.config.template}`
        : n.config?.delay_min
          ? `aguarda ${n.config.delay_min} min`
          : n.config?.evento
            ? `evento: ${n.config.evento}`
            : n.tipo === "condicao"
              ? "if / else"
              : undefined,
    };
  });
}

const catColor: Record<string, string> = {
  pre_venda: "brand",
  pos_venda: "emerald",
  renovacao: "amber",
  reativacao: "violet",
  interno: "slate",
};

const templates = WORKFLOW_TEMPLATES;

function blankWorkflow(): AutomationWorkflow {
  const gatilhoId = `gatilho_${Math.random().toString(36).slice(2, 7)}`;
  const acaoId = `acao_${Math.random().toString(36).slice(2, 7)}`;
  const nodes: AutomationNode[] = [
    {
      id: gatilhoId,
      tipo: "gatilho",
      label: "Lead criado",
      position: { x: 40, y: 180 },
      next: [acaoId],
      config: { trigger: "LEAD_CREATED" },
    },
    {
      id: acaoId,
      tipo: "acao",
      label: "Enviar WhatsApp",
      position: { x: 360, y: 180 },
      next: [],
      config: {},
    },
  ];
  return {
    id: `draft_${Date.now()}`,
    nome: "Novo workflow",
    descricao: "",
    categoria: "pre_venda",
    ativa: false,
    nodes,
    iniciadas: 0,
    concluidas: 0,
    convertidas: 0,
    conversao_pct: 0,
    receita_gerada: 0,
    criada_em: new Date().toISOString(),
    atualizada_em: new Date().toISOString(),
    autor: "você",
  };
}

export function Automacoes() {
  const [aba, setAba] = useState<"ativas" | "todos" | "templates">("ativas");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<AutomationWorkflow | null>(null);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [ativas, setAtivas] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [novoAberto, setNovoAberto] = useState(false);
  const [editorAberto, setEditorAberto] = useState<AutomationWorkflow | null>(null);
  const [editorDirty, setEditorDirty] = useState<FlowEditorValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const errorMessage = (err: unknown) => {
    if (err instanceof ApiError) {
      const body = err.body as { message?: string } | null;
      return body?.message ?? `Erro ${err.status}`;
    }
    return err instanceof Error ? err.message : "Erro inesperado";
  };

  const refresh = async () => {
    try {
      const items = await listWorkflows();
      setWorkflows(items);
      setAtivas(Object.fromEntries(items.map((w) => [w.id, w.ativa])));
    } catch (err) {
      showToast(`Falha ao carregar automações: ${errorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usarTemplate = async (t: WorkflowTemplate) => {
    try {
      const draft = instantiateTemplate(t);
      const saved = await saveWorkflow(draft);
      setWorkflows((prev) => [saved, ...prev]);
      setAtivas((p) => ({ ...p, [saved.id]: saved.ativa }));
      setNovoAberto(false);
      setEditorAberto(saved);
      showToast(`Template "${t.nome}" clonado como rascunho`);
    } catch (err) {
      showToast(`Falha ao clonar template: ${errorMessage(err)}`);
    }
  };
  const duplicarWorkflow = async (w: AutomationWorkflow) => {
    try {
      const clone: AutomationWorkflow = {
        ...w,
        id: `draft_${Date.now()}`,
        nome: `${w.nome} (cópia)`,
        ativa: false,
      };
      const saved = await saveWorkflow(clone);
      setWorkflows((prev) => [saved, ...prev]);
      setAtivas((p) => ({ ...p, [saved.id]: saved.ativa }));
      showToast(`Workflow "${w.nome}" duplicado`);
    } catch (err) {
      showToast(`Falha ao duplicar: ${errorMessage(err)}`);
    }
  };

  const criarEmBranco = async () => {
    try {
      const draft = blankWorkflow();
      const saved = await saveWorkflow(draft);
      setWorkflows((prev) => [saved, ...prev]);
      setAtivas((p) => ({ ...p, [saved.id]: saved.ativa }));
      setNovoAberto(false);
      setEditorAberto(saved);
      showToast("Rascunho criado");
    } catch (err) {
      showToast(`Falha ao criar: ${errorMessage(err)}`);
    }
  };

  const filtered = useMemo(() => {
    let arr = workflows;
    if (aba === "ativas") arr = arr.filter((w) => ativas[w.id]);
    if (busca) arr = arr.filter((w) => w.nome.toLowerCase().includes(busca.toLowerCase()));
    return arr;
  }, [aba, busca, ativas, workflows]);

  const toggle = async (id: string) => {
    const target = workflows.find((w) => w.id === id);
    if (!target) return;
    const next = !ativas[id];
    // optimistic
    setAtivas((p) => ({ ...p, [id]: next }));
    try {
      const updated = await setWorkflowActive(id, next);
      setWorkflows((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch (err) {
      setAtivas((p) => ({ ...p, [id]: !next }));
      showToast(`Falha ao alternar: ${errorMessage(err)}`);
    }
  };

  const salvarEditor = async () => {
    if (!editorAberto) return;
    const draft: AutomationWorkflow = {
      ...editorAberto,
      nodes: (editorDirty?.nodes as AutomationNode[] | undefined) ?? editorAberto.nodes,
    };
    setSaving(true);
    try {
      const saved = await saveWorkflow(draft);
      setWorkflows((prev) => {
        const exists = prev.some((w) => w.id === saved.id);
        return exists ? prev.map((w) => (w.id === saved.id ? saved : w)) : [saved, ...prev];
      });
      setAtivas((p) => ({ ...p, [saved.id]: saved.ativa }));
      showToast("Alterações salvas");
      setEditorAberto(null);
      setEditorDirty(null);
    } catch (err) {
      showToast(`Falha ao salvar: ${errorMessage(err)}`);
    } finally {
      setSaving(false);
    }
  };

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
        ) : loading ? (
          <div className="text-center text-slate-500 text-[13px] py-16">Carregando automações…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-500 text-[13px] py-16">
            {aba === "ativas" ? "Nenhum workflow ativo no momento." : "Nenhum workflow cadastrado."}
            <div className="mt-3">
              <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNovoAberto(true)}>
                Criar primeiro workflow
              </Button>
            </div>
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
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => setEditorAberto(w)}
                    >
                      Editar
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
                const w = selecionado;
                setSelecionado(null);
                if (w) setEditorAberto(w);
              }}
            >
              Abrir editor
            </Button>
          </>
        }
      >
        {selecionado && (
          <div className="h-[480px] -mx-6 -mb-4 rounded-b-[14px] overflow-hidden">
            <FlowEditor
              key={`preview-${selecionado.id}`}
              readOnly
              value={{ nodes: enrichNodes(selecionado) }}
              title={selecionado.nome}
              subtitle={selecionado.descricao}
              active={ativas[selecionado.id]}
            />
          </div>
        )}
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
            <Button onClick={criarEmBranco} leftIcon={<Workflow className="h-3.5 w-3.5" />}>Criar em branco</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {templates.slice(0, 4).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => usarTemplate(t)}
              className="text-left"
            >
              <Card className="hover:shadow-pop hover:border-brand-300 transition cursor-pointer">
                <CardBody className="py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    <span className="text-[13px] font-semibold text-slate-900">{t.nome}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{t.descricao}</p>
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      </Dialog>

      {editorAberto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950 animate-fade-in"
        >
          <button
            onClick={() => {
              setEditorAberto(null);
              setEditorDirty(null);
            }}
            className="absolute top-4 right-4 z-30 h-9 w-9 rounded-[10px] bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center"
            aria-label="Fechar editor"
          >
            <X className="h-4 w-4" />
          </button>
          <FlowEditor
            key={editorAberto.id}
            value={{ nodes: enrichNodes(editorAberto) }}
            onChange={(next) => setEditorDirty(next)}
            title={editorAberto.nome}
            subtitle={editorAberto.descricao}
            active={ativas[editorAberto.id]}
            onToggleActive={() => toggle(editorAberto.id)}
            onTest={() => showToast("Execução de teste iniciada")}
            onSave={salvarEditor}
          />
          {saving && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/95 text-white text-[12px] px-3 py-1.5 rounded-[8px] border border-white/10">
              Salvando…
            </div>
          )}
        </div>
      )}

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

