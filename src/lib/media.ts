import type { MediaPublic } from "@/lib/types/api";

/**
 * Fallback intrinsic dimensions for `next/image` when the contract's
 * `MediaPublic.width`/`height` are null.
 */
export const FALLBACK_IMAGE_WIDTH = 1200;
export const FALLBACK_IMAGE_HEIGHT = 800;

/** Route CMS media through the frontend proxy while leaving other URLs intact. */
export function mediaUrlForNextImage(url: string): string {
  try {
    const parsed = new URL(url);
    const cmsMediaPrefix = ["", "api", "v1", "media", ""].join("/");
    if (parsed.pathname.startsWith(cmsMediaPrefix)) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Relative URLs and malformed values are left for the image component to handle.
  }
  return url;
}

/** A candidate gallery image sourced from a public entity. */
export interface GallerySeed {
  media: MediaPublic | null;
  /** Where clicking the image should go (source detail page). */
  href: string;
  title: string;
  /** Human label of the source kind, e.g. 项目 / 荣誉 / 新闻. */
  source: string;
}

export interface GalleryItem {
  media: MediaPublic;
  href: string;
  title: string;
  source: string;
}

/**
 * Compose the home gallery from covers of published projects/awards/news.
 *
 * The contract has NO public media endpoint, so the gallery is assembled
 * from media already embedded in public payloads, deduped by media id and
 * capped to `limit` items. Deterministic: input order is preserved.
 */
export function collectGallery(
  seeds: GallerySeed[],
  limit = 8,
): GalleryItem[] {
  const seen = new Set<string>();
  const items: GalleryItem[] = [];
  for (const seed of seeds) {
    if (!seed.media || seen.has(seed.media.id)) continue;
    seen.add(seed.media.id);
    items.push({
      media: seed.media,
      href: seed.href,
      title: seed.title,
      source: seed.source,
    });
    if (items.length >= limit) break;
  }
  return items;
}
