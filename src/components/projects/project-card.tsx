import Link from "next/link";
import { TiltCard } from "@/components/motion/tilt-card";
import { MediaImage } from "@/components/ui/media-image";
import { formatDate } from "@/lib/format";
import type { ProjectPublic } from "@/lib/types/api";

export interface ProjectCardProps {
  project: ProjectPublic;
  /** Above-the-fold first item only. */
  priority?: boolean;
}

/**
 * Image-led project card shared by the home featured grid and the
 * /projects list. TiltCard provides pointer tilt on capable devices and
 * degrades to a static panel everywhere else.
 */
export function ProjectCard({ project, priority = false }: ProjectCardProps) {
  return (
    <TiltCard className="h-full">
      <Link
        href={`/projects/${project.slug}`}
        className="glass-panel-strong group flex h-full flex-col overflow-hidden transition-[border-color,box-shadow] duration-500 hover:border-accent/40 hover:shadow-glow-accent"
      >
        <MediaImage
          media={project.cover}
          alt={project.title}
          mode="cover"
          className="aspect-[3/2] w-full border-b border-hairline bg-white/34"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          priority={priority}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="flex flex-1 flex-col p-5">
          <span className="font-mono text-[10px] tracking-[0.25em] text-ink-faint uppercase">
            NO.{String(project.sort_order).padStart(2, "0")}
            {project.published_at ? <> · {formatDate(project.published_at)}</> : null}
          </span>
          <span className="mt-2 font-display text-xl leading-7 font-semibold">
            {project.title}
          </span>
          {project.summary ? (
            <span className="mt-2 text-sm leading-6 text-ink-muted line-clamp-2">
              {project.summary}
            </span>
          ) : null}
          <span
            aria-hidden
            className="mt-auto pt-4 font-mono text-xs text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            查看详情 →
          </span>
        </span>
      </Link>
    </TiltCard>
  );
}
