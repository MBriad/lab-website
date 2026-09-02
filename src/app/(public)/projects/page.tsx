import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/projects/project-card";
import { Container } from "@/components/ui/container";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section-header";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { getProjectsPage } from "@/lib/api/queries";
import { parsePageParam } from "@/lib/format";
import type { PageResponse, ProjectPublic } from "@/lib/types/api";

export const metadata: Metadata = {
  title: "项目",
  description: "星航机器人实验室科研项目：足式平台、多智能体系统、灵巧操作与校园巡检。",
};

const PAGE_SIZE = 9;

export default async function ProjectsPage(
  props: PageProps<"/projects">,
) {
  const searchParams = await props.searchParams;
  const page = parsePageParam(searchParams.page);

  let result: PageResponse<ProjectPublic> | null = null;
  try {
    result = await getProjectsPage({ page, page_size: PAGE_SIZE });
  } catch {
    result = null;
  }

  const outOfRange =
    result !== null && result.items.length === 0 && page > 1;

  return (
    <>
      <PageHeader
        code="SEC.03 // PROJECTS"
        title="科研项目"
        description="以图像为主的在研项目列表，按策展顺序发布。每个项目都有独立的详情页。"
        meta={
          result
            ? `${result.total} PROJECTS · PAGE ${result.page}/${Math.max(result.pages, 1)}`
            : undefined
        }
      />

      <Container width="wide" className="section-pad">
        {result === null ? (
          <ErrorNote title="项目列表加载失败" />
        ) : result.items.length === 0 ? (
          <EmptyState
            title={outOfRange ? "页码超出范围" : "暂无已发布的项目"}
            hint={outOfRange ? "请返回第一页查看。" : "项目发布后将展示在这里。"}
          />
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((project, i) => (
                <Reveal
                  key={project.id}
                  delay={(i % 3) * 80}
                  className="h-full"
                >
                  <ProjectCard
                    project={project}
                    priority={result.page === 1 && i === 0}
                  />
                </Reveal>
              ))}
            </div>
            <Pagination
              page={result.page}
              pages={result.pages}
              hrefFor={(n) => `/projects?page=${n}`}
              className="mt-12"
            />
          </>
        )}
      </Container>
    </>
  );
}
