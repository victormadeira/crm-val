import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  Flame,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { money } from "@/lib/format";

interface Overview {
  window: { days: number; since: string };
  leadsByRotting: { rottingStatus: string; count: number }[];
  leadsBySegment: { segment: string | null; count: number }[];
  leadsByStage: { stageId: string | null; count: number }[];
  leadsCreatedInWindow: number;
  tasks: { status: string; count: number }[];
  proposals: { status: string; count: number; valueCents: number }[];
  bookings: { status: string; count: number; numParticipants: number }[];
  forecast: { valueCents: number; leadCount: number };
  topLeads: {
    id: string;
    name: string;
    segment: string | null;
    aiScore: number | null;
    rottingStatus: string;
    blueprintCompletion: number;
    stage: { name: string } | null;
  }[];
}

export function DashboardLive() {
  const [data, setData] = useState<Overview | null>(null);
  const [days, setDays] = useState(90);

  useEffect(() => {
    api.get<Overview>(`/dashboard/overview?days=${days}`).then(setData);
  }, [days]);

  const rottenCount =
    data?.leadsByRotting.find((r) => r.rottingStatus === "ROTTEN")?.count ?? 0;
  const totalLeads =
    data?.leadsByRotting.reduce((s, r) => s + r.count, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Dashboard ao vivo"
        subtitle="Métricas executivas · servidor"
        actions={
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-9 px-3 rounded-[8px] border border-slate-200 text-[13px]"
          >
            <option value={30}>30d</option>
            <option value={90}>90d</option>
            <option value={180}>180d</option>
          </select>
        }
      />
      <PageContent className="space-y-4">
        {!data && (
          <div className="text-[13px] text-slate-500">carregando...</div>
        )}
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Stat
                icon={<Users className="h-4 w-4" />}
                label="Leads ativos"
                value={totalLeads.toString()}
                sub={`+${data.leadsCreatedInWindow} novos em ${data.window.days}d`}
              />
              <Stat
                icon={<Flame className="h-4 w-4" />}
                label="Em rotting"
                value={rottenCount.toString()}
                sub="estado ROTTEN"
                tone="rose"
              />
              <Stat
                icon={<Target className="h-4 w-4" />}
                label="Forecast ponderado"
                value={money(data.forecast.valueCents / 100)}
                sub={`${data.forecast.leadCount} deals com proposta`}
                tone="emerald"
              />
              <Stat
                icon={<CalendarDays className="h-4 w-4" />}
                label="Bookings futuros"
                value={data.bookings
                  .reduce((s, b) => s + b.numParticipants, 0)
                  .toString()}
                sub="participantes esperados"
                tone="violet"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Activity className="h-4 w-4 text-brand-500" />
                      Leads por segmento
                    </span>
                  }
                />
                <CardBody className="space-y-2">
                  {data.leadsBySegment.map((s) => (
                    <div
                      key={s.segment ?? "none"}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="text-slate-700">
                        {s.segment ?? "sem segmento"}
                      </span>
                      <span className="font-bold tabular">{s.count}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title={
                    <span className="inline-flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Propostas
                    </span>
                  }
                />
                <CardBody className="space-y-2">
                  {data.proposals.map((p) => (
                    <div
                      key={p.status}
                      className="flex items-center justify-between text-[13px]"
                    >
                      <span className="text-slate-700">{p.status}</span>
                      <span className="tabular">
                        {p.count} · {money(p.valueCents / 100)}
                      </span>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader
                title={
                  <span className="inline-flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    Top leads por score
                  </span>
                }
              />
              <CardBody>
                <ul className="divide-y divide-slate-100">
                  {data.topLeads.map((l) => (
                    <li
                      key={l.id}
                      className="py-2 flex items-center gap-3 text-[13px]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {l.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {l.stage?.name ?? "-"} · {l.segment ?? "-"}
                        </div>
                      </div>
                      <Badge
                        tone={
                          l.rottingStatus === "ROTTEN"
                            ? "rose"
                            : l.rottingStatus === "WARNING"
                            ? "amber"
                            : "emerald"
                        }
                        className="text-[10px]"
                      >
                        {l.rottingStatus}
                      </Badge>
                      <span className="tabular font-bold text-slate-900 w-8 text-right">
                        {l.aiScore ?? "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </>
        )}
      </PageContent>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "brand" | "rose" | "emerald" | "violet";
}) {
  const toneMap = {
    brand: "from-brand-500 to-brand-600",
    rose: "from-rose-500 to-rose-600",
    emerald: "from-emerald-500 to-teal-500",
    violet: "from-violet-500 to-fuchsia-500",
  };
  return (
    <Card>
      <CardBody className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-[10px] bg-gradient-to-br ${toneMap[tone]} text-white inline-flex items-center justify-center`}
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
