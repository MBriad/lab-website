import Image from "next/image";
import { DeviceOrientationControl } from "@/components/motion/device-orientation-control";
import { InteractiveMedia } from "@/components/motion/interactive-media";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Starfield } from "@/components/motion/starfield";
import { Container } from "@/components/ui/container";
import { HudLink } from "@/components/ui/hud-link";
import { MediaImage } from "@/components/ui/media-image";
import type { MediaPublic, SiteSettingsPublic } from "@/lib/types/api";

export interface HeroProps {
  settings: SiteSettingsPublic;
  heroMedia?: MediaPublic | null;
}

const toolchain = [
  {
    id: "hardware",
    index: "01",
    label: "硬件设计",
    tools: [
      { icon: "/tool-icons/easyeda.svg", name: "嘉立创 EDA", tone: "easyeda" },
      { icon: "/tool-icons/altium-designer.svg", name: "Altium Designer", tone: "altium" },
    ],
  },
  {
    id: "software",
    index: "02",
    label: "软件开发",
    tools: [
      { icon: "/tool-icons/vscode.svg", name: "VS Code", tone: "vscode" },
      { icon: "/tool-icons/keil.png", name: "Keil", tone: "keil" },
      { icon: "/tool-icons/clion.svg", name: "CLion", tone: "clion" },
    ],
  },
  {
    id: "practice",
    index: "03",
    label: "竞赛实践",
    tools: [{ icon: null, name: "机器人赛事", tone: "competition" }],
  },
] as const;

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
  const est = settings.founded_year;

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

        <InteractiveMedia
          maxTiltDeg={3.6}
          maxShiftPx={5}
          hoverScale={1.008}
          clip={false}
          depthClassName="relative"
          className="public-hero-stage relative mt-9 w-full max-w-3xl -rotate-[1.4deg] animate-fade-up sm:mt-11 sm:-rotate-1"
          style={{ animationDelay: "0.58s" }}
        >
          <div className="public-hero-stage-glow" aria-hidden />
          <div className="public-hero-stage-inner">
            {heroMedia ? (
              <div className="absolute inset-0 opacity-15" aria-hidden>
                <MediaImage
                  media={heroMedia}
                  alt=""
                  mode="cover"
                  className="h-full w-full"
                  sizes="(min-width: 1280px) 896px, (min-width: 640px) 82vw, 92vw"
                  imgClassName="object-cover grayscale"
                />
              </div>
            ) : null}
            <div className="public-hero-brand-visual" aria-label="ROBOLAB 宇航实验室标识">
              <div className="public-hero-brand-grid" aria-hidden />
              <div className="public-hero-brand-orbit public-hero-brand-orbit-a" aria-hidden />
              <div className="public-hero-brand-orbit public-hero-brand-orbit-b" aria-hidden />
              <div className="public-hero-brand-lockup">
                <Image
                  src="/robotlab/robotlab-mark.png"
                  alt=""
                  width={500}
                  height={500}
                  sizes="clamp(8rem, 20vw, 13rem)"
                  className="public-hero-brand-mark"
                  priority
                />
                <Image
                  src="/robotlab/robotlab-wordmark.png"
                  alt="ROBOLAB 宇航"
                  width={1007}
                  height={124}
                  sizes="(min-width: 640px) 620px, 78vw"
                  className="public-hero-brand-wordmark"
                  priority
                />
                <div className="public-hero-brand-readout" aria-hidden>
                  <span>ROBOTICS / MOTION / FIELD</span>
                  <span>RBL—01 // ONLINE</span>
                </div>
              </div>
            </div>
            <div className="public-hero-stage-sheen" aria-hidden />
            <div className="public-hero-stage-meta">
              <span>LAB / VISUAL FIELD</span>
              <span>ROBOTLAB IDENTITY</span>
            </div>
          </div>
        </InteractiveMedia>

        <div
          className="public-hero-frame relative mt-5 flex w-full max-w-4xl flex-col gap-5 px-5 py-4 text-left animate-fade-up sm:mt-6 sm:px-8 sm:py-5 lg:flex-row lg:items-center lg:justify-between"
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
          <ul className="public-hero-toolchain relative flex flex-wrap gap-2 sm:gap-3" aria-label="实验室工具链">
            {toolchain.map((stage) => (
              <li key={stage.id} className="public-hero-toolchain-stage">
                <span className="public-hero-toolchain-index">{stage.index}</span>
                <span className="public-hero-toolchain-label">{stage.label}</span>
                <span className="public-hero-toolchain-icons" aria-label={`${stage.label}：${stage.tools.map((tool) => tool.name).join("、")}`}>
                  {stage.tools.map((tool) => (
                    <span key={tool.name} className={`public-tool-mark public-tool-mark-${tool.tone}`} title={tool.name}>
                      {tool.icon ? (
                        <Image
                          src={tool.icon}
                          alt={tool.name}
                          width={32}
                          height={32}
                          sizes="32px"
                          className="public-tool-logo"
                        />
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden focusable="false">
                          <path d="M8 4h8v3h3v2.4a4.6 4.6 0 0 1-3 4.3 5 5 0 0 1-2.7 2.3V18h3v2H7.7v-2h3v-2a5 5 0 0 1-2.7-2.3 4.6 4.6 0 0 1-3-4.3V7h3V4Zm-1 5.4c0 .9.5 1.7 1.3 2.1a5.3 5.3 0 0 1-.3-1.8V9H7v.4Zm10 0v.3c0 .6-.1 1.2-.3 1.8.8-.4 1.3-1.2 1.3-2.1V9h-1v.4Z" />
                        </svg>
                      )}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div aria-hidden className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-ink-faint">
        <span className="font-mono text-[9px] tracking-[0.35em] uppercase">向下探索</span>
        <span className="h-10 w-px bg-linear-to-b from-accent/70 to-transparent animate-scroll-cue" />
      </div>
    </section>
  );
}
