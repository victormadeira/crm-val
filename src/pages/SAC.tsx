import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Filter,
  Flag,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { Dialog } from "@/components/ui/Dialog";
import { corretores, tickets } from "@/lib/mock";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Ticket } from "@/lib/types";

const priTone: Record<Ticket["prioridade"], "rose" | "amber" | "slate" | "brand"> = {
  critica: "rose",
  alta: "amber",
  normal: "brand",
  baixa: "slate",
};

const statusTone: Record<Ticket["status"], "slate" | "brand" | "amber" | "emerald"> = {
  aberto: "slate",
  em_andamento: "brand",
  aguardando: "amber",
  resolvido: "emerald",
  fechado: "slate",
};

const tomTone: Record<Ticket["tom_cliente"], "emerald" | "slate" | "amber" | "rose"> = {
  satisfeito: "emerald",
  neutro: "slate",
  insatisfeito: "amber",
  furioso: "rose",
};

function TicketRow({
  t,
  active,
  onClick,
}: {
  t: Ticket;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 border-b border-slate-100 transition-colors relative",
        active ? "bg-brand-50/50" : "hover:bg-slate-50"
      )}
    >
      {active && (
        <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r bg-brand-600" />
      )}
      {t.sla_breach && (
        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse-soft" />
      )}
      <div className="flex items-start gap-2.5">
        <Avatar name={t.cliente_nome} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <code className="text-[10px] font-mono text-slate-500">
              #{t.numero}
            </code>
            <Badge tone={priTone[t.prioridade]} className="text-[10px]">
              {t.prioridade}
            </Badge>
          </div>
          <div className="font-semibold text-[13px] text-slate-900 line-clamp-1">
            {t.assunto}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
            {t.cliente_nome} • {relativeTime(t.created_at)}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge tone={statusTone[t.status]} className="text-[10px]" dot>
              {t.status.replace("_", " ")}
            </Badge>
            <Badge tone={tomTone[t.tom_cliente]} className="text-[10px]">
              {t.tom_cliente}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  );
}

