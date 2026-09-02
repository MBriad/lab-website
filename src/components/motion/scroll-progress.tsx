"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./motion-prefs";

/**
 * Public reading progress: a quiet top edge bar plus a circular back-to-top
 * affordance that appears after the reader leaves the hero.
 *
 * Both indicators are updated directly inside one scroll path coalesced by
 * requestAnimationFrame with a 160 ms timeout fallback (some embedded or
 * background surfaces never fire animation frames); React state is
 * intentionally not involved in high-frequency scroll work.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const percentageRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const button = buttonRef.current;
    const circle = circleRef.current;
    const percentage = percentageRef.current;
    if (!bar || !button || !circle || !percentage) return;

    const perimeter = 2 * Math.PI * 18;
    circle.style.strokeDasharray = `${perimeter}`;
    circle.style.strokeDashoffset = `${perimeter}`;

    let frame = 0;
    let fallback = 0;

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const percent = Math.round(progress * 100);
      bar.style.transform = `scaleX(${progress})`;
      circle.style.strokeDashoffset = `${perimeter * (1 - progress)}`;
      percentage.textContent = `${percent}%`;

      const visible = window.scrollY > 300;
      button.style.opacity = visible ? "1" : "0";
      button.style.transform = visible ? "scale(1)" : "scale(0.8)";
      button.style.pointerEvents = visible ? "auto" : "none";
    };

    const flush = () => {
      if (fallback) {
        window.clearTimeout(fallback);
        fallback = 0;
      }
      frame = 0;
      update();
    };

    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      if (fallback) window.clearTimeout(fallback);
      frame = requestAnimationFrame(flush);
      // Some embedded/background browser surfaces never fire animation
      // frames (mirrors `use-horizontal-rail.ts`); the timeout keeps the
      // progress indicators correct when rAF is throttled to zero.
      fallback = window.setTimeout(() => {
        if (frame) cancelAnimationFrame(frame);
        flush();
      }, 160);
    };

    const toTop = () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    button.addEventListener("click", toTop);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      button.removeEventListener("click", toTop);
      if (frame) cancelAnimationFrame(frame);
      if (fallback) window.clearTimeout(fallback);
    };
  }, []);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
        <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-accent/80" />
      </div>
      <button
        ref={buttonRef}
        type="button"
        aria-label="返回顶部"
        className="public-scroll-progress fixed right-4 bottom-5 z-40 grid h-14 w-14 place-items-center rounded-full border border-white/75 bg-white/60 text-ink shadow-[0_12px_30px_rgba(113,148,255,0.16)] backdrop-blur-xl transition-[opacity,transform,background-color,border-color] duration-300 hover:border-accent/45 hover:bg-white/82 sm:right-7 sm:bottom-7"
      >
        <svg aria-hidden className="absolute inset-1.5 h-11 w-11 -rotate-90" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="18" stroke="rgba(113,148,255,0.16)" strokeWidth="1" />
          <circle ref={circleRef} cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span ref={percentageRef} className="relative font-mono text-[9px] tracking-[-0.02em] text-ink-muted">
          0%
        </span>
      </button>
    </>
  );
}