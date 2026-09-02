import Link from "next/link";

/**
 * 404 inside the public route group — keeps the navbar/footer shell when a
 * public detail route (project/news) resolves to `notFound()`.
 */
export default function PublicNotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center section-pad pt-28">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">
          ERR.404 // SIGNAL LOST
        </p>
        <h1 className="mt-4 font-display text-7xl font-semibold text-outline-faint">
          404
        </h1>
        <p className="mt-5 leading-7 text-ink-muted">
          内容不存在、尚未发布，或已被移动。
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-hud border border-accent/60 bg-accent/10 px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:bg-accent/20 hover:text-accent-strong"
          >
            返回首页
          </Link>
          <Link
            href="/news"
            className="rounded-hud border border-hairline-strong px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-ink-muted uppercase transition-colors hover:border-accent/50 hover:text-ink"
          >
            查看动态
          </Link>
        </div>
      </div>
    </div>
  );
}
