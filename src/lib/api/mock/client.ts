import type { ApiClient } from "../client";
import { ApiError } from "../http";
import { clearAuthToken, getAuthToken, setAuthToken } from "../auth";
import {
  createSeedDb,
  MOCK_ADMIN,
  MOCK_UPLOAD_URL,
  toPublicMedia,
  type MockDb,
} from "./db";
import type {
  AdminLoginRequest,
  AwardAdmin,
  AwardCreate,
  AwardPublic,
  AwardSort,
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
  PageResponse,
  ProjectAdmin,
  ProjectCreate,
  ProjectPublic,
  ProjectReferencePublic,
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
 * Mock implementation of `ApiClient` against a deterministic fixture DB.
 *
 * Behavior mirrors the contract:
 * - public list endpoints only return visible/published records;
 * - unknown slug/id -> 404 `ApiError` with code `not_found`;
 * - admin operations require a bearer token (`login` first);
 * - media delete refuses when referenced -> 409 `ApiError` (code `conflict`),
 *   so the admin UI's reference-aware error handling has something to exercise.
 *
 * MOCK-ONLY credentials (never used by the real client):
 *   username: "admin"  password: "admin123"
 *
 * The DB is created fresh per client instance, so state stays coherent and
 * isolated within a session.
 */

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

function paginate<T>(
  items: T[],
  page: number | undefined,
  pageSize: number | undefined,
  defaultPageSize: number,
): PageResponse<T> {
  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safeSize = Math.max(1, Math.floor(pageSize ?? defaultPageSize));
  const total = items.length;
  const pages = Math.ceil(total / safeSize);
  const start = (safePage - 1) * safeSize;
  return {
    items: clone(items.slice(start, start + safeSize)),
    page: safePage,
    page_size: safeSize,
    total,
    pages,
  };
}

function notFound(resource: string, id: string): ApiError {
  return new ApiError(404, {
    code: "not_found",
    message: `${resource} 不存在：${id}`,
    details: null,
  });
}

function unauthorized(): ApiError {
  return new ApiError(401, {
    code: "unauthorized",
    message: "未登录或登录已过期",
    details: null,
  });
}

function conflict(message: string, details?: unknown): ApiError {
  return new ApiError(409, {
    code: "conflict",
    message,
    details: details ?? null,
  });
}

function validationFailed(message: string, details?: unknown): ApiError {
  return new ApiError(422, {
    code: "validation_error",
    message,
    details: details ?? null,
  });
}

/** Apply only defined patch fields (`undefined` = keep, `null` = clear). */
function applyDefined<T extends object>(target: T, patch: object): void {
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Client factory                                                      */
/* ------------------------------------------------------------------ */

export function createMockApiClient(): ApiClient {
  const db: MockDb = createSeedDb();
  let idCounter = 0;
  let tokenCounter = 0;

  function makeId(): string {
    idCounter += 1;
    return `90000000-0000-4000-8000-${String(idCounter).padStart(12, "0")}`;
  }

  /** Mock bearer tokens look like `mock-token-<n>`. */
  function requireAuth(): void {
    const token = getAuthToken();
    if (!token || !token.startsWith("mock-token-")) throw unauthorized();
  }

  function findMedia(mediaId: string | null | undefined): MediaAdmin | null {
    if (!mediaId) return null;
    return db.media.find((m) => m.id === mediaId) ?? null;
  }

  /** Validate an incoming media reference; throws 422 when it dangles. */
  function requireMedia(mediaId: string): MediaAdmin {
    const found = findMedia(mediaId);
    if (!found) throw validationFailed(`素材不存在：${mediaId}`);
    return found;
  }

  function slugTaken(
    list: Array<{ id: string; slug: string }>,
    slug: string,
    selfId?: string,
  ): boolean {
    return list.some((item) => item.slug === slug && item.id !== selfId);
  }

  /* ---------------- Public projections ---------------- */

  function toNewsPublic(item: NewsAdmin): NewsPublic {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      cover: item.cover,
      published_at: item.published_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  function toProjectPublic(item: ProjectAdmin): ProjectPublic {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      description: item.description,
      demo_url: item.demo_url,
      cover: item.cover,
      sort_order: item.sort_order,
      published_at: item.published_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  function toProjectReference(item: ProjectAdmin): ProjectReferencePublic {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      cover: item.cover,
      demo_url: item.demo_url,
    };
  }

  function toResearchAreaPublic(item: ResearchAreaAdmin): ResearchAreaPublic {
    const representative = item.representative_project_id
      ? db.projects.find(
          (project) =>
            project.id === item.representative_project_id &&
            project.is_visible &&
            project.published_at !== null,
        )
      : undefined;
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      problem_statement: item.problem_statement,
      application_scenarios: item.application_scenarios,
      representative_project: representative ? toProjectReference(representative) : null,
      sort_order: item.sort_order,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  function toResearchAreaAdmin(item: ResearchAreaAdmin): ResearchAreaAdmin {
    const representative = item.representative_project_id
      ? db.projects.find((project) => project.id === item.representative_project_id)
      : undefined;
    return {
      ...item,
      representative_project: representative ? toProjectReference(representative) : null,
    };
  }

  function syncResearchReference(item: ResearchAreaAdmin): void {
    item.representative_project = toResearchAreaAdmin(item).representative_project;
  }

  function toAwardPublic(item: AwardAdmin): AwardPublic {
    return {
      id: item.id,
      title: item.title,
      category: item.category,
      level: item.level,
      issuer: item.issuer,
      competition_name: item.competition_name,
      description: item.description,
      award_date: item.award_date,
      year: item.year,
      certificate_media_id: item.certificate_media_id,
      cover_media_id: item.cover_media_id,
      certificate: item.certificate,
      cover: item.cover,
      sort_order: item.sort_order,
      is_featured: item.is_featured,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  function toGalleryPublic(item: GalleryItemAdmin): GalleryItemPublic {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      media: item.media,
      sort_order: item.sort_order,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  function toSiteSettingsPublic(item: SiteSettingsAdmin): SiteSettingsPublic {
    return {
      key: item.key,
      site_title: item.site_title,
      lab_name: item.lab_name,
      tagline: item.tagline,
      description: item.description,
      contact_email: item.contact_email,
      contact_phone: item.contact_phone,
      address: item.address,
      hero_title: item.hero_title,
      hero_subtitle: item.hero_subtitle,
      lab_positioning: item.lab_positioning,
      founded_year: item.founded_year,
      founding_background: item.founding_background,
      core_platforms: item.core_platforms,
      paper_count: item.paper_count,
      patent_count: item.patent_count,
      active_project_count: item.active_project_count,
      trained_student_count: item.trained_student_count,
      homepage_featured_awards_limit: item.homepage_featured_awards_limit,
      homepage_gallery_limit: item.homepage_gallery_limit,
      papers_url: item.papers_url,
      join_url: item.join_url,
      cooperation_url: item.cooperation_url,
      logo: item.logo,
      contact_qr_primary: item.contact_qr_primary,
      contact_qr_secondary: item.contact_qr_secondary,
      social_github: item.social_github,
      social_bilibili: item.social_bilibili,
      social_email: item.social_email,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  /* ---------------- Shared admin logic ---------------- */

  function patchSettings(patch: SiteSettingsUpdate): SiteSettingsAdmin {
    for (const key of [
      "homepage_featured_awards_limit",
      "homepage_gallery_limit",
    ] as const) {
      const value = patch[key];
      if (
        value !== undefined &&
        (!Number.isInteger(value) || value < 1 || value > 20)
      ) {
        throw validationFailed(`${key} 必须是 1 至 20 的整数`);
      }
    }
    if (patch.logo_media_id) {
      db.settings.logo = toPublicMedia(requireMedia(patch.logo_media_id));
    } else if (patch.logo_media_id === null) {
      db.settings.logo = null;
    }
    if (patch.contact_qr_primary_media_id) {
      db.settings.contact_qr_primary = toPublicMedia(
        requireMedia(patch.contact_qr_primary_media_id),
      );
    } else if (patch.contact_qr_primary_media_id === null) {
      db.settings.contact_qr_primary = null;
    }
    if (patch.contact_qr_secondary_media_id) {
      db.settings.contact_qr_secondary = toPublicMedia(
        requireMedia(patch.contact_qr_secondary_media_id),
      );
    } else if (patch.contact_qr_secondary_media_id === null) {
      db.settings.contact_qr_secondary = null;
    }
    applyDefined(db.settings, patch);
    db.settings.updated_at = nowIso();
    return clone(db.settings);
  }

  function sortAwards(items: AwardAdmin[], sort: AwardSort): AwardAdmin[] {
    const sorted = [...items];
    if (sort === "sort_order") {
      sorted.sort(
        (a, b) =>
          a.sort_order - b.sort_order ||
          b.award_date.localeCompare(a.award_date),
      );
    } else {
      // Contract default: date_desc.
      sorted.sort(
        (a, b) =>
          b.award_date.localeCompare(a.award_date) ||
          a.title.localeCompare(b.title),
      );
    }
    return sorted;
  }

  /* ================================================================== */

  return {
    /* ---------------- Public site ---------------- */

    getSiteSettings: async () => clone(toSiteSettingsPublic(db.settings)),

    listResearchAreas: async (params = {}) => {
      const page = paginate(
        db.researchAreas
          .filter((a) => a.is_visible)
          .sort((a, b) => a.sort_order - b.sort_order),
        params.page,
        params.page_size,
        50,
      );
      return { ...page, items: page.items.map(toResearchAreaPublic) };
    },

    listNews: async (params = {}) => {
      const page = paginate(
        db.news
          .filter((n) => n.is_visible && n.published_at !== null)
          .sort((a, b) =>
            (b.published_at ?? "").localeCompare(a.published_at ?? ""),
          ),
        params.page,
        params.page_size,
        20,
      );
      return { ...page, items: page.items.map(toNewsPublic) };
    },

    getNewsBySlug: async (slug) => {
      const found = db.news.find(
        (n) => n.slug === slug && n.is_visible && n.published_at !== null,
      );
      if (!found) throw notFound("新闻", slug);
      return clone(toNewsPublic(found));
    },

    listProjects: async (params = {}) => {
      // The contract has no project featured flag; public ordering follows
      // `sort_order` ascending (curated order).
      const page = paginate(
        db.projects
          .filter((p) => p.is_visible && p.published_at !== null)
          .sort((a, b) => a.sort_order - b.sort_order),
        params.page,
        params.page_size,
        20,
      );
      return { ...page, items: page.items.map(toProjectPublic) };
    },

    getProjectBySlug: async (slug) => {
      const found = db.projects.find(
        (p) => p.slug === slug && p.is_visible && p.published_at !== null,
      );
      if (!found) throw notFound("项目", slug);
      return clone(toProjectPublic(found));
    },

    listAwards: async (params: ListAwardsParams = {}) => {
      let items = db.awards.filter((a) => a.is_visible);
      if (params.featured === true) items = items.filter((a) => a.is_featured);
      if (params.featured === false) {
        items = items.filter((a) => !a.is_featured);
      }
      items = sortAwards(items, params.sort ?? "date_desc");
      const page = paginate(items, params.page, params.page_size, 20);
      return { ...page, items: page.items.map(toAwardPublic) };
    },

    getAward: async (awardId) => {
      // Hidden awards are invisible to the public endpoint, like missing ones.
      const found = db.awards.find((a) => a.id === awardId && a.is_visible);
      if (!found) throw notFound("奖项", awardId);
      return clone(toAwardPublic(found));
    },

    listGallery: async (params = {}) => {
      const page = paginate(
        db.galleryItems
          .filter((item) => item.is_visible)
          .sort(
            (a, b) =>
              a.sort_order - b.sort_order ||
              b.created_at.localeCompare(a.created_at),
          ),
        params.page,
        params.page_size,
        20,
      );
      return { ...page, items: page.items.map(toGalleryPublic) };
    },

    /* ---------------- Auth ---------------- */

    // MOCK-ONLY credentials; the real client validates server-side.
    login: async (credentials: AdminLoginRequest) => {
      if (
        credentials.username !== "admin" ||
        credentials.password !== "admin123"
      ) {
        throw new ApiError(401, {
          code: "unauthorized",
          message: "用户名或密码错误（mock 模式：admin / admin123）",
          details: null,
        });
      }
      tokenCounter += 1;
      const token: TokenResponse = {
        access_token: `mock-token-${tokenCounter}`,
        expires_in: 3600,
        token_type: "bearer",
        admin: clone(MOCK_ADMIN),
      };
      setAuthToken(token.access_token, token.expires_in);
      return clone(token);
    },

    logout: async () => {
      clearAuthToken();
    },

    getMe: async () => {
      requireAuth();
      return clone(MOCK_ADMIN);
    },

    /* ---------------- Admin: research areas ---------------- */

    listAdminResearchAreas: async (params = {}) => {
      requireAuth();
      const page = paginate(
        [...db.researchAreas].sort((a, b) => a.sort_order - b.sort_order),
        params.page,
        params.page_size,
        50,
      );
      return { ...page, items: page.items.map(toResearchAreaAdmin) };
    },

    getAdminResearchArea: async (areaId) => {
      requireAuth();
      const found = db.researchAreas.find((a) => a.id === areaId);
      if (!found) throw notFound("研究方向", areaId);
      return clone(toResearchAreaAdmin(found));
    },

    createResearchArea: async (input: ResearchAreaCreate) => {
      requireAuth();
      if (slugTaken(db.researchAreas, input.slug)) {
        throw conflict(`Slug 已存在：${input.slug}`);
      }
      const now = nowIso();
      const created: ResearchAreaAdmin = {
        id: makeId(),
        slug: input.slug,
        title: input.title,
        description: input.description,
        problem_statement: input.problem_statement ?? null,
        application_scenarios: input.application_scenarios ?? [],
        representative_project_id: input.representative_project_id ?? null,
        representative_project: null,
        sort_order: input.sort_order ?? 0,
        is_visible: input.is_visible ?? false,
        created_at: now,
        updated_at: now,
      };
      syncResearchReference(created);
      db.researchAreas.push(created);
      return clone(created);
    },

    updateResearchArea: async (areaId, patch: ResearchAreaUpdate) => {
      requireAuth();
      const found = db.researchAreas.find((a) => a.id === areaId);
      if (!found) throw notFound("研究方向", areaId);
      if (patch.slug && slugTaken(db.researchAreas, patch.slug, areaId)) {
        throw conflict(`Slug 已存在：${patch.slug}`);
      }
      applyDefined(found, patch);
      found.updated_at = nowIso();
      syncResearchReference(found);
      return clone(found);
    },

    deleteResearchArea: async (areaId) => {
      requireAuth();
      const index = db.researchAreas.findIndex((a) => a.id === areaId);
      if (index === -1) throw notFound("研究方向", areaId);
      db.researchAreas.splice(index, 1);
    },

    /* ---------------- Admin: news ---------------- */

    listAdminNews: async (params = {}) => {
      requireAuth();
      return paginate(
        [...db.news].sort((a, b) =>
          (b.published_at ?? b.created_at).localeCompare(
            a.published_at ?? a.created_at,
          ),
        ),
        params.page,
        params.page_size,
        20,
      );
    },

    getAdminNews: async (newsId) => {
      requireAuth();
      const found = db.news.find((n) => n.id === newsId);
      if (!found) throw notFound("新闻", newsId);
      return clone(found);
    },

    createNews: async (input: NewsCreate) => {
      requireAuth();
      if (slugTaken(db.news, input.slug)) {
        throw conflict(`Slug 已存在：${input.slug}`);
      }
      const now = nowIso();
      const created: NewsAdmin = {
        id: makeId(),
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt ?? null,
        content: input.content,
        cover_media_id: input.cover_media_id ?? null,
        cover: input.cover_media_id
          ? toPublicMedia(requireMedia(input.cover_media_id))
          : null,
        published_at: input.published_at ?? null,
        sort_order: input.sort_order ?? 0,
        is_visible: input.is_visible ?? false,
        created_at: now,
        updated_at: now,
      };
      db.news.push(created);
      return clone(created);
    },

    updateNews: async (newsId, patch: NewsUpdate) => {
      requireAuth();
      const found = db.news.find((n) => n.id === newsId);
      if (!found) throw notFound("新闻", newsId);
      if (patch.slug && slugTaken(db.news, patch.slug, newsId)) {
        throw conflict(`Slug 已存在：${patch.slug}`);
      }
      if (patch.cover_media_id) {
        found.cover = toPublicMedia(requireMedia(patch.cover_media_id));
      } else if (patch.cover_media_id === null) {
        found.cover = null;
      }
      applyDefined(found, patch);
      found.updated_at = nowIso();
      return clone(found);
    },

    publishNews: async (newsId) => {
      requireAuth();
      const found = db.news.find((n) => n.id === newsId);
      if (!found) throw notFound("新闻", newsId);
      if (found.published_at === null) found.published_at = nowIso();
      found.is_visible = true;
      found.updated_at = nowIso();
      return clone(found);
    },

    deleteNews: async (newsId) => {
      requireAuth();
      const index = db.news.findIndex((n) => n.id === newsId);
      if (index === -1) throw notFound("新闻", newsId);
      db.news.splice(index, 1);
    },

    /* ---------------- Admin: projects ---------------- */

    listAdminProjects: async (params = {}) => {
      requireAuth();
      return paginate(
        [...db.projects].sort((a, b) => a.sort_order - b.sort_order),
        params.page,
        params.page_size,
        20,
      );
    },

    getAdminProject: async (projectId) => {
      requireAuth();
      const found = db.projects.find((p) => p.id === projectId);
      if (!found) throw notFound("项目", projectId);
      return clone(found);
    },

    createProject: async (input: ProjectCreate) => {
      requireAuth();
      if (slugTaken(db.projects, input.slug)) {
        throw conflict(`Slug 已存在：${input.slug}`);
      }
      const now = nowIso();
      const created: ProjectAdmin = {
        id: makeId(),
        slug: input.slug,
        title: input.title,
        summary: input.summary ?? null,
        description: input.description,
        demo_url: input.demo_url ?? null,
        cover_media_id: input.cover_media_id ?? null,
        cover: input.cover_media_id
          ? toPublicMedia(requireMedia(input.cover_media_id))
          : null,
        sort_order: input.sort_order ?? 0,
        published_at: input.published_at ?? null,
        is_visible: input.is_visible ?? false,
        created_at: now,
        updated_at: now,
      };
      db.projects.push(created);
      return clone(created);
    },

    updateProject: async (projectId, patch: ProjectUpdate) => {
      requireAuth();
      const found = db.projects.find((p) => p.id === projectId);
      if (!found) throw notFound("项目", projectId);
      if (patch.slug && slugTaken(db.projects, patch.slug, projectId)) {
        throw conflict(`Slug 已存在：${patch.slug}`);
      }
      if (patch.cover_media_id) {
        found.cover = toPublicMedia(requireMedia(patch.cover_media_id));
      } else if (patch.cover_media_id === null) {
        found.cover = null;
      }
      applyDefined(found, patch);
      found.updated_at = nowIso();
      return clone(found);
    },

    publishProject: async (projectId) => {
      requireAuth();
      const found = db.projects.find((p) => p.id === projectId);
      if (!found) throw notFound("项目", projectId);
      if (found.published_at === null) found.published_at = nowIso();
      found.is_visible = true;
      found.updated_at = nowIso();
      return clone(found);
    },

    deleteProject: async (projectId) => {
      requireAuth();
      const index = db.projects.findIndex((p) => p.id === projectId);
      if (index === -1) throw notFound("项目", projectId);
      db.projects.splice(index, 1);
    },

    /* ---------------- Admin: awards ---------------- */

    listAdminAwards: async (params = {}) => {
      requireAuth();
      return paginate(
        [...db.awards].sort(
          (a, b) =>
            b.award_date.localeCompare(a.award_date) ||
            a.sort_order - b.sort_order,
        ),
        params.page,
        params.page_size,
        20,
      );
    },

    getAdminAward: async (awardId) => {
      requireAuth();
      const found = db.awards.find((a) => a.id === awardId);
      if (!found) throw notFound("奖项", awardId);
      return clone(found);
    },

    createAward: async (input: AwardCreate) => {
      requireAuth();
      const now = nowIso();
      const created: AwardAdmin = {
        id: makeId(),
        title: input.title,
        category: input.category,
        level: input.level,
        issuer: input.issuer,
        competition_name: input.competition_name,
        description: input.description,
        award_date: input.award_date,
        year: input.year,
        certificate_media_id: input.certificate_media_id ?? null,
        cover_media_id: input.cover_media_id ?? null,
        certificate: input.certificate_media_id
          ? toPublicMedia(requireMedia(input.certificate_media_id))
          : null,
        cover: input.cover_media_id
          ? toPublicMedia(requireMedia(input.cover_media_id))
          : null,
        sort_order: input.sort_order ?? 0,
        is_featured: input.is_featured ?? false,
        is_visible: input.is_visible ?? false,
        created_at: now,
        updated_at: now,
      };
      db.awards.push(created);
      return clone(created);
    },

    updateAward: async (awardId, patch: AwardUpdate) => {
      requireAuth();
      const found = db.awards.find((a) => a.id === awardId);
      if (!found) throw notFound("奖项", awardId);
      if (patch.certificate_media_id) {
        found.certificate = toPublicMedia(
          requireMedia(patch.certificate_media_id),
        );
      } else if (patch.certificate_media_id === null) {
        found.certificate = null;
      }
      if (patch.cover_media_id) {
        found.cover = toPublicMedia(requireMedia(patch.cover_media_id));
      } else if (patch.cover_media_id === null) {
        found.cover = null;
      }
      applyDefined(found, patch);
      found.updated_at = nowIso();
      return clone(found);
    },

    deleteAward: async (awardId) => {
      requireAuth();
      const index = db.awards.findIndex((a) => a.id === awardId);
      if (index === -1) throw notFound("奖项", awardId);
      db.awards.splice(index, 1);
    },

    /* ---------------- Admin: independent gallery ---------------- */

    listAdminGallery: async (params = {}) => {
      requireAuth();
      return paginate(
        [...db.galleryItems].sort(
          (a, b) =>
            a.sort_order - b.sort_order ||
            b.created_at.localeCompare(a.created_at),
        ),
        params.page,
        params.page_size,
        50,
      );
    },

    getAdminGallery: async (galleryId) => {
      requireAuth();
      const found = db.galleryItems.find((item) => item.id === galleryId);
      if (!found) throw notFound("影像记录", galleryId);
      return clone(found);
    },

    createGalleryItem: async (input: GalleryItemCreate) => {
      requireAuth();
      if (db.galleryItems.some((item) => item.media_id === input.media_id)) {
        throw conflict("该素材已经加入影像记录");
      }
      const now = nowIso();
      const created: GalleryItemAdmin = {
        id: input.media_id,
        title: input.title,
        description: input.description ?? null,
        media: toPublicMedia(requireMedia(input.media_id)),
        media_id: input.media_id,
        sort_order: input.sort_order ?? 0,
        is_visible: input.is_visible ?? false,
        created_at: now,
        updated_at: now,
      };
      db.galleryItems.push(created);
      return clone(created);
    },

    updateGalleryItem: async (galleryId, patch: GalleryItemUpdate) => {
      requireAuth();
      const found = db.galleryItems.find((item) => item.id === galleryId);
      if (!found) throw notFound("影像记录", galleryId);
      const { media_id: nextMediaId, ...metadata } = patch;
      if (nextMediaId !== undefined) {
        if (nextMediaId === null) {
          throw validationFailed("影像记录必须绑定素材");
        }
        if (
          db.galleryItems.some(
            (item) => item.id !== found.id && item.media_id === nextMediaId,
          )
        ) {
          throw conflict("该素材已经加入影像记录");
        }
        found.id = nextMediaId;
        found.media_id = nextMediaId;
        found.media = toPublicMedia(requireMedia(nextMediaId));
      }
      applyDefined(found, metadata);
      found.updated_at = nowIso();
      return clone(found);
    },

    deleteGalleryItem: async (galleryId) => {
      requireAuth();
      const index = db.galleryItems.findIndex((item) => item.id === galleryId);
      if (index === -1) throw notFound("影像记录", galleryId);
      db.galleryItems.splice(index, 1);
    },

    /* ---------------- Admin: media ---------------- */

    listAdminMedia: async (params = {}) => {
      requireAuth();
      return paginate(
        [...db.media].sort((a, b) => b.created_at.localeCompare(a.created_at)),
        params.page,
        params.page_size,
        50,
      );
    },

    uploadMedia: async (file: File) => {
      requireAuth();
      const now = nowIso();
      const id = makeId();
      const created: MediaAdmin = {
        id,
        original_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        // Dimensions are unknown for arbitrary uploads; contract allows null.
        width: null,
        height: null,
        url: MOCK_UPLOAD_URL,
        storage_key: `media/${id}.svg`,
        created_at: now,
        updated_at: now,
      };
      db.media.unshift(created);
      return clone(created);
    },

    deleteMedia: async (mediaId) => {
      requireAuth();
      const index = db.media.findIndex((m) => m.id === mediaId);
      if (index === -1) throw notFound("素材", mediaId);

      const refs = new Map<string, number>();
      const bump = (entity: string): void => {
        refs.set(entity, (refs.get(entity) ?? 0) + 1);
      };
      if (
        db.settings.logo_media_id === mediaId ||
        db.settings.contact_qr_primary_media_id === mediaId ||
        db.settings.contact_qr_secondary_media_id === mediaId
      )
        bump("site-settings");
      for (const n of db.news) if (n.cover_media_id === mediaId) bump("news");
      for (const p of db.projects) {
        if (p.cover_media_id === mediaId) bump("projects");
      }
      for (const a of db.awards) {
        if (a.certificate_media_id === mediaId) bump("awards");
        if (a.cover_media_id === mediaId) bump("awards");
      }
      for (const item of db.galleryItems) {
        if (item.media_id === mediaId) bump("gallery");
      }

      if (refs.size > 0) {
        const summary = [...refs.entries()]
          .map(([entity, count]) => `${entity}(${count})`)
          .join("、");
        throw conflict(`该素材仍被 ${summary} 引用，无法删除`, {
          references: [...refs.entries()],
        });
      }

      db.media.splice(index, 1);
    },

    /* ---------------- Admin: site settings ---------------- */

    getAdminSiteSettings: async () => {
      requireAuth();
      return clone(db.settings);
    },

    updateSiteSettings: async (patch: SiteSettingsUpdate) => {
      requireAuth();
      return patchSettings(patch);
    },

    // PUT exists in the contract as a full-replace variant; in the mock both
    // verbs behave identically.
    putSiteSettings: async (update: SiteSettingsUpdate) => {
      requireAuth();
      return patchSettings(update);
    },
  };
}
