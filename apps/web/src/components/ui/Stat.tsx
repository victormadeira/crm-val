import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/cn";

export function Stat({
  label,
  value,
  delta,
  hint,
  icon,
  tone = "slate",
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "slate" | "brand" | "emerald" | "amber" | "rose" | "aqua";
}) {
  const up = (delta ?? 0) >= 0;
  const tones = {
    slate: "bg-slate-50 text-slate-600",
    brand: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    aqua: "bg-aqua-50 text-aqua-700",
  };
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div
          className={cn(
            "h-10 w-10 rounded-[10px] inline-flex items-center justify-center",
            tones[tone]
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-slate-500 font-medium">{label}</p>
        <p className="text-[22px] font-semibold text-slate-900 tabular leading-tight mt-0.5">
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-medium tabular",
                up ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {up ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
        </div>
      </div>
    </div>
  );
}
