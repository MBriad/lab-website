import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { LevelBadge } from "@/components/ui/badges";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import type { AwardPublic } from "@/lib/types/api";

export interface FeaturedAwardsProps {
  /** Only `is_featured` awards (fetched via `featured: true`). */
  awards: AwardPublic[];
}

/** SEC.04 — compact editorial teaser of featured awards. */
export function FeaturedAwards({ awards }: FeaturedAwardsProps) {
  return (
    <section className="section-pad border-t border-hairline">
      <Container>
        <Reveal>
          <SectionHeader index="04" code="HONORS" title="精选荣誉" />
        </Reveal>

        {awards.length > 0 ? (
          <div className="mt-8 border-t border-hairline">
            {awards.map((award, i) => (
              <Reveal key={award.id} delay={i * 70}>
                <Link
                  href="/awards"
                  className="group grid gap-3 border-b border-hairline py-5 transition-colors hover:bg-surface/60 sm:grid-cols-[90px_auto_minmax(0,1fr)_64px_auto] sm:items-center sm:gap-6 sm:px-2"
                >
                  <span className="font-mono text-sm text-ink-faint">{award.year}</span>
                  <LevelBadge level={award.level} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{award.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-faint">
                      {award.competition_name} · 颁发：{award.issuer}
                    </span>
                  </span>
                  {award.certificate ?? award.cover ? (
                    <MediaImage
                      media={award.certificate ?? award.cover}
                      alt={`${award.title} ${award.certificate ? "证书" : "现场"}`}
                      mode="cover"
                      className="h-16 w-16 border border-hairline"
                      sizes="64px"
                    />
                  ) : (
                    <span aria-hidden className="hidden h-16 w-16 sm:block" />
                  )}
                  <span
                    aria-hidden
                    className="hidden font-mono text-accent opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 sm:block"
                  >
                    →
                  </span>
                </Link>
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
            className="mt-8 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:text-accent-strong"
          >
            全部荣誉 <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
