"use client";

import Link from "next/link";
import { InteractiveMedia } from "@/components/motion/interactive-media";
import { Reveal } from "@/components/motion/reveal";
import { useHorizontalRail } from "@/components/motion/use-horizontal-rail";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import type { GalleryItem } from "@/lib/media";

export interface GalleryStripProps {
  items: GalleryItem[];
}

function GalleryRailCard({ item }: { item: GalleryItem }) {
  return (
    <Link
      href={item.href}
      aria-label={`查看${item.source}：${item.title}`}
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
        <span className="font-mono text-[10px] tracking-[0.24em] text-accent uppercase">{item.source} / VISUAL ARCHIVE</span>
        <span className="mt-4 block font-display text-2xl leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-3xl">{item.title}</span>
        <span className="mt-auto flex items-center justify-between gap-4 pt-7 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
          <span>查看记录</span>
          <span aria-hidden className="text-accent transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </span>
    </Link>
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
            <div className="flex shrink-0 items-center gap-2" aria-label="影像记录轮播控制">
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
              key={item.media.id}
              delay={index * 70}
              className="public-rail-item h-auto min-w-[min(88vw,32rem)] snap-start sm:min-w-[min(62vw,42rem)] lg:min-w-[min(48vw,44rem)]"
            >
              <GalleryRailCard item={item} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/**
 * SEC.06 — media strip. The contract has no public media endpoint, so the
 * gallery is composed upstream (in the home page) from covers of published
 * projects/awards/news, deduped by media id. Each tile links back to the
 * source content page.
 */
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
            description="来自项目、荣誉与新闻的现场切片。"
          />
        </Reveal>

        {items.length === 0 ? (
          <EmptyState className="mt-10" title="暂无影像记录" hint="项目、荣誉或新闻配图发布后将展示在这里。" />
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <Reveal
                key={item.media.id}
                delay={(i % 4) * 80}
                variant={i % 2 === 0 ? "rise" : "fade"}
              >
                <Link
                  href={item.href}
                  aria-label={`查看${item.source}：${item.title}`}
                  className="glass-panel-strong group relative block overflow-hidden transition-[border-color,box-shadow] duration-500 hover:border-accent/40 hover:shadow-glow-accent"
                >
                  <InteractiveMedia
                    maxTiltDeg={5.5}
                    maxShiftPx={3}
                    className="aspect-square w-full bg-white/32"
                  >
                    <MediaImage
                      media={item.media}
                      alt={item.title}
                      mode="cover"
                      className="h-full w-full"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      imgClassName="object-cover"
                    />
                  </InteractiveMedia>
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-white/92 via-white/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <span className="absolute inset-x-3 bottom-3 translate-y-2 font-mono text-[10px] tracking-widest text-ink uppercase opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {item.title}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
