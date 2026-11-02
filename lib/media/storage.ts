import "server-only";
import path from "node:path";
import { isOwnMediaUrl, LOCAL_MEDIA_PREFIX } from "./config";

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

/** Blob store host from the read-write token (`vercel_blob_rw_<storeId>_…`), when it can be read. */
function ownBlobHost() {
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([a-z0-9]+)_/i)?.[1];
  return storeId ? `${storeId.toLowerCase()}.public.blob.vercel-storage.com` : null;
}

/**
 * Server-side check that a URL points at this site's own uploads: this project's
 * Blob store, or local storage when it is the active mode.
 */
export function isOwnUploadUrl(url: string) {
  if (!isOwnMediaUrl(url)) return false;
  if (url.startsWith(LOCAL_MEDIA_PREFIX)) return storageMode() === "local";
  const host = ownBlobHost();
  return !host || new URL(url).hostname === host;
}
