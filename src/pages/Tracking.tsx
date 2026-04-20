import { useMemo, useState } from "react";
import {
  Activity,
  Chrome,
  Eye,
  Globe,
  Link2,
  Monitor,
  MousePointerClick,
  PlayCircle,
  Smartphone,
  Tablet,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  FunnelChart,
  Legend,
  Pie,
  PieChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { number, pct } from "@/lib/format";
import { eventosTracking, sessoesSite } from "@/lib/mock";

const deviceIcon = { mobile: Smartphone, desktop: Monitor, tablet: Tablet } as const;
const COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#06b6d4"];

const tipoTone: Record<string, string> = {
  pageview: "slate",
  form_start: "sky",
  form_submit: "amber",
  cta_click: "violet",
  scroll_deep: "slate",
  video_play: "brand",
  add_to_cart: "amber",
  purchase: "emerald",
  lead_generated: "emerald",
};

export function Tracking() {
  const [periodo, setPeriodo] = useState<"24h" | "7d" | "30d">("7d");

  const utmAgg = useMemo(() => {
    const map = new Map<string, { campanha: string; leads: number; sessoes: number; conv: number }>();
    eventosTracking.forEach((e) => {
      const key = e.utm_campaign ?? "direto";
      const cur = map.get(key) ?? { campanha: key, leads: 0, sessoes: 0, conv: 0 };
      if (e.tipo === "lead_generated") cur.leads += 1;
      cur.sessoes += 1;
      map.set(key, cur);
    });
    return Array.from(map.values());
  }, []);

  const funilData = useMemo(() => {
    const pageviews = eventosTracking.filter((e) => e.tipo === "pageview").length + 840;
    const ctaClicks = eventosTracking.filter((e) => e.tipo === "cta_click").length + 180;
    const formStart = eventosTracking.filter((e) => e.tipo === "form_start").length + 92;
    const formSubmit = eventosTracking.filter((e) => e.tipo === "form_submit").length + 58;
    const leads = eventosTracking.filter((e) => e.tipo === "lead_generated").length + 47;
    return [
      { nome: "Visitas", value: pageviews, fill: "#0ea5e9" },
      { nome: "CTA clicado", value: ctaClicks, fill: "#06b6d4" },
      { nome: "Form iniciado", value: formStart, fill: "#8b5cf6" },
      { nome: "Form enviado", value: formSubmit, fill: "#f59e0b" },
      { nome: "Lead gerado", value: leads, fill: "#10b981" },
    ];
  }, []);

  const deviceData = useMemo(() => {
    const counts: Record<string, number> = {};
    sessoesSite.forEach((s) => (counts[s.device] = (counts[s.device] ?? 0) + 1));
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const timelineData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      hora: `${String(i).padStart(2, "0")}h`,
      sessoes: Math.round(20 + Math.sin(i / 3) * 15 + Math.random() * 10),
      conversoes: Math.round(2 + Math.sin(i / 3) * 2 + Math.random() * 2),
    }));
  }, []);

  const totalSessoes = sessoesSite.length + 1240;
  const totalConv = sessoesSite.filter((s) => s.converteu).length + 92;
  const conversao = totalConv / totalSessoes;
  const duracaoMedia = sessoesSite.reduce((s, x) => s + x.duracao_s, 0) / sessoesSite.length;

  return (
    <>
      <PageHeader
        title="Tracking & Pixel"
        subtitle="UTMs, eventos do site e atribuição multi-toque por canal"
        actions={
          <>
            <div className="flex gap-1">
              {(["24h", "7d", "30d"] as const).map((p) => (
                <Button key={p} size="sm" variant={periodo === p ? "primary" : "outline"} onClick={() => setPeriodo(p)}>
                  {p}
                </Button>
              ))}
            </div>
            <Badge tone="emerald" dot>Pixel ativo</Badge>
          </>
        }
      />
      <PageContent>
        <div className="grid grid-cols-5 gap-3 mb-5">
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Sessões</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{number(totalSessoes)}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><TrendingUp className="h-3 w-3" /> +12%</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Conversões</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{totalConv}</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><Target className="h-3 w-3" /> {pct(conversao)}</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Duração média</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{Math.round(duracaoMedia / 60)}min {Math.round(duracaoMedia % 60)}s</div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1"><Activity className="h-3 w-3" /> engajamento</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">CTR médio</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">4.8%</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1"><MousePointerClick className="h-3 w-3" /> ctr bom</div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <div className="text-[11px] text-slate-500 font-medium">Eventos 24h</div>
              <div className="text-[20px] font-semibold tabular text-slate-900 mt-0.5">{number(3120)}</div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1"><Zap className="h-3 w-3" /> tempo real</div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="col-span-2">
            <CardHeader title="Sessões por hora" subtitle="Últimas 24h" />
            <CardBody>
              <div className="h-60">
                <ResponsiveContainer>
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="gradSessoes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sessoes" stroke="#0ea5e9" fill="url(#gradSessoes)" />
                    <Area type="monotone" dataKey="conversoes" stroke="#10b981" fill="url(#gradConv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Dispositivos" />
            <CardBody>
              <div className="h-60">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                      {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader title="Funil de conversão" subtitle="Visita → lead" />
            <CardBody>
              <div className="space-y-1.5">
                {funilData.map((f, idx) => {
                  const pctRel = f.value / funilData[0].value;
                  return (
                    <div key={f.nome}>
                      <div className="flex items-center justify-between text-[12px] mb-1">
                        <span className="font-medium text-slate-700">{f.nome}</span>
                        <span className="tabular text-slate-900 font-semibold">{number(f.value)} <span className="text-slate-400 font-normal">({pct(pctRel)})</span></span>
                      </div>
                      <div className="h-7 rounded-[8px] bg-slate-100 overflow-hidden">
                        <div
                          className="h-full flex items-center px-2 text-[10px] text-white font-semibold"
                          style={{ width: `${pctRel * 100}%`, background: f.fill }}
                        >
                          {idx > 0 && <span>drop: {pct(1 - f.value / funilData[idx - 1].value)}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Atribuição por UTM" subtitle="Leads por campanha" />
            <CardBody>
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={utmAgg} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="campanha" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="sessoes" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Eventos em tempo real" subtitle="Últimos 50 eventos" />
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2.5 px-4">Evento</th>
                  <th className="text-left py-2.5 px-3">Página</th>
                  <th className="text-left py-2.5 px-3">UTM</th>
                  <th className="text-left py-2.5 px-3">Device</th>
                  <th className="text-left py-2.5 px-3">Cidade</th>
                  <th className="text-right py-2.5 px-4">Quando</th>
                </tr>
              </thead>
              <tbody>
                {eventosTracking.map((e) => {
                  const Icon = deviceIcon[e.device];
                  return (
                    <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="py-2.5 px-4">
                        <Badge tone={tipoTone[e.tipo] as any}>{e.tipo.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-3 font-mono text-[12px] text-slate-600">{e.pagina}</td>
                      <td className="px-3 text-[11px] text-slate-500">
                        {e.utm_campaign ? (
                          <span>{e.utm_source}/{e.utm_medium}/<b className="text-slate-800">{e.utm_campaign}</b></span>
                        ) : (
                          <span className="text-slate-400">direto</span>
                        )}
                      </td>
                      <td className="px-3 text-slate-600"><Icon className="h-3.5 w-3.5 inline mr-1 text-slate-400" />{e.device}</td>
                      <td className="px-3 text-slate-600">{e.cidade ?? "—"}</td>
                      <td className="text-right px-4 text-slate-500 text-[11px]">{new Date(e.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
    </>
  );
}
