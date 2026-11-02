import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { draftMode } from "next/headers";
import { TAGS } from "@/lib/cache/tags";
import { db } from "@/lib/db/client";
import {
  categories,
  frameSequences,
  media,
  projectCategories,
  projectMedia,
  projectResults,
  projects,
  projectServices,
  projectTeam,
  services,
  teamMemberCategories,
  teamMembers,
} from "@/lib/db/schema";
import { SETTINGS_SCHEMAS, type SettingsKey, type SettingsValue } from "@/lib/settings/schemas";
import { settings } from "@/lib/db/schema";

/**
 * Public, cached reads. Every function is tagged with the same tags the
 * dashboard expires (lib/cache/tags.ts), so saved changes appear within
 * seconds in both locales. In draft mode caches are bypassed and drafts are
 * included.
 */

/** Without a database (local builds before Neon is connected) pages render empty states. */
const hasDb = () => Boolean(process.env.DATABASE_URL);

export type MediaRef = {
  id: string;
  kind: "image" | "video";
  url: string;
  width: number | null;
  height: number | null;
  alt: { en: string; ar: string };
  duration: number | null;
  size: number;
  contentType: string;
};

async function mediaMap(ids: (string | null | undefined)[]) {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!wanted.length) return new Map<string, MediaRef>();
  const rows = await db.select().from(media).where(inArray(media.id, wanted));
  return new Map(
    rows.map((m) => [
      m.id,
      {
        id: m.id,
        kind: m.kind,
        url: m.url,
        width: m.width,
        height: m.height,
        alt: m.alt,
        duration: m.duration,
        size: m.size,
        contentType: m.contentType,
      } satisfies MediaRef,
    ]),
  );
}

export async function getSetting<K extends SettingsKey>(key: K): Promise<SettingsValue<K>> {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.settings(key));
  const schema = SETTINGS_SCHEMAS[key];
  if (!hasDb()) return schema.safeParse({}).data as SettingsValue<K>;
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  const parsed = schema.safeParse(row?.value ?? {});
  return (parsed.success ? parsed.data : schema.safeParse({}).data) as SettingsValue<K>;
}

export async function getMedia(ids: (string | null | undefined)[]) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.media);
  if (!hasDb()) return {} as Record<string, MediaRef>;
  return Object.fromEntries(await mediaMap(ids));
}

export async function getVisibleCategories() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.categories);
  if (!hasDb()) return [];
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      tagline: categories.tagline,
      iconKey: categories.iconKey,
      showInNav: categories.showInNav,
      showOnHome: categories.showOnHome,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .where(eq(categories.isVisible, true))
    .orderBy(asc(categories.sortOrder));
}

export type PublicCategory = Awaited<ReturnType<typeof getVisibleCategories>>[number];

/** Category page: details, visible services and published projects (featured first, then admin order). */
export async function getCategoryPage(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.categories, TAGS.category(slug), TAGS.projects, TAGS.media);
  if (!hasDb()) return null;
  const { isEnabled: draft } = await draftMode();
  const category = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  if (!category || (!category.isVisible && !draft)) return null;

  const visibleCats = await db
    .select({ id: categories.id, sortOrder: categories.sortOrder })
    .from(categories)
    .where(eq(categories.isVisible, true))
    .orderBy(asc(categories.sortOrder));
  const index =
    Math.max(
      0,
      visibleCats.findIndex((c) => c.id === category.id),
    ) + 1;

  const [serviceRows, projectRows] = await Promise.all([
    db
      .select({ id: services.id, name: services.name, description: services.description })
      .from(services)
      .where(and(eq(services.categoryId, category.id), eq(services.isVisible, true)))
      .orderBy(asc(services.sortOrder)),
    db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        clientName: projects.clientName,
        summary: projects.summary,
        year: projects.year,
        coverImageId: projects.coverImageId,
        status: projects.status,
        featured: projectCategories.isFeaturedInCategory,
        order: projectCategories.sortOrder,
      })
      .from(projectCategories)
      .innerJoin(projects, eq(projects.id, projectCategories.projectId))
      .where(eq(projectCategories.categoryId, category.id))
      .orderBy(desc(projectCategories.isFeaturedInCategory), asc(projectCategories.sortOrder)),
  ]);
  const shown = projectRows.filter((p) => p.status === "published" || (draft && p.status === "draft"));
  const covers = await mediaMap([category.ogImageId, ...shown.map((p) => p.coverImageId)]);
  return {
    category: { ...category, index },
    services: serviceRows,
    projects: shown.map((p) => ({ ...p, cover: p.coverImageId ? (covers.get(p.coverImageId) ?? null) : null })),
    ogImage: category.ogImageId ? (covers.get(category.ogImageId) ?? null) : null,
  };
}

