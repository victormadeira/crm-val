import * as React from "react";
import { cn } from "@/lib/cn";

type Tone =
  | "slate"
  | "brand"
  | "aqua"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "sky"
  | "fuchsia";

const tones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  aqua: "bg-aqua-50 text-aqua-700 ring-aqua-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  fuchsia: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100",
};

export function Badge({
  tone = "slate",
  className,
  children,
  dot,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full bg-current opacity-80")}
        />
      )}
      {children}
    </span>
  );
}
