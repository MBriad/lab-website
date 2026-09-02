"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/cn";
import type { MediaPublic } from "@/lib/types/api";
import { NAV_LINKS, isNavActive } from "./nav-links";

export interface NavbarProps {
  /** `lab_name` from site settings (falls back to a static label upstream). */
  labName: string;
  /** Configured laboratory mark, when available. */
  logo?: MediaPublic | null;
}

/**
 * Fixed public navbar.
 *
 * - Translucent + blur after scrolling past the hero edge.
 * - Remains visible during scrolling so the site routes are always available.
 * - Active route highlighting via `usePathname`.
 * - Mobile: full-screen overlay with staggered link entrances; scroll is
 *   locked while open and Escape closes it.
 * Scroll bookkeeping runs inside rAF and only flips discrete booleans —
 * never per-frame React state. All listeners/rAF are cleaned up.
 */
export function Navbar({ labName, logo = null }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const next = window.scrollY > 50;
      setScrolled((current) => (current === next ? current : next));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Close the mobile menu whenever the route changes (deferred to a timer
  // callback: direct synchronous setState inside an effect body is a
  // cascading-render anti-pattern).
  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // Body scroll lock + Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        data-motion-probe="nav"
        data-scrolled={scrolled ? "true" : "false"}
        className={cn(
          "public-nav fixed inset-x-0 top-0 z-40",
          scrolled ? "public-nav-scrolled" : "public-nav-top",
        )}
      >
        <nav
          aria-label="主导航"
          className="public-nav-inner mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <Link href="/" className="public-nav-brand flex items-center gap-3" aria-label={`${labName} 首页`}>
            {logo ? (
              <MediaImage
                media={logo}
                alt={`${labName} 标志`}
                mode="cover"
                className="h-9 w-9 shrink-0 rounded-[13px] border border-white/80 bg-white/75 p-1 shadow-[0_8px_20px_rgba(113,148,255,0.14)]"
                sizes="36px"
                priority
                imgClassName="object-contain"
              />
            ) : (
              <span aria-hidden className="relative grid h-9 w-9 place-items-center rounded-[13px] border border-white/80 bg-linear-to-br from-accent/20 via-white/60 to-signal/20 shadow-[0_8px_20px_rgba(113,148,255,0.14)]">
                <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-accent/70" />
                <span className="absolute right-1.5 bottom-1.5 h-1.5 w-1.5 rounded-full bg-signal/75" />
                <span className="h-2.5 w-2.5 rotate-45 rounded-[3px] bg-linear-to-br from-accent to-signal shadow-glow-accent" />
              </span>
            )}
            <span className="flex flex-col leading-none">
              <span className="font-display text-sm font-semibold tracking-wide">
                {labName}
              </span>
              <span className="mt-1 font-mono text-[9px] tracking-[0.28em] text-ink-faint uppercase">
                Robotics Lab
              </span>
            </span>
          </Link>

          <div className="hidden items-center md:flex">
            {NAV_LINKS.map((link) => {
              const active = isNavActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "public-nav-link group relative px-3 py-2 text-sm transition-colors",
                    active ? "text-accent" : "text-ink-muted hover:text-ink",
                  )}
                >
                  <span aria-hidden className="mr-1.5 font-mono text-[10px] text-ink-faint">
                    {link.code}
                  </span>
                  {link.label}
                  {active ? (
                    <span aria-hidden className="public-nav-link-line public-nav-link-line-active" />
                  ) : (
                    <span aria-hidden className="public-nav-link-line" />
                  )}
                </Link>
              );
            })}
            <Link
              href="/#contact"
              className="glass-chip ml-3 px-4 py-2 font-mono text-xs tracking-[0.18em] text-accent uppercase transition-[background-color,border-color,box-shadow] hover:border-accent/50 hover:bg-white/75 hover:shadow-glow-accent"
            >
              联系我们
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="打开导航菜单"
            className="glass-chip grid h-10 w-10 place-items-center p-0 text-ink md:hidden"
          >
            <span aria-hidden className="flex flex-col gap-1.5">
              <span className="h-px w-5 bg-current" />
              <span className="h-px w-5 bg-current" />
            </span>
          </button>
        </nav>
      </header>

      {open ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="导航菜单"
          className="fixed inset-0 z-50 flex flex-col bg-white/94 backdrop-blur-2xl md:hidden"
        >
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-mono text-xs tracking-[0.28em] text-ink-faint uppercase">
              {labName}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="关闭导航菜单"
              className="glass-chip grid h-10 w-10 place-items-center p-0 text-lg text-ink"
            >
              ✕
            </button>
          </div>

          <nav aria-label="移动端导航" className="flex flex-1 flex-col justify-center px-6">
            {NAV_LINKS.map((link, i) => {
              const active = isNavActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-baseline gap-4 border-b border-hairline py-4 animate-fade-up",
                    active ? "text-accent" : "text-ink",
                  )}
                  style={{ animationDelay: `${80 + i * 70}ms` }}
                >
                  <span className="font-mono text-xs text-ink-faint">{link.code}</span>
                  <span className="font-display text-3xl font-semibold">{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className="flex items-baseline gap-4 border-b border-hairline py-4 text-ink animate-fade-up"
              style={{ animationDelay: `${80 + NAV_LINKS.length * 70}ms` }}
            >
              <span className="font-mono text-xs text-ink-faint">06</span>
              <span className="font-display text-3xl font-semibold">联系我们</span>
            </Link>
          </nav>

          <p className="px-6 pb-8 font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase">
            {"Xinghang Robotics Lab // Nav.SYS"}
          </p>
        </div>
      ) : null}
    </>
  );
}
