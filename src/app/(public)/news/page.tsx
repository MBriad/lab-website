import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section-header";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { getNewsPage } from "@/lib/api/queries";
import { formatDate, parsePageParam } from "@/lib/format";
import type { PageResponse, NewsPublic } from "@/lib/types/api";

export const metadata: Metadata = {
  title: "新闻动态",
  description: "星航机器人实验室最新动态：竞赛成绩、项目进展、科研成果与实验室活动。",
};

const PAGE_SIZE = 8;

export default async function NewsPage(props: PageProps<"/news">) {
  const searchParams = await props.searchParams;
  const page = parsePageParam(searchParams.page);

  let result: PageResponse<NewsPublic> | null = null;
  try {
    result = await getNewsPage({ page, page_size: PAGE_SIZE });
  } catch {
    result = null;
  }

  const outOfRange = result !== null && result.items.length === 0 && page > 1;

  return (
    <>
      <PageHeader
        code="SEC.05 // NEWS"
        title="新闻动态"
        description="竞赛成绩、项目进展、科研成果与实验室活动，按发布时间倒序。"
        meta={
          result
            ? `${result.total} ENTRIES · PAGE ${result.page}/${Math.max(result.pages, 1)}`
            : undefined
        }
      />

      <Container className="section-pad">
        {result === null ? (
          <ErrorNote title="新闻列表加载失败" />
        ) : result.items.length === 0 ? (
          <EmptyState
            title={outOfRange ? "页码超出范围" : "暂无已发布的动态"}
            hint={outOfRange ? "请返回第一页查看。" : "新闻发布后将展示在这里。"}
          />
        ) : (
          <>
            <div>
              {result.items.map((item, i) => (
                <Reveal key={item.id} delay={(i % 4) * 60}>
                  <Link
                    href={`/news/${item.slug}`}
                    className="group grid gap-5 border-b border-hairline py-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center"
                  >
                    {item.cover ? (
                      <MediaImage
                        media={item.cover}
                        alt={item.title}
                        mode="cover"
                        className="aspect-video w-full rounded-panel border border-hairline bg-white/34"
                        sizes="(min-width: 640px) 220px, 100vw"
                        priority={page === 1 && i === 0}
                        imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <span aria-hidden className="hidden aspect-video sm:block" />
                    )}
                    <span className="block">
                      <span className="font-mono text-[10px] tracking-[0.25em] text-ink-faint uppercase">
                        {item.published_at ? formatDate(item.published_at) : "未标注"}
                      </span>
                      <span className="mt-1 block font-display text-xl leading-7 font-semibold transition-colors group-hover:text-accent">
                        {item.title}
                      </span>
                      {item.excerpt ? (
                        <span className="mt-2 block text-sm leading-6 text-ink-muted line-clamp-2">
                          {item.excerpt}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
            <Pagination
              page={result.page}
              pages={result.pages}
              hrefFor={(n) => `/news?page=${n}`}
              className="mt-12"
            />
          </>
        )}
      </Container>
    </>
  );
}
