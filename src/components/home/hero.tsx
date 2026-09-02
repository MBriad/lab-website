"use client";

import { DeviceOrientationControl } from "@/components/motion/device-orientation-control";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Container } from "@/components/ui/container";
import { HudLink } from "@/components/ui/hud-link";
import { MediaImage } from "@/components/ui/media-image";
import { isoYear } from "@/lib/format";
import type { MediaPublic, SiteSettingsPublic } from "@/lib/types/api";

export interface HeroProps {
  settings: SiteSettingsPublic;
  heroMedia?: MediaPublic | null;
}

function splitTitle(title: string): { leading: string; emphasis: string | null } {
  const match = title.match(/^(.*?)[，,]\s*(.+)$/);
  if (!match) return { leading: title, emphasis: null };
  return { leading: match[1], emphasis: match[2] };
}

/**
 * Public focal point: an airy editorial hero with a cool glass atmosphere.
 * Decorative rings and light are kept outside the content hierarchy, while
 * the optional orientation action stays close to the first-viewport CTAs.
 */
export function Hero({ settings, heroMedia = null }: HeroProps) {
  const title = splitTitle(settings.hero_title ?? settings.lab_name);
  const est = isoYear(settings.created_at);

  return (
    <section
      aria-label="首页焦点"
      data-motion-probe="hero"
      className="public-hero relative flex min-h-svh items-center overflow-hidden pt-20"
    >
      <div aria-hidden className="public-hero-grid" />
      <div aria-hidden className="public-motion-layer public-hero-orbit absolute top-[21%] left-[9%] h-28 w-56 opacity-70 sm:h-40 sm:w-80" />
      <div aria-hidden className="public-motion-layer public-hero-orbit absolute right-[6%] bottom-[17%] h-24 w-44 opacity-50 sm:h-36 sm:w-64" />
      {heroMedia ? (
        <div aria-hidden className="public-hero-media public-motion-layer absolute right-[4%] bottom-[22%] hidden w-56 opacity-20 lg:block xl:w-72">
          <MediaImage
            media={heroMedia}
            alt=""
            mode="cover"
            className="aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-white/70 bg-white/30 p-2"
            sizes="288px"
            imgClassName="rounded-[20px] object-cover mix-blend-multiply saturate-0"
          />
          <span className="mt-3 block text-right font-mono text-[9px] tracking-[0.28em] text-ink-faint uppercase">LAB / VISUAL FIELD</span>
        </div>
      ) : null}
      <div aria-hidden className="absolute top-[25%] right-[11%] h-2 w-2 rounded-full bg-accent/60 shadow-glow-accent" />
      <div aria-hidden className="absolute bottom-[29%] left-[16%] h-1.5 w-1.5 rounded-full bg-signal/70" />

      <Container width="wide" className="relative z-10 flex w-full flex-col items-center py-24 text-center sm:py-32">
        <p
          className="font-mono text-[10px] tracking-[0.38em] text-accent uppercase animate-fade-up sm:text-xs"
          style={{ animationDelay: "0.05s" }}
        >
          {`ROBOTICS LAB // ${settings.lab_name}`}
        </p>

        <h1
          className="mt-7 max-w-5xl font-display text-[clamp(3rem,8.5vw,8rem)] leading-[0.98] font-semibold tracking-[-0.06em] text-ink animate-fade-up sm:mt-9"
          style={{ animationDelay: "0.14s" }}
        >
          <span className="block">{title.leading}</span>
          {title.emphasis ? (
            <span className="public-gradient-text mt-2 block sm:mt-3">{title.emphasis}</span>
          ) : null}
        </h1>

        {settings.hero_subtitle ? (
          <p
            className="mt-7 max-w-2xl text-base leading-7 text-ink-muted animate-fade-up sm:mt-8 sm:text-lg sm:leading-8"
            style={{ animationDelay: "0.25s" }}
          >
            {settings.hero_subtitle}
          </p>
        ) : null}

        <p
          className="mt-6 font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase animate-fade-up sm:mt-7"
          style={{ animationDelay: "0.34s" }}
        >
          {settings.tagline ?? "ROBOTICS · INTELLIGENCE · EDUCATION"}
          {est ? <> · EST.{est}</> : null}
        </p>

        <div
          className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-fade-up sm:mt-10 sm:gap-4"
          style={{ animationDelay: "0.43s" }}
        >
          <MagneticButton>
            <HudLink href="/projects" className="glass-action border-0 px-6 py-3 text-white">
              浏览科研项目
            </HudLink>
          </MagneticButton>
          <MagneticButton strength={0.22}>
            <HudLink href="#contact" variant="ghost" withArrow={false} className="glass-chip px-6 py-3 text-ink">
              加入实验室
            </HudLink>
          </MagneticButton>
          <DeviceOrientationControl />
        </div>

        <div
          aria-hidden
          className="public-hero-frame relative mt-14 flex w-full max-w-4xl flex-wrap items-center justify-between gap-5 px-5 py-4 text-left animate-fade-up sm:mt-20 sm:px-8 sm:py-5"
          style={{ animationDelay: "0.58s" }}
        >
          <div className="relative flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center rounded-full border border-accent/30 bg-white/40">
              <span className="h-2 w-2 rounded-full bg-accent shadow-glow-accent" />
              <span className="absolute inset-2 rounded-full border border-accent/20" />
            </span>
            <span>
              <span className="block font-display text-sm font-semibold text-ink">感知 · 决策 · 控制</span>
              <span className="mt-1 block font-mono text-[9px] tracking-[0.22em] text-ink-faint uppercase">Build intelligence for motion</span>
            </span>
          </div>
          <div className="relative flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase sm:gap-x-8">
            <span>01 / SENSE</span>
            <span>02 / REASON</span>
            <span>03 / MOVE</span>
          </div>
        </div>
      </Container>

      <div aria-hidden className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-ink-faint">
        <span className="font-mono text-[9px] tracking-[0.35em] uppercase">向下探索</span>
        <span className="h-10 w-px bg-linear-to-b from-accent/70 to-transparent animate-scroll-cue" />
      </div>
    </section>
  );
}
