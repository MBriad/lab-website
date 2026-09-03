import { clearAuthToken, getAuthToken, setAuthToken } from "./auth";
import { httpRequest } from "./http";
import type {
  AdminLoginRequest,
  AdminPublic,
  AwardAdmin,
  AwardCreate,
  AwardPublic,
  AwardUpdate,
  GalleryItemAdmin,
  GalleryItemCreate,
  GalleryItemPublic,
  GalleryItemUpdate,
  ListAwardsParams,
  MediaAdmin,
  NewsAdmin,
  NewsCreate,
  NewsPublic,
  NewsUpdate,
  PageParams,
  PageResponse,
  ProjectAdmin,
  ProjectCreate,
  ProjectPublic,
  ProjectUpdate,
  ResearchAreaAdmin,
  ResearchAreaCreate,
  ResearchAreaPublic,
  ResearchAreaUpdate,
  SiteSettingsAdmin,
  SiteSettingsPublic,
  SiteSettingsUpdate,
  TokenResponse,
} from "@/lib/types/api";

/**
 * The single data-layer contract consumed by every page/component.
 * Implemented twice:
 * - `createRealApiClient()` — HTTP against `contracts/openapi.json`.
 * - `createMockApiClient()` — deterministic in-memory fixtures.
 * Components must depend on this interface only, never on an implementation.
 */
export interface ApiClient {
  /* ---------------- Public site ---------------- */
  getSiteSettings(): Promise<SiteSettingsPublic>;
  listResearchAreas(params?: PageParams): Promise<PageResponse<ResearchAreaPublic>>;
  listNews(params?: PageParams): Promise<PageResponse<NewsPublic>>;
  getNewsBySlug(slug: string): Promise<NewsPublic>;
  listProjects(params?: PageParams): Promise<PageResponse<ProjectPublic>>;
  getProjectBySlug(slug: string): Promise<ProjectPublic>;
  listAwards(params?: ListAwardsParams): Promise<PageResponse<AwardPublic>>;
  getAward(awardId: string): Promise<AwardPublic>;
  listGallery(params?: PageParams): Promise<PageResponse<GalleryItemPublic>>;

  /* ---------------- Auth ---------------- */
  /** Performs the login request and stores the returned bearer token. */
  login(credentials: AdminLoginRequest): Promise<TokenResponse>;
  /** Calls the backend logout and clears the stored token regardless. */
  logout(): Promise<void>;
  getMe(): Promise<AdminPublic>;

  /* ---------------- Admin: research areas ---------------- */
  listAdminResearchAreas(params?: PageParams): Promise<PageResponse<ResearchAreaAdmin>>;
  getAdminResearchArea(areaId: string): Promise<ResearchAreaAdmin>;
  createResearchArea(input: ResearchAreaCreate): Promise<ResearchAreaAdmin>;
  updateResearchArea(areaId: string, patch: ResearchAreaUpdate): Promise<ResearchAreaAdmin>;
  deleteResearchArea(areaId: string): Promise<void>;

  /* ---------------- Admin: news ---------------- */
  listAdminNews(params?: PageParams): Promise<PageResponse<NewsAdmin>>;
  getAdminNews(newsId: string): Promise<NewsAdmin>;
  createNews(input: NewsCreate): Promise<NewsAdmin>;
  updateNews(newsId: string, patch: NewsUpdate): Promise<NewsAdmin>;
  publishNews(newsId: string): Promise<NewsAdmin>;
  deleteNews(newsId: string): Promise<void>;

  /* ---------------- Admin: projects ---------------- */
  listAdminProjects(params?: PageParams): Promise<PageResponse<ProjectAdmin>>;
  getAdminProject(projectId: string): Promise<ProjectAdmin>;
  createProject(input: ProjectCreate): Promise<ProjectAdmin>;
  updateProject(projectId: string, patch: ProjectUpdate): Promise<ProjectAdmin>;
  publishProject(projectId: string): Promise<ProjectAdmin>;
  deleteProject(projectId: string): Promise<void>;

  /* ---------------- Admin: awards ---------------- */
  listAdminAwards(params?: PageParams): Promise<PageResponse<AwardAdmin>>;
  getAdminAward(awardId: string): Promise<AwardAdmin>;
  createAward(input: AwardCreate): Promise<AwardAdmin>;
  updateAward(awardId: string, patch: AwardUpdate): Promise<AwardAdmin>;
  deleteAward(awardId: string): Promise<void>;

