import { cn } from "@/lib/cn";

export interface AdminSkeletonProps {
  className?: string;
}

/** Loading placeholder block for admin tables/cards (token-styled). */
export function AdminSkeleton({ className }: AdminSkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-hud bg-surface-2/70", className)}
    />
  );
}

export interface AdminSkeletonRowsProps {
  rows?: number;
  className?: string;
}

/** Stacked row placeholders for list/table loading states. */
export function AdminSkeletonRows({
  rows = 5,
  className,
}: AdminSkeletonRowsProps) {
  return (
    <div aria-hidden className={cn("space-y-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <AdminSkeleton
          key={i}
          className={cn("h-10 w-full", i % 2 === 1 && "opacity-70")}
        />
      ))}
    </div>
  );
}
