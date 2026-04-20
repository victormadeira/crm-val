import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  HeartPulse,
  Info,
  RefreshCw,
  Target,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";
import { alertas, corretorById } from "@/lib/mock";
import type { Alerta } from "@/lib/types";

const tipoIcon = {
  sla_breach: <Clock className="h-4 w-4" />,
  lead_parado: <Flame className="h-4 w-4" />,
  score_cai: <TrendingDown className="h-4 w-4" />,
  sem_resposta: <AlertTriangle className="h-4 w-4" />,
  meta: <Target className="h-4 w-4" />,
  health_baixa: <HeartPulse className="h-4 w-4" />,
  renovacao_vencendo: <RefreshCw className="h-4 w-4" />,
  backlog_alto: <Users className="h-4 w-4" />,
} as const;

const tipoLabel = {
  sla_breach: "SLA estourado",
  lead_parado: "Lead parado",
  score_cai: "Queda de métrica",
  sem_resposta: "Sem resposta",
  meta: "Meta",
  health_baixa: "Health baixa",
  renovacao_vencendo: "Renovação vencendo",
  backlog_alto: "Backlog alto",
} as const;

export function Alertas() {
  const [filtro, setFiltro] = useState<"todos" | "critical" | "warning" | "info">(
    "todos"
  );
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [resolvidos, setResolvidos] = useState<Set<string>>(new Set());

  const ativos = alertas.filter((a) => !resolvidos.has(a.id));

  const visiveis = useMemo(() => {
    let r = ativos;
    if (filtro !== "todos") r = r.filter((a) => a.severidade === filtro);
    if (tipoFiltro !== "todos") r = r.filter((a) => a.tipo === tipoFiltro);
    return r.sort((a, b) => {
      const sevOrder = { critical: 0, warning: 1, info: 2 };
      return sevOrder[a.severidade] - sevOrder[b.severidade];
    });
  }, [filtro, tipoFiltro, ativos]);

  const resolver = (id: string) =>
    setResolvidos((prev) => new Set(prev).add(id));

  const cCriticos = ativos.filter((a) => a.severidade === "critical").length;
  const cWarnings = ativos.filter((a) => a.severidade === "warning").length;
  const cInfo = ativos.filter((a) => a.severidade === "info").length;

  const tiposUnicos = Array.from(new Set(alertas.map((a) => a.tipo)));

  return (
    <>
      <PageHeader
        title="Alertas"
        subtitle="Centro unificado de avisos • IA monitora 24/7"
        actions={
          <>
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Configurar regras
            </Button>
            <Button
              variant="outline"
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => setResolvidos(new Set(alertas.map((a) => a.id)))}
            >
              Marcar todos resolvidos
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* KPIs por severidade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPISeveridade
            tone="rose"
            label="Críticos"
            value={cCriticos}
            icon={<AlertTriangle className="h-5 w-5" />}
            desc="Ação imediata"
            onClick={() => setFiltro("critical")}
            ativo={filtro === "critical"}
          />
          <KPISeveridade
            tone="amber"
            label="Atenção"
            value={cWarnings}
            icon={<Flame className="h-5 w-5" />}
            desc="Próximas horas"
            onClick={() => setFiltro("warning")}
            ativo={filtro === "warning"}
          />
          <KPISeveridade
            tone="brand"
            label="Informativos"
            value={cInfo}
            icon={<Info className="h-5 w-5" />}
            desc="Monitoramento"
            onClick={() => setFiltro("info")}
            ativo={filtro === "info"}
          />
        </div>

        {/* Lista */}
        <Card>
          <CardHeader
            title={
              filtro === "todos"
                ? "Todos os alertas"
                : `${filtro[0].toUpperCase() + filtro.slice(1)} ativos`
            }
            subtitle={`${visiveis.length} ${visiveis.length === 1 ? "alerta" : "alertas"}`}
            action={
              <div className="flex items-center gap-2">
                <Tabs
                  tabs={[
                    { id: "todos", label: "Todas severidades" },
                    ...tiposUnicos.map((t) => ({
                      id: t,
                      label: tipoLabel[t],
                    })),
                  ]}
                  value={tipoFiltro}
                  onChange={setTipoFiltro}
                />
              </div>
            }
          />
          <CardBody className="pt-0">
            {visiveis.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-10 w-10" />}
                title="Nenhum alerta ativo"
                description="Tudo sob controle. A IA continua monitorando SLA, health dos corretores, vencimentos e métricas."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {visiveis.map((a) => (
                  <AlertaItem
                    key={a.id}
                    alerta={a}
                    onResolver={() => resolver(a.id)}
                  />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Histórico */}
        {resolvidos.size > 0 && (
          <Card>
            <CardHeader
              title="Resolvidos nesta sessão"
              subtitle={`${resolvidos.size} ${resolvidos.size === 1 ? "alerta resolvido" : "alertas resolvidos"}`}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResolvidos(new Set())}
                >
                  Reabrir todos
                </Button>
              }
            />
            <CardBody className="pt-0">
              <ul className="divide-y divide-slate-100">
                {alertas
                  .filter((a) => resolvidos.has(a.id))
                  .map((a) => (
                    <li
                      key={a.id}
                      className="py-2 flex items-center gap-3 opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-slate-700 line-through truncate">
                          {a.titulo}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 tabular">
                        Resolvido agora
                      </span>
                    </li>
                  ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </PageContent>
    </>
  );
}

function KPISeveridade({
  tone,
  label,
  value,
  icon,
  desc,
  onClick,
  ativo,
}: {
  tone: "rose" | "amber" | "brand";
  label: string;
  value: number;
  icon: React.ReactNode;
  desc: string;
  onClick: () => void;
  ativo: boolean;
}) {
  const toneMap = {
    rose: {
      bg: "from-rose-500 to-rose-600",
      border: "border-rose-400",
      text: "text-rose-700",
    },
    amber: {
      bg: "from-amber-500 to-orange-500",
      border: "border-amber-400",
      text: "text-amber-700",
    },
    brand: {
      bg: "from-brand-500 to-brand-600",
      border: "border-brand-400",
      text: "text-brand-700",
    },
  };
  const t = toneMap[tone];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-[14px] bg-white border-2 p-4 transition-all",
        ativo ? t.border : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-11 w-11 rounded-[11px] bg-gradient-to-br text-white inline-flex items-center justify-center shadow-soft",
            t.bg
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            {label}
          </div>
          <div className="text-[26px] font-bold text-slate-900 tabular leading-tight">
            {value}
          </div>
        </div>
        {ativo && <Badge tone={tone}>Filtrado</Badge>}
      </div>
      <div className="text-[11px] text-slate-500 mt-1">{desc}</div>
    </button>
  );
}

function AlertaItem({
  alerta,
  onResolver,
}: {
  alerta: Alerta;
  onResolver: () => void;
}) {
  const corretor = alerta.corretor_id
    ? corretorById(alerta.corretor_id)
    : null;

  const iconeSev =
    alerta.severidade === "critical"
      ? "bg-rose-50 text-rose-600"
      : alerta.severidade === "warning"
      ? "bg-amber-50 text-amber-600"
      : "bg-brand-50 text-brand-600";

  return (
    <li className="py-3 flex items-start gap-3">
      <div
        className={cn(
          "h-9 w-9 rounded-[9px] inline-flex items-center justify-center shrink-0",
          iconeSev
        )}
      >
        {tipoIcon[alerta.tipo]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-slate-900">
            {alerta.titulo}
          </span>
          <Badge
            tone={
              alerta.severidade === "critical"
                ? "rose"
                : alerta.severidade === "warning"
                ? "amber"
                : "brand"
            }
            className="text-[10px]"
          >
            {tipoLabel[alerta.tipo]}
          </Badge>
        </div>
        <div className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">
          {alerta.descricao}
        </div>
        {alerta.acao_sugerida && (
          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-[8px] px-2 py-1.5">
            <Zap className="h-3 w-3 text-brand-600 mt-0.5 shrink-0" />
            <span className="leading-relaxed">
              <strong className="text-slate-900">IA sugere:</strong>{" "}
              {alerta.acao_sugerida}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {corretor && (
            <div className="flex items-center gap-1.5">
              <Avatar name={corretor.nome} size="xs" />
              <span className="text-[10px] text-slate-500">
                {corretor.nome}
              </span>
            </div>
          )}
          <span className="text-[10px] text-slate-400 tabular">
            há {relativeTime(alerta.created_at)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <Button size="sm" variant="outline" onClick={onResolver}>
          Resolver
        </Button>
        {alerta.acao_sugerida && (
          <Button size="sm" leftIcon={<Zap className="h-3 w-3" />}>
            Aplicar sugestão
          </Button>
        )}
      </div>
    </li>
  );
}
