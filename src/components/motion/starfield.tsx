"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { hasFinePointer, useMotionPrefs } from "./motion-prefs";

export interface StarfieldProps {
  className?: string;
  /** Particle budget; hard-capped between 60 and 90 regardless. */
  maxParticles?: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  breathSpeed: number;
  phase: number;
  /** 0..1 — parallax depth factor. */
  depth: number;
  /** "r,g,b" triplet string. */
  color: string;
}

interface Marker {
  x: number;
  y: number;
  size: number;
  rot: number;
  rotSpeed: number;
  phase: number;
  kind: "ring" | "cross" | "diamond";
}

const TAU = Math.PI * 2;

/** Deterministic PRNG so the field is stable and needs no Math.random. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lightweight 2D-canvas star-dust backdrop for the hero (re-interpretation
 * of cati's galaxy field — no Three.js/WebGL).
 *
 * Performance + cleanup contract:
 * - DPR capped at 1.5; particle count capped between 60 and 90.
 * - Pauses when offscreen (IntersectionObserver) and on hidden tabs.
 * - Skipped entirely for reduced motion and small viewports (returns null).
 * - Pointer parallax only for fine pointers; drift values stay in refs,
 *   never React state.
 * - rAF, ResizeObserver, IntersectionObserver and all listeners are
 *   cancelled/removed on unmount.
 */
export function Starfield({ className, maxParticles = 84 }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { animate, large } = useMotionPrefs();
  const enabled = animate && large;

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rand = mulberry32(20260901);

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let markers: Marker[] = [];
    let raf = 0;
    let running = false;
    let inView = true;
    let tabVisible = document.visibilityState === "visible";
    let last = performance.now();
    const pointer = { x: 0.5, y: 0.5 };

    const seedField = () => {
      const budget = Math.max(60, Math.min(90, Math.floor(maxParticles)));
      const count = Math.max(
        60,
        Math.min(budget, Math.round((width * height) / 16000)),
      );
      stars = Array.from({ length: count }, (): Star => {
        const roll = rand();
        const color =
          roll < 0.78
            ? "232,238,247" // ink white
            : roll < 0.92
              ? "34,211,238" // accent cyan
              : "251,191,36"; // signal amber
        return {
          x: rand() * width,
          y: rand() * height,
          r: 0.4 + rand() * 1.1,
          vx: -4 - rand() * 6,
          vy: (rand() - 0.5) * 2.5,
          baseAlpha: 0.25 + rand() * 0.55,
          breathSpeed: 0.4 + rand() * 1.2,
          phase: rand() * TAU,
          depth: 0.35 + rand() * 0.65,
          color,
        };
      });

      markers = Array.from({ length: 4 }, (_, i): Marker => {
        const kinds = ["ring", "cross", "diamond"] as const;
        return {
          x: width * (0.16 + 0.22 * i) + (rand() - 0.5) * width * 0.08,
          y: height * (0.18 + rand() * 0.64),
          size: 14 + rand() * 26,
          rot: rand() * TAU,
          rotSpeed: (rand() - 0.5) * 0.25,
          phase: rand() * TAU,
          kind: kinds[i % kinds.length],
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedField();
    };

    const drawMarker = (m: Marker, t: number) => {
      const alpha = 0.14 + 0.12 * Math.sin(t * 0.5 + m.phase);
      ctx.strokeStyle = `rgba(34,211,238,${alpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      if (m.kind === "ring") {
        ctx.beginPath();
        ctx.arc(0, 0, m.size, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, TAU);
        ctx.fillStyle = `rgba(34,211,238,${alpha.toFixed(3)})`;
        ctx.fill();
      } else if (m.kind === "cross") {
        ctx.beginPath();
        ctx.arc(0, 0, m.size * 0.7, 0, TAU);
        ctx.stroke();
        for (let k = 0; k < 4; k += 1) {
          const a = (k * TAU) / 4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * m.size * 0.85, Math.sin(a) * m.size * 0.85);
          ctx.lineTo(Math.cos(a) * m.size * 1.15, Math.sin(a) * m.size * 1.15);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -m.size);
        ctx.lineTo(m.size, 0);
        ctx.lineTo(0, m.size);
        ctx.lineTo(-m.size, 0);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, width, height);
      const parX = (pointer.x - 0.5) * 16;
      const parY = (pointer.y - 0.5) * 12;

      for (const s of stars) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < -4) s.x = width + 4;
        else if (s.x > width + 4) s.x = -4;
        if (s.y < -4) s.y = height + 4;
        else if (s.y > height + 4) s.y = -4;

        const breath = 0.6 + 0.4 * Math.sin(t * s.breathSpeed + s.phase);
        ctx.globalAlpha = s.baseAlpha * breath;
        ctx.fillStyle = `rgb(${s.color})`;
        ctx.beginPath();
        ctx.arc(s.x + parX * s.depth, s.y + parY * s.depth, s.r, 0, TAU);
        ctx.fill();
      }

      for (const m of markers) {
        m.rot += m.rotSpeed * dt;
        drawMarker(m, t);
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const sync = () => {
      if (inView && tabVisible) start();
      else stop();
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inView = entry.isIntersecting;
        }
        sync();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let onPointerMove: ((e: PointerEvent) => void) | null = null;
    if (hasFinePointer()) {
      onPointerMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        pointer.x = (e.clientX - rect.left) / rect.width;
        pointer.y = (e.clientY - rect.top) / rect.height;
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    sync();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (onPointerMove) {
        window.removeEventListener("pointermove", onPointerMove);
      }
    };
  }, [enabled, maxParticles]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
