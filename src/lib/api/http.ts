import type { ErrorBody } from "@/lib/types/api";

/**
 * Error thrown for every non-2xx response (and network failures).
 * Carries the HTTP status and the parsed contract error body when available.
 *
 * The real backend answers with `{"error": {"code", "message", "details?"}}`;
 * FastAPI validation failures (`{"detail": [...]}`, HTTP 422) are normalized
 * into an `ErrorBody` with code `validation_error`.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ErrorBody | null;

  constructor(status: number, body: ErrorBody | null = null, message?: string) {
    super(message ?? body?.message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** Contract error code, e.g. "not_found" / "conflict" / "unauthorized". */
  get code(): string | null {
    return this.body?.code ?? null;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type QueryValue = string | number | boolean | null | undefined;

export interface HttpRequestOptions {
  method?: HttpMethod;
  /** Query params; `undefined`/`null` values are omitted. */
  query?: Record<string, QueryValue>;
  /** JSON body (mutually exclusive with `formData`). */
  json?: unknown;
  /** Multipart body (mutually exclusive with `json`). */
  formData?: FormData;
  headers?: Record<string, string>;
  /** Bearer token; when omitted no Authorization header is sent. */
  token?: string | null;
  signal?: AbortSignal;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/** Join base URL + path and append defined query params only. */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, QueryValue>,
): string {
  const url = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Normalize arbitrary response payloads into a contract `ErrorBody`.
 * Handles: contract envelope `{error}`, FastAPI `{detail: [...]}`,
 * `{detail: "..."}`, `{message: "..."}` and non-JSON bodies.
 */
function toErrorBody(payload: unknown): ErrorBody | null {
  if (payload === null || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  const envelope = record.error;
  if (envelope !== null && typeof envelope === "object") {
    const err = envelope as Record<string, unknown>;
    if (typeof err.code === "string" && typeof err.message === "string") {
      return {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
      };
    }
  }

  if (Array.isArray(record.detail)) {
    return {
      code: "validation_error",
      message: "请求参数校验失败",
      details: record.detail,
    };
  }

  if (typeof record.detail === "string") {
    return { code: "error", message: record.detail, details: null };
  }
  if (typeof record.message === "string") {
    return { code: "error", message: record.message, details: null };
  }
  return null;
}

/**
 * Perform an HTTP request against the CMS API and decode the JSON response.
 *
 * - Sends JSON when `json` is given; multipart when `formData` is given
 *   (the browser/runtime sets the multipart boundary automatically).
 * - Throws `ApiError` with the parsed contract error body on non-2xx.
 * - Empty bodies (e.g. 204, `{}` endpoints) resolve to `{}`.
 */
export async function httpRequest<T>(
  baseUrl: string,
  path: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    query,
    json,
    formData,
    headers = {},
    token,
    signal,
    fetchImpl = fetch,
  } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (formData) {
    body = formData;
  } else if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  let res: Response;
  try {
    res = await fetchImpl(buildUrl(baseUrl, path, query), {
      method,
      headers: finalHeaders,
      body,
      signal,
      // Render-strategy seam (see `isPerRequestRendering` in `./index`):
      // opting every request out of Next's server fetch cache makes each
      // data route render per request, so in real mode content is never
      // frozen into build-time HTML and an unreachable backend cannot fail
      // the build. In the browser this simply disables HTTP caching of API
      // responses, which is what we want too. Mock mode never reaches here.
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw cause;
    throw new ApiError(0, null, "网络请求失败，请稍后重试");
  }

  if (res.status === 204) return {} as T;

  const text = await res.text();
  const data: unknown = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, toErrorBody(data));
  }

  return (data === null ? {} : data) as T;
}
