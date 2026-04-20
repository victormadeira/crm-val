import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const palette = [
  "from-brand-500 to-aqua-500",
  "from-fuchsia-500 to-brand-500",
  "from-emerald-500 to-aqua-500",
  "from-amber-500 to-rose-500",
  "from-violet-500 to-sky-500",
  "from-rose-500 to-fuchsia-500",
  "from-sky-500 to-brand-600",
  "from-teal-500 to-emerald-500",
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

type Size = "xs" | "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({
  name,
  size = "sm",
  className,
  ring,
}: {
  name: string;
  size?: Size;
  className?: string;
  ring?: boolean;
}) {
  const grad = palette[hash(name) % palette.length];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shrink-0",
        grad,
        sizes[size],
        ring && "ring-2 ring-white shadow-soft",
        className
      )}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  names,
  max = 3,
  size = "sm",
}: {
  names: string[];
  max?: number;
  size?: Size;
}) {
  const visible = names.slice(0, max);
  const extra = Math.max(0, names.length - max);
  return (
    <div className="flex -space-x-2">
      {visible.map((n, i) => (
        <Avatar key={i} name={n} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-2 ring-white font-semibold",
            sizes[size]
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
