import Link from "next/link";

/** Global 404 (also rendered for unmatched segments outside (public)). */
export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center section-pad">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">
          ERR.404 // SIGNAL LOST
        </p>
        <h1 className="mt-4 font-display text-7xl font-semibold text-outline-faint">
          404
        </h1>
        <p className="mt-5 leading-7 text-ink-muted">
          页面不存在或已被移动。
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-hud border border-accent/60 bg-accent/10 px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:bg-accent/20 hover:text-accent-strong"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
