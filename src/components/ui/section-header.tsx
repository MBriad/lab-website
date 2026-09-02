import { cn } from "@/lib/cn";

export interface SectionHeaderProps {
  /** Zero-padded section number, e.g. "02". */
  index: string;
  /** English HUD code, e.g. "RESEARCH". */
  code: string;
  /** Chinese section title. */
  title: string;
  description?: string;
  className?: string;
}

/**
 * Numbered HUD section label used across the public site:
 * `SEC.{index} // {code}` mono kicker + display title.
 */
export function SectionHeader({
  index,
  code,
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn("max-w-3xl", className)}>
      <p className="flex items-center gap-3 font-mono text-xs tracking-[0.3em] text-accent uppercase">
        <span aria-hidden className="h-1.5 w-1.5 bg-accent shadow-glow-accent" />
        {`SEC.${index} // ${code}`}
        <span aria-hidden className="h-px flex-1 bg-hairline" />
      </p>
      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 leading-7 text-ink-muted">{description}</p>
      ) : null}
    </header>
  );
}

export interface PageHeaderProps {
  /** English HUD code line, e.g. "SEC.03 // PROJECTS". */
  code: string;
  title: string;
  description?: string;
  /** Optional mono metadata line, e.g. "12 PROJECTS · PAGE 1/2". */
  meta?: string;
}

/** Editorial page opener for sub-pages. */
export function PageHeader({ code, title, description, meta }: PageHeaderProps) {
  return (
    <div className="border-b border-hairline bg-surface/30 section-pad">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">
          {code}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl leading-7 text-ink-muted">
            {description}
          </p>
        ) : null}
        {meta ? (
          <p className="mt-6 font-mono text-[11px] tracking-[0.25em] text-ink-faint uppercase">
            {meta}
          </p>
        ) : null}
      </div>
    </div>
  );
}
