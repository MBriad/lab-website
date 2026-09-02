import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Paragraphs } from "@/components/ui/paragraphs";
import { SectionHeader } from "@/components/ui/section-header";
import type { SiteSettingsPublic } from "@/lib/types/api";

export interface LabAuthorityProps {
  settings: SiteSettingsPublic;
}

export function LabAuthority({ settings }: LabAuthorityProps) {
  const hasAuthority = Boolean(
    settings.lab_positioning ||
    settings.founded_year ||
    settings.founding_background ||
    settings.core_platforms.length,
  );
  const sectionCode = hasAuthority ? "AUTHORITY" : "ABOUT";
  const sectionTitle = hasAuthority ? "实验室定位" : "实验室简介";

  if (!hasAuthority && !settings.description) return null;

  return (
    <section id="about" className="section-pad border-t border-hairline">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <Reveal variant="fade">
            <SectionHeader index="01" code={sectionCode} title={sectionTitle} />
          </Reveal>
          <div className="space-y-8">
            {hasAuthority ? (
              <Reveal>
                <div className="space-y-5">
                  {settings.lab_positioning ? (
                    <p className="max-w-3xl font-display text-2xl leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-3xl">
                      {settings.lab_positioning}
                    </p>
                  ) : null}
                  {settings.founding_background || settings.founded_year ? (
                    <div className="grid gap-5 border-y border-hairline py-5 sm:grid-cols-[120px_1fr]">
                      {settings.founded_year ? (
                        <div>
                          <span className="block font-mono text-[10px] tracking-[0.24em] text-ink-faint uppercase">成立年份</span>
                          <span className="mt-2 block font-display text-3xl font-semibold text-accent">{settings.founded_year}</span>
                        </div>
                      ) : null}
                      {settings.founding_background ? (
                        <p className="text-sm leading-7 text-ink-muted">{settings.founding_background}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {settings.core_platforms.length > 0 ? (
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.24em] text-ink-faint uppercase">核心平台</p>
                      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
                        {settings.core_platforms.map((platform) => <li key={platform}>＋ {platform}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </Reveal>
            ) : null}
            {settings.description ? (
              <Reveal delay={80}>
                <div className="max-w-3xl border-l-2 border-accent/45 pl-5">
                  <Paragraphs text={settings.description} />
                </div>
              </Reveal>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
