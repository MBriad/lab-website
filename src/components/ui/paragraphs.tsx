import { cn } from "@/lib/cn";
import { splitParagraphs } from "@/lib/text";

export interface ParagraphsProps {
  /** Plain-text content; paragraphs are separated by blank lines. */
  text: string;
  className?: string;
}

/** Renders contract long-form text as paragraphs (no markdown library). */
export function Paragraphs({ text, className }: ParagraphsProps) {
  const blocks = splitParagraphs(text);
  if (blocks.length === 0) return null;
  return (
    <div className={cn("space-y-4 leading-8 text-ink-muted", className)}>
      {blocks.map((block, i) => (
        <p key={i}>{block}</p>
      ))}
    </div>
  );
}
