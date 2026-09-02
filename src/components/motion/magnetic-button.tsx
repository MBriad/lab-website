"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { useMotionPrefs } from "./motion-prefs";

export interface MagneticButtonProps extends HTMLAttributes<HTMLDivElement> {
  /** Attraction factor: displacement = pointer offset * strength. */
  strength?: number;
  /** Maximum displacement in px. */
  maxShift?: number;
}

/**
 * Pointer-attracted wrapper (re-interpretation of cati's magnetic buttons).
 *
 * The element drifts toward the cursor while hovered and eases back on
 * leave. All per-frame work runs in a rAF loop writing `transform` directly
 * on the DOM node — React state is never updated per frame. Listeners and
 * the rAF loop are removed/cancelled on unmount. Disabled entirely for
 * reduced motion or coarse pointers.
 */
export function MagneticButton({
  strength = 0.3,
  maxShift = 18,
  className,
  children,
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { animate, finePointer } = useMotionPrefs();
  const enabled = animate && finePointer;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let running = false;
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      const settled =
        Math.abs(target.x - pos.x) < 0.05 && Math.abs(target.y - pos.y) < 0.05;
      if (settled && target.x === 0 && target.y === 0) {
        el.style.transform = "";
        running = false;
        raf = 0;
        return;
      }
      el.style.transform = `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const clamp = (value: number) =>
      Math.max(-maxShift, Math.min(maxShift, value));

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      target.x = clamp(dx * strength);
      target.y = clamp(dy * strength);
      kick();
    };

    const onLeave = () => {
      target.x = 0;
      target.y = 0;
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
  }, [enabled, strength, maxShift]);

  return (
    <div ref={ref} className={cn("inline-block", className)} {...rest}>
      {children}
    </div>
  );
}
