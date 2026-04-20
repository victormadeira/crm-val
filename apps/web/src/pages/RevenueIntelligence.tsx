import { useEffect, useMemo, useState } from "react";
import {
  CloudRain,
  DollarSign,
  History,
  Lightbulb,
  Sun,
  CalendarDays,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { money } from "@/lib/format";

type Tab = "clima" | "insights" | "pricing" | "historico" | "calendario";

const TABS: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: "clima", label: "Clima", icon: Sun },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "historico", label: "Histórico", icon: History },
  { id: "calendario", label: "Calendário", icon: CalendarDays },
];

export function RevenueIntelligence() {
  const [tab, setTab] = useState<Tab>("clima");

  return (
    <>
      <PageHeader
        title="Inteligência de Receita"
        subtitle="Clima × pipeline × histórico · previsão dinâmica de receita"
      />
      <PageContent className="space-y-4">
        <div className="flex items-center gap-1 border-b border-slate-200">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium -mb-[1px] border-b-2 transition-colors",
                  active
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-slate-500 hover:text-slate-800",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "clima" && <ClimaTab />}
        {tab === "insights" && <InsightsTab />}
        {tab === "pricing" && <PricingTab />}
        {tab === "historico" && <HistoricoTab />}
        {tab === "calendario" && <CalendarioTab />}
      </PageContent>
    </>
  );
}

/* ─── Tab: Clima ─── */

interface ForecastDay {
  date: string;
  weatherScore: number;
  weatherCategory: string;
  dayType: string;
  expectedRevenueCents: number;
  method: string;
  confidence: number;
}

interface RawWeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipProbability: number;
  precipSum: number;
  windspeedMax: number;
  uvIndexMax: number;
  weathercode: number;
  score: number;
  category: string;
}

interface RawWeatherResponse {
  days: RawWeatherDay[];
  cached: boolean;
  fetchedAt: string;
}

