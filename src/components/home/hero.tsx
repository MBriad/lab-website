import { DeviceOrientationControl } from "@/components/motion/device-orientation-control";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Starfield } from "@/components/motion/starfield";
import { TiltCard } from "@/components/motion/tilt-card";
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
 * Public focal point: a centered editorial hero with a large project image
 * beneath the CTAs. Pointer gravity remains global while the media stage uses
 * the shared tilt primitive for a restrained, cati-inspired depth cue.
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
      <Starfield className="z-0 opacity-35" />
      <div aria-hidden className="public-hero-grid" />
      <div aria-hidden className="public-motion-layer public-hero-orbit absolute top-[21%] left-[9%] h-28 w-56 opacity-70 sm:h-40 sm:w-80" />
      <div aria-hidden className="public-motion-layer public-hero-orbit absolute right-[6%] bottom-[17%] h-24 w-44 opacity-50 sm:h-36 sm:w-64" />
      <div aria-hidden className="absolute top-[25%] right-[11%] h-2 w-2 rounded-full bg-accent/60 shadow-glow-accent" />
      <div aria-hidden className="absolute bottom-[29%] left-[16%] h-1.5 w-1.5 rounded-full bg-signal/70" />

      <Container width="wide" className="relative z-10 flex w-full flex-col items-center py-14 text-center sm:py-16 lg:py-20">
        <div
          className="flex items-center gap-3 font-mono text-[10px] tracking-[0.38em] text-accent uppercase animate-fade-up sm:text-xs"
          style={{ animationDelay: "0.05s" }}
        >
          {settings.logo ? (
            <MediaImage
              media={settings.logo}
              alt={`${settings.lab_name} 标志`}
              mode="cover"
              className="h-10 w-10 shrink-0 rounded-full border border-white/75 bg-white/65 p-1 shadow-glow-accent"
              sizes="40px"
              priority
              imgClassName="object-contain"
            />
          ) : null}
          <span>{`ROBOTICS LAB // ${settings.lab_name}`}</span>
        </div>

        <h1
          className="mt-5 max-w-5xl font-display text-[clamp(3rem,6.5vw,6.5rem)] leading-[0.98] font-semibold tracking-[-0.06em] text-ink animate-fade-up sm:mt-9"
          style={{ animationDelay: "0.14s" }}
        >
          <span className="block">{title.leading}</span>
          {title.emphasis ? (
            <span className="public-gradient-text mt-2 block sm:mt-3">{title.emphasis}</span>
          ) : null}
        </h1>

        {settings.tagline ? (
          <p
            className="mt-5 max-w-2xl text-base leading-7 text-ink-muted animate-fade-up sm:mt-6 sm:text-lg sm:leading-8"
            style={{ animationDelay: "0.25s" }}
          >
            {settings.tagline}
          </p>
        ) : null}

        {settings.hero_subtitle ? (
          <p
            className="mt-4 max-w-xl font-mono text-[10px] leading-5 tracking-[0.18em] text-ink-faint uppercase animate-fade-up sm:mt-5"
            style={{ animationDelay: "0.34s" }}
          >
            {settings.hero_subtitle}
            {est ? <> · EST.{est}</> : null}
          </p>
        ) : est ? (
          <p
            className="mt-5 font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase animate-fade-up sm:mt-6"
            style={{ animationDelay: "0.34s" }}
          >
            EST.{est}
          </p>
        ) : null}

        <div
          className="mt-7 flex flex-wrap items-center justify-center gap-3 animate-fade-up sm:mt-10 sm:gap-4"
          style={{ animationDelay: "0.43s" }}
        >
          <MagneticButton>
            <HudLink href="/projects" className="glass-action border-0 px-6 py-3 text-white">
              浏览科研项目
            </HudLink>
          </MagneticButton>
           <MagneticButton strength={0.22}>
             <HudLink href={settings.join_url ?? "#contact"} variant="ghost" withArrow={false} className="glass-chip px-6 py-3 text-ink" external={Boolean(settings.join_url)}>
              加入实验室
            </HudLink>
          </MagneticButton>
          <DeviceOrientationControl />
        </div>

        <TiltCard
          maxTiltDeg={3.6}
          maxShiftPx={5}
          hoverScale={1.008}
          className="public-hero-stage relative mt-9 w-full max-w-3xl -rotate-[1.4deg] animate-fade-up sm:mt-11 sm:-rotate-1"
          style={{ animationDelay: "0.58s" }}
        >
          <div className="public-hero-stage-glow" aria-hidden />
          <div className="public-hero-stage-inner">
            {heroMedia ? (
              <MediaImage
                media={heroMedia}
                alt="实验室项目影像"
                mode="cover"
                className="h-full w-full"
                sizes="(min-width: 1280px) 896px, (min-width: 640px) 82vw, 92vw"
                imgClassName="object-cover"
                priority
              />
            ) : (
              <div className="public-hero-stage-empty" aria-hidden>
                <span className="public-hero-stage-empty-ring" />
                <span className="font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase">PROJECT VISUAL ARCHIVE</span>
              </div>
            )}
            <div className="public-hero-stage-sheen" aria-hidden />
            <div className="public-hero-stage-meta">
              <span>LAB / VISUAL FIELD</span>
              <span>{heroMedia ? "PROJECT COVER" : "MEDIA PENDING"}</span>
            </div>
          </div>
        </TiltCard>

        <div
          aria-hidden
          className="public-hero-frame relative mt-5 flex w-full max-w-4xl flex-wrap items-center justify-between gap-5 px-5 py-4 text-left animate-fade-up sm:mt-6 sm:px-8 sm:py-5"
          style={{ animationDelay: "0.7s" }}
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
