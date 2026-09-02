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
import {
  describeApiError,
  extractFieldErrors,
  isAuthError,
  isNotFoundError,
} from "@/components/admin/lib/errors";
import { redirectToLogin } from "@/components/admin/lib/auth";
import type {
  ResearchAreaCreate,
  ResearchAreaUpdate,
  ProjectAdmin,
} from "@/lib/types/api";

const TITLE_MAX = 255;
const SLUG_MAX = 160;

interface FormState {
  title: string;
  slug: string;
  description: string;
  problem_statement: string;
  application_scenarios: string;
  representative_project_id: string;
  sort_order: string;
  is_visible: boolean;
}

interface ResearchFormProps {
  areaId?: string;
}

/** Shared create/edit form for research areas. */
export function ResearchForm({ areaId }: ResearchFormProps) {
  const router = useRouter();
  const isEdit = Boolean(areaId);
  const { notice, show, dismiss } = useNotice();

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    description: "",
    problem_statement: "",
    application_scenarios: "",
    representative_project_id: "",
    sort_order: "0",
    is_visible: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectAdmin[]>([]);

  useEffect(() => {
    if (!areaId) return;
    let cancelled = false;
    api
      .getAdminResearchArea(areaId)
      .then((area) => {
        if (cancelled) return;
        setForm({
          title: area.title,
          slug: area.slug,
          description: area.description,
          problem_statement: area.problem_statement ?? "",
          application_scenarios: area.application_scenarios.join("\n"),
          representative_project_id: area.representative_project_id ?? "",
          sort_order: String(area.sort_order),
          is_visible: area.is_visible,
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
            ? "该研究方向不存在或已被删除。"
            : describeApiError(err, "加载失败"),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [areaId, router]);

  useEffect(() => {
    let cancelled = false;
    api.listAdminProjects({ page: 1, page_size: 50 }).then((page) => {
      if (!cancelled) setProjects(page.items);
    }).catch((err) => {
      if (!cancelled && isAuthError(err)) redirectToLogin(router);
    });
    return () => { cancelled = true; };
  }, [router]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    if (!form.description.trim()) errors.description = "请输入描述。";
    const scenarios = form.application_scenarios.split("\n").map((item) => item.trim()).filter(Boolean);
    if (scenarios.length > 6 || scenarios.some((item) => item.length > 160)) errors.application_scenarios = "最多填写 6 个场景，每项不超过 160 个字符。";
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
    setSubmitting(true);
    try {
      if (isEdit && areaId) {
        const patch: ResearchAreaUpdate = {
          title: form.title,
          slug: form.slug,
          description: form.description,
          problem_statement: emptyToNull(form.problem_statement),
          application_scenarios: form.application_scenarios.split("\n").map((item) => item.trim()).filter(Boolean),
          representative_project_id: form.representative_project_id || null,
          sort_order: sortOrder,
          is_visible: form.is_visible,
        };
        await api.updateResearchArea(areaId, patch);
        show("success", "已保存修改。");
      } else {
        const input: ResearchAreaCreate = {
          title: form.title,
          slug: form.slug,
          description: form.description,
          problem_statement: emptyToNull(form.problem_statement),
          application_scenarios: form.application_scenarios.split("\n").map((item) => item.trim()).filter(Boolean),
          representative_project_id: form.representative_project_id || null,
          sort_order: sortOrder,
          is_visible: form.is_visible,
        };
        await api.createResearchArea(input);
        show("success", "已创建研究方向。");
      }
      router.push("/admin/research");
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
    return <LoadingBlock label="加载研究方向中…" />;
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
        <ButtonLink href="/admin/research" variant="secondary">
          返回研究方向列表
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="admin-page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            {"SEC.04 // RESEARCH"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {isEdit ? "编辑研究方向" : "新建研究方向"}
          </h1>
        </div>
        <ButtonLink href="/admin/research" variant="ghost">
          ← 返回列表
        </ButtonLink>
      </div>

      <Notice notice={notice} onClose={dismiss} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AdminCard className="space-y-4">
          <Field
            label="标题"
            htmlFor="research-title"
            required
            error={fieldErrors.title}
          >
            <Input
              id="research-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              maxLength={TITLE_MAX}
              invalid={Boolean(fieldErrors.title)}
            />
          </Field>
          <Field
            label="Slug"
            htmlFor="research-slug"
            required
            error={fieldErrors.slug}
            hint="仅字母、数字与连字符。"
          >
            <Input
              id="research-slug"
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              maxLength={SLUG_MAX}
              invalid={Boolean(fieldErrors.slug)}
            />
          </Field>
          <Field
            label="描述"
            htmlFor="research-description"
            required
            error={fieldErrors.description}
          >
            <Textarea
              id="research-description"
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              invalid={Boolean(fieldErrors.description)}
            />
          </Field>
          <Field label="问题陈述" htmlFor="research-problem" error={fieldErrors.problem_statement} hint="留空时前台使用描述作为问题说明。">
            <Textarea id="research-problem" rows={3} value={form.problem_statement} onChange={(e) => setField("problem_statement", e.target.value)} invalid={Boolean(fieldErrors.problem_statement)} />
          </Field>
          <Field label="应用场景（每行一项）" htmlFor="research-scenarios" error={fieldErrors.application_scenarios} hint="最多 6 项，每项不超过 160 个字符。">
            <Textarea id="research-scenarios" rows={4} value={form.application_scenarios} onChange={(e) => setField("application_scenarios", e.target.value)} invalid={Boolean(fieldErrors.application_scenarios)} />
          </Field>
          <Field label="代表项目" htmlFor="research-representative-project" error={fieldErrors.representative_project_id} hint="可清除；仅从项目 API 中选择。">
            <select id="research-representative-project" value={form.representative_project_id} onChange={(e) => setField("representative_project_id", e.target.value)} className="h-10 w-full rounded-md border border-hairline-strong bg-transparent px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              <option value="">不设置代表项目</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
          </Field>
          <Field
            label="排序"
            htmlFor="research-sort"
            error={fieldErrors.sort_order}
            hint="数值越小越靠前。"
          >
            <Input
              id="research-sort"
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
            label="前台显示"
            description="关闭后该研究方向不会出现在前台。"
          />
        </AdminCard>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" loading={submitting}>
            {isEdit ? "保存修改" : "创建"}
          </Button>
          <ButtonLink href="/admin/research" variant="ghost">
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
