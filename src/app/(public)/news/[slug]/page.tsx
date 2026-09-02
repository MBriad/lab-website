import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { MediaImage } from "@/components/ui/media-image";
import { Paragraphs } from "@/components/ui/paragraphs";
import { api, ApiError, getApiMode } from "@/lib/api";
import { formatDateCN } from "@/lib/format";
import type { NewsPublic } from "@/lib/types/api";

/** Prerender known news pages at build (mock mode); degrade gracefully. */
export async function generateStaticParams() {
  if (getApiMode() !== "mock") return [];
  try {
    const result = await api.listNews({ page: 1, page_size: 50 });
    return result.items.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: PageProps<"/news/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const item = await api.getNewsBySlug(slug);
    return { title: item.title, description: item.excerpt ?? undefined };
  } catch {
    return { title: "新闻动态" };
  }
}

export default async function NewsDetailPage(
  props: PageProps<"/news/[slug]">,
) {
  const { slug } = await props.params;

  let item: NewsPublic;
  try {
    item = await api.getNewsBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  return (
    <article>
      <Container className="pt-28 sm:pt-32">
        <Link
          href="/news"
          className="font-mono text-xs tracking-[0.2em] text-ink-faint uppercase transition-colors hover:text-accent"
        >
          ← 返回动态列表
        </Link>

        <p className="mt-8 font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
          LOG.{item.slug}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {item.title}
        </h1>
        {item.published_at ? (
          <p className="mt-4 font-mono text-xs text-ink-faint">
            发布于 {formatDateCN(item.published_at)}
          </p>
        ) : null}
      </Container>

      <Container className="mt-10">
        <MediaImage
          media={item.cover}
          alt={item.title}
          mode="cover"
          className="glass-panel-strong aspect-[21/10] w-full overflow-hidden border border-hairline p-1"
          sizes="(min-width: 1024px) 1024px, 100vw"
          priority
        />
      </Container>

      <Container className="section-pad">
        <div className="max-w-3xl">
          <Paragraphs text={item.content} />
          <p className="mt-10 border-t border-hairline pt-6 font-mono text-xs text-ink-faint">
            <Link href="/news" className="text-accent hover:text-accent-strong">
              ← 返回动态列表
            </Link>
          </p>
        </div>
      </Container>
    </article>
  );
}
