"use client";

import { Button } from "./button";
import { Dialog } from "./dialog";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** Keeps the dialog open with a busy confirm button while the mutation runs. */
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Destructive-action confirmation (deletes). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确认",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-6 text-ink-muted">{message}</p>
    </Dialog>
  );
}
