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
import type {
  MediaAdmin,
  MediaPublic,
  ProjectCreate,
  ProjectUpdate,
} from "@/lib/types/api";

const TITLE_MAX = 255;
const SLUG_MAX = 160;
const SUMMARY_MAX = 10000;
const DEMO_URL_MAX = 500;

interface FormState {
  title: string;
  slug: string;
  summary: string;
  description: string;
  demo_url: string;
  cover: MediaPublic | null;
  sort_order: string;
  is_visible: boolean;
}

interface ProjectFormProps {
  projectId?: string;
}

/** Shared create/edit form for projects. Typed against ProjectCreate/Update. */
export function ProjectForm({ projectId }: ProjectFormProps) {
  const router = useRouter();
  const isEdit = Boolean(projectId);
  const { notice, show, dismiss } = useNotice();

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    summary: "",
    description: "",
    demo_url: "",
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
    if (!projectId) return;
    let cancelled = false;
    api
      .getAdminProject(projectId)
      .then((project) => {
        if (cancelled) return;
        setForm({
          title: project.title,
          slug: project.slug,
          summary: project.summary ?? "",
          description: project.description,
          demo_url: project.demo_url ?? "",
          cover: project.cover,
          sort_order: String(project.sort_order),
          is_visible: project.is_visible,
        });
        setPublishedAt(project.published_at);
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
            ? "该项目不存在或已被删除。"
            : describeApiError(err, "加载失败"),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, router]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCoverChange = (media: MediaAdmin | null) => {
    setField("cover", media);
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "请输入标题。";
    else if (form.title.length > TITLE_MAX)
      errors.title = `标题不能超过 ${TITLE_MAX} 个字符。`;
    if (!form.slug.trim()) errors.slug = "请输入 slug。";
    else if (form.slug.length > SLUG_MAX)
      errors.slug = `slug 不能超过 ${SLUG_MAX} 个字符。`;
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(form.slug.trim()))
      errors.slug = "slug 仅支持字母、数字与连字符（-）。";
    if (!form.description.trim()) errors.description = "请输入项目介绍。";
    if (form.summary.length > SUMMARY_MAX)
      errors.summary = `简介不能超过 ${SUMMARY_MAX} 个字符。`;
    if (form.demo_url && !/^https?:\/\//i.test(form.demo_url)) errors.demo_url = "请输入以 http:// 或 https:// 开头的链接。";
    else if (form.demo_url.length > DEMO_URL_MAX) errors.demo_url = `演示链接不能超过 ${DEMO_URL_MAX} 个字符。`;
    const order = Number(form.sort_order);
    if (!Number.isInteger(order) || order < 0)
      errors.sort_order = "排序需为不小于 0 的整数。";
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const sortOrder = Number(form.sort_order);
    const summary = form.summary.trim() === "" ? null : form.summary;
    setSubmitting(true);
    try {
      if (isEdit && projectId) {
        const patch: ProjectUpdate = {
          title: form.title,
          slug: form.slug,
          summary,
          description: form.description,
          demo_url: emptyToNull(form.demo_url),
          cover_media_id: form.cover ? form.cover.id : null,
          sort_order: sortOrder,
          is_visible: form.is_visible,
        };
        await api.updateProject(projectId, patch);
        show("success", "已保存修改。");
      } else {
        const input: ProjectCreate = {
          title: form.title,
          slug: form.slug,
          summary,
          description: form.description,
          demo_url: emptyToNull(form.demo_url),
          cover_media_id: form.cover ? form.cover.id : null,
          sort_order: sortOrder,
          is_visible: form.is_visible,
        };
        await api.createProject(input);
        show("success", "已创建草稿。可稍后在列表中发布。");
      }
      router.push("/admin/projects");
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
    return <LoadingBlock label="加载项目中…" />;
  }
  if (loadError) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-panel border border-danger/50 bg-danger/10 px-4 py-6 text-center text-sm text-danger"
        >
          {loadError}
        </div>
        <ButtonLink href="/admin/projects" variant="secondary">
          返回项目列表
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            {"SEC.03 // PROJECTS"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {isEdit ? "编辑项目" : "新建项目"}
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
        <ButtonLink href="/admin/projects" variant="ghost">
          ← 返回列表
        </ButtonLink>
      </div>

      <Notice notice={notice} onClose={dismiss} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AdminCard className="space-y-4">
          <Field
            label="标题"
            htmlFor="project-title"
            required
            error={fieldErrors.title}
          >
            <Input
              id="project-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              maxLength={TITLE_MAX}
              invalid={Boolean(fieldErrors.title)}
            />
          </Field>
          <Field
            label="Slug"
            htmlFor="project-slug"
            required
            error={fieldErrors.slug}
            hint="用于公开详情页地址，仅字母、数字与连字符。"
          >
            <Input
              id="project-slug"
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              maxLength={SLUG_MAX}
              invalid={Boolean(fieldErrors.slug)}
            />
          </Field>
          <Field
            label="简介"
            htmlFor="project-summary"
            error={fieldErrors.summary}
            hint="可选；展示在列表卡片上。"
          >
            <Textarea
              id="project-summary"
              rows={3}
              value={form.summary}
              onChange={(e) => setField("summary", e.target.value)}
              maxLength={SUMMARY_MAX}
              invalid={Boolean(fieldErrors.summary)}
            />
          </Field>
          <Field
            label="项目介绍"
            htmlFor="project-description"
            required
            error={fieldErrors.description}
            hint="详情页正文，段落之间用空行分隔。"
          >
            <Textarea
              id="project-description"
              rows={10}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              invalid={Boolean(fieldErrors.description)}
            />
          </Field>
          <Field label="演示链接" htmlFor="project-demo-url" error={fieldErrors.demo_url} hint="可选；仅支持 http:// 或 https://，留空可清除。">
            <Input id="project-demo-url" type="url" value={form.demo_url} onChange={(e) => setField("demo_url", e.target.value)} placeholder="https://" invalid={Boolean(fieldErrors.demo_url)} />
          </Field>
        </AdminCard>

        <AdminCard className="space-y-4">
          <MediaPickerField
            label="项目图片（封面）"
            value={form.cover}
            onChange={handleCoverChange}
            hint="建议上传清晰的项目实物或渲染图。"
          />
          <Field
            label="排序"
            htmlFor="project-sort"
            error={fieldErrors.sort_order}
            hint="数值越小越靠前（前台顺序的唯一控制方式）。"
          >
            <Input
              id="project-sort"
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
          <ButtonLink href="/admin/projects" variant="ghost">
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
