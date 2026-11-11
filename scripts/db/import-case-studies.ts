/**
 * Imports the prepared case studies as projects (published, or a draft where
 * noted), with their images,
 * videos, services, live links and credits:
 *   - scripts/content/portfolio → Brand (Mahmoud Hwary's work; his team
 *     profile is created hidden and credited on each project)
 *   - scripts/content/sites     → Sites & Systems (websites we built, with a live link)
 *   - scripts/content/systems/* → Sites & Systems (one folder per system, from the
 *     showcase prompt: project.json + capture.json + images/)
 *
 * Idempotent: projects and the team member that already exist (by slug) are
 * skipped. Files go to Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise to local storage (.data/uploads) for development.
 *
 *   pnpm db:import:case-studies
 */
import { put } from "@vercel/blob";
import ffmpegPath from "ffmpeg-static";
import { eq, inArray } from "drizzle-orm";
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
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
import { SITES } from "../content/sites/projects";
import type { CaseStudy, L } from "../content/types";
import { z } from "../../lib/zod";
import { scriptDb } from "./client";

const CONTENT = path.join(process.cwd(), "scripts", "content");
const LOCAL_DIR = path.join(process.cwd(), ".data", "uploads");
const LOCAL_PREFIX = "/api/media/local/";

type CaseStudySet = {
  dir: string;
  pillar: string;
  items: CaseStudy[];
  /** Credit Mahmoud Hwary on each project. */
  credit: boolean;
  /** Published right away (approved by the owner) or a draft to review first. */
  publish: boolean;
  coverAlt: (item: CaseStudy) => L;
};

const SETS: CaseStudySet[] = [
  {
    dir: "portfolio",
    pillar: "brand",
    items: PORTFOLIO,
    credit: true,
    publish: true,
    coverAlt: (item) => item.alt(0),
  },
  {
    dir: "sites",
    pillar: "sites-and-systems",
    items: SITES,
    credit: false,
    publish: true,
    coverAlt: (item) => ({ en: `${item.client.en} — home page`, ar: `${item.client.ar} — الصفحة الرئيسية` }),
  },
];

const localized = z.object({ en: z.string().trim().min(1), ar: z.string().trim().min(1) });
/** project.json written by the per-system showcase prompt (radix-case-study/). */
const systemSchema = z.object({
  key: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: localized,
  client: localized,
  year: z.number().int().nullable(),
  summary: localized,
  body: z.array(localized).min(1),
  applications: z.array(localized),
  services: z.array(z.string()),
  externalUrl: z.url().nullable().optional(),
  alt: z.array(localized),
});

/**
 * Systems dropped into scripts/content/systems/<slug>/ (each a copy of a
 * radix-case-study/ folder: project.json, capture.json, images/) → Sites & Systems.
 */
async function systemSets(): Promise<CaseStudySet[]> {
  const root = path.join(CONTENT, "systems");
  const folders = await readdir(root, { withFileTypes: true }).catch(() => []);
  const sets: CaseStudySet[] = [];
  for (const folder of folders.filter((f) => f.isDirectory())) {
    const file = path.join(root, folder.name, "project.json");
    const data = systemSchema.parse(JSON.parse(await readFile(file, "utf8")));
    sets.push({
      dir: `systems/${folder.name}`,
      pillar: "sites-and-systems",
      credit: false,
      // New systems arrive as drafts to review in the dashboard.
      publish: false,
      items: [
        {
          ...data,
          externalUrl: data.externalUrl ?? undefined,
          alt: (i) =>
            data.alt[i] ?? { en: `${data.title.en} — screen ${i + 1}`, ar: `${data.title.ar} — شاشة ${i + 1}` },
        },
      ],
      coverAlt: (item) => ({ en: `${item.title.en} — overview`, ar: `${item.title.ar} — نظرة عامة` }),
    });
  }
  return sets;
}

/** Tiptap document: paragraphs, then an optional bullet list. */
function doc(paragraphs: string[], list: string[] = []) {
  const p = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
  const content: unknown[] = paragraphs.map(p);
  if (list.length) {
    content.push({ type: "bulletList", content: list.map((text) => ({ type: "listItem", content: [p(text)] })) });
  }
  return { type: "doc" as const, content };
}

/** Width, height and duration of a video, read from ffmpeg's stream info. */
function videoInfo(file: string) {
  let out = "";
  try {
    execFileSync(ffmpegPath as unknown as string, ["-hide_banner", "-i", file], {
      stdio: ["ignore", "ignore", "pipe"],
    });
  } catch (error) {
    out = String((error as { stderr?: Buffer }).stderr ?? "");
  }
  const size = out.match(/, (\d{2,5})x(\d{2,5})[ ,]/);
  const time = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return {
    width: size ? Number(size[1]) : null,
    height: size ? Number(size[2]) : null,
    duration: time ? Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]) : null,
  };
}

