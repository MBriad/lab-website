import type { ApiClient } from "./client";
import { createRealApiClient } from "./client";
import { createMockApiClient } from "./mock/client";

/**
 * Data-layer entry point.
 *
 * `NEXT_PUBLIC_API_MODE` selects the implementation:
 * - `"mock"`: deterministic fixtures, enabled only when explicitly requested.
 * - unset, `"real"`, or any other value: HTTP against `/api/v1`
 *   (proxied to BACKEND_ORIGIN by Next).
 *
 * Pages/components import { api } from "@/lib/api" and depend only on the
 * `ApiClient` interface — the switch is a one-line env change.
 */

export type ApiMode = "mock" | "real";

export function getApiMode(): ApiMode {
  return process.env.NEXT_PUBLIC_API_MODE === "mock" ? "mock" : "real";
}

/**
 * Render policy for data-driven public pages, per API mode.
 *
 * Next 16 requires route segment config (`export const dynamic`) to be a
 * static string literal, so pages always declare `dynamic = "auto"` and the
 * mode-dependent behavior is implemented in the data layer instead:
 *
 * - real (default): `httpRequest` sends every request with `cache: "no-store"`,
 *   which opts each data route out of prerendering — pages render per
 *   request against the backend, data is never frozen into static HTML,
 *   and an unreachable backend cannot crash the build.
 * - explicit mock: the mock client performs no network requests, so
 *   `"auto"` keeps build-time static prerendering intact (data baked at
 *   `next build`). Mock instances are intentionally isolated and must not be
 *   used when admin mutations need to appear in public server components.
 */
export function isPerRequestRendering(): boolean {
  return getApiMode() === "real";
}

export const api: ApiClient =
  getApiMode() === "real" ? createRealApiClient() : createMockApiClient();

export type { ApiClient } from "./client";
export { ApiError } from "./http";
export { getAuthToken, setAuthToken, clearAuthToken, hasAuthToken } from "./auth";
