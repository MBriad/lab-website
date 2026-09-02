import { ApiError } from "@/lib/api";
import type { ValidationErrorDetail } from "@/lib/types/api";

/**
 * Turn a thrown API error into a human message for inline display.
 * Validation (422) errors get their first detail message when present.
 */
export function describeApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const details = error.body?.details;
    if (error.status === 422 && Array.isArray(details) && details.length > 0) {
      const first = details[0];
      if (typeof first === "object" && first !== null && "msg" in first) {
        const msg = (first as { msg?: unknown }).msg;
        if (typeof msg === "string" && msg.length > 0) {
          return `${fallback}：${msg}`;
        }
      }
    }
    return error.body?.message ?? error.message ?? fallback;
  }
  return fallback;
}

/** True when the error is an authentication failure (401). */
export function isAuthError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.isUnauthorized;
}

/** True when the error is a reference/conflict failure (409). */
export function isConflictError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409;
}

/** True when the error is a not-found (404). */
export function isNotFoundError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.isNotFound;
}

function isValidationErrorDetail(
  value: unknown,
): value is ValidationErrorDetail {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.loc) && typeof v.msg === "string" && typeof v.type === "string"
  );
}

/**
 * Narrow a 422 response (FastAPI `detail` array, normalized by `http.ts`)
 * into a `field -> message` map so forms can reflect server-side validation
 * onto the matching inputs. Returns `null` when no field errors exist.
 */
export function extractFieldErrors(
  error: unknown,
): Record<string, string> | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null;
  const details = error.body?.details;
  if (!Array.isArray(details)) return null;
  const fields: Record<string, string> = {};
  for (const item of details) {
    if (!isValidationErrorDetail(item)) continue;
    const field =
      item.loc.filter((seg) => seg !== "body").map(String).join(".") || "_form";
    if (!(field in fields)) fields[field] = item.msg;
  }
  return Object.keys(fields).length > 0 ? fields : null;
}
