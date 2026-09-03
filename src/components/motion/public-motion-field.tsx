"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  GravityMotionContext,
  useGravityMotion,
} from "./use-gravity-motion";

export interface PublicMotionFieldProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Public-only shell and decorative artwork. The artwork is deliberately CSS
 * geometry and light rather than a fluid simulation, keeping one small motion
 * loop while preserving a quiet, readable surface for content.
 */
export function PublicMotionField({ children, className, ...rest }: PublicMotionFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const motion = useGravityMotion(rootRef);

  return (
    <GravityMotionContext.Provider value={motion}>
      <div
        ref={rootRef}
        className={cn(
          "public-site relative isolate flex min-h-full flex-1 flex-col overflow-x-clip",
          className,
        )}
        {...rest}
      >
        <div aria-hidden className="public-artwork pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="public-artwork-glow public-motion-layer public-motion-layer-blue" />
          <div className="public-artwork-glow public-motion-layer public-motion-layer-pink" />
          <div className="public-artwork-grid" />
          <div className="public-artwork-word">ROBOTICS LAB</div>
          <div className="public-artwork-lens public-motion-layer public-motion-layer-lens-one" />
          <div className="public-artwork-lens public-motion-layer public-motion-layer-lens-two" />
        </div>
        <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
      </div>
    </GravityMotionContext.Provider>
  );
}
