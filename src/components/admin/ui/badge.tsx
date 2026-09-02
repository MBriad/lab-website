import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "success" | "warning" | "accent" | "neutral" | "danger";

const TONE_CLS: Record<BadgeTone, string> = {
  success: "border-success/50 bg-success/10 text-success",
  warning: "border-warning/50 bg-warning/10 text-warning",
  accent: "border-accent/50 bg-accent/10 text-accent",
  neutral: "border-hairline-strong text-ink-muted",
  danger: "border-danger/50 bg-danger/10 text-danger",
};

export interface AdminBadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** Status chip for admin lists (已发布/草稿/已隐藏/精选 …). */
export function AdminBadge({
  tone = "neutral",
  children,
  className,
}: AdminBadgeProps) {
  return (
    <span
      className={cn(
        "admin-badge inline-flex items-center gap-1 rounded-hud border px-2 py-0.5",
        "font-mono text-[11px] tracking-wider whitespace-nowrap",
        TONE_CLS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
