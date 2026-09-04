/**
 * Handwritten TypeScript types derived 1:1 from `contracts/openapi.json`
 * (Robotics Laboratory CMS API 1.0.0).
 *
 * Rules:
 * - Never invent fields. If the contract lacks it, it does not exist here.
 * - Nullability mirrors the contract exactly (e.g. `cover: MediaPublic | null`).
 * - `undefined` in this codebase means "omit from the request"; `null` means
 *   "explicitly clear the value" — the contract's Update schemas use the same
 *   distinction via optional nullable properties.
 *
 * Known contract-vs-PRD mismatches (contract wins):
 * - Site settings has a single `lab_name`; the PRD mentioned separate
 *   Chinese/English names.
 * - No school/college fields exist in the contract; the mock fixture carries
 *   that information inside the free-text `address`/`description`.
 */

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const AWARD_CATEGORIES = [
  "competition",
  "research",
  "innovation",
  "honor",
  "other",
] as const;
export type AwardCategory = (typeof AWARD_CATEGORIES)[number];

export const AWARD_LEVELS = [
  "national",
  "provincial",
  "municipal",
  "university",
  "other",
] as const;
export type AwardLevel = (typeof AWARD_LEVELS)[number];

export const AWARD_SORTS = ["date_desc", "sort_order"] as const;
export type AwardSort = (typeof AWARD_SORTS)[number];

/* ------------------------------------------------------------------ */
/* Shared envelopes                                                    */
/* ------------------------------------------------------------------ */

/** Paginated list envelope: `PageResponse[T]` in the contract. */
export interface PageResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

/** `ErrorBody` — the contract error payload carried inside `ErrorResponse`. */
export interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/** `ErrorResponse` — `{"error": ErrorBody}`. */
export interface ErrorResponse {
  error: ErrorBody;
}

/**
 * FastAPI's standard validation error item.
 *
 * Not a declared schema of this contract (the backend strips FastAPI's
 * default 422 schemas from `contracts/openapi.json`), but it models the
 * exact envelope FastAPI returns for validation failures at runtime, which
 * `http.ts` normalizes into `ErrorBody.details` and the admin forms map
 * onto field errors. Shape: `{loc, msg, type}`.
 */
