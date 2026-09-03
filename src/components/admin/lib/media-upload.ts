import { api, ApiError } from "@/lib/api";
import type { MediaAdmin } from "@/lib/types/api";
import { isAuthError } from "./errors";

/**
 * Keep the file picker aligned with the default backend image allow-list.
 * MPO is included because some phone cameras/WeChat exports use a `.jpg`
 * filename while the image bytes are a multi-picture object; the backend
 * normalizes that format to a browser-friendly JPEG.
 */
export const IMAGE_UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.mpo";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mpo": "image/mpo",
};

export interface MediaUploadFailure {
  file: File;
  error: unknown;
}

export interface MediaUploadBatchResult {
  uploaded: MediaAdmin[];
  failures: MediaUploadFailure[];
}

function normalizeFileMime(file: File): File | null {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const inferredMime = MIME_BY_EXTENSION[extension];
  const declaredMime = file.type.toLowerCase();
  if (!inferredMime) return declaredMime.startsWith("image/") ? file : null;
  if (declaredMime === inferredMime) return file;
  return new File([file], file.name, {
    type: inferredMime,
    lastModified: file.lastModified,
  });
}

/**
 * Upload selected files through the existing single-file API, one at a time.
 * Sequential requests keep large photo batches predictable and let the UI
 * report progress without introducing a second backend endpoint.
 */
export async function uploadMediaFiles(
  files: readonly File[],
  onProgress?: (completed: number, total: number) => void,
): Promise<MediaUploadBatchResult> {
  const uploaded: MediaAdmin[] = [];
  const failures: MediaUploadFailure[] = [];

  for (const [index, file] of files.entries()) {
    try {
      // Some desktop pickers report an empty MIME or `image/jpg`; infer the
      // configured MIME from a known extension before sending the multipart
      // request. The backend still validates the actual image bytes.
      const uploadFile = normalizeFileMime(file);
      if (!uploadFile) {
        failures.push({ file, error: new Error("仅支持上传图片文件") });
      } else {
        uploaded.push(await api.uploadMedia(uploadFile));
      }
    } catch (error) {
      // A token failure invalidates the whole batch; callers already have the
      // shared redirect behavior for this case.
      if (isAuthError(error)) throw error;
      failures.push({ file, error });
    } finally {
      onProgress?.(index + 1, files.length);
    }
  }

  return { uploaded, failures };
}

/** Render a concise, actionable message for a failed file in a batch. */
export function describeMediaUploadFailure(
  failure: MediaUploadFailure,
): string {
  const code = failure.error instanceof ApiError ? failure.error.code : null;
  if (code === "unsupported_media_type") {
    return `${failure.file.name}：图片格式暂不支持，请使用 JPG、PNG、WebP 或 GIF。`;
  }
  if (code === "invalid_image") {
    return `${failure.file.name}：文件不是有效图片。`;
  }
  if (code === "upload_too_large") {
    return `${failure.file.name}：图片超过大小限制。`;
  }
  if (code === "image_dimensions_too_large") {
    return `${failure.file.name}：图片分辨率超过限制。`;
  }
  if (failure.error instanceof Error && failure.error.message) {
    return `${failure.file.name}：${failure.error.message}`;
  }
  return `${failure.file.name}：上传失败。`;
}

export function summarizeMediaUploadFailures(
  failures: readonly MediaUploadFailure[],
): string {
  if (failures.length === 0) return "";
  const messages = failures.slice(0, 3).map(describeMediaUploadFailure);
  const suffix = failures.length > messages.length ? `等 ${failures.length} 个文件` : "";
  return `部分图片上传失败：${messages.join("；")}${suffix}`;
}
