import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface AdminPageHeaderProps {
  /** Small mono code label, e.g. "SEC.02 // NEWS". */
  tag?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Admin page title block with optional HUD tag and right-aligned actions. */
export function AdminPageHeader({
  tag,
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "admin-page-header flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        {tag ? (
          <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
            {tag}
          </p>
        ) : null}
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {description ? (
          <p className="admin-page-header-description mt-1.5 max-w-2xl text-sm leading-6 text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
