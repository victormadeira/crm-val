import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Ban,
  Bot,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Flame,
  Image as ImageIcon,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Search,
  Send,
  Smile,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  TrendingDown,
  TrendingUp,
  Users,
  Video,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/cn";
import { money, relativeTime } from "@/lib/format";
import {
  conversasDoCorretor,
  conversasWA,
  corretorById,
  corretores,
  leadById,
  mensagensDaConversa,
  templatesWA,
} from "@/lib/mock";
import { useApp } from "@/lib/store";
import type {
  AcaoPerdida,
  ConversaStatus,
  ConversaWA,
  MotivoPerdida,
} from "@/lib/types";

/* ─────────────────────────── TEMPERATURA ─────────────────────────── */

const tempConfig = {
  muito_quente: {
    color: "text-rose-600 bg-rose-50 border-rose-200",
    dot: "bg-rose-500",
    label: "Muito quente",
    icon: Flame,
  },
  quente: {
    color: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    label: "Quente",
    icon: Flame,
  },
  morna: {
    color: "text-slate-600 bg-slate-50 border-slate-200",
    dot: "bg-slate-400",
    label: "Morna",
    icon: Clock,
  },
  fria: {
    color: "text-slate-500 bg-slate-50 border-slate-200",
    dot: "bg-slate-300",
    label: "Fria",
    icon: Clock,
  },
} as const;

const statusLabel: Record<ConversaStatus, string> = {
  ativa: "Ao vivo",
  aguardando_cliente: "Aguardando cliente",
  aguardando_corretor: "Aguardando você",
  encerrada_ganha: "Venda fechada",
  encerrada_perdida: "Perdida",
};

/* ─────────────────────────── PÁGINA ─────────────────────────── */

