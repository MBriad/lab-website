"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { MediaImage } from "@/components/ui/media-image";
import { EmptyState, ErrorNote } from "@/components/ui/states";
import { Button } from "@/components/admin/ui/button";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { AdminSkeleton } from "@/components/admin/ui/skeleton";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Notice, useNotice } from "@/components/admin/ui/notice";
import { Pager } from "@/components/admin/ui/pager";
import { Spinner } from "@/components/admin/ui/spinner";
import { useAdminList } from "@/components/admin/lib/use-admin-list";
import {
  describeApiError,
  isAuthError,
  isConflictError,
} from "@/components/admin/lib/errors";
import { redirectToLogin } from "@/components/admin/lib/auth";
import { formatBytes, formatDate } from "@/lib/format";
import type { MediaAdmin } from "@/lib/types/api";

const PAGE_SIZE = 24;

export function MediaLibrary() {
  const router = useRouter();
  // Pass the stable `api` method reference (see news-list for why).
  const list = useAdminList<MediaAdmin>(api.listAdminMedia, PAGE_SIZE);
  const { notice, show, dismiss } = useNotice();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaAdmin | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      show("error", "仅支持上传图片文件。");
      return;
    }
    setUploading(true);
    try {
      await api.uploadMedia(file);
      show("success", `已上传「${file.name}」。`);
      list.reload();
    } catch (err) {
      if (isAuthError(err)) {
        redirectToLogin(router);
        return;
      }
      show("error", describeApiError(err, "上传失败，请重试"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteBusy(true);
    try {
      await api.deleteMedia(target.id);
      setDeleteTarget(null);
      show("success", `已删除「${target.original_name}」。`);
      list.reload();
    } catch (err) {
      if (isAuthError(err)) {
        redirectToLogin(router);
        return;
      }
      if (isConflictError(err)) {
        // Reference-aware failure: surface the backend reason inline.
        setDeleteTarget(null);
        show("error", err.body?.message ?? "素材仍被内容引用，无法删除。");
      } else {
        show("error", describeApiError(err, "删除失败，请重试"));
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        tag="SEC.06 // MEDIA"
        title="素材库"
        description="上传图片素材，供新闻、项目、荣誉与站点设置引用。"
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="primary"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "上传中…" : "上传图片"}
            </Button>
          </>
        }
      />

      <Notice notice={notice} onClose={dismiss} />

      {list.loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <AdminSkeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : list.error ? (
        <ErrorNote title="素材库加载失败" message={list.error} />
      ) : !list.result || list.result.items.length === 0 ? (
        <EmptyState title="素材库为空" hint="点击「上传图片」添加第一张素材。" />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.result.items.map((media) => (
              <li
                key={media.id}
                className="group overflow-hidden rounded-panel border border-hairline bg-surface/60"
              >
                <MediaImage
                  media={media}
                  alt={media.original_name}
                  mode="cover"
                  className="aspect-square w-full border-b border-hairline"
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                />
                <div className="space-y-1.5 p-3">
                  <p
                    className="truncate text-xs font-medium text-ink"
                    title={media.original_name}
                  >
                    {media.original_name}
                  </p>
                  <p className="font-mono text-[11px] text-ink-faint">
                    {formatBytes(media.size_bytes)}
                    {media.width !== null && media.height !== null
                      ? ` · ${media.width}×${media.height}`
                      : ""}
                  </p>
                  <p className="font-mono text-[11px] text-ink-faint">
                    {formatDate(media.created_at)}
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => setDeleteTarget(media)}
                  >
                    删除
                  </Button>
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

      {uploading ? (
        <p className="flex items-center gap-2 text-xs text-ink-muted">
          <Spinner className="text-accent" />
          正在上传，请稍候…
        </p>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除素材"
        message={`确定删除「${deleteTarget?.original_name ?? ""}」吗？若该素材仍被新闻、项目、荣誉或站点设置引用，删除将被拒绝。`}
        confirmLabel="删除"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
