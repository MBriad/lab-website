import Link from "next/link";
import { cn } from "@/lib/cn";

export interface PaginationProps {
  page: number;
  pages: number;
  /** Build the href for a given page number (query params stay in the page). */
  hrefFor: (page: number) => string;
  className?: string;
}

const LINK_CLS =
  "grid h-9 min-w-9 place-items-center rounded-hud border border-hairline px-3 font-mono text-xs text-ink-muted transition-colors hover:border-accent/50 hover:text-accent";
const ACTIVE_CLS =
  "grid h-9 min-w-9 place-items-center rounded-hud border border-accent/60 bg-accent/10 px-3 font-mono text-xs text-accent";
const MUTED_CLS =
  "grid h-9 min-w-9 place-items-center rounded-hud border border-hairline/60 px-3 font-mono text-xs text-ink-faint/60";

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

/** Server-rendered pagination; renders nothing when `pages <= 1`. */
export function Pagination({ page, pages, hrefFor, className }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <nav aria-label="分页" className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={LINK_CLS}>
          ← 上一页
        </Link>
      ) : (
        <span aria-hidden className={MUTED_CLS}>
          ← 上一页
        </span>
      )}

      {pageWindow(page, pages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 font-mono text-xs text-ink-faint">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className={ACTIVE_CLS}>
            {item}
          </span>
        ) : (
          <Link key={item} href={hrefFor(item)} className={LINK_CLS}>
            {item}
          </Link>
        ),
      )}

      {page < pages ? (
        <Link href={hrefFor(page + 1)} className={LINK_CLS}>
          下一页 →
        </Link>
      ) : (
        <span aria-hidden className={MUTED_CLS}>
          下一页 →
        </span>
      )}
    </nav>
  );
}
