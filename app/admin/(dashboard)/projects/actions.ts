"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { z } from "@/lib/zod";
import { logAudit } from "@/lib/audit";
import { ActionFailure, adminAction, refreshTags } from "@/lib/admin/action";
import { projectFormSchema, PROJECT_STATUSES, requiredEn } from "@/lib/admin/schemas";
import { assertCan, can, type Actor } from "@/lib/auth/permissions";
import { TAGS } from "@/lib/cache/tags";
import { db } from "@/lib/db/client";
import {
  categories,
  media,
  projectCategories,
  projectMedia,
  projectResults,
  projects,
  projectServices,
  projectTeam,
} from "@/lib/db/schema";
import { slugSchema } from "@/lib/slug";

const id = z.uuid();

async function findProject(projectId: string) {
  const row = await db.query.projects.findFirst({ where: eq(projects.id, id.parse(projectId)) });
  if (!row) throw new ActionFailure("notFound");
  return row;
}

async function refreshProject(...slugs: string[]) {
  const cats = await db.select({ slug: categories.slug }).from(categories);
  refreshTags(TAGS.projects, TAGS.categories, ...slugs.map(TAGS.project), ...cats.map((c) => TAGS.category(c.slug)));
}

/** Editors may only change drafts; publishing-level fields stay with admins. */
function assertCanEditProject(actor: Actor, status: (typeof PROJECT_STATUSES)[number]) {
  assertCan(actor, "edit", "projects");
  if (status !== "draft" && !can(actor, "publish", "projects")) throw new ActionFailure("forbidden");
}

const createSchema = z.object({ slug: slugSchema, title: requiredEn });

export async function createProject(input: z.input<typeof createSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "create", "projects");
    const data = createSchema.parse(input);
    const [{ value: last }] = await db.select({ value: max(projects.sortOrder) }).from(projects);
    const [row] = await db
      .insert(projects)
      .values({
        slug: data.slug,
        title: data.title,
        status: "draft",
        sortOrder: (last ?? -1) + 1,
        createdBy: actor.id,
        updatedBy: actor.id,
      })
      .returning({ id: projects.id });
    await logAudit({
      actorId: actor.id,
      action: "project.create",
      entityType: "project",
      entityId: row.id,
      summary: { slug: data.slug },
    });
    return { id: row.id };
  });
}

export async function updateProject(projectId: string, input: z.input<typeof projectFormSchema>) {
  return adminAction(async (actor) => {
    const current = await findProject(projectId);
    assertCanEditProject(actor, current.status);
    const data = projectFormSchema.parse(input);
    const mayPublish = can(actor, "publish", "projects");

    // Gallery images must carry alt text in both languages.
    if (data.gallery.length) {
      const rows = await db
        .select({ id: media.id, alt: media.alt, kind: media.kind })
        .from(media)
        .where(
          inArray(
            media.id,
            data.gallery.map((g) => g.mediaId),
          ),
        );
      if (rows.some((m) => m.kind === "image" && (!m.alt.en.trim() || !m.alt.ar.trim()))) {
        throw new ActionFailure("validation");
      }
    }

    const status = mayPublish ? data.status : current.status;
    const publishedAt =
      status === "published"
        ? data.publishedAt
          ? new Date(data.publishedAt)
          : (current.publishedAt ?? new Date())
        : data.publishedAt
          ? new Date(data.publishedAt)
          : current.publishedAt;

    await db.transaction(async (tx) => {
      await tx
        .update(projects)
        .set({
          slug: data.slug,
          title: data.title,
          clientName: data.clientName,
          summary: data.summary,
          body: data.body,
          coverImageId: data.coverImageId,
          year: data.year,
          externalUrl: data.externalUrl || null,
          status,
          isFeatured: mayPublish ? data.isFeatured : current.isFeatured,
          publishedAt,
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          ogImageId: data.ogImageId,
          arNeedsReview: !data.arReviewed,
          updatedBy: actor.id,
        })
        .where(eq(projects.id, current.id));

      // Categories: keep per-category ordering/featured flags for existing rows.
      const existing = await tx.select().from(projectCategories).where(eq(projectCategories.projectId, current.id));
      const keep = new Set(data.categoryIds);
      const removed = existing.filter((row) => !keep.has(row.categoryId)).map((row) => row.categoryId);
      if (removed.length) {
        await tx
          .delete(projectCategories)
          .where(and(eq(projectCategories.projectId, current.id), inArray(projectCategories.categoryId, removed)));
      }
      const have = new Set(existing.map((row) => row.categoryId));
      const added = data.categoryIds.filter((categoryId) => !have.has(categoryId));
      if (added.length) {
        await tx
          .insert(projectCategories)
          .values(added.map((categoryId) => ({ projectId: current.id, categoryId, sortOrder: 999 })));
      }

      await tx.delete(projectServices).where(eq(projectServices.projectId, current.id));
      if (data.serviceIds.length) {
        await tx
          .insert(projectServices)
          .values(data.serviceIds.map((serviceId) => ({ projectId: current.id, serviceId })));
      }

      await tx.delete(projectMedia).where(eq(projectMedia.projectId, current.id));
      if (data.gallery.length) {
        await tx.insert(projectMedia).values(
          data.gallery.map((item, index) => ({
            projectId: current.id,
            mediaId: item.mediaId,
            caption: item.caption,
            sortOrder: index,
          })),
        );
      }

      await tx.delete(projectResults).where(eq(projectResults.projectId, current.id));
      if (data.results.length) {
        await tx.insert(projectResults).values(
          data.results.map((result, index) => ({
            projectId: current.id,
            value: result.value,
            label: result.label,
            sortOrder: index,
          })),
        );
      }

      await tx.delete(projectTeam).where(eq(projectTeam.projectId, current.id));
      const uniqueTeam = data.team.filter((m, i, all) => all.findIndex((x) => x.teamMemberId === m.teamMemberId) === i);
      if (uniqueTeam.length) {
        await tx.insert(projectTeam).values(
          uniqueTeam.map((member, index) => ({
            projectId: current.id,
            teamMemberId: member.teamMemberId,
            role: member.role,
            sortOrder: index,
          })),
        );
      }
    });

    await logAudit({
      actorId: actor.id,
      action: "project.update",
      entityType: "project",
      entityId: current.id,
      summary: { slug: data.slug, status },
    });
    await refreshProject(current.slug, data.slug);
  });
}

