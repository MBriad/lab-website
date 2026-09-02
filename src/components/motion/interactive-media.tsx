"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TiltCard, type TiltCardProps } from "./tilt-card";

export interface InteractiveMediaProps
  extends Omit<TiltCardProps, "children"> {
  children: ReactNode;
  /** Clips the depth layer and HUD overlays to the media frame. */
  clip?: boolean;
  frameClassName?: string;
  depthClassName?: string;
}

/**
 * Catime-inspired image stage built on the shared pointer-tilt primitive.
 *
 * The outer plane follows the pointer while the inner image moves at a
 * shallower depth and breathes only while hovered. Decorative light, scan,
 * and grid layers make the response legible without obscuring the media.
 * Motion is automatically static for reduced-motion and coarse-pointer users.
 */
export function InteractiveMedia({
  children,
  clip = true,
  frameClassName,
  depthClassName,
  className,
  maxTiltDeg = 4.5,
  maxShiftPx = 4,
  hoverScale = 1.008,
  ...props
}: InteractiveMediaProps) {
  return (
    <TiltCard
      maxTiltDeg={maxTiltDeg}
      maxShiftPx={maxShiftPx}
      hoverScale={hoverScale}
      className={cn("public-interactive-media relative isolate", className)}
      {...props}
    >
      <div
        className={cn(
          "public-interactive-media-frame relative h-full w-full",
          clip && "overflow-hidden",
          frameClassName,
        )}
      >
        <div
          className={cn(
            "public-interactive-media-depth h-full w-full",
            depthClassName,
          )}
        >
          {children}
        </div>
        <span aria-hidden className="public-interactive-media-grid" />
        <span aria-hidden className="public-interactive-media-sheen" />
        <span aria-hidden className="public-interactive-media-scan" />
        <span aria-hidden className="public-interactive-media-corner public-interactive-media-corner-a" />
        <span aria-hidden className="public-interactive-media-corner public-interactive-media-corner-b" />
      </div>
    </TiltCard>
  );
}
