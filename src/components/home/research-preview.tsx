import Link from "next/link";
import { InteractiveMedia } from "@/components/motion/interactive-media";
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
                          <div className="research-scenarios">
                            <p className="font-mono text-[10px] tracking-[0.24em] text-ink-faint uppercase">应用场景</p>
                            <ul className="research-scenario-list mt-4">
                              {area.application_scenarios.map((scenario, scenarioIndex) => (
                                <li key={scenario} className="research-scenario-item">
                                  <span className="research-scenario-index">0{scenarioIndex + 1}</span>
                                  <span className="research-scenario-copy">{scenario}</span>
                                  <span className="research-scenario-dot" aria-hidden />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
                      {project ? (
                        <>
                          <Link href={`/projects/${project.slug}`} className="group block">
                            <InteractiveMedia
                              maxTiltDeg={3.5}
                              className="aspect-[16/10] w-full border border-hairline bg-white/30"
                            >
                              <MediaImage
                                media={project.cover}
                                alt={project.title}
                                mode="cover"
                                className="h-full w-full"
                                sizes="(min-width: 1024px) 32vw, 92vw"
                                imgClassName="object-cover"
                              />
                            </InteractiveMedia>
                            <span className="mt-4 block font-mono text-[10px] tracking-[0.22em] text-accent uppercase">代表项目</span>
                            <span className="mt-2 block font-display text-xl font-semibold text-ink">{project.title}</span>
                            {project.summary ? <span className="mt-2 block text-sm leading-6 text-ink-muted">{project.summary}</span> : null}
                          </Link>
                          <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
                            <Link href={`/projects/${project.slug}`} className="hover:text-accent-strong">查看详情 ↗</Link>
                            {project.demo_url ? <a href={project.demo_url} target="_blank" rel="noreferrer noopener" className="hover:text-accent-strong">打开演示 ↗</a> : null}
                          </div>
                        </>
                      ) : null}
                      <ResearchSignalPanel area={area} index={index} />
                    </div>
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

function ResearchSignalPanel({
  area,
  index,
}: {
  area: ResearchAreaPublic;
  index: number;
}) {
  const scenarios = area.application_scenarios.slice(0, 4);
  const scopeCount = String(scenarios.length).padStart(2, "0");
  const steps = getResearchSteps(area.slug);

  return (
    <div className="research-workbench relative overflow-hidden rounded-panel border border-hairline bg-white/35 p-5 sm:p-6">
      <div className="research-workbench-grid" aria-hidden />
      <div className="research-workbench-glow" aria-hidden />
      <div className="relative z-10">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.22em] text-ink-faint uppercase">
          <span>RESEARCH PATH / {String(index + 1).padStart(2, "0")}</span>
          <span className="text-accent">ACTIVE</span>
        </div>

        <div className="research-workbench-title mt-6 border-y border-hairline py-4">
          <p className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">{area.slug}</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="font-display text-2xl leading-none font-semibold tracking-[-0.045em] text-ink">从构建到现场</p>
            <span className="font-display text-4xl leading-none font-semibold text-accent">{scopeCount}</span>
          </div>
        </div>

        <ol className="research-workbench-steps mt-5" aria-label="研发路径">
          {steps.map((step, stepIndex) => (
            <li key={step} className="research-workbench-step">
              <span className="font-mono text-[10px] tracking-[0.18em] text-accent">0{stepIndex + 1}</span>
              <span className="font-display text-sm leading-5 font-semibold tracking-[-0.03em] text-ink">{step}</span>
              {stepIndex < steps.length - 1 ? <span className="research-workbench-line" aria-hidden /> : <span className="research-workbench-end" aria-hidden />}
            </li>
          ))}
        </ol>

        <div className="mt-5 border-t border-hairline pt-4">
          <p className="font-mono text-[10px] tracking-[0.24em] text-ink-faint uppercase">验证场景 / FIELD DEPLOYMENT</p>
        </div>

        {scenarios.length > 0 ? (
          <ul className="research-workbench-scenarios mt-3 text-sm leading-6 text-ink-muted">
            {scenarios.map((scenario, scenarioIndex) => (
              <li key={scenario} className="flex gap-3">
                <span className="font-mono text-[10px] tracking-[0.18em] text-accent">0{scenarioIndex + 1}</span>
                <span>{scenario}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function getResearchSteps(slug: string): readonly [string, string, string] {
  if (slug.includes("hardware")) return ["原理图", "PCB 与调试", "系统联调"];
  if (slug.includes("software")) return ["架构设计", "编译与调试", "部署运行"];
  if (slug.includes("competition")) return ["方案设计", "整机集成", "赛场验证"];
  return ["问题定义", "系统构建", "现场验证"];
}

function StoryBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.24em] text-ink-faint uppercase">{label}</p>
      <p className="mt-3 max-w-2xl text-base leading-8 text-ink-muted">{text}</p>
    </div>
  );
}
