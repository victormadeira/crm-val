import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  Check,
  ChevronRight,
  Cpu,
  Filter,
  Gauge,
  HeartPulse,
  LifeBuoy,
  Minus,
  Plus,
  Shuffle,
  Siren,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  UserCog,
  Users,
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
import { money, pct, relativeTime } from "@/lib/format";
import {
  calcularMatch,
  corretorById,
  corretores,
  corretoresParaDesafogar,
  leadById,
  leads,
  leadsParadosPorCorretor,
  routingDecisions,
  routingMetrica,
} from "@/lib/mock";
import type {
  Canal,
  Lead,
  MatchCorretor,
  RoutingDecision,
} from "@/lib/types";

/* ─────────────────────────── PÁGINA ─────────────────────────── */

export function RouterIA() {
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [addAberto, setAddAberto] = useState(false);
  const [desafogarCorretorId, setDesafogarCorretorId] = useState<string | null>(
    null
  );
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const d = searchParams.get("desafogar");
    if (d && corretores.some((c) => c.id === d)) {
      setDesafogarCorretorId(d);
      const next = new URLSearchParams(searchParams);
      next.delete("desafogar");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const decisao = selecionadoId
    ? routingDecisions.find((r) => r.id === selecionadoId)
    : null;

  const porEtapa = {
    ingestao: routingDecisions.filter((r) => r.etapa === "ingestao"),
    qualificacao: routingDecisions.filter((r) => r.etapa === "qualificacao"),
    match: routingDecisions.filter((r) => r.etapa === "match"),
    alocado: routingDecisions.filter((r) => r.etapa === "alocado").slice(0, 6),
  };

  return (
    <>
      <PageHeader
        title="Roteamento IA"
        subtitle="Qualificação automática e atribuição inteligente de leads"
        actions={
          <>
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Filtros
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setAddAberto(true)}
            >
              Adicionar lead
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* Princípio de alocação */}
        <Card className="border-brand-200 bg-gradient-to-r from-brand-50 via-white to-aqua-50">
          <CardBody className="py-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-[10px] bg-brand-100 text-brand-700 inline-flex items-center justify-center shrink-0">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-slate-900">
                  Todos os corretores recebem leads — a IA decide{" "}
                  <span className="text-brand-700">quem converte melhor cada perfil</span>
                </div>
                <div className="text-[12px] text-slate-600 mt-0.5 leading-relaxed">
                  Regra 1: carga máxima de 95% bloqueia o corretor. Regra 2: capacidade
                  livre recebe bônus. Resultado: distribuição justa + mais conversão, sem
                  sobrecarregar o top performer.
                </div>
              </div>
              <Badge tone="brand" dot className="mt-0.5 shrink-0">
                Sem sobrecarga
              </Badge>
            </div>
          </CardBody>
        </Card>

        {/* KPIs de roteamento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            icon={<Cpu className="h-4 w-4" />}
            tone="violet"
            label="Leads roteados pela IA"
            value={routingMetrica.leads_roteados_ia.toString()}
            sub={`vs ${routingMetrica.leads_roteados_manual} manuais • ${routingMetrica.periodo}`}
          />
          <KPICard
            icon={<TrendingUp className="h-4 w-4" />}
            tone="emerald"
            label="Conversão IA"
            value={pct(routingMetrica.conv_ia)}
            sub={`+${Math.round(
              (routingMetrica.conv_ia - routingMetrica.conv_manual) * 100
            )}pp vs manual`}
          />
          <KPICard
            icon={<Shuffle className="h-4 w-4" />}
            tone="amber"
            label="Overrides do gestor"
            value={routingMetrica.overrides.toString()}
            sub={`${Math.round(
              (routingMetrica.overrides / routingMetrica.leads_roteados_ia) *
                100
            )}% dos casos`}
          />
          <KPICard
            icon={<Trophy className="h-4 w-4" />}
            tone="brand"
            label="Perda evitada"
            value={money(routingMetrica.perda_evitada_reais)}
            sub={`${routingMetrica.fechamentos_extras} vendas extras`}
          />
        </div>

        {/* Pipeline visual */}
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-500" />
                Pipeline ao vivo
              </span>
            }
            subtitle="Leads passando por qualificação e match em tempo real"
            action={
              <Badge tone="emerald" dot>
                Processando
              </Badge>
            }
          />
          <CardBody>
            <div className="grid grid-cols-4 gap-3">
              <PipelineColuna
                title="Ingestão"
                subtitle="Lead chegou"
                icon={<Zap className="h-3.5 w-3.5" />}
                tone="slate"
                decisoes={porEtapa.ingestao}
                onSelect={setSelecionadoId}
              />
              <PipelineColuna
                title="Qualificação"
                subtitle="IA analisando"
                icon={<Brain className="h-3.5 w-3.5" />}
                tone="violet"
                decisoes={porEtapa.qualificacao}
                onSelect={setSelecionadoId}
              />
              <PipelineColuna
                title="Match"
                subtitle="Escolhendo corretor"
                icon={<Target className="h-3.5 w-3.5" />}
                tone="amber"
                decisoes={porEtapa.match}
                onSelect={setSelecionadoId}
              />
              <PipelineColuna
                title="Alocado"
                subtitle="Enviado ao corretor"
                icon={<UserCheck className="h-3.5 w-3.5" />}
                tone="emerald"
                decisoes={porEtapa.alocado}
                onSelect={setSelecionadoId}
              />
            </div>
          </CardBody>
        </Card>

        {/* Desafogar corretores com baixa vazão */}
        {corretoresParaDesafogar().length > 0 && (
          <Card className="border-rose-200 bg-gradient-to-r from-rose-50 via-white to-amber-50">
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2 text-rose-700">
                  <LifeBuoy className="h-4 w-4" />
                  Desafogar corretor
                </span>
              }
              subtitle="IA detectou acúmulo de leads parados — realoque em 1 clique"
              action={
                <Badge tone="rose" dot>
                  {corretoresParaDesafogar().length}{" "}
                  {corretoresParaDesafogar().length === 1
                    ? "precisa de ação"
                    : "precisam de ação"}
                </Badge>
              }
            />
            <CardBody className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {corretoresParaDesafogar().map((c) => {
                  const parados = leadsParadosPorCorretor[c.id] ?? [];
                  const pctBacklog =
                    c.leads_ativos > 0
                      ? (c.leads_parados / c.leads_ativos) * 100
                      : 0;
                  return (
                    <div
                      key={c.id}
                      className="rounded-[12px] bg-white border border-rose-200 p-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={c.nome} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-slate-900 truncate">
                              {c.nome}
                            </span>
                            <Badge
                              tone={c.health_score < 50 ? "rose" : "amber"}
                              className="text-[10px] h-4 px-1.5"
                            >
                              Health {c.health_score}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            <strong className="text-rose-700 tabular">
                              {c.leads_parados} leads parados
                            </strong>{" "}
                            de {c.leads_ativos} (
                            {Math.round(pctBacklog)}% do backlog). Resposta em
                            24h:{" "}
                            <strong className="text-slate-900 tabular">
                              {Math.round(c.taxa_resposta_24h * 100)}%
                            </strong>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1.5 italic">
                            IA sugere realocar {parados.length} leads para
                            corretores com capacidade livre.
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<LifeBuoy className="h-3.5 w-3.5" />}
                          onClick={() => setDesafogarCorretorId(c.id)}
                          className="flex-1"
                        >
                          Desafogar {parados.length} leads
                        </Button>
                        <Button size="sm" variant="outline">
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-[11px] text-slate-500 italic">
                Realocação não impacta comissão retroativa. Corretor original
                tem fluxo reduzido até zerar o backlog.
              </div>
            </CardBody>
          </Card>
        )}

        {/* Carga por corretor */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-500" />
                  Distribuição do time
                </span>
              }
              subtitle="Saudáveis × parados • vazão real"
              action={
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Saudáveis
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Parados
                  </span>
                </div>
              }
            />
            <CardBody className="space-y-4">
              {corretores.map((c) => {
                const total = c.max_leads_ativos;
                const pctSaud = (c.leads_saudaveis / total) * 100;
                const pctParad = (c.leads_parados / total) * 100;
                const pctBacklog =
                  c.leads_ativos > 0 ? c.leads_parados / c.leads_ativos : 0;
                const alertaVazao = pctBacklog >= 0.35 || c.health_score < 60;
                const healthTone =
                  c.health_score >= 85
                    ? "emerald"
                    : c.health_score >= 60
                    ? "amber"
                    : "rose";
                return (
                  <div key={c.id} className="flex items-start gap-3">
                    <Avatar name={c.nome} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[13px] font-semibold text-slate-900 truncate">
                            {c.nome}
                          </span>
                          {alertaVazao && (
                            <Badge tone="rose" className="text-[9px] h-4 px-1.5 shrink-0">
                              <Siren className="h-2.5 w-2.5 mr-0.5" />
                              Baixa vazão
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 tabular shrink-0">
                          {c.leads_saudaveis}
                          <span className="text-emerald-600">✓</span>
                          {" + "}
                          {c.leads_parados}
                          <span className="text-rose-600">!</span>
                          {" / "}
                          {total}
                        </span>
                      </div>
                      {/* Barra empilhada saudáveis + parados */}
                      <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${pctSaud}%` }}
                        />
                        <div
                          className="h-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${pctParad}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] tabular font-medium",
                            healthTone === "emerald"
                              ? "text-emerald-700"
                              : healthTone === "amber"
                              ? "text-amber-700"
                              : "text-rose-700"
                          )}
                        >
                          <HeartPulse className="h-3 w-3" />
                          Health {c.health_score}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-500 tabular">
                          Resp 24h{" "}
                          <strong className="text-slate-900">
                            {Math.round(c.taxa_resposta_24h * 100)}%
                          </strong>
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-500 tabular">
                          Conv{" "}
                          <strong className="text-slate-900">
                            {(c.taxa_conversao * 100).toFixed(0)}%
                          </strong>
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {c.especialidade}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          {/* Histórico recente */}
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Shuffle className="h-4 w-4 text-amber-500" />
                  Decisões recentes
                </span>
              }
              subtitle="IA vs. override do gestor"
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {routingDecisions
                  .filter((r) => r.etapa === "alocado")
                  .slice(0, 8)
                  .map((rd) => {
                    const lead = leadById(rd.lead_id);
                    const escolhido = corretorById(rd.escolhido_id);
                    const sugeria = corretorById(rd.ia_sugeria_id);
                    const foiOverride = rd.status === "override";
                    return (
                      <li
                        key={rd.id}
                        className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer"
                        onClick={() => setSelecionadoId(rd.id)}
                      >
                        <Avatar name={lead?.nome ?? "?"} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-semibold text-slate-900 truncate">
                            {lead?.nome}
                          </div>
                          <div className="text-[10.5px] text-slate-500 flex items-center gap-1 flex-wrap">
                            {foiOverride ? (
                              <>
                                <span>IA sugeriu</span>
                                <strong className="text-slate-700">
                                  {sugeria?.nome.split(" ")[0]}
                                </strong>
                                <ArrowRight className="h-2.5 w-2.5" />
                                <span className="text-amber-700 font-semibold">
                                  gestor escolheu {escolhido?.nome.split(" ")[0]}
                                </span>
                              </>
                            ) : (
                              <>
                                <Bot className="h-2.5 w-2.5 text-violet-500" />
                                <span>
                                  IA alocou para{" "}
                                  <strong className="text-slate-700">
                                    {escolhido?.nome.split(" ")[0]}
                                  </strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge
                          tone={foiOverride ? "amber" : "violet"}
                          className="text-[10px] shrink-0"
                        >
                          {foiOverride ? "override" : "IA"}
                        </Badge>
                        <span className="text-[10px] text-slate-400 tabular shrink-0">
                          {relativeTime(rd.created_at)}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </CardBody>
          </Card>
        </div>
      </PageContent>

      {/* Drawer detalhe decisão */}
      {decisao && (
        <DecisaoDrawer
          decisao={decisao}
          onClose={() => setSelecionadoId(null)}
        />
      )}

      <AddLeadDialog open={addAberto} onClose={() => setAddAberto(false)} />

      <DesafogarDialog
        corretorId={desafogarCorretorId}
        onClose={() => setDesafogarCorretorId(null)}
      />
    </>
  );
}

/* ─────────────────────────── PIPELINE COLUNA ─────────────────────────── */

function PipelineColuna({
  title,
  subtitle,
  icon,
  tone,
  decisoes,
  onSelect,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "slate" | "violet" | "amber" | "emerald";
  decisoes: RoutingDecision[];
  onSelect: (id: string) => void;
}) {
  const toneMap = {
    slate: "bg-slate-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
  };
  return (
    <div className="rounded-[12px] bg-slate-50 border border-slate-200 p-3 min-h-[300px] flex flex-col">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
        <div
          className={cn(
            "h-6 w-6 rounded-[6px] text-white inline-flex items-center justify-center",
            toneMap[tone]
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-slate-900">
            {title}
          </div>
          <div className="text-[10px] text-slate-500">{subtitle}</div>
        </div>
        <span className="text-[11px] font-bold tabular text-slate-700 bg-white border border-slate-200 rounded-[6px] px-1.5 h-5 inline-flex items-center">
          {decisoes.length}
        </span>
      </div>

      <div className="mt-3 space-y-2 flex-1 overflow-y-auto">
        {decisoes.length === 0 && (
          <div className="text-center text-[11px] text-slate-400 py-6">
            Nenhum lead nesta etapa
          </div>
        )}
        {decisoes.map((rd) => {
          const lead = leadById(rd.lead_id);
          if (!lead) return null;
          const topMatch = rd.matches[0];
          const escolhido = corretorById(rd.escolhido_id);
          return (
            <button
              key={rd.id}
              onClick={() => onSelect(rd.id)}
              className="w-full text-left rounded-[10px] bg-white border border-slate-200 p-2.5 hover:border-brand-300 hover:shadow-soft transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-slate-900 truncate">
                    {lead.nome}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate capitalize mt-0.5">
                    {lead.canal} • {lead.interesse}
                  </div>
                </div>
                <ScoreChip score={lead.score} />
              </div>

              {tone === "amber" || tone === "emerald" ? (
                topMatch && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                    <Avatar
                      name={corretorById(topMatch.corretor_id)?.nome ?? "?"}
                      size="xs"
                    />
                    <span className="text-[10px] text-slate-600 truncate flex-1">
                      {corretorById(topMatch.corretor_id)?.nome.split(" ")[0]}
                    </span>
                    <span className="text-[10px] font-bold tabular text-brand-700">
                      {topMatch.score}%
                    </span>
                  </div>
                )
              ) : null}

              {tone === "emerald" && escolhido && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <Avatar name={escolhido.nome} size="xs" />
                  <span className="text-[10px] text-slate-600 truncate flex-1">
                    {escolhido.nome.split(" ")[0]}
                  </span>
                  {rd.status === "override" && (
                    <Badge tone="amber" className="text-[9px]">
                      override
                    </Badge>
                  )}
                </div>
              )}

              {tone === "violet" && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-violet-700">
                  <Brain className="h-2.5 w-2.5" />
                  <span>Analisando perfil...</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── SCORE CHIP ─────────────────────────── */

function ScoreChip({ score }: { score: number }) {
  const tone =
    score >= 75
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score >= 50
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={cn(
        "text-[10px] font-bold tabular px-1.5 h-5 inline-flex items-center rounded-[6px] border shrink-0",
        tone
      )}
    >
      {score}
    </span>
  );
}

/* ─────────────────────────── DRAWER DE DECISÃO ─────────────────────────── */

function DecisaoDrawer({
  decisao,
  onClose,
}: {
  decisao: RoutingDecision;
  onClose: () => void;
}) {
  const lead = leadById(decisao.lead_id);
  const [overrideAberto, setOverrideAberto] = useState(false);

  if (!lead) return null;

  const top3 = decisao.matches.slice(0, 3);
  const escolhido = corretorById(decisao.escolhido_id);
  const alocada = decisao.etapa === "alocado";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] max-w-[90vw] bg-white shadow-pop border-l border-slate-200 flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={lead.nome} size="md" />
            <div className="min-w-0">
              <div className="text-[16px] font-semibold text-slate-900 truncate">
                {lead.nome}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="capitalize">{lead.canal}</span>
                <span>•</span>
                <span>{lead.telefone}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-[8px] text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Mensagem inicial */}
          {lead.mensagem_raw && (
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
                Primeira mensagem
              </div>
              <div className="rounded-[10px] bg-slate-50 border border-slate-200 p-3 text-[13px] text-slate-800 italic">
                "{lead.mensagem_raw}"
              </div>
            </div>
          )}

          {/* Score breakdown */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-[8px] bg-gradient-to-br from-slate-900 to-brand-700 text-white inline-flex items-center justify-center">
                  <Brain className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-[14px] font-semibold text-slate-900">
                  Qualificação IA
                </h4>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                  Score total
                </div>
                <div className="text-[22px] font-bold text-slate-900 tabular leading-none">
                  {lead.score}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(lead.score_breakdown).map(([k, v]) => (
                <div key={k}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-medium text-slate-700 capitalize">
                      {k}
                    </span>
                    <span className="text-[11px] font-bold tabular text-slate-900">
                      {v}
                    </span>
                  </div>
                  <Progress
                    value={(v / 30) * 100}
                    tone="brand"
                    size="xs"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-[10px] bg-violet-50 border border-violet-200 p-2.5 flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-600 shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-violet-900 leading-relaxed">
                <strong>IA interpreta:</strong> {lead.perfil_resumido}.
                Urgência <strong>{lead.urgencia}</strong>, confiança no tipo{" "}
                <strong>{lead.confianca_tipo}</strong>.
              </p>
            </div>
          </div>

          {/* Match corretores */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-[8px] bg-gradient-to-br from-amber-500 to-orange-500 text-white inline-flex items-center justify-center">
                <Target className="h-3.5 w-3.5" />
              </div>
              <h4 className="text-[14px] font-semibold text-slate-900">
                Ranking de match
              </h4>
            </div>

            <div className="space-y-3">
              {top3.map((m, i) => (
                <MatchCard
                  key={m.corretor_id}
                  match={m}
                  rank={i + 1}
                  escolhido={m.corretor_id === decisao.escolhido_id}
                />
              ))}
            </div>

            {decisao.status === "override" && decisao.ia_sugeria_id && (
              <div className="mt-3 rounded-[10px] bg-amber-50 border border-amber-200 p-2.5 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11.5px] text-amber-900 leading-relaxed">
                  <strong>Override:</strong> IA sugeria{" "}
                  {corretorById(decisao.ia_sugeria_id)?.nome}, mas gestor
                  escolheu {escolhido?.nome}. A IA monitora o resultado pra
                  aprender.
                </p>
              </div>
            )}
          </div>

          {/* Perfil do lead */}
          <div className="px-5 py-4">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
              Tags e motivadores
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {lead.tags.map((t) => (
                <Badge key={t} tone="brand" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">
              Objeções prováveis
            </div>
            <ul className="space-y-1">
              {lead.objecoes.map((o) => (
                <li
                  key={o}
                  className="text-[12px] text-slate-700 inline-flex items-start gap-1.5"
                >
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer ações */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/40 flex items-center gap-2">
          {alocada ? (
            <>
              <Button
                variant="outline"
                leftIcon={<UserCog className="h-3.5 w-3.5" />}
                onClick={() => setOverrideAberto(true)}
                className="flex-1"
              >
                Trocar corretor
              </Button>
              <Button className="flex-1">Ver conversa</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOverrideAberto(true)}
              >
                Escolher manualmente
              </Button>
              <Button
                className="flex-1"
                leftIcon={<Check className="h-3.5 w-3.5" />}
              >
                Aceitar sugestão da IA
              </Button>
            </>
          )}
        </div>
      </div>

      <OverrideDialog
        open={overrideAberto}
        onClose={() => setOverrideAberto(false)}
        lead={lead}
        atual={decisao.escolhido_id}
      />
    </>
  );
}

/* ─────────────────────────── MATCH CARD ─────────────────────────── */

function MatchCard({
  match,
  rank,
  escolhido,
}: {
  match: MatchCorretor;
  rank: number;
  escolhido: boolean;
}) {
  const c = corretorById(match.corretor_id);
  if (!c) return null;
  const medalha =
    rank === 1
      ? "bg-gradient-to-br from-amber-400 to-amber-600"
      : rank === 2
      ? "bg-gradient-to-br from-slate-300 to-slate-500"
      : "bg-gradient-to-br from-orange-400 to-orange-600";

  return (
    <div
      className={cn(
        "rounded-[12px] border p-3",
        escolhido
          ? "border-brand-400 bg-brand-50/40 shadow-soft"
          : "border-slate-200"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar name={c.nome} size="md" />
          <span
            className={cn(
              "absolute -bottom-1 -right-1 h-5 w-5 rounded-full text-white text-[10px] font-bold inline-flex items-center justify-center ring-2 ring-white",
              medalha
            )}
          >
            {rank}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-slate-900 truncate">
              {c.nome}
            </span>
            <span className="text-[18px] font-bold tabular text-brand-700 shrink-0">
              {match.score}%
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500">
              Prob. fechamento{" "}
              <strong className="tabular text-emerald-700">
                {Math.round(match.conv_prob * 100)}%
              </strong>
            </span>
            {escolhido && (
              <Badge tone="brand" className="text-[9px]">
                <Check className="h-2.5 w-2.5" /> Escolhido
              </Badge>
            )}
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-1">
        {match.razoes.map((r, i) => (
          <li
            key={i}
            className={cn(
              "text-[11px] inline-flex items-start gap-1.5 w-full",
              r.tipo === "atencao" ? "text-amber-700" : "text-slate-700"
            )}
          >
            {r.tipo === "positivo" ? (
              <Plus className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Minus className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{r.label}</span>
            <span
              className={cn(
                "tabular font-semibold shrink-0",
                r.peso > 0 ? "text-emerald-700" : "text-amber-700"
              )}
            >
              {r.peso > 0 ? "+" : ""}
              {r.peso}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────── OVERRIDE DIALOG ─────────────────────────── */

function OverrideDialog({
  open,
  onClose,
  lead,
  atual,
}: {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  atual?: string;
}) {
  const matches = useMemo(() => calcularMatch(lead), [lead]);
  const [escolhido, setEscolhido] = useState<string | null>(atual ?? null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Trocar corretor"
      subtitle="Escolha manualmente — a IA aprende com sua decisão"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!escolhido || escolhido === atual}>
            Confirmar troca
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {matches.map((m) => {
          const c = corretorById(m.corretor_id);
          if (!c) return null;
          const ativo = escolhido === m.corretor_id;
          const eraAtual = atual === m.corretor_id;
          return (
            <button
              key={m.corretor_id}
              onClick={() => setEscolhido(m.corretor_id)}
              className={cn(
                "w-full text-left rounded-[12px] border-2 p-3 transition flex items-center gap-3",
                ativo
                  ? "border-brand-400 bg-brand-50/40"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <Avatar name={c.nome} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-900">
                    {c.nome}
                  </span>
                  {eraAtual && (
                    <Badge tone="slate" className="text-[9px]">
                      atual
                    </Badge>
                  )}
                </div>
                <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="capitalize">{c.especialidade}</span>
                  <span>•</span>
                  <span className="tabular">
                    {c.leads_ativos}/{c.max_leads_ativos} leads
                  </span>
                  <span>•</span>
                  <span className="tabular">
                    conv {(c.taxa_conversao * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                  Match
                </div>
                <div className="text-[18px] font-bold tabular text-brand-700 leading-none">
                  {m.score}%
                </div>
              </div>
              {ativo && (
                <div className="h-6 w-6 rounded-full bg-brand-500 text-white inline-flex items-center justify-center shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}

/* ─────────────────────────── ADD LEAD DIALOG ─────────────────────────── */

function AddLeadDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"dados" | "analise" | "confirmado">("dados");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [canal, setCanal] = useState<Canal>("whatsapp");
  const [mensagem, setMensagem] = useState("");
  const [matches, setMatches] = useState<MatchCorretor[] | null>(null);

  const reset = () => {
    setStep("dados");
    setNome("");
    setTelefone("");
    setCanal("whatsapp");
    setMensagem("");
    setMatches(null);
    onClose();
  };

  const simular = () => {
    // Calcula match num lead mock baseado nos dados
    const leadFake = leads[0];
    setMatches(calcularMatch(leadFake));
    setStep("analise");
  };

  return (
    <Dialog
      open={open}
      onClose={reset}
      title={
        step === "confirmado"
          ? "Lead adicionado"
          : step === "analise"
          ? "IA analisou o lead"
          : "Adicionar lead manualmente"
      }
      subtitle={
        step === "dados"
          ? "Preencha os dados e a IA vai qualificar automaticamente"
          : step === "analise"
          ? "Escolha o corretor ou aceite a sugestão"
          : undefined
      }
      size="lg"
      footer={
        step === "dados" ? (
          <>
            <Button variant="outline" onClick={reset}>
              Cancelar
            </Button>
            <Button
              disabled={!nome || !telefone}
              onClick={simular}
              rightIcon={<Brain className="h-3.5 w-3.5" />}
            >
              Analisar com IA
            </Button>
          </>
        ) : step === "analise" ? (
          <>
            <Button variant="outline" onClick={() => setStep("dados")}>
              Voltar
            </Button>
            <Button
              leftIcon={<Check className="h-3.5 w-3.5" />}
              onClick={() => setStep("confirmado")}
            >
              Alocar com sugestão da IA
            </Button>
          </>
        ) : (
          <Button onClick={reset}>Fechar</Button>
        )
      }
    >
      {step === "dados" && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 text-[13px] focus:outline-none focus:border-brand-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                Telefone
              </label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(98) 9____-____"
                className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 text-[13px] focus:outline-none focus:border-brand-400 tabular"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                Canal de entrada
              </label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value as Canal)}
                className="mt-1 w-full h-10 px-3 rounded-[10px] border border-slate-200 text-[13px] bg-white focus:outline-none focus:border-brand-400"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="indicacao">Indicação</option>
                <option value="walkin">Presencial</option>
                <option value="email">E-mail</option>
                <option value="site">Site</option>
                <option value="google">Google</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
              Primeira mensagem (opcional)
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={3}
              placeholder="Ex: Oi, queria saber sobre passaporte pra família de 4..."
              className="mt-1 w-full px-3 py-2 rounded-[10px] border border-slate-200 text-[13px] focus:outline-none focus:border-brand-400 resize-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              A IA analisa a mensagem pra detectar urgência, perfil e intenção
            </p>
          </div>
        </div>
      )}

      {step === "analise" && matches && (
        <div className="space-y-3">
          <div className="rounded-[12px] bg-gradient-to-br from-slate-900 to-brand-800 text-white p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-white/10 backdrop-blur-sm inline-flex items-center justify-center ring-1 ring-white/20 shrink-0">
                <Brain className="h-4 w-4 text-aqua-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-aqua-300 font-bold">
                  Análise da IA
                </div>
                <div className="text-[14px] font-semibold mt-0.5">
                  Lead qualificado — score 78 (urgência alta)
                </div>
                <p className="text-[12px] text-slate-200 mt-1.5 leading-relaxed">
                  Perfil: família com interesse recorrente. Mencionou crianças
                  e feriado — gatilho de urgência detectado. Canal{" "}
                  <strong className="text-aqua-300">{canal}</strong> tem
                  histórico de conv 31%.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2">
              Top 3 match
            </div>
            <div className="space-y-2">
              {matches.slice(0, 3).map((m, i) => (
                <MatchCard
                  key={m.corretor_id}
                  match={m}
                  rank={i + 1}
                  escolhido={i === 0}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "confirmado" && (
        <div className="text-center py-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500 text-white inline-flex items-center justify-center shadow-pop">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-[18px] font-semibold text-slate-900">
            Lead adicionado e alocado
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
            O corretor recebeu uma notificação e o lead já aparece na fila dele
            priorizado.
          </p>
        </div>
      )}
    </Dialog>
  );
}

/* ─────────────────────────── KPI CARD ─────────────────────────── */

function KPICard({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  tone: "brand" | "violet" | "emerald" | "amber";
  label: string;
  value: string;
  sub: string;
}) {
  const toneMap = {
    brand: "from-brand-500 to-brand-600",
    violet: "from-violet-500 to-fuchsia-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
  };
  return (
    <Card>
      <CardBody className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-[10px] bg-gradient-to-br text-white inline-flex items-center justify-center shadow-soft",
              toneMap[tone]
            )}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              {label}
            </div>
            <div className="text-[22px] font-bold text-slate-900 tabular mt-0.5 leading-tight">
              {value}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">{sub}</div>
      </CardBody>
    </Card>
  );
}

/* ─────────────────────────── DESAFOGAR DIALOG ─────────────────────────── */

function DesafogarDialog({
  corretorId,
  onClose,
}: {
  corretorId: string | null;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"confirm" | "feito">("confirm");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modo, setModo] = useState<"ia" | "manual">("ia");
  const [destinosManual, setDestinosManual] = useState<Set<string>>(new Set());

  const corretor = corretorId ? corretorById(corretorId) : null;
  const parados = corretorId
    ? leadsParadosPorCorretor[corretorId] ?? []
    : [];

  useEffect(() => {
    if (corretorId) {
      setStep("confirm");
      setSelected(new Set(parados.map((p) => p.lead_id)));
      setModo("ia");
      setDestinosManual(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corretorId]);

  if (!corretor) return null;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const destinos = corretores
    .filter((c) => c.id !== corretor.id && c.ativo)
    .map((c) => {
      const cargaEfetiva = c.leads_saudaveis / c.max_leads_ativos;
      return {
        corretor: c,
        cargaEfetiva,
        score:
          c.health_score - cargaEfetiva * 30 - (c.leads_parados / Math.max(c.leads_ativos, 1)) * 20,
      };
    })
    .sort((a, b) => b.score - a.score);

  const topDestinos = destinos.slice(0, 3);

  return (
    <Dialog
      open={!!corretorId}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-rose-600" />
          Desafogar {corretor.nome}
        </span>
      }
      size="lg"
    >
      {step === "confirm" ? (
        <div className="space-y-4">
          <div className="rounded-[12px] bg-rose-50 border border-rose-200 p-3.5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-rose-900">
                  Health {corretor.health_score}/100 • {corretor.leads_parados} leads parados
                </div>
                <div className="text-[12px] text-rose-800 mt-1 leading-relaxed">
                  Resposta em 24h caiu para{" "}
                  <strong>
                    {Math.round(corretor.taxa_resposta_24h * 100)}%
                  </strong>
                  . Acumular leads sem vazão reduz conversão de todo o time.
                  Vamos realocar para corretores com capacidade livre.
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Leads a realocar ({selected.size} selecionados)
            </div>
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
              {parados.map((p) => {
                const lead = leadById(p.lead_id);
                if (!lead) return null;
                const ativo = selected.has(p.lead_id);
                return (
                  <button
                    key={p.lead_id}
                    onClick={() => toggle(p.lead_id)}
                    className={cn(
                      "w-full text-left rounded-[10px] border p-2.5 transition-colors flex items-center gap-3",
                      ativo
                        ? "border-brand-400 bg-brand-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border-2 inline-flex items-center justify-center shrink-0",
                        ativo
                          ? "bg-brand-600 border-brand-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {ativo && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-900 truncate">
                          {lead.nome}
                        </span>
                        <Badge
                          tone={
                            p.risco === "alto"
                              ? "rose"
                              : p.risco === "medio"
                              ? "amber"
                              : "slate"
                          }
                          className="text-[9px] h-4 px-1.5"
                        >
                          Risco {p.risco}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.motivo_stall} • há {p.dias_sem_resposta}d
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold tabular text-slate-600 shrink-0">
                      {money(lead.valor_estimado)}
                    </span>
                  </button>
                );
              })}
              {parados.length === 0 && (
                <div className="text-center py-6 text-[12px] text-slate-400">
                  Nenhum lead parado identificado.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Destino dos leads
              </div>
              <div className="inline-flex rounded-[8px] border border-slate-200 bg-slate-50 p-0.5">
                <button
                  onClick={() => setModo("ia")}
                  className={cn(
                    "h-6 px-2.5 rounded-[6px] text-[11px] font-semibold inline-flex items-center gap-1 transition",
                    modo === "ia"
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Sparkles className="h-3 w-3" /> IA sugere
                </button>
                <button
                  onClick={() => setModo("manual")}
                  className={cn(
                    "h-6 px-2.5 rounded-[6px] text-[11px] font-semibold inline-flex items-center gap-1 transition",
                    modo === "manual"
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <UserCog className="h-3 w-3" /> Escolher manual
                </button>
              </div>
            </div>

            {modo === "ia" ? (
              <div className="space-y-1.5">
                {topDestinos.map((d, i) => (
                  <div
                    key={d.corretor.id}
                    className="rounded-[10px] border border-emerald-200 bg-emerald-50/50 p-2.5 flex items-center gap-3"
                  >
                    <div className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <Avatar name={d.corretor.nome} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-900 truncate">
                        {d.corretor.nome}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Health{" "}
                        <strong className="text-emerald-700">
                          {d.corretor.health_score}
                        </strong>{" "}
                        • Carga efetiva {Math.round(d.cargaEfetiva * 100)}% • Conv{" "}
                        {Math.round(d.corretor.taxa_conversao * 100)}%
                      </div>
                    </div>
                    <Badge tone="emerald" className="text-[10px] h-5">
                      ~{Math.ceil(selected.size / topDestinos.length)} leads
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span>
                    {destinosManual.size} corretor
                    {destinosManual.size === 1 ? "" : "es"} selecionado
                    {destinosManual.size === 1 ? "" : "s"}
                    {destinosManual.size > 0 && selected.size > 0 && (
                      <>
                        {" "}• ~
                        <strong className="text-slate-800">
                          {Math.ceil(selected.size / destinosManual.size)}
                        </strong>{" "}
                        leads cada
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setDestinosManual(
                          new Set(destinos.map((d) => d.corretor.id))
                        )
                      }
                      className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Todos
                    </button>
                    <span className="text-slate-300">/</span>
                    <button
                      onClick={() => setDestinosManual(new Set())}
                      className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="space-y-1 max-h-[200px] overflow-y-auto rounded-[10px] border border-slate-200 p-1.5">
                  {destinos.map((d) => {
                    const ativo = destinosManual.has(d.corretor.id);
                    const sugerido = topDestinos.some(
                      (t) => t.corretor.id === d.corretor.id
                    );
                    const healthTone =
                      d.corretor.health_score >= 75
                        ? "emerald"
                        : d.corretor.health_score >= 50
                        ? "amber"
                        : "rose";
                    return (
                      <button
                        key={d.corretor.id}
                        onClick={() => {
                          const next = new Set(destinosManual);
                          if (next.has(d.corretor.id)) next.delete(d.corretor.id);
                          else next.add(d.corretor.id);
                          setDestinosManual(next);
                        }}
                        className={cn(
                          "w-full text-left rounded-[8px] border p-2 transition-colors flex items-center gap-2.5",
                          ativo
                            ? "border-brand-400 bg-brand-50"
                            : "border-transparent bg-white hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded border-2 inline-flex items-center justify-center shrink-0",
                            ativo
                              ? "bg-brand-600 border-brand-600 text-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {ativo && <Check className="h-3 w-3" />}
                        </div>
                        <Avatar name={d.corretor.nome} size="xs" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-semibold text-slate-900 truncate">
                              {d.corretor.nome}
                            </span>
                            {sugerido && (
                              <Badge tone="emerald" className="text-[9px] h-4 px-1.5">
                                <Sparkles className="h-2.5 w-2.5" /> IA
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Carga {Math.round(d.cargaEfetiva * 100)}% • Conv{" "}
                            {Math.round(d.corretor.taxa_conversao * 100)}%
                          </div>
                        </div>
                        <Badge tone={healthTone} className="text-[10px] h-5 shrink-0">
                          Health {d.corretor.health_score}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="rounded-[10px] bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 leading-relaxed">
            <strong className="text-slate-900">Regras automáticas:</strong> o
            corretor original tem fluxo de novos leads reduzido por 48h ou até
            health ≥ 70. Comissão histórica preservada. Cliente é notificado da
            troca.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={
                selected.size === 0 ||
                (modo === "manual" && destinosManual.size === 0)
              }
              leftIcon={<LifeBuoy className="h-4 w-4" />}
              onClick={() => setStep("feito")}
            >
              Realocar {selected.size} {selected.size === 1 ? "lead" : "leads"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 inline-flex items-center justify-center mb-4">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {selected.size} leads realocados
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
            Distribuídos entre{" "}
            {modo === "manual" ? destinosManual.size : topDestinos.length}{" "}
            corretores
            {modo === "manual" ? " escolhidos manualmente" : " com capacidade"}.
            Fluxo do {corretor.nome.split(" ")[0]} reduzido por 48h até
            recuperar health.
          </p>
          <Button className="mt-5" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
    </Dialog>
  );
}
