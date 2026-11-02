import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { can } from "@/lib/auth/permissions";
import { getAdminUser } from "@/lib/auth/session";
import { isAllowedPathname, LOCAL_MEDIA_PREFIX, rulesFor, type UploadKind } from "@/lib/media/config";
import { localFilePath, storageMode } from "@/lib/media/storage";

/** Development-only upload target used when Vercel Blob isn't configured. */
export async function POST(request: Request) {
  if (storageMode() !== "local") return NextResponse.json({ error: "Not available" }, { status: 404 });
  const user = await getAdminUser();
  if (!user || !can(user, "create", "media")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind")) as UploadKind;
  const requested = String(form.get("pathname") ?? "");
  if (!(file instanceof File) || !["image", "video", "frame"].includes(kind)) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const rules = rulesFor(kind);
  if (!rules.types.includes(file.type) || file.size > rules.maxBytes || !isAllowedPathname(requested, kind)) {
    return NextResponse.json({ error: "File type or size not allowed" }, { status: 400 });
  }

  // Mirror Blob's random suffix for media; frames keep their exact path.
  const ext = path.extname(requested);
  const pathname =
    kind === "frame" ? requested : `${requested.slice(0, -ext.length)}-${randomUUID().slice(0, 8)}${ext}`;
  const target = localFilePath(pathname);
  if (!target) return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({
    url: `${LOCAL_MEDIA_PREFIX}${pathname}`,
    pathname,
    contentType: file.type,
    size: file.size,
  });
}