  /* ---------------- Admin: independent gallery ---------------- */
  listAdminGallery(params?: PageParams): Promise<PageResponse<GalleryItemAdmin>>;
  getAdminGallery(galleryId: string): Promise<GalleryItemAdmin>;
  createGalleryItem(input: GalleryItemCreate): Promise<GalleryItemAdmin>;
  updateGalleryItem(
    galleryId: string,
    patch: GalleryItemUpdate,
  ): Promise<GalleryItemAdmin>;
  deleteGalleryItem(galleryId: string): Promise<void>;

  /* ---------------- Admin: media ---------------- */
  listAdminMedia(params?: PageParams): Promise<PageResponse<MediaAdmin>>;
  /** Multipart upload; the contract field name is `upload`. */
  uploadMedia(file: File): Promise<MediaAdmin>;
  deleteMedia(mediaId: string): Promise<void>;

  /* ---------------- Admin: site settings ---------------- */
  getAdminSiteSettings(): Promise<SiteSettingsAdmin>;
  /** PATCH — partial update (the preferred contract verb). */
  updateSiteSettings(patch: SiteSettingsUpdate): Promise<SiteSettingsAdmin>;
  /** PUT — full-replace variant (also present in the contract). */
  putSiteSettings(update: SiteSettingsUpdate): Promise<SiteSettingsAdmin>;
}

export interface RealApiClientOptions {
  /** Defaults to `NEXT_PUBLIC_API_BASE_URL` or `/api/v1` (proxied by Next). */
  baseUrl?: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

export function getDefaultApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
}

/**
 * Resolve the effective base URL for the current runtime.
 *
 * - Absolute bases (`http(s)://…`, an explicit override) pass through.
 * - Relative bases (the default `/api/v1`) work in the browser: Next
 *   rewrites them to `BACKEND_ORIGIN` (see `next.config.ts`).
 * - Server components cannot fetch relative URLs, so on the server the
 *   backend origin is prefixed, producing an absolute URL.
 */
