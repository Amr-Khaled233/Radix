"use server";

import { z } from "@/lib/zod";
import { logAudit } from "@/lib/audit";
import { ActionFailure, adminAction } from "@/lib/admin/action";
import { assertCan } from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import { frameSequences } from "@/lib/db/schema";
import { isOwnUploadUrl } from "@/lib/media/storage";
import { heroConfigSchema, type HeroConfig } from "@/lib/settings/schemas";
import { readSetting, writeSetting } from "@/lib/settings/store";

function assertPosters(config: HeroConfig) {
  if (config.enabled && config.mode !== "static" && (!config.assets.posterDesktop || !config.assets.posterMobile)) {
    throw new ActionFailure("validation");
  }
}

/** Publishes a hero configuration; the one it replaces is kept for one-click revert. */
export async function saveHero(input: z.input<typeof heroConfigSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "pages");
    const next = heroConfigSchema.parse(input);
    assertPosters(next);
    const stored = await readSetting("hero");
    await writeSetting(actor, "hero", { current: next, previous: stored.current, arNeedsReview: stored.arNeedsReview });
    return next;
  });
}

export async function revertHero() {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "pages");
    const stored = await readSetting("hero");
    if (!stored.previous) throw new ActionFailure("notFound");
    await writeSetting(actor, "hero", {
      current: stored.previous,
      previous: stored.current,
      arNeedsReview: stored.arNeedsReview,
    });
    await logAudit({ actorId: actor.id, action: "hero.revert", entityType: "settings", entityId: "hero" });
    return stored.previous;
  });
}

const sequenceSchema = z
  .object({
    sourceMediaId: z.uuid(),
    variant: z.enum(["desktop", "mobile"]),
    basePath: z.string().regex(/^hero\/frames\/[a-z0-9-]+\/$/),
    frameCount: z.number().int().min(2).max(1200),
    fps: z.number().int().min(12).max(30),
    width: z.number().int().min(320).max(1920),
    height: z.number().int().min(180).max(3840),
    baseUrl: z.string().max(2048),
  })
  // The URL prefix must be this site's own storage and point at the declared folder.
  .refine((d) => isOwnUploadUrl(d.baseUrl) && d.baseUrl.endsWith(d.basePath), { path: ["baseUrl"] });

/** Records a frame sequence after the browser uploaded all its frames. */
export async function registerFrameSequence(input: z.input<typeof sequenceSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "pages");
    const data = sequenceSchema.parse(input);
    const { baseUrl, ...row } = data;
    // basePath stores the public URL prefix so the site can address frames directly.
    const [created] = await db
      .insert(frameSequences)
      .values({ ...row, basePath: baseUrl, format: "webp", createdBy: actor.id })
      .returning();
    await logAudit({
      actorId: actor.id,
      action: "hero.frames",
      entityType: "frameSequence",
      entityId: created.id,
      summary: { frames: data.frameCount },
    });
    return created;
  });
}
