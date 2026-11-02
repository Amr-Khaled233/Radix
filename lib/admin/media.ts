import "server-only";
import { desc, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, frameSequences, media, projectMedia, projects, settings, teamMembers } from "@/lib/db/schema";
import type { Localized } from "@/lib/db/localized";
import { heroSchema, seoSchema } from "@/lib/settings/schemas";

export type MediaUsage = {
  kind: "category" | "project" | "team" | "hero" | "seo";
  label: Localized | string;
  href: string;
};

export async function listMedia() {
  return db.select().from(media).orderBy(desc(media.createdAt));
}

/** Every place each media item is referenced; deleting is blocked while used. */
export async function mediaUsage(): Promise<Map<string, MediaUsage[]>> {
  const usage = new Map<string, MediaUsage[]>();
  const add = (id: string | null | undefined, entry: MediaUsage) => {
    if (!id) return;
    usage.set(id, [...(usage.get(id) ?? []), entry]);
  };

  const [cats, projs, gallery, members, frames, settingRows] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, og: categories.ogImageId })
      .from(categories)
      .where(isNotNull(categories.ogImageId)),
    db
      .select({ id: projects.id, title: projects.title, cover: projects.coverImageId, og: projects.ogImageId })
      .from(projects),
    db.select({ projectId: projectMedia.projectId, mediaId: projectMedia.mediaId }).from(projectMedia),
    db
      .select({ id: teamMembers.id, name: teamMembers.name, photo: teamMembers.photoId })
      .from(teamMembers)
      .where(isNotNull(teamMembers.photoId)),
    db.select({ source: frameSequences.sourceMediaId }).from(frameSequences),
    db
      .select()
      .from(settings)
      .where(inArray(settings.key, ["hero", "seo"])),
  ]);

  for (const c of cats) add(c.og, { kind: "category", label: c.name, href: `/admin/categories/${c.id}` });
  const titles = new Map(projs.map((p) => [p.id, p.title]));
  for (const p of projs) {
    add(p.cover, { kind: "project", label: p.title, href: `/admin/projects/${p.id}` });
    add(p.og, { kind: "project", label: p.title, href: `/admin/projects/${p.id}` });
  }
  for (const g of gallery)
    add(g.mediaId, { kind: "project", label: titles.get(g.projectId) ?? "", href: `/admin/projects/${g.projectId}` });
  for (const m of members) add(m.photo, { kind: "team", label: m.name, href: `/admin/team/${m.id}` });
  for (const f of frames) add(f.source, { kind: "hero", label: "Hero", href: "/admin/pages/hero" });

  for (const row of settingRows) {
    if (row.key === "seo") {
      const seo = seoSchema.safeParse(row.value);
      if (seo.success) add(seo.data.defaultOgImageId, { kind: "seo", label: "SEO", href: "/admin/settings" });
    }
    if (row.key === "hero") {
      const hero = heroSchema.safeParse(row.value);
      if (!hero.success) continue;
      for (const config of [hero.data.current, hero.data.previous]) {
        if (!config) continue;
        for (const id of Object.values(config.assets))
          add(id, { kind: "hero", label: "Hero", href: "/admin/pages/hero" });
      }
    }
  }
  // De-duplicate entries per media item.
  for (const [id, entries] of usage) {
    usage.set(
      id,
      entries.filter((e, i, all) => all.findIndex((x) => x.href === e.href && x.kind === e.kind) === i),
    );
  }
  return usage;
}

export async function mediaByIds(ids: (string | null | undefined)[]) {
  const wanted = ids.filter((id): id is string => Boolean(id));
  if (!wanted.length) return [];
  return db.select().from(media).where(inArray(media.id, wanted));
}
