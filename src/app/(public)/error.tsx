"use client";

import { useEffect } from "react";

/** Public-shell error boundary (keeps navbar/footer around the message). */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center section-pad pt-28">
      <div className="hud-panel max-w-md p-8 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-danger uppercase">
          SYS.FAULT // 页面异常
        </p>
        <h1 className="mt-4 font-display text-2xl font-semibold">
          渲染出现了一点问题
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          请重试。如果问题持续出现，请稍后再访问。
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-ink-faint">
            REF.{error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-hud border border-accent/60 bg-accent/10 px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:bg-accent/20 hover:text-accent-strong"
        >
          重新加载
        </button>
      </div>
    </div>
  );
}
