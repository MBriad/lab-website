"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Button, ButtonLink } from "@/components/admin/ui/button";
import { AdminCard, AdminCardHeading } from "@/components/admin/ui/card";
import { Field } from "@/components/admin/ui/field";
import { Input } from "@/components/admin/ui/input";
import { Select } from "@/components/admin/ui/select";
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
import {
  AWARD_CATEGORIES,
  AWARD_LEVELS,
  type AwardCategory,
  type AwardCreate,
  type AwardLevel,
  type AwardUpdate,
  type MediaAdmin,
  type MediaPublic,
} from "@/lib/types/api";
import {
  AWARD_CATEGORY_LABELS,
  AWARD_LEVEL_LABELS,
} from "@/components/ui/badges";
import { isoYear } from "@/lib/format";

const TITLE_MAX = 255;
const ISSUER_MAX = 255;
const COMPETITION_MAX = 255;
const YEAR_MIN = 1900;
const YEAR_MAX = 2200;

interface FormState {
  title: string;
  category: AwardCategory;
  level: AwardLevel;
  issuer: string;
  competition_name: string;
  description: string;
  award_date: string;
  year: string;
  certificate: MediaPublic | null;
  cover: MediaPublic | null;
  sort_order: string;
  is_featured: boolean;
  is_visible: boolean;
}

interface AwardFormProps {
  awardId?: string;
}

