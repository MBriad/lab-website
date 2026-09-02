"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/admin/ui/button";
import { AdminCard, AdminCardHeading } from "@/components/admin/ui/card";
import { Field } from "@/components/admin/ui/field";
import { Input } from "@/components/admin/ui/input";
import { Textarea } from "@/components/admin/ui/textarea";
import { Notice, useNotice } from "@/components/admin/ui/notice";
import { LoadingBlock } from "@/components/admin/ui/spinner";
import { MediaPickerField } from "@/components/admin/media-picker";
import {
  describeApiError,
  extractFieldErrors,
  isAuthError,
} from "@/components/admin/lib/errors";
import { redirectToLogin } from "@/components/admin/lib/auth";
import type {
  MediaAdmin,
  MediaPublic,
  SiteSettingsUpdate,
} from "@/lib/types/api";

const TITLE_MAX = 255;
const ADDRESS_MAX = 500;
const SOCIAL_MAX = 500;
const PHONE_MAX = 80;

interface FormState {
  site_title: string;
  lab_name: string;
  tagline: string;
  description: string;
  hero_title: string;
  hero_subtitle: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  social_github: string;
  social_bilibili: string;
  social_email: string;
  logo: MediaPublic | null;
}

const EMPTY_FORM: FormState = {
  site_title: "",
  lab_name: "",
  tagline: "",
  description: "",
  hero_title: "",
  hero_subtitle: "",
  address: "",
  contact_email: "",
  contact_phone: "",
  social_github: "",
  social_bilibili: "",
  social_email: "",
  logo: null,
};

/**
 * Single form over `SiteSettingsUpdate`. The contract has one `lab_name`
 * (no bilingual names) and no school/college fields — those live in the
 * free-text `address`/`description`. Save uses PATCH semantics.
 */
