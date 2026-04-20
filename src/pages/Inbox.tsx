import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  FileText,
  Flame,
  Instagram,
  Mail,
  MessageCircle,
  Paperclip,
  Phone,
  Search,
  Send,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users2,
  X,
  Zap,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { dateTime, money, relativeTime } from "@/lib/format";
import {
  corretorById,
  leadById,
  leads,
  mensagensPorLead,
  sugestoes,
} from "@/lib/mock";
import { useApp } from "@/lib/store";
import type { Canal, Lead, Mensagem } from "@/lib/types";

const canalMap: Record<
  Canal | "nota" | "sistema" | "copilot",
  { icon: React.ComponentType<{ className?: string }>; tone: string; label: string }
> = {
  whatsapp: { icon: MessageCircle, tone: "text-emerald-600 bg-emerald-50", label: "WhatsApp" },
  instagram: { icon: Instagram, tone: "text-fuchsia-600 bg-fuchsia-50", label: "Instagram" },
  email: { icon: Mail, tone: "text-brand-600 bg-brand-50", label: "E-mail" },
  rdstation: { icon: Sparkles, tone: "text-violet-600 bg-violet-50", label: "RD Station" },
  site: { icon: User, tone: "text-slate-600 bg-slate-50", label: "Site" },
  walkin: { icon: User, tone: "text-slate-600 bg-slate-50", label: "Walk-in" },
  indicacao: { icon: Users2, tone: "text-amber-600 bg-amber-50", label: "Indicação" },
  google: { icon: Search, tone: "text-sky-600 bg-sky-50", label: "Google" },
  nota: { icon: FileText, tone: "text-amber-600 bg-amber-50", label: "Nota" },
  sistema: { icon: Activity, tone: "text-slate-500 bg-slate-50", label: "Sistema" },
  copilot: { icon: Bot, tone: "text-violet-600 bg-violet-50", label: "Copilot" },
};

function LeadRow({
  lead,
  active,
  onClick,
}: {
  lead: Lead;
  active: boolean;
  onClick: () => void;
}) {
  const Ico = canalMap[lead.canal].icon;
  const urgencyDot =
    lead.urgencia === "alta"
      ? "bg-rose-500"
      : lead.urgencia === "media"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 border-b border-slate-100 transition-colors ring-focus relative",
        active ? "bg-brand-50/60" : "hover:bg-slate-50"
      )}
    >
      {active && (
        <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full bg-brand-600" />
      )}
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <Avatar name={lead.nome} size="sm" />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
              urgencyDot
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[13px] text-slate-900 truncate">
              {lead.nome}
            </span>
            <span className="text-[11px] text-slate-400 tabular shrink-0">
              {relativeTime(lead.updated_at)}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Ico className="h-3 w-3 text-slate-400" />
            <span className="text-[11px] text-slate-500 truncate">
              {lead.mensagem_raw?.slice(0, 50)}…
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge
              tone={lead.interesse === "anual" ? "brand" : "aqua"}
              className="text-[9px]"
            >
              {lead.interesse === "anual" ? "Anual" : lead.interesse === "diario" ? "Diário" : "?"}
            </Badge>
            <span
              className={cn(
                "text-[10px] font-bold tabular px-1.5 py-0.5 rounded",
                lead.score >= 75
                  ? "bg-emerald-50 text-emerald-700"
                  : lead.score >= 50
                  ? "bg-amber-50 text-amber-700"
                  : "bg-rose-50 text-rose-700"
              )}
            >
              {lead.score}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ msg }: { msg: Mensagem }) {
  const info = canalMap[msg.canal as keyof typeof canalMap];

  if (msg.tipo === "evento" || msg.canal === "sistema") {
    return (
      <div className="flex items-center gap-2 my-3 px-4">
        <div className="flex-1 h-px bg-slate-100" />
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
          <Activity className="h-3 w-3" />
          <span>{msg.conteudo}</span>
          <span className="text-slate-300">•</span>
          <span className="tabular">{relativeTime(msg.sent_at)}</span>
        </div>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
    );
  }

  if (msg.canal === "nota") {
    return (
      <div className="mx-4 my-3 rounded-[12px] border border-amber-200 bg-amber-50/60 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <FileText className="h-3.5 w-3.5 text-amber-700" />
          <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
            Nota interna • {msg.autor}
          </span>
          <span className="text-[11px] text-amber-700 ml-auto tabular">
            {dateTime(msg.sent_at)}
          </span>
        </div>
        <p className="text-[13px] text-amber-900 leading-relaxed">
          {msg.conteudo}
        </p>
      </div>
    );
  }

  if (msg.canal === "email") {
    return (
      <div
        className={cn(
          "max-w-[78%] rounded-[14px] border border-slate-200 bg-white shadow-soft overflow-hidden mx-4 my-2",
          msg.direcao === "outbound" ? "ml-auto" : ""
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/60 border-b border-slate-100">
          <Mail className="h-3.5 w-3.5 text-brand-600" />
          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            E-mail {msg.direcao === "outbound" ? "enviado" : "recebido"}
          </span>
          <span className="text-[11px] text-slate-400 ml-auto tabular">
            {relativeTime(msg.sent_at)}
          </span>
        </div>
        <div className="p-3">
          <div className="text-[12px] text-slate-500">
            Assunto:{" "}
            <span className="text-slate-900 font-medium">
              {msg.meta?.assunto}
            </span>
          </div>
          <p className="text-[13px] text-slate-700 mt-1.5">{msg.conteudo}</p>
          {msg.lida && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Aberto pelo lead
            </div>
          )}
        </div>
      </div>
    );
  }

  const outbound = msg.direcao === "outbound";
  const Ico = info.icon;

  return (
    <div
      className={cn(
        "flex gap-2 px-4 my-1.5",
        outbound ? "justify-end" : "justify-start"
      )}
    >
      {!outbound && (
        <Avatar name={msg.autor} size="xs" className="mt-auto" />
      )}
      <div
        className={cn(
          "max-w-[72%] rounded-[14px] px-3.5 py-2 shadow-soft",
          outbound
            ? "bg-brand-600 text-white rounded-br-[4px]"
            : "bg-white text-slate-800 border border-slate-200 rounded-bl-[4px]"
        )}
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
          {msg.conteudo}
        </p>
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 text-[10px] tabular",
            outbound ? "text-brand-100" : "text-slate-400"
          )}
        >
          <Ico className="h-2.5 w-2.5" />
          <span>{info.label}</span>
          <span>•</span>
          <span>{relativeTime(msg.sent_at)}</span>
          {outbound && msg.lida && <CheckCircle2 className="h-2.5 w-2.5" />}
        </div>
      </div>
    </div>
  );
}

