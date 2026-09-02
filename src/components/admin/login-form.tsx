"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api, getApiMode, hasAuthToken } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { Button } from "./ui/button";
import { Field } from "./ui/field";
import { Input } from "./ui/input";

/**
 * `/admin/login` card. Shows fixture credentials only in explicitly enabled
 * mock mode (dev convenience; never rendered against the production backend).
 */
export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated -> straight to the dashboard.
  useEffect(() => {
    if (hasAuthToken()) router.replace("/admin");
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.login({ username: username.trim(), password });
      router.push("/admin");
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        setError("用户名或密码错误");
      } else if (err instanceof ApiError) {
        setError(err.body?.message ?? "登录失败，请稍后重试");
      } else {
        setError("登录失败，请稍后重试");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-surface">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-brand-mark" aria-hidden>
            R
          </span>
          <div>
            <p className="admin-login-kicker">ROBOTICS LAB / CMS</p>
            <p className="mt-0.5 font-display text-sm font-semibold text-ink">
              内容管理后台
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            管理员登录
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            管理实验室官网的新闻、项目、荣誉与媒体内容。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
          <Field label="用户名" htmlFor="admin-username" required>
            <Input
              id="admin-username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={100}
              required
            />
          </Field>
          <Field label="密码" htmlFor="admin-password" required>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={256}
              required
            />
          </Field>

          {error ? (
            <p role="alert" className="admin-notice rounded-hud border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            className="w-full"
          >
            登录
          </Button>
        </form>

        {getApiMode() === "mock" ? (
          <p className="admin-demo-hint mt-5 rounded-hud border border-hairline bg-surface-2/60 px-3 py-2.5 font-mono text-xs text-ink-faint">
            演示模式（mock）：admin / admin123
          </p>
        ) : null}

        <p className="mt-5 text-center">
          <Link
            href="/"
            prefetch={false}
            className="font-mono text-xs text-ink-faint transition-colors hover:text-accent"
          >
            ← 返回前台首页
          </Link>
        </p>
      </div>
    </div>
  );
}
