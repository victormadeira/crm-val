import { cn } from "@/lib/cn";

export function Brand({
  size = "md",
  showText = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}) {
  const sizes = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-10 w-10" };
  const texts = { sm: "text-sm", md: "text-[15px]", lg: "text-lg" };
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "rounded-[10px] bg-gradient-to-br from-brand-600 to-aqua-500 shadow-soft inline-flex items-center justify-center overflow-hidden relative",
          sizes[size]
        )}
      >
        <svg
          viewBox="0 0 32 32"
          className="h-full w-full text-white"
          fill="currentColor"
        >
          <path
            opacity=".95"
            d="M6 20c2 0 2-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2v3c-2 0-3-2-5-2s-3 2-5 2-3-2-5-2-3 2-5 2zM6 13c2 0 2-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2v3c-2 0-3-2-5-2s-3 2-5 2-3-2-5-2-3 2-5 2z"
          />
        </svg>
      </div>
      {showText && (
        <div className="leading-none">
          <div className={cn("font-semibold tracking-tight text-slate-900", texts[size])}>
            Aquapark <span className="text-brand-600">CRM</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wider uppercase">
            Revenue Intelligence
          </div>
        </div>
      )}
    </div>
  );
}
