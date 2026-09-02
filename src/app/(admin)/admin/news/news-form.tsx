"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Button, ButtonLink } from "@/components/admin/ui/button";
import { AdminCard } from "@/components/admin/ui/card";
import { Field } from "@/components/admin/ui/field";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Switch } from "@/components/admin/ui/switch";
import { Notice, useNotice } from "@/components/admin/ui/notice";
import { LoadingBlock } from "@/components/admin/ui/spinner";
import { MediaPickerField } from "@/components/admin/media-picker";
import {
  describeApiError,
  extractFieldErrors,
  isAuthError,
  isNotFoundError,
} from "@/components/admin/lib/errors";
import { redirectToLogin } from "@/components/admin/lib/auth";
import { formatDateCN } from "@/lib/format";
import type { MediaAdmin, MediaPublic, NewsCreate, NewsUpdate } from "@/lib/types/api";

const TITLE_MAX = 255;
const SLUG_MAX = 160;
const EXCERPT_MAX = 10000;

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: MediaPublic | null;
  sort_order: string;
  is_visible: boolean;
}

interface NewsFormProps {
  /** Present on the edit route; absent on the create route. */
  newsId?: string;
}

/** Shared create/edit form for news. Typed against NewsCreate/NewsUpdate. */
export function NewsForm({ newsId }: NewsFormProps) {
  const router = useRouter();
  const isEdit = Boolean(newsId);
  const { notice, show, dismiss } = useNotice();

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover: null,
    sort_order: "0",
    is_visible: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!newsId) return;
    let cancelled = false;
    api
      .getAdminNews(newsId)
      .then((news) => {
        if (cancelled) return;
        setForm({
          title: news.title,
          slug: news.slug,
          excerpt: news.excerpt ?? "",
          content: news.content,
          cover: news.cover,
          sort_order: String(news.sort_order),
          is_visible: news.is_visible,
        });
        setPublishedAt(news.published_at);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isAuthError(err)) {
          redirectToLogin(router);
          return;
        }
        setLoadError(
          isNotFoundError(err) ? "该新闻不存在或已被删除。" : describeApiError(err, "加载失败"),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [newsId, router]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCoverChange = (media: MediaAdmin | null) => {
    setField("cover", media);
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "请输入标题。";
    else if (form.title.length > TITLE_MAX) errors.title = `标题不能超过 ${TITLE_MAX} 个字符。`;
    if (!form.slug.trim()) errors.slug = "请输入 slug。";
    else if (form.slug.length > SLUG_MAX) errors.slug = `slug 不能超过 ${SLUG_MAX} 个字符。`;
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(form.slug.trim()))
      errors.slug = "slug 仅支持字母、数字与连字符（-）。";
    if (!form.content.trim()) errors.content = "请输入正文内容。";
    if (form.excerpt.length > EXCERPT_MAX) errors.excerpt = `摘要不能超过 ${EXCERPT_MAX} 个字符。`;
    const order = Number(form.sort_order);
    if (!Number.isInteger(order) || order < 0) errors.sort_order = "排序需为不小于 0 的整数。";
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const sortOrder = Number(form.sort_order);
    const excerpt = form.excerpt.trim() === "" ? null : form.excerpt;
    setSubmitting(true);
    try {
      if (isEdit && newsId) {
        const patch: NewsUpdate = {
          title: form.title,
          slug: form.slug,
          excerpt,
          content: form.content,
          cover_media_id: form.cover ? form.cover.id : null,
          sort_order: sortOrder,
          is_visible: form.is_visible,
        };
        await api.updateNews(newsId, patch);
        show("success", "已保存修改。");
      } else {
        const input: NewsCreate = {
          title: form.title,
          slug: form.slug,
          excerpt,
          content: form.content,
          cover_media_id: form.cover ? form.cover.id : null,
          sort_order: sortOrder,
          is_visible: form.is_visible,
        };
        await api.createNews(input);
        show("success", "已创建草稿。可稍后在列表中发布。");
      }
      router.push("/admin/news");
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

  if (loading) {
    return <LoadingBlock label="加载新闻中…" />;
  }
  if (loadError) {
    return (
      <div className="space-y-4">
        <div role="alert" className="rounded-panel border border-danger/50 bg-danger/10 px-4 py-6 text-center text-sm text-danger">
          {loadError}
        </div>
        <ButtonLink href="/admin/news" variant="secondary">
          返回新闻列表
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            {"SEC.02 // NEWS"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {isEdit ? "编辑新闻" : "新建新闻"}
          </h1>
          {publishedAt ? (
            <p className="mt-1 text-xs text-ink-muted">
              已于 {formatDateCN(publishedAt)} 发布。
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">
              保存为草稿；发布请在列表页操作。
            </p>
          )}
        </div>
        <ButtonLink href="/admin/news" variant="ghost">
          ← 返回列表
        </ButtonLink>
      </div>

      <Notice notice={notice} onClose={dismiss} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AdminCard className="space-y-4">
          <Field
            label="标题"
            htmlFor="news-title"
            required
            error={fieldErrors.title}
          >
            <Input
              id="news-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              maxLength={TITLE_MAX}
              invalid={Boolean(fieldErrors.title)}
            />
          </Field>
          <Field
            label="Slug"
            htmlFor="news-slug"
            required
            error={fieldErrors.slug}
            hint="用于公开详情页地址，仅字母、数字与连字符。"
          >
            <Input
              id="news-slug"
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              maxLength={SLUG_MAX}
              invalid={Boolean(fieldErrors.slug)}
            />
          </Field>
          <Field
            label="摘要"
            htmlFor="news-excerpt"
            error={fieldErrors.excerpt}
            hint="可选；展示在列表卡片上。"
          >
            <Textarea
              id="news-excerpt"
              rows={3}
              value={form.excerpt}
              onChange={(e) => setField("excerpt", e.target.value)}
              maxLength={EXCERPT_MAX}
              invalid={Boolean(fieldErrors.excerpt)}
            />
          </Field>
          <Field
            label="正文"
            htmlFor="news-content"
            required
            error={fieldErrors.content}
            hint="段落之间用空行分隔。"
          >
            <Textarea
              id="news-content"
              rows={10}
              value={form.content}
              onChange={(e) => setField("content", e.target.value)}
              invalid={Boolean(fieldErrors.content)}
            />
          </Field>
        </AdminCard>

        <AdminCard className="space-y-4">
          <MediaPickerField
            label="封面图"
            value={form.cover}
            onChange={handleCoverChange}
            hint="可选；用于列表与详情页展示。"
          />
          <Field
            label="排序"
            htmlFor="news-sort"
            error={fieldErrors.sort_order}
            hint="数值越小越靠前。"
          >
            <Input
              id="news-sort"
              type="number"
              min={0}
              step={1}
              value={form.sort_order}
              onChange={(e) => setField("sort_order", e.target.value)}
              invalid={Boolean(fieldErrors.sort_order)}
            />
          </Field>
          <Switch
            checked={form.is_visible}
            onCheckedChange={(checked) => setField("is_visible", checked)}
            label="前台可见"
            description="关闭后即使已发布也不会在前台展示。"
          />
        </AdminCard>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" loading={submitting}>
            {isEdit ? "保存修改" : "创建草稿"}
          </Button>
          <ButtonLink href="/admin/news" variant="ghost">
            取消
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