async function main() {
  const { db, close } = scriptDb();
  const sets = [...SETS, ...(await systemSets())];
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  console.log(`Files → ${blob ? "Vercel Blob" : "local storage (.data/uploads)"}`);

  /** Stores one image or video and records it in the media library. */
  async function upload(dir: string, file: string, alt: L) {
    const source = path.join(CONTENT, dir, "images", file);
    const body = await readFile(source);
    const isVideo = file.endsWith(".mp4");
    const contentType = isVideo ? "video/mp4" : "image/webp";
    const info = isVideo ? videoInfo(source) : { ...(await sharp(body).metadata()), duration: null };
    const ext = path.extname(file);
    let stored = `media/${dir}/${path.basename(file, ext)}-${randomUUID().slice(0, 8)}${ext}`;
    let url: string;
    if (blob) {
      const result = await put(`media/${dir}/${file}`, body, { access: "public", contentType, addRandomSuffix: true });
      url = result.url;
      stored = result.pathname;
    } else {
      await mkdir(path.join(LOCAL_DIR, path.dirname(stored)), { recursive: true });
      await writeFile(path.join(LOCAL_DIR, stored), body);
      url = `${LOCAL_PREFIX}${stored}`;
    }
    const [row] = await db
      .insert(media)
      .values({
        kind: isVideo ? "video" : "image",
        url,
        pathname: stored,
        contentType,
        size: body.length,
        width: info.width ?? null,
        height: info.height ?? null,
        duration: info.duration,
        alt,
      })
      .returning({ id: media.id });
    return row.id;
  }

  const existing = new Set(
    (
      await db
        .select({ slug: projects.slug })
        .from(projects)
        .where(
          inArray(
            projects.slug,
            sets.flatMap((set) => set.items.map((p) => p.slug)),
          ),
        )
    ).map((r) => r.slug),
  );

  let member: { id: string } | undefined;
  let created = 0;
  for (const set of sets) {
    const pillar = await db.query.categories.findFirst({ where: eq(categories.slug, set.pillar) });
    if (!pillar) throw new Error(`The "${set.pillar}" pillar is missing. Run \`pnpm db:seed\` first.`);
    const pillarServices = await db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(eq(services.categoryId, pillar.id));
    const capture = JSON.parse(await readFile(path.join(CONTENT, set.dir, "capture.json"), "utf8")) as Record<
      string,
      string | string[]
    >;

    if (set.credit && !member) {
      member = await db.query.teamMembers.findFirst({ where: eq(teamMembers.slug, MAHMOUD.slug) });
      if (!member) {
        const photoId = await upload(set.dir, capture.portrait[0], MAHMOUD.photoAlt);
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
          .returning({ id: teamMembers.id });
        await db.insert(teamMemberCategories).values({ teamMemberId: member.id, categoryId: pillar.id });
        console.log(`Team member created (hidden): ${MAHMOUD.name.en}`);
      }
    }

    for (const [order, item] of set.items.entries()) {
      if (existing.has(item.slug)) {
        console.log(`Skipped (already exists): ${item.slug}`);
        continue;
      }
      const files = capture[item.key] as string[];
      const coverId = await upload(set.dir, capture[`${item.key}:cover`] as string, set.coverAlt(item));
      const galleryIds: string[] = [];
      for (const [i, file] of files.entries()) galleryIds.push(await upload(set.dir, file, item.alt(i)));

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
            externalUrl: item.externalUrl ?? null,
            status: set.publish ? "published" : "draft",
            publishedAt: set.publish ? new Date() : null,
            sortOrder: order,
            arNeedsReview: true,
          })
          .returning({ id: projects.id });
        await tx.insert(projectCategories).values({ projectId: project.id, categoryId: pillar.id, sortOrder: order });
        const serviceIds = pillarServices.filter((s) => item.services.includes(s.name.en)).map((s) => s.id);
        if (serviceIds.length) {
          await tx
            .insert(projectServices)
            .values(serviceIds.map((serviceId) => ({ projectId: project.id, serviceId })));
        }
        await tx
          .insert(projectMedia)
          .values(galleryIds.map((mediaId, i) => ({ projectId: project.id, mediaId, sortOrder: i })));
        if (set.credit && member) {
          await tx
            .insert(projectTeam)
            .values({ projectId: project.id, teamMemberId: member.id, role: MAHMOUD.creditRole });
        }
      });
      created += 1;
      console.log(
        `${set.publish ? "Published" : "Draft created"}: ${item.title.en} → ${set.pillar} (${files.length} files)`,
      );
    }
  }

  await close();
  console.log(`Done: ${created} case studies imported (existing ones skipped). Drafts wait in Dashboard → Projects.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