export function WhatsAppConsole() {
  const persona = useApp((s) => s.persona);
  if (!persona) return null;

  const isCorretor = persona.papel === "corretor";
  const isSupervisao =
    persona.papel === "gestor" ||
    persona.papel === "supervisor" ||
    persona.papel === "admin";

  const [searchParams] = useSearchParams();
  const corretorQuery = searchParams.get("corretor");
  const leadQuery = searchParams.get("lead");
  const [supervisionado, setSupervisionado] = useState<string>(
    corretorQuery && corretores.some((c) => c.id === corretorQuery)
      ? corretorQuery
      : "all"
  );

  useEffect(() => {
    if (
      corretorQuery &&
      corretores.some((c) => c.id === corretorQuery) &&
      supervisionado !== corretorQuery
    ) {
      setSupervisionado(corretorQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corretorQuery]);
  const [tab, setTab] = useState<
    "ativas" | "aguardando" | "encerradas" | "todas"
  >("ativas");

  // Pool de conversas visível conforme persona
  const poolConversas = useMemo(() => {
    if (isCorretor) return conversasDoCorretor(persona.id);
    if (supervisionado === "all") return conversasWA;
    return conversasDoCorretor(supervisionado);
  }, [isCorretor, persona.id, supervisionado]);

  const filtradas = useMemo(() => {
    if (tab === "todas") return poolConversas;
    if (tab === "ativas")
      return poolConversas.filter(
        (c) =>
          c.status === "ativa" ||
          c.status === "aguardando_cliente" ||
          c.status === "aguardando_corretor"
      );
    if (tab === "aguardando")
      return poolConversas.filter((c) => c.status === "aguardando_corretor");
    return poolConversas.filter(
      (c) =>
        c.status === "encerrada_ganha" || c.status === "encerrada_perdida"
    );
  }, [tab, poolConversas]);

  const conversaFromLead = leadQuery
    ? conversasWA.find((c) => c.lead_id === leadQuery)
    : undefined;
  const [selecionadaId, setSelecionadaId] = useState<string>(
    () => conversaFromLead?.id ?? filtradas[0]?.id ?? poolConversas[0]?.id ?? "conv-l9"
  );

  useEffect(() => {
    if (conversaFromLead && selecionadaId !== conversaFromLead.id) {
      setSelecionadaId(conversaFromLead.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadQuery]);

  const conversa =
    conversasWA.find((c) => c.id === selecionadaId) ?? poolConversas[0];

  return (
    <>
      <PageHeader
        title={isSupervisao ? "WhatsApp — Supervisão" : "WhatsApp"}
        subtitle={
          isSupervisao
            ? "Conversas de todo o time em tempo real"
            : "Suas conversas com clientes alocados"
        }
        actions={
          isSupervisao ? (
            <CorretorSwitcher
              value={supervisionado}
              onChange={setSupervisionado}
              conversas={conversasWA}
            />
          ) : (
            <Badge tone="emerald" dot>
              Online
            </Badge>
          )
        }
      />

      <div className="px-7 py-6">
        <div className="rounded-[14px] border border-slate-200 bg-white shadow-soft overflow-hidden">
          <div className="grid grid-cols-[340px_1fr_340px] min-h-[calc(100vh-220px)]">
            {/* COLUNA 1 — lista de conversas */}
            <ConversaList
              conversas={filtradas}
              selected={conversa?.id}
              onSelect={setSelecionadaId}
              tab={tab}
              onTab={setTab}
              isSupervisao={isSupervisao}
            />

            {/* COLUNA 2 — chat */}
            {conversa ? (
              <ChatView
                conversa={conversa}
                isSupervisao={isSupervisao}
                personaNome={persona.nome}
              />
            ) : (
              <div className="flex items-center justify-center text-sm text-slate-400 border-x border-slate-200">
                Nenhuma conversa selecionada
              </div>
            )}

            {/* COLUNA 3 — painel lateral */}
            {conversa && (
              <SidePanel
                conversa={conversa}
                isSupervisao={isSupervisao}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────── SWITCHER (gestor) ─────────────────────────── */

function CorretorSwitcher({
  value,
  onChange,
  conversas,
}: {
  value: string;
  onChange: (v: string) => void;
  conversas: ConversaWA[];
}) {
  const counts = useMemo(() => {
    const byC: Record<string, number> = {};
    conversas.forEach((c) => (byC[c.corretor_id] = (byC[c.corretor_id] || 0) + 1));
    return byC;
  }, [conversas]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "h-8 px-3 rounded-[8px] text-[12px] font-medium border transition",
          value === "all"
            ? "bg-brand-600 border-brand-600 text-white"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
        )}
      >
        Todos • {conversas.length}
      </button>
      {corretores.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            "h-8 px-2.5 rounded-[8px] text-[12px] font-medium border transition inline-flex items-center gap-1.5",
            value === c.id
              ? "bg-brand-50 border-brand-300 text-brand-700"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
          )}
        >
          <Avatar name={c.nome} size="xs" />
          <span>{c.nome.split(" ")[0]}</span>
          <span className="text-[10px] text-slate-400 tabular">
            {counts[c.id] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────── LISTA DE CONVERSAS ─────────────────────────── */

function ConversaList({
  conversas,
  selected,
  onSelect,
  tab,
  onTab,
  isSupervisao,
}: {
  conversas: ConversaWA[];
  selected?: string;
  onSelect: (id: string) => void;
  tab: "ativas" | "aguardando" | "encerradas" | "todas";
  onTab: (t: "ativas" | "aguardando" | "encerradas" | "todas") => void;
  isSupervisao: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = conversas
    .filter((c) => {
      if (!search) return true;
      const lead = leadById(c.lead_id);
      return lead?.nome.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      // fixadas primeiro, depois por última atividade
      if (a.fixada && !b.fixada) return -1;
      if (!a.fixada && b.fixada) return 1;
      return (
        new Date(b.ultima_atividade).getTime() -
        new Date(a.ultima_atividade).getTime()
      );
    });

  return (
    <div className="border-r border-slate-200 bg-slate-50/40 flex flex-col min-h-0">
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full h-9 pl-9 pr-3 rounded-[10px] border border-slate-200 bg-slate-50 text-[13px] focus:outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto">
          {(
            [
              ["ativas", "Ativas"],
              ["aguardando", "Aguardando você"],
              ["encerradas", "Encerradas"],
              ["todas", "Todas"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => onTab(k)}
              className={cn(
                "h-7 px-2.5 rounded-[8px] text-[11px] font-semibold whitespace-nowrap transition",
                tab === k
                  ? "bg-brand-100 text-brand-700"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-400">
            Sem conversas neste filtro
          </div>
        )}
        {filtered.map((c) => {
          const lead = leadById(c.lead_id);
          const corr = corretorById(c.corretor_id);
          const mensagens = mensagensDaConversa(c.lead_id);
          const ultima = mensagens[mensagens.length - 1];
          const temp = tempConfig[c.temperatura];
          const ativo = selected === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full text-left px-3 py-3 border-b border-slate-100 hover:bg-white transition flex gap-2.5",
                ativo && "bg-white border-l-2 border-l-brand-500"
              )}
            >
              <div className="relative shrink-0">
                <Avatar name={lead?.nome ?? "?"} size="md" />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white",
                    temp.dot
                  )}
                  aria-label={temp.label}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {c.fixada && (
                      <Pin className="h-3 w-3 text-brand-500 shrink-0" />
                    )}
                    <span className="text-[13px] font-semibold text-slate-900 truncate">
                      {lead?.nome ?? "Lead"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 tabular">
                    {relativeTime(c.ultima_atividade)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-[12px] text-slate-500 truncate">
                    {c.status === "encerrada_ganha"
                      ? "✓ Venda fechada"
                      : c.status === "encerrada_perdida"
                      ? "✕ Não vendeu"
                      : ultima?.conteudo ?? "—"}
                  </p>
                  {c.nao_lidas > 0 && (
                    <span className="h-4 min-w-[16px] px-1 rounded-full bg-brand-500 text-[10px] font-bold text-white inline-flex items-center justify-center">
                      {c.nao_lidas}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      "text-[10px] px-1.5 h-4 inline-flex items-center rounded-[6px] border font-medium",
                      temp.color
                    )}
                  >
                    {temp.label}
                  </span>
                  {isSupervisao && corr && (
                    <span className="text-[10px] text-slate-500 inline-flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      {corr.nome.split(" ")[0]}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── CHAT VIEW ─────────────────────────── */

function ChatView({
  conversa,
  isSupervisao,
  personaNome,
}: {
  conversa: ConversaWA;
  isSupervisao: boolean;
  personaNome: string;
}) {
  const lead = leadById(conversa.lead_id);
  const corr = corretorById(conversa.corretor_id);
  const mensagens = mensagensDaConversa(conversa.lead_id);

  const [draft, setDraft] = useState("");
  const [templateAberto, setTemplateAberto] = useState(false);
  const [encerrarAberto, setEncerrarAberto] = useState(false);
  const [sussurroAberto, setSussurroAberto] = useState(false);
  const [sussurros, setSussurros] = useState<
    { id: string; de: string; texto: string; em: string }[]
  >([]);

  const isEncerrada =
    conversa.status === "encerrada_ganha" ||
    conversa.status === "encerrada_perdida";

  if (!lead) return null;

  return (
    <div className="flex flex-col min-h-0 bg-[#efeae2] relative">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 h-14 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={lead.nome} size="sm" />
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-slate-900 truncate">
              {lead.nome}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>{lead.telefone}</span>
              {isSupervisao && corr && (
                <>
                  <span>•</span>
                  <span className="text-brand-700">
                    atendido por {corr.nome}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isSupervisao && (
            <Badge tone="violet">
              <Eye className="h-3 w-3" /> Modo supervisão
            </Badge>
          )}
          <button className="h-9 w-9 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-100 transition" aria-label="Ligar">
            <Phone className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-100 transition" aria-label="Vídeo">
            <Video className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-100 transition" aria-label="Mais">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Outcome banner se encerrada */}
      {isEncerrada && conversa.outcome && (
        <OutcomeBanner outcome={conversa.outcome} />
      )}

      {/* Mensagens */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 space-y-2"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      >
        {mensagens.map((m, i) => {
          if (m.canal === "sistema") {
            return (
              <div
                key={m.id}
                className="text-center my-2"
              >
                <span className="inline-block text-[10px] text-slate-500 bg-white/90 px-2.5 py-1 rounded-full border border-slate-200 shadow-soft">
                  {m.conteudo}
                </span>
              </div>
            );
          }
          const isOut = m.direcao === "outbound";
          const prev = mensagens[i - 1];
          const mesmoAutor =
            prev && prev.direcao === m.direcao && prev.canal !== "sistema";
          return (
            <div
              key={m.id}
              className={cn(
                "flex",
                isOut ? "justify-end" : "justify-start",
                mesmoAutor ? "mt-0.5" : "mt-1"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-[12px] px-3 py-2 shadow-[0_1px_0.5px_rgba(0,0,0,.13)] relative",
                  isOut
                    ? "bg-[#d9fdd3] text-slate-900"
                    : "bg-white text-slate-900"
                )}
              >
                {m.tipo === "documento" ? (
                  <div className="flex items-center gap-2 min-w-[220px]">
                    <div className="h-10 w-10 rounded-[8px] bg-slate-100 inline-flex items-center justify-center">
                      <FileText className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="text-[13px] font-medium text-slate-800 flex-1">
                      {m.conteudo || "Proposta.pdf"}
                    </div>
                  </div>
                ) : (
                  <p className="text-[13.5px] leading-snug whitespace-pre-wrap break-words">
                    {m.conteudo}
                  </p>
                )}
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 mt-0.5",
                    isOut ? "text-slate-500" : "text-slate-400"
                  )}
                >
                  <span className="text-[10px] tabular">
                    {new Date(m.sent_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isOut && (
                    <CheckCheck
                      className={cn(
                        "h-3 w-3",
                        m.lida ? "text-sky-500" : "text-slate-400"
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      {!isEncerrada && !isSupervisao && (
        <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTemplateAberto(true)}
              className="h-10 px-3 rounded-[10px] bg-white border border-slate-200 text-[12px] font-semibold text-brand-700 hover:border-brand-300 inline-flex items-center gap-1.5 shrink-0 transition"
            >
              <Sparkles className="h-3.5 w-3.5" /> Templates
            </button>
            <div className="flex-1 flex items-center gap-2 bg-white rounded-[14px] border border-slate-200 px-3 py-1.5">
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-100" aria-label="Emoji">
                <Smile className="h-4.5 w-4.5" />
              </button>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-100" aria-label="Anexar">
                <Paperclip className="h-4.5 w-4.5" />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Digite uma mensagem"
                className="flex-1 h-9 bg-transparent text-[13.5px] focus:outline-none"
              />
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-100" aria-label="Áudio">
                <Mic className="h-4.5 w-4.5" />
              </button>
            </div>
            <button
              disabled={!draft.trim()}
              className={cn(
                "h-10 w-10 inline-flex items-center justify-center rounded-full shrink-0 transition",
                draft.trim()
                  ? "bg-brand-600 hover:bg-brand-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<ThumbsUp className="h-3.5 w-3.5" />}
              onClick={() => setEncerrarAberto(true)}
            >
              Venda fechada
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<ThumbsDown className="h-3.5 w-3.5" />}
              onClick={() => setEncerrarAberto(true)}
            >
              Não vendeu
            </Button>
            <span className="text-[11px] text-slate-500 ml-auto inline-flex items-center gap-1">
              <Bot className="h-3 w-3 text-brand-500" />
              IA captura automaticamente ao encerrar
            </span>
          </div>
        </div>
      )}

      {isSupervisao && !isEncerrada && (
        <div className="shrink-0 bg-violet-50 border-t border-violet-200 px-4 py-2.5 flex items-center justify-between gap-3 text-[12px] text-violet-800">
          <div className="inline-flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            <span>
              Modo supervisão — {personaNome} assiste sem interferir na conversa
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Volume2 className="h-3.5 w-3.5" />}
            onClick={() => setSussurroAberto(true)}
          >
            Sussurrar ao corretor
          </Button>
        </div>
      )}

      <SussurrarDialog
        open={sussurroAberto}
        onClose={() => setSussurroAberto(false)}
        corretorNome={corr?.nome ?? "corretor"}
        onSend={(texto) => {
          setSussurros((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              de: personaNome,
              texto,
              em: new Date().toISOString(),
            },
          ]);
          setSussurroAberto(false);
        }}
      />

      {sussurros.length > 0 && (
        <div className="shrink-0 bg-violet-50/80 border-t border-violet-200 px-4 py-2 space-y-1.5">
          {sussurros.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-2 text-[12px] rounded-[10px] border border-violet-200 bg-white/70 px-2.5 py-1.5"
            >
              <Volume2 className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-violet-600 font-bold">
                  Sussurro de {s.de} · somente {corr?.nome ?? "corretor"} vê
                </div>
                <div className="text-slate-800 leading-relaxed">{s.texto}</div>
              </div>
              <button
                onClick={() =>
                  setSussurros((prev) => prev.filter((x) => x.id !== s.id))
                }
                className="text-violet-400 hover:text-violet-700 transition"
                aria-label="Dispensar sussurro"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <TemplatesDialog
        open={templateAberto}
        onClose={() => setTemplateAberto(false)}
        onPick={(c) => {
          setDraft(c);
          setTemplateAberto(false);
        }}
      />
      <EncerrarDialog
        open={encerrarAberto}
        onClose={() => setEncerrarAberto(false)}
        lead={lead}
      />
    </div>
  );
}

/* ─────────────────────────── OUTCOME BANNER ─────────────────────────── */

function OutcomeBanner({
  outcome,
}: {
  outcome: NonNullable<ConversaWA["outcome"]>;
}) {
  const ganha = outcome.tipo === "ganha";
  return (
    <div
      className={cn(
        "px-5 py-3 border-b flex items-start gap-3 text-[12px]",
        ganha
          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
          : "bg-rose-50 border-rose-200 text-rose-900"
      )}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-full inline-flex items-center justify-center text-white shrink-0",
          ganha ? "bg-emerald-500" : "bg-rose-500"
        )}
      >
        {ganha ? (
          <Trophy className="h-4 w-4" />
        ) : (
          <Ban className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">
          {ganha
            ? `Venda fechada — ${money(outcome.valor ?? 0)}`
            : `Não vendeu — ${motivoLabel(outcome.motivo_perdida)}`}
        </div>
        <p className="mt-0.5 opacity-80 leading-relaxed">{outcome.resumo_ia}</p>
      </div>
    </div>
  );
}

const motivoLabel = (m?: MotivoPerdida) =>
  m === "preco"
    ? "preço"
    : m === "momento_errado"
    ? "momento errado"
    : m === "foi_concorrente"
    ? "foi para concorrente"
    : m === "sumiu"
    ? "cliente sumiu"
    : m === "nao_icp"
    ? "fora do perfil"
    : m === "ja_tinha"
    ? "já tinha passaporte"
    : "—";

/* ─────────────────────────── SIDE PANEL ─────────────────────────── */

function SidePanel({
  conversa,
  isSupervisao,
}: {
  conversa: ConversaWA;
  isSupervisao: boolean;
}) {
  const navigate = useNavigate();
  const lead = leadById(conversa.lead_id);
  const corr = corretorById(conversa.corretor_id);
  if (!lead) return null;

  const irCriarProposta = () => {
    const params = new URLSearchParams({
      novo: "1",
      lead: lead.id,
      nome: lead.nome,
      email: lead.email,
      valor: String(lead.valor_estimado),
      template: lead.tipo_passaporte_recomendado,
    });
    navigate(`/propostas?${params.toString()}`);
  };

  return (
    <div className="border-l border-slate-200 bg-white overflow-y-auto">
      {/* Cliente */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Avatar name={lead.nome} size="lg" />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-slate-900 truncate">
              {lead.nome}
            </div>
            <div className="text-[11px] text-slate-500">{lead.telefone}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[8px] bg-slate-50 border border-slate-200 p-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
              Score
            </div>
            <div className="text-[15px] font-bold tabular text-slate-900 mt-0.5">
              {lead.score}
            </div>
          </div>
          <div className="rounded-[8px] bg-slate-50 border border-slate-200 p-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
              Ticket
            </div>
            <div className="text-[15px] font-bold tabular text-slate-900 mt-0.5">
              {money(lead.valor_estimado)}
            </div>
          </div>
          <div className="rounded-[8px] bg-slate-50 border border-slate-200 p-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
              Canal
            </div>
            <div className="text-[11px] font-semibold text-slate-700 mt-1 capitalize">
              {lead.canal}
            </div>
          </div>
        </div>
        {isSupervisao && corr && (
          <div className="mt-3 rounded-[10px] bg-violet-50 border border-violet-200 p-2.5 flex items-center gap-2">
            <Avatar name={corr.nome} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase tracking-wider text-violet-700 font-semibold">
                Corretor responsável
              </div>
              <div className="text-[13px] font-semibold text-violet-900 truncate">
                {corr.nome}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Copiloto IA */}
      {conversa.ia_parcial && (
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-[8px] bg-gradient-to-br from-slate-900 to-brand-700 text-white inline-flex items-center justify-center">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-[13px] font-semibold text-slate-900">
              Copiloto IA
            </h4>
          </div>

          <div className="rounded-[10px] border border-brand-200 bg-brand-50/60 p-3">
            <div className="text-[10px] uppercase tracking-wider text-brand-700 font-bold">
              Próximo passo sugerido
            </div>
            <p className="text-[12px] text-slate-800 mt-1 leading-relaxed">
              {conversa.ia_parcial.proximo_passo_sugerido}
            </p>
          </div>

          {conversa.ia_parcial.objecoes_detectadas.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                Objeções detectadas
              </div>
              <ul className="space-y-1">
                {conversa.ia_parcial.objecoes_detectadas.map((o) => (
                  <li
                    key={o}
                    className="text-[11px] text-slate-700 inline-flex items-start gap-1.5"
                  >
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {conversa.ia_parcial.gatilhos_positivos.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                Gatilhos positivos
              </div>
              <ul className="space-y-1">
                {conversa.ia_parcial.gatilhos_positivos.map((g) => (
                  <li
                    key={g}
                    className="text-[11px] text-slate-700 inline-flex items-start gap-1.5"
                  >
                    <Zap className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Outcome IA completo (conversas encerradas) */}
      {conversa.outcome && (
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                "h-7 w-7 rounded-[8px] inline-flex items-center justify-center text-white",
                conversa.outcome.tipo === "ganha"
                  ? "bg-emerald-500"
                  : "bg-rose-500"
              )}
            >
              <Bot className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-[13px] font-semibold text-slate-900">
              {conversa.outcome.tipo === "ganha"
                ? "O que funcionou"
                : "Por que não fechou"}
            </h4>
          </div>
          {conversa.outcome.padroes_identificados && (
            <ul className="space-y-1.5">
              {conversa.outcome.padroes_identificados.map((p) => (
                <li
                  key={p}
                  className={cn(
                    "text-[11.5px] leading-relaxed inline-flex items-start gap-1.5 rounded-[8px] p-2 border",
                    conversa.outcome!.tipo === "ganha"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                  )}
                >
                  {conversa.outcome!.tipo === "ganha" ? (
                    <TrendingUp className="h-3 w-3 shrink-0 mt-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 shrink-0 mt-0.5" />
                  )}
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
          {conversa.outcome.acao_realizada && (
            <div className="mt-3 text-[11px] text-slate-600">
              <span className="uppercase tracking-wider font-bold text-slate-500">
                Ação tomada:
              </span>{" "}
              {acaoLabel(conversa.outcome.acao_realizada)}
            </div>
          )}
        </div>
      )}

      {/* Perfil resumido */}
      <div className="p-4 border-b border-slate-100">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
          Perfil
        </div>
        <p className="text-[12px] text-slate-700 leading-relaxed">
          {lead.perfil_resumido}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.tags.map((t) => (
            <Badge key={t} tone="slate" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
      </div>

      {/* Ações rápidas */}
      {!conversa.outcome && (
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
            Atalhos
          </div>
          <div className="space-y-1.5">
            <button
              onClick={irCriarProposta}
              className="w-full h-9 px-3 rounded-[8px] border border-slate-200 text-[12px] font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700 transition flex items-center gap-2 ring-focus"
            >
              <Target className="h-3.5 w-3.5" />
              Criar proposta
            </button>
            <button className="w-full h-9 px-3 rounded-[8px] border border-slate-200 text-[12px] font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700 transition flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5" />
              Enviar vídeo da atração
            </button>
            <button className="w-full h-9 px-3 rounded-[8px] border border-slate-200 text-[12px] font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700 transition flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Agendar follow-up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const acaoLabel = (a: AcaoPerdida) =>
  a === "nutrir_7d"
    ? "Nutrição 7 dias"
    : a === "nutrir_15d"
    ? "Nutrição 15 dias"
    : a === "nutrir_30d"
    ? "Nutrição 30 dias"
    : a === "realocar"
    ? "Realocado para outro corretor"
    : a === "downgrade"
    ? "Oferta de downgrade"
    : "Arquivado";

/* ─────────────────────────── SUSSURRAR DIALOG ─────────────────────────── */

function SussurrarDialog({
  open,
  onClose,
  corretorNome,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  corretorNome: string;
  onSend: (texto: string) => void;
}) {
  const [texto, setTexto] = useState("");

  useEffect(() => {
    if (!open) setTexto("");
  }, [open]);

  const sugestoes = [
    "Mencione a promoção de 10% para fechamento hoje.",
    "Cliente parece em dúvida — pergunte sobre objeção principal.",
    "Ofereça parcelamento em 12x sem juros.",
    "Envie vídeo do tobogã radical agora.",
  ];

  const enviar = () => {
    const t = texto.trim();
    if (!t) return;
    onSend(t);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Sussurrar ao corretor"
      subtitle={`Mensagem privada para ${corretorNome} — o cliente não verá`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            leftIcon={<Volume2 className="h-3.5 w-3.5" />}
            onClick={enviar}
            disabled={!texto.trim()}
          >
            Enviar sussurro
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="rounded-[10px] bg-violet-50 border border-violet-200 px-3 py-2 text-[12px] text-violet-800 inline-flex items-start gap-2">
          <Volume2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Sussurros aparecem apenas no console do corretor, nunca são enviados
            pelo WhatsApp.
          </span>
        </div>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder="Ex.: Mencione o desconto de 10% para fechamento hoje..."
          rows={4}
          className="w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
          autoFocus
        />

        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
            Sugestões rápidas
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sugestoes.map((s) => (
              <button
                key={s}
                onClick={() => setTexto(s)}
                className="text-[11px] rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-violet-300 hover:text-violet-700 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Atalho: ⌘/Ctrl + Enter para enviar
        </div>
      </div>
    </Dialog>
  );
}

/* ─────────────────────────── TEMPLATES DIALOG ─────────────────────────── */

function TemplatesDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (c: string) => void;
}) {
  const [cat, setCat] = useState<string>("todos");
  const filtered =
    cat === "todos"
      ? templatesWA
      : templatesWA.filter((t) => t.categoria === cat);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Templates aprovados"
      subtitle="Mensagens prontas conforme categoria"
      size="lg"
    >
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
        {(
          [
            "todos",
            "abertura",
            "proposta",
            "objecao",
            "fechamento",
            "nutricao",
          ] as const
        ).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "h-8 px-3 rounded-[8px] text-[12px] font-semibold capitalize whitespace-nowrap transition",
              cat === c
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t.conteudo)}
            className="w-full text-left rounded-[12px] border border-slate-200 p-3 hover:border-brand-300 hover:bg-brand-50/30 transition"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                <span className="text-[13px] font-semibold text-slate-900">
                  {t.nome}
                </span>
              </div>
              <Badge tone="slate" className="text-[10px] capitalize">
                {t.categoria}
              </Badge>
            </div>
            <p className="text-[12px] text-slate-600 mt-1.5 leading-relaxed">
              {t.conteudo}
            </p>
          </button>
        ))}
      </div>
    </Dialog>
  );
}

/* ─────────────────────────── ENCERRAR DIALOG ─────────────────────────── */

function EncerrarDialog({
  open,
  onClose,
  lead,
}: {
  open: boolean;
  onClose: () => void;
  lead: NonNullable<ReturnType<typeof leadById>>;
}) {
  const [step, setStep] = useState<"tipo" | "detalhes" | "acao" | "confirmado">(
    "tipo"
  );
  const [tipo, setTipo] = useState<"ganha" | "perdida" | null>(null);
  const [motivo, setMotivo] = useState<MotivoPerdida | null>(null);
  const [acao, setAcao] = useState<AcaoPerdida | null>(null);
  const [valor, setValor] = useState<number>(lead.valor_estimado);

  const reset = () => {
    setStep("tipo");
    setTipo(null);
    setMotivo(null);
    setAcao(null);
    onClose();
  };

  const motivos: { id: MotivoPerdida; label: string; icon: any; sugestao: AcaoPerdida }[] = [
    { id: "preco", label: "Preço alto", icon: TrendingDown, sugestao: "downgrade" },
    { id: "momento_errado", label: "Momento errado", icon: Clock, sugestao: "nutrir_30d" },
    { id: "foi_concorrente", label: "Foi pro concorrente", icon: X, sugestao: "nutrir_30d" },
    { id: "sumiu", label: "Cliente sumiu", icon: Ban, sugestao: "nutrir_15d" },
    { id: "nao_icp", label: "Fora do perfil", icon: Users, sugestao: "arquivar" },
    { id: "ja_tinha", label: "Já tinha passaporte", icon: Check, sugestao: "arquivar" },
  ];

  const sugestaoAcao = motivo
    ? motivos.find((m) => m.id === motivo)?.sugestao
    : null;

  return (
    <Dialog
      open={open}
      onClose={reset}
      title={
        step === "confirmado"
          ? "Conversa encerrada"
          : "Encerrar conversa"
      }
      subtitle={
        step === "tipo"
          ? "Como terminou com o cliente?"
          : step === "detalhes"
          ? tipo === "ganha"
            ? "Detalhes da venda"
            : "O que aconteceu?"
          : step === "acao"
          ? "Próximo passo"
          : undefined
      }
      size="md"
      footer={
        step !== "confirmado" && (
          <>
            <Button variant="outline" onClick={reset}>
              Cancelar
            </Button>
            {step === "tipo" && (
              <Button
                disabled={!tipo}
                onClick={() => setStep(tipo === "ganha" ? "detalhes" : "detalhes")}
                rightIcon={<ChevronDown className="h-3.5 w-3.5 -rotate-90" />}
              >
                Continuar
              </Button>
            )}
            {step === "detalhes" && (
              <Button
                disabled={tipo === "perdida" && !motivo}
                onClick={() => {
                  if (tipo === "ganha") {
                    setStep("confirmado");
                  } else {
                    setAcao(sugestaoAcao ?? "nutrir_15d");
                    setStep("acao");
                  }
                }}
              >
                Continuar
              </Button>
            )}
            {step === "acao" && (
              <Button
                disabled={!acao}
                onClick={() => setStep("confirmado")}
              >
                Aplicar ação
              </Button>
            )}
          </>
        )
      }
    >
      {step === "tipo" && (
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                v: "ganha",
                title: "Venda fechada",
                sub: "Cliente comprou o passaporte",
                tone: "emerald" as const,
                Icon: Trophy,
              },
              {
                v: "perdida",
                title: "Não vendeu",
                sub: "Cliente desistiu ou sumiu",
                tone: "rose" as const,
                Icon: Ban,
              },
            ] as const
          ).map((o) => {
            const ativo = tipo === o.v;
            const Icon = o.Icon;
            return (
              <button
                key={o.v}
                onClick={() => setTipo(o.v as "ganha" | "perdida")}
                className={cn(
                  "rounded-[12px] border-2 p-4 text-left transition",
                  ativo
                    ? o.tone === "emerald"
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-rose-400 bg-rose-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-[10px] inline-flex items-center justify-center text-white mb-2",
                    o.tone === "emerald" ? "bg-emerald-500" : "bg-rose-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-[14px] font-semibold text-slate-900">
                  {o.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{o.sub}</div>
              </button>
            );
          })}
        </div>
      )}

      {step === "detalhes" && tipo === "ganha" && (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
              Valor fechado
            </label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              className="mt-1 w-full h-11 px-3 rounded-[10px] border border-slate-200 text-[15px] font-semibold tabular focus:outline-none focus:border-brand-400"
            />
          </div>
          <div className="rounded-[10px] bg-brand-50 border border-brand-200 p-3 flex items-start gap-2">
            <Bot className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="text-[12px] text-brand-900">
              <strong>IA vai capturar toda a conversa</strong> e extrair os
              gatilhos vencedores automaticamente — seus padrões entram no
              aprendizado do time.
            </div>
          </div>
        </div>
      )}

      {step === "detalhes" && tipo === "perdida" && (
        <div className="grid grid-cols-2 gap-2">
          {motivos.map((m) => {
            const Icon = m.icon;
            const ativo = motivo === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMotivo(m.id)}
                className={cn(
                  "rounded-[10px] border-2 p-3 text-left transition flex items-center gap-2.5",
                  ativo
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-[8px] inline-flex items-center justify-center shrink-0",
                    ativo
                      ? "bg-rose-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[13px] font-medium text-slate-900">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {step === "acao" && (
        <div className="space-y-3">
          <div className="rounded-[10px] bg-violet-50 border border-violet-200 p-3 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
            <div className="text-[12px] text-violet-900">
              <strong>IA sugere: {acaoLabel(sugestaoAcao!)}</strong> com base
              em 47 casos similares.
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {(
              [
                { id: "nutrir_7d", label: "Nutrição 7 dias", sub: "Conteúdo relevante essa semana" },
                { id: "nutrir_15d", label: "Nutrição 15 dias", sub: "Agenda de feriado ou evento" },
                { id: "nutrir_30d", label: "Nutrição 30 dias", sub: "Cadência longa com reengajamento" },
                { id: "realocar", label: "Realocar para outro corretor", sub: "Diferente abordagem pode converter" },
                { id: "downgrade", label: "Oferecer downgrade", sub: "Passaporte individual ou diário" },
                { id: "arquivar", label: "Arquivar", sub: "Sem ação futura" },
              ] as { id: AcaoPerdida; label: string; sub: string }[]
            ).map((o) => {
              const ativo = acao === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setAcao(o.id)}
                  className={cn(
                    "rounded-[10px] border-2 p-3 text-left transition flex items-center justify-between",
                    ativo
                      ? "border-brand-400 bg-brand-50"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900">
                      {o.label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {o.sub}
                    </div>
                  </div>
                  {ativo && (
                    <div className="h-6 w-6 rounded-full bg-brand-500 text-white inline-flex items-center justify-center">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "confirmado" && (
        <div className="text-center py-6">
          <div
            className={cn(
              "h-16 w-16 mx-auto rounded-full inline-flex items-center justify-center text-white shadow-pop",
              tipo === "ganha" ? "bg-emerald-500" : "bg-rose-500"
            )}
          >
            {tipo === "ganha" ? (
              <Trophy className="h-7 w-7" />
            ) : (
              <Ban className="h-7 w-7" />
            )}
          </div>
          <h3 className="mt-4 text-[18px] font-semibold text-slate-900">
            {tipo === "ganha"
              ? "Venda registrada!"
              : "Conversa encerrada"}
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
            {tipo === "ganha"
              ? "A IA está analisando a conversa. O insight aparece em IA Aprendizado em até 2 minutos."
              : `Lead em cadência: ${acaoLabel(acao!)}. A IA já extraiu os aprendizados desta conversa.`}
          </p>
          <div className="mt-5">
            <Button onClick={reset}>Fechar</Button>
          </div>
        </div>
      )}

      {(step === "tipo" || step === "detalhes" || step === "acao") && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span className={cn(step === "tipo" && "text-brand-700")}>
              1. Resultado
            </span>
            <span>•</span>
            <span className={cn(step === "detalhes" && "text-brand-700")}>
              2. {tipo === "ganha" ? "Valor" : "Motivo"}
            </span>
            {tipo === "perdida" && (
              <>
                <span>•</span>
                <span className={cn(step === "acao" && "text-brand-700")}>
                  3. Ação
                </span>
              </>
            )}
          </div>
          <Progress
            value={
              step === "tipo"
                ? 33
                : step === "detalhes"
                ? tipo === "perdida"
                  ? 66
                  : 100
                : 100
            }
            tone="brand"
            className="mt-2"
          />
        </div>
      )}
    </Dialog>
  );
}
