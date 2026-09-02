import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuthToken } from "./auth";
import { createRealApiClient, resolveApiBaseUrl } from "./client";

/**
 * Real-client seams that mock mode cannot exercise: server-side absolute
 * origin resolution, request wiring (JSON body, bearer header) and error
 * normalization to ApiError.
 */

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  clearAuthToken();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearAuthToken();
});

describe("resolveApiBaseUrl", () => {
  it("passes absolute URLs through unchanged", () => {
    expect(resolveApiBaseUrl("https://cms.example.com/api/v1")).toBe(
      "https://cms.example.com/api/v1",
    );
  });

  it("keeps relative paths in browser context", () => {
    vi.stubGlobal("window", {});
    expect(resolveApiBaseUrl("/api/v1")).toBe("/api/v1");
  });

  it("prefixes BACKEND_ORIGIN on the server (node) side", () => {
    // No `window` in this environment; default origin applies.
    expect(resolveApiBaseUrl("/api/v1")).toBe("http://127.0.0.1:8000/api/v1");
  });

  it("honors the BACKEND_ORIGIN env override server-side", () => {
    vi.stubEnv("BACKEND_ORIGIN", "http://10.0.0.5:9000/");
    expect(resolveApiBaseUrl("/api/v1")).toBe("http://10.0.0.5:9000/api/v1");
  });
});

describe("request wiring", () => {
  it("sends JSON and stores the bearer token on login", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(200, {
        access_token: "tok-1",
        expires_in: 3600,
        token_type: "bearer",
        admin: {
          id: "a",
          username: "admin",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      }),
    );
    const api = createRealApiClient({ fetchImpl: fetchMock });
    await api.login({ username: "admin", password: "admin123" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8000/api/v1/admin/auth/login");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ username: "admin", password: "admin123" }));
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    // Token is attached to follow-up admin requests.
    await api.getMe();
    const [, meInit] = fetchMock.mock.calls[1];
    expect((meInit?.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok-1",
    );
  });

  it("omits Authorization on public reads and uses GET with query params", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(200, { items: [], page: 1, page_size: 20, total: 0, pages: 0 }),
    );
    const api = createRealApiClient({ fetchImpl: fetchMock });
    await api.listAwards({ featured: true, sort: "date_desc", page: 2 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "http://127.0.0.1:8000/api/v1/awards?featured=true&sort=date_desc&page=2",
    );
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("normalizes contract error bodies into ApiError", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(409, {
        error: { code: "conflict", message: "still referenced", details: null },
      }),
    );
    const api = createRealApiClient({ fetchImpl: fetchMock });
    await api.login({ username: "admin", password: "admin123" }).catch(() => {});
    // Re-stub: login call above consumed the mock; use deleteMedia for the 409.
    fetchMock.mockClear();
    const err = await api.deleteMedia("m1").catch((e) => e);
    expect(err).toMatchObject({
      name: "ApiError",
      status: 409,
      code: "conflict",
      message: "still referenced",
    });
  });

  it("network failures become ApiError status 0", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    const api = createRealApiClient({ fetchImpl: fetchMock });
    const err = await api.getSiteSettings().catch((e) => e);
    expect(err).toMatchObject({ name: "ApiError", status: 0 });
  });
});
