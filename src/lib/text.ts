/**
 * Plain-text content helpers. The contract stores long-form text as plain
 * paragraphs separated by blank lines — no markdown library is used.
 */

/** Split text into paragraphs on one or more blank lines. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}
