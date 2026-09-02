import { beforeEach, describe, expect, it } from "vitest";
import { clearAuthToken, hasAuthToken } from "../auth";
import { ApiError } from "../http";
import { createMockApiClient } from "./client";

/**
 * Behavioral contract of the mock ApiClient. These tests pin the seams the
 * public site and admin UI depend on: visibility filtering, pagination
 * envelope, 404s, auth, reference-aware media deletes and PATCH semantics.
 */

function makeClient() {
  return createMockApiClient();
}

beforeEach(() => {
  clearAuthToken();
});

describe("public visibility filtering", () => {
  it("news list only returns published, visible items", async () => {
    const api = makeClient();
    const page = await api.listNews({ page: 1, page_size: 50 });
    expect(page.total).toBe(4);
    const slugs = page.items.map((n) => n.slug);
    expect(slugs).not.toContain("summer-camp-2026"); // draft
    expect(slugs).not.toContain("industry-joint-lab"); // draft
  });

  it("project list hides drafts", async () => {
    const api = makeClient();
    const page = await api.listProjects({ page: 1, page_size: 50 });
    expect(page.total).toBe(4);
    const slugs = page.items.map((p) => p.slug);
    expect(slugs).not.toContain("hri-workbench");
    expect(slugs).not.toContain("tactile-skin-array");
  });

  it("awards list hides invisible awards but keeps all visible ones", async () => {
    const api = makeClient();
    const page = await api.listAwards({ page: 1, page_size: 50 });
    expect(page.total).toBe(7);
    expect(page.items.every((a) => a.is_featured === false || a.is_featured === true)).toBe(true);
    expect(page.items.map((a) => a.id)).not.toContain(
      "55555555-0000-4000-8000-000000000008", // hidden award
    );
  });

  it("draft slugs resolve to a public 404, not the record", async () => {
    const api = makeClient();
    await expect(api.getNewsBySlug("summer-camp-2026")).rejects.toMatchObject({
      status: 404,
    });
    await expect(api.getProjectBySlug("hri-workbench")).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("featured awards + pagination envelope", () => {
  it("featured filter returns only featured, visible awards", async () => {
    const api = makeClient();
    const page = await api.listAwards({ featured: true, page: 1, page_size: 20 });
    expect(page.total).toBe(3);
    expect(page.items.every((a) => a.is_featured)).toBe(true);
  });

  it("pagination envelope has items/page/page_size/total/pages math", async () => {
    const api = makeClient();
    const page = await api.listNews({ page: 2, page_size: 3 });
    expect(page.items).toHaveLength(1);
    expect(page.page).toBe(2);
    expect(page.page_size).toBe(3);
    expect(page.total).toBe(4);
    expect(page.pages).toBe(2);
    expect(Object.keys(page).sort()).toEqual(
      ["items", "page", "page_size", "pages", "total"].sort(),
    );
  });

  it("unknown slug/id throw ApiError with status 404", async () => {
    const api = makeClient();
    const newsError = await api.getNewsBySlug("does-not-exist").catch((e) => e);
    expect(newsError).toBeInstanceOf(ApiError);
    expect((newsError as ApiError).status).toBe(404);
    expect((newsError as ApiError).isNotFound).toBe(true);

    await expect(api.getProjectBySlug("nope")).rejects.toMatchObject({ status: 404 });
    await expect(api.getAward("nope")).rejects.toMatchObject({ status: 404 });
  });
});

describe("auth flow", () => {
  it("wrong credentials are rejected with 401", async () => {
    const api = makeClient();
    const err = await api
      .login({ username: "admin", password: "wrong" })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect(hasAuthToken()).toBe(false);
  });

  it("admin/admin123 login stores a bearer token", async () => {
    const api = makeClient();
    const token = await api.login({ username: "admin", password: "admin123" });
    expect(token.access_token).toMatch(/^mock-token-/);
    expect(token.token_type).toBe("bearer");
    expect(hasAuthToken()).toBe(true);
  });

  it("admin operations require login (401), then succeed after login", async () => {
    const api = makeClient();
    await expect(api.getMe()).rejects.toMatchObject({ status: 401 });
    await expect(api.listAdminNews()).rejects.toMatchObject({ status: 401 });
    await expect(api.listAdminProjects()).rejects.toMatchObject({ status: 401 });
    await expect(api.listAdminResearchAreas()).rejects.toMatchObject({ status: 401 });
    await expect(api.listAdminAwards()).rejects.toMatchObject({ status: 401 });
    await expect(api.listAdminMedia()).rejects.toMatchObject({ status: 401 });
    await expect(
      api.createNews({ slug: "x", title: "x", content: "x" }),
    ).rejects.toMatchObject({ status: 401 });

    await api.login({ username: "admin", password: "admin123" });
    const me = await api.getMe();
    expect(me.username).toBe("admin");
  });

  it("logout clears the token", async () => {
    const api = makeClient();
    await api.login({ username: "admin", password: "admin123" });
    await api.logout();
    expect(hasAuthToken()).toBe(false);
    await expect(api.getMe()).rejects.toMatchObject({ status: 401 });
  });
});

describe("media delete with references", () => {
  it("deleting referenced media returns 409 conflict", async () => {
    const api = makeClient();
    await api.login({ username: "admin", password: "admin123" });
    // certificate.svg is referenced by several awards.
    const err = await api
      .deleteMedia("11111111-0000-4000-8000-000000000008")
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(409);
    expect((err as ApiError).code).toBe("conflict");
  });

  it("unreferenced media deletes succeed; second delete is 404", async () => {
    const api = makeClient();
    await api.login({ username: "admin", password: "admin123" });
    const uploaded = await api.uploadMedia(
      new File(["<svg/>"], "scratch.svg", { type: "image/svg+xml" }),
    );
    expect(uploaded.width).toBeNull(); // contract allows null dimensions
    await expect(api.deleteMedia(uploaded.id)).resolves.toBeUndefined();
    await expect(api.deleteMedia(uploaded.id)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("site settings PATCH semantics", () => {
  it("null clears a field; omitted fields stay untouched", async () => {
    const api = makeClient();
    const before = await api.getSiteSettings();
    expect(before.tagline).not.toBeNull();

    await api.login({ username: "admin", password: "admin123" });
    const cleared = await api.updateSiteSettings({ tagline: null });
    expect(cleared.tagline).toBeNull();
    expect(cleared.lab_name).toBe(before.lab_name); // untouched

    const patched = await api.updateSiteSettings({ hero_title: "新标题" });
    expect(patched.hero_title).toBe("新标题");
    expect(patched.lab_name).toBe(before.lab_name);
  });
});

describe("publish flow", () => {
  it("a created draft is hidden until publish", async () => {
    const api = makeClient();
    await api.login({ username: "admin", password: "admin123" });
    const created = await api.createNews({
      slug: "wave-d-test",
      title: "测试",
      content: "内容",
    });
    expect(created.published_at).toBeNull();
    let publicPage = await api.listNews({ page: 1, page_size: 50 });
    expect(publicPage.items.map((n) => n.slug)).not.toContain("wave-d-test");

    const published = await api.publishNews(created.id);
    expect(published.published_at).not.toBeNull();
    expect(published.is_visible).toBe(true);
    publicPage = await api.listNews({ page: 1, page_size: 50 });
    expect(publicPage.items.map((n) => n.slug)).toContain("wave-d-test");
  });
});
