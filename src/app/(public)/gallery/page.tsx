import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/section-header";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { getGalleryPage } from "@/lib/api/queries";
import { parsePageParam } from "@/lib/format";
import type { GalleryItemPublic, PageResponse } from "@/lib/types/api";

export const metadata: Metadata = {
  title: "影像记录",
  description: "机器人创新实验室的项目研发、赛事现场与实验室日常影像记录。",
};

const PAGE_SIZE = 12;

export default async function GalleryPage(props: PageProps<"/gallery">) {
  const searchParams = await props.searchParams;
  const page = parsePageParam(searchParams.page);

  let result: PageResponse<GalleryItemPublic> | null = null;
  try {
    result = await getGalleryPage({ page, page_size: PAGE_SIZE });
  } catch {
    result = null;
  }

  const outOfRange = result !== null && result.items.length === 0 && page > 1;

  return (
    <>
      <PageHeader
        code="SEC.06 // VISUAL ARCHIVE"
        title="完整影像记录"
        description="从项目研发、赛事现场到实验室日常的视觉档案。"
        meta={
          result
            ? `${result.total} VISUAL RECORDS · PAGE ${result.page}/${Math.max(result.pages, 1)}`
            : undefined
        }
      />

      <Container width="wide" className="section-pad">
        {result === null ? (
          <ErrorNote title="影像记录加载失败" />
        ) : result.items.length === 0 ? (
          <EmptyState
            title={outOfRange ? "页码超出范围" : "暂无公开的影像记录"}
            hint={outOfRange ? "请返回第一页查看。" : "管理员发布影像记录后将展示在这里。"}
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((item, index) => (
                <Reveal
                  key={item.id}
                  delay={(index % 3) * 70}
                  className="h-full"
                >
                  <article className="glass-panel-strong group flex h-full min-h-[22rem] flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-accent/40 hover:shadow-glow-accent">
                    <MediaImage
                      media={item.media}
                      alt={item.title}
                      mode="cover"
                      className="aspect-[4/3] w-full border-b border-hairline bg-white/32"
                      sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                      priority={page === 1 && index < 2}
                      imgClassName="transition-transform duration-700 group-hover:scale-[1.045]"
                    />
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <p className="font-mono text-[10px] tracking-[0.24em] text-accent uppercase">
                        VISUAL ARCHIVE
                      </p>
                      <h2 className="mt-3 font-display text-2xl leading-tight font-semibold tracking-[-0.035em] text-ink">
                        {item.title}
                      </h2>
                      {item.description ? (
                        <p className="mt-3 text-sm leading-6 text-ink-muted line-clamp-3">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <Pagination
              page={result.page}
              pages={result.pages}
              hrefFor={(nextPage) => `/gallery?page=${nextPage}`}
              className="mt-12"
            />
          </>
        )}
      </Container>
    </>
  );
}
