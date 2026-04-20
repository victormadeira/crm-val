import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Info,
  Key,
  Lock,
  Mail,
  Plus,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { dateTime, relativeTime } from "@/lib/format";
import {
  auditoria,
  configGerais,
  integracoesAdmin,
  permissoesMatriz,
  usuariosAdmin,
} from "@/lib/mock";
import type { Papel } from "@/lib/types";

const papelLabel: Record<Papel, string> = {
  admin: "Admin",
  gestor: "Gestor",
  supervisor: "Supervisor",
  corretor: "Corretor",
  sac: "SAC",
};

const papelTone: Record<Papel, "violet" | "brand" | "amber" | "emerald" | "rose"> = {
  admin: "violet",
  gestor: "brand",
  supervisor: "amber",
  corretor: "emerald",
  sac: "rose",
};

export function Admin() {
  const [aba, setAba] = useState<
    "usuarios" | "permissoes" | "auditoria" | "config" | "integracoes"
  >("usuarios");
  const [busca, setBusca] = useState("");
  const [papelFiltro, setPapelFiltro] = useState<Papel | "todos">("todos");
  const [novoOpen, setNovoOpen] = useState(false);

  const usuariosFiltrados = useMemo(() => {
    return usuariosAdmin.filter((u) => {
      if (papelFiltro !== "todos" && u.papel !== papelFiltro) return false;
      if (busca && !u.nome.toLowerCase().includes(busca.toLowerCase()) && !u.email.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [busca, papelFiltro]);

  const ativos = usuariosAdmin.filter((u) => u.ativo).length;
  const mfaCount = usuariosAdmin.filter((u) => u.mfa).length;
  const criticos = auditoria.filter((a) => a.severidade === "critical").length;

  return (
    <>
      <PageHeader
        title="Administração"
        subtitle="Usuários, permissões, auditoria e configurações do sistema"
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
              Exportar audit
            </Button>
            <Button
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => setNovoOpen(true)}
            >
              Novo usuário
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MiniKPI
            icon={<Users className="h-5 w-5" />}
            label="Usuários"
            value={`${ativos}/${usuariosAdmin.length}`}
            sub="ativos"
            tone="brand"
          />
          <MiniKPI
            icon={<ShieldCheck className="h-5 w-5" />}
            label="MFA ativado"
            value={`${mfaCount}/${usuariosAdmin.length}`}
            sub={`${Math.round((mfaCount / usuariosAdmin.length) * 100)}% da base`}
            tone="emerald"
          />
          <MiniKPI
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Eventos críticos"
            value={String(criticos)}
            sub="nas últimas 24h"
            tone={criticos > 0 ? "rose" : "slate"}
          />
          <MiniKPI
            icon={<Activity className="h-5 w-5" />}
            label="Uptime"
            value="99,97%"
            sub="últimos 30 dias"
            tone="violet"
          />
        </div>

        <Tabs
          tabs={[
            { id: "usuarios", label: "Usuários", count: usuariosAdmin.length },
            { id: "permissoes", label: "Permissões" },
            { id: "auditoria", label: "Auditoria", count: auditoria.length },
            { id: "config", label: "Configurações" },
            { id: "integracoes", label: "Integrações" },
          ]}
          value={aba}
          onChange={(v) => setAba(v as any)}
        />

        {aba === "usuarios" && (
          <Card>
            <CardHeader
              title="Gestão de usuários"
              subtitle={`${usuariosFiltrados.length} exibidos`}
              action={
                <div className="flex items-center gap-2">
                  <Input
                    leftIcon={<Search className="h-4 w-4" />}
                    placeholder="Buscar..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-64"
                  />
                  <Tabs
                    tabs={[
                      { id: "todos", label: "Todos" },
                      { id: "admin", label: "Admin" },
                      { id: "gestor", label: "Gestor" },
                      { id: "supervisor", label: "Sup." },
                      { id: "corretor", label: "Corretor" },
                      { id: "sac", label: "SAC" },
                    ]}
                    value={papelFiltro}
                    onChange={(v) => setPapelFiltro(v as any)}
                  />
                </div>
              }
            />
            <CardBody className="pt-0 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="py-2 font-semibold">Usuário</th>
                    <th className="py-2 font-semibold">Papel</th>
                    <th className="py-2 font-semibold">MFA</th>
                    <th className="py-2 font-semibold">Último acesso</th>
                    <th className="py-2 font-semibold">IP</th>
                    <th className="py-2 font-semibold">Status</th>
                    <th className="py-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={u.nome} size="sm" />
                          <div>
                            <div className="font-medium text-slate-900">
                              {u.nome}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <Badge tone={papelTone[u.papel]}>
                          {papelLabel[u.papel]}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        {u.mfa ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Shield className="h-4 w-4 text-slate-300" />
                        )}
                      </td>
                      <td className="py-2.5 text-slate-600 tabular">
                        há {relativeTime(u.ultimo_acesso)}
                      </td>
                      <td className="py-2.5 text-[11px] text-slate-500 tabular">
                        {u.ip_ultimo ?? "-"}
                      </td>
                      <td className="py-2.5">
                        {u.ativo ? (
                          <Badge tone="emerald" dot>
                            Ativo
                          </Badge>
                        ) : (
                          <Badge tone="slate">Inativo</Badge>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}

        {aba === "permissoes" && (
          <Card>
            <CardHeader
              title="Matriz de permissões"
              subtitle="Defina o que cada papel pode acessar"
              action={
                <Button variant="outline" size="sm" leftIcon={<Key className="h-3.5 w-3.5" />}>
                  Salvar alterações
                </Button>
              }
            />
            <CardBody className="pt-0 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="py-2 text-left font-semibold">Módulo</th>
                    {(["admin", "gestor", "supervisor", "corretor", "sac"] as Papel[]).map(
                      (p) => (
                        <th key={p} className="py-2 text-center font-semibold">
                          {papelLabel[p]}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {permissoesMatriz.map((row) => (
                    <tr
                      key={row.modulo}
                      className="border-b border-slate-50 hover:bg-slate-50/60"
                    >
                      <td className="py-2 font-medium text-slate-800">
                        {row.modulo}
                      </td>
                      <PermCell val={row.admin} />
                      <PermCell val={row.gestor} />
                      <PermCell val={row.supervisor} />
                      <PermCell val={row.corretor} />
                      <PermCell val={row.sac} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}

        {aba === "auditoria" && (
          <Card>
            <CardHeader
              title="Log de auditoria"
              subtitle="Eventos recentes do sistema • imutável"
              action={
                <Badge tone="slate">
                  <Database className="h-3 w-3 mr-1" />
                  Retido 12 meses
                </Badge>
              }
            />
            <CardBody className="pt-0">
              <ul className="space-y-1">
                {auditoria.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start gap-3 p-2.5 rounded-[10px] hover:bg-slate-50"
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-[9px] inline-flex items-center justify-center shrink-0",
                        e.severidade === "critical"
                          ? "bg-rose-50 text-rose-600"
                          : e.severidade === "warning"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {e.severidade === "critical" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : e.severidade === "warning" ? (
                        <Info className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-[13px]">
                          {e.acao}
                        </span>
                        <Badge tone="slate" className="text-[10px]">
                          {e.modulo}
                        </Badge>
                        <span className="text-[11px] text-slate-500">
                          por {e.usuario}
                        </span>
                      </div>
                      <div className="text-[12px] text-slate-600 mt-0.5">
                        {e.detalhes}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 tabular">
                        <Clock className="h-2.5 w-2.5" />
                        {dateTime(e.timestamp)}
                        {e.ip && <span>• {e.ip}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {aba === "config" && (
          <Card>
            <CardHeader
              title="Configurações gerais"
              subtitle="Parâmetros globais do sistema"
              action={
                <Button variant="outline" size="sm" leftIcon={<Settings2 className="h-3.5 w-3.5" />}>
                  Salvar
                </Button>
              }
            />
            <CardBody className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
              {configGerais.map((c) => (
                <div
                  key={c.chave}
                  className="p-3 rounded-[12px] border border-slate-200"
                >
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">
                    {c.chave}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <div className="text-[15px] font-semibold text-slate-900 tabular">
                        {String(c.valor)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.descricao}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        {aba === "integracoes" && (
          <Card>
            <CardHeader
              title="Integrações"
              subtitle={`${integracoesAdmin.length} serviços externos conectados`}
              action={
                <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                  Nova integração
                </Button>
              }
            />
            <CardBody className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
              {integracoesAdmin.map((i) => (
                <div
                  key={i.nome}
                  className="p-3 rounded-[12px] border border-slate-200 flex items-center gap-3"
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-[10px] inline-flex items-center justify-center",
                      i.status === "conectado"
                        ? "bg-emerald-50 text-emerald-600"
                        : i.status === "degradado"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-rose-50 text-rose-600"
                    )}
                  >
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-[13px]">
                        {i.nome}
                      </span>
                      <Badge
                        tone={
                          i.status === "conectado"
                            ? "emerald"
                            : i.status === "degradado"
                            ? "amber"
                            : "rose"
                        }
                        dot
                      >
                        {i.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Última sync há {relativeTime(i.ultima_sync)} •{" "}
                      <span className="tabular">{i.volume_24h}</span>{" "}
                      eventos/24h
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </PageContent>

      <Dialog
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        title="Novo usuário"
        subtitle="Criar conta e enviar convite por e-mail"
        size="md"
      >
        <div className="p-5 space-y-3">
          <Input
            leftIcon={<Users className="h-4 w-4" />}
            placeholder="Nome completo"
          />
          <Input
            leftIcon={<Mail className="h-4 w-4" />}
            placeholder="email@valparaiso.com.br"
            type="email"
          />
          <div className="grid grid-cols-2 gap-2">
            <select className="h-9 rounded-[10px] border border-slate-200 bg-white px-3 text-sm">
              <option>Corretor</option>
              <option>Supervisor</option>
              <option>Gestor</option>
              <option>SAC</option>
              <option>Admin</option>
            </select>
            <label className="flex items-center gap-2 p-2 rounded-[10px] border border-slate-200 text-[13px] cursor-pointer">
              <input type="checkbox" defaultChecked />
              Exigir MFA
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
            <Button
              leftIcon={<Lock className="h-4 w-4" />}
              onClick={() => setNovoOpen(false)}
            >
              Criar e enviar convite
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function MiniKPI({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "brand" | "emerald" | "rose" | "violet" | "slate";
}) {
  const toneMap = {
    brand: "from-brand-500 to-brand-600",
    emerald: "from-emerald-500 to-emerald-600",
    rose: "from-rose-500 to-red-600",
    violet: "from-violet-500 to-violet-600",
    slate: "from-slate-500 to-slate-600",
  };
  return (
    <Card>
      <CardBody className="p-4 flex items-center gap-3">
        <div
          className={cn(
            "h-11 w-11 rounded-[11px] bg-gradient-to-br text-white inline-flex items-center justify-center",
            toneMap[tone]
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            {label}
          </div>
          <div className="text-[20px] font-bold text-slate-900 tabular leading-tight">
            {value}
          </div>
          <div className="text-[11px] text-slate-500">{sub}</div>
        </div>
      </CardBody>
    </Card>
  );
}

function PermCell({ val }: { val: boolean }) {
  return (
    <td className="py-2 text-center">
      {val ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
      ) : (
        <XCircle className="h-4 w-4 text-slate-300 inline" />
      )}
    </td>
  );
}
