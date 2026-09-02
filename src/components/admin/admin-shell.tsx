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
  code: string;
  /** Exact match (dashboard) vs prefix match (sections). */
  exact?: boolean;
}

const NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "仪表盘", code: "00", exact: true },
  { href: "/admin/news", label: "新闻", code: "01" },
  { href: "/admin/projects", label: "项目", code: "02" },
  { href: "/admin/research", label: "研究方向", code: "03" },
  { href: "/admin/awards", label: "荣誉", code: "04" },
  { href: "/admin/media", label: "素材库", code: "05" },
  { href: "/admin/settings", label: "设置", code: "06" },
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

  // Prevent the page behind the mobile drawer from moving while it is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

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
    return <div className="admin-site min-h-screen">{children}</div>;
  }

  if (status !== "authed") {
    return (
      <div className="admin-site flex min-h-screen items-center justify-center">
        <div
          role="status"
          className="flex items-center gap-3 rounded-panel border border-hairline bg-surface/80 px-5 py-4 text-sm text-ink-muted shadow-panel"
        >
          <Spinner className="text-accent" />
          <span>{status === "denied" ? "登录已过期…" : "正在验证身份…"}</span>
        </div>
      </div>
    );
  }

  const activeItem = NAV_ITEMS.find((item) => isActive(pathname, item));

  return (
    <div className="admin-site min-h-screen lg:pl-64">
      {/* Sidebar (fixed on desktop) */}
      <aside
        className={cn(
          "admin-shell-sidebar fixed inset-y-0 left-0 z-40 w-64 border-r border-hairline bg-surface",
          "flex-col transition-transform duration-150 lg:flex lg:translate-x-0",
          drawerOpen ? "flex translate-x-0" : "hidden -translate-x-full lg:flex",
        )}
      >
        <div className="admin-sidebar-brand flex items-center gap-3 border-b px-5 py-5">
          <span className="admin-brand-mark" aria-hidden>
            R
          </span>
          <div className="min-w-0">
            <p className="admin-sidebar-eyebrow">ROBOTICS LAB / CMS</p>
            <p className="mt-1 truncate font-display text-sm font-semibold text-ink">
              {labName}
            </p>
          </div>
        </div>
        <nav aria-label="管理导航" className="flex-1 overflow-y-auto px-5 py-6">
          <p className="admin-nav-caption mb-3">内容管理</p>
          <ul className="space-y-1.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeDrawer}
                  aria-current={isActive(pathname, item) ? "page" : undefined}
                  className={cn(
                    "admin-nav-link rounded-hud px-3 py-2",
                    isActive(pathname, item) && "admin-nav-link-active",
                    isActive(pathname, item)
                      ? "text-accent"
                      : "text-ink-muted",
                  )}
                >
                  <span className="admin-nav-index" aria-hidden>
                    {item.code}
                  </span>
                  <span className="min-w-0 flex-1">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="admin-sidebar-footer border-t p-4">
          <Link
            href="/"
            prefetch={false}
            onClick={closeDrawer}
            className="admin-back-link rounded-hud px-3 py-2.5"
          >
            <span>查看前台站点</span>
            <span aria-hidden>↗</span>
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
      <header className="admin-topbar sticky top-0 z-20 border-b backdrop-blur">
        <div className="admin-topbar-inner flex items-center gap-3 px-4 sm:px-8">
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
          <div className="min-w-0 truncate">
            <p className="admin-topbar-eyebrow hidden sm:block">
              {activeItem ? `WORKSPACE / ${activeItem.code}` : "WORKSPACE"}
            </p>
            <p className="admin-context truncate">
              {activeItem?.label ?? labName}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="admin-user hidden sm:inline-flex">
              <span className="admin-user-dot" aria-hidden />
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

      <main className="admin-main">{children}</main>
    </div>
  );
}