function ClimaTab() {
  const [data, setData] = useState<RawWeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<RawWeatherResponse>("/weather/forecast?days=14")
      .then((d) => setData(d ?? null))
      .catch((err) => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) {
    return (
      <Card>
        <CardBody className="text-[13px] text-rose-700 bg-rose-50 space-y-1">
          <div className="font-bold">falha ao carregar previsão</div>
          <div className="font-mono text-[11px]">{error}</div>
          <div className="text-[11px] text-rose-600 pt-2">
            Checklist:
            <ul className="list-disc pl-4">
              <li>Migration <code>20260421150000_revenue_intelligence</code> aplicada?</li>
              <li>API conseguiu alcançar <code>api.open-meteo.com</code>?</li>
              <li>Env <code>PARK_LATITUDE/LONGITUDE</code> definido?</li>
            </ul>
          </div>
        </CardBody>
      </Card>
    );
  }
  if (!data?.days?.length) return <Empty label="sem previsão disponível" />;

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-slate-500">
        {data.cached ? "cache" : "fresh"} · atualizado{" "}
        {new Date(data.fetchedAt).toLocaleString("pt-BR")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.days.map((d) => (
          <Card key={d.date}>
            <CardBody className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-bold text-slate-900">
                  {formatDate(d.date)}
                </div>
                <CategoryBadge c={d.category} />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-[28px] font-bold tabular text-slate-900 leading-none">
                  {d.score}
                </div>
                <div className="text-[11px] text-slate-500">/100</div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                <div>🌡 {d.tempMax.toFixed(0)}° / {d.tempMin.toFixed(0)}°</div>
                <div>💧 {d.precipProbability}%</div>
                <div>💨 {d.windspeedMax.toFixed(0)} km/h</div>
                <div>☀ UV {d.uvIndexMax.toFixed(0)}</div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Tab: Insights ─── */

interface Insight {
  id: string;
  generatedAt: string;
  insightType: string;
  priority: string;
  title: string;
  description: string;
  targetDate: string | null;
  impactEstimateCents: number | null;
  actionSuggested: string | null;
  whatsappMessage: string | null;
  actionTaken: string;
}

function InsightsTab() {
  const [items, setItems] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Insight[]>(
        "/revenue-intelligence/insights?limit=30"
      );
      setItems(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setGenerating(true);
    try {
      await api.post("/revenue-intelligence/insights/generate", {});
      await load();
    } finally {
      setGenerating(false);
    }
  }

  async function sendFeedback(id: string, action: "ACEITOU" | "IGNOROU") {
    await api.post(`/revenue-intelligence/insights/${id}/feedback`, {
      actionTaken: action,
    });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-slate-500">
          {items.length} insight{items.length === 1 ? "" : "s"}
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="h-9 px-4 bg-brand-500 text-white rounded-[8px] text-[13px] font-medium disabled:opacity-50"
        >
          {generating ? "gerando..." : "Gerar agora"}
        </button>
      </div>
      {loading && <Loading />}
      {!loading && !items.length && <Empty label="sem insights ainda" />}
      {items.map((i) => (
        <Card key={i.id}>
          <CardBody className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone={priorityTone(i.priority)} className="text-[10px]">
                    {i.priority}
                  </Badge>
                  <Badge tone="slate" className="text-[10px]">
                    {i.insightType}
                  </Badge>
                  {i.targetDate && (
                    <span className="text-[11px] text-slate-500">
                      → {formatDate(i.targetDate)}
                    </span>
                  )}
                </div>
                <div className="text-[14px] font-bold text-slate-900">
                  {i.title}
                </div>
                <div className="text-[12px] text-slate-600 mt-1">
                  {i.description}
                </div>
                {i.actionSuggested && (
                  <div className="text-[12px] text-slate-700 mt-2 border-l-2 border-brand-400 pl-3">
                    <span className="font-semibold">Ação:</span>{" "}
                    {i.actionSuggested}
                  </div>
                )}
                {i.whatsappMessage && (
                  <div className="text-[12px] text-emerald-700 mt-1 bg-emerald-50 rounded-[6px] px-3 py-2">
                    💬 {i.whatsappMessage}
                  </div>
                )}
                {i.impactEstimateCents != null && (
                  <div className="text-[12px] text-slate-500 mt-1">
                    impacto estimado:{" "}
                    <span className="font-bold">
                      {money(i.impactEstimateCents / 100)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {i.actionTaken === "PENDENTE" ? (
                  <>
                    <button
                      onClick={() => sendFeedback(i.id, "ACEITOU")}
                      className="h-8 px-3 text-[11px] bg-emerald-500 text-white rounded-[6px] font-medium"
                    >
                      aceitei
                    </button>
                    <button
                      onClick={() => sendFeedback(i.id, "IGNOROU")}
                      className="h-8 px-3 text-[11px] bg-slate-200 text-slate-700 rounded-[6px] font-medium"
                    >
                      ignorar
                    </button>
                  </>
                ) : (
                  <Badge
                    tone={i.actionTaken === "ACEITOU" ? "emerald" : "slate"}
                    className="text-[10px]"
                  >
                    {i.actionTaken}
                  </Badge>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

/* ─── Tab: Pricing ─── */

interface PriceRow {
  product: string;
  date: string;
  basePriceCents: number;
  recommendedCents: number;
  multWeather: number;
  multDayType: number;
  category: string | null;
  dayType: string;
  floorApplied: boolean;
  ceilingApplied: boolean;
}

function PricingTab() {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<PriceRow[]>(`/revenue-intelligence/pricing/grid/${date}`)
      .then((d) => setRows(d ?? []))
      .finally(() => setLoading(false));
  }, [date]);

  async function seedDefaults() {
    await api.post("/revenue-intelligence/pricing/seed-defaults", {});
    const d = await api.get<PriceRow[]>(
      `/revenue-intelligence/pricing/grid/${date}`
    );
    setRows(d ?? []);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 px-3 rounded-[8px] border border-slate-200 text-[13px]"
        />
        <button
          onClick={seedDefaults}
          className="h-9 px-4 text-[13px] border border-slate-200 rounded-[8px] text-slate-700"
        >
          seed defaults
        </button>
      </div>
      {loading ? (
        <Loading />
      ) : !rows.length ? (
        <Empty label="configure preços primeiro (seed defaults)" />
      ) : (
        <Card>
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="text-left text-[11px] text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Base</th>
                  <th className="px-4 py-3">Clima</th>
                  <th className="px-4 py-3">Dia</th>
                  <th className="px-4 py-3 text-right">Recomendado</th>
                  <th className="px-4 py-3 text-right">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const delta =
                    ((r.recommendedCents - r.basePriceCents) /
                      r.basePriceCents) *
                    100;
                  return (
                    <tr key={r.product}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {r.product.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 tabular text-slate-600">
                        {money(r.basePriceCents / 100)}
                      </td>
                      <td className="px-4 py-3">
                        {r.category ? (
                          <CategoryBadge c={r.category} />
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">
                        {r.dayType}
                      </td>
                      <td className="px-4 py-3 text-right tabular font-bold text-slate-900">
                        {money(r.recommendedCents / 100)}
                        {r.floorApplied && (
                          <Badge
                            tone="amber"
                            className="ml-2 text-[9px]"
                          >
                            FLOOR
                          </Badge>
                        )}
                        {r.ceilingApplied && (
                          <Badge
                            tone="violet"
                            className="ml-2 text-[9px]"
                          >
                            CEILING
                          </Badge>
                        )}
                      </td>
                      <td
                        className={[
                          "px-4 py-3 text-right tabular font-bold",
                          delta > 0
                            ? "text-emerald-600"
                            : delta < 0
                              ? "text-rose-600"
                              : "text-slate-500",
                        ].join(" ")}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/* ─── Tab: Histórico ─── */

interface Actual {
  id: string;
  date: string;
  grossRevenueCents: number;
  visitorCount: number | null;
  weatherScoreActual: number | null;
  dayType: string;
  hadRain: boolean;
}

function HistoricoTab() {
  const [items, setItems] = useState<Actual[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvOpen, setCsvOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Actual[]>(
        "/revenue-intelligence/actuals?limit=90"
      );
      setItems(data ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const total = items.reduce((s, i) => s + i.grossRevenueCents, 0);
  const totalVisitors = items.reduce((s, i) => s + (i.visitorCount ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MiniStat label="Receita acumulada" value={money(total / 100)} />
        <MiniStat
          label="Visitantes (acumulado)"
          value={totalVisitors.toLocaleString("pt-BR")}
        />
        <MiniStat label="Registros" value={items.length.toString()} />
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setCsvOpen((v) => !v)}
          className="h-9 px-4 text-[13px] border border-slate-200 rounded-[8px] text-slate-700"
        >
          {csvOpen ? "fechar" : "importar CSV"}
        </button>
      </div>
      {csvOpen && <CsvImporter onDone={() => { setCsvOpen(false); load(); }} />}
      {loading ? (
        <Loading />
      ) : !items.length ? (
        <Empty label="sem registros históricos" />
      ) : (
        <Card>
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="text-left text-[11px] text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Dia</th>
                  <th className="px-4 py-3 text-right">Receita</th>
                  <th className="px-4 py-3 text-right">Visitantes</th>
                  <th className="px-4 py-3 text-right">Score clima</th>
                  <th className="px-4 py-3">Chuva</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 font-semibold">
                      {formatDate(a.date)}
                    </td>
                    <td className="px-4 py-2 text-slate-600 text-[11px]">
                      {a.dayType}
                    </td>
                    <td className="px-4 py-2 text-right tabular font-bold">
                      {money(a.grossRevenueCents / 100)}
                    </td>
                    <td className="px-4 py-2 text-right tabular">
                      {a.visitorCount ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-right tabular">
                      {a.weatherScoreActual ?? "-"}
                    </td>
                    <td className="px-4 py-2">
                      {a.hadRain ? (
                        <Badge tone="rose" className="text-[10px]">
                          SIM
                        </Badge>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function CsvImporter({ onDone }: { onDone: () => void }) {
  const [csv, setCsv] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [result, setResult] = useState<{
    parsed: number;
    inserted: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const r = await api.post<typeof result>(
        "/revenue-intelligence/actuals/import-csv",
        { csv, dryRun, overwrite }
      );
      setResult(r);
      if (!dryRun) onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Importar CSV histórico" />
      <CardBody className="space-y-3">
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="date,grossRevenueCents,visitorCount,...,dayType&#10;2026-01-15,150000,320,...,DIA_UTIL"
          className="w-full h-40 px-3 py-2 rounded-[8px] border border-slate-200 font-mono text-[11px]"
        />
        <div className="flex items-center gap-4 text-[12px]">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            dry run (só validar)
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              disabled={dryRun}
            />
            sobrescrever existentes
          </label>
          <button
            onClick={submit}
            disabled={busy || !csv}
            className="ml-auto h-9 px-4 bg-brand-500 text-white rounded-[8px] font-medium disabled:opacity-50"
          >
            {busy ? "enviando..." : "enviar"}
          </button>
        </div>
        {result && (
          <div className="text-[12px] bg-slate-50 rounded-[6px] p-3 space-y-1">
            <div>
              parsed: <b>{result.parsed}</b> · inseridos: <b>{result.inserted}</b>{" "}
              · atualizados: <b>{result.updated}</b> · skip:{" "}
              <b>{result.skipped}</b>
            </div>
            {result.errors.length > 0 && (
              <div className="text-rose-600">
                {result.errors.length} erro(s):{" "}
                {result.errors
                  .slice(0, 5)
                  .map((e) => `linha ${e.row}: ${e.message}`)
                  .join(" · ")}
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* ─── Tab: Calendário ─── */

function CalendarioTab() {
  const [days, setDays] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<ForecastDay[]>("/revenue-intelligence/forecast?days=14")
      .then((d) => setDays(d ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalExpected = useMemo(
    () => days.reduce((s, d) => s + d.expectedRevenueCents, 0),
    [days]
  );

  if (loading) return <Loading />;
  if (!days.length) return <Empty label="sem previsão" />;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MiniStat
          label="Receita prevista (14d)"
          value={money(totalExpected / 100)}
        />
        <MiniStat
          label="Média diária"
          value={money(totalExpected / 100 / days.length)}
        />
      </div>
      <Card>
        <CardBody className="p-0">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Dia</th>
                <th className="px-4 py-3">Clima</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Esperado</th>
                <th className="px-4 py-3">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {days.map((d) => (
                <tr key={d.date}>
                  <td className="px-4 py-2 font-semibold">
                    {formatDate(d.date)}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-600">
                    {d.dayType}
                  </td>
                  <td className="px-4 py-2">
                    <CategoryBadge c={d.weatherCategory} />
                  </td>
                  <td className="px-4 py-2 text-right tabular">
                    {d.weatherScore}
                  </td>
                  <td className="px-4 py-2 text-right tabular font-bold">
                    {money(d.expectedRevenueCents / 100)}
                  </td>
                  <td className="px-4 py-2 text-[10px] text-slate-500">
                    {d.method} · {d.confidence}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

/* ─── Helpers ─── */

function CategoryBadge({ c }: { c: string }) {
  const tone: Record<string, "emerald" | "sky" | "amber" | "rose" | "slate"> = {
    EXCELENTE: "emerald",
    BOM: "sky",
    REGULAR: "amber",
    RUIM: "rose",
    PESSIMO: "slate",
  };
  const icon = c === "RUIM" || c === "PESSIMO" ? "🌧" : "☀";
  return (
    <Badge tone={tone[c] ?? "slate"} className="text-[10px]">
      {icon} {c}
    </Badge>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <div className="text-[11px] uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-[20px] font-bold text-slate-900 tabular">
          {value}
        </div>
      </CardBody>
    </Card>
  );
}

function Loading() {
  return <div className="text-[13px] text-slate-500">carregando...</div>;
}

function Empty({ label }: { label: string }) {
  return (
    <Card>
      <CardBody className="text-center py-8 text-[13px] text-slate-500">
        {label}
      </CardBody>
    </Card>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function priorityTone(p: string): "rose" | "amber" | "slate" {
  if (p === "ALTA") return "rose";
  if (p === "MEDIA") return "amber";
  return "slate";
}