export function SettingsForm() {
  const router = useRouter();
  const { notice, show, dismiss } = useNotice();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getAdminSiteSettings()
      .then((settings) => {
        if (cancelled) return;
        setForm({
          site_title: settings.site_title,
          lab_name: settings.lab_name,
          tagline: settings.tagline ?? "",
          description: settings.description ?? "",
          hero_title: settings.hero_title ?? "",
          hero_subtitle: settings.hero_subtitle ?? "",
          address: settings.address ?? "",
          contact_email: settings.contact_email ?? "",
          contact_phone: settings.contact_phone ?? "",
          social_github: settings.social_github ?? "",
          social_bilibili: settings.social_bilibili ?? "",
          social_email: settings.social_email ?? "",
          logo: settings.logo,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isAuthError(err)) {
          redirectToLogin(router);
          return;
        }
        setLoadError(describeApiError(err, "站点设置加载失败"));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.site_title.trim()) errors.site_title = "请输入站点标题。";
    else if (form.site_title.length > TITLE_MAX)
      errors.site_title = `站点标题不能超过 ${TITLE_MAX} 个字符。`;
    if (!form.lab_name.trim()) errors.lab_name = "请输入实验室名称。";
    else if (form.lab_name.length > TITLE_MAX)
      errors.lab_name = `实验室名称不能超过 ${TITLE_MAX} 个字符。`;
    if (form.tagline.length > TITLE_MAX)
      errors.tagline = `标语不能超过 ${TITLE_MAX} 个字符。`;
    if (form.hero_title.length > TITLE_MAX)
      errors.hero_title = `主标题不能超过 ${TITLE_MAX} 个字符。`;
    if (form.address.length > ADDRESS_MAX)
      errors.address = `地址不能超过 ${ADDRESS_MAX} 个字符。`;
    if (form.contact_phone.length > PHONE_MAX)
      errors.contact_phone = `联系电话不能超过 ${PHONE_MAX} 个字符。`;
    if (form.social_github.length > SOCIAL_MAX)
      errors.social_github = `GitHub 链接不能超过 ${SOCIAL_MAX} 个字符。`;
    if (form.social_bilibili.length > SOCIAL_MAX)
      errors.social_bilibili = `Bilibili 链接不能超过 ${SOCIAL_MAX} 个字符。`;
    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email))
      errors.contact_email = "请输入有效的邮箱地址。";
    if (form.social_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.social_email))
      errors.social_email = "请输入有效的邮箱地址。";
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const patch: SiteSettingsUpdate = {
      site_title: form.site_title,
      lab_name: form.lab_name,
      tagline: emptyToNull(form.tagline),
      description: emptyToNull(form.description),
      hero_title: emptyToNull(form.hero_title),
      hero_subtitle: emptyToNull(form.hero_subtitle),
      address: emptyToNull(form.address),
      contact_email: emptyToNull(form.contact_email),
      contact_phone: emptyToNull(form.contact_phone),
      social_github: emptyToNull(form.social_github),
      social_bilibili: emptyToNull(form.social_bilibili),
      social_email: emptyToNull(form.social_email),
      logo_media_id: form.logo ? form.logo.id : null,
    };

    setSubmitting(true);
    try {
      const saved = await api.updateSiteSettings(patch);
      setForm((prev) => ({ ...prev, logo: saved.logo }));
      show("success", "站点设置已保存。");
    } catch (err) {
      if (isAuthError(err)) {
        redirectToLogin(router);
        return;
      }
      const fields = extractFieldErrors(err);
      if (fields) setFieldErrors(fields);
      show("error", describeApiError(err, "保存失败，请重试"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingBlock label="加载站点设置中…" />;
  }
  if (loadError) {
    return (
      <div role="alert" className="rounded-panel border border-danger/50 bg-danger/10 px-4 py-6 text-center text-sm text-danger">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
          {"SEC.07 // SETTINGS"}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          站点设置
        </h1>
        <p className="mt-1 text-xs text-ink-muted">
          站点标题、实验室名称、首页文案与联系方式。
        </p>
      </div>

      <Notice notice={notice} onClose={dismiss} />

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AdminCard className="space-y-4">
          <AdminCardHeading title="基础信息" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="站点标题"
              htmlFor="settings-site-title"
              required
              error={fieldErrors.site_title}
            >
              <Input
                id="settings-site-title"
                value={form.site_title}
                onChange={(e) => setField("site_title", e.target.value)}
                maxLength={TITLE_MAX}
                invalid={Boolean(fieldErrors.site_title)}
              />
            </Field>
            <Field
              label="实验室名称"
              htmlFor="settings-lab-name"
              required
              error={fieldErrors.lab_name}
            >
              <Input
                id="settings-lab-name"
                value={form.lab_name}
                onChange={(e) => setField("lab_name", e.target.value)}
                maxLength={TITLE_MAX}
                invalid={Boolean(fieldErrors.lab_name)}
              />
            </Field>
          </div>
          <Field
            label="标语"
            htmlFor="settings-tagline"
            error={fieldErrors.tagline}
          >
            <Input
              id="settings-tagline"
              value={form.tagline}
              onChange={(e) => setField("tagline", e.target.value)}
              maxLength={TITLE_MAX}
              invalid={Boolean(fieldErrors.tagline)}
            />
          </Field>
          <Field label="实验室简介" htmlFor="settings-description">
            <Textarea
              id="settings-description"
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </Field>
        </AdminCard>

        <AdminCard className="space-y-4">
          <AdminCardHeading title="首页主视觉" />
          <Field
            label="主标题"
            htmlFor="settings-hero-title"
            error={fieldErrors.hero_title}
          >
            <Input
              id="settings-hero-title"
              value={form.hero_title}
              onChange={(e) => setField("hero_title", e.target.value)}
              maxLength={TITLE_MAX}
              invalid={Boolean(fieldErrors.hero_title)}
            />
          </Field>
          <Field label="副标题" htmlFor="settings-hero-subtitle">
            <Textarea
              id="settings-hero-subtitle"
              rows={2}
              value={form.hero_subtitle}
              onChange={(e) => setField("hero_subtitle", e.target.value)}
            />
          </Field>
        </AdminCard>

        <AdminCard className="space-y-4">
          <AdminCardHeading title="联系方式" />
          <Field
            label="地址"
            htmlFor="settings-address"
            error={fieldErrors.address}
            hint="可包含学校、学院、楼栋等自由文本。"
          >
            <Input
              id="settings-address"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              maxLength={ADDRESS_MAX}
              invalid={Boolean(fieldErrors.address)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="联系邮箱"
              htmlFor="settings-contact-email"
              error={fieldErrors.contact_email}
            >
              <Input
                id="settings-contact-email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setField("contact_email", e.target.value)}
                invalid={Boolean(fieldErrors.contact_email)}
              />
            </Field>
            <Field
              label="联系电话"
              htmlFor="settings-contact-phone"
              error={fieldErrors.contact_phone}
            >
              <Input
                id="settings-contact-phone"
                value={form.contact_phone}
                onChange={(e) => setField("contact_phone", e.target.value)}
                maxLength={PHONE_MAX}
                invalid={Boolean(fieldErrors.contact_phone)}
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard className="space-y-4">
          <AdminCardHeading title="社交链接" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="GitHub"
              htmlFor="settings-social-github"
              error={fieldErrors.social_github}
            >
              <Input
                id="settings-social-github"
                value={form.social_github}
                onChange={(e) => setField("social_github", e.target.value)}
                maxLength={SOCIAL_MAX}
                invalid={Boolean(fieldErrors.social_github)}
              />
            </Field>
            <Field
              label="Bilibili"
              htmlFor="settings-social-bilibili"
              error={fieldErrors.social_bilibili}
            >
              <Input
                id="settings-social-bilibili"
                value={form.social_bilibili}
                onChange={(e) => setField("social_bilibili", e.target.value)}
                maxLength={SOCIAL_MAX}
                invalid={Boolean(fieldErrors.social_bilibili)}
              />
            </Field>
          </div>
          <Field
            label="社交邮箱"
            htmlFor="settings-social-email"
            error={fieldErrors.social_email}
          >
            <Input
              id="settings-social-email"
              type="email"
              value={form.social_email}
              onChange={(e) => setField("social_email", e.target.value)}
              invalid={Boolean(fieldErrors.social_email)}
            />
          </Field>
        </AdminCard>

        <AdminCard className="space-y-4">
          <AdminCardHeading title="品牌标识" />
          <MediaPickerField
            label="Logo"
            value={form.logo}
            onChange={(media: MediaAdmin | null) => setField("logo", media)}
            hint="用于导航与页脚。"
          />
        </AdminCard>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" loading={submitting}>
            保存设置
          </Button>
        </div>
      </form>
    </div>
  );
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