export function resolveApiBaseUrl(baseUrl: string): string {
  if (/^https?:\/\//i.test(baseUrl)) return baseUrl;
  if (typeof window === "undefined") {
    const origin = (
      process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000"
    ).replace(/\/+$/, "");
    return `${origin}${baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`}`;
  }
  return baseUrl;
}

export function createRealApiClient(options: RealApiClientOptions = {}): ApiClient {
  const baseUrl = resolveApiBaseUrl(options.baseUrl ?? getDefaultApiBaseUrl());
  const fetchImpl = options.fetchImpl;

  function call<T>(
    path: string,
    init: {
      method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
      query?: Record<string, string | number | boolean | null | undefined>;
      json?: unknown;
      formData?: FormData;
      /** Pass `false` to skip the bearer header on public routes. */
      auth?: boolean;
    } = {},
  ): Promise<T> {
    const { method = "GET", query, json, formData, auth = true } = init;
    return httpRequest<T>(baseUrl, path, {
      method,
      query,
      json,
      formData,
      fetchImpl,
      token: auth ? getAuthToken() : null,
    });
  }

  return {
    /* ---------------- Public site ---------------- */
    getSiteSettings: () => call("/site-settings", { auth: false }),

    listResearchAreas: (params = {}) =>
      call("/research-areas", { auth: false, query: { ...params } }),

    listNews: (params = {}) => call("/news", { auth: false, query: { ...params } }),

    getNewsBySlug: (slug) =>
      call(`/news/${encodeURIComponent(slug)}`, { auth: false }),

    listProjects: (params = {}) =>
      call("/projects", { auth: false, query: { ...params } }),

    getProjectBySlug: (slug) =>
      call(`/projects/${encodeURIComponent(slug)}`, { auth: false }),

    listAwards: (params = {}) =>
      call("/awards", { auth: false, query: { ...params } }),

    getAward: (awardId) =>
      call(`/awards/${encodeURIComponent(awardId)}`, { auth: false }),

    listGallery: (params = {}) =>
      call("/gallery", { auth: false, query: { ...params } }),

    /* ---------------- Auth ---------------- */
    login: async (credentials) => {
      const token = await call<TokenResponse>("/admin/auth/login", {
        method: "POST",
        json: credentials,
        auth: false,
      });
      setAuthToken(token.access_token, token.expires_in);
      return token;
    },

    logout: async () => {
      try {
        await call<Record<string, never>>("/admin/auth/logout", {
          method: "POST",
        });
      } finally {
        clearAuthToken();
      }
    },

    getMe: () => call("/admin/auth/me"),

    /* ---------------- Admin: research areas ---------------- */
    listAdminResearchAreas: (params = {}) =>
      call("/admin/research-areas", { query: { ...params } }),

    getAdminResearchArea: (areaId) =>
      call(`/admin/research-areas/${encodeURIComponent(areaId)}`),

    createResearchArea: (input) =>
      call("/admin/research-areas", { method: "POST", json: input }),

    updateResearchArea: (areaId, patch) =>
      call(`/admin/research-areas/${encodeURIComponent(areaId)}`, {
        method: "PATCH",
        json: patch,
      }),

    deleteResearchArea: (areaId) =>
      call(`/admin/research-areas/${encodeURIComponent(areaId)}`, {
        method: "DELETE",
      }),

    /* ---------------- Admin: news ---------------- */
    listAdminNews: (params = {}) =>
      call("/admin/news", { query: { ...params } }),

    getAdminNews: (newsId) => call(`/admin/news/${encodeURIComponent(newsId)}`),

    createNews: (input) => call("/admin/news", { method: "POST", json: input }),

    updateNews: (newsId, patch) =>
      call(`/admin/news/${encodeURIComponent(newsId)}`, {
        method: "PATCH",
        json: patch,
      }),

    publishNews: (newsId) =>
      call(`/admin/news/${encodeURIComponent(newsId)}/publish`, {
        method: "POST",
      }),

    deleteNews: (newsId) =>
      call(`/admin/news/${encodeURIComponent(newsId)}`, { method: "DELETE" }),

    /* ---------------- Admin: projects ---------------- */
    listAdminProjects: (params = {}) =>
      call("/admin/projects", { query: { ...params } }),

    getAdminProject: (projectId) =>
      call(`/admin/projects/${encodeURIComponent(projectId)}`),

    createProject: (input) =>
      call("/admin/projects", { method: "POST", json: input }),

    updateProject: (projectId, patch) =>
      call(`/admin/projects/${encodeURIComponent(projectId)}`, {
        method: "PATCH",
        json: patch,
      }),

    publishProject: (projectId) =>
      call(`/admin/projects/${encodeURIComponent(projectId)}/publish`, {
        method: "POST",
      }),

    deleteProject: (projectId) =>
      call(`/admin/projects/${encodeURIComponent(projectId)}`, {
        method: "DELETE",
      }),

    /* ---------------- Admin: awards ---------------- */
    listAdminAwards: (params = {}) =>
      call("/admin/awards", { query: { ...params } }),

    getAdminAward: (awardId) =>
      call(`/admin/awards/${encodeURIComponent(awardId)}`),

    createAward: (input) => call("/admin/awards", { method: "POST", json: input }),

    updateAward: (awardId, patch) =>
      call(`/admin/awards/${encodeURIComponent(awardId)}`, {
        method: "PATCH",
        json: patch,
      }),

    deleteAward: (awardId) =>
      call(`/admin/awards/${encodeURIComponent(awardId)}`, { method: "DELETE" }),

    /* ---------------- Admin: independent gallery ---------------- */
    listAdminGallery: (params = {}) =>
      call("/admin/gallery", { query: { ...params } }),

    getAdminGallery: (galleryId) =>
      call(`/admin/gallery/${encodeURIComponent(galleryId)}`),

    createGalleryItem: (input) =>
      call("/admin/gallery", { method: "POST", json: input }),

    updateGalleryItem: (galleryId, patch) =>
      call(`/admin/gallery/${encodeURIComponent(galleryId)}`, {
        method: "PATCH",
        json: patch,
      }),

    deleteGalleryItem: (galleryId) =>
      call(`/admin/gallery/${encodeURIComponent(galleryId)}`, {
        method: "DELETE",
      }),

    /* ---------------- Admin: media ---------------- */
    listAdminMedia: (params = {}) =>
      call("/admin/media", { query: { ...params } }),

    uploadMedia: (file) => {
      const formData = new FormData();
      formData.append("upload", file);
      return call("/admin/media", { method: "POST", formData });
    },

    deleteMedia: (mediaId) =>
      call(`/admin/media/${encodeURIComponent(mediaId)}`, { method: "DELETE" }),

    /* ---------------- Admin: site settings ---------------- */
    getAdminSiteSettings: () => call("/admin/site-settings"),

    updateSiteSettings: (patch) =>
      call("/admin/site-settings", { method: "PATCH", json: patch }),

    putSiteSettings: (update) =>
      call("/admin/site-settings", { method: "PUT", json: update }),
  };
}
