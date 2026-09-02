import { cn } from "@/lib/cn";
import type { AwardCategory, AwardLevel } from "@/lib/types/api";

/** Chinese display labels for the contract's `AwardLevel` enum. */
export const AWARD_LEVEL_LABELS: Record<AwardLevel, string> = {
  national: "国家级",
  provincial: "省级",
  municipal: "市级",
  university: "校级",
  other: "其他",
};

/** Chinese display labels for the contract's `AwardCategory` enum. */
export const AWARD_CATEGORY_LABELS: Record<AwardCategory, string> = {
  competition: "竞赛",
  research: "科研",
  innovation: "创新",
  honor: "荣誉",
  other: "其他",
};

const LEVEL_STYLES: Record<AwardLevel, string> = {
  national: "border-signal/50 bg-signal/10 text-signal",
  provincial: "border-accent/50 bg-accent/10 text-accent",
  municipal: "border-accent-deep/70 text-ink-muted",
  university: "border-hairline-strong text-ink-muted",
  other: "border-hairline text-ink-faint",
};

export interface LevelBadgeProps {
  level: AwardLevel;
  className?: string;
}

/** Award level chip (国家级/省级/市级/校级/其他). */
export function LevelBadge({ level, className }: LevelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-hud border px-2 py-0.5 font-mono text-[11px] tracking-wider whitespace-nowrap",
        LEVEL_STYLES[level],
        className,
      )}
    >
      {AWARD_LEVEL_LABELS[level]}
    </span>
  );
}

export interface CategoryTagProps {
  category: AwardCategory;
  className?: string;
}

/** Award category tag (竞赛/科研/创新/荣誉/其他). */
export function CategoryTag({ category, className }: CategoryTagProps) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] tracking-widest text-ink-faint",
        className,
      )}
    >
      {AWARD_CATEGORY_LABELS[category]}
    </span>
  );
}
