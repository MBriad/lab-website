import { cn } from "@/lib/cn";

export interface PagerProps {
  page: number;
  pages: number;
  onPage: (page: number) => void;
  className?: string;
}

const BTN_CLS =
  "grid h-9 min-w-9 place-items-center rounded-hud border border-hairline px-3 font-mono text-xs text-ink-muted transition-colors hover:border-accent/50 hover:text-accent disabled:pointer-events-none disabled:opacity-40";
const ACTIVE_CLS =
  "grid h-9 min-w-9 place-items-center rounded-hud border border-accent/60 bg-accent/10 px-3 font-mono text-xs text-accent";

/** Windowed page numbers: always show edges, ellipsis beyond 7 pages. */
function pageWindow(page: number, pages: number): Array<number | "gap"> {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items: Array<number | "gap"> = [1];
  const lo = Math.max(2, page - 1);
  const hi = Math.min(pages - 1, page + 1);
  if (lo > 2) items.push("gap");
  for (let n = lo; n <= hi; n += 1) items.push(n);
  if (hi < pages - 1) items.push("gap");
  items.push(pages);
  return items;
}

/**
 * Client-side pagination for admin lists (state stays in the component,
 * unlike the public site where pagination lives in the URL).
 * Renders nothing when `pages <= 1`.
 */
export function Pager({ page, pages, onPage, className }: PagerProps) {
  if (pages <= 1) return null;
  return (
    <nav
      aria-label="分页"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      <button
        type="button"
        className={BTN_CLS}
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ← 上一页
      </button>
      {pageWindow(page, pages).map((item, i) =>
        item === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className="px-1 font-mono text-xs text-ink-faint"
          >
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className={ACTIVE_CLS}>
            {item}
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={BTN_CLS}
            onClick={() => onPage(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className={BTN_CLS}
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        下一页 →
      </button>
    </nav>
  );
}
