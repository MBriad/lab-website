import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `content` (default): max-w-5xl measure for text-heavy sections.
   * `wide`: max-w-7xl for grids/galleries.
   */
  width?: "content" | "wide";
}

/**
 * Shared page-width wrapper with responsive horizontal padding.
 * Use for every top-level section so gutters stay consistent.
 */
export function Container({
  width = "content",
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        width === "wide" ? "max-w-7xl" : "max-w-5xl",
        className,
      )}
      {...props}
    />
  );
}
