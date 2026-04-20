import * as React from "react";
import { cn } from "@/lib/cn";

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-[10px] bg-slate-100 p-1",
        className
      )}
      role="tablist"
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "px-3 h-7 rounded-[7px] text-xs font-medium transition-all ring-focus inline-flex items-center gap-1.5",
              active
                ? "bg-white text-slate-900 shadow-soft"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold tabular",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
