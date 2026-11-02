"use client";

import { upload } from "@vercel/blob/client";
import { rulesFor, type UploadKind } from "./config";

export type UploadedFile = { url: string; pathname: string; contentType: string; size: number };

let modePromise: Promise<"blob" | "local" | "unavailable"> | null = null;

function storageMode() {
  modePromise ??= fetch("/api/upload")
    .then((res) => res.json() as Promise<{ mode: "blob" | "local" | "unavailable" }>)
    .then((data) => data.mode)
    .catch(() => "unavailable" as const);
  return modePromise;
}

export class UploadError extends Error {
  constructor(readonly code: "type" | "size" | "unavailable" | "failed") {
    super(code);
  }
}

function slugifyName(name: string) {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
  const base = name
    .slice(0, name.length - ext.length)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base || "file"}${ext}`;
}

/**
 * Uploads a file from the browser: Vercel Blob client upload (multipart for
 * large files) or the local development endpoint. Validates type and size first.
 */
export async function uploadFile(
  file: File | Blob,
  options: { kind: UploadKind; pathname?: string; name?: string; onProgress?: (percent: number) => void },
): Promise<UploadedFile> {
  const rules = rulesFor(options.kind);
  if (!rules.types.includes(file.type)) throw new UploadError("type");
  if (file.size > rules.maxBytes) throw new UploadError("size");

  const pathname = options.pathname ?? `media/${slugifyName(options.name ?? (file as File).name ?? "file")}`;
  const mode = await storageMode();
  if (mode === "unavailable") throw new UploadError("unavailable");

  if (mode === "blob") {
    try {
      const result = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ kind: options.kind }),
        contentType: file.type,
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => options.onProgress?.(percentage),
      });
      return { url: result.url, pathname: result.pathname, contentType: file.type, size: file.size };
    } catch {
      throw new UploadError("failed");
    }
  }

  // Local development endpoint, with progress via XHR.
  const form = new FormData();
  form.append("file", file);
  form.append("kind", options.kind);
  form.append("pathname", pathname);
  return new Promise<UploadedFile>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/local");
    xhr.upload.onprogress = (event) =>
      event.lengthComputable && options.onProgress?.((event.loaded / event.total) * 100);
    xhr.onload = () => (xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new UploadError("failed")));
    xhr.onerror = () => reject(new UploadError("failed"));
    xhr.send(form);
  });
}

/** Reads image dimensions or video dimensions/duration in the browser. */
export function readMediaMetadata(file: File): Promise<{ width?: number; height?: number; duration?: number }> {
  const url = URL.createObjectURL(file);
  const done = <T>(value: T) => {
    URL.revokeObjectURL(url);
    return value;
  };
  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(done({ width: img.naturalWidth, height: img.naturalHeight }));
      img.onerror = () => resolve(done({}));
      img.src = url;
    });
  }
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      resolve(done({ width: video.videoWidth, height: video.videoHeight, duration: video.duration }));
    video.onerror = () => resolve(done({}));
    video.src = url;
  });
}
