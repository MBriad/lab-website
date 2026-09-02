"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed thin reading-progress bar along the top edge.
 *
 * Scroll-linked (not autonomous), so it is acceptable under reduced motion:
 * it only mirrors the user's own scrolling. The value is applied as
 * `transform: scaleX()` inside a rAF-throttled scroll handler — no React
 * state per scroll. Listeners and rAF are cleaned up on unmount.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress =
        max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        ref={barRef}
        className="h-full w-full origin-left scale-x-0 bg-accent/80"
      />
    </div>
  );
}
