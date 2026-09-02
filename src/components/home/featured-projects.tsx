"use client";

import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { useHorizontalRail } from "@/components/motion/use-horizontal-rail";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import { formatDate } from "@/lib/format";
import type { ProjectPublic } from "@/lib/types/api";

export interface FeaturedProjectsProps {
  projects: ProjectPublic[];
}

interface ProjectRailCardProps {
  project: ProjectPublic;
}

function ProjectRailCard({ project }: ProjectRailCardProps) {
  return (
    <TiltCard className="h-full">
      <article className="glass-panel-strong group flex h-full min-h-[29rem] flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow-accent">
        <Link href={`/projects/${project.slug}`} className="block focus-visible:outline-offset-[-4px]">
          <MediaImage
            media={project.cover}
            alt={project.title}
            mode="cover"
            className="aspect-[16/10] w-full shrink-0 border-b border-hairline bg-white/34"
            sizes="(min-width: 1280px) 44vw, (min-width: 640px) 68vw, 88vw"
            imgClassName="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
        </Link>
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.25em] text-ink-faint uppercase">
            <span>PROJECT / {String(project.sort_order).padStart(2, "0")}</span>
            {project.published_at ? <span>{formatDate(project.published_at)}</span> : null}
          </div>
          <Link href={`/projects/${project.slug}`} className="mt-5 block font-display text-2xl leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-3xl">
            {project.title}
          </Link>
          <p className="mt-3 text-sm leading-6 text-ink-muted line-clamp-3">{project.summary ?? project.description}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8 font-mono text-xs tracking-[0.2em] text-accent uppercase">
            <Link href={`/projects/${project.slug}`} className="hover:text-accent-strong">查看项目详情 ↗</Link>
            {project.demo_url ? <a href={project.demo_url} target="_blank" rel="noreferrer noopener" className="hover:text-accent-strong">打开演示 ↗</a> : null}
          </div>
        </div>
      </article>
    </TiltCard>
  );
}

/** SEC.03 — image-led manual rail over the first public projects in sort order. */
export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  const { railRef, controls, moveRail, onRailKeyDown } = useHorizontalRail();

  return (
    <section className="section-pad border-t border-hairline">
      <Container width="wide">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <SectionHeader
              index="03"
              code="PROJECTS"
              title="精选项目"
              description="沿着横向项目档案，查看实验室正在推进的真实问题与工程实践。"
            />
          </Reveal>
          {projects.length > 1 ? <div className="flex shrink-0 items-center gap-2" aria-label="精选项目浏览控制">
            <button
              type="button"
              aria-label="查看上一个精选项目"
              aria-controls="featured-projects-rail"
              disabled={!controls.previous}
              onClick={() => moveRail(-1)}
              className="glass-chip grid h-11 w-11 place-items-center p-0 text-lg text-ink transition-[background-color,border-color,opacity] hover:border-accent/50 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <span aria-hidden>←</span>
            </button>
            <button
              type="button"
              aria-label="查看下一个精选项目"
              aria-controls="featured-projects-rail"
              disabled={!controls.next}
              onClick={() => moveRail(1)}
              className="glass-chip grid h-11 w-11 place-items-center p-0 text-lg text-ink transition-[background-color,border-color,opacity] hover:border-accent/50 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <span aria-hidden>→</span>
            </button>
          </div> : null}
        </div>

        {projects.length > 0 ? (
          <div
            id="featured-projects-rail"
            ref={railRef}
            tabIndex={0}
            role="region"
            aria-label="精选项目横向浏览"
            onKeyDown={onRailKeyDown}
            className="public-rail mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-5 outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:gap-6"
          >
            {projects.map((project, i) => (
              <Reveal
                key={project.id}
                delay={i * 70}
                className="public-rail-item h-auto min-w-[min(88vw,32rem)] snap-start sm:min-w-[min(68vw,46rem)] lg:min-w-[min(48vw,48rem)]"
              >
                <ProjectRailCard project={project} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState className="mt-10" title="暂无精选项目" hint="项目发布后将展示在这里。" />
        )}

        <Reveal delay={140}>
          <Link
            href="/projects"
            className="mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:text-accent-strong"
          >
            全部项目 <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
