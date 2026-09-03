"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { MediaImage } from "@/components/ui/media-image";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { AdminBadge } from "@/components/admin/ui/badge";
import { Button, ButtonLink } from "@/components/admin/ui/button";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { AdminSkeleton } from "@/components/admin/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Notice, useNotice } from "@/components/admin/ui/notice";
import { Pager } from "@/components/admin/ui/pager";
import { useAdminList } from "@/components/admin/lib/use-admin-list";
import {
  describeApiError,
  isAuthError,
} from "@/components/admin/lib/errors";
import { redirectToLogin } from "@/components/admin/lib/auth";
import type { GalleryItemAdmin } from "@/lib/types/api";

const PAGE_SIZE = 20;

/** Independent visual-archive records backed by media-library assets. */
export function GalleryLibrary() {
  const router = useRouter();
  const list = useAdminList<GalleryItemAdmin>(api.listAdminGallery, PAGE_SIZE);
  const { notice, show, dismiss } = useNotice();
  const [deleteTarget, setDeleteTarget] = useState<GalleryItemAdmin | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const runMutation = useCallback(
    async (id: string, action: () => Promise<unknown>, okMessage: string) => {
      setBusyId(id);
      try {
        await action();
        show("success", okMessage);
        list.reload();
      } catch (err) {
        if (isAuthError(err)) {
          redirectToLogin(router);
          return;
        }
        show("error", describeApiError(err, "操作失败，请重试"));
      } finally {
        setBusyId(null);
      }
    },
    [list, router, show],
  );

  const handleToggleVisible = (item: GalleryItemAdmin) =>
    runMutation(
      item.id,
      () => api.updateGalleryItem(item.id, { is_visible: !item.is_visible }),
      item.is_visible ? "已隐藏影像记录。" : "已显示影像记录。",
    );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await runMutation(
      target.id,
      () => api.deleteGalleryItem(target.id),
      `已移除「${target.title}」；素材仍保留在素材库。`,
    );
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        tag="SEC.05 // GALLERY"
        title="影像记录"
        description="独立管理首页影像档案。素材库负责图片文件，这里负责标题、说明、排序与前台显示。"
        actions={
          <>
            <ButtonLink href="/admin/gallery/new" variant="primary">
              新建影像记录
            </ButtonLink>
            <ButtonLink href="/admin/media" variant="secondary">
              素材库
            </ButtonLink>
          </>
        }
      />

      <Notice notice={notice} onClose={dismiss} />

      <section className="admin-card hud-panel p-4 sm:p-5" aria-label="影像记录说明">
        <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">
          INDEPENDENT ARCHIVE
        </p>
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          点击“新建影像记录”后，可以直接从素材库选择图片，不需要先绑定新闻、项目或荣誉。移除记录不会删除素材文件。
        </p>
      </section>

      {list.loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <AdminSkeleton key={index} className="aspect-[4/3] w-full rounded-panel" />
          ))}
        </div>
      ) : list.error ? (
        <ErrorNote title="影像记录加载失败" message={list.error} />
      ) : !list.result || list.result.items.length === 0 ? (
        <EmptyState
          title="暂无影像记录"
          hint="先在素材库上传图片，再点击「新建影像记录」选择素材。"
        />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.result.items.map((item) => (
              <li key={item.id} className="admin-card hud-panel overflow-hidden p-0">
                <MediaImage
                  media={item.media}
                  alt={item.title}
                  mode="cover"
                  className="aspect-[4/3] w-full border-b border-hairline bg-surface"
                  sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                />
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminBadge tone={item.is_visible ? "success" : "warning"}>
                      {item.is_visible ? "前台显示" : "隐藏"}
                    </AdminBadge>
                    <AdminBadge tone="neutral">排序 {item.sort_order}</AdminBadge>
                  </div>
                  <div>
                    <h2 className="line-clamp-2 font-display text-base font-semibold text-ink">
                      {item.title}
                    </h2>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted">
                        {item.description}
                      </p>
                    ) : null}
                    <p className="mt-2 truncate font-mono text-[10px] tracking-[0.12em] text-ink-faint uppercase">
                      {item.media.original_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-hairline pt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busyId === item.id}
                      onClick={() => handleToggleVisible(item)}
                    >
                      {item.is_visible ? "隐藏" : "显示"}
                    </Button>
                    <ButtonLink
                      href={`/admin/gallery/${item.id}`}
                      variant="secondary"
                      size="sm"
                    >
                      编辑
                    </ButtonLink>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(item)}
                    >
                      移除
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pager
            page={list.result.page}
            pages={list.result.pages}
            onPage={list.setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="移除影像记录"
        message={`确定移除「${deleteTarget?.title ?? ""}」吗？图片不会从素材库删除。`}
        confirmLabel="移除记录"
        busy={busyId !== null}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
