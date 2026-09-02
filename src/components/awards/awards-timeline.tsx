"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import {
  AWARD_CATEGORY_LABELS,
  AWARD_LEVEL_LABELS,
  CategoryTag,
  LevelBadge,
} from "@/components/ui/badges";
import { MediaImage } from "@/components/ui/media-image";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import {
  AWARD_CATEGORIES,
  AWARD_LEVELS,
  type AwardCategory,
  type AwardLevel,
  type AwardPublic,
} from "@/lib/types/api";

export interface AwardsTimelineProps {
  /** Visible awards, already sorted `date_desc` upstream. */
  awards: AwardPublic[];
}

type LevelFilter = AwardLevel | "all";
type CategoryFilter = AwardCategory | "all";

interface FilterRowProps<T extends string> {
  label: string;
  options: ReadonlyArray<readonly [T, string]>;
  active: T;
  onChange: (value: T) => void;
}

function FilterRow<T extends string>({
  label,
  options,
  active,
  onChange,
}: FilterRowProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`按${label}筛选`}>
      <span className="mr-1 font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase">
        {label}
      </span>
      {options.map(([value, text]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={active === value}
          className={cn(
            "rounded-hud border px-3 py-1.5 font-mono text-xs transition-colors",
            active === value
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-hairline text-ink-muted hover:border-hairline-strong hover:text-ink",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

interface AwardItemProps {
  award: AwardPublic;
  delay: number;
  priority?: boolean;
}

interface AwardMedia {
  media: NonNullable<AwardPublic["certificate"]>;
  label: string;
  portrait: boolean;
}

function AwardItem({ award, delay, priority = false }: AwardItemProps) {
  const media: AwardMedia[] = [];
  if (award.certificate) {
    media.push({ media: award.certificate, label: "证书", portrait: true });
  }
  if (award.cover) {
    media.push({ media: award.cover, label: "现场 / 项目", portrait: false });
  }

  return (
    <li>
      <Reveal delay={delay}>
        <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-ink-faint">
              <span>{formatDate(award.award_date)}</span>
              <LevelBadge level={award.level} />
              <CategoryTag category={award.category} />
              {award.is_featured ? (
                <span className="text-signal" title="精选荣誉">
                  ★
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 font-display text-2xl font-semibold">
              {award.title}
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              {award.competition_name} · 颁发：{award.issuer}
            </p>
            <p className="mt-4 max-w-2xl leading-7 text-ink-muted">
              {award.description}
            </p>
          </div>

          {media.length > 0 ? (
            <div
              className={cn(
                "grid gap-3",
                media.length > 1 ? "grid-cols-2" : "max-w-[260px]",
              )}
            >
              {media.map((item) => (
                <figure key={item.label}>
                  <MediaImage
                    media={item.media}
                    alt={`${award.title} ${item.label}`}
                    mode="cover"
                    className={cn(
                      "border border-hairline",
                      item.portrait ? "aspect-[5/7]" : "aspect-[4/3]",
                    )}
                    sizes="(min-width: 1024px) 260px, 42vw"
                    priority={priority}
                    imgClassName="object-cover"
                  />
                  <figcaption className="mt-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
                    {item.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div
              aria-hidden
              className="grid aspect-[4/3] place-items-center border border-hairline bg-surface lg:max-w-[260px]"
            >
              <span className="font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase">
                NO MEDIA
              </span>
            </div>
          )}
        </article>
      </Reveal>
    </li>
  );
}

/**
 * Editorial scroll timeline grouped by year (descending), with sticky year
 * markers on desktop and presentation-side level/category filters.
 */
export function AwardsTimeline({ awards }: AwardsTimelineProps) {
  const [level, setLevel] = useState<LevelFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const filtered = useMemo(
    () =>
      awards.filter(
        (award) =>
          (level === "all" || award.level === level) &&
          (category === "all" || award.category === category),
      ),
    [awards, level, category],
  );

  const groups = useMemo(() => {
    const byYear = new Map<number, AwardPublic[]>();
    for (const award of filtered) {
      const list = byYear.get(award.year) ?? [];
      list.push(award);
      byYear.set(award.year, list);
    }
    return [...byYear.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  const levelOptions: ReadonlyArray<readonly [LevelFilter, string]> = [
    ["all", "全部"],
    ...AWARD_LEVELS.map(
      (l) => [l, AWARD_LEVEL_LABELS[l]] as const,
    ),
  ];
  const categoryOptions: ReadonlyArray<readonly [CategoryFilter, string]> = [
    ["all", "全部"],
    ...AWARD_CATEGORIES.map(
      (c) => [c, AWARD_CATEGORY_LABELS[c]] as const,
    ),
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 border-y border-hairline py-5 lg:flex-row lg:items-center lg:justify-between">
        <FilterRow
          label="级别"
          options={levelOptions}
          active={level}
          onChange={setLevel}
        />
        <FilterRow
          label="类别"
          options={categoryOptions}
          active={category}
          onChange={setCategory}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="没有符合条件的奖项"
          hint="试试清除筛选条件。"
        />
      ) : (
        <div>
          {groups.map(([year, items], groupIndex) => (
            <section
              key={year}
              aria-label={`${year} 年奖项`}
              className="border-b border-hairline py-12 last:border-b-0 lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-10"
            >
              <header className="mb-8 lg:sticky lg:top-28 lg:mb-0 lg:self-start">
                <p className="font-display text-6xl font-semibold text-outline-faint lg:text-7xl">
                  {year}
                </p>
                <p className="mt-2 font-mono text-[11px] tracking-[0.3em] text-ink-faint uppercase">
                  {items.length} AWARDS
                </p>
              </header>
              <ol className="space-y-12">
                {items.map((award, i) => (
                  <AwardItem
                    key={award.id}
                    award={award}
                    delay={(i % 3) * 80}
                    priority={groupIndex === 0 && i === 0}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