export async function setProjectStatus(projectId: string, status: (typeof PROJECT_STATUSES)[number]) {
  return adminAction(async (actor) => {
    assertCan(actor, "publish", "projects");
    const current = await findProject(projectId);
    const next = z.enum(PROJECT_STATUSES).parse(status);
    await db
      .update(projects)
      .set({
        status: next,
        publishedAt: next === "published" ? (current.publishedAt ?? new Date()) : current.publishedAt,
        updatedBy: actor.id,
      })
      .where(eq(projects.id, current.id));
    await logAudit({ actorId: actor.id, action: `project.${next}`, entityType: "project", entityId: current.id });
    await refreshProject(current.slug);
  });
}

export async function setProjectFeatured(projectId: string, featured: boolean) {
  return adminAction(async (actor) => {
    assertCan(actor, "publish", "projects");
    const current = await findProject(projectId);
    await db
      .update(projects)
      .set({ isFeatured: z.boolean().parse(featured), updatedBy: actor.id })
      .where(eq(projects.id, current.id));
    await refreshProject(current.slug);
  });
}

/** Copies a project (content, categories, services, gallery, results, credits) as a new draft. */
export async function duplicateProject(projectId: string) {
  return adminAction(async (actor) => {
    assertCan(actor, "create", "projects");
    const source = await findProject(projectId);
    let slug = `${source.slug}-copy`;
    for (let n = 2; await db.query.projects.findFirst({ where: eq(projects.slug, slug) }); n++)
      slug = `${source.slug}-copy-${n}`;

    const newId = await db.transaction(async (tx) => {
      const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, ...rest } = source;
      const [row] = await tx
        .insert(projects)
        .values({
          ...rest,
          slug,
          title: { en: `${source.title.en} (copy)`, ar: source.title.ar ? `${source.title.ar} (نسخة)` : "" },
          status: "draft",
          isFeatured: false,
          createdBy: actor.id,
          updatedBy: actor.id,
        })
        .returning({ id: projects.id });
      const copy = async <T extends { projectId: string }>(rows: T[], insert: (values: T[]) => Promise<unknown>) =>
        rows.length ? insert(rows.map((r) => ({ ...r, projectId: row.id }))) : undefined;
      await copy(await tx.select().from(projectCategories).where(eq(projectCategories.projectId, source.id)), (v) =>
        tx.insert(projectCategories).values(v),
      );
      await copy(await tx.select().from(projectServices).where(eq(projectServices.projectId, source.id)), (v) =>
        tx.insert(projectServices).values(v),
      );
      await copy(
        (await tx.select().from(projectMedia).where(eq(projectMedia.projectId, source.id))).map(
          ({ id: _m, ...r }) => r,
        ),
        (v) => tx.insert(projectMedia).values(v),
      );
      await copy(
        (await tx.select().from(projectResults).where(eq(projectResults.projectId, source.id))).map(
          ({ id: _r, ...r }) => r,
        ),
        (v) => tx.insert(projectResults).values(v),
      );
      await copy(await tx.select().from(projectTeam).where(eq(projectTeam.projectId, source.id)), (v) =>
        tx.insert(projectTeam).values(v),
      );
      return row.id;
    });
    await logAudit({
      actorId: actor.id,
      action: "project.duplicate",
      entityType: "project",
      entityId: newId,
      summary: { from: source.id },
    });
    return { id: newId };
  });
}

/** Permanent delete — only for archived projects (archive first). */
export async function deleteProject(projectId: string) {
  return adminAction(async (actor) => {
    assertCan(actor, "delete", "projects");
    const current = await findProject(projectId);
    if (current.status !== "archived") throw new ActionFailure("forbidden");
    await db.delete(projects).where(eq(projects.id, current.id));
    await logAudit({
      actorId: actor.id,
      action: "project.delete",
      entityType: "project",
      entityId: current.id,
      summary: { slug: current.slug },
    });
    await refreshProject(current.slug);
  });
}
