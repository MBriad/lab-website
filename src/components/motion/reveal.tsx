"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { useMotionPrefs } from "./motion-prefs";

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  /** Entrance style: `rise` (default) fades and lifts; `fade` only fades. */
  variant?: "fade" | "rise";
  /** Transition delay in milliseconds — used to stagger siblings. */
  delay?: number;
}

/**
 * IntersectionObserver-driven scroll reveal.
 *
 * Progressive enhancement: content renders visible by default. The hidden
 * state is only applied after mount, only when motion is allowed AND an
 * IntersectionObserver exists, and only while the element is still below
 * the fold — so reduced-motion users, no-JS agents and above-the-fold
 * content are never hidden or animated.
 */
export function Reveal({
  variant = "rise",
  delay = 0,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { animate } = useMotionPrefs();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!animate || typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          } else {
            // Hide only while waiting to enter; never re-hide after reveal.
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate]);

  const motionClasses = animate
    ? cn(
        "transition-[opacity,translate] duration-700 ease-out",
        !visible && (variant === "rise" ? "opacity-0 translate-y-8" : "opacity-0"),
      )
    : undefined;

  const mergedStyle: CSSProperties | undefined =
    delay > 0 ? { ...style, transitionDelay: `${delay}ms` } : style;

  return (
    <div
      ref={ref}
      className={cn(motionClasses, className)}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </div>
  );
}
