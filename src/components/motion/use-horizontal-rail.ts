"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { prefersReducedMotion } from "./motion-prefs";

export interface HorizontalRailControls {
  previous: boolean;
  next: boolean;
}

export interface UseHorizontalRailResult {
  railRef: RefObject<HTMLDivElement | null>;
  controls: HorizontalRailControls;
  moveRail: (direction: -1 | 1) => void;
  onRailKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Shared manual rail behavior for public image archives.
 *
 * Native overflow/snap remains the source of truth. The hook mirrors button
 * availability and provides keyboard/explicit-control paths; its rAF only
 * coalesces scroll measurements, not content animation.
 */
export function useHorizontalRail(): UseHorizontalRailResult {
  const railRef = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState<HorizontalRailControls>({
    previous: false,
    // A rail with multiple items can be interacted with immediately while
    // the first layout measurement is queued. The async measurement below
    // corrects this for a non-overflowing rail.
    next: true,
  });

  const updateControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const nextControls = {
      previous: rail.scrollLeft > 8,
      next: max > 8 && rail.scrollLeft < max - 8,
    };
    setControls((current) =>
      current.previous === nextControls.previous &&
      current.next === nextControls.next
        ? current
        : nextControls,
    );
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;
    let fallback = 0;
    const flush = () => {
      if (fallback) {
        window.clearTimeout(fallback);
        fallback = 0;
      }
      frame = 0;
      updateControls();
    };
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      if (fallback) window.clearTimeout(fallback);
      frame = requestAnimationFrame(flush);
      // Some embedded/background browser surfaces delay animation frames.
      // Keep controls correct even when that first frame is throttled.
      fallback = window.setTimeout(() => {
        if (frame) cancelAnimationFrame(frame);
        flush();
      }, 160);
    };

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    observer?.observe(rail);
    rail.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      observer?.disconnect();
      rail.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      if (fallback) window.clearTimeout(fallback);
    };
  }, [updateControls]);

  const moveRail = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const amount = Math.max(rail.clientWidth * 0.78, 280);
    const target = Math.max(0, Math.min(max, rail.scrollLeft + amount * direction));
    const cards = Array.from(rail.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    const targetCard = cards.reduce<HTMLElement | null>((closest, card) => {
      if (!closest) return card;
      return Math.abs(card.offsetLeft - target) < Math.abs(closest.offsetLeft - target)
        ? card
        : closest;
    }, null);
    // Let the browser bring a real snap item into view. This works where an
    // embedded web surface ignores direct overflow assignment, and preserves
    // ordinary native touch / trackpad scrolling for the rail itself.
    targetCard?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
    // Give the user immediate feedback while a smooth scroll is in flight;
    // the scroll listener will refine the final boundary state afterward.
    setControls({ previous: target > 8, next: max > 8 && target < max - 8 });
  }, []);

  const onRailKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveRail(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveRail(1);
      } else if (event.key === "Home") {
        event.preventDefault();
        const rail = railRef.current;
        if (rail) {
          rail.scrollLeft = 0;
          setControls((current) => ({ ...current, previous: false }));
        }
      } else if (event.key === "End") {
        event.preventDefault();
        const rail = railRef.current;
        if (rail) {
          rail.scrollLeft = rail.scrollWidth;
          setControls((current) => ({ ...current, previous: true, next: false }));
        }
      }
    },
    [moveRail],
  );

  return { railRef, controls, moveRail, onRailKeyDown };
}