/** Shared create/edit form for awards. */
export function AwardForm({ awardId }: AwardFormProps) {
  const router = useRouter();
  const isEdit = Boolean(awardId);
  const { notice, show, dismiss } = useNotice();

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<FormState>({
    title: "",
    category: "competition",
    level: "national",
    issuer: "",
    competition_name: "",
    description: "",
    award_date: today,
    year: String(isoYear(today) ?? new Date().getUTCFullYear()),
    certificate: null,
    cover: null,
    sort_order: "0",
    is_featured: false,
    is_visible: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!awardId) return;
    let cancelled = false;
    api
      .getAdminAward(awardId)
      .then((award) => {
        if (cancelled) return;
        setForm({
          title: award.title,
          category: award.category,
          level: award.level,
          issuer: award.issuer,
          competition_name: award.competition_name,
          description: award.description,
          award_date: award.award_date,
          year: String(award.year),
          certificate: award.certificate,
          cover: award.cover,
          sort_order: String(award.sort_order),
          is_featured: award.is_featured,
          is_visible: award.is_visible,
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
          isNotFoundError(err) ? "该荣誉不存在或已被删除。" : describeApiError(err, "加载失败"),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [awardId, router]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Changing the award date keeps `year` consistent unless the user overrides it.
  const handleDateChange = (value: string) => {
    const derivedYear = isoYear(value);
    setForm((prev) => ({
      ...prev,
      award_date: value,
      year: derivedYear !== null ? String(derivedYear) : prev.year,
    }));
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "请输入标题。";
    else if (form.title.length > TITLE_MAX)
      errors.title = `标题不能超过 ${TITLE_MAX} 个字符。`;
    if (!form.issuer.trim()) errors.issuer = "请输入颁发单位。";
    else if (form.issuer.length > ISSUER_MAX)
      errors.issuer = `颁发单位不能超过 ${ISSUER_MAX} 个字符。`;
    if (!form.competition_name.trim())
      errors.competition_name = "请输入赛事/项目名称。";
    else if (form.competition_name.length > COMPETITION_MAX)
      errors.competition_name = `赛事名称不能超过 ${COMPETITION_MAX} 个字符。`;
    if (!form.description.trim()) errors.description = "请输入描述。";
    if (!form.award_date) errors.award_date = "请选择获奖日期。";
    const year = Number(form.year);
    if (!Number.isInteger(year) || year < YEAR_MIN || year > YEAR_MAX)
      errors.year = `年份需为 ${YEAR_MIN}–${YEAR_MAX} 的整数。`;
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
    const year = Number(form.year);
    setSubmitting(true);
    try {
      if (isEdit && awardId) {
        const patch: AwardUpdate = {
          title: form.title,
          category: form.category,
          level: form.level,
          issuer: form.issuer,
          competition_name: form.competition_name,
          description: form.description,
          award_date: form.award_date,
          year,
          certificate_media_id: form.certificate ? form.certificate.id : null,
          cover_media_id: form.cover ? form.cover.id : null,
          sort_order: sortOrder,
          is_featured: form.is_featured,
          is_visible: form.is_visible,
        };
        await api.updateAward(awardId, patch);
        show("success", "已保存修改。");
      } else {
        const input: AwardCreate = {
          title: form.title,
          category: form.category,
          level: form.level,
          issuer: form.issuer,
          competition_name: form.competition_name,
          description: form.description,
          award_date: form.award_date,
          year,
          certificate_media_id: form.certificate ? form.certificate.id : null,
          cover_media_id: form.cover ? form.cover.id : null,
          sort_order: sortOrder,
          is_featured: form.is_featured,
          is_visible: form.is_visible,
        };
        await api.createAward(input);
        show("success", "已创建荣誉。");
      }
      router.push("/admin/awards");
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
    return <LoadingBlock label="加载荣誉中…" />;
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
        <ButtonLink href="/admin/awards" variant="secondary">
          返回荣誉列表
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="admin-page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            {"SEC.05 // AWARDS"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {isEdit ? "编辑荣誉" : "新建荣誉"}
          </h1>
        </div>
        <ButtonLink href="/admin/awards" variant="ghost">
          ← 返回列表
        </ButtonLink>
      </div>

      <Notice notice={notice} onClose={dismiss} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AdminCard className="space-y-4">
          <AdminCardHeading title="基本信息" />
          <Field
            label="标题"
            htmlFor="award-title"
            required
            error={fieldErrors.title}
          >
            <Input
              id="award-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              maxLength={TITLE_MAX}
              invalid={Boolean(fieldErrors.title)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="类别" htmlFor="award-category" required>
              <Select
                id="award-category"
                value={form.category}
                onChange={(e) => setField("category", e.target.value as AwardCategory)}
              >
                {AWARD_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {AWARD_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="级别" htmlFor="award-level" required>
              <Select
                id="award-level"
                value={form.level}
                onChange={(e) => setField("level", e.target.value as AwardLevel)}
              >
                {AWARD_LEVELS.map((value) => (
                  <option key={value} value={value}>
                    {AWARD_LEVEL_LABELS[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="颁发单位"
            htmlFor="award-issuer"
            required
            error={fieldErrors.issuer}
          >
            <Input
              id="award-issuer"
              value={form.issuer}
              onChange={(e) => setField("issuer", e.target.value)}
              maxLength={ISSUER_MAX}
              invalid={Boolean(fieldErrors.issuer)}
            />
          </Field>
          <Field
            label="赛事 / 项目名称"
            htmlFor="award-competition"
            required
            error={fieldErrors.competition_name}
          >
            <Input
              id="award-competition"
              value={form.competition_name}
              onChange={(e) => setField("competition_name", e.target.value)}
              maxLength={COMPETITION_MAX}
              invalid={Boolean(fieldErrors.competition_name)}
            />
          </Field>
          <Field
            label="描述"
            htmlFor="award-description"
            required
            error={fieldErrors.description}
          >
            <Textarea
              id="award-description"
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              invalid={Boolean(fieldErrors.description)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="获奖日期"
              htmlFor="award-date"
              required
              error={fieldErrors.award_date}
            >
              <Input
                id="award-date"
                type="date"
                value={form.award_date}
                onChange={(e) => handleDateChange(e.target.value)}
                invalid={Boolean(fieldErrors.award_date)}
              />
            </Field>
            <Field
              label="年份"
              htmlFor="award-year"
              required
              error={fieldErrors.year}
              hint="默认随获奖日期推导，可手动修正。"
            >
              <Input
                id="award-year"
                type="number"
                min={YEAR_MIN}
                max={YEAR_MAX}
                step={1}
                value={form.year}
                onChange={(e) => setField("year", e.target.value)}
                invalid={Boolean(fieldErrors.year)}
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard className="space-y-4">
          <AdminCardHeading
            title="图片"
            description="证书与赛事/项目图片均可从素材库选择或上传。"
          />
          <MediaPickerField
            label="证书图片"
            value={form.certificate}
            onChange={(media: MediaAdmin | null) => setField("certificate", media)}
            hint="可选；获奖证书扫描件或照片。"
          />
          <MediaPickerField
            label="赛事 / 项目图片"
            value={form.cover}
            onChange={(media: MediaAdmin | null) => setField("cover", media)}
            hint="可选；现场照片或项目图。"
          />
        </AdminCard>

        <AdminCard className="space-y-4">
          <AdminCardHeading title="展示设置" />
          <Field
            label="排序"
            htmlFor="award-sort"
            error={fieldErrors.sort_order}
            hint="数值越小越靠前。"
          >
            <Input
              id="award-sort"
              type="number"
              min={0}
              step={1}
              value={form.sort_order}
              onChange={(e) => setField("sort_order", e.target.value)}
              invalid={Boolean(fieldErrors.sort_order)}
            />
          </Field>
          <Switch
            checked={form.is_featured}
            onCheckedChange={(checked) => setField("is_featured", checked)}
            label="设为首页精选"
            description="精选奖项会展示在首页荣誉区域。"
          />
          <Switch
            checked={form.is_visible}
            onCheckedChange={(checked) => setField("is_visible", checked)}
            label="前台显示"
            description="关闭后该奖项不会出现在前台。"
          />
        </AdminCard>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" loading={submitting}>
            {isEdit ? "保存修改" : "创建"}
          </Button>
          <ButtonLink href="/admin/awards" variant="ghost">
            取消
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