export function SAC() {
  const [tab, setTab] = useState("ativos");
  const [selectedId, setSelectedId] = useState(tickets[0]?.id);
  const [busca, setBusca] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [novoTicketAberto, setNovoTicketAberto] = useState(false);
  const [atribuirAberto, setAtribuirAberto] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [respostaCopiada, setRespostaCopiada] = useState(false);
  const [resolvidos, setResolvidos] = useState<Set<string>>(new Set());
  const [atribuicoes, setAtribuicoes] = useState<Record<string, string>>({});
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<"" | Ticket["prioridade"]>("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");

  const getStatus = (t: Ticket): Ticket["status"] =>
    resolvidos.has(t.id) ? "resolvido" : t.status;

  const filtered = tickets
    .map((t) => ({ ...t, status: getStatus(t) }))
    .filter((t) =>
      tab === "ativos"
        ? !["resolvido", "fechado"].includes(t.status)
        : tab === "sla_risco"
        ? t.sla_breach || t.sla_restante <= 2
        : tab === "resolvidos"
        ? t.status === "resolvido"
        : true
    )
    .filter((t) => (prioridadeFiltro ? t.prioridade === prioridadeFiltro : true))
    .filter((t) => (categoriaFiltro ? t.categoria === categoriaFiltro : true))
    .filter((t) => {
      if (!busca) return true;
      const q = busca.toLowerCase();
      return (
        t.assunto.toLowerCase().includes(q) ||
        t.cliente_nome.toLowerCase().includes(q) ||
        String(t.numero).includes(q)
      );
    });

  const selectedRaw = tickets.find((t) => t.id === selectedId) ?? tickets[0];
  const selected = selectedRaw
    ? { ...selectedRaw, status: getStatus(selectedRaw) }
    : selectedRaw;
  const categoriasUnicas = Array.from(new Set(tickets.map((t) => t.categoria)));

  return (
    <>
      <PageHeader
        title="Central de atendimento"
        subtitle={`${tickets.filter((t) => !["resolvido", "fechado"].includes(t.status)).length} tickets abertos • 1 SLA crítico`}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setFiltrosAbertos(true)}
            >
              Filtros
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setNovoTicketAberto(true)}
            >
              Novo ticket
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-[340px_1fr_380px] h-[calc(100%-84px)] bg-white">
        {/* List */}
        <aside className="border-r border-slate-200 flex flex-col">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <Input
              leftIcon={<Search className="h-4 w-4" />}
              placeholder="Buscar ticket…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <Tabs
              value={tab}
              onChange={setTab}
              className="w-full justify-between"
              tabs={[
                { id: "ativos", label: "Ativos" },
                { id: "sla_risco", label: "SLA risco" },
                { id: "resolvidos", label: "OK" },
              ]}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((t) => (
              <TicketRow
                key={t.id}
                t={t}
                active={t.id === selectedId}
                onClick={() => setSelectedId(t.id)}
              />
            ))}
          </div>
        </aside>

        {/* Main */}
        <section className="flex flex-col min-w-0 bg-slate-50/40">
          {selected && (
            <>
              <div className="px-6 py-4 bg-white border-b border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <code className="text-[11px] font-mono text-slate-500">
                        #{selected.numero}
                      </code>
                      <Badge tone={priTone[selected.prioridade]} dot>
                        {selected.prioridade}
                      </Badge>
                      <Badge tone={statusTone[selected.status]}>
                        {selected.status.replace("_", " ")}
                      </Badge>
                      {selected.sla_breach && (
                        <Badge tone="rose" dot>
                          SLA estourado
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-[18px] font-semibold text-slate-900">
                      {selected.assunto}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-slate-500">
                      <span>{selected.cliente_nome}</span>
                      <span>•</span>
                      <span className="capitalize">{selected.canal}</span>
                      <span>•</span>
                      <span>{relativeTime(selected.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAtribuirAberto(true)}
                    >
                      {atribuicoes[selected.id] ? "Reatribuir" : "Atribuir"}
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                      disabled={selected.status === "resolvido"}
                      onClick={() => {
                        setResolvidos((prev) => {
                          const next = new Set(prev);
                          next.add(selected.id);
                          return next;
                        });
                      }}
                    >
                      {selected.status === "resolvido" ? "Resolvido" : "Marcar resolvido"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div className="rounded-[10px] bg-slate-50 border border-slate-100 p-2.5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      SLA
                    </div>
                    <div
                      className={cn(
                        "text-[14px] font-semibold tabular mt-0.5",
                        selected.sla_breach
                          ? "text-rose-600"
                          : selected.sla_restante < 3
                          ? "text-amber-600"
                          : "text-emerald-600"
                      )}
                    >
                      {selected.sla_breach
                        ? `-${Math.abs(selected.sla_restante)}h`
                        : `${selected.sla_restante}h restantes`}
                    </div>
                  </div>
                  <div className="rounded-[10px] bg-slate-50 border border-slate-100 p-2.5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Categoria
                    </div>
                    <div className="text-[14px] font-semibold text-slate-900 mt-0.5 capitalize">
                      {selected.categoria}
                    </div>
                  </div>
                  <div className="rounded-[10px] bg-slate-50 border border-slate-100 p-2.5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Tom detectado
                    </div>
                    <div
                      className={cn(
                        "text-[14px] font-semibold mt-0.5 capitalize",
                        selected.tom_cliente === "furioso"
                          ? "text-rose-600"
                          : selected.tom_cliente === "insatisfeito"
                          ? "text-amber-600"
                          : "text-slate-900"
                      )}
                    >
                      {selected.tom_cliente}
                    </div>
                  </div>
                  <div className="rounded-[10px] bg-slate-50 border border-slate-100 p-2.5">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Canal
                    </div>
                    <div className="text-[14px] font-semibold text-slate-900 mt-0.5 capitalize">
                      {selected.canal}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <Card>
                  <CardBody className="pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar name={selected.cliente_nome} size="sm" />
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900">
                          {selected.cliente_nome}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {relativeTime(selected.created_at)}
                        </div>
                      </div>
                    </div>
                    <p className="text-[14px] text-slate-700 leading-relaxed">
                      {selected.descricao}
                    </p>
                  </CardBody>
                </Card>

                {/* Contexto do cliente */}
                <Card>
                  <CardHeader
                    title="Contexto completo do cliente"
                    subtitle="Histórico consolidado — sem precisar perguntar"
                  />
                  <CardBody className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Passaportes ativos", value: "2", sub: "Anual família + Diário" },
                      { label: "Visitas totais", value: "17", sub: "Última há 12 dias" },
                      { label: "NPS", value: "9.0", sub: "Cliente promotor" },
                      { label: "Tickets anteriores", value: "3", sub: "Todos resolvidos" },
                      { label: "Valor LTV", value: "R$ 6.9k", sub: "Top 10% da base" },
                      { label: "Próxima renovação", value: "65 dias", sub: "Anual família" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-[10px] border border-slate-200 p-2.5"
                      >
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {s.label}
                        </div>
                        <div className="text-[16px] font-semibold text-slate-900 tabular mt-0.5">
                          {s.value}
                        </div>
                        <div className="text-[11px] text-slate-500">{s.sub}</div>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </div>
            </>
          )}
        </section>

        {/* Assistant */}
        <aside className="border-l border-slate-200 bg-white overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-violet-500 to-brand-600 text-white inline-flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-slate-900">
                  Assistente SAC
                </div>
                <div className="text-[11px] text-slate-500">
                  Analisou 3 tickets similares
                </div>
              </div>
            </div>

            <div className="rounded-[12px] border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-[11px] font-semibold text-violet-900 uppercase tracking-wider">
                  Resposta sugerida
                </span>
              </div>
              <p className="text-[13px] text-slate-800 leading-relaxed">
                Oi Mariana, sinto muito pelo ocorrido 🙏 Acabei de reemitir seu
                QR com prioridade máxima — já chegou no seu WhatsApp. Como
                cortesia pela inconveniência, adicionei um <strong>dia extra VIP</strong> no
                seu anual. Me conta se o novo QR funcionou?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <Badge tone="emerald" className="justify-center">
                  Resolução automática
                </Badge>
                <Badge tone="slate" className="justify-center">
                  Sem escalação
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  leftIcon={
                    respostaCopiada ? <CheckCircle2 className="h-3.5 w-3.5" /> : undefined
                  }
                  onClick={() => {
                    setResolvidos((prev) => {
                      if (!selected) return prev;
                      const next = new Set(prev);
                      next.add(selected.id);
                      return next;
                    });
                    setRespostaCopiada(true);
                    setTimeout(() => setRespostaCopiada(false), 1800);
                  }}
                >
                  {respostaCopiada ? "Resposta enviada" : "Usar resposta"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditorAberto(true)}
                >
                  Editar
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-[12px] border border-slate-200 p-3.5">
              <h4 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider mb-2">
                Ação interna
              </h4>
              <ul className="space-y-1.5 text-[12px] text-slate-700">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  Reemitir QR code (prioridade alta)
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  Adicionar benefício compensatório no cadastro
                </li>
                <li className="flex items-start gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  Follow-up automático em 24h
                </li>
              </ul>
            </div>

            <div className="mt-4 rounded-[12px] border border-slate-200 p-3.5">
              <h4 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider mb-2">
                Políticas relevantes
              </h4>
              <ul className="space-y-2">
                {[
                  "Reemissão de QR: resolução em até 2h — imediata via app",
                  "Cliente com NPS ≥8: compensação automática de 1 dia VIP",
                  "Ticket categoria 'acesso' SLA padrão 4h",
                ].map((p) => (
                  <li
                    key={p}
                    className="text-[12px] text-slate-600 leading-relaxed flex items-start gap-1.5"
                  >
                    <Flag className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <Dialog
        open={filtrosAbertos}
        onClose={() => setFiltrosAbertos(false)}
        title="Filtrar tickets"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setPrioridadeFiltro("");
                setCategoriaFiltro("");
              }}
            >
              Limpar
            </Button>
            <Button onClick={() => setFiltrosAbertos(false)}>Aplicar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider">
              Prioridade
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["", "critica", "alta", "normal", "baixa"] as const).map((p) => (
                <button
                  key={p || "all"}
                  onClick={() => setPrioridadeFiltro(p)}
                  className={cn(
                    "px-3 h-9 rounded-[10px] text-[13px] font-medium border capitalize transition",
                    prioridadeFiltro === p
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {p === "" ? "Todas" : p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider">
              Categoria
            </label>
            <select
              className="mt-2 w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-white text-sm capitalize"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="">Todas</option>
              {categoriasUnicas.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={novoTicketAberto}
        onClose={() => setNovoTicketAberto(false)}
        title="Novo ticket"
        subtitle="Abra um chamado manualmente"
        footer={
          <>
            <Button variant="ghost" onClick={() => setNovoTicketAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setNovoTicketAberto(false)}>Abrir ticket</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-slate-700">Cliente</label>
            <Input className="mt-1" placeholder="Nome ou CPF" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700">Assunto</label>
            <Input className="mt-1" placeholder="Ex: QR não funciona na catraca" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-slate-700">Prioridade</label>
              <select className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-white text-sm capitalize">
                <option>normal</option>
                <option>alta</option>
                <option>crítica</option>
                <option>baixa</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700">Categoria</label>
              <select className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-white text-sm capitalize">
                {categoriasUnicas.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700">Descrição</label>
            <textarea
              rows={4}
              className="mt-1 w-full px-3 py-2 rounded-[10px] border border-slate-200 bg-white text-sm resize-none"
              placeholder="Descreva o problema em detalhe"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={atribuirAberto}
        onClose={() => setAtribuirAberto(false)}
        title="Atribuir ticket"
        subtitle={selected ? `#${selected.numero} — ${selected.assunto}` : undefined}
        footer={
          <Button onClick={() => setAtribuirAberto(false)}>Fechar</Button>
        }
      >
        <div className="space-y-1">
          {corretores.map((c) => {
            const isAtual = selected && atribuicoes[selected.id] === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (!selected) return;
                  setAtribuicoes((prev) => ({ ...prev, [selected.id]: c.id }));
                  setAtribuirAberto(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-[10px] border transition text-left",
                  isAtual
                    ? "border-brand-300 bg-brand-50"
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                <Avatar name={c.nome} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900 truncate">
                    {c.nome}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {c.leads_ativos}/{c.max_leads_ativos} leads • {c.especialidade}
                  </div>
                </div>
                {isAtual && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
              </button>
            );
          })}
        </div>
      </Dialog>

      <Dialog
        open={editorAberto}
        onClose={() => setEditorAberto(false)}
        title="Editar resposta sugerida"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditorAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setEditorAberto(false)}>Salvar resposta</Button>
          </>
        }
      >
        <textarea
          defaultValue="Oi Mariana, sinto muito pelo ocorrido. Acabei de reemitir seu QR com prioridade máxima — já chegou no seu WhatsApp. Como cortesia, adicionei um dia extra VIP no seu anual."
          rows={8}
          className="w-full px-3 py-2 rounded-[10px] border border-slate-200 bg-white text-sm resize-none"
        />
      </Dialog>
    </>
  );
}
