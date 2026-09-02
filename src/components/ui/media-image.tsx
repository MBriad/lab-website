import Image from "next/image";
import { cn } from "@/lib/cn";
import {
  FALLBACK_IMAGE_HEIGHT,
  FALLBACK_IMAGE_WIDTH,
  mediaUrlForNextImage,
} from "@/lib/media";
import type { MediaPublic } from "@/lib/types/api";

export interface MediaImageProps {
  /** Contract media reference; `null` renders a labeled placeholder panel. */
  media: MediaPublic | null;
  alt: string;
  /**
   * `intrinsic` (default): width/height image scaling to its container.
   * `cover`: fills a sized parent (`relative` wrapper provided) with
   * object-cover — parent must define aspect/height.
   */
  mode?: "intrinsic" | "cover";
  fallbackWidth?: number;
  fallbackHeight?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}

/**
 * next/image wrapper for contract `MediaPublic | null`.
 *
 * Handles nullable `width`/`height` with sensible fallbacks, supplies a
 * default responsive `sizes`, and renders a HUD placeholder when the media
 * reference is null instead of crashing or inventing a URL.
 */
export function MediaImage({
  media,
  alt,
  mode = "intrinsic",
  fallbackWidth = FALLBACK_IMAGE_WIDTH,
  fallbackHeight = FALLBACK_IMAGE_HEIGHT,
  sizes,
  priority = false,
  className,
  imgClassName,
}: MediaImageProps) {
  if (!media) {
    return (
      <div
        role="img"
        aria-label={alt || "暂无图片"}
        className={cn(
          "grid place-items-center border border-hairline bg-surface",
          className,
        )}
      >
        <span className="select-none font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase">
          NO SIGNAL
        </span>
      </div>
    );
  }

  const imageSrc = mediaUrlForNextImage(media.url);

  if (mode === "cover") {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={
            sizes ?? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          }
          priority={priority}
          className={cn("object-cover", imgClassName)}
        />
      </div>
    );
  }

  const width = media.width ?? fallbackWidth;
  const height = media.height ?? fallbackHeight;
  return (
    <div className={cn("overflow-hidden", className)}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={cn("block h-auto w-full", imgClassName)}
      />
    </div>
  );
}
