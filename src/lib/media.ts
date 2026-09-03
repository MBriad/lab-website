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
