import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/section-header";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { getResearchAreas } from "@/lib/api/queries";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "研究方向",
  description:
    "星航机器人实验室研究方向：足式机器人、多智能体系统、具身感知与操作、人机交互。",
};

export default async function ResearchPage() {
  let areas: Awaited<ReturnType<typeof getResearchAreas>> | null = null;
  try {
    areas = await getResearchAreas();
  } catch {
    areas = null;
  }

  return (
    <>
      <PageHeader
        code="SEC.02 // RESEARCH DIRECTIONS"
        title="研究方向"
        description="围绕机器人智能的核心问题域展开：运动、协同、感知与交互。每个方向既有平台级研究载体，也持续孵化本科生课题。"
        meta={areas ? `${areas.length} AREAS ACTIVE` : undefined}
      />

      <Container className="section-pad">
        {areas === null ? (
          <ErrorNote title="研究方向加载失败" />
        ) : areas.length === 0 ? (
          <EmptyState title="暂无公开的研究方向" hint="方向整理中，敬请期待。" />
        ) : (
          <div>
            {areas.map((area, i) => {
              const mirrored = i % 2 === 1;
              return (
                <Reveal key={area.id}>
                  <article className="group grid gap-4 border-b border-hairline py-12 first:pt-0 last:border-b-0 lg:grid-cols-12 lg:gap-10">
                    <div
                      className={cn(
                        "lg:col-span-4",
                        mirrored && "lg:order-2 lg:text-right",
                      )}
                    >
                      <span
                        aria-hidden
                        className="font-display text-7xl font-semibold text-outline-faint select-none sm:text-8xl"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className={cn("lg:col-span-8", mirrored && "lg:order-1")}>
                      <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
                        {`AREA.${String(i + 1).padStart(2, "0")} // ${area.slug}`}
                      </p>
                      <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em] transition-colors group-hover:text-accent sm:text-3xl">
                        {area.title}
                      </h2>
                      <p className="mt-4 max-w-3xl leading-8 text-ink-muted">
                        {area.description}
                      </p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