export interface ValidationErrorDetail {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

/** FastAPI's standard 422 envelope — see `ValidationErrorDetail`. */
export interface HTTPValidationError {
  detail?: ValidationErrorDetail[];
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export interface MediaPublic {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  url: string;
}

/** Admin view = public fields + storage bookkeeping. */
export interface MediaAdmin extends MediaPublic {
  storage_key: string;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Independent gallery                                                 */
/* ------------------------------------------------------------------ */

export interface GalleryItemPublic {
  /** The media UUID is also the stable gallery record identifier. */
  id: string;
  title: string;
  description: string | null;
  media: MediaPublic;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryItemAdmin extends GalleryItemPublic {
  media_id: string;
  is_visible: boolean;
}

export interface GalleryItemCreate {
  media_id: string;
  title: string;
  description?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

/** Omit a field to keep it; `null` clears nullable text fields. */
export interface GalleryItemUpdate {
  /** Change the bound media; `null` is rejected by the API. */
  media_id?: string | null;
  title?: string | null;
  description?: string | null;
  sort_order?: number | null;
  is_visible?: boolean | null;
}

/* ------------------------------------------------------------------ */
/* Site settings                                                       */
/* ------------------------------------------------------------------ */

export interface SiteSettingsPublic {
  key: string;
  site_title: string;
  lab_name: string;
  tagline: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  lab_positioning: string | null;
  founded_year: number | null;
  founding_background: string | null;
  core_platforms: string[];
  paper_count: number;
  patent_count: number;
  active_project_count: number;
  trained_student_count: number;
  homepage_featured_awards_limit: number;
  homepage_gallery_limit: number;
  papers_url: string | null;
  join_url: string | null;
  cooperation_url: string | null;
  logo: MediaPublic | null;
  contact_qr_primary: MediaPublic | null;
  contact_qr_secondary: MediaPublic | null;
  social_github: string | null;
  social_bilibili: string | null;
  social_email: string | null;
  created_at: string;
  updated_at: string;
}

/** Admin view adds the writable media reference. */
export interface SiteSettingsAdmin extends SiteSettingsPublic {
  logo_media_id: string | null;
  contact_qr_primary_media_id: string | null;
  contact_qr_secondary_media_id: string | null;
}

/** All fields optional; omit to keep, `null` to clear. */
export interface SiteSettingsUpdate {
  site_title?: string | null;
  lab_name?: string | null;
  tagline?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  lab_positioning?: string | null;
  founded_year?: number | null;
  founding_background?: string | null;
  core_platforms?: string[];
  paper_count?: number;
  patent_count?: number;
  active_project_count?: number;
  trained_student_count?: number;
  homepage_featured_awards_limit?: number;
  homepage_gallery_limit?: number;
  papers_url?: string | null;
  join_url?: string | null;
  cooperation_url?: string | null;
  logo_media_id?: string | null;
  contact_qr_primary_media_id?: string | null;
  contact_qr_secondary_media_id?: string | null;
  social_github?: string | null;
  social_bilibili?: string | null;
  social_email?: string | null;
}

/* ------------------------------------------------------------------ */
/* Research areas                                                      */
/* ------------------------------------------------------------------ */

export interface ProjectReferencePublic {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover: MediaPublic | null;
  demo_url: string | null;
}

export interface ResearchAreaPublic {
  id: string;
  slug: string;
  title: string;
  description: string;
  problem_statement: string | null;
  application_scenarios: string[];
  representative_project: ProjectReferencePublic | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchAreaAdmin extends ResearchAreaPublic {
  representative_project_id: string | null;
  is_visible: boolean;
}

export interface ResearchAreaCreate {
  slug: string;
  title: string;
  description: string;
  problem_statement?: string | null;
  application_scenarios?: string[];
  representative_project_id?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

/** All fields optional; omit to keep, `null` to clear. */
export interface ResearchAreaUpdate {
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  problem_statement?: string | null;
  application_scenarios?: string[];
  representative_project_id?: string | null;
  sort_order?: number | null;
  is_visible?: boolean | null;
}

/* ------------------------------------------------------------------ */
/* News                                                                */
/* ------------------------------------------------------------------ */

export interface NewsPublic {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover: MediaPublic | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsAdmin extends NewsPublic {
  cover_media_id: string | null;
  sort_order: number;
  is_visible: boolean;
}

export interface NewsCreate {
  slug: string;
  title: string;
  content: string;
  excerpt?: string | null;
  cover_media_id?: string | null;
  published_at?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

/** All fields optional; omit to keep, `null` to clear. */
export interface NewsUpdate {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  cover_media_id?: string | null;
  published_at?: string | null;
  sort_order?: number | null;
  is_visible?: boolean | null;
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export interface ProjectPublic {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string;
  demo_url: string | null;
  cover: MediaPublic | null;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectAdmin extends ProjectPublic {
  cover_media_id: string | null;
  is_visible: boolean;
}

export interface ProjectCreate {
  slug: string;
  title: string;
  description: string;
  demo_url?: string | null;
  summary?: string | null;
  cover_media_id?: string | null;
  published_at?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

/** All fields optional; omit to keep, `null` to clear. */
export interface ProjectUpdate {
  slug?: string | null;
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  demo_url?: string | null;
  cover_media_id?: string | null;
  published_at?: string | null;
  sort_order?: number | null;
  is_visible?: boolean | null;
}

/* ------------------------------------------------------------------ */
/* Awards                                                              */
/* ------------------------------------------------------------------ */

export interface AwardPublic {
  id: string;
  title: string;
  category: AwardCategory;
  level: AwardLevel;
  issuer: string;
  competition_name: string;
  description: string;
  /** ISO date (YYYY-MM-DD). */
  award_date: string;
  year: number;
  certificate_media_id: string | null;
  cover_media_id: string | null;
  certificate: MediaPublic | null;
  cover: MediaPublic | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface AwardAdmin extends AwardPublic {
  is_visible: boolean;
}

export interface AwardCreate {
  title: string;
  category: AwardCategory;
  level: AwardLevel;
  issuer: string;
  competition_name: string;
  description: string;
  /** ISO date (YYYY-MM-DD). */
  award_date: string;
  year: number;
  certificate_media_id?: string | null;
  cover_media_id?: string | null;
  sort_order?: number;
  is_featured?: boolean;
  is_visible?: boolean;
}

/** All fields optional; omit to keep, `null` to clear. */
export interface AwardUpdate {
  title?: string | null;
  category?: AwardCategory | null;
  level?: AwardLevel | null;
  issuer?: string | null;
  competition_name?: string | null;
  description?: string | null;
  award_date?: string | null;
  year?: number | null;
  certificate_media_id?: string | null;
  cover_media_id?: string | null;
  sort_order?: number | null;
  is_featured?: boolean | null;
  is_visible?: boolean | null;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export interface AdminPublic {
  id: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  admin: AdminPublic;
  /** Defaults to `"bearer"` server-side; not required in the response. */
  token_type?: string;
}

/* ------------------------------------------------------------------ */
/* List parameters                                                     */
/* ------------------------------------------------------------------ */

/** Common pagination query params (server defaults: page=1). */
export interface PageParams {
  page?: number;
  page_size?: number;
}

/**
 * Query params of the public awards list endpoint (`GET /awards`, relative
 * to the API base). `featured` accepts `boolean | null` server-side;
 * `null`/omitted means "no filter".
 */
export interface ListAwardsParams extends PageParams {
  featured?: boolean | null;
  sort?: AwardSort;
}
