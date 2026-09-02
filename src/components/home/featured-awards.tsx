"use client";

import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { useHorizontalRail } from "@/components/motion/use-horizontal-rail";
import { CategoryTag, LevelBadge } from "@/components/ui/badges";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { AwardPublic, MediaPublic } from "@/lib/types/api";

export interface FeaturedAwardsProps {
  /** Only `is_featured` awards (fetched via `featured: true`). */
  awards: AwardPublic[];
}

interface RailMedia {
  media: MediaPublic | null;
  label: string;
  certificate: boolean;
}

function getRailMedia(award: AwardPublic): RailMedia {
  if (award.certificate) {
    return { media: award.certificate, label: "证书原件", certificate: true };
  }
  if (award.cover) {
    return { media: award.cover, label: "现场记录", certificate: false };
  }
  return { media: null, label: "奖项档案", certificate: false };
}

interface RailCardProps {
  award: AwardPublic;
}

function RailCard({ award }: RailCardProps) {
  const media = getRailMedia(award);

  return (
    <Link
      href="/awards"
      className="group glass-panel-strong flex h-full min-h-[28rem] flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow-accent"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden border-b border-hairline bg-white/34">
        {media.media ? (
          <MediaImage
            media={media.media}
            alt={`${award.title} ${media.label}`}
            mode="cover"
            className="h-full w-full"
            sizes="(min-width: 1024px) 42vw, 88vw"
            imgClassName={cn(
              "transition-transform duration-700 group-hover:scale-[1.035]",
              // MediaImage defaults to object-cover; keep the full certificate
              // visible so portrait certificates are never cropped in the rail.
              media.certificate ? "!object-contain bg-white/44 p-8" : "object-cover",
            )}
          />
        ) : (
          <div className="relative grid h-full place-items-center overflow-hidden px-8 text-center">
            <span aria-hidden className="absolute -right-8 -bottom-16 h-48 w-48 rounded-full border border-accent/15" />
            <span aria-hidden className="absolute -left-10 -top-20 h-48 w-48 rounded-full border border-signal/15" />
            <div className="relative">
              <p className="font-mono text-[10px] tracking-[0.3em] text-accent uppercase">NO IMAGE // ARCHIVE</p>
              <p className="mt-3 font-display text-2xl font-semibold text-ink">{award.year}</p>
              <p className="mt-2 text-sm text-ink-muted">影像资料整理中</p>
            </div>
          </div>
        )}
        <span className="absolute top-4 left-4 rounded-full border border-white/80 bg-white/72 px-3 py-1 font-mono text-[10px] tracking-[0.22em] text-ink-muted uppercase backdrop-blur-md">
          {media.label}
        </span>
      </div>

      <span className="flex flex-1 flex-col p-6 sm:p-7">
        <span className="flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
          <span>{formatDate(award.award_date)}</span>
          <span aria-hidden>·</span>
          <LevelBadge level={award.level} />
          <CategoryTag category={award.category} />
        </span>
        <span className="mt-4 block font-display text-2xl leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-3xl">
          {award.title}
        </span>
        <span className="mt-3 block text-sm leading-6 text-ink-muted">
          {award.competition_name}
        </span>
        <span className="mt-auto flex items-center justify-between gap-4 pt-7 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
          <span>{award.issuer}</span>
          <span aria-hidden className="text-accent transition-transform duration-300 group-hover:translate-x-1">↗</span>
        </span>
      </span>
    </Link>
  );
}

/**
 * Manual featured-award rail. Native horizontal overflow deliberately does
 * the work for touch and trackpads; buttons and keyboard shortcuts provide a
 * predictable desktop/focus path without any autoplay timer.
 */
export function FeaturedAwards({ awards }: FeaturedAwardsProps) {
  const { railRef, controls, moveRail, onRailKeyDown } = useHorizontalRail();

  return (
    <section className="section-pad border-t border-hairline">
      <Container width="wide">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <SectionHeader
              index="04"
              code="HONORS"
              title="精选荣誉"
              description="沿着横向档案浏览国家级与省级重要奖项。手动滑动或使用方向键查看下一份记录。"
            />
          </Reveal>
          {awards.length > 1 ? <div className="flex shrink-0 items-center gap-2" aria-label="精选荣誉浏览控制">
            <button
              type="button"
              aria-label="查看上一份精选荣誉"
              aria-controls="featured-awards-rail"
              disabled={!controls.previous}
              onClick={() => moveRail(-1)}
              className="glass-chip grid h-11 w-11 place-items-center p-0 text-lg text-ink transition-[background-color,border-color,opacity] hover:border-accent/50 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <span aria-hidden>←</span>
            </button>
            <button
              type="button"
              aria-label="查看下一份精选荣誉"
              aria-controls="featured-awards-rail"
              disabled={!controls.next}
              onClick={() => moveRail(1)}
              className="glass-chip grid h-11 w-11 place-items-center p-0 text-lg text-ink transition-[background-color,border-color,opacity] hover:border-accent/50 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <span aria-hidden>→</span>
            </button>
          </div> : null}
        </div>

        {awards.length > 0 ? (
          <div
            id="featured-awards-rail"
            ref={railRef}
            tabIndex={0}
            role="region"
            aria-label="精选荣誉横向浏览"
            onKeyDown={onRailKeyDown}
            className="public-rail mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-5 outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:gap-6"
          >
            {awards.map((award, i) => (
              <Reveal
                key={award.id}
                delay={i * 70}
                className="public-rail-item h-auto min-w-[min(88vw,32rem)] snap-start sm:min-w-[min(62vw,42rem)] lg:min-w-[min(48vw,44rem)]"
              >
                <RailCard award={award} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            title="暂无首页精选荣誉"
            hint="管理员设置精选奖项后将展示在这里。"
          />
        )}

        <Reveal delay={120}>
          <Link
            href="/awards"
            className="mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:text-accent-strong"
          >
            查看完整荣誉档案 <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
