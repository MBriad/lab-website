import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { Paragraphs } from "@/components/ui/paragraphs";
import { api, ApiError, getApiMode } from "@/lib/api";
import { formatDateCN } from "@/lib/format";
import type { ProjectPublic } from "@/lib/types/api";

/** Prerender known project pages at build (mock mode); degrade gracefully. */
export async function generateStaticParams() {
  if (getApiMode() !== "mock") return [];
  try {
    const result = await api.listProjects({ page: 1, page_size: 50 });
    return result.items.map((project) => ({ slug: project.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const project = await api.getProjectBySlug(slug);
    return {
      title: project.title,
      description: project.summary ?? undefined,
    };
  } catch {
    return { title: "项目" };
  }
}

export default async function ProjectDetailPage(
  props: PageProps<"/projects/[slug]">,
) {
  const { slug } = await props.params;

  let project: ProjectPublic;
  try {
    project = await api.getProjectBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  return (
    <article>
      <Container width="wide" className="pt-28 sm:pt-32">
        <Link
          href="/projects"
          className="font-mono text-xs tracking-[0.2em] text-ink-faint uppercase transition-colors hover:text-accent"
        >
          ← 返回项目列表
        </Link>

        <p className="mt-8 font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
          {`PRJ.${String(project.sort_order).padStart(2, "0")} // ${project.slug}`}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          {project.title}
        </h1>
        {project.summary ? (
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-muted">
            {project.summary}
          </p>
        ) : null}

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-2 border-y border-hairline py-4 font-mono text-xs text-ink-faint">
          {project.published_at ? (
            <div className="flex gap-2">
              <dt className="uppercase tracking-[0.2em]">发布</dt>
              <dd>{formatDateCN(project.published_at)}</dd>
            </div>
          ) : null}
          <div className="flex gap-2">
            <dt className="uppercase tracking-[0.2em]">状态</dt>
            <dd>已发布 / PUBLISHED</dd>
          </div>
        </dl>
      </Container>

      <Container width="wide" className="mt-10">
        <MediaImage
          media={project.cover}
          alt={project.title}
          mode="cover"
          className="glass-panel-strong aspect-[21/10] w-full overflow-hidden border border-hairline p-1"
          sizes="(min-width: 1280px) 1280px, 100vw"
          priority
        />
      </Container>

      <Container className="section-pad">
        <div className="max-w-3xl">
          <Paragraphs text={project.description} />
          <p className="mt-10 border-t border-hairline pt-6 font-mono text-xs text-ink-faint">
            项目编号 NO.{String(project.sort_order).padStart(2, "0")} ·{" "}
            <Link href="/projects" className="text-accent hover:text-accent-strong">
              返回项目列表
            </Link>
          </p>
        </div>
      </Container>
    </article>
  );
}
