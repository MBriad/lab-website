"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { MediaPickerField } from "@/components/admin/media-picker";
import { redirectToLogin } from "@/components/admin/lib/auth";
import {
  describeApiError,
  extractFieldErrors,
  isAuthError,
  isNotFoundError,
} from "@/components/admin/lib/errors";
import { Button, ButtonLink } from "@/components/admin/ui/button";
import { AdminCard } from "@/components/admin/ui/card";
import { Field } from "@/components/admin/ui/field";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Switch } from "@/components/admin/ui/switch";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { LoadingBlock } from "@/components/admin/ui/spinner";
import { Notice, useNotice } from "@/components/admin/ui/notice";
import type {
  GalleryItemCreate,
  GalleryItemUpdate,
  MediaPublic,
} from "@/lib/types/api";

const TITLE_MAX = 255;
const DESCRIPTION_MAX = 10_000;

interface FormState {
  title: string;
  description: string;
  media: MediaPublic | null;
  sort_order: string;
  is_visible: boolean;
}

interface GalleryFormProps {
  galleryId?: string;
}

/** Shared create/edit form for independent gallery records. */
export function GalleryForm({ galleryId }: GalleryFormProps) {
  const router = useRouter();
  const isEdit = Boolean(galleryId);
  const { notice, show, dismiss } = useNotice();
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    media: null,
    sort_order: "0",
    is_visible: true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!galleryId) return;
    let cancelled = false;
    api
      .getAdminGallery(galleryId)
      .then((item) => {
        if (cancelled) return;
        setForm({
          title: item.title,
          description: item.description ?? "",
          media: item.media,
          sort_order: String(item.sort_order),
          is_visible: item.is_visible,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isAuthError(err)) {
          redirectToLogin(router);
          return;
        }
        setLoadError(
          isNotFoundError(err)
            ? "该影像记录不存在或已被移除。"
            : describeApiError(err, "加载失败"),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [galleryId, router]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "请输入影像标题。";
    else if (form.title.trim().length > TITLE_MAX) {
      errors.title = `标题不能超过 ${TITLE_MAX} 个字符。`;
    }
    if (!form.media) errors.media = "请选择素材库中的图片。";
    if (form.description.length > DESCRIPTION_MAX) {
      errors.description = `说明不能超过 ${DESCRIPTION_MAX} 个字符。`;
    }
    const sortOrder = Number(form.sort_order);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      errors.sort_order = "排序需为不小于 0 的整数。";
    }
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !form.media) return;

    const sortOrder = Number(form.sort_order);
    setSubmitting(true);
    try {
      if (isEdit && galleryId) {
        const patch: GalleryItemUpdate = {
          media_id: form.media.id,
          title: form.title,
          description: emptyToNull(form.description),
          sort_order: sortOrder,
          is_visible: form.is_visible,
        };
        await api.updateGalleryItem(galleryId, patch);
        show("success", "影像记录已保存。正在返回列表…");
      } else {
        const input: GalleryItemCreate = {
          media_id: form.media.id,
          title: form.title,
          description: emptyToNull(form.description),
          sort_order: sortOrder,
          is_visible: form.is_visible,
        };
        await api.createGalleryItem(input);
        show("success", "影像记录已创建。正在返回列表…");
      }
      router.push("/admin/gallery");
    } catch (err) {
      if (isAuthError(err)) {
        redirectToLogin(router);
        return;
      }
      const fields = extractFieldErrors(err);
      if (fields) setFieldErrors(fields);
      show("error", describeApiError(err, "保存失败，请重试"));
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock label="加载影像记录中…" />;
  if (loadError) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-panel border border-danger/50 bg-danger/10 px-4 py-6 text-center text-sm text-danger"
        >
          {loadError}
        </div>
        <ButtonLink href="/admin/gallery" variant="secondary">
          返回影像记录
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        tag="SEC.05 // GALLERY"
        title={isEdit ? "编辑影像记录" : "新建影像记录"}
        description="从素材库选择一张图片，单独设置影像记录的标题、说明、顺序与前台显示状态。"
        actions={
          <ButtonLink href="/admin/gallery" variant="ghost">
            ← 返回列表
          </ButtonLink>
        }
      />

      <Notice notice={notice} onClose={dismiss} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AdminCard className="space-y-4">
          <Field label="标题" htmlFor="gallery-title" required error={fieldErrors.title}>
            <Input
              id="gallery-title"
              value={form.title}
              maxLength={TITLE_MAX}
              onChange={(event) => setField("title", event.target.value)}
              invalid={Boolean(fieldErrors.title)}
            />
          </Field>
          <Field
            label="说明"
            htmlFor="gallery-description"
            error={fieldErrors.description}
            hint="可选，用于补充拍摄场景或项目阶段。"
          >
            <Textarea
              id="gallery-description"
              rows={4}
              maxLength={DESCRIPTION_MAX}
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              invalid={Boolean(fieldErrors.description)}
            />
          </Field>
          <Field
            label="素材图片"
            required
            error={fieldErrors.media}
            hint="可以直接从素材库选择，也可以在弹窗内上传新图片。"
          >
            <MediaPickerField
              label=""
              value={form.media}
              onChange={(media) => setField("media", media)}
            />
          </Field>
        </AdminCard>

        <AdminCard className="space-y-4">
          <Field
            label="排序"
            htmlFor="gallery-sort"
            error={fieldErrors.sort_order}
            hint="数值越小越靠前。"
          >
            <Input
              id="gallery-sort"
              type="number"
              min={0}
              step={1}
              value={form.sort_order}
              onChange={(event) => setField("sort_order", event.target.value)}
              invalid={Boolean(fieldErrors.sort_order)}
            />
          </Field>
          <Switch
            checked={form.is_visible}
            onCheckedChange={(checked) => setField("is_visible", checked)}
            label="前台显示"
            description="关闭后该影像记录不会出现在首页影像区域。"
          />
        </AdminCard>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" loading={submitting}>
            {isEdit ? "保存修改" : "创建记录"}
          </Button>
          <ButtonLink href="/admin/gallery" variant="ghost">
            取消
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
