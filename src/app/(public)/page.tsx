import type { Metadata } from "next";
import { ContactSection } from "@/components/home/contact-section";
import { FeaturedAwards } from "@/components/home/featured-awards";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { GalleryStrip } from "@/components/home/gallery-strip";
import { Hero } from "@/components/home/hero";
import { LabAuthority } from "@/components/home/lab-authority";
import { LatestNews } from "@/components/home/latest-news";
import { ResearchPreview } from "@/components/home/research-preview";
import { Container } from "@/components/ui/container";
import { ErrorNote } from "@/components/ui/states";
import { api } from "@/lib/api";
import { getHomeData } from "@/lib/api/queries";
import { collectGallery, type GallerySeed } from "@/lib/media";

/**
 * Home metadata comes from site settings; the title intentionally falls
 * back to the root layout default (no `%s` self-duplication).
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await api.getSiteSettings();
    return {
      description: settings.description ?? settings.tagline ?? undefined,
    };
  } catch {
    return {};
  }
}

export default async function HomePage() {
  let home: Awaited<ReturnType<typeof getHomeData>> | null = null;
  try {
    home = await getHomeData();
  } catch {
    home = null;
  }

  if (!home) {
    return (
      <Container className="section-pad pt-32">
        <ErrorNote
          title="首页数据加载失败"
          message="当前默认连接真实 CMS；本地开发请先启动 backend 服务，或显式启用 mock 模式。"
        />
      </Container>
    );
  }

  // Gallery: compose from embedded covers (no public media endpoint exists);
  // dedupe by media id and cap the strip.
  const gallerySeeds: GallerySeed[] = [
    ...home.featuredProjects.map((p) => ({
      media: p.cover,
      href: `/projects/${p.slug}`,
      title: p.title,
      source: "项目",
    })),
    ...home.featuredAwards.flatMap((a) => [
      {
        media: a.certificate,
        href: "/awards",
        title: `${a.title} · 证书`,
        source: "荣誉",
      },
      { media: a.cover, href: "/awards", title: a.title, source: "荣誉" },
    ]),
    ...home.latestNews.map((n) => ({
      media: n.cover,
      href: `/news/${n.slug}`,
      title: n.title,
      source: "新闻",
    })),
  ];
  const gallery = collectGallery(gallerySeeds, 8);

  return (
    <>
      <Hero
        settings={home.settings}
        heroMedia={home.featuredProjects[0]?.cover ?? null}
      />
      <LabAuthority settings={home.settings} />
      {home.researchAreas.length > 0 ? (
        <ResearchPreview areas={home.researchAreas} />
      ) : null}
      {home.featuredProjects.length > 0 ? (
        <FeaturedProjects projects={home.featuredProjects} />
      ) : null}
      {home.featuredAwards.length > 0 ? (
        <FeaturedAwards awards={home.featuredAwards} />
      ) : null}
      {home.latestNews.length > 0 ? (
        <LatestNews news={home.latestNews.slice(0, 3)} />
      ) : null}
      {gallery.length > 0 ? <GalleryStrip items={gallery} /> : null}
      <ContactSection settings={home.settings} />
    </>
  );
}
