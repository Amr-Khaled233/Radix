/** Upload rules (spec §8.7). SVG is never accepted (XSS risk). */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const FRAME_TYPES = ["image/webp"] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_FRAME_BYTES = 2 * 1024 * 1024;

/** Hero guidance thresholds (spec §4A). */
export const HERO_WARN_DESKTOP_BYTES = 12 * 1024 * 1024;
export const HERO_WARN_MOBILE_BYTES = 6 * 1024 * 1024;

export type UploadKind = "image" | "video" | "frame";

export function kindOf(contentType: string): "image" | "video" | null {
  if ((IMAGE_TYPES as readonly string[]).includes(contentType)) return "image";
  if ((VIDEO_TYPES as readonly string[]).includes(contentType)) return "video";
  return null;
}

export function rulesFor(kind: UploadKind) {
  switch (kind) {
    case "image":
      return { types: IMAGE_TYPES as readonly string[], maxBytes: MAX_IMAGE_BYTES };
    case "video":
      return { types: VIDEO_TYPES as readonly string[], maxBytes: MAX_VIDEO_BYTES };
    case "frame":
      return { types: FRAME_TYPES as readonly string[], maxBytes: MAX_FRAME_BYTES };
  }
}

/** Blob pathnames are namespaced by kind: media/…, hero/frames/{id}/0001.webp. */
export function isAllowedPathname(pathname: string, kind: UploadKind) {
  const safe = /^[a-z0-9][a-z0-9/_.-]*$/i.test(pathname) && !pathname.includes("..");
  if (!safe) return false;
  return kind === "frame" ? pathname.startsWith("hero/frames/") : pathname.startsWith("media/");
}

export const LOCAL_MEDIA_PREFIX = "/api/media/local/";

/** True for URLs our uploads can produce: Vercel Blob public URLs, or local dev storage. */
export function isOwnMediaUrl(url: string) {
  if (url.startsWith(LOCAL_MEDIA_PREFIX)) return true;
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
