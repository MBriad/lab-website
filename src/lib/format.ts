/**
 * Presentation-side formatting helpers (dates, pagination params).
 * Pure functions only — no data access, no browser APIs.
 */

/** Parse a `?page=` search-param value into a valid 1-based page number. */
export function parsePageParam(
  value: string | string[] | undefined,
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = raw === undefined ? Number.NaN : Number(raw);
  if (!Number.isInteger(n) || n < 1) return 1;
  return n;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * ISO date / datetime -> `2026.05.18`.
 * Uses UTC components so dates stored as UTC render without timezone drift.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCFullYear()}.${pad2(d.getUTCMonth() + 1)}.${pad2(d.getUTCDate())}`;
}

/** ISO date / datetime -> `2026 年 5 月 18 日`. */
export function formatDateCN(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCFullYear()} 年 ${d.getUTCMonth() + 1} 月 ${d.getUTCDate()} 日`;
}

/** Extract the UTC year from an ISO string; `null` when unparseable. */
export function isoYear(iso: string): number | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getUTCFullYear();
}

/** Bytes -> human-readable size (B / KB / MB) for the admin media library. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
