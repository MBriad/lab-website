"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminSkeleton } from "@/components/admin/ui/skeleton";
import { AdminBadge } from "@/components/admin/ui/badge";
import { ButtonLink } from "@/components/admin/ui/button";
import { isAuthError } from "@/components/admin/lib/errors";
import { redirectToLogin } from "@/components/admin/lib/auth";
import { formatDate } from "@/lib/format";
import type { NewsAdmin, ProjectAdmin } from "@/lib/types/api";

interface DashboardData {
  newsTotal: number | null;
  projectsTotal: number | null;
  awardsTotal: number | null;
  researchTotal: number | null;
  mediaTotal: number | null;
  recentNews: NewsAdmin[];
  recentProjects: ProjectAdmin[];
}

/**
 * Dashboard: stat tiles (counts via `page_size: 1` totals) + recent items.
 * All fetches run in parallel; each tile degrades independently on error.
 */
export function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const safe = async <T,>(
        fn: () => Promise<T>,
      ): Promise<T | null> => {
        try {
          return await fn();
        } catch (err) {
          if (isAuthError(err)) redirectToLogin(router);
          return null;
        }
      };

      const [news, projects, awards, research, media] = await Promise.all([
        safe(() => api.listAdminNews({ page: 1, page_size: 5 })),
        safe(() => api.listAdminProjects({ page: 1, page_size: 5 })),
        safe(() => api.listAdminAwards({ page: 1, page_size: 1 })),
        safe(() => api.listAdminResearchAreas({ page: 1, page_size: 1 })),
        safe(() => api.listAdminMedia({ page: 1, page_size: 1 })),
      ]);

      if (cancelled) return;
      setData({
        newsTotal: news ? news.total : null,
        projectsTotal: projects ? projects.total : null,
        awardsTotal: awards ? awards.total : null,
        researchTotal: research ? research.total : null,
        mediaTotal: media ? media.total : null,
        recentNews: news ? news.items : [],
        recentProjects: projects ? projects.items : [],
      });
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <AdminSkeleton key={i} className="h-24" />
          ))}
        </div>
        <AdminSkeleton className="h-64" />
      </div>
    );
  }

  const tiles = [
    { label: "新闻", total: data.newsTotal, href: "/admin/news" },
    { label: "项目", total: data.projectsTotal, href: "/admin/projects" },
    { label: "荣誉", total: data.awardsTotal, href: "/admin/awards" },
    { label: "研究方向", total: data.researchTotal, href: "/admin/research" },
    { label: "素材", total: data.mediaTotal, href: "/admin/media" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            {"SEC.01 // OVERVIEW"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            仪表盘
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/news/new" variant="primary" size="sm">
            新建新闻
          </ButtonLink>
          <ButtonLink href="/admin/projects/new" variant="secondary" size="sm">
            新建项目
          </ButtonLink>
          <ButtonLink href="/admin/awards/new" variant="secondary" size="sm">
            新建荣誉
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="hud-panel p-4 transition-colors hover:border-accent/40"
          >
            <p className="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
              {tile.label}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {tile.total === null ? (
                <span className="text-base text-danger">加载失败</span>
              ) : (
                tile.total
              )}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="hud-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">最近新闻</h2>
            <Link
              href="/admin/news"
              className="font-mono text-xs text-accent hover:text-accent-strong"
            >
              全部 →
            </Link>
          </div>
          {data.recentNews.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">暂无新闻。</p>
          ) : (
            <ul className="mt-3 divide-y divide-hairline">
              {data.recentNews.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {item.title}
                  </span>
                  {item.published_at ? (
                    <AdminBadge tone="success">已发布</AdminBadge>
                  ) : (
                    <AdminBadge tone="neutral">草稿</AdminBadge>
                  )}
                  <span className="hidden shrink-0 font-mono text-[11px] text-ink-faint sm:inline">
                    {formatDate(item.updated_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="hud-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">最近项目</h2>
            <Link
              href="/admin/projects"
              className="font-mono text-xs text-accent hover:text-accent-strong"
            >
              全部 →
            </Link>
          </div>
          {data.recentProjects.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">暂无项目。</p>
          ) : (
            <ul className="mt-3 divide-y divide-hairline">
              {data.recentProjects.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {item.title}
                  </span>
                  {item.published_at ? (
                    <AdminBadge tone="success">已发布</AdminBadge>
                  ) : (
                    <AdminBadge tone="neutral">草稿</AdminBadge>
                  )}
                  <span className="hidden shrink-0 font-mono text-[11px] text-ink-faint sm:inline">
                    排序 {item.sort_order}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
