"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export type NoticeTone = "success" | "error" | "info";

export interface NoticeData {
  tone: NoticeTone;
  message: string;
}

const TONE_CLS: Record<NoticeTone, string> = {
  success: "border-success/50 bg-success/10 text-success",
  error: "border-danger/50 bg-danger/10 text-danger",
  info: "border-accent/50 bg-accent/10 text-accent",
};

export interface NoticeProps {
  notice: NoticeData | null;
  onClose?: () => void;
  className?: string;
}

/** Inline notification banner for mutation results (never a silent toast). */
export function Notice({ notice, onClose, className }: NoticeProps) {
  if (!notice) return null;
  return (
    <div
      role={notice.tone === "error" ? "alert" : "status"}
      className={cn(
        "admin-notice flex items-start justify-between gap-3 rounded-panel border px-4 py-3 text-sm",
        TONE_CLS[notice.tone],
        className,
      )}
    >
      <span className="leading-6 break-words">{notice.message}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭提示"
          className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
        >
          <span aria-hidden>×</span>
        </button>
      ) : null}
    </div>
  );
}

/**
 * Notice state with auto-hide. The hide timer is cleaned up on re-show and
 * unmount (hook-guidelines.md).
 */
export function useNotice(autoHideMs = 6000) {
  const [notice, setNotice] = useState<NoticeData | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), autoHideMs);
    return () => clearTimeout(timer);
  }, [notice, autoHideMs]);

  const show = useCallback((tone: NoticeTone, message: string) => {
    setNotice({ tone, message });
  }, []);
  const dismiss = useCallback(() => setNotice(null), []);

  return { notice, show, dismiss };
}
