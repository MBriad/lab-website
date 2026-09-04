"use client";

import Link from "next/link";
import { InteractiveMedia } from "@/components/motion/interactive-media";
import { Reveal } from "@/components/motion/reveal";
import { useHorizontalRail } from "@/components/motion/use-horizontal-rail";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import type { GalleryItemPublic } from "@/lib/types/api";

export interface GalleryStripProps {
  items: GalleryItemPublic[];
}

function GalleryRailCard({ item }: { item: GalleryItemPublic }) {
  return (
    <article
      aria-label={`影像记录：${item.title}`}
      className="group glass-panel-strong flex h-full min-h-[25rem] flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow-accent"
    >
      <InteractiveMedia
        maxTiltDeg={3.8}
        maxShiftPx={3}
        className="relative aspect-[16/10] w-full shrink-0 border border-hairline bg-white/32"
      >
        <MediaImage
          media={item.media}
          alt={item.title}
          mode="cover"
          className="h-full w-full"
          sizes="(min-width: 1024px) 44vw, 88vw"
          imgClassName="object-cover scale-[1.04] transition-transform duration-700 group-hover:scale-[1.075]"
        />
      </InteractiveMedia>
      <span className="flex flex-1 flex-col p-6 sm:p-7">
        <span className="font-mono text-[10px] tracking-[0.24em] text-accent uppercase">
          影像记录 / VISUAL ARCHIVE
        </span>
        <span className="mt-4 block font-display text-2xl leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-3xl">
          {item.title}
        </span>
        {item.description ? (
          <span className="mt-3 line-clamp-2 text-sm leading-6 text-ink-muted">
            {item.description}
          </span>
        ) : null}
        <span className="mt-auto flex items-center justify-between gap-4 pt-7 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
          <span>实验室视觉档案</span>
          <span
            aria-hidden
            className="text-accent transition-transform duration-300 group-hover:translate-x-1"
          >
            ↗
          </span>
        </span>
      </span>
    </article>
  );
}

function GalleryRail({ items }: GalleryStripProps) {
  const { railRef, controls, moveRail, onRailKeyDown } = useHorizontalRail();

  return (
    <section className="section-pad overflow-hidden border-t border-hairline">
      <Container width="wide">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <SectionHeader
              index="06"
              code="GALLERY"
              title="影像记录"
              description="从项目研发、赛事现场到实验室日常的视觉档案。"
            />
          </Reveal>
          {items.length > 1 ? (
            <div
              className="flex shrink-0 items-center gap-2"
              aria-label="影像记录轮播控制"
            >
              <button
                type="button"
                aria-label="查看上一条影像记录"
                aria-controls="gallery-rail"
                disabled={!controls.previous}
                onClick={() => moveRail(-1)}
                className="glass-chip grid h-11 w-11 place-items-center p-0 text-lg text-ink transition-[background-color,border-color,opacity] hover:border-accent/50 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span aria-hidden>←</span>
              </button>
              <button
                type="button"
                aria-label="查看下一条影像记录"
                aria-controls="gallery-rail"
                disabled={!controls.next}
                onClick={() => moveRail(1)}
                className="glass-chip grid h-11 w-11 place-items-center p-0 text-lg text-ink transition-[background-color,border-color,opacity] hover:border-accent/50 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span aria-hidden>→</span>
              </button>
            </div>
          ) : null}
        </div>

        <div
          id="gallery-rail"
          ref={railRef}
          tabIndex={0}
          role="region"
          aria-label="影像记录轮播"
          onKeyDown={onRailKeyDown}
          className="public-rail mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-5 outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:gap-6"
        >
          {items.map((item, index) => (
            <Reveal
              key={item.id}
              delay={index * 70}
              className="public-rail-item h-auto min-w-[min(88vw,32rem)] snap-start sm:min-w-[min(62vw,42rem)] lg:min-w-[min(48vw,44rem)]"
            >
              <GalleryRailCard item={item} />
            </Reveal>
          ))}
        </div>
        <div className="mt-2 flex justify-end">
          <Link
            href="/gallery"
            className="font-mono text-xs tracking-[0.2em] text-accent uppercase transition-transform hover:translate-x-1"
          >
            查看完整影像记录 →
          </Link>
        </div>
      </Container>
    </section>
  );
}

/** SEC.06 — independent visual archive backed by the gallery API. */
export function GalleryStrip({ items }: GalleryStripProps) {
  if (items.length > 0) {
    return <GalleryRail items={items} />;
  }

  return (
    <section className="section-pad overflow-hidden border-t border-hairline">
      <Container width="wide">
        <Reveal>
          <SectionHeader
            index="06"
            code="GALLERY"
            title="影像记录"
            description="来自实验室独立管理的现场切片。"
          />
        </Reveal>
        <EmptyState
          className="mt-10"
          title="暂无影像记录"
          hint="管理员在影像记录中绑定素材后将展示在这里。"
        />
      </Container>
    </section>
  );
}
