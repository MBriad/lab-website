/**
 * Bearer-token store for the browser.
 *
 * - Server rendering (SSR/build) uses an in-memory slot only; it never
 *   touches `window`/`localStorage` (guarded by `isBrowser()`).
 * - The browser persists the token to `localStorage` so admin sessions
 *   survive reloads, with an expiry derived from `expires_in`.
 * - The token is only ever sent via `Authorization: Bearer <token>` —
 *   see `getAuthHeaders()`.
 */

const TOKEN_STORAGE_KEY = "lab.admin.token";
const TOKEN_EXPIRY_KEY = "lab.admin.token.expiresAt";

let memoryToken: string | null = null;
let memoryExpiresAt: number | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isExpired(expiresAt: number | null): boolean {
  return expiresAt !== null && Date.now() >= expiresAt;
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage unavailable (private mode, blocked) — fall back to memory only.
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures; memory state still works.
  }
}

/** Current bearer token, or `null` when absent/expired. */
export function getAuthToken(): string | null {
  if (!isBrowser()) {
    if (isExpired(memoryExpiresAt)) memoryToken = null;
    return memoryToken;
  }

  const token = readStorage(TOKEN_STORAGE_KEY);
  if (!token) return null;

  const rawExpiry = readStorage(TOKEN_EXPIRY_KEY);
  const expiresAt = rawExpiry ? Number(rawExpiry) : null;
  if (isExpired(Number.isFinite(expiresAt) ? expiresAt : null)) {
    clearAuthToken();
    return null;
  }
  // Keep the memory slot in sync so header helpers work everywhere.
  memoryToken = token;
  memoryExpiresAt = Number.isFinite(expiresAt) ? expiresAt : null;
  return token;
}

/** Store a new token. `expiresInSeconds` comes from `TokenResponse.expires_in`. */
export function setAuthToken(token: string, expiresInSeconds?: number): void {
  memoryToken = token;
  memoryExpiresAt =
    expiresInSeconds && expiresInSeconds > 0
      ? Date.now() + expiresInSeconds * 1000
      : null;

  if (!isBrowser()) return;
  writeStorage(TOKEN_STORAGE_KEY, token);
  writeStorage(
    TOKEN_EXPIRY_KEY,
    memoryExpiresAt === null ? null : String(memoryExpiresAt),
  );
}

/** Remove the token from memory and storage. */
export function clearAuthToken(): void {
  memoryToken = null;
  memoryExpiresAt = null;
  if (!isBrowser()) return;
  writeStorage(TOKEN_STORAGE_KEY, null);
  writeStorage(TOKEN_EXPIRY_KEY, null);
}

/** Whether a (non-expired) token is currently available. */
export function hasAuthToken(): boolean {
  return getAuthToken() !== null;
}

/** Headers to spread onto a request: `{ Authorization: Bearer ... }` or `{}`. */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
