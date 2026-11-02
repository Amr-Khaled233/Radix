"use server";

import { del } from "@vercel/blob";
import { unlink } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { ActionFailure, adminAction, refreshTags } from "@/lib/admin/action";
import { mediaUsage } from "@/lib/admin/media";
import { assertCan } from "@/lib/auth/permissions";
import { TAGS } from "@/lib/cache/tags";
import { db } from "@/lib/db/client";
import { localizedSchema } from "@/lib/db/localized";
import { media } from "@/lib/db/schema";
import { isOwnMediaUrl, kindOf, LOCAL_MEDIA_PREFIX, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/media/config";
import { localFilePath } from "@/lib/media/storage";

const registerSchema = z.object({
  url: z.string().refine(isOwnMediaUrl),
  pathname: z.string().min(1).max(512),
  contentType: z.string(),
  size: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
  alt: localizedSchema.default({ en: "", ar: "" }),
});

/** Records an uploaded file (after the browser finished uploading it). */
export async function registerMedia(input: z.input<typeof registerSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "create", "media");
    const data = registerSchema.parse(input);
    const kind = kindOf(data.contentType);
    if (!kind) throw new ActionFailure("validation");
    if (data.size > (kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES)) throw new ActionFailure("validation");
    const [row] = await db
      .insert(media)
      .values({ ...data, kind, uploadedBy: actor.id })
      .returning();
    await logAudit({
      actorId: actor.id,
      action: "media.upload",
      entityType: "media",
      entityId: row.id,
      summary: { pathname: data.pathname },
    });
    return row;
  });
}

export async function updateMediaAlt(id: string, alt: { en: string; ar: string }) {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "media");
    const parsed = localizedSchema.parse(alt);
    const [row] = await db
      .update(media)
      .set({ alt: parsed })
      .where(eq(media.id, z.uuid().parse(id)))
      .returning({ id: media.id });
    if (!row) throw new ActionFailure("notFound");
    await logAudit({ actorId: actor.id, action: "media.updateAlt", entityType: "media", entityId: id });
    // Alt text appears on public pages that show this image.
    refreshTags(TAGS.media, TAGS.projects, TAGS.team, TAGS.categories);
  });
}

/** Deletes a file only when nothing references it. */
export async function deleteMedia(id: string) {
  return adminAction(async (actor) => {
    assertCan(actor, "delete", "media");
    const row = await db.query.media.findFirst({ where: eq(media.id, z.uuid().parse(id)) });
    if (!row) throw new ActionFailure("notFound");
    if ((await mediaUsage()).get(row.id)?.length) throw new ActionFailure("inUse");

    await db.delete(media).where(eq(media.id, row.id));
    if (row.url.startsWith(LOCAL_MEDIA_PREFIX)) {
      const file = localFilePath(row.url.slice(LOCAL_MEDIA_PREFIX.length));
      if (file) await unlink(file).catch(() => {});
    } else if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(row.url).catch((error) => console.error("[media] blob delete failed", error));
    }
    await logAudit({
      actorId: actor.id,
      action: "media.delete",
      entityType: "media",
      entityId: row.id,
      summary: { pathname: row.pathname },
    });
  });
}

/** Library contents for the media picker dialog. */
export async function listMediaForPicker(kind: "image" | "video" | "any") {
  return adminAction(async (actor) => {
    assertCan(actor, "view", "media");
    const rows = await db.query.media.findMany({
      where: kind === "any" ? undefined : eq(media.kind, kind),
      orderBy: (m, { desc }) => [desc(m.createdAt)],
      limit: 500,
    });
    return rows;
  });
}
