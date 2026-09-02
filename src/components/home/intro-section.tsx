import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { Paragraphs } from "@/components/ui/paragraphs";
import { SectionHeader } from "@/components/ui/section-header";

export interface IntroSectionProps {
  /** Site settings `description` (nullable in the contract). */
  description: string | null;
}

/** SEC.01 — lab introduction from settings until the authority contract lands. */
export function IntroSection({ description }: IntroSectionProps) {
  if (!description) return null;

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
          </div>
        </div>
      </Container>
    </section>
  );
}
