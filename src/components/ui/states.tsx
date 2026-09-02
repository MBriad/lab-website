import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  hint?: string;
  className?: string;
}

/** Empty-list presentation for data-driven sections. */
export function EmptyState({ title, hint, className }: EmptyStateProps) {
  return (
    <div className={cn("hud-panel px-6 py-12 text-center", className)}>
      <p className="font-mono text-xs tracking-[0.3em] text-ink-faint uppercase">
        {"EMPTY // 暂无数据"}
      </p>
      <p className="mt-3 text-lg text-ink">{title}</p>
      {hint ? <p className="mt-2 text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export interface ErrorNoteProps {
  title?: string;
  message?: string;
  className?: string;
}

/** Inline failure presentation when a server-side fetch throws. */
export function ErrorNote({
  title = "数据加载失败",
  message,
  className,
}: ErrorNoteProps) {
  return (
    <div role="alert" className={cn("hud-panel px-6 py-10", className)}>
      <p className="font-mono text-xs tracking-[0.3em] text-danger uppercase">
        {"ERR // 请求失败"}
      </p>
      <p className="mt-3 text-lg text-ink">{title}</p>
      {message ? <p className="mt-2 text-sm text-ink-muted">{message}</p> : null}
      <p className="mt-4 font-mono text-xs text-ink-faint">
        请稍后重试；若问题持续，请联系管理员。
      </p>
    </div>
  );
}
