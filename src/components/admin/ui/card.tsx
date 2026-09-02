import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface AdminCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the standard panel padding (default true). */
  padded?: boolean;
}

/** Simple raised panel used for forms, stat tiles, and settings sections. */
export function AdminCard({
  padded = true,
  className,
  ...props
}: AdminCardProps) {
  return (
    <div
      className={cn("admin-card hud-panel", padded && "p-5 sm:p-6", className)}
      {...props}
    />
  );
}

export interface AdminCardHeadingProps {
  title: string;
  description?: string;
  className?: string;
}

/** Section heading used inside settings/form cards. */
export function AdminCardHeading({
  title,
  description,
  className,
}: AdminCardHeadingProps) {
  return (
    <div className={cn("admin-card-heading mb-4", className)}>
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-ink-muted">{description}</p>
      ) : null}
    </div>
  );
}
