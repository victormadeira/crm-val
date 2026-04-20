import * as React from "react";
import { cn } from "@/lib/cn";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[14px] border border-slate-200 bg-white shadow-soft",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = ({
  className,
  title,
  subtitle,
  action,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div
    className={cn(
      "flex items-start justify-between gap-4 px-5 pt-5 pb-3",
      className
    )}
    {...props}
  >
    <div className="min-w-0">
      {title && (
        <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-5 pb-5", className)} {...props} />
);

export const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-5 py-3 border-t border-slate-100 flex items-center justify-between",
      className
    )}
    {...props}
  />
);
