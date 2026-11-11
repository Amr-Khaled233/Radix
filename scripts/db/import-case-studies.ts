/**
 * Imports the prepared case studies as projects, with their images, videos,
 * captions, services, live links and credits:
 *   - scripts/content/portfolio → Brand (Mahmoud Hwary's work; his team
 *     profile is created hidden and credited on each project)
 *   - scripts/content/sites     → Sites & Systems (websites we built, with a live link)
 *   - scripts/content/systems/* → Sites & Systems ┐ one folder per project
 *   - scripts/content/growth/*  → Growth          ┘ (project.json + capture.json + images/)
 *
 * Runs in every Vercel build (vercel.json). New projects are created; a project
 * that was imported before is refreshed when its files changed, unless someone
 * has edited it in the dashboard (then it is left alone). Files go to Vercel Blob
 * when BLOB_READ_WRITE_TOKEN is set, otherwise to local storage (.data/uploads).
 *
 *   pnpm db:import:case-studies
 */
import { del, put } from "@vercel/blob";
import ffmpegPath from "ffmpeg-static";
import { and, eq, inArray, like, or } from "drizzle-orm";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
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
  settings,
  teamMemberCategories,
  teamMembers,
} from "../../lib/db/schema";
import { z } from "../../lib/zod";
import { MAHMOUD, PORTFOLIO } from "../content/portfolio/projects";
import { SITES } from "../content/sites/projects";
import type { CaseStudy, L } from "../content/types";
import { scriptDb } from "./client";

const CONTENT = path.join(process.cwd(), "scripts", "content");
const LOCAL_DIR = path.join(process.cwd(), ".data", "uploads");
const LOCAL_PREFIX = "/api/media/local/";
/** settings row holding a content hash per imported slug (to notice changed files). */
const STATE_KEY = "case-study-imports";
const EMPTY: L = { en: "", ar: "" };

