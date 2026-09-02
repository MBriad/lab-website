import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Paragraphs } from "@/components/ui/paragraphs";
import { SectionHeader } from "@/components/ui/section-header";

export interface IntroSectionProps {
  /** Site settings `description` (nullable in the contract). */
  description: string | null;
  stats: ReadonlyArray<{ label: string; value: string }>;
}

/** SEC.01 — lab introduction from settings + derived stat readouts. */
export function IntroSection({ description, stats }: IntroSectionProps) {
  return (
    <section id="about" className="section-pad border-t border-hairline">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Reveal variant="fade">
            <SectionHeader index="01" code="ABOUT" title="实验室简介" />
          </Reveal>
          <div>
            <Reveal delay={100}>
              {description ? (
                <Paragraphs text={description} />
              ) : (
                <p className="text-ink-muted">实验室简介整理中。</p>
              )}
            </Reveal>
            <Reveal delay={180}>
              <dl className="mt-10 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-background p-4">
                    <dt className="font-mono text-[10px] tracking-[0.25em] text-ink-faint uppercase">
                      {stat.label}
                    </dt>
                    <dd className="mt-2 font-display text-2xl font-semibold text-accent">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
