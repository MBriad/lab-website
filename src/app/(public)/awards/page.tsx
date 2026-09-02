import type { Metadata } from "next";
import { AwardsTimeline } from "@/components/awards/awards-timeline";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/section-header";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { getAwardsPage } from "@/lib/api/queries";
import type { PageResponse, AwardPublic } from "@/lib/types/api";

export const metadata: Metadata = {
  title: "荣誉奖项",
  description:
    "星航机器人实验室荣誉时间线：国家级、省级竞赛与科研奖项，附证书与现场记录。",
};

/**
 * The awards timeline is a single bounded fetch (contract pagination kept at
 * a generous page size); filtering/grouping is presentation-side. If the
 * archive ever exceeds this, add server pagination — no UI rewrite needed.
 */
const AWARDS_PAGE_SIZE = 50;

export default async function AwardsPage() {
  let result: PageResponse<AwardPublic> | null = null;
  try {
    result = await getAwardsPage({
      sort: "date_desc",
      page: 1,
      page_size: AWARDS_PAGE_SIZE,
    });
  } catch {
    result = null;
  }

  return (
    <>
      <PageHeader
        code="SEC.04 // HONORS"
        title="荣誉奖项"
        description="按年份向下滚动的荣誉档案：奖项、赛事、级别与现场记录。"
        meta={result ? `${result.total} AWARDS ARCHIVED` : undefined}
      />

      <Container className="section-pad">
        {result === null ? (
          <ErrorNote title="奖项加载失败" />
        ) : result.items.length === 0 ? (
          <EmptyState title="暂无公开的奖项记录" hint="荣誉发布后将展示在这里。" />
        ) : (
          <AwardsTimeline awards={result.items} />
        )}
      </Container>
    </>
  );
}
