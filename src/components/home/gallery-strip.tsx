import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import type { GalleryItem } from "@/lib/media";

export interface GalleryStripProps {
  items: GalleryItem[];
}

/**
 * SEC.06 — media strip. The contract has no public media endpoint, so the
 * gallery is composed upstream (in the home page) from covers of published
 * projects/awards/news, deduped by media id. Each tile links back to the
 * source content page.
 */
export function GalleryStrip({ items }: GalleryStripProps) {
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
                  className="group relative block overflow-hidden border border-hairline"
                >
                  <MediaImage
                    media={item.media}
                    alt={item.title}
                    mode="cover"
                    className="aspect-square w-full"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    imgClassName="transition-transform duration-700 group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-background/85 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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
