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
      <div className="admin-dashboard space-y-6">
        <div className="admin-stat-grid">
          {Array.from({ length: 5 }, (_, i) => (
            <AdminSkeleton key={i} className="admin-stat-tile h-32" />
          ))}
        </div>
        <AdminSkeleton className="h-72 rounded-panel" />
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
    <div className="admin-dashboard space-y-6">
      <div className="admin-dashboard-hero flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="admin-dashboard-kicker">WORKSPACE / OVERVIEW</p>
          <h1 className="admin-dashboard-title mt-2 font-display font-semibold">
            内容总览
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
            管理公开站点的内容、媒体与展示顺序。保存后可从前台入口快速确认效果。
          </p>
        </div>
        <div className="admin-dashboard-actions flex flex-wrap gap-2">
          <ButtonLink href="/" prefetch={false} variant="secondary" size="sm">
            查看前台
          </ButtonLink>
          <ButtonLink href="/admin/news/new" prefetch={false} variant="primary" size="sm">
            新建新闻
          </ButtonLink>
          <ButtonLink href="/admin/projects/new" prefetch={false} variant="secondary" size="sm">
            新建项目
          </ButtonLink>
          <ButtonLink href="/admin/awards/new" prefetch={false} variant="secondary" size="sm">
            新建荣誉
          </ButtonLink>
          <ButtonLink href="/admin/gallery" prefetch={false} variant="secondary" size="sm">
            管理影像记录
          </ButtonLink>
        </div>
      </div>

      <div className="admin-stat-grid">
        {tiles.map((tile, index) => (
          <Link
            key={tile.href}
            href={tile.href}
            prefetch={false}
            className="admin-stat-tile"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="admin-stat-index">
                {String(index).padStart(2, "0")}
              </span>
              <span aria-hidden className="admin-stat-arrow">
                ↗
              </span>
            </div>
            <p className="admin-stat-label mt-2">
              {tile.label}
            </p>
            <p className="admin-stat-value">
              {tile.total === null ? (
                <span className="text-base text-danger">加载失败</span>
              ) : (
                tile.total
              )}
            </p>
          </Link>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-list-panel hud-panel">
          <div className="admin-list-panel-heading">
            <h2 className="font-display text-base font-semibold">最近新闻</h2>
            <Link
              href="/admin/news"
              prefetch={false}
              className="admin-list-link"
            >
              全部 →
            </Link>
          </div>
          {data.recentNews.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">暂无新闻。</p>
          ) : (
            <ul className="mt-1">
              {data.recentNews.map((item) => (
                <li key={item.id} className="admin-list-row">
                  <Link
                    href={`/admin/news/${item.id}`}
                    prefetch={false}
                    className="admin-list-row-link"
                  >
                    <span className="admin-list-row-title">{item.title}</span>
                    {item.published_at ? (
                      <AdminBadge tone="success">已发布</AdminBadge>
                    ) : (
                      <AdminBadge tone="neutral">草稿</AdminBadge>
                    )}
                    <span className="admin-list-row-meta hidden sm:inline">
                      {formatDate(item.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-list-panel hud-panel">
          <div className="admin-list-panel-heading">
            <h2 className="font-display text-base font-semibold">最近项目</h2>
            <Link
              href="/admin/projects"
              prefetch={false}
              className="admin-list-link"
            >
              全部 →
            </Link>
          </div>
          {data.recentProjects.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">暂无项目。</p>
          ) : (
            <ul className="mt-1">
              {data.recentProjects.map((item) => (
                <li key={item.id} className="admin-list-row">
                  <Link
                    href={`/admin/projects/${item.id}`}
                    prefetch={false}
                    className="admin-list-row-link"
                  >
                    <span className="admin-list-row-title">{item.title}</span>
                    {item.published_at ? (
                      <AdminBadge tone="success">已发布</AdminBadge>
                    ) : (
                      <AdminBadge tone="neutral">草稿</AdminBadge>
                    )}
                    <span className="admin-list-row-meta">
                      排序 {item.sort_order}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
