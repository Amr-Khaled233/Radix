import "server-only";
import path from "node:path";

/**
 * Vercel Blob when BLOB_READ_WRITE_TOKEN is set. Without it, development uses
 * files under .data/uploads so the dashboard works before Blob is connected.
 * Production without Blob refuses uploads.
 */
export function storageMode(): "blob" | "local" | "unavailable" {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  // MEDIA_STORAGE=local lets a local production build (`pnpm start`) use disk storage; never set it on Vercel.
  if (process.env.MEDIA_STORAGE === "local") return "local";
  return process.env.NODE_ENV === "production" ? "unavailable" : "local";
}

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

/** Resolves a local media path safely inside LOCAL_UPLOAD_DIR (or null). */
export function localFilePath(relative: string) {
  const full = path.resolve(LOCAL_UPLOAD_DIR, relative);
  return full.startsWith(LOCAL_UPLOAD_DIR + path.sep) ? full : null;
}
