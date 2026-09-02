import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/projects/project-card";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/states";
import type { ProjectPublic } from "@/lib/types/api";

export interface FeaturedProjectsProps {
  projects: ProjectPublic[];
}

/** SEC.03 — imagery-primary featured project grid. */
export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  return (
    <section className="section-pad border-t border-hairline">
      <Container width="wide">
        <Reveal>
          <SectionHeader
            index="03"
            code="PROJECTS"
            title="精选项目"
            description="图像优先的在研项目切片，按策展顺序呈现。"
          />
        </Reveal>

        {projects.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, i) => (
              <Reveal key={project.id} delay={i * 90} className="h-full">
                <ProjectCard project={project} priority={i === 0} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="暂无精选项目"
            hint="项目发布后将展示在这里。"
          />
        )}

        <Reveal delay={140}>
          <Link
            href="/projects"
            className="mt-8 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-accent uppercase transition-colors hover:text-accent-strong"
          >
            全部项目 <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
