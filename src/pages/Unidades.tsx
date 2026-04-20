import { useState } from "react";
import {
  Building2,
  MapPin,
  Plus,
  Settings,
  Target,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { dateShort, money, number, pct } from "@/lib/format";
import { unidades } from "@/lib/mock";
import type { Unidade } from "@/lib/types";

const statusTone = { ativa: "emerald", implantacao: "amber", inativa: "slate" } as const;

export function Unidades() {
  const [sel, setSel] = useState<Unidade | null>(null);
  const [nova, setNova] = useState(false);

  const ativas = unidades.filter((u) => u.status === "ativa");
  const receitaTotal = unidades.reduce((s, u) => s + u.receita_mes, 0);
  const metaTotal = unidades.reduce((s, u) => s + u.meta_mes, 0);
  const totalUsuarios = unidades.reduce((s, u) => s + u.usuarios, 0);
  const totalLeads = unidades.reduce((s, u) => s + u.leads_mes, 0);

  return (
    <>
      <PageHeader
        title="Unidades & Franquias"
        subtitle="Multi-tenant: gestão centralizada com RBAC por unidade. Expansão, benchmarking, consolidado."
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNova(true)}>
            Nova unidade
          </Button>
        }
      />
      <PageContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-brand-50 text-brand-600 inline-flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Unidades ativas</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{ativas.length}<span className="text-slate-400 font-normal text-[14px]"> / {unidades.length}</span></div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-emerald-50 text-emerald-600 inline-flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Receita consolidada</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{money(receitaTotal)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Atingimento global</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{pct(receitaTotal / metaTotal)}</div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-aqua-50 text-aqua-600 inline-flex items-center justify-center">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Usuários totais</div>
                <div className="text-[20px] font-semibold tabular text-slate-900">{totalUsuarios}</div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {unidades.map((u) => {
            const ating = u.meta_mes > 0 ? u.receita_mes / u.meta_mes : 0;
            return (
              <Card key={u.id} className="hover:shadow-pop transition cursor-pointer" onClick={() => setSel(u)}>
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[15px] text-slate-900">{u.nome}</h3>
                        <Badge tone={statusTone[u.status] as any}>{u.status}</Badge>
                      </div>
                      <div className="text-[12px] text-slate-500 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {u.cidade}, {u.estado}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Gerente</div>
                      <div className="text-[12px] font-semibold text-slate-700">{u.gerente}</div>
                    </div>
                  </div>

                  {u.status !== "inativa" && (
                    <>
                      <div className="grid grid-cols-4 gap-2 py-3 border-y border-slate-100 text-center">
                        <div>
                          <div className="text-[10px] text-slate-400">Usuários</div>
                          <div className="text-[14px] font-semibold tabular">{u.usuarios}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Leads/mês</div>
                          <div className="text-[14px] font-semibold tabular">{number(u.leads_mes)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Receita</div>
                          <div className="text-[14px] font-semibold tabular">{money(u.receita_mes)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">NPS</div>
                          <div className={cn("text-[14px] font-semibold tabular", u.nps >= 70 ? "text-emerald-600" : u.nps >= 50 ? "text-amber-600" : "text-slate-500")}>
                            {u.nps || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Atingimento da meta</span>
                          <span className={cn("font-semibold tabular", ating >= 0.9 ? "text-emerald-600" : ating >= 0.6 ? "text-amber-600" : "text-rose-600")}>
                            {pct(ating)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", ating >= 0.9 ? "bg-emerald-500" : ating >= 0.6 ? "bg-amber-500" : "bg-rose-500")}
                            style={{ width: `${Math.min(100, ating * 100)}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      </PageContent>

      <Dialog
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.nome}
        subtitle={sel && `${sel.cidade}, ${sel.estado} · Aberta em ${dateShort(sel.abertura_em)}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" leftIcon={<Settings className="h-3.5 w-3.5" />}>Configurar</Button>
            <Button variant="outline">Ver dashboard</Button>
          </>
        }
      >
        {sel && (
          <div className="space-y-3 text-[13px]">
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Receita mês" value={money(sel.receita_mes)} />
              <Metric label="Meta mês" value={money(sel.meta_mes)} />
              <Metric label="Gap" value={money(sel.meta_mes - sel.receita_mes)} accent="rose" />
              <Metric label="Usuários" value={`${sel.usuarios}`} />
              <Metric label="Leads / mês" value={number(sel.leads_mes)} />
              <Metric label="NPS" value={sel.nps ? `${sel.nps}` : "—"} accent={sel.nps >= 70 ? "emerald" : "slate"} />
            </div>
            <div className="rounded-[10px] bg-slate-50 p-3 text-[12px]">
              <div className="text-[10px] text-slate-400 uppercase mb-1">Isolamento de dados</div>
              Esta unidade opera em tenant isolado. RBAC e row-level security garantem que gestores de outras unidades não acessem estes leads/dados.
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={nova}
        onClose={() => setNova(false)}
        title="Nova unidade"
        subtitle="Cria tenant isolado com schema próprio"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setNova(false)}>Cancelar</Button>
            <Button onClick={() => setNova(false)} leftIcon={<Plus className="h-3.5 w-3.5" />}>Criar unidade</Button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Nome da unidade</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3" placeholder="Ex: Valparaíso Fortaleza" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Cidade</label>
              <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1">Estado</label>
              <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3" maxLength={2} />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Gerente responsável</label>
            <input className="w-full h-9 rounded-[10px] border border-slate-200 px-3" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1">Meta mensal (R$)</label>
            <input type="number" className="w-full h-9 rounded-[10px] border border-slate-200 px-3 tabular" />
          </div>
        </div>
      </Dialog>
    </>
  );
}

function Metric({ label, value, accent = "slate" }: { label: string; value: string; accent?: "slate" | "emerald" | "rose" }) {
  const col = { slate: "text-slate-900", emerald: "text-emerald-600", rose: "text-rose-600" }[accent];
  return (
    <div className="rounded-[10px] bg-slate-50 p-3">
      <div className="text-[10px] text-slate-400 uppercase">{label}</div>
      <div className={cn("text-[16px] font-semibold tabular", col)}>{value}</div>
    </div>
  );
}