export function Inbox() {
  const { selectedLeadId, setSelectedLead, persona } = useApp();
  const [tab, setTab] = useState("todos");
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [composerCanal, setComposerCanal] = useState<"whatsapp" | "email" | "interno" | "nota">("whatsapp");
  const [sugestaoDismissed, setSugestaoDismissed] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [anexos, setAnexos] = useState<string[]>([]);

  const myCorretorId =
    persona?.papel === "corretor" ? persona.id : "c1";

  const queue = useMemo(() => {
    let list = leads.filter(
      (l) =>
        (l.corretor_id === myCorretorId || !l.corretor_id) &&
        !["fechado", "perdido"].includes(l.status)
    );
    if (tab === "urgentes") list = list.filter((l) => l.urgencia === "alta");
    if (tab === "sem_resposta")
      list = list.filter((l) => l.score < 50);
    if (filter)
      list = list.filter((l) =>
        l.nome.toLowerCase().includes(filter.toLowerCase())
      );
    return list.sort((a, b) => b.score - a.score);
  }, [tab, filter, myCorretorId]);

  const selected = selectedLeadId ? leadById(selectedLeadId) : queue[0];
  const mensagens = selected ? mensagensPorLead[selected.id] ?? [] : [];
  const sugestao = selected ? sugestoes[selected.id] : null;
  const corretor = corretorById(selected?.corretor_id);

  return (
    <div className="grid grid-cols-[320px_1fr_360px] h-full bg-white">
      {/* Queue */}
      <aside className="border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Minha fila
            </h2>
            <Badge tone="brand">{queue.length}</Badge>
          </div>
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Buscar lead…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Tabs
            className="mt-3 w-full justify-between"
            tabs={[
              { id: "todos", label: "Todos", count: queue.length },
              { id: "urgentes", label: "Urgentes" },
              { id: "sem_resposta", label: "Frios" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {queue.map((l) => (
            <LeadRow
              key={l.id}
              lead={l}
              active={selected?.id === l.id}
              onClick={() => setSelectedLead(l.id)}
            />
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex flex-col min-w-0 bg-slate-50/40">
        {selected ? (
          <>
            {/* Header */}
            <div className="h-[72px] px-5 border-b border-slate-200 bg-white flex items-center gap-4 shrink-0">
              <Avatar name={selected.nome} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-slate-900 truncate">
                    {selected.nome}
                  </h2>
                  <Badge tone={selected.interesse === "anual" ? "brand" : "aqua"}>
                    {selected.interesse === "anual"
                      ? "Anual família"
                      : selected.interesse === "diario"
                      ? "Diário"
                      : "Indefinido"}
                  </Badge>
                  {selected.urgencia === "alta" && (
                    <Badge tone="rose" dot>
                      Urgência alta
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[12px] text-slate-500 tabular">
                  <span>{selected.telefone}</span>
                  <span>•</span>
                  <span>{selected.email}</span>
                  <span>•</span>
                  <span>
                    Entrou {relativeTime(selected.created_at)} via{" "}
                    <span className="text-slate-700 font-medium">
                      {canalMap[selected.canal].label}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Phone className="h-3.5 w-3.5" />}
                  onClick={() => {
                    if (selected?.telefone)
                      window.location.href = `tel:${selected.telefone.replace(/\D/g, "")}`;
                  }}
                >
                  Ligar
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    if (!selected) return;
                    setFavoritos((prev) => {
                      const next = new Set(prev);
                      if (next.has(selected.id)) next.delete(selected.id);
                      else next.add(selected.id);
                      return next;
                    });
                  }}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      selected && favoritos.has(selected.id) && "fill-amber-400 text-amber-500"
                    )}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => selected && setSelectedLead(null)}
                  aria-label="Fechar conversa"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Score bar */}
            <div className="px-5 py-2.5 border-b border-slate-100 bg-white flex items-center gap-4 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Score dinâmico</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-base font-bold tabular",
                      selected.score >= 75
                        ? "text-emerald-600"
                        : selected.score >= 50
                        ? "text-amber-600"
                        : "text-rose-600"
                    )}
                  >
                    {selected.score}
                  </span>
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-600 tabular">+17 hoje</span>
                </div>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex-1 flex items-center gap-3 text-slate-500">
                {Object.entries(selected.score_breakdown).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="capitalize text-[11px]">{k}</span>
                    <span className="tabular font-semibold text-slate-700">{v}</span>
                  </div>
                ))}
              </div>
              <Badge tone="slate">Status: {selected.status}</Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4">
              {mensagens.length === 0 ? (
                <div className="text-center text-sm text-slate-400 py-12">
                  Nenhuma mensagem ainda. Envie a primeira abaixo.
                </div>
              ) : (
                mensagens.map((m) => <MessageBubble key={m.id} msg={m} />)
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-slate-200 bg-white p-4 shrink-0">
              <div className="rounded-[14px] border border-slate-200 bg-white shadow-soft focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 transition">
                <div className="flex items-center gap-1 px-3 pt-2 border-b border-slate-100">
                  {(["whatsapp", "email", "interno", "nota"] as const).map((c) => {
                    const label =
                      c === "whatsapp"
                        ? "WhatsApp"
                        : c === "email"
                        ? "E-mail"
                        : c === "interno"
                        ? "Interno"
                        : "Nota";
                    const active = composerCanal === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setComposerCanal(c)}
                        className={cn(
                          "h-6 px-2 rounded text-[11px] font-medium transition",
                          active
                            ? c === "whatsapp"
                              ? "bg-emerald-50 text-emerald-700"
                              : c === "nota"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-brand-50 text-brand-700"
                            : "text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Bot className="h-3 w-3 text-violet-500" />
                    Copilot sugerindo
                  </div>
                </div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Digite a resposta… ou clique em 'Usar sugestão' ao lado"
                  rows={3}
                  className="w-full px-3 py-2.5 text-[14px] bg-transparent outline-none resize-none placeholder:text-slate-400"
                />
                {anexos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                    {anexos.map((nome, idx) => (
                      <span
                        key={`${nome}-${idx}`}
                        className="inline-flex items-center gap-1.5 h-6 px-2 rounded-[8px] border border-slate-200 bg-slate-50 text-[11px] text-slate-700"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[140px] truncate">{nome}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAnexos((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-slate-700"
                          aria-label={`Remover anexo ${nome}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 px-2 pb-2">
                  <label className="inline-flex items-center justify-center h-8 w-8 rounded-[8px] cursor-pointer text-slate-500 hover:bg-slate-100 transition ring-focus">
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const nomes = Array.from(e.target.files ?? []).map((f) => f.name);
                        if (nomes.length) {
                          setAnexos((prev) => [...prev, ...nomes]);
                        }
                        e.target.value = "";
                      }}
                      aria-label="Anexar arquivo"
                    />
                    <Paperclip className="h-4 w-4" />
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      sugestao?.mensagem_sugerida && setDraft(sugestao.mensagem_sugerida)
                    }
                    aria-label="Inserir sugestão da IA"
                  >
                    <Sparkles className="h-4 w-4 text-violet-500" />
                  </Button>
                  <div className="flex-1" />
                  <span className="text-[11px] text-slate-400 tabular mr-2">
                    {draft.length} caracteres
                  </span>
                  <Button
                    size="sm"
                    rightIcon={<Send className="h-3.5 w-3.5" />}
                    disabled={!draft.trim() && anexos.length === 0}
                    onClick={() => {
                      setDraft("");
                      setAnexos([]);
                    }}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Selecione um lead
          </div>
        )}
      </section>

      {/* Copilot panel */}
      <aside className="border-l border-slate-200 bg-white flex flex-col">
        <div className="h-[72px] px-4 border-b border-slate-200 flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-[10px] bg-gradient-to-br from-violet-500 to-brand-600 inline-flex items-center justify-center text-white shadow-soft">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-slate-900">
              Copilot IA
            </div>
            <div className="text-[11px] text-slate-500">
              Claude Sonnet 4 • analisando contexto
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Sugestão */}
          {sugestao && !sugestaoDismissed && (
            <div className="rounded-[14px] border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-md bg-violet-600 inline-flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[11px] font-semibold text-violet-900 uppercase tracking-wider">
                  Sugestão {sugestao.urgencia === "agora" ? "imediata" : sugestao.urgencia}
                </span>
                <Badge tone="violet" className="ml-auto text-[10px]">
                  Alta confiança
                </Badge>
              </div>

              {sugestao.objecao_detectada && (
                <div className="mb-2.5 rounded-[10px] bg-rose-50 border border-rose-100 p-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                    <Flame className="h-3 w-3" /> Objeção detectada
                  </div>
                  <p className="text-[13px] text-rose-900 mt-1">
                    {sugestao.objecao_detectada}
                  </p>
                </div>
              )}

              <div className="rounded-[10px] bg-white border border-slate-200 p-3 text-[13px] text-slate-800 leading-relaxed">
                {sugestao.mensagem_sugerida}
              </div>

              <div className="mt-2.5 text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">Por quê: </span>
                {sugestao.justificativa}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setDraft(sugestao.mensagem_sugerida ?? "")}
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  Usar sugestão
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSugestaoDismissed(true)}
                  aria-label="Dispensar sugestão"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Perfil */}
          <div className="rounded-[14px] border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12px] font-semibold text-slate-900 uppercase tracking-wider">
                Perfil do lead
              </h3>
              <Badge tone={selected?.confianca_tipo === "alta" ? "emerald" : "slate"}>
                {selected?.confianca_tipo} conf.
              </Badge>
            </div>
            {selected && (
              <div className="space-y-2.5 text-[12px]">
                <div>
                  <div className="text-slate-500 text-[11px]">Resumo</div>
                  <p className="text-slate-800 mt-0.5 leading-relaxed">
                    {selected.perfil_resumido}
                  </p>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] mb-1">Motivadores</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.motivadores.map((m) => (
                      <Badge key={m} tone="emerald" className="text-[10px]">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] mb-1">Objeções prováveis</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.objecoes.map((o) => (
                      <Badge key={o} tone="amber" className="text-[10px]">
                        {o}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Valor estimado</span>
                    <span className="font-semibold text-slate-900 tabular">
                      {money(selected.valor_estimado)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Insights similares */}
          <div className="rounded-[14px] border border-slate-200 p-4">
            <h3 className="text-[12px] font-semibold text-slate-900 uppercase tracking-wider mb-2">
              Casos similares
            </h3>
            <ul className="space-y-2">
              {[
                {
                  resumo: "Família com 2 crianças sensível a preço — fechou em 2d",
                  gatilho: "Reframe valor mensal",
                  conv: "+41%",
                },
                {
                  resumo: "Grupo de 4 adultos — anual — fechou em 5d",
                  gatilho: "Benefício exclusivo VIP",
                  conv: "+22%",
                },
              ].map((c, i) => (
                <li
                  key={i}
                  className="rounded-[10px] bg-slate-50 border border-slate-100 p-2.5 hover:border-brand-200 hover:bg-brand-50/30 transition cursor-pointer"
                >
                  <p className="text-[12px] text-slate-700 leading-snug">
                    {c.resumo}
                  </p>
                  <div className="flex items-center justify-between mt-1.5 text-[11px]">
                    <span className="text-slate-500">Gatilho: <span className="text-slate-800 font-medium">{c.gatilho}</span></span>
                    <Badge tone="emerald" className="text-[10px]">
                      {c.conv}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