/** Published projects for the Work index and home page. */
export async function getPublishedProjects() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.projects, TAGS.media, TAGS.categories);
  if (!hasDb()) return [];
  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      clientName: projects.clientName,
      summary: projects.summary,
      year: projects.year,
      isFeatured: projects.isFeatured,
      coverImageId: projects.coverImageId,
      publishedAt: projects.publishedAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.status, "published"))
    .orderBy(asc(projects.sortOrder), desc(projects.publishedAt));
  if (!rows.length) return [];
  const links = await db
    .select({ projectId: projectCategories.projectId, categoryId: projectCategories.categoryId })
    .from(projectCategories)
    .innerJoin(categories, eq(categories.id, projectCategories.categoryId))
    .where(
      and(
        inArray(
          projectCategories.projectId,
          rows.map((r) => r.id),
        ),
        eq(categories.isVisible, true),
      ),
    );
  const covers = await mediaMap(rows.map((r) => r.coverImageId));
  return rows.map((row) => ({
    ...row,
    cover: row.coverImageId ? (covers.get(row.coverImageId) ?? null) : null,
    categoryIds: links.filter((l) => l.projectId === row.id).map((l) => l.categoryId),
  }));
}

export type PublicProjectCard = Awaited<ReturnType<typeof getPublishedProjects>>[number];

/** Full case study (drafts visible in draft mode). */
export async function getProjectPage(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.projects, TAGS.project(slug), TAGS.media, TAGS.team, TAGS.categories);
  if (!hasDb()) return null;
  const { isEnabled: draft } = await draftMode();
  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug) });
  if (!project || (project.status !== "published" && !(draft && project.status === "draft"))) return null;

  const [cats, svc, gallery, results, credits, published] = await Promise.all([
    db
      .select({ id: categories.id, slug: categories.slug, name: categories.name })
      .from(projectCategories)
      .innerJoin(categories, eq(categories.id, projectCategories.categoryId))
      .where(and(eq(projectCategories.projectId, project.id), eq(categories.isVisible, true)))
      .orderBy(asc(categories.sortOrder)),
    db
      .select({ id: services.id, name: services.name })
      .from(projectServices)
      .innerJoin(services, eq(services.id, projectServices.serviceId))
      .where(and(eq(projectServices.projectId, project.id), eq(services.isVisible, true)))
      .orderBy(asc(services.sortOrder)),
    db.select().from(projectMedia).where(eq(projectMedia.projectId, project.id)).orderBy(asc(projectMedia.sortOrder)),
    db
      .select()
      .from(projectResults)
      .where(eq(projectResults.projectId, project.id))
      .orderBy(asc(projectResults.sortOrder)),
    db
      .select({
        slug: teamMembers.slug,
        name: teamMembers.name,
        role: projectTeam.role,
        visible: teamMembers.isVisible,
      })
      .from(projectTeam)
      .innerJoin(teamMembers, eq(teamMembers.id, projectTeam.teamMemberId))
      .where(eq(projectTeam.projectId, project.id))
      .orderBy(asc(projectTeam.sortOrder)),
    db
      .select({ slug: projects.slug, title: projects.title })
      .from(projects)
      .where(eq(projects.status, "published"))
      .orderBy(asc(projects.sortOrder), desc(projects.publishedAt)),
  ]);
  const files = await mediaMap([project.coverImageId, project.ogImageId, ...gallery.map((g) => g.mediaId)]);
  const position = published.findIndex((p) => p.slug === project.slug);
  const next = published.length > 1 ? published[(position + 1) % published.length] : null;

  return {
    project,
    cover: project.coverImageId ? (files.get(project.coverImageId) ?? null) : null,
    ogImage: project.ogImageId ? (files.get(project.ogImageId) ?? null) : null,
    categories: cats,
    services: svc,
    gallery: gallery.map((g) => ({ caption: g.caption, media: files.get(g.mediaId) ?? null })).filter((g) => g.media),
    results: results.map((r) => ({ value: r.value, label: r.label })),
    credits: credits.map((c) => ({ ...c, slug: c.visible ? c.slug : null })),
    next: next && next.slug !== project.slug ? next : null,
    isDraft: project.status !== "published",
  };
}

