import { cn } from "@/lib/cn";

export interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border border-current border-t-transparent",
        className,
      )}
    />
  );
}

export interface LoadingBlockProps {
  label?: string;
  className?: string;
}

/** Full-width inline loading state for admin content areas. */
export function LoadingBlock({
  label = "加载中…",
  className,
}: LoadingBlockProps) {
  return (
    <div
      role="status"
      className={cn(
        "hairline flex items-center justify-center gap-3 rounded-panel bg-surface/40 px-6 py-12 text-sm text-ink-muted",
        className,
      )}
    >
      <Spinner className="text-accent" />
      <span>{label}</span>
    </div>
  );
}
