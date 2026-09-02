"use client";

import { useEffect, useState } from "react";

/**
 * Shared capability gating for motion primitives.
 *
 * SSR-safe: every helper guards on `window`/`matchMedia` and reports the
 * conservative "no animation" value during prerender, so effects enable
 * motion only after mount when capabilities are actually known.
 */

/** `true` when the user prefers reduced motion (or the API is unavailable). */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** `true` for mouse/trackpad-class pointers; coarse (touch) returns false. */
export function hasFinePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: fine)").matches;
}

/** Viewport-width gate so desktop effects are never forced onto phones. */
export function isLargeViewport(minWidth = 768): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= minWidth;
}

export interface MotionPrefs {
  reduced: boolean;
  finePointer: boolean;
  large: boolean;
  /** Master gate for non-essential animation (reveal, tilt, magnetic, particles). */
  animate: boolean;
}

const SSR_PREFS: MotionPrefs = {
  reduced: true,
  finePointer: false,
  large: false,
  animate: false,
};

/** Snapshot of the current capability flags (SSR-safe). */
export function readMotionPrefs(): MotionPrefs {
  if (typeof window === "undefined") return SSR_PREFS;
  const reduced = prefersReducedMotion();
  return {
    reduced,
    finePointer: hasFinePointer(),
    large: isLargeViewport(),
    animate: !reduced,
  };
}

/**
 * Reactive capability flags. Starts conservative (`animate: false`) during
 * SSR/first paint and updates in an effect; also tracks live changes to
 * `prefers-reduced-motion`.
 */
export function useMotionPrefs(): MotionPrefs {
  const [prefs, setPrefs] = useState<MotionPrefs>(SSR_PREFS);

  useEffect(() => {
    const compute = () => setPrefs(readMotionPrefs());
    compute();
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener("change", compute);
    return () => mql.removeEventListener("change", compute);
  }, []);

  return prefs;
}