type CaseStudySet = {
  dir: string;
  pillar: string;
  items: CaseStudy[];
  /** Credit Mahmoud Hwary on each project. */
  credit: boolean;
  /** New projects are published right away (approved by the owner) or created as drafts. */
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
/** project.json written by the showcase prompts (a radix-case-study/ folder). */
const folderSchema = z.object({
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
  /** Visible captions per gallery file; or reuse the alt text with captionsFromAlt. */
  captions: z.array(localized).optional(),
  captionsFromAlt: z.boolean().optional(),
  /** Publish on import (owner-approved) instead of creating a draft. */
  publish: z.boolean().optional(),
  pillar: z.enum(["brand", "digital", "sites-and-systems", "growth"]).optional(),
});

/** "Sinemai AI — scene breakdown" → "Scene breakdown" (the page already names the project). */
function withoutName(text: L): L {
  const strip = (s: string) => {
    const rest = s.includes(" — ") ? s.slice(s.indexOf(" — ") + 3) : s;
    return rest.charAt(0).toLocaleUpperCase() + rest.slice(1);
  };
  return { en: strip(text.en), ar: text.ar.includes(" — ") ? text.ar.slice(text.ar.indexOf(" — ") + 3) : text.ar };
}

/** One set per folder under scripts/content/{systems,growth}/. */
async function folderSets(): Promise<CaseStudySet[]> {
  const sets: CaseStudySet[] = [];
  for (const [group, defaultPillar] of [
    ["systems", "sites-and-systems"],
    ["growth", "growth"],
  ] as const) {
    const root = path.join(CONTENT, group);
    const folders = await readdir(root, { withFileTypes: true }).catch(() => []);
    for (const folder of folders.filter((f) => f.isDirectory())) {
      const data = folderSchema.parse(JSON.parse(await readFile(path.join(root, folder.name, "project.json"), "utf8")));
      const fallbackAlt = (i: number) => ({ en: `${data.title.en} — ${i + 1}`, ar: `${data.title.ar} — ${i + 1}` });
      sets.push({
        dir: `${group}/${folder.name}`,
        pillar: data.pillar ?? defaultPillar,
        credit: false,
        publish: data.publish ?? false,
        items: [
          {
            ...data,
            externalUrl: data.externalUrl ?? undefined,
            alt: (i) => data.alt[i] ?? fallbackAlt(i),
            caption: (i) =>
              data.captions?.[i] ?? (data.captionsFromAlt && data.alt[i] ? withoutName(data.alt[i]) : undefined),
          },
        ],
        coverAlt: (item) => ({ en: `${item.title.en} — overview`, ar: `${item.title.ar} — نظرة عامة` }),
      });
    }
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

/** Everything that ends up in the project, so a changed file or text triggers a refresh. */
async function contentHash(set: CaseStudySet, item: CaseStudy, cover: string, files: string[]) {
  const hash = createHash("sha256");
  hash.update(
    JSON.stringify({
      pillar: set.pillar,
      title: item.title,
      client: item.client,
      year: item.year,
      summary: item.summary,
      body: item.body,
      applications: item.applications,
      services: item.services,
      externalUrl: item.externalUrl ?? null,
      coverAlt: set.coverAlt(item),
      files: files.map((file, i) => ({ file, alt: item.alt(i), caption: item.caption?.(i) ?? null })),
    }),
  );
  for (const file of [cover, ...files]) hash.update(await readFile(path.join(CONTENT, set.dir, "images", file)));
  return hash.digest("hex");
}

async function main() {
  const { db, close } = scriptDb();
  const sets = [...SETS, ...(await folderSets())];
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  console.log(`Files → ${blob ? "Vercel Blob" : "local storage (.data/uploads)"}`);

  const stateRow = await db.query.settings.findFirst({ where: eq(settings.key, STATE_KEY) });
  const state = { ...((stateRow?.value as Record<string, string> | undefined) ?? {}) };

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

  /** Removes imported files of a set that nothing references any more (library rows and stored files). */
  async function removeUnused(dir: string, ids: string[]) {
    if (!ids.length) return;
    const [usedAsCover, usedInGallery] = await Promise.all([
      db
        .select({ id: projects.coverImageId })
        .from(projects)
        .where(or(inArray(projects.coverImageId, ids), inArray(projects.ogImageId, ids))),
      db.select({ id: projectMedia.mediaId }).from(projectMedia).where(inArray(projectMedia.mediaId, ids)),
    ]);
    const used = new Set([...usedAsCover, ...usedInGallery].map((r) => r.id));
    const rows = await db
      .select({ id: media.id, url: media.url, pathname: media.pathname })
      .from(media)
      .where(and(inArray(media.id, ids), like(media.pathname, `media/${dir}/%`)));
    for (const row of rows.filter((r) => !used.has(r.id))) {
      await db.delete(media).where(eq(media.id, row.id));
      if (row.url.startsWith(LOCAL_PREFIX)) await unlink(path.join(LOCAL_DIR, row.pathname)).catch(() => {});
      else if (blob) await del(row.url).catch(() => {});
    }
  }

  let member: { id: string } | undefined;
  const counts = { created: 0, refreshed: 0, unchanged: 0, edited: 0 };
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
      const files = capture[item.key] as string[];
      const cover = capture[`${item.key}:cover`] as string;
      const hash = await contentHash(set, item, cover, files);
      const current = await db.query.projects.findFirst({ where: eq(projects.slug, item.slug) });

      if (current && state[item.slug] === hash) {
        counts.unchanged += 1;
        continue;
      }
      if (current?.updatedBy) {
        // Someone changed it in the dashboard: their version wins.
        console.log(`Left as edited in the dashboard: ${item.slug}`);
        state[item.slug] = hash;
        counts.edited += 1;
        continue;
      }

      const coverId = await upload(set.dir, cover, set.coverAlt(item));
      const galleryIds: string[] = [];
      for (const [i, file] of files.entries()) galleryIds.push(await upload(set.dir, file, item.alt(i)));
      const fields = {
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
        arNeedsReview: true,
      };
      const serviceIds = pillarServices.filter((s) => item.services.includes(s.name.en)).map((s) => s.id);
      const galleryRows = (projectId: string) =>
        galleryIds.map((mediaId, i) => ({ projectId, mediaId, sortOrder: i, caption: item.caption?.(i) ?? EMPTY }));

      if (current) {
        // Imported earlier and never edited: refresh content and files; keep its status and place.
        const oldGallery = await db
          .select({ id: projectMedia.mediaId })
          .from(projectMedia)
          .where(eq(projectMedia.projectId, current.id));
        await db.transaction(async (tx) => {
          await tx.update(projects).set(fields).where(eq(projects.id, current.id));
          await tx.delete(projectServices).where(eq(projectServices.projectId, current.id));
          if (serviceIds.length) {
            await tx
              .insert(projectServices)
              .values(serviceIds.map((serviceId) => ({ projectId: current.id, serviceId })));
          }
          await tx.delete(projectMedia).where(eq(projectMedia.projectId, current.id));
          await tx.insert(projectMedia).values(galleryRows(current.id));
        });
        await removeUnused(set.dir, [current.coverImageId, ...oldGallery.map((g) => g.id)].filter(Boolean) as string[]);
        counts.refreshed += 1;
        console.log(`Refreshed: ${item.title.en} (${files.length} files)`);
      } else {
        await db.transaction(async (tx) => {
          const [project] = await tx
            .insert(projects)
            .values({
              slug: item.slug,
              ...fields,
              status: set.publish ? "published" : "draft",
              publishedAt: set.publish ? new Date() : null,
              sortOrder: order,
            })
            .returning({ id: projects.id });
          await tx.insert(projectCategories).values({ projectId: project.id, categoryId: pillar.id, sortOrder: order });
          if (serviceIds.length) {
            await tx
              .insert(projectServices)
              .values(serviceIds.map((serviceId) => ({ projectId: project.id, serviceId })));
          }
          await tx.insert(projectMedia).values(galleryRows(project.id));
          if (set.credit && member) {
            await tx
              .insert(projectTeam)
              .values({ projectId: project.id, teamMemberId: member.id, role: MAHMOUD.creditRole });
          }
        });
        counts.created += 1;
        console.log(
          `${set.publish ? "Published" : "Draft created"}: ${item.title.en} → ${set.pillar} (${files.length} files)`,
        );
      }
      state[item.slug] = hash;
    }
  }

  await db
    .insert(settings)
    .values({ key: STATE_KEY, value: state })
    .onConflictDoUpdate({ target: settings.key, set: { value: state } });
  await close();
  console.log(
    `Done: ${counts.created} created, ${counts.refreshed} refreshed, ${counts.unchanged} unchanged, ${counts.edited} kept as edited.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
