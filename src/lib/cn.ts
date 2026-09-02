/**
 * Minimal class-name combiner. Joins truthy parts with spaces.
 * Keep dependency-free; replace with clsx/tailwind-merge only if a real
 * need appears (see .trellis/spec/frontend/component-guidelines.md).
 */
export function cn(
  ...parts: Array<string | null | undefined | false>
): string {
  return parts.filter(Boolean).join(" ");
}
