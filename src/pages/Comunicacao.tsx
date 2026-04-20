import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Hash,
  Lock,
  Plus,
  Search,
  Bot,
  Bell,
  Pin,
  Users as UsersIcon,
  MessageSquare,
  AtSign,
  Paperclip,
  Smile,
  Send,
  Zap,
  ChevronDown,
  ChevronRight,
  X,
  Star,
  Reply,
  MoreHorizontal,
  Sparkles,
  Phone,
  Video,
  Shield,
  Wrench,
  Megaphone,
  DollarSign,
  Headphones,
  Building2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Ticket,
  CalendarDays,
  FileText,
  Flame,
  UserPlus,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/lib/store";
import { PageHeader, PageContent } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { relativeTime } from "@/lib/format";
import {
  canaisInternos,
  dmsInternas,
  botsInternos,
  slashCommandsInternos,
  usuariosInternos,
  usuarioInternoById,
  botById,
  mensagensPorCanal,
  mensagensInternas,
} from "@/lib/mock";
import type {
  CanalInterno,
  DMInterna,
  MensagemInterna,
  ReacaoInterna,
  UnfurlInterno,
} from "@/lib/types";

/* ─────────────────────────── HELPERS ─────────────────────────── */

const CurrentUserContext = createContext<string>("gestor1");
const useCurrentUserId = () => useContext(CurrentUserContext);

const mapPersonaToInternalId = (
  personaId: string | undefined,
  papel: string | undefined
): string => {
  if (papel === "gestor") return "gestor1";
  if (papel === "admin") return "gestor1";
  if (papel === "supervisor") return "sup1";
  if (papel === "sac") return "sac1";
  if (papel === "corretor" && personaId) return personaId;
  return "gestor1";
};

const podeVerCanal = (canal: CanalInterno, uid: string) =>
  canal.membros.includes(uid);
const podeVerDM = (dm: DMInterna, uid: string) =>
  dm.participantes.includes(uid);

const iconPorCanal = (nome: string) => {
  if (nome.includes("seguranca")) return Shield;
  if (nome.includes("manutencao")) return Wrench;
  if (nome.includes("marketing")) return Megaphone;
  if (nome.includes("financeiro")) return DollarSign;
  if (nome.includes("atendimento")) return Headphones;
  if (nome.includes("bilheteria")) return Ticket;
  if (nome.includes("incidente")) return AlertTriangle;
  if (nome.includes("vendas")) return Flame;
  if (nome.includes("operacoes")) return Activity;
  if (nome.includes("diretoria")) return Star;
  if (nome.includes("evento") || nome.includes("grupo")) return Building2;
  if (nome.includes("ti")) return Zap;
  return Hash;
};

const statusDotClass = (status: string) => {
  if (status === "ativo") return "bg-emerald-500";
  if (status === "ocupado") return "bg-rose-500";
  if (status === "ausente") return "bg-amber-400";
  return "bg-slate-300";
};

const botTone = (cor: string) => {
  const map: Record<
    string,
    { bg: string; text: string; ring: string; icon: string }
  > = {
    brand: { bg: "bg-brand-50", text: "text-brand-700", ring: "ring-brand-200", icon: "text-brand-600" },
    aqua: { bg: "bg-aqua-50", text: "text-aqua-700", ring: "ring-aqua-200", icon: "text-aqua-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", icon: "text-amber-600" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", icon: "text-rose-600" },
    violet: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", icon: "text-violet-600" },
    sky: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", icon: "text-sky-600" },
    fuchsia: { bg: "bg-fuchsia-50", text: "text-fuchsia-700", ring: "ring-fuchsia-200", icon: "text-fuchsia-600" },
  };
  return map[cor] ?? map.brand;
};

const iconPorUnfurl = (tipo: UnfurlInterno["tipo"]) => {
  switch (tipo) {
    case "passaporte":
      return QrCode;
    case "ingresso":
      return Ticket;
    case "lead":
      return UserPlus;
    case "ticket":
      return FileText;
    case "incidente":
      return AlertTriangle;
    case "capacidade":
      return CalendarDays;
  }
};

const toneBadge = (tone: string): "emerald" | "amber" | "rose" | "sky" | "violet" | "slate" => {
  const valid = ["emerald", "amber", "rose", "sky", "violet", "slate"];
  return (valid.includes(tone) ? tone : "slate") as "emerald" | "amber" | "rose" | "sky" | "violet" | "slate";
};

const agruparPorDia = (mensagens: MensagemInterna[]) => {
  const grupos: { label: string; dia: string; mensagens: MensagemInterna[] }[] =
    [];
  for (const m of mensagens) {
    const dia = m.timestamp.slice(0, 10);
    const hoje = new Date().toISOString().slice(0, 10);
    const ontem = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const label =
      dia === hoje
        ? "Hoje"
        : dia === ontem
          ? "Ontem"
          : new Date(m.timestamp).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
            });
    const g = grupos.find((x) => x.dia === dia);
    if (g) g.mensagens.push(m);
    else grupos.push({ label, dia, mensagens: [m] });
  }
  return grupos;
};

const mesmoAutorRecente = (a: MensagemInterna, b: MensagemInterna) => {
  if (a.autor_id !== b.autor_id || a.autor_tipo !== b.autor_tipo) return false;
  const diff =
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  return Math.abs(diff) < 5 * 60 * 1000;
};

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

/* ─────────────────────────── PÁGINA ─────────────────────────── */

