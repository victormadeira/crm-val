import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  }
>(({ className, leftIcon, rightIcon, ...props }, ref) => (
  <div
    className={cn(
      "group flex items-center gap-2 h-9 rounded-[10px] border border-slate-200 bg-white px-3 shadow-soft",
      "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition",
      className
    )}
  >
    {leftIcon && <span className="text-slate-400 shrink-0">{leftIcon}</span>}
    <input
      ref={ref}
      className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none min-w-0"
      {...props}
    />
    {rightIcon && <span className="text-slate-400 shrink-0">{rightIcon}</span>}
  </div>
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-soft",
      "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition resize-none",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
