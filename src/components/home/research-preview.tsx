import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import type { ResearchAreaPublic } from "@/lib/types/api";

export interface ResearchPreviewProps {
  areas: ResearchAreaPublic[];
}

/** SEC.02 — editorial index rows (not a card grid) linking to /research. */
export function ResearchPreview({ areas }: ResearchPreviewProps) {
  return (
    <section id="research" className="section-pad border-t border-hairline">
      <Container>
        <Reveal>
          <SectionHeader
            index="02"
            code="RESEARCH"
            title="研究方向"
            description="围绕机器人智能的核心问题域，持续深耕基础研究与应用落地。"
          />
        </Reveal>

        {areas.length > 0 ? (
          <div className="mt-10 border-t border-hairline">
            {areas.map((area, i) => (
              <Reveal key={area.id} delay={i * 70}>
                <Link
                  href="/research"
                  className="group grid gap-1.5 border-b border-hairline py-6 transition-colors hover:bg-surface/60 sm:grid-cols-[72px_1fr_auto] sm:items-baseline sm:gap-6 sm:px-2"
                >
                  <span className="font-mono text-sm text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="font-display text-xl font-semibold sm:text-2xl">
                      {area.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-ink-muted sm:line-clamp-1">
                      {area.description}
                    </span>
                  </span>
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
            className="mt-10"
            title="暂无公开的研究方向"
            hint="研究方向整理中，敬请期待。"
          />
        )}

        <Reveal delay={120}>
          <Link
            href="/research"
            className="mt-8 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:text-accent-strong"
          >
            全部研究方向 <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
