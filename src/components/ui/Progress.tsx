import { cn } from "@/lib/cn";

export function Progress({
  value,
  max = 100,
  tone = "brand",
  size = "md",
  className,
}: {
  value: number;
  max?: number;
  tone?: "brand" | "emerald" | "amber" | "rose" | "aqua";
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { xs: "h-1", sm: "h-1.5", md: "h-2" };
  const tones = {
    brand: "bg-brand-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    aqua: "bg-aqua-500",
  };
  return (
    <div
      className={cn(
        "w-full rounded-full bg-slate-100 overflow-hidden",
        heights[size],
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          tones[tone]
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
