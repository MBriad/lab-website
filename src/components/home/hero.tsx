"use client";

import { MagneticButton } from "@/components/motion/magnetic-button";
import { Starfield } from "@/components/motion/starfield";
import { Container } from "@/components/ui/container";
import { HudLink } from "@/components/ui/hud-link";
import { isoYear } from "@/lib/format";
import type { SiteSettingsPublic } from "@/lib/types/api";

export interface HeroProps {
  settings: SiteSettingsPublic;
}

/**
 * Full-viewport focal point: star-dust canvas backdrop, HUD corner frame,
 * high-impact display typography from site settings, magnetic CTAs and a
 * scroll cue. Entrance uses CSS animations neutralized by the global
 * reduced-motion kill-switch; the starfield skips itself for reduced
 * motion / small screens.
 */
export function Hero({ settings }: HeroProps) {
  const est = isoYear(settings.created_at);

  return (
    <section
      aria-label="首页焦点"
      className="relative flex min-h-svh items-center overflow-hidden"
    >
      <Starfield className="opacity-80" />

      {/* HUD corner frame with breathing accents. */}
      <div aria-hidden className="pointer-events-none absolute inset-4 sm:inset-6">
        <span className="absolute top-0 left-0 h-10 w-10 border-t border-l border-accent/40 animate-breathe" />
        <span
          className="absolute top-0 right-0 h-10 w-10 border-t border-r border-accent/40 animate-breathe"
          style={{ animationDelay: "1.2s" }}
        />
        <span
          className="absolute bottom-0 left-0 h-10 w-10 border-b border-l border-accent/40 animate-breathe"
          style={{ animationDelay: "2.1s" }}
        />
        <span
          className="absolute right-0 bottom-0 h-10 w-10 border-r border-b border-accent/40 animate-breathe"
          style={{ animationDelay: "0.6s" }}
        />
      </div>

      {/* Contrast scrim so copy stays readable over the particle field. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-background/60 via-transparent to-background"
      />

      <Container className="relative z-10 py-28">
        <p
          className="font-mono text-xs tracking-[0.35em] text-accent uppercase animate-fade-up"
          style={{ animationDelay: "0.05s" }}
        >
          {`SYS.ONLINE // ${settings.lab_name}`}
        </p>
        <h1
          className="mt-6 max-w-4xl font-display text-[clamp(2.5rem,7vw,5rem)] leading-[1.08] font-semibold tracking-tight animate-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          {settings.hero_title ?? settings.lab_name}
        </h1>
        {settings.hero_subtitle ? (
          <p
            className="mt-6 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8 animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            {settings.hero_subtitle}
          </p>
        ) : null}
        <p
          className="mt-8 font-mono text-[11px] tracking-[0.3em] text-ink-faint uppercase animate-fade-up"
          style={{ animationDelay: "0.4s" }}
        >
          {settings.tagline ?? "ROBOTICS · INTELLIGENCE · EDUCATION"}
          {est ? <> · EST.{est}</> : null}
        </p>
        <div
          className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
          style={{ animationDelay: "0.5s" }}
        >
          <MagneticButton>
            <HudLink href="/projects">浏览科研项目</HudLink>
          </MagneticButton>
          <MagneticButton strength={0.22}>
            <HudLink href="#contact" variant="ghost" withArrow={false}>
              加入实验室
            </HudLink>
          </MagneticButton>
        </div>
      </Container>

      {/* Scroll cue. */}
      <div aria-hidden className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.4em] text-ink-faint uppercase">
            Scroll
          </span>
          <span className="block h-10 w-px bg-accent/70 animate-scroll-cue" />
        </div>
      </div>
    </section>
  );
}
