import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import type { ResearchAreaPublic } from "@/lib/types/api";

export interface ResearchPreviewProps {
  areas: ResearchAreaPublic[];
}

/** SEC.02 — problem-to-application editorial stories, not a card grid. */
export function ResearchPreview({ areas }: ResearchPreviewProps) {
  return (
    <section id="research" className="section-pad border-t border-hairline">
      <Container>
        <Reveal>
          <SectionHeader
            index="02"
            code="RESEARCH"
            title="研究方向"
            description="从真实问题出发，把感知、决策与控制带到可以验证的应用现场。"
          />
        </Reveal>

        {areas.length > 0 ? (
          <div className="mt-12 space-y-16 sm:space-y-24">
            {areas.map((area, index) => {
              const project = area.representative_project;
              return (
                <Reveal key={area.id} delay={index * 60}>
                  <article className="grid gap-8 border-t border-hairline pt-8 lg:grid-cols-[88px_minmax(0,5fr)_minmax(18rem,4fr)] lg:gap-10">
                    <div className="font-mono text-sm text-accent">{String(index + 1).padStart(2, "0")}</div>
                    <div className="min-w-0">
                      <h3 className="font-display text-3xl leading-tight font-semibold tracking-[-0.045em] text-ink sm:text-4xl">{area.title}</h3>
                      <div className="mt-8 space-y-7">
                        <StoryBlock label="要解决的问题" text={area.problem_statement?.trim() || area.description} />
                        {area.application_scenarios.length > 0 ? (
                          <div>
                            <p className="font-mono text-[10px] tracking-[0.24em] text-ink-faint uppercase">应用场景</p>
                            <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink sm:grid-cols-2">
                              {area.application_scenarios.map((scenario) => <li key={scenario}>↳ {scenario}</li>)}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {project ? (
                      <div className="lg:sticky lg:top-28 lg:self-start">
                        <Link href={`/projects/${project.slug}`} className="group block">
                          <MediaImage media={project.cover} alt={project.title} mode="cover" className="aspect-[16/10] w-full overflow-hidden border border-hairline bg-white/30" sizes="(min-width: 1024px) 32vw, 92vw" imgClassName="object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
                          <span className="mt-4 block font-mono text-[10px] tracking-[0.22em] text-accent uppercase">代表项目</span>
                          <span className="mt-2 block font-display text-xl font-semibold text-ink">{project.title}</span>
                          {project.summary ? <span className="mt-2 block text-sm leading-6 text-ink-muted">{project.summary}</span> : null}
                        </Link>
                        <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
                          <Link href={`/projects/${project.slug}`} className="hover:text-accent-strong">查看详情 ↗</Link>
                          {project.demo_url ? <a href={project.demo_url} target="_blank" rel="noreferrer noopener" className="hover:text-accent-strong">打开演示 ↗</a> : null}
                        </div>
                      </div>
                    ) : null}
                  </article>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <EmptyState className="mt-10" title="暂无公开的研究方向" hint="研究方向整理中，敬请期待。" />
        )}

        <Reveal delay={120}>
          <Link href="/research" className="mt-10 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase hover:text-accent-strong">
            全部研究方向 <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}

function StoryBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.24em] text-ink-faint uppercase">{label}</p>
      <p className="mt-3 max-w-2xl text-base leading-8 text-ink-muted">{text}</p>
    </div>
  );
}
