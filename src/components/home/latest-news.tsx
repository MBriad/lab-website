import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { formatDate } from "@/lib/format";
import type { NewsPublic } from "@/lib/types/api";

export interface LatestNewsProps {
  news: NewsPublic[];
}

/** SEC.05 — three latest published updates. */
export function LatestNews({ news }: LatestNewsProps) {
  return (
    <section className="section-pad border-t border-hairline">
      <Container width="wide">
        <Reveal>
          <SectionHeader index="05" code="NEWS" title="最新动态" />
        </Reveal>

        {news.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {news.map((item, i) => (
              <Reveal key={item.id} delay={i * 90} className="h-full">
                <Link
                  href={`/news/${item.slug}`}
                  className="group flex h-full flex-col border border-hairline bg-surface transition-colors hover:border-accent/40"
                >
                  {item.cover ? (
                    <MediaImage
                      media={item.cover}
                      alt={item.title}
                      mode="cover"
                      className="aspect-video w-full"
                      sizes="(min-width: 768px) 33vw, 100vw"
                      imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <span className="flex flex-1 flex-col p-5">
                    <span className="font-mono text-[10px] tracking-[0.25em] text-ink-faint uppercase">
                      {item.published_at ? formatDate(item.published_at) : "未标注"}
                    </span>
                    <span className="mt-2 block font-display text-lg leading-6 font-semibold line-clamp-2">
                      {item.title}
                    </span>
                    {item.excerpt ? (
                      <span className="mt-2 block text-sm leading-6 text-ink-muted line-clamp-2">
                        {item.excerpt}
                      </span>
                    ) : null}
                    <span className="mt-auto pt-4 font-mono text-xs text-accent">
                      阅读全文 →
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="暂无最新动态"
            hint="新闻发布后将展示在这里。"
          />
        )}

        <Reveal delay={120}>
          <Link
            href="/news"
            className="mt-8 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:text-accent-strong"
          >
            全部动态 <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
