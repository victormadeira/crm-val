import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Plus,
  Users,
  XCircle,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { agendaEventos, corretores } from "@/lib/mock";
import type { AgendaEvento, AgendaTipo } from "@/lib/types";

const tipoTone: Record<AgendaTipo, string> = {
  visita_guiada: "brand",
  reuniao: "violet",
  ligacao_agendada: "aqua",
  vistoria: "amber",
  evento: "fuchsia",
};
const tipoLabel: Record<AgendaTipo, string> = {
  visita_guiada: "Visita guiada",
  reuniao: "Reunião",
  ligacao_agendada: "Ligação",
  vistoria: "Vistoria",
  evento: "Evento",
};

const statusTone = { agendado: "slate", confirmado: "sky", realizado: "emerald", no_show: "rose", cancelado: "slate" } as const;

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function Agenda() {
  const [base, setBase] = useState(new Date());
  const [selId, setSelId] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [statusOverride, setStatusOverride] = useState<Record<string, AgendaEvento["status"]>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const getStatus = (e: AgendaEvento) =>
    statusOverride[e.id] ?? e.status;

  const sel = selId
    ? (() => {
        const base = agendaEventos.find((e) => e.id === selId);
        if (!base) return null;
        return { ...base, status: getStatus(base) };
      })()
    : null;

  const cancelarEvento = (e: AgendaEvento) => {
    setStatusOverride((p) => ({ ...p, [e.id]: "cancelado" }));
    showToast(`Evento "${e.titulo}" cancelado`);
    setSelId(null);
  };
  const confirmarEvento = (e: AgendaEvento) => {
    setStatusOverride((p) => ({ ...p, [e.id]: "confirmado" }));
    showToast(`Evento "${e.titulo}" confirmado`);
  };
  const iniciarLigacao = (e: AgendaEvento) => {
    showToast(`Discando para ${corretorNome(e.corretor_id)}…`);
  };

  const semana = useMemo(() => {
    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay() + 1);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [base]);

  const eventosNoDia = (d: Date) =>
    agendaEventos.filter((e) => sameDay(new Date(e.inicio), d)).sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());

  const corretorNome = (id: string) => corretores.find((c) => c.id === id)?.nome ?? id;

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Visitas guiadas, reuniões corporativas, ligações agendadas. Sync com Google Calendar."
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNovo(true)}>
            Novo evento
          </Button>
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Eventos semana</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{agendaEventos.length}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Realizados</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">
                  {agendaEventos.filter((e) => e.status === "realizado").length}
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-rose-50 text-rose-600 inline-flex items-center justify-center">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">No-show</div>
                <div className="text-[20px] font-semibold tabular text-rose-600">
                  {agendaEventos.filter((e) => e.status === "no_show").length}
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-amber-50 text-amber-600 inline-flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Próximas 24h</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">
                  {agendaEventos.filter((e) => {
                    const t = new Date(e.inicio).getTime();
                    return t > Date.now() && t < Date.now() + 86400000;
                  }).length}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-4">
          <CardBody className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setBase(new Date(base.getTime() - 7 * 86400000))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBase(new Date())}>Hoje</Button>
              <Button size="sm" variant="outline" onClick={() => setBase(new Date(base.getTime() + 7 * 86400000))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-3 text-[14px] font-semibold text-slate-800">
                {semana[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} —
                {" "}
                {semana[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-7 gap-2">
          {semana.map((d) => {
            const eventos = eventosNoDia(d);
            const hoje = sameDay(d, new Date());
            return (
              <Card key={d.toISOString()} className={cn("min-h-[220px]", hoje && "ring-2 ring-brand-400")}>
                <div className="px-3 pt-2.5 pb-2 border-b border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase">
                    {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </div>
                  <div className={cn("text-[16px] font-semibold tabular", hoje ? "text-brand-600" : "text-slate-900")}>
                    {d.getDate()}
                  </div>
                </div>
                <div className="p-2 space-y-1.5">
                  {eventos.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelId(e.id)}
                      className="w-full text-left p-2 rounded-[8px] hover:bg-slate-50 transition border border-slate-100"
                    >
                      <div className="flex items-start gap-1.5">
                        <div className={cn("w-1 self-stretch rounded-full",
                          e.tipo === "visita_guiada" ? "bg-brand-500" :
                          e.tipo === "reuniao" ? "bg-violet-500" :
                          e.tipo === "ligacao_agendada" ? "bg-aqua-500" :
                          e.tipo === "vistoria" ? "bg-amber-500" : "bg-fuchsia-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-slate-400 tabular">
                            {new Date(e.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-800 truncate">{e.titulo}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {eventos.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-slate-300">sem eventos</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </PageContent>

      <Dialog
        open={!!sel}
        onClose={() => setSelId(null)}
        title={sel?.titulo}
        subtitle={sel && tipoLabel[sel.tipo]}
        size="md"
        footer={
          sel && (sel.status === "agendado" || sel.status === "confirmado") ? (
            <>
              <Button
                variant="outline"
                leftIcon={<XCircle className="h-3.5 w-3.5" />}
                onClick={() => cancelarEvento(sel)}
              >
                Cancelar evento
              </Button>
              {sel.status === "agendado" && (
                <Button
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  onClick={() => confirmarEvento(sel)}
                >
                  Confirmar
                </Button>
              )}
            </>
          ) : null
        }
      >
        {sel && (
          <div className="space-y-3 text-[13px]">
            <div className="flex items-center gap-2">
              <Badge tone={tipoTone[sel.tipo] as any}>{tipoLabel[sel.tipo]}</Badge>
              <Badge tone={statusTone[sel.status] as any}>{sel.status.replace("_", " ")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Início</div>
                <div className="font-semibold tabular">{new Date(sel.inicio).toLocaleString("pt-BR")}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Fim</div>
                <div className="font-semibold tabular">{new Date(sel.fim).toLocaleString("pt-BR")}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{sel.local}</span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar name={corretorNome(sel.corretor_id)} size="sm" />
              <span className="font-semibold">{corretorNome(sel.corretor_id)}</span>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase mb-1">Participantes</div>
              <div className="flex flex-wrap gap-1">
                {sel.participantes.map((p) => (
                  <Badge key={p} tone="slate" className="text-[10px]">
                    <Users className="h-3 w-3 mr-0.5" /> {p}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase mb-1">Observações</div>
              <div className="rounded-[10px] bg-slate-50 p-2.5 text-slate-700">{sel.observacoes}</div>
            </div>
            {sel.tipo === "ligacao_agendada" && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Phone className="h-3.5 w-3.5" />}
                className="w-full"
                onClick={() => iniciarLigacao(sel)}
              >
                Iniciar ligação agora
              </Button>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={novo}
        onClose={() => setNovo(false)}
        title="Novo evento"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovo(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                setNovo(false);
                showToast("Evento criado e adicionado à agenda");
              }}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Criar evento
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Título</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" placeholder="Ex: Visita guiada família Silva" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Tipo</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white">
                {Object.entries(tipoLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Corretor</label>
              <select className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px] bg-white">
                {corretores.map((c) => <option key={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Início</label>
              <input type="datetime-local" className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Fim</label>
              <input type="datetime-local" className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Local</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3 text-[13px]" placeholder="Recepção principal" />
          </div>
        </div>
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
