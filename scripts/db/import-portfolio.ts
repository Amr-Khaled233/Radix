/**
 * Imports the portfolio case studies (scripts/content/portfolio) as DRAFT
 * projects under the Brand pillar, with their images, services and credits,
 * plus Mahmoud Hwary's team profile (hidden until you make it visible).
 *
 * Idempotent: projects and the team member that already exist (by slug) are
 * skipped. Images go to Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise to local storage (.data/uploads) for development.
 *
 *   pnpm db:import:portfolio
 */
import { put } from "@vercel/blob";
import { and, eq, inArray } from "drizzle-orm";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  categories,
  media,
  projectCategories,
  projectMedia,
  projects,
  projectServices,
  projectTeam,
  services,
  teamMemberCategories,
  teamMembers,
} from "../../lib/db/schema";
import { MAHMOUD, PORTFOLIO } from "../content/portfolio/projects";
import { scriptDb } from "./client";

type L = { en: string; ar: string };
const IMAGES = path.join(process.cwd(), "scripts", "content", "portfolio", "images");
const LOCAL_DIR = path.join(process.cwd(), ".data", "uploads");
const LOCAL_PREFIX = "/api/media/local/";

/** Tiptap document: paragraphs, then an optional bullet list. */
function doc(paragraphs: string[], list: string[] = []) {
  const p = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
  const content: unknown[] = paragraphs.map(p);
  if (list.length)
    content.push({ type: "bulletList", content: list.map((text) => ({ type: "listItem", content: [p(text)] })) });
  return { type: "doc" as const, content };
}

async function main() {
  const { db, close } = scriptDb();
  const capture = JSON.parse(await readFile(path.join(IMAGES, "..", "capture.json"), "utf8")) as Record<
    string,
    string | string[]
  >;
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  console.log(`Images → ${blob ? "Vercel Blob" : "local storage (.data/uploads)"}`);

  /** Stores one image and records it in the media library. */
  async function upload(file: string, alt: L) {
    const body = await readFile(path.join(IMAGES, file));
    const { width, height } = await sharp(body).metadata();
    const pathname = `media/portfolio/${file}`;
    let url: string;
    let stored = pathname;
    if (blob) {
      const result = await put(pathname, body, { access: "public", contentType: "image/webp", addRandomSuffix: true });
      url = result.url;
      stored = result.pathname;
    } else {
      stored = `media/portfolio/${path.parse(file).name}-${randomUUID().slice(0, 8)}.webp`;
      await mkdir(path.join(LOCAL_DIR, path.dirname(stored)), { recursive: true });
      await writeFile(path.join(LOCAL_DIR, stored), body);
      url = `${LOCAL_PREFIX}${stored}`;
    }
    const [row] = await db
      .insert(media)
      .values({
        kind: "image",
        url,
        pathname: stored,
        contentType: "image/webp",
        size: body.length,
        width,
        height,
        alt,
      })
      .returning({ id: media.id });
    return row.id;
  }

  const brand = await db.query.categories.findFirst({ where: eq(categories.slug, "brand") });
  if (!brand) throw new Error('The "brand" pillar is missing. Run `pnpm db:seed` first.');
  const brandServices = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.categoryId, brand.id));

  // Team member (hidden until reviewed).
  let member = await db.query.teamMembers.findFirst({ where: eq(teamMembers.slug, MAHMOUD.slug) });
  if (!member) {
    const photoId = await upload(capture.portrait[0], MAHMOUD.photoAlt);
    [member] = await db
      .insert(teamMembers)
      .values({
        slug: MAHMOUD.slug,
        name: MAHMOUD.name,
        role: MAHMOUD.role,
        shortBio: MAHMOUD.shortBio,
        bio: { en: doc(MAHMOUD.bio.map((b) => b.en)), ar: doc(MAHMOUD.bio.map((b) => b.ar)) },
        photoId,
        isVisible: false,
        arNeedsReview: true,
      })
      .returning();
    await db.insert(teamMemberCategories).values({ teamMemberId: member.id, categoryId: brand.id });
    console.log(`Team member created (hidden): ${MAHMOUD.name.en}`);
  }

  const existing = new Set(
    (
      await db
        .select({ slug: projects.slug })
        .from(projects)
        .where(
          inArray(
            projects.slug,
            PORTFOLIO.map((p) => p.slug),
          ),
        )
    ).map((r) => r.slug),
  );
  let created = 0;
  for (const [order, item] of PORTFOLIO.entries()) {
    if (existing.has(item.slug)) {
      console.log(`Skipped (already exists): ${item.slug}`);
      continue;
    }
    const files = capture[item.key] as string[];
    const coverId = await upload(capture[`${item.key}:cover`] as string, item.alt(0));
    const galleryIds: string[] = [];
    for (const [i, file] of files.entries()) galleryIds.push(await upload(file, item.alt(i)));

    await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          slug: item.slug,
          title: item.title,
          clientName: item.client,
          summary: item.summary,
          body: {
            en: doc(
              item.body.map((b) => b.en),
              item.applications.map((a) => a.en),
            ),
            ar: doc(
              item.body.map((b) => b.ar),
              item.applications.map((a) => a.ar),
            ),
          },
          coverImageId: coverId,
          year: item.year,
          status: "draft",
          sortOrder: order,
          arNeedsReview: true,
        })
        .returning({ id: projects.id });
      await tx.insert(projectCategories).values({ projectId: project.id, categoryId: brand.id, sortOrder: order });
      const serviceIds = brandServices.filter((s) => item.services.includes(s.name.en)).map((s) => s.id);
      if (serviceIds.length) {
        await tx.insert(projectServices).values(serviceIds.map((serviceId) => ({ projectId: project.id, serviceId })));
      }
      await tx
        .insert(projectMedia)
        .values(galleryIds.map((mediaId, i) => ({ projectId: project.id, mediaId, sortOrder: i })));
      await tx.insert(projectTeam).values({ projectId: project.id, teamMemberId: member.id, role: MAHMOUD.creditRole });
    });
    created += 1;
    console.log(`Draft created: ${item.title.en} (${files.length} images)`);
  }

  // Sanity check: every draft is linked to the Brand pillar.
  const linked = await db
    .select({ id: projectCategories.projectId })
    .from(projectCategories)
    .innerJoin(projects, eq(projects.id, projectCategories.projectId))
    .where(
      and(
        eq(projectCategories.categoryId, brand.id),
        inArray(
          projects.slug,
          PORTFOLIO.map((p) => p.slug),
        ),
      ),
    );
  await close();
  console.log(`Done: ${created} drafts created, ${linked.length} portfolio projects under Brand.`);
  console.log("Review them in Dashboard → Projects, then set each one to Published.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
