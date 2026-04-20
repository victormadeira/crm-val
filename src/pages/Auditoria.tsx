import { useMemo, useState } from "react";
import {
  Download,
  Eye,
  Filter as FilterIcon,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { dateTime, relativeTime } from "@/lib/format";
import { auditoriaLogs } from "@/lib/mock";
import type { AuditoriaAcao, AuditoriaLog } from "@/lib/types";

const acaoTone: Record<AuditoriaAcao, string> = {
  login: "emerald",
  logout: "slate",
  view: "slate",
  create: "aqua",
  update: "brand",
  delete: "rose",
  export: "amber",
  impersonate: "violet",
  permission_change: "fuchsia",
  config_change: "sky",
};

const acaoLabel: Record<AuditoriaAcao, string> = {
  login: "Login",
  logout: "Logout",
  view: "Visualização",
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  export: "Exportação",
  impersonate: "Impersonação",
  permission_change: "Perm. alterada",
  config_change: "Config. alterada",
};

export function Auditoria() {
  const [filtroAcao, setFiltroAcao] = useState<AuditoriaAcao | "todas">("todas");
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<AuditoriaLog | null>(null);

  const filtered = useMemo(() => {
    return auditoriaLogs.filter((l) => {
      if (filtroAcao !== "todas" && l.acao !== filtroAcao) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          l.ator.toLowerCase().includes(q) ||
          l.entidade.toLowerCase().includes(q) ||
          l.entidade_label?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filtroAcao, busca]);

  const criticas = auditoriaLogs.filter((l) =>
    ["delete", "impersonate", "permission_change", "config_change"].includes(l.acao)
  ).length;

  const exportCSV = () => {
    const rows = [
      ["timestamp", "ator", "papel", "acao", "entidade", "entidade_id", "ip", "user_agent"],
      ...filtered.map((l) => [
        l.created_at,
        l.ator,
        l.ator_papel,
        l.acao,
        l.entidade,
        l.entidade_id ?? "",
        l.ip,
        l.user_agent,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Auditoria"
        subtitle="Log imutável de todas as ações sensíveis. Retenção 7 anos (LGPD art. 16)."
        actions={
          <Button size="sm" variant="outline" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={exportCSV}>
            Exportar CSV
          </Button>
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Eventos 24h</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{auditoriaLogs.length}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-rose-50 text-rose-600 inline-flex items-center justify-center">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Ações críticas</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{criticas}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Integridade</div>
                <div className="text-[14px] font-semibold text-emerald-600">Hash chain OK</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Retenção</div>
                <div className="text-[14px] font-semibold text-slate-900">7 anos (imutável)</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-4">
          <CardBody className="py-3 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por ator, entidade, ID…"
                className="w-full h-9 pl-9 pr-3 rounded-[10px] border border-slate-200 text-[13px]"
              />
            </div>
            <FilterIcon className="h-3.5 w-3.5 text-slate-400" />
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFiltroAcao("todas")}
                className={cn(
                  "px-2.5 h-7 rounded-[8px] text-[11px] font-medium",
                  filtroAcao === "todas" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                todas
              </button>
              {(Object.keys(acaoLabel) as AuditoriaAcao[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setFiltroAcao(a)}
                  className={cn(
                    "px-2.5 h-7 rounded-[8px] text-[11px] font-medium",
                    filtroAcao === a ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {acaoLabel[a]}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2.5 px-4">Timestamp</th>
                  <th className="text-left py-2.5 px-3">Ator</th>
                  <th className="text-left py-2.5 px-3">Ação</th>
                  <th className="text-left py-2.5 px-3">Entidade</th>
                  <th className="text-left py-2.5 px-3">IP</th>
                  <th className="text-right py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 text-[11px] tabular">
                      <div>{dateTime(l.created_at)}</div>
                      <div className="text-slate-400">{relativeTime(l.created_at)}</div>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={l.ator} size="sm" />
                        <div>
                          <div className="font-semibold text-slate-900">{l.ator}</div>
                          <div className="text-[11px] text-slate-500 capitalize">{l.ator_papel}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3">
                      <Badge tone={acaoTone[l.acao] as any}>{acaoLabel[l.acao]}</Badge>
                    </td>
                    <td className="px-3">
                      <div className="font-semibold text-slate-900">{l.entidade}</div>
                      {l.entidade_label && (
                        <div className="text-[11px] text-slate-500">{l.entidade_label}</div>
                      )}
                    </td>
                    <td className="px-3 font-mono text-[11px] text-slate-600">{l.ip}</td>
                    <td className="text-right px-4">
                      <Button size="sm" variant="outline" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => setDetalhe(l)}>
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>

      <Dialog
        open={!!detalhe}
        onClose={() => setDetalhe(null)}
        title={`Evento ${detalhe?.id}`}
        subtitle={detalhe && `${acaoLabel[detalhe.acao]} — ${dateTime(detalhe.created_at)}`}
        size="lg"
      >
        {detalhe && (
          <div className="space-y-4 text-[13px]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Ator</div>
                <div className="font-semibold">{detalhe.ator} <span className="text-slate-500 font-normal">· {detalhe.ator_papel}</span></div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Entidade</div>
                <div className="font-semibold">{detalhe.entidade} <span className="text-slate-500 font-mono text-[11px]">{detalhe.entidade_id}</span></div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase">IP</div>
                <div className="font-mono text-[12px]">{detalhe.ip}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase">User Agent</div>
                <div className="text-[12px] text-slate-600">{detalhe.user_agent}</div>
              </div>
            </div>
            {detalhe.diff && detalhe.diff.length > 0 && (
              <div>
                <div className="text-[11px] text-slate-400 uppercase mb-2">Alterações</div>
                <div className="rounded-[10px] border border-slate-200 divide-y divide-slate-100">
                  {detalhe.diff.map((d, i) => (
                    <div key={i} className="p-3">
                      <div className="text-[11px] text-slate-500 font-semibold mb-1">{d.campo}</div>
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 line-through">{String(d.antes)}</span>
                        <span className="text-slate-400">→</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">{String(d.depois)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-[10px] bg-slate-50 p-3 text-[11px] text-slate-500">
              <div className="font-semibold text-slate-700 mb-1">Hash SHA-256 (bloco)</div>
              <div className="font-mono break-all">0x{detalhe.id.padEnd(64, "a")}</div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
