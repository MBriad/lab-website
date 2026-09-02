"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { useMotionPrefs } from "./motion-prefs";

export interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Maximum tilt in degrees on each axis. */
  maxTiltDeg?: number;
  /** Maximum planar shift in px toward the pointer. */
  maxShiftPx?: number;
  /** Hover scale factor. */
  hoverScale?: number;
}

/**
 * Pointer-driven image/card tilt (re-interpretation of cati's parallax tilt).
 *
 * Small rotateX/rotateY plus a slight translate toward the pointer; eases
 * back to rest on leave. Values are lerped in a rAF loop and written as a
 * `transform` on the DOM node — no per-frame React state. Cleaned up on
 * unmount. Disabled for reduced motion or coarse pointers.
 */
export function TiltCard({
  maxTiltDeg = 5,
  maxShiftPx = 6,
  hoverScale = 1.015,
  className,
  style,
  children,
  ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { animate, finePointer } = useMotionPrefs();
  const enabled = animate && finePointer;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let running = false;
    const target = { rx: 0, ry: 0, tx: 0, ty: 0, s: 1 };
    const pos = { rx: 0, ry: 0, tx: 0, ty: 0, s: 1 };

    const tick = () => {
      pos.rx += (target.rx - pos.rx) * 0.16;
      pos.ry += (target.ry - pos.ry) * 0.16;
      pos.tx += (target.tx - pos.tx) * 0.16;
      pos.ty += (target.ty - pos.ty) * 0.16;
      pos.s += (target.s - pos.s) * 0.16;

      const atRest =
        target.rx === 0 &&
        target.ry === 0 &&
        target.tx === 0 &&
        target.ty === 0 &&
        target.s === 1;
      const settled =
        Math.abs(target.rx - pos.rx) < 0.01 &&
        Math.abs(target.ry - pos.ry) < 0.01 &&
        Math.abs(target.tx - pos.tx) < 0.05 &&
        Math.abs(target.ty - pos.ty) < 0.05 &&
        Math.abs(target.s - pos.s) < 0.001;

      if (atRest && settled) {
        el.style.transform = "";
        running = false;
        raf = 0;
        return;
      }
      el.style.transform = `perspective(900px) rotateX(${pos.rx.toFixed(2)}deg) rotateY(${pos.ry.toFixed(2)}deg) translate3d(${pos.tx.toFixed(2)}px, ${pos.ty.toFixed(2)}px, 0) scale(${pos.s.toFixed(4)})`;
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      target.ry = px * 2 * maxTiltDeg;
      target.rx = -py * 2 * maxTiltDeg;
      target.tx = px * 2 * maxShiftPx;
      target.ty = py * 2 * maxShiftPx;
      target.s = hoverScale;
      kick();
    };

    const onLeave = () => {
      target.rx = 0;
      target.ry = 0;
      target.tx = 0;
      target.ty = 0;
      target.s = 1;
      kick();
    };

    el.style.willChange = "transform";
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
      el.style.willChange = "";
    };
  }, [enabled, maxTiltDeg, maxShiftPx, hoverScale]);

  return (
    <div ref={ref} className={cn("[transform-style:preserve-3d]", className)} style={style} {...rest}>
      {children}
    </div>
  );
}
