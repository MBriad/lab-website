"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, hasAuthToken, clearAuthToken } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { AdminPublic } from "@/lib/types/api";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";

interface AdminNavItem {
  href: string;
  label: string;
  /** Exact match (dashboard) vs prefix match (sections). */
  exact?: boolean;
}

const NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "仪表盘", exact: true },
  { href: "/admin/news", label: "新闻" },
  { href: "/admin/projects", label: "项目" },
  { href: "/admin/research", label: "研究方向" },
  { href: "/admin/awards", label: "荣誉" },
  { href: "/admin/media", label: "素材库" },
  { href: "/admin/settings", label: "设置" },
];

function isActive(pathname: string, item: AdminNavItem): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export interface AdminShellProps {
  children: ReactNode;
}

/**
 * Client-side auth-guarded admin chrome: left sidebar (top drawer on small
 * screens), top bar with lab name + admin username + logout. Calm styling on
 * the shared tokens — deliberately none of the public site's motion.
 */
export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [status, setStatus] = useState<"checking" | "authed" | "denied">(
    "checking",
  );
  const [admin, setAdmin] = useState<AdminPublic | null>(null);
  const [labName, setLabName] = useState<string>("管理后台");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Auth is decided solely by `getMe()`; a settings fetch failure should not
  // log the user out.
  useEffect(() => {
    if (isLoginPage) return; // login page guards itself
    if (!hasAuthToken()) {
      router.replace("/admin/login");
      return;
    }
    let cancelled = false;
    api
      .getMe()
      .then((me) => {
        if (cancelled) return;
        setAdmin(me);
        setStatus("authed");
      })
      .catch(() => {
        if (cancelled) return;
        clearAuthToken();
        setStatus("denied");
        router.replace("/admin/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router, isLoginPage]);

  // Best-effort lab name for the top bar / sidebar (public read, not auth-gated).
  useEffect(() => {
    let cancelled = false;
    api
      .getSiteSettings()
      .then((settings) => {
        if (!cancelled) setLabName(settings.lab_name);
      })
      .catch(() => {
        // Keep the default label.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await api.logout();
    } catch {
      // Even if the backend call fails, clear the token and leave.
    } finally {
      clearAuthToken();
      router.replace("/admin/login");
    }
  }, [router]);

  // The login route renders without the guarded chrome.
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status !== "authed") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          role="status"
          className="flex items-center gap-3 text-sm text-ink-muted"
        >
          <Spinner className="text-accent" />
          <span>{status === "denied" ? "登录已过期…" : "正在验证身份…"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Sidebar (fixed on desktop) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 border-r border-hairline bg-surface",
          "flex-col transition-transform duration-150 lg:flex lg:translate-x-0",
          drawerOpen ? "flex translate-x-0" : "hidden -translate-x-full lg:flex",
        )}
      >
        <div className="border-b border-hairline px-4 py-4">
          <p className="font-mono text-[11px] tracking-[0.3em] text-accent uppercase">
            {"ADMIN // 控制台"}
          </p>
          <p className="mt-1 truncate font-display text-sm font-semibold text-ink">
            {labName}
          </p>
        </div>
        <nav aria-label="管理导航" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeDrawer}
                  aria-current={isActive(pathname, item) ? "page" : undefined}
                  className={cn(
                    "block rounded-hud px-3 py-2 text-sm transition-colors",
                    isActive(pathname, item)
                      ? "bg-accent/10 text-accent"
                      : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-hairline p-3">
          <Link
            href="/"
            onClick={closeDrawer}
            className="block rounded-hud px-3 py-2 font-mono text-xs text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink-muted"
          >
            ← 返回前台站点
          </Link>
        </div>
      </aside>

      {/* Mobile drawer backdrop */}
      {drawerOpen ? (
        <button
          type="button"
          aria-label="关闭菜单"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface/80 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            aria-label={drawerOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={drawerOpen}
            className="grid h-9 w-9 place-items-center rounded-hud border border-hairline text-ink-muted transition-colors hover:border-accent/50 hover:text-accent lg:hidden"
          >
            <span aria-hidden className="font-mono text-sm">
              {drawerOpen ? "×" : "≡"}
            </span>
          </button>
          <p className="truncate font-display text-sm font-semibold text-ink">
            {labName}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden font-mono text-xs text-ink-faint sm:inline">
              {admin ? admin.username : "…"}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              loading={loggingOut}
            >
              退出登录
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
