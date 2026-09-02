import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface HudLinkProps {
  href: string;
  /** `primary` (accent-filled HUD button) or `ghost` (hairline outline). */
  variant?: "primary" | "ghost";
  className?: string;
  children: ReactNode;
  /** Hide the trailing arrow (e.g. for hash anchors). */
  withArrow?: boolean;
}

/**
 * HUD-styled call-to-action link. Server-safe (pure styling) — wrap it in
 * `MagneticButton` where pointer attraction is wanted.
 */
export function HudLink({
  href,
  variant = "primary",
  className,
  children,
  withArrow = true,
}: HudLinkProps) {
  const styles =
    variant === "primary"
      ? "border border-accent/60 bg-accent/10 text-accent hover:bg-accent/20 hover:text-accent-strong hover:shadow-glow-accent"
      : "border border-hairline-strong text-ink-muted hover:border-accent/50 hover:text-ink";

  return (
    <Link
      href={href}
      className={cn(
        "group/hud inline-flex items-center gap-2 rounded-hud px-5 py-2.5 font-mono text-xs tracking-[0.2em] uppercase transition-[background-color,border-color,color,box-shadow] duration-300",
        styles,
        className,
      )}
    >
      {children}
      {withArrow ? (
        <span aria-hidden className="transition-transform duration-300 group-hover/hud:translate-x-1">
          →
        </span>
      ) : null}
    </Link>
  );
}
