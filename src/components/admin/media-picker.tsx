"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/format";
import type { MediaAdmin, MediaPublic, PageResponse } from "@/lib/types/api";
import { describeApiError, isAuthError } from "./lib/errors";
import { redirectToLogin } from "./lib/auth";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { LoadingBlock, Spinner } from "./ui/spinner";
import { Pager } from "./ui/pager";

const PICKER_PAGE_SIZE = 12;

export interface MediaPickerDialogProps {
  open: boolean;
  selectedId: string | null;
  /** Called with the picked media; the parent persists `media.id`. */
  onPick: (media: MediaAdmin) => void;
  onClose: () => void;
}

/**
 * Paginated, selectable media grid with inline upload. Returns the chosen
 * `MediaAdmin` so forms can store `*_media_id` and preview via `url`.
 */
export function MediaPickerDialog({
  open,
  selectedId,
  onPick,
  onClose,
}: MediaPickerDialogProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [snapshot, setSnapshot] = useState<{
    page: number;
    reloadKey: number;
    result: PageResponse<MediaAdmin> | null;
    error: string | null;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset to page 1 whenever the dialog is (re)opened.
  // (State adjustment during render — React's sanctioned pattern for
  // resetting state when a prop changes.)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setPrevOpen(open);
    setPage(1);
  } else if (!open && prevOpen) {
    setPrevOpen(open);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .listAdminMedia({ page, page_size: PICKER_PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setSnapshot({ page, reloadKey, result: res, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isAuthError(err)) {
          redirectToLogin(router);
          return;
        }
        setSnapshot({
          page,
          reloadKey,
          result: null,
          error: describeApiError(err, "素材列表加载失败"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [open, page, reloadKey, router]);

  const loading =
    snapshot === null ||
    snapshot.page !== page ||
    snapshot.reloadKey !== reloadKey;
  const result = loading ? null : snapshot?.result ?? null;
  const error = loading ? null : snapshot?.error ?? null;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so the same file can be picked again after an error.
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("仅支持上传图片文件");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const created = await api.uploadMedia(file);
      setReloadKey((key) => key + 1); // refresh the grid
      onPick(created);
    } catch (err) {
      if (isAuthError(err)) {
        redirectToLogin(router);
        return;
      }
      setUploadError(describeApiError(err, "上传失败，请重试"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="选择素材"
      description="从素材库选择，或直接上传新图片。"
      size="xl"
      footer={
        result && result.pages > 1 ? (
          <Pager page={result.page} pages={result.pages} onPage={setPage} />
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="primary"
          size="sm"
          loading={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          上传图片
        </Button>
        {uploading ? (
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            <Spinner className="text-accent" />
            正在上传…
          </span>
        ) : null}
        {uploadError ? (
          <p role="alert" className="text-xs text-danger">
            {uploadError}
          </p>
        ) : null}
      </div>

      {loading ? (
        <LoadingBlock label="素材加载中…" />
      ) : error ? (
        <div role="alert" className="rounded-panel border border-danger/50 bg-danger/10 px-4 py-6 text-center text-sm text-danger">
          {error}
        </div>
      ) : !result || result.items.length === 0 ? (
        <p className="rounded-panel border border-hairline px-4 py-10 text-center text-sm text-ink-muted">
          素材库为空，请先上传图片。
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {result.items.map((media) => {
            const selected = media.id === selectedId;
            return (
              <li key={media.id}>
                <button
                  type="button"
                  onClick={() => onPick(media)}
                  aria-pressed={selected}
                  className={cn(
                    "group w-full rounded-panel border text-left transition-colors",
                    selected
                      ? "border-accent/70 bg-accent/10"
                      : "border-hairline bg-surface/60 hover:border-accent/50",
                  )}
                >
                  <MediaImage
                    media={media}
                    alt={media.original_name}
                    mode="cover"
                    className="aspect-square w-full rounded-t-panel border-b border-hairline"
                    sizes="(min-width: 1024px) 160px, (min-width: 640px) 30vw, 40vw"
                  />
                  <span className="block px-2.5 py-2">
                    <span className="block truncate text-xs text-ink">
                      {media.original_name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-ink-faint">
                      {formatBytes(media.size_bytes)}
                      {selected ? " · 已选择" : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}

export interface MediaPickerFieldProps {
  /** Form-level label shown above the preview. */
  label: string;
  /** Currently selected media (from `*_media_id` resolution), or null. */
  value: MediaPublic | null;
  /** Called with the picked media, or null when cleared. */
  onChange: (media: MediaAdmin | null) => void;
  hint?: string;
  className?: string;
}

/**
 * Inline form control: preview of the current selection with 更换 / 移除
 * actions, opening the picker dialog. Clearing sets the field to null.
 */
export function MediaPickerField({
  label,
  value,
  onChange,
  hint,
  className,
}: MediaPickerFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <MediaImage
            media={value}
            alt={value.original_name}
            mode="cover"
            className="h-16 w-16 shrink-0 rounded-hud border border-hairline"
            sizes="64px"
          />
        ) : (
          <div
            aria-hidden
            className="grid h-16 w-16 shrink-0 place-items-center rounded-hud border border-dashed border-hairline-strong text-ink-faint"
          >
            <span className="font-mono text-[10px]">无</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          {value ? (
            <p className="truncate text-xs text-ink-muted">
              {value.original_name}
            </p>
          ) : (
            <p className="text-xs text-ink-faint">未选择素材</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setOpen(true)}
            >
              {value ? "更换" : "选择"}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(null)}
              >
                移除
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {hint ? <p className="text-xs leading-5 text-ink-faint">{hint}</p> : null}

      <MediaPickerDialog
        open={open}
        selectedId={value?.id ?? null}
        onPick={(media) => {
          onChange(media);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
