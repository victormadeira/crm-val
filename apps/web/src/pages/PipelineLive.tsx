import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, Flame, RefreshCw } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/AppShell";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

interface PipelineResp {
  id: string;
  name: string;
  segment: string;
  isDefault: boolean;
  stages: StageResp[];
}
interface StageResp {
  id: string;
  name: string;
  order: number;
  probability: number;
  rottingDays: number;
  requiredFields: { field: string; label: string }[];
  autoTasks: { title: string; dueInDays: number }[];
  isFinal: boolean;
  color?: string | null;
}
interface LeadResp {
  id: string;
  name: string;
  phoneE164: string;
  segment: string | null;
  stageId: string | null;
  rottingStatus: "HEALTHY" | "WARNING" | "ROTTEN";
  blueprintCompletion: number;
  aiScore: number | null;
}

interface MoveError {
  error: "BLUEPRINT_INCOMPLETE";
  missing: { field: string; label: string }[];
  message: string;
}

/**
 * Pipeline ao vivo, conectado à API nova. Seleciona pipeline por segment,
 * lista leads por stage, permite mover com blueprint validation + force.
 */
export function PipelineLive() {
  const [pipelines, setPipelines] = useState<PipelineResp[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadResp[]>([]);
  const [loading, setLoading] = useState(true);
  const [moveError, setMoveError] = useState<{
    leadId: string;
    stageId: string;
    missing: { field: string; label: string }[];
  } | null>(null);

  const pipeline = useMemo(
    () => pipelines.find((p) => p.id === selected),
    [pipelines, selected]
  );

  const loadPipelines = async () => {
    const data = await api.get<PipelineResp[]>("/pipelines");
    setPipelines(data);
    if (!selected && data.length > 0) {
      setSelected(data.find((p) => p.isDefault)?.id ?? data[0].id);
    }
  };

  const loadLeads = async (pipelineId: string) => {
    setLoading(true);
    const resp = await api.get<{ items: LeadResp[] }>(
      `/leads?pipelineId=${pipelineId}&pageSize=200`
    );
    setLeads(resp.items);
    setLoading(false);
  };

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    if (selected) void loadLeads(selected);
  }, [selected]);

  const tryMove = async (leadId: string, stageId: string, force = false) => {
    try {
      await api.post(`/leads/${leadId}/move`, { stageId, force });
      if (selected) void loadLeads(selected);
      setMoveError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        const body = e.body as MoveError;
        setMoveError({ leadId, stageId, missing: body.missing ?? [] });
      } else {
        throw e;
      }
    }
  };

  return (
    <>
      <PageHeader
        title="Pipeline ao vivo"
        subtitle="Dados do servidor — mover com validação de blueprint"
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => selected && loadLeads(selected)}
          >
            Recarregar
          </Button>
        }
      />
      <PageContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={cn(
                "px-4 py-2 rounded-[10px] text-[13px] font-semibold border transition",
                selected === p.id
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-700 border-slate-200 hover:border-brand-300"
              )}
            >
              {p.name}
              {p.isDefault && (
                <Badge tone="slate" className="ml-2 text-[10px]">
                  default
                </Badge>
              )}
            </button>
          ))}
        </div>

        {pipeline && (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${pipeline.stages.length}, minmax(240px, 1fr))`,
            }}
          >
            {pipeline.stages.map((stage) => {
              const stageLeads = leads.filter((l) => l.stageId === stage.id);
              return (
                <Card key={stage.id}>
                  <CardHeader
                    title={
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px]">{stage.name}</span>
                        <Badge tone="slate" className="text-[10px]">
                          {stageLeads.length}
                        </Badge>
                      </div>
                    }
                    subtitle={`prob ${stage.probability}% · rot ${stage.rottingDays}d`}
                  />
                  <CardBody className="space-y-2 max-h-[520px] overflow-y-auto">
                    {loading && (
                      <div className="text-[11px] text-slate-400 italic">
                        carregando...
                      </div>
                    )}
                    {!loading && stageLeads.length === 0 && (
                      <div className="text-[11px] text-slate-400 italic py-3">
                        vazio
                      </div>
                    )}
                    {stageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        stages={pipeline.stages}
                        onMove={(sid) => tryMove(lead.id, sid)}
                      />
                    ))}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </PageContent>

      {moveError && (
        <BlueprintModal
          missing={moveError.missing}
          onConfirm={() => tryMove(moveError.leadId, moveError.stageId, true)}
          onCancel={() => setMoveError(null)}
        />
      )}
    </>
  );
}

function LeadCard({
  lead,
  stages,
  onMove,
}: {
  lead: LeadResp;
  stages: StageResp[];
  onMove: (stageId: string) => void;
}) {
  const rotTone =
    lead.rottingStatus === "ROTTEN"
      ? "rose"
      : lead.rottingStatus === "WARNING"
      ? "amber"
      : "emerald";
  const scoreTone =
    (lead.aiScore ?? 0) >= 75
      ? "text-emerald-700"
      : (lead.aiScore ?? 0) >= 50
      ? "text-amber-700"
      : "text-slate-600";
  return (
    <div className="rounded-[10px] border border-slate-200 p-2.5 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-slate-900 truncate">
            {lead.name}
          </div>
          <div className="text-[10px] text-slate-500 truncate tabular">
            {lead.phoneE164}
          </div>
        </div>
        <span className={cn("text-[11px] font-bold tabular", scoreTone)}>
          {lead.aiScore ?? "-"}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
        <Badge tone={rotTone} className="text-[9px] h-4 px-1.5">
          {lead.rottingStatus === "ROTTEN" ? (
            <Flame className="h-2.5 w-2.5 mr-0.5" />
          ) : (
            <Clock className="h-2.5 w-2.5 mr-0.5" />
          )}
          {lead.rottingStatus}
        </Badge>
        <Badge tone="slate" className="text-[9px] h-4 px-1.5">
          bp {lead.blueprintCompletion}%
        </Badge>
      </div>
      <select
        value={lead.stageId ?? ""}
        onChange={(e) => {
          if (e.target.value && e.target.value !== lead.stageId) {
            onMove(e.target.value);
          }
        }}
        className="mt-2 w-full h-7 text-[11px] rounded-[6px] border border-slate-200 bg-white px-2"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            → {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function BlueprintModal({
  missing,
  onConfirm,
  onCancel,
}: {
  missing: { field: string; label: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[14px] max-w-md w-full p-5 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-[10px] bg-amber-100 text-amber-700 inline-flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-slate-900">
              Blueprint incompleto
            </h3>
            <p className="text-[12px] text-slate-600 mt-0.5">
              Campos obrigatórios deste estágio estão faltando.
            </p>
          </div>
        </div>
        <ul className="mt-3 space-y-1">
          {missing.map((m) => (
            <li
              key={m.field}
              className="text-[12px] text-slate-700 flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {m.label}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Mover mesmo assim
          </Button>
        </div>
      </div>
    </div>
  );
}
