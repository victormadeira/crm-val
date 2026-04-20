import { useState } from "react";
import {
  Award,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  Gift,
  Minus,
  Plus,
  Settings2,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { money, pct } from "@/lib/format";
import {
  comissoesPorCorretor,
  corretorById,
  historicoMetas,
  metasTime,
  regrasComissao,
} from "@/lib/mock";

export function Metas() {
  const [aba, setAba] = useState<"individuais" | "time" | "regras">(
    "individuais"
  );
  const [ordenacao, setOrdenacao] = useState<"receita" | "atingimento">(
    "atingimento"
  );
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [regrasOpen, setRegrasOpen] = useState(false);
  const [fechamentoOpen, setFechamentoOpen] = useState(false);
  const [aprovadas, setAprovadas] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const exportarFolha = () => {
    const linhas = [
      "Corretor,Vendas,Meta,Atingimento,Comissão base,Bônus,Total",
      ...comissoesPorCorretor.map((c) => {
        const nome = corretorById(c.corretor_id)?.nome ?? c.corretor_id;
        return [
          nome,
          c.vendas,
          c.meta,
          Math.round(c.atingimento * 100) + "%",
          c.comissao_base,
          c.bonus_meta,
          c.total,
        ].join(",");
      }),
    ];
    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `folha-comissoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Folha de comissões exportada");
  };

  const fecharMes = () => {
    setFechamentoOpen(false);
    showToast("Mês fechado. Folha bloqueada para edição.");
  };

  const aprovarPagamento = (corretorId: string) => {
    setAprovadas((prev) => ({ ...prev, [corretorId]: true }));
    const nome = corretorById(corretorId)?.nome ?? corretorId;
    showToast(`Pagamento de ${nome} aprovado`);
  };

  const verContracheque = (corretorId: string) => {
    const cm = comissoesPorCorretor.find((x) => x.corretor_id === corretorId);
    if (!cm) return;
    const nome = corretorById(corretorId)?.nome ?? corretorId;
    const linhas = [
      `Contracheque — ${nome}`,
      `Período: abril/26`,
      "",
      `Receita gerada: ${money(cm.vendas)}`,
      `Atingimento: ${pct(cm.atingimento)}`,
      `Comissão base: ${money(cm.comissao_base)}`,
      `Bônus meta: ${money(cm.bonus_meta)}`,
      `Total a pagar: ${money(cm.total)}`,
    ];
    const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contracheque-${corretorId}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`Contracheque de ${nome} baixado`);
  };

  const novaRegra = () => {
    setRegrasOpen(false);
    showToast("Builder de nova regra em breve (mock CRM)");
  };

  const pctAtingido = metasTime.realizado / metasTime.meta_total;
  const diaRatio = metasTime.dia_atual / metasTime.dias_mes;
  const emDia = pctAtingido >= diaRatio * 0.9;

  const comissoesTotal = comissoesPorCorretor.reduce((s, c) => s + c.total, 0);
  const bonusTotal = comissoesPorCorretor.reduce(
    (s, c) => s + c.bonus_meta,
    0
  );

  const ordenados = [...comissoesPorCorretor].sort((a, b) =>
    ordenacao === "receita"
      ? b.vendas - a.vendas
      : b.atingimento - a.atingimento
  );

  const detalheCorretor = detalheId
    ? comissoesPorCorretor.find((c) => c.corretor_id === detalheId)
    : null;

  return (
    <>
      <PageHeader
        title="Metas & Comissões"
        subtitle={`${money(metasTime.realizado)} de ${money(metasTime.meta_total)} • dia ${metasTime.dia_atual}/${metasTime.dias_mes}`}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<Settings2 className="h-4 w-4" />}
              onClick={() => setRegrasOpen(true)}
            >
              Configurar regras
            </Button>
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={exportarFolha}
            >
              Exportar folha
            </Button>
            <Button
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => setFechamentoOpen(true)}
            >
              Fechar mês
            </Button>
          </>
        }
      />

      <PageContent className="space-y-6">
        {/* Hero meta do time */}
        <Card
          className={cn(
            "border-2 overflow-hidden",
            emDia ? "border-emerald-300" : "border-rose-300"
          )}
        >
          <div
            className={cn(
              "p-5 bg-gradient-to-br text-white",
              emDia
                ? "from-emerald-500 via-emerald-600 to-teal-600"
                : "from-rose-500 via-rose-600 to-orange-500"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider opacity-90 font-semibold flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  Meta do time • Abril/26
                </div>
                <div className="text-[30px] font-bold leading-tight mt-1">
                  {money(metasTime.realizado)}
                  <span className="text-[16px] opacity-80 ml-2">
                    / {money(metasTime.meta_total)}
                  </span>
                </div>
                <div className="text-[13px] opacity-90 mt-0.5">
                  Previsão fim do mês: {money(metasTime.previsto)} (
                  {pct(metasTime.previsto / metasTime.meta_total)})
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider opacity-90 font-semibold">
                  Atingido
                </div>
                <div className="text-[44px] font-bold tabular leading-none">
                  {Math.round(pctAtingido * 100)}%
                </div>
                <Badge
                  tone="slate"
                  className="mt-1 bg-white/20 text-white ring-white/30"
                >
                  {emDia ? "No pace" : "Precisa acelerar"}
                </Badge>
              </div>
            </div>

            {/* Barra de progresso dupla */}
            <div className="mt-4">
              <div className="h-3 bg-white/20 rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 bg-white"
                  style={{
                    width: `${Math.min(pctAtingido * 100, 100)}%`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/70"
                  style={{ left: `${diaRatio * 100}%` }}
                  title="Onde deveríamos estar"
                />
              </div>
              <div className="flex justify-between text-[10px] mt-1 opacity-80">
                <span>0%</span>
                <span>
                  ideal hoje: {Math.round(diaRatio * 100)}%
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <CardBody className="p-4 grid grid-cols-3 gap-4">
            <MiniStat
              label="Dias restantes"
              value={String(metasTime.dias_mes - metasTime.dia_atual)}
              sub={`de ${metasTime.dias_mes} dias`}
            />
            <MiniStat
              label="Ritmo necessário"
              value={money(
                Math.max(
                  (metasTime.meta_total - metasTime.realizado) /
                    (metasTime.dias_mes - metasTime.dia_atual),
                  0
                )
              )}
              sub="por dia até o fim"
            />
            <MiniStat
              label="Comissão projetada"
              value={money(comissoesTotal + bonusTotal)}
              sub={`${money(bonusTotal)} em bônus meta`}
            />
          </CardBody>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: "individuais", label: "Metas individuais" },
            { id: "time", label: "Histórico do time" },
            { id: "regras", label: "Regras de comissão" },
          ]}
          value={aba}
          onChange={(v) => setAba(v as any)}
        />

        {aba === "individuais" && (
          <Card>
            <CardHeader
              title="Atingimento por corretor"
              subtitle={`${comissoesPorCorretor.length} corretores • abril/26`}
              action={
                <Tabs
                  tabs={[
                    { id: "atingimento", label: "Atingimento" },
                    { id: "receita", label: "Receita" },
                  ]}
                  value={ordenacao}
                  onChange={(v) => setOrdenacao(v as any)}
                />
              }
            />
            <CardBody className="pt-0 space-y-2">
              {ordenados.map((cm) => {
                const c = corretorById(cm.corretor_id);
                if (!c) return null;
                const atingPct = Math.round(cm.atingimento * 100);
                const tone =
                  cm.atingimento >= 1
                    ? "emerald"
                    : cm.atingimento >= 0.85
                    ? "amber"
                    : "rose";
                return (
                  <button
                    key={cm.corretor_id}
                    onClick={() => setDetalheId(cm.corretor_id)}
                    className="w-full text-left p-3 rounded-[12px] border border-slate-200 hover:border-brand-300 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={c.nome} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-[14px]">
                            {c.nome}
                          </span>
                          <Badge tone={tone} className="text-[10px]">
                            {atingPct}% da meta
                          </Badge>
                          {cm.bonus_meta > 0 && (
                            <Badge tone="violet" className="text-[10px]">
                              <Gift className="h-2.5 w-2.5 mr-0.5" />
                              Bônus {money(cm.bonus_meta)}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              cm.atingimento >= 1
                                ? "bg-emerald-500"
                                : cm.atingimento >= 0.85
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            )}
                            style={{
                              width: `${Math.min(cm.atingimento * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                          <span className="tabular">
                            {money(cm.vendas)} / {money(cm.meta)}
                          </span>
                          <span className="tabular font-semibold text-slate-700">
                            Comissão: {money(cm.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardBody>
          </Card>
        )}

        {aba === "time" && (
          <Card>
            <CardHeader
              title="Evolução meta × realizado"
              subtitle="Últimos 6 meses"
            />
            <CardBody className="pt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicoMetas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                      formatter={(v: any) => money(v as number)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="meta"
                      fill="#cbd5e1"
                      name="Meta"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="realizado"
                      name="Realizado"
                      radius={[6, 6, 0, 0]}
                    >
                      {historicoMetas.map((h, i) => (
                        <Cell
                          key={i}
                          fill={
                            h.realizado >= h.meta ? "#10b981" : "#f43f5e"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <MiniStat
                  label="Meses batidos"
                  value={`${historicoMetas.filter((h) => h.realizado >= h.meta).length}/${historicoMetas.length}`}
                  sub="últimos 6 meses"
                />
                <MiniStat
                  label="Média realizado"
                  value={pct(
                    historicoMetas.reduce(
                      (s, h) => s + h.realizado / h.meta,
                      0
                    ) / historicoMetas.length
                  )}
                  sub="da meta"
                />
                <MiniStat
                  label="Melhor mês"
                  value={
                    historicoMetas.reduce((b, h) =>
                      h.realizado / h.meta > b.realizado / b.meta ? h : b
                    ).mes
                  }
                  sub="+12% acima"
                />
              </div>
            </CardBody>
          </Card>
        )}

        {aba === "regras" && <RegrasCard onConfig={() => setRegrasOpen(true)} />}
      </PageContent>

      {detalheCorretor && (
        <DetalheComissao
          cm={detalheCorretor}
          onClose={() => setDetalheId(null)}
          aprovado={!!aprovadas[detalheCorretor.corretor_id]}
          onAprovar={() => aprovarPagamento(detalheCorretor.corretor_id)}
          onContracheque={() => verContracheque(detalheCorretor.corretor_id)}
        />
      )}

      <Dialog
        open={regrasOpen}
        onClose={() => setRegrasOpen(false)}
        title="Regras de comissão"
        subtitle="Percentuais e bônus por tipo de venda"
        size="lg"
      >
        <div className="p-5 space-y-3">
          {regrasComissao.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-3 rounded-[12px] border border-slate-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{r.nome}</span>
                  <Badge tone={r.ativa ? "emerald" : "slate"}>
                    {r.ativa ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Bônus meta: {money(r.bonus_meta)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[22px] font-bold text-slate-900 tabular">
                  {pct(r.comissao_pct)}
                </div>
                <div className="text-[10px] text-slate-500 uppercase">
                  sobre venda
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            className="w-full"
            onClick={novaRegra}
          >
            Nova regra
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={fechamentoOpen}
        onClose={() => setFechamentoOpen(false)}
        title="Fechar mês de abril/26"
        subtitle="Bloqueia a folha de comissões contra novas alterações"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setFechamentoOpen(false)}>
              Cancelar
            </Button>
            <Button
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={fecharMes}
            >
              Confirmar fechamento
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-[13px] text-slate-700">
          <p>
            Ao confirmar, as comissões serão consolidadas em{" "}
            <strong>{money(comissoesTotal + bonusTotal)}</strong> e a folha deste
            mês ficará bloqueada para edição.
          </p>
          <p className="text-[12px] text-slate-500">
            Esta ação pode ser revertida por um administrador.
          </p>
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

function MiniStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="p-3 rounded-[12px] bg-slate-50 border border-slate-200">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </div>
      <div className="text-[18px] font-bold text-slate-900 tabular mt-0.5">
        {value}
      </div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}

function DetalheComissao({
  cm,
  onClose,
  aprovado,
  onAprovar,
  onContracheque,
}: {
  cm: (typeof comissoesPorCorretor)[number];
  onClose: () => void;
  aprovado: boolean;
  onAprovar: () => void;
  onContracheque: () => void;
}) {
  const c = corretorById(cm.corretor_id);
  if (!c) return null;
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Comissão • ${c.nome}`}
      subtitle={`${cm.num_fechamentos} fechamentos em abril/26`}
      size="lg"
    >
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-[12px] bg-gradient-to-br from-brand-50 to-white border border-brand-200">
            <div className="text-[11px] text-brand-700 uppercase font-semibold">
              Receita gerada
            </div>
            <div className="text-[26px] font-bold text-slate-900 tabular">
              {money(cm.vendas)}
            </div>
            <div className="text-[11px] text-slate-500">
              de {money(cm.meta)} ({pct(cm.atingimento)})
            </div>
          </div>
          <div className="p-4 rounded-[12px] bg-gradient-to-br from-emerald-50 to-white border border-emerald-200">
            <div className="text-[11px] text-emerald-700 uppercase font-semibold">
              Comissão a pagar
            </div>
            <div className="text-[26px] font-bold text-slate-900 tabular">
              {money(cm.total)}
            </div>
            <div className="text-[11px] text-slate-500">
              {money(cm.comissao_base)} base + {money(cm.bonus_meta)} bônus
            </div>
          </div>
        </div>

        <div>
          <div className="text-[12px] font-semibold text-slate-900 mb-2">
            Decomposição por tipo
          </div>
          <div className="space-y-2">
            <LinhaDecomp
              label="Anual (família + individual)"
              valor={cm.vendas_anual}
              pct="7%"
              cor="brand"
            />
            <LinhaDecomp
              label="VIP"
              valor={cm.vendas_vip}
              pct="10%"
              cor="violet"
            />
            <LinhaDecomp
              label="Diário"
              valor={cm.vendas_diario}
              pct="3%"
              cor="amber"
            />
          </div>
        </div>

        <div className="p-3 rounded-[10px] bg-amber-50 border border-amber-200 text-[12px] text-amber-900 flex items-start gap-2">
          <Award className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            {cm.atingimento >= 1 ? (
              <>
                <strong>Bônus de meta ativado:</strong> {money(cm.bonus_meta)}{" "}
                por bater 100% da meta mensal.
              </>
            ) : cm.atingimento >= 0.9 ? (
              <>
                <strong>A {money(cm.meta - cm.vendas)} do bônus.</strong>{" "}
                Atingir 100% libera +{money(1500)}.
              </>
            ) : (
              <>
                Abaixo de 90% da meta. Bônus liberado a partir de 90%
                (atualmente{" "}
                <strong className="tabular">
                  {Math.round(cm.atingimento * 100)}%
                </strong>
                ).
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            leftIcon={<FileText className="h-4 w-4" />}
            onClick={onContracheque}
          >
            Ver contracheque
          </Button>
          {aprovado ? (
            <Badge tone="emerald" className="h-9 px-3">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Pagamento aprovado
            </Badge>
          ) : (
            <Button
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => {
                onAprovar();
                onClose();
              }}
            >
              Aprovar pagamento
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

function LinhaDecomp({
  label,
  valor,
  pct: pctLabel,
  cor,
}: {
  label: string;
  valor: number;
  pct: string;
  cor: "brand" | "violet" | "amber";
}) {
  const bg = {
    brand: "bg-brand-100",
    violet: "bg-violet-100",
    amber: "bg-amber-100",
  }[cor];
  return (
    <div className="flex items-center gap-3 p-2 rounded-[10px] bg-slate-50">
      <div className={cn("h-8 w-8 rounded-[9px] inline-flex items-center justify-center", bg)}>
        <DollarSign className="h-4 w-4 text-slate-700" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-slate-800">{label}</div>
        <div className="text-[11px] text-slate-500">Comissão {pctLabel}</div>
      </div>
      <div className="font-semibold text-slate-900 tabular">{money(valor)}</div>
    </div>
  );
}

function RegrasCard({ onConfig }: { onConfig: () => void }) {
  return (
    <Card>
      <CardHeader
        title="Regras de comissão"
        subtitle={`${regrasComissao.length} regras configuradas`}
        action={
          <Button variant="outline" size="sm" onClick={onConfig}>
            <Settings2 className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
        }
      />
      <CardBody className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {regrasComissao.map((r) => (
            <div
              key={r.id}
              className="p-3 rounded-[12px] border border-slate-200 hover:border-brand-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-[13px]">
                    {r.nome}
                  </div>
                  <Badge tone={r.ativa ? "emerald" : "slate"} className="mt-1">
                    {r.ativa ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <div className="text-[22px] font-bold text-brand-700 tabular">
                  {pct(r.comissao_pct)}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <Gift className="h-3 w-3" />
                Bônus meta: {money(r.bonus_meta)}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
