"use client";

import { useEffect, useRef } from "react";

export interface MetricItem {
  label: string;
  value: number;
}

export interface MetricsStripProps {
  metrics: MetricItem[];
}

export function formatMetricValue(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

/** A one-shot, observer-driven count-up that keeps every frame out of React state. */
export function MetricsStrip({ metrics }: MetricsStripProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const valueRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || hasAnimated.current) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const complete = () => {
      valueRefs.current.forEach((element, index) => {
        if (element) element.textContent = formatMetricValue(metrics[index]?.value ?? 0);
      });
      hasAnimated.current = true;
    };

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      complete();
      return;
    }

    let frame = 0;
    let observer: IntersectionObserver | null = null;
    const animate = (start: number) => {
      const progress = Math.min(1, (performance.now() - start) / 900);
      const eased = 1 - Math.pow(1 - progress, 3);
      metrics.forEach((metric, index) => {
        const element = valueRefs.current[index];
        if (element) element.textContent = formatMetricValue(Math.round(metric.value * eased));
      });
      if (progress < 1) {
        frame = requestAnimationFrame(() => animate(start));
      } else {
        complete();
      }
    };
    const onIntersect: IntersectionObserverCallback = (entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || hasAnimated.current) return;
      observer?.disconnect();
      frame = requestAnimationFrame(() => animate(performance.now()));
    };

    observer = new IntersectionObserver(onIntersect, { threshold: 0.25 });
    observer.observe(root);

    return () => {
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [metrics]);

  return (
    <div ref={rootRef} className="mt-10 grid grid-cols-2 border-y border-hairline sm:grid-cols-4">
      {metrics.map((metric, index) => (
        <div key={metric.label} className="border-hairline px-4 py-5 first:border-l-0 sm:border-l sm:px-6 sm:py-6">
          <span
            ref={(element) => { valueRefs.current[index] = element; }}
            data-metric-value={metric.value}
            aria-label={`${metric.label} ${formatMetricValue(metric.value)}`}
            className="block font-display text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-4xl"
          >
            {formatMetricValue(metric.value)}
          </span>
          <span className="mt-2 block font-mono text-[10px] tracking-[0.24em] text-ink-faint uppercase">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  );
}
