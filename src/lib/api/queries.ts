import { api } from "./index";
import type {
  AwardPublic,
  GalleryItemPublic,
  ListAwardsParams,
  NewsPublic,
  PageParams,
  PageResponse,
  ProjectPublic,
  ResearchAreaPublic,
  SiteSettingsPublic,
} from "@/lib/types/api";

/**
 * Server-friendly typed read helpers used by pages.
 *
 * These are intentionally thin wrappers over `api` (the singleton
 * `ApiClient`). They exist so pages never construct params inline and so
 * loading/empty/error states can be handled against typed results.
 * Mutations always go through `api` directly.
 */

export interface HomeData {
  settings: SiteSettingsPublic;
  researchAreas: ResearchAreaPublic[];
  /**
   * Top published projects in curated `sort_order`. The contract has no
   * project featured flag, so the home page uses the first N of the public
   * list as its featured set.
  */
  featuredProjects: ProjectPublic[];
  /** Featured awards with certificate media for the honors rail. */
  featuredAwards: AwardPublic[];
  /** Independently curated visual-archive records. */
  gallery: GalleryItemPublic[];
  latestNews: NewsPublic[];
}

/** Compose everything the home page needs in one parallel fetch. */
export async function getHomeData(): Promise<HomeData> {
  const [settings, research, projects, awards, news, gallery] = await Promise.all([
    api.getSiteSettings(),
    api.listResearchAreas({ page: 1, page_size: 50 }),
    api.listProjects({ page: 1, page_size: 3 }),
    api.listAwards({ featured: true, sort: "date_desc", page: 1, page_size: 50 }),
    api.listNews({ page: 1, page_size: 4 }),
    api.listGallery({ page: 1, page_size: 8 }),
  ]);

  // The API already returns the featured set in date order, so filtering keeps
  // the editorial order and the slice simply caps the honors rail.
  const featuredAwards = awards.items
    .filter((award) => award.certificate !== null)
    .slice(0, 3);

  return {
    settings,
    researchAreas: research.items,
    featuredProjects: projects.items,
    featuredAwards,
    gallery: gallery.items,
    latestNews: news.items,
  };
}

/** Full visible research-area list (public research page). */
export async function getResearchAreas(): Promise<ResearchAreaPublic[]> {
  const page = await api.listResearchAreas({ page: 1, page_size: 50 });
  return page.items;
}

/** Paginated public project list. */
export function getProjectsPage(
  params: PageParams = {},
): Promise<PageResponse<ProjectPublic>> {
  return api.listProjects(params);
}

/** Paginated public news list. */
export function getNewsPage(
  params: PageParams = {},
): Promise<PageResponse<NewsPublic>> {
  return api.listNews(params);
}

/** Paginated public awards list (supports featured filter + sort). */
export function getAwardsPage(
  params: ListAwardsParams = {},
): Promise<PageResponse<AwardPublic>> {
  return api.listAwards(params);
}