export async function getVisibleTeam() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.team, TAGS.media);
  if (!hasDb()) return [];
  const rows = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.isVisible, true))
    .orderBy(asc(teamMembers.sortOrder));
  const photos = await mediaMap(rows.map((r) => r.photoId));
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role,
    shortBio: row.shortBio,
    showOnHome: row.showOnHome,
    photo: row.photoId ? (photos.get(row.photoId) ?? null) : null,
  }));
}

export type PublicTeamCard = Awaited<ReturnType<typeof getVisibleTeam>>[number];

export async function getTeamMemberPage(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.team, TAGS.teamMember(slug), TAGS.projects, TAGS.media, TAGS.categories);
  if (!hasDb()) return null;
  const { isEnabled: draft } = await draftMode();
  const member = await db.query.teamMembers.findFirst({ where: eq(teamMembers.slug, slug) });
  if (!member || (!member.isVisible && !draft)) return null;
  const [expertise, work, photos] = await Promise.all([
    db
      .select({ slug: categories.slug, name: categories.name })
      .from(teamMemberCategories)
      .innerJoin(categories, eq(categories.id, teamMemberCategories.categoryId))
      .where(and(eq(teamMemberCategories.teamMemberId, member.id), eq(categories.isVisible, true)))
      .orderBy(asc(categories.sortOrder)),
    db
      .select({ slug: projects.slug, title: projects.title, role: projectTeam.role, year: projects.year })
      .from(projectTeam)
      .innerJoin(projects, eq(projects.id, projectTeam.projectId))
      .where(and(eq(projectTeam.teamMemberId, member.id), eq(projects.status, "published")))
      .orderBy(asc(projects.sortOrder)),
    mediaMap([member.photoId]),
  ]);
  return {
    member: { ...member, email: member.showEmail ? member.email : null },
    photo: member.photoId ? (photos.get(member.photoId) ?? null) : null,
    expertise,
    work,
  };
}

/** Hero animation config with resolved assets and frame sequences. */
export async function getHero() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.settings("hero"), TAGS.media);
  const hero = (await getSetting("hero")).current;
  if (!hasDb()) return { config: hero, media: {} as Record<string, MediaRef>, frames: {} as Record<string, FrameRef> };
  const ids = [hero.frames.desktop, hero.frames.mobile].filter((id): id is string => Boolean(id));
  const [files, seqRows] = await Promise.all([
    mediaMap(Object.values(hero.assets)),
    ids.length ? db.select().from(frameSequences).where(inArray(frameSequences.id, ids)) : Promise.resolve([]),
  ]);
  return {
    config: hero,
    media: Object.fromEntries(files),
    frames: Object.fromEntries(
      seqRows.map((s) => [
        s.id,
        { baseUrl: s.basePath, frameCount: s.frameCount, width: s.width, height: s.height, fps: s.fps },
      ]),
    ) as Record<string, FrameRef>,
  };
}

export type FrameRef = { baseUrl: string; frameCount: number; width: number; height: number; fps: number };

/** Slugs for generateStaticParams (a placeholder keeps Cache Components builds valid when empty). */
export async function getPublicSlugs() {
  "use cache";
  cacheLife("max");
  cacheTag(TAGS.categories, TAGS.projects, TAGS.team);
  if (!hasDb()) return { categories: [], projects: [], team: [] };
  const [c, p, t] = await Promise.all([
    db
      .select({ slug: categories.slug, updatedAt: categories.updatedAt })
      .from(categories)
      .where(eq(categories.isVisible, true)),
    db
      .select({ slug: projects.slug, updatedAt: projects.updatedAt })
      .from(projects)
      .where(eq(projects.status, "published")),
    db
      .select({ slug: teamMembers.slug, updatedAt: teamMembers.updatedAt })
      .from(teamMembers)
      .where(eq(teamMembers.isVisible, true)),
  ]);
  return { categories: c, projects: p, team: t };
}

export const PLACEHOLDER_SLUG = "__none__";
