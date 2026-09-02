import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Shared look for admin form controls (input / textarea / select). */
export function controlClasses(invalid?: boolean): string {
  return cn(
    "w-full rounded-hud border bg-surface px-3 py-2 text-sm text-ink",
    "placeholder:text-ink-faint transition-colors focus:border-accent/70",
    invalid ? "border-danger/60" : "border-hairline-strong",
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Tints the border for inline validation errors. */
  invalid?: boolean;
}

export function Input({ invalid, className, ...props }: InputProps) {
  return <input className={cn(controlClasses(invalid), className)} {...props} />;
}
