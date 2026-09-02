"use client";

import { useGravityMotionContext } from "./use-gravity-motion";

/**
 * Optional mobile-only sensor affordance. It is intentionally rendered only
 * after capability detection and never prompts until the user activates it.
 */
export function DeviceOrientationControl() {
  const {
    orientationAvailable,
    orientationStatus,
    canEnableOrientation,
    requestOrientation,
  } = useGravityMotionContext();

  if (!orientationAvailable || orientationStatus === "reduced") return null;

  if (orientationStatus === "granted") {
    return (
      <span
        role="status"
        aria-label="动态玻璃已启用"
        className="glass-chip inline-flex items-center gap-2 text-xs"
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent shadow-glow-accent" />
        动态玻璃已启用
      </span>
    );
  }

  if (!canEnableOrientation && orientationStatus !== "denied") return null;

  const denied = orientationStatus === "denied";
  return (
    <div className="flex flex-col items-center gap-2 sm:items-start">
      <button
        type="button"
        onClick={() => void requestOrientation()}
        className="glass-chip group inline-flex items-center gap-2 text-xs font-medium text-ink transition-[background-color,border-color,box-shadow,transform] hover:border-accent/50 hover:bg-white/75 hover:shadow-glow-accent"
      >
        <span aria-hidden className="text-accent">◌</span>
        {denied ? "重新启用动态玻璃" : "启用动态玻璃"}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
      </button>
      <span className="text-center text-[11px] text-ink-faint sm:text-left">
        {denied ? "已切回滚动模式，可稍后重试" : "移动设备可选 · 不影响正常浏览"}
      </span>
    </div>
  );
}
