import { cn } from "@/lib/cn";

export interface SkeletonProps {
  className?: string;
}

/** Token-styled loading placeholder block (matches panel/radius tokens). */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-hud bg-surface-2/60", className)}
    />
  );
}

export interface SkeletonLinesProps {
  rows?: number;
  className?: string;
}

/** Stacked text-line placeholders. */
export function SkeletonLines({ rows = 3, className }: SkeletonLinesProps) {
  return (
    <div aria-hidden className={cn("space-y-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === rows - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