export function Comunicacao() {
  const persona = useApp((s) => s.persona);
  const CURRENT_USER_ID = useMemo(
    () => mapPersonaToInternalId(persona?.id, persona?.papel),
    [persona?.id, persona?.papel]
  );
  const currentUser = usuarioInternoById(CURRENT_USER_ID);

  const canaisVisiveis = useMemo(
    () => canaisInternos.filter((c) => podeVerCanal(c, CURRENT_USER_ID)),
    [CURRENT_USER_ID]
  );
  const dmsVisiveis = useMemo(
    () => dmsInternas.filter((d) => podeVerDM(d, CURRENT_USER_ID)),
    [CURRENT_USER_ID]
  );

  const canalInicial =
    canaisVisiveis.find((c) => c.id === "ch_geral")?.id ??
    canaisVisiveis[0]?.id ??
    dmsVisiveis[0]?.id ??
    "";

  const [canalAtivo, setCanalAtivo] = useState<string>(canalInicial);
  const [threadAberta, setThreadAberta] = useState<string | null>(null);
  const [mostrarBots, setMostrarBots] = useState(false);
  const [mostrarSlash, setMostrarSlash] = useState(false);
  const [novoCanalOpen, setNovoCanalOpen] = useState(false);

  const [secOperacionais, setSecOperacionais] = useState(true);
  const [secGestao, setSecGestao] = useState(true);
  const [secProjetos, setSecProjetos] = useState(true);
  const [secDMs, setSecDMs] = useState(true);

  const [busca, setBusca] = useState("");

  const [mensagensEnviadas, setMensagensEnviadas] = useState<MensagemInterna[]>(
    []
  );
  const [acoesAplicadas, setAcoesAplicadas] = useState<Record<string, string>>(
    {}
  );
  const [reacoesAplicadas, setReacoesAplicadas] = useState<
    Record<string, ReacaoInterna[]>
  >({});

  useEffect(() => {
    const canalAindaAcessivel =
      canaisVisiveis.some((c) => c.id === canalAtivo) ||
      dmsVisiveis.some((d) => d.id === canalAtivo);
    if (!canalAindaAcessivel && canalInicial) {
      setCanalAtivo(canalInicial);
      setThreadAberta(null);
    }
  }, [canaisVisiveis, dmsVisiveis, canalAtivo, canalInicial]);

  const canalObj = useMemo(
    () =>
      canaisVisiveis.find((c) => c.id === canalAtivo),
    [canalAtivo, canaisVisiveis]
  );
  const dmObj = useMemo(
    () => dmsVisiveis.find((d) => d.id === canalAtivo),
    [canalAtivo, dmsVisiveis]
  );

  const temAcesso = !!canalObj || !!dmObj;

  const mensagens = useMemo(() => {
    if (!temAcesso) return [] as MensagemInterna[];
    const base = mensagensPorCanal(canalAtivo);
    const extras = mensagensEnviadas.filter((m) => m.canal_id === canalAtivo);
    const mescladas = [...base, ...extras].map((m) => ({
      ...m,
      reacoes: reacoesAplicadas[m.id] ?? m.reacoes,
    }));
    return mescladas.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [canalAtivo, mensagensEnviadas, reacoesAplicadas, temAcesso]);

  const paiBruto = threadAberta
    ? mensagensInternas.find((m) => m.id === threadAberta)
    : undefined;
  const pai =
    paiBruto &&
    (canaisVisiveis.some((c) => c.id === paiBruto.canal_id) ||
      dmsVisiveis.some((d) => d.id === paiBruto.canal_id))
      ? paiBruto
      : undefined;

  const enviarMensagem = (conteudo: string) => {
    if (!conteudo.trim()) return;
    if (!canalObj && !dmObj) return;
    const nova: MensagemInterna = {
      id: `sent_${Date.now()}`,
      canal_id: canalAtivo,
      autor_tipo: "user",
      autor_id: CURRENT_USER_ID,
      conteudo,
      timestamp: new Date().toISOString(),
      mencao_canal: conteudo.includes("@canal"),
    };
    setMensagensEnviadas((prev) => [...prev, nova]);
  };

  const aplicarAcao = (mid: string, aid: string, label: string) => {
    setAcoesAplicadas((prev) => ({ ...prev, [`${mid}:${aid}`]: label }));
  };

  const toggleReacao = (mid: string, emoji: string) => {
    setReacoesAplicadas((prev) => {
      const base =
        prev[mid] ??
        mensagensInternas.find((m) => m.id === mid)?.reacoes ??
        [];
      const idx = base.findIndex((r) => r.emoji === emoji);
      const next = [...base];
      if (idx === -1) {
        next.push({ emoji, usuarios: [CURRENT_USER_ID] });
      } else {
        const r = next[idx];
        const has = r.usuarios.includes(CURRENT_USER_ID);
        const users = has
          ? r.usuarios.filter((u) => u !== CURRENT_USER_ID)
          : [...r.usuarios, CURRENT_USER_ID];
        if (users.length === 0) next.splice(idx, 1);
        else next[idx] = { emoji, usuarios: users };
      }
      return { ...prev, [mid]: next };
    });
  };

  const filtrar = (lista: CanalInterno[]) =>
    busca
      ? lista.filter(
          (c) =>
            c.nome.toLowerCase().includes(busca.toLowerCase()) ||
            c.proposito.toLowerCase().includes(busca.toLowerCase())
        )
      : lista;

  const operacionais = filtrar(
    canaisVisiveis.filter(
      (c) => c.tipo === "operacional" || c.tipo === "incidente"
    )
  ).filter((c) => !c.nome.includes("incidente-") && !c.nome.includes("-2026"));
  const gestao = filtrar(canaisVisiveis.filter((c) => c.tipo === "gestao"));
  const projetos = filtrar(
    canaisVisiveis.filter(
      (c) =>
        c.tipo === "projeto" ||
        c.nome.includes("incidente-") ||
        c.nome.includes("-2026")
    )
  );

  const totalNaoLidas =
    canaisVisiveis.reduce((acc, c) => acc + (c.nao_lidas ?? 0), 0) +
    dmsVisiveis.reduce((acc, d) => acc + (d.nao_lidas ?? 0), 0);

  return (
    <CurrentUserContext.Provider value={CURRENT_USER_ID}>
      <PageHeader
        title="Aqua Chat"
        subtitle="Comunicação interna do Parque Valparaíso — canais, bots e slash commands"
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="brand" dot>
              {totalNaoLidas} não lidas
            </Badge>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Bot className="h-3.5 w-3.5" />}
              onClick={() => setMostrarBots(true)}
            >
              6 bots
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Zap className="h-3.5 w-3.5" />}
              onClick={() => setMostrarSlash(true)}
            >
              Slash commands
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setNovoCanalOpen(true)}
            >
              Novo canal
            </Button>
          </div>
        }
      />

      <PageContent>
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-soft overflow-hidden">
          <div className="flex min-h-[calc(100vh-240px)]">
            {/* ──────────── Sidebar canais ──────────── */}
            <aside className="w-[272px] shrink-0 border-r border-slate-200 bg-slate-50/40 flex flex-col">
              <div className="px-3 py-3 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2 bg-slate-100 rounded-[10px] px-2.5 h-9 text-[13px]">
                  <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar canais e pessoas"
                    className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="px-2 py-2 border-b border-slate-200 space-y-0.5">
                <QuickLink
                  icon={MessageSquare}
                  label="Menções"
                  count={4}
                />
                <QuickLink icon={Pin} label="Fixadas" />
                <QuickLink
                  icon={Bot}
                  label="Bots & automações"
                  count={6}
                  onClick={() => setMostrarBots(true)}
                />
                <QuickLink
                  icon={Zap}
                  label="Slash commands"
                  onClick={() => setMostrarSlash(true)}
                />
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                <Section
                  title="Operacionais"
                  open={secOperacionais}
                  onToggle={() => setSecOperacionais((v) => !v)}
                >
                  {operacionais.map((c) => (
                    <ChannelItem
                      key={c.id}
                      canal={c}
                      ativo={canalAtivo === c.id}
                      onClick={() => {
                        setCanalAtivo(c.id);
                        setThreadAberta(null);
                      }}
                    />
                  ))}
                </Section>

                <Section
                  title="Gestão"
                  open={secGestao}
                  onToggle={() => setSecGestao((v) => !v)}
                >
                  {gestao.map((c) => (
                    <ChannelItem
                      key={c.id}
                      canal={c}
                      ativo={canalAtivo === c.id}
                      onClick={() => {
                        setCanalAtivo(c.id);
                        setThreadAberta(null);
                      }}
                    />
                  ))}
                </Section>

                {projetos.length > 0 && (
                  <Section
                    title="Projetos & incidentes"
                    open={secProjetos}
                    onToggle={() => setSecProjetos((v) => !v)}
                  >
                    {projetos.map((c) => (
                      <ChannelItem
                        key={c.id}
                        canal={c}
                        ativo={canalAtivo === c.id}
                        onClick={() => {
                          setCanalAtivo(c.id);
                          setThreadAberta(null);
                        }}
                      />
                    ))}
                  </Section>
                )}

                <Section
                  title="Mensagens diretas"
                  open={secDMs}
                  onToggle={() => setSecDMs((v) => !v)}
                >
                  {dmsVisiveis.map((d) => (
                    <DMItem
                      key={d.id}
                      dm={d}
                      ativo={canalAtivo === d.id}
                      onClick={() => {
                        setCanalAtivo(d.id);
                        setThreadAberta(null);
                      }}
                    />
                  ))}
                </Section>
              </div>

              <div className="border-t border-slate-200 bg-white px-3 py-2.5 flex items-center gap-2.5">
                <span className="relative">
                  <Avatar
                    name={currentUser?.nome ?? persona?.nome ?? "Usuário"}
                    size="sm"
                  />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                      statusDotClass(currentUser?.status ?? "ativo")
                    )}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-900 truncate">
                    {currentUser?.nome ?? persona?.nome ?? "Usuário"}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {currentUser?.cargo ?? persona?.papel ?? ""}
                  </div>
                </div>
                <button
                  className="h-8 w-8 rounded-[8px] inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition ring-focus"
                  aria-label="Preferências"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </aside>

            {/* ──────────── Área principal ──────────── */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
              {temAcesso ? (
                <>
                  {canalObj ? (
                    <CanalHeader canal={canalObj} />
                  ) : dmObj ? (
                    <DMHeader dm={dmObj} />
                  ) : null}

                  <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    <ListaMensagens
                      mensagens={mensagens}
                      onAbrirThread={setThreadAberta}
                      onReagir={toggleReacao}
                      onAcao={aplicarAcao}
                      acoesAplicadas={acoesAplicadas}
                    />
                  </div>

                  <Composer
                    canal={canalObj}
                    dm={dmObj}
                    onEnviar={enviarMensagem}
                  />
                </>
              ) : (
                <SemAcessoEmpty
                  temCanais={canaisVisiveis.length + dmsVisiveis.length > 0}
                />
              )}
            </main>

            {/* ──────────── Thread ──────────── */}
            {pai && (
              <ThreadPanel
                pai={pai}
                onClose={() => setThreadAberta(null)}
                onReagir={toggleReacao}
              />
            )}
          </div>
        </div>
      </PageContent>

      <BotsDialog open={mostrarBots} onClose={() => setMostrarBots(false)} />
      <SlashDialog open={mostrarSlash} onClose={() => setMostrarSlash(false)} />
      <NovoCanalDialog open={novoCanalOpen} onClose={() => setNovoCanalOpen(false)} />
    </CurrentUserContext.Provider>
  );
}

function NovoCanalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"publico" | "privado" | "dm">("publico");
  const [descricao, setDescricao] = useState("");

  const handleCreate = () => {
    if (!nome.trim()) return;
    setNome("");
    setDescricao("");
    setTipo("publico");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Novo canal"
      subtitle="Crie um espaço para conversas em equipe"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!nome.trim()}>
            Criar canal
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-[13px]">
        <div>
          <label className="block text-[12px] font-medium text-slate-700 mb-1">
            Nome do canal
          </label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="ex: squad-atendimento"
            className="w-full h-9 px-3 rounded-[10px] border border-slate-200 text-[13px]"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-slate-700 mb-1">
            Tipo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "publico", label: "Público" },
                { id: "privado", label: "Privado" },
                { id: "dm", label: "Direto" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                className={cn(
                  "h-9 rounded-[10px] border text-[13px] font-medium transition",
                  tipo === t.id
                    ? "bg-brand-50 border-brand-400 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-slate-700 mb-1">
            Descrição (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            placeholder="Propósito do canal…"
            className="w-full px-3 py-2 rounded-[10px] border border-slate-200 text-[13px]"
          />
        </div>
      </div>
    </Dialog>
  );
}

function SemAcessoEmpty({ temCanais }: { temCanais: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto h-12 w-12 rounded-[14px] bg-slate-100 ring-1 ring-inset ring-slate-200 inline-flex items-center justify-center mb-3">
          <Lock className="h-5 w-5 text-slate-500" />
        </div>
        <div className="text-[15px] font-semibold text-slate-900">
          {temCanais
            ? "Selecione um canal ou conversa"
            : "Você ainda não participa de canais"}
        </div>
        <p className="text-[13px] text-slate-600 mt-1.5 leading-[1.5]">
          {temCanais
            ? "Canais e mensagens diretas que você pertence aparecem na barra lateral."
            : "Peça a um gestor para adicioná-lo a um canal ou iniciar uma conversa direta."}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── SIDEBAR ─────────────────────────── */

function QuickLink({
  icon: Icon,
  label,
  count,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full h-8 px-2 rounded-[8px] flex items-center gap-2.5 hover:bg-white text-[13px] text-slate-700 hover:text-slate-900 transition ring-focus"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      <span className="flex-1 text-left truncate">{label}</span>
      {count !== undefined && (
        <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
          {count}
        </span>
      )}
    </button>
  );
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center group px-2">
        <button
          onClick={onToggle}
          className="flex-1 h-7 px-1 rounded-[6px] inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
        >
          {open ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {title}
        </button>
        <button
          className="h-6 w-6 rounded-[6px] inline-flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-white hover:text-slate-700 transition"
          aria-label={`Novo em ${title}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && <div className="mt-0.5 space-y-0.5 px-1">{children}</div>}
    </div>
  );
}

function ChannelItem({
  canal,
  ativo,
  onClick,
}: {
  canal: CanalInterno;
  ativo: boolean;
  onClick: () => void;
}) {
  const Icon = canal.privado ? Lock : iconPorCanal(canal.nome);
  const temNaoLidas = (canal.nao_lidas ?? 0) > 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-8 px-2 rounded-[8px] flex items-center gap-2 text-[13px] transition",
        ativo
          ? "bg-brand-50 text-brand-700 font-semibold ring-1 ring-inset ring-brand-100"
          : temNaoLidas
            ? "text-slate-900 font-medium hover:bg-white"
            : "text-slate-700 hover:bg-white"
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          ativo ? "text-brand-600" : "text-slate-500"
        )}
      />
      <span className="flex-1 text-left truncate">{canal.nome}</span>
      {temNaoLidas && !ativo && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold tabular">
          {canal.nao_lidas}
        </span>
      )}
    </button>
  );
}

function DMItem({
  dm,
  ativo,
  onClick,
}: {
  dm: DMInterna;
  ativo: boolean;
  onClick: () => void;
}) {
  const CURRENT_USER_ID = useCurrentUserId();
  const outro = dm.participantes.find((p) => p !== CURRENT_USER_ID);
  const usuario = outro ? usuarioInternoById(outro) : null;
  if (!usuario) return null;
  const temNaoLidas = (dm.nao_lidas ?? 0) > 0;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-8 px-2 rounded-[8px] flex items-center gap-2 text-[13px] transition",
        ativo
          ? "bg-brand-50 text-brand-700 font-semibold ring-1 ring-inset ring-brand-100"
          : temNaoLidas
            ? "text-slate-900 font-medium hover:bg-white"
            : "text-slate-700 hover:bg-white"
      )}
    >
      <span className="relative shrink-0">
        <Avatar name={usuario.nome} size="xs" />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-slate-50",
            statusDotClass(usuario.status)
          )}
        />
      </span>
      <span className="flex-1 text-left truncate">{usuario.nome}</span>
      {temNaoLidas && !ativo && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold tabular">
          {dm.nao_lidas}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────── HEADERS ─────────────────────────── */

function CanalHeader({ canal }: { canal: CanalInterno }) {
  const Icon = canal.privado ? Lock : iconPorCanal(canal.nome);
  return (
    <div className="h-14 shrink-0 border-b border-slate-200 px-5 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 text-slate-900">
          <Icon className="h-4 w-4 text-slate-500" />
          <span className="text-[15px] font-semibold truncate">
            {canal.nome}
          </span>
        </div>
        <div className="h-5 w-px bg-slate-200" />
        <button className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-800 ring-focus rounded-[6px] px-1 py-0.5">
          <UsersIcon className="h-3.5 w-3.5" />
          {canal.membros.length}
        </button>
        <div className="text-[12px] text-slate-500 truncate max-w-[420px]">
          {canal.proposito}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconBtn icon={Phone} title="Huddle" />
        <IconBtn icon={Video} title="Vídeo" />
        <IconBtn icon={Pin} title="Fixadas" />
        <IconBtn icon={Bell} title="Notificações" />
        <IconBtn icon={Search} title="Buscar no canal" />
        <IconBtn icon={MoreHorizontal} title="Mais" />
      </div>
    </div>
  );
}

function DMHeader({ dm }: { dm: DMInterna }) {
  const CURRENT_USER_ID = useCurrentUserId();
  const outro = dm.participantes.find((p) => p !== CURRENT_USER_ID);
  const usuario = outro ? usuarioInternoById(outro) : null;
  if (!usuario) return null;
  return (
    <div className="h-14 shrink-0 border-b border-slate-200 px-5 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <span className="relative">
          <Avatar name={usuario.nome} size="sm" />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white",
              statusDotClass(usuario.status)
            )}
          />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-slate-900 truncate">
            {usuario.nome}
          </div>
          <div className="text-[11.5px] text-slate-500 truncate">
            {usuario.cargo} ·{" "}
            {usuario.status === "ativo" ? "Ativo agora" : usuario.status}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconBtn icon={Phone} title="Ligar" />
        <IconBtn icon={Video} title="Vídeo" />
        <IconBtn icon={MoreHorizontal} title="Mais" />
      </div>
    </div>
  );
}

function IconBtn({
  icon: Icon,
  title,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-9 w-9 rounded-[8px] inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition ring-focus"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/* ─────────────────────────── MENSAGENS ─────────────────────────── */

function ListaMensagens({
  mensagens,
  onAbrirThread,
  onReagir,
  onAcao,
  acoesAplicadas,
}: {
  mensagens: MensagemInterna[];
  onAbrirThread: (id: string) => void;
  onReagir: (mid: string, emoji: string) => void;
  onAcao: (mid: string, aid: string, label: string) => void;
  acoesAplicadas: Record<string, string>;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const grupos = useMemo(() => agruparPorDia(mensagens), [mensagens]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [mensagens.length]);

  return (
    <div className="py-4">
      {grupos.map((g) => (
        <div key={g.dia}>
          <DayDivider label={g.label} />
          {g.mensagens.map((m, i) => {
            const anterior = g.mensagens[i - 1];
            const agrupada = anterior && mesmoAutorRecente(anterior, m);
            return (
              <MensagemItem
                key={m.id}
                mensagem={m}
                agrupada={!!agrupada}
                onAbrirThread={onAbrirThread}
                onReagir={onReagir}
                onAcao={onAcao}
                acoesAplicadas={acoesAplicadas}
              />
            );
          })}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 px-5 py-2">
      <div className="flex-1 h-px bg-slate-200" />
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-0.5 shadow-soft">
        {label}
      </div>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function MensagemItem({
  mensagem,
  agrupada,
  onAbrirThread,
  onReagir,
  onAcao,
  acoesAplicadas,
}: {
  mensagem: MensagemInterna;
  agrupada: boolean;
  onAbrirThread: (id: string) => void;
  onReagir: (mid: string, emoji: string) => void;
  onAcao: (mid: string, aid: string, label: string) => void;
  acoesAplicadas: Record<string, string>;
}) {
  const CURRENT_USER_ID = useCurrentUserId();
  const [hover, setHover] = useState(false);
  const [pickerAberto, setPickerAberto] = useState(false);

  if (mensagem.autor_tipo === "system") {
    return (
      <div className="px-5 py-1.5 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-[11.5px] text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-soft">
          <UserPlus className="h-3 w-3" />
          <span>{mensagem.conteudo}</span>
          <span className="text-slate-400">· {hora(mensagem.timestamp)}</span>
        </div>
      </div>
    );
  }

  const bot =
    mensagem.autor_tipo === "bot" ? botById(mensagem.autor_id) : null;
  const autor = !bot ? usuarioInternoById(mensagem.autor_id) : null;
  const nome = bot?.nome ?? autor?.nome ?? "Usuário";
  const tone = bot ? botTone(bot.cor) : null;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPickerAberto(false);
      }}
      className={cn(
        "group relative px-5 py-0.5 transition-colors",
        "hover:bg-white",
        mensagem.prioridade === "critico" && "bg-rose-50/60",
        mensagem.prioridade === "alerta" && "bg-amber-50/50",
        mensagem.fixada && "bg-amber-50/40"
      )}
    >
      {mensagem.fixada && (
        <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-amber-700 ml-12 pt-1.5">
          <Pin className="h-3 w-3" />
          Fixada por gestor
        </div>
      )}

      <div className="flex gap-3 py-1.5">
        <div className="w-10 shrink-0 pt-0.5">
          {!agrupada ? (
            bot && tone ? (
              <div
                className={cn(
                  "h-10 w-10 rounded-[10px] flex items-center justify-center ring-1 ring-inset",
                  tone.bg,
                  tone.ring
                )}
                title={bot.nome}
              >
                <Bot className={cn("h-5 w-5", tone.icon)} />
              </div>
            ) : (
              <Avatar name={nome} size="md" />
            )
          ) : (
            hover && (
              <div className="text-[10px] text-slate-400 text-right pr-1 pt-1 tabular">
                {hora(mensagem.timestamp)}
              </div>
            )
          )}
        </div>

        <div className="flex-1 min-w-0">
          {!agrupada && (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-[14px]">
                {nome}
              </span>
              {mensagem.autor_tipo === "bot" && (
                <Badge tone="slate" className="!text-[9.5px] !font-bold !tracking-wider">
                  APP
                </Badge>
              )}
              {autor && (
                <span className="text-[11px] text-slate-500">
                  {autor.cargo}
                </span>
              )}
              <span className="text-[11px] text-slate-400 tabular">
                {hora(mensagem.timestamp)}
              </span>
              {mensagem.editada && (
                <span className="text-[10.5px] text-slate-400">(editada)</span>
              )}
              {mensagem.prioridade === "critico" && (
                <Badge tone="rose">
                  <Flame className="h-2.5 w-2.5" /> crítico
                </Badge>
              )}
              {mensagem.prioridade === "alerta" && (
                <Badge tone="amber">
                  <AlertTriangle className="h-2.5 w-2.5" /> alerta
                </Badge>
              )}
            </div>
          )}

          <ConteudoFormatado
            texto={mensagem.conteudo}
            mencaoCanal={mensagem.mencao_canal}
          />

          {mensagem.anexos?.map((a, i) => (
            <div
              key={i}
              className="mt-2 max-w-md inline-flex items-center gap-2 border border-slate-200 rounded-[10px] px-3 py-2 bg-white shadow-soft"
            >
              <Paperclip className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-[13px] text-slate-800">{a.nome}</span>
              {a.tamanho_kb && (
                <span className="text-[11px] text-slate-500">
                  {a.tamanho_kb} KB
                </span>
              )}
            </div>
          ))}

          {mensagem.unfurls?.map((u, i) => (
            <UnfurlCard key={i} unfurl={u} />
          ))}

          {mensagem.acoes_inline && mensagem.acoes_inline.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {mensagem.acoes_inline.map((ac) => {
                const key = `${mensagem.id}:${ac.id}`;
                const resultado = acoesAplicadas[key];
                if (resultado) {
                  return (
                    <div
                      key={ac.id}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-200 rounded-[8px] px-2.5 py-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {resultado}
                    </div>
                  );
                }
                return (
                  <Button
                    key={ac.id}
                    size="sm"
                    variant={
                      ac.tone === "primary"
                        ? "primary"
                        : ac.tone === "danger"
                          ? "danger"
                          : "outline"
                    }
                    onClick={() => onAcao(mensagem.id, ac.id, ac.label)}
                  >
                    {ac.label}
                  </Button>
                );
              })}
            </div>
          )}

          {mensagem.reacoes && mensagem.reacoes.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {mensagem.reacoes.map((r) => {
                const reagiu = r.usuarios.includes(CURRENT_USER_ID);
                return (
                  <button
                    key={r.emoji}
                    onClick={() => onReagir(mensagem.id, r.emoji)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 h-6 text-[12px] transition ring-1 ring-inset ring-focus",
                      reagiu
                        ? "bg-brand-50 text-brand-700 ring-brand-200"
                        : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span className="tabular font-medium">
                      {r.usuarios.length}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => setPickerAberto((v) => !v)}
                className="h-6 px-1.5 rounded-full bg-white ring-1 ring-inset ring-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 inline-flex items-center gap-0.5 text-[11px] ring-focus"
                aria-label="Adicionar reação"
              >
                <Smile className="h-3 w-3" />
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
          )}

          {mensagem.thread_respostas && (
            <button
              onClick={() => onAbrirThread(mensagem.id)}
              className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-700 hover:underline hover:bg-brand-50 -mx-1 px-1.5 py-0.5 rounded-[6px] ring-focus"
            >
              <Reply className="h-3.5 w-3.5" />
              {mensagem.thread_respostas} respostas
              {mensagem.thread_ultima_resposta && (
                <span className="text-slate-500 font-normal">
                  · última {relativeTime(mensagem.thread_ultima_resposta)}
                </span>
              )}
            </button>
          )}
        </div>

        {hover && (
          <div className="absolute -top-3 right-6 z-10 bg-white border border-slate-200 shadow-pop rounded-[10px] flex items-center p-0.5">
            {["👍", "🎉", "🙏", "✅", "🔥"].map((e) => (
              <button
                key={e}
                onClick={() => onReagir(mensagem.id, e)}
                className="h-8 w-8 hover:bg-slate-100 rounded-[6px] text-[15px] transition"
              >
                {e}
              </button>
            ))}
            <div className="h-5 w-px bg-slate-200 mx-0.5" />
            <button
              onClick={() => onAbrirThread(mensagem.id)}
              className="h-8 w-8 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-[6px] transition"
              aria-label="Responder em thread"
            >
              <Reply className="h-4 w-4" />
            </button>
            <button
              className="h-8 w-8 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-[6px] transition"
              aria-label="Encaminhar"
            >
              <AtSign className="h-4 w-4" />
            </button>
            <button
              className="h-8 w-8 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-[6px] transition"
              aria-label="Fixar"
            >
              <Pin className="h-4 w-4" />
            </button>
            <button
              className="h-8 w-8 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-[6px] transition"
              aria-label="Mais"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        )}

        {pickerAberto && (
          <div className="absolute right-8 top-10 z-20 bg-white border border-slate-200 shadow-pop rounded-[12px] p-2 grid grid-cols-6 gap-1">
            {[
              "👍","🎉","🙏","✅","🔥","💪","🏆","🚀","🌊","👏","❤️","😂","😮","🤔","📈","🙌","💡","⭐",
            ].map((e) => (
              <button
                key={e}
                onClick={() => {
                  onReagir(mensagem.id, e);
                  setPickerAberto(false);
                }}
                className="h-8 w-8 hover:bg-slate-100 rounded-[6px] text-[15px] transition"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConteudoFormatado({
  texto,
  mencaoCanal,
}: {
  texto: string;
  mencaoCanal?: boolean;
}) {
  const linhas = texto.split("\n");
  return (
    <div className="text-[13.5px] leading-[1.55] text-slate-800 mt-0.5 break-words">
      {linhas.map((linha, li) => {
        const tokens = linha.split(
          /(\*\*[^*]+\*\*|@canal|@[A-Za-zÀ-ÿ ]+(?=\s|$)|#[a-z0-9_-]+|PASS-\d+|ING-\d+|TKT-\d+|INC-\d+|LOTE-\d+|L-\d+)/
        );
        return (
          <div key={li}>
            {tokens.map((t, i) => {
              if (!t) return null;
              if (t.startsWith("**") && t.endsWith("**")) {
                return (
                  <strong key={i} className="font-semibold text-slate-900">
                    {t.slice(2, -2)}
                  </strong>
                );
              }
              if (t === "@canal") {
                return (
                  <span
                    key={i}
                    className="bg-amber-50 text-amber-700 font-medium rounded px-1 py-0.5 ring-1 ring-inset ring-amber-200"
                  >
                    @canal
                  </span>
                );
              }
              if (t.startsWith("@")) {
                return (
                  <span
                    key={i}
                    className="bg-brand-50 text-brand-700 font-medium rounded px-1 py-0.5 ring-1 ring-inset ring-brand-100"
                  >
                    {t}
                  </span>
                );
              }
              if (t.startsWith("#")) {
                return (
                  <a
                    key={i}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-brand-700 font-medium hover:underline"
                  >
                    {t}
                  </a>
                );
              }
              if (/^(PASS|ING|TKT|INC|LOTE|L)-\d+$/.test(t)) {
                return (
                  <a
                    key={i}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-brand-700 font-mono text-[12.5px] bg-brand-50 rounded px-1 py-0.5 hover:underline ring-1 ring-inset ring-brand-100"
                  >
                    {t}
                  </a>
                );
              }
              return <span key={i}>{t}</span>;
            })}
          </div>
        );
      })}
      {mencaoCanal && linhas.every((l) => !l.includes("@canal")) && (
        <span className="ml-1 inline-flex bg-amber-50 text-amber-700 rounded px-1 text-[11px] font-medium ring-1 ring-inset ring-amber-200">
          @canal
        </span>
      )}
    </div>
  );
}

function UnfurlCard({ unfurl }: { unfurl: UnfurlInterno }) {
  const Icon = iconPorUnfurl(unfurl.tipo);
  return (
    <div className="mt-2 max-w-lg border border-slate-200 border-l-[3px] border-l-brand-500 bg-white rounded-r-[10px] rounded-l-[4px] pl-3 pr-4 py-2.5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-[8px] bg-brand-50 ring-1 ring-inset ring-brand-100 inline-flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-brand-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-slate-900 truncate">
            {unfurl.titulo}
          </div>
          <div className="text-[12px] text-slate-500 truncate">
            {unfurl.subtitulo}
          </div>
          {unfurl.badges && unfurl.badges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {unfurl.badges.map((b, i) => (
                <Badge key={i} tone={toneBadge(b.tone)}>
                  {b.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {unfurl.cta && (
          <button className="text-[12px] font-medium text-brand-700 hover:underline shrink-0 pt-1 ring-focus rounded px-1">
            {unfurl.cta}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── COMPOSER ─────────────────────────── */

function Composer({
  canal,
  dm,
  onEnviar,
}: {
  canal?: CanalInterno;
  dm?: DMInterna;
  onEnviar: (texto: string) => void;
}) {
  const CURRENT_USER_ID = useCurrentUserId();
  const [texto, setTexto] = useState("");
  const [slashOpen, setSlashOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQ, setMentionQ] = useState("");

  const placeholder = canal
    ? `Mensagem em #${canal.nome}`
    : dm
      ? (() => {
          const outro = dm.participantes.find((p) => p !== CURRENT_USER_ID);
          return `Mensagem para ${usuarioInternoById(outro ?? "")?.nome ?? ""}`;
        })()
      : "Mensagem";

  const handleChange = (v: string) => {
    setTexto(v);
    setSlashOpen(v.startsWith("/"));
    const at = v.match(/@(\w*)$/);
    if (at) {
      setMentionOpen(true);
      setMentionQ(at[1]);
    } else {
      setMentionOpen(false);
    }
  };

  const submit = () => {
    if (!texto.trim()) return;
    onEnviar(texto);
    setTexto("");
    setSlashOpen(false);
    setMentionOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const slashSugestoes = slashCommandsInternos.filter((s) =>
    s.comando.toLowerCase().includes(texto.toLowerCase())
  );

  const mentionSugestoes = usuariosInternos
    .filter((u) => u.nome.toLowerCase().includes(mentionQ.toLowerCase()))
    .slice(0, 6);

  return (
    <div className="border-t border-slate-200 bg-white px-5 py-3 shrink-0 relative">
      {slashOpen && slashSugestoes.length > 0 && (
        <div className="absolute bottom-[calc(100%+8px)] left-5 right-5 bg-white border border-slate-200 shadow-pop rounded-[12px] max-h-[280px] overflow-y-auto z-20">
          <div className="px-3 py-2 border-b border-slate-100 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">
            Slash commands
          </div>
          {slashSugestoes.map((s) => (
            <button
              key={s.comando}
              onClick={() => {
                setTexto(s.exemplo);
                setSlashOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-3 transition"
            >
              <div className="h-7 w-7 rounded-[8px] bg-brand-50 ring-1 ring-inset ring-brand-100 inline-flex items-center justify-center shrink-0">
                <Zap className="h-3.5 w-3.5 text-brand-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-slate-900 font-mono">
                  {s.comando}
                </div>
                <div className="text-[11.5px] text-slate-500 truncate">
                  {s.descricao}
                </div>
              </div>
              <div className="text-[10.5px] text-slate-400 font-mono truncate max-w-[180px]">
                {s.exemplo}
              </div>
            </button>
          ))}
        </div>
      )}
      {mentionOpen && mentionSugestoes.length > 0 && (
        <div className="absolute bottom-[calc(100%+8px)] left-5 w-[340px] bg-white border border-slate-200 shadow-pop rounded-[12px] overflow-hidden z-20">
          <div className="px-3 py-2 border-b border-slate-100 text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">
            Mencionar
          </div>
          {mentionSugestoes.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                const novo = texto.replace(/@\w*$/, `@${u.nome} `);
                setTexto(novo);
                setMentionOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 transition"
            >
              <Avatar name={u.nome} size="xs" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-slate-900 truncate">
                  {u.nome}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {u.cargo}
                </div>
              </div>
              <span
                className={cn("h-2 w-2 rounded-full", statusDotClass(u.status))}
              />
            </button>
          ))}
        </div>
      )}

      <div className="border border-slate-200 rounded-[12px] focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-400 transition bg-white shadow-soft">
        <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-0.5">
          <ToolbarBtn icon={Sparkles} title="Escrever com IA" />
          <ToolbarBtn icon={AtSign} title="Mencionar" />
          <ToolbarBtn icon={Paperclip} title="Anexar" />
          <ToolbarBtn icon={Smile} title="Emoji" />
          <ToolbarBtn
            icon={Zap}
            title="Slash command"
            onClick={() => setTexto("/")}
          />
        </div>
        <textarea
          value={texto}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 bg-transparent outline-none resize-none max-h-[160px]"
        />
        <div className="px-3 py-1.5 flex items-center justify-between border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px] ring-1 ring-inset ring-slate-200">
              Enter
            </kbd>{" "}
            envia ·{" "}
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px] ring-1 ring-inset ring-slate-200">
              Shift+Enter
            </kbd>{" "}
            quebra linha
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={submit}
            disabled={!texto.trim()}
            rightIcon={<Send className="h-3.5 w-3.5" />}
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({
  icon: Icon,
  title,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-7 w-7 inline-flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-[6px] transition ring-focus"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/* ─────────────────────────── THREAD ─────────────────────────── */

function ThreadPanel({
  pai,
  onClose,
  onReagir,
}: {
  pai: MensagemInterna;
  onClose: () => void;
  onReagir: (mid: string, emoji: string) => void;
}) {
  const CURRENT_USER_ID = useCurrentUserId();
  const [respostas, setRespostas] = useState<MensagemInterna[]>([]);
  const [texto, setTexto] = useState("");

  const threadMock =
    pai.id === "m_i1"
      ? mensagensPorCanal("ch_inc_0042")
      : pai.id === "m_o4"
        ? [
            {
              id: "t_o4_1",
              canal_id: "thread",
              autor_tipo: "user" as const,
              autor_id: "sup1",
              conteudo: "Fechou, bloqueio agora.",
              timestamp: new Date(Date.now() - 29 * 60_000).toISOString(),
            },
            {
              id: "t_o4_2",
              canal_id: "thread",
              autor_tipo: "user" as const,
              autor_id: "gestor1",
              conteudo:
                "Mantém as 50 reservas de bilheteria pra absorver no-show.",
              timestamp: new Date(Date.now() - 28 * 60_000).toISOString(),
            },
            {
              id: "t_o4_3",
              canal_id: "thread",
              autor_tipo: "user" as const,
              autor_id: "sup1",
              conteudo: "Combinado.",
              timestamp: new Date(Date.now() - 28 * 60_000).toISOString(),
            },
          ]
        : [];

  const todas = [...threadMock, ...respostas];

  const enviar = () => {
    if (!texto.trim()) return;
    setRespostas((prev) => [
      ...prev,
      {
        id: `tr_${Date.now()}`,
        canal_id: "thread",
        autor_tipo: "user",
        autor_id: CURRENT_USER_ID,
        conteudo: texto,
        timestamp: new Date().toISOString(),
      },
    ]);
    setTexto("");
  };

  return (
    <aside className="w-[400px] shrink-0 bg-white border-l border-slate-200 flex flex-col">
      <div className="h-14 shrink-0 px-5 border-b border-slate-200 flex items-center justify-between bg-white">
        <div>
          <div className="text-[14px] font-semibold text-slate-900">
            Thread
          </div>
          <div className="text-[11.5px] text-slate-500">
            #{canaisInternos.find((c) => c.id === pai.canal_id)?.nome}
          </div>
        </div>
        <IconBtn icon={X} title="Fechar thread" onClick={onClose} />
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="border-b border-slate-200 bg-white">
          <MensagemItem
            mensagem={pai}
            agrupada={false}
            onAbrirThread={() => {}}
            onReagir={onReagir}
            onAcao={() => {}}
            acoesAplicadas={{}}
          />
        </div>
        <div className="px-5 py-2 text-[10.5px] uppercase tracking-wide text-slate-500 font-semibold">
          {todas.length} {todas.length === 1 ? "resposta" : "respostas"}
        </div>
        {todas.map((r) => (
          <MensagemItem
            key={r.id}
            mensagem={r}
            agrupada={false}
            onAbrirThread={() => {}}
            onReagir={onReagir}
            onAcao={() => {}}
            acoesAplicadas={{}}
          />
        ))}
      </div>
      <div className="border-t border-slate-200 bg-white px-3 py-3 shrink-0">
        <div className="border border-slate-200 rounded-[10px] flex items-center gap-2 px-3 py-1.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/30 shadow-soft">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Responder na thread"
            className="flex-1 h-8 bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 outline-none"
          />
          <button
            onClick={enviar}
            disabled={!texto.trim()}
            className={cn(
              "h-8 w-8 rounded-[8px] inline-flex items-center justify-center transition ring-focus",
              texto.trim()
                ? "bg-brand-600 text-white hover:bg-brand-700 shadow-soft"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
            aria-label="Enviar"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────── DIALOGS ─────────────────────────── */

function BotsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Bots & automações"
      subtitle="Agentes automáticos que postam em canais e respondem a comandos"
      size="xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {botsInternos.map((b) => {
          const tone = botTone(b.cor);
          return (
            <div
              key={b.id}
              className="border border-slate-200 rounded-[14px] p-4 hover:shadow-soft transition bg-white"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-[10px] inline-flex items-center justify-center shrink-0 ring-1 ring-inset",
                    tone.bg,
                    tone.ring
                  )}
                >
                  <Bot className={cn("h-5 w-5", tone.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[14px] font-semibold text-slate-900">
                      {b.nome}
                    </div>
                    <Badge tone="slate" className="!text-[9.5px] !font-bold !tracking-wider">
                      APP
                    </Badge>
                    {b.ativo ? (
                      <Badge tone="emerald" dot>
                        Ativo
                      </Badge>
                    ) : (
                      <Badge tone="slate">Pausado</Badge>
                    )}
                  </div>
                  <p className="text-[12.5px] text-slate-600 mt-1 leading-[1.45]">
                    {b.descricao}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {
                        canaisInternos.find((c) => c.id === b.canal_default)
                          ?.nome
                      }
                    </span>
                    {b.ultima_execucao && (
                      <span>
                        Última execução {relativeTime(b.ultima_execucao)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}

function SlashDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const categorias: Record<
    string,
    { label: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    consulta: { label: "Consultas", icon: Search },
    operacao: { label: "Operação", icon: Wrench },
    aprovacao: { label: "Aprovações", icon: Shield },
    atalho: { label: "Atalhos do time", icon: Zap },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Slash commands"
      subtitle="Digite / em qualquer canal para abrir a paleta"
      size="xl"
    >
      <div className="space-y-5">
        {Object.entries(categorias).map(([cat, meta]) => {
          const cmds = slashCommandsInternos.filter(
            (c) => c.categoria === cat
          );
          if (cmds.length === 0) return null;
          const Icon = meta.icon;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-slate-600" />
                <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                  {meta.label}
                </div>
              </div>
              <div className="space-y-1">
                {cmds.map((c) => (
                  <div
                    key={c.comando}
                    className="flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-slate-50 border border-slate-200 bg-white transition"
                  >
                    <div className="font-mono text-[13px] font-semibold text-brand-700 bg-brand-50 rounded-[6px] px-2 py-0.5 shrink-0 ring-1 ring-inset ring-brand-100">
                      {c.comando}
                    </div>
                    <div className="text-[13px] text-slate-800 flex-1 min-w-0">
                      {c.descricao}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 hidden sm:block">
                      {c.exemplo}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
