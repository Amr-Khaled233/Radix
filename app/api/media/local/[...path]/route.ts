import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { localFilePath, storageMode } from "@/lib/media/storage";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

/** Serves development uploads from .data/uploads (never active in production). */
export async function GET(_request: Request, { params }: RouteContext<"/api/media/local/[...path]">) {
  if (storageMode() !== "local") return new Response("Not found", { status: 404 });
  const { path: segments } = await params;
  const file = localFilePath(segments.join("/"));
  const type = file ? TYPES[path.extname(file).toLowerCase()] : undefined;
  if (!file || !type) return new Response("Not found", { status: 404 });
  try {
    await stat(file);
    return new Response(new Uint8Array(await readFile(file)), {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
