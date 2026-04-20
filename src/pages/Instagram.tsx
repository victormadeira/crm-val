import { useMemo, useState } from "react";
import {
  AtSign,
  CheckCircle2,
  Film,
  Heart,
  Image as ImageIcon,
  Instagram as IGIcon,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { number } from "@/lib/format";
import { conversasIG, corretores, leads, mensagensIG } from "@/lib/mock";

const tempColor: Record<string, string> = {
  fria: "slate",
  morna: "sky",
  quente: "amber",
  muito_quente: "rose",
};

const origemIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  story: ImageIcon,
  reel: Film,
  post: ImageIcon,
  dm_direto: MessageCircle,
  ad: Sparkles,
};

export function Instagram() {
  const [selectedId, setSelectedId] = useState<string>(conversasIG[0]?.id ?? "");
  const [busca, setBusca] = useState("");
  const [filtroTemp, setFiltroTemp] = useState<"todas" | "quente">("todas");
  const [draft, setDraft] = useState("");

  const filtered = useMemo(() => {
    return conversasIG.filter((c) => {
      const lead = leads.find((l) => l.id === c.lead_id);
      if (busca && !(lead?.nome ?? "").toLowerCase().includes(busca.toLowerCase()) && !c.ig_handle.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroTemp === "quente" && !(c.temperatura === "quente" || c.temperatura === "muito_quente")) return false;
      return true;
    });
  }, [busca, filtroTemp]);

  const selected = conversasIG.find((c) => c.id === selectedId);
  const selectedLead = selected ? leads.find((l) => l.id === selected.lead_id) : undefined;
  const selectedCorretor = selected ? corretores.find((c) => c.id === selected.corretor_id) : undefined;
  const thread = mensagensIG.filter((m) => m.conversa_id === selectedId);

  const totalNaoLidas = conversasIG.reduce((s, c) => s + c.nao_lidas, 0);
  const quentes = conversasIG.filter((c) => c.temperatura === "quente" || c.temperatura === "muito_quente").length;

  return (
    <>
      <PageHeader
        title="Instagram — DMs e engajamento"
        subtitle="Story replies, reel replies e DMs unificados no CRM"
        actions={
          <>
            <Badge tone="violet" className="gap-1.5">
              <IGIcon className="h-3 w-3" /> @parquevalparaiso
            </Badge>
            <Badge tone="rose">{totalNaoLidas} não lidas</Badge>
            <Badge tone="amber">{quentes} quentes</Badge>
          </>
        }
      />
      <PageContent>
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
          <Card className="col-span-4 flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-100 space-y-2">
              <Input
                placeholder="Buscar @handle ou nome"
                leftIcon={<Search className="h-4 w-4" />}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <div className="flex gap-1.5">
                <Button size="sm" variant={filtroTemp === "todas" ? "primary" : "outline"} onClick={() => setFiltroTemp("todas")}>Todas</Button>
                <Button size="sm" variant={filtroTemp === "quente" ? "primary" : "outline"} onClick={() => setFiltroTemp("quente")}>Quentes</Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map((c) => {
                const lead = leads.find((l) => l.id === c.lead_id);
                const Icon = origemIcon[c.origem] ?? MessageCircle;
                const isActive = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-slate-50 hover:bg-slate-50 transition",
                      isActive && "bg-brand-50/70"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar name={lead?.nome ?? c.ig_handle} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-slate-900 truncate">{lead?.nome ?? c.ig_handle}</span>
                          {c.verificado && <CheckCircle2 className="h-3 w-3 text-sky-500 shrink-0" />}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{c.ig_handle} • {number(c.ig_followers)} seg.</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Icon className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] text-slate-500 truncate">{c.origem_ref ?? c.origem}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge tone={tempColor[c.temperatura] as any} className="text-[10px] px-1.5 py-0">
                          {c.temperatura.replace("_", " ")}
                        </Badge>
                        {c.nao_lidas > 0 && (
                          <span className="h-5 min-w-5 px-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-semibold">
                            {c.nao_lidas}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="col-span-5 flex flex-col min-h-0">
            {selected ? (
              <>
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <Avatar name={selectedLead?.nome ?? selected.ig_handle} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[14px] font-semibold text-slate-900 truncate">{selectedLead?.nome ?? selected.ig_handle}</h3>
                      {selected.verificado && <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />}
                    </div>
                    <p className="text-[12px] text-slate-500">{selected.ig_handle} • {number(selected.ig_followers)} seguidores</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedId("")} leftIcon={<X className="h-3.5 w-3.5" />}>Fechar</Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {thread.map((m) => {
                    const out = m.direcao === "outbound";
                    return (
                      <div key={m.id} className={cn("flex", out ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[78%] rounded-[14px] px-3 py-2 text-[13px] shadow-soft",
                          out ? "bg-gradient-to-br from-brand-600 to-aqua-500 text-white" : "bg-white border border-slate-200 text-slate-900"
                        )}>
                          {m.tipo !== "dm" && (
                            <div className={cn("text-[10px] uppercase tracking-wider mb-1 opacity-70", out ? "text-white" : "text-slate-500")}>
                              {m.tipo.replace("_", " ")}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{m.conteudo}</p>
                          <div className={cn("text-[10px] mt-1", out ? "text-white/70" : "text-slate-400")}>
                            {new Date(m.sent_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 p-3">
                  <div className="flex items-start gap-2">
                    <button className="h-9 w-9 inline-flex items-center justify-center rounded-[10px] text-slate-400 hover:bg-slate-100">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Responder no Instagram…"
                      rows={2}
                      className="flex-1 rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
                    />
                    <Button
                      size="md"
                      disabled={!draft.trim()}
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                      onClick={() => setDraft("")}
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardBody className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Selecione uma conversa
              </CardBody>
            )}
          </Card>

          <Card className="col-span-3 flex flex-col min-h-0">
            {selected && selectedLead ? (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b border-slate-100">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Lead</div>
                  <div className="text-[14px] font-semibold text-slate-900">{selectedLead.nome}</div>
                  <div className="text-[12px] text-slate-500 mt-0.5">Score {selectedLead.score} • {selectedLead.status}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedLead.tags.slice(0, 3).map((t) => (
                      <Badge key={t} tone="slate" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-b border-slate-100 text-[12px] text-slate-600 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Origem</span>
                    <span className="font-medium">{selected.origem}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Corretor</span>
                    <span className="font-medium">{selectedCorretor?.nome}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Engajamento</span>
                    <Badge tone="brand">{selected.engagement_score}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Seguidores</span>
                    <span className="font-medium">{number(selected.ig_followers)}</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sugestões IA</div>
                  <Card className="bg-gradient-to-br from-violet-50 to-brand-50 border-violet-100">
                    <CardBody className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 mb-1">
                        <Sparkles className="h-3 w-3" /> Resposta sugerida
                      </div>
                      <p className="text-[12px] text-slate-700 leading-relaxed">
                        "Oi {selectedLead.nome.split(" ")[0]}! Pro seu grupo de 4 (2 adultos + 2 crianças) o anual família sai 10% off essa semana. Posso te mandar no WhatsApp?"
                      </p>
                      <Button size="sm" variant="primary" className="mt-2 w-full">Usar sugestão</Button>
                    </CardBody>
                  </Card>
                </div>
              </div>
            ) : (
              <CardBody className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                <User className="h-4 w-4 mr-1.5" /> Contexto
              </CardBody>
            )}
          </Card>
        </div>

        <Card className="mt-4">
          <CardBody className="py-3 px-5 flex items-center gap-6 text-[12px] text-slate-600">
            <div className="flex items-center gap-1.5"><AtSign className="h-3.5 w-3.5 text-slate-400" /> Menções 24h: <b>14</b></div>
            <div className="flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-rose-500" /> Story replies: <b>38</b></div>
            <div className="flex items-center gap-1.5"><Film className="h-3.5 w-3.5 text-violet-500" /> Reel replies: <b>22</b></div>
            <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-brand-500" /> Novos seguidores: <b>+142</b></div>
            <div className="ml-auto text-slate-400">Sincronizado há 2 min via Graph API</div>
          </CardBody>
        </Card>
      </PageContent>
    </>
  );
}
