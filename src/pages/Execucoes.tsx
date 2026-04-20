import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { dateTime, relativeTime } from "@/lib/format";
import { automationExecs } from "@/lib/mock";
import type { AutomationExec, ExecStatus } from "@/lib/types";

const statusTone: Record<ExecStatus, string> = {
  rodando: "sky",
  sucesso: "emerald",
  falha: "rose",
  retry: "amber",
  cancelada: "slate",
};

const statusIcon: Record<ExecStatus, React.ComponentType<{ className?: string }>> = {
  rodando: Activity,
  sucesso: CheckCircle2,
  falha: XCircle,
  retry: RefreshCw,
  cancelada: CircleDot,
};

export function Execucoes() {
  const [filtro, setFiltro] = useState<ExecStatus | "todas">("todas");
  const [sel, setSel] = useState<AutomationExec | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(
    () => (filtro === "todas" ? automationExecs : automationExecs.filter((e) => e.status === filtro)),
    [filtro]
  );

  const rodando = automationExecs.filter((e) => e.status === "rodando").length;
  const falhas = automationExecs.filter((e) => e.status === "falha" || e.status === "retry").length;
  const sucesso = automationExecs.filter((e) => e.status === "sucesso").length;
  const avgMs = Math.round(
    automationExecs.filter((e) => e.status === "sucesso").reduce((s, e) => s + e.duracao_ms, 0) /
      Math.max(1, sucesso)
  );

  return (
    <>
      <PageHeader
        title="Execuções de automação"
        subtitle="Fila em tempo real. Retries automáticos, logs detalhados, cancelamento."
        actions={
          <Button size="sm" variant="outline" leftIcon={<RefreshCw className={cn("h-3.5 w-3.5", "animate-spin")} />}>
            Atualizar (auto)
          </Button>
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-sky-50 text-sky-600 inline-flex items-center justify-center relative">
                <Activity className="h-5 w-5" />
                {rodando > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-sky-500 animate-ping" />}
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Em execução</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{rodando}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Sucesso (24h)</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{sucesso}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-rose-50 text-rose-600 inline-flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Falhas / retries</div>
                <div className="text-[20px] font-semibold tabular text-rose-600">{falhas}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Tempo médio</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{(avgMs / 1000).toFixed(1)}s</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-4">
          <CardBody className="py-3 flex items-center gap-2">
            <span className="text-[12px] text-slate-500">Filtro:</span>
            {(["todas", "rodando", "sucesso", "falha", "retry", "cancelada"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={cn(
                  "px-2.5 h-7 rounded-[8px] text-[11px] font-medium",
                  filtro === f ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {f}
              </button>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fila de execução" subtitle={`${filtered.length} item(s) — atualização contínua · tick ${pulse}`} />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2.5 px-4">Status</th>
                  <th className="text-left py-2.5 px-3">Workflow</th>
                  <th className="text-left py-2.5 px-3">Lead</th>
                  <th className="text-left py-2.5 px-3">Node atual</th>
                  <th className="text-left py-2.5 px-3">Iniciada</th>
                  <th className="text-right py-2.5 px-3">Duração</th>
                  <th className="text-right py-2.5 px-3">Tentativas</th>
                  <th className="text-right py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const Icon = statusIcon[e.status];
                  return (
                    <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <Badge tone={statusTone[e.status] as any} dot>
                          <Icon className={cn("h-3 w-3", e.status === "rodando" && "animate-pulse")} />
                          {e.status}
                        </Badge>
                      </td>
                      <td className="px-3 font-semibold text-slate-900">{e.workflow_nome}</td>
                      <td className="px-3 font-mono text-[11px] text-slate-600">{e.lead_id ?? "—"}</td>
                      <td className="px-3 font-mono text-[11px]">{e.node_atual}</td>
                      <td className="px-3 text-[11px] text-slate-500">{relativeTime(e.iniciada_em)}</td>
                      <td className="text-right px-3 tabular">{(e.duracao_ms / 1000).toFixed(1)}s</td>
                      <td className="text-right px-3 tabular">{e.tentativas}</td>
                      <td className="text-right px-4">
                        <Button size="sm" variant="outline" onClick={() => setSel(e)}>Log</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>

      <Dialog
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel && `Execução ${sel.id}`}
        subtitle={sel?.workflow_nome}
        size="lg"
        footer={
          sel?.status === "falha" ? (
            <>
              <Button variant="outline" leftIcon={<Pause className="h-3.5 w-3.5" />}>Cancelar</Button>
              <Button leftIcon={<Play className="h-3.5 w-3.5" />}>Retry manual</Button>
            </>
          ) : sel?.status === "rodando" ? (
            <Button variant="danger" leftIcon={<Pause className="h-3.5 w-3.5" />}>Cancelar execução</Button>
          ) : null
        }
      >
        {sel && (
          <div className="space-y-3 text-[13px]">
            <div className="grid grid-cols-3 gap-3 text-[12px]">
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Iniciada</div>
                <div className="font-semibold">{dateTime(sel.iniciada_em)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Duração</div>
                <div className="font-semibold">{(sel.duracao_ms / 1000).toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Tentativas</div>
                <div className="font-semibold">{sel.tentativas}</div>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase mb-2">Log de execução</div>
              <div className="rounded-[10px] bg-slate-900 text-slate-100 p-3 font-mono text-[11px] space-y-1">
                {sel.log.map((l, i) => {
                  const Icon = statusIcon[l.status];
                  const color =
                    l.status === "sucesso"
                      ? "text-emerald-400"
                      : l.status === "falha"
                      ? "text-rose-400"
                      : l.status === "retry"
                      ? "text-amber-400"
                      : l.status === "rodando"
                      ? "text-sky-400"
                      : "text-slate-400";
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-slate-500 tabular">{new Date(l.ts).toLocaleTimeString("pt-BR")}</span>
                      <Icon className={cn("h-3 w-3 mt-0.5 shrink-0", color)} />
                      <span className={cn("font-semibold", color)}>[{l.node}]</span>
                      <span className="text-slate-300">{l.msg ?? l.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
