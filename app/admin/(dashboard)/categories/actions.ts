"use server";

import { and, eq, max } from "drizzle-orm";
import { z } from "@/lib/zod";
import { logAudit } from "@/lib/audit";
import { ActionFailure, adminAction, refreshTags } from "@/lib/admin/action";
import { categoryCreateSchema, categoryFormSchema, serviceFormSchema } from "@/lib/admin/schemas";
import { assertCan, can } from "@/lib/auth/permissions";
import { TAGS } from "@/lib/cache/tags";
import { db } from "@/lib/db/client";
import { categories, projectCategories, projects, services } from "@/lib/db/schema";

const id = z.uuid();

async function findCategory(categoryId: string) {
  const row = await db.query.categories.findFirst({ where: eq(categories.id, id.parse(categoryId)) });
  if (!row) throw new ActionFailure("notFound");
  return row;
}

function refreshCategory(...slugs: string[]) {
  refreshTags(TAGS.categories, TAGS.projects, ...slugs.map(TAGS.category));
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategory(input: z.input<typeof categoryCreateSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "create", "categories");
    const data = categoryCreateSchema.parse(input);
    const [{ value: last }] = await db.select({ value: max(categories.sortOrder) }).from(categories);
    const [row] = await db
      .insert(categories)
      .values({
        slug: data.slug,
        name: data.name,
        iconKey: "brand",
        sortOrder: (last ?? -1) + 1,
        isVisible: false, // new categories start hidden until they're ready
        createdBy: actor.id,
        updatedBy: actor.id,
      })
      .returning({ id: categories.id });
    await logAudit({
      actorId: actor.id,
      action: "category.create",
      entityType: "category",
      entityId: row.id,
      summary: { slug: data.slug },
    });
    refreshCategory(data.slug);
    return { id: row.id };
  });
}

export async function updateCategory(categoryId: string, input: z.input<typeof categoryFormSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "categories");
    const current = await findCategory(categoryId);
    const data = categoryFormSchema.parse(input);
    // Editors may edit content but not visibility flags.
    const flags = can(actor, "toggleVisibility", "categories")
      ? { isVisible: data.isVisible, showInNav: data.showInNav, showOnHome: data.showOnHome }
      : {};
    await db
      .update(categories)
      .set({
        slug: data.slug,
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        iconKey: data.iconKey,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        ogImageId: data.ogImageId,
        arNeedsReview: !data.arReviewed,
        updatedBy: actor.id,
        ...flags,
      })
      .where(eq(categories.id, current.id));
    await logAudit({
      actorId: actor.id,
      action: "category.update",
      entityType: "category",
      entityId: current.id,
      summary: { slug: data.slug },
    });
    refreshCategory(current.slug, data.slug);
  });
}

const toggleFields = z.enum(["isVisible", "showInNav", "showOnHome"]);

export async function toggleCategory(categoryId: string, field: z.infer<typeof toggleFields>, value: boolean) {
  return adminAction(async (actor) => {
    assertCan(actor, "toggleVisibility", "categories");
    const current = await findCategory(categoryId);
    await db
      .update(categories)
      .set({ [toggleFields.parse(field)]: z.boolean().parse(value), updatedBy: actor.id })
      .where(eq(categories.id, current.id));
    await logAudit({
      actorId: actor.id,
      action: "category.toggle",
      entityType: "category",
      entityId: current.id,
      summary: { field, value },
    });
    refreshCategory(current.slug);
  });
}

export async function reorderCategories(orderedIds: string[]) {
  return adminAction(async (actor) => {
    assertCan(actor, "reorder", "categories");
    const ids = z.array(id).parse(orderedIds);
    await db.transaction(async (tx) => {
      for (const [index, categoryId] of ids.entries()) {
        await tx.update(categories).set({ sortOrder: index }).where(eq(categories.id, categoryId));
      }
    });
    await logAudit({ actorId: actor.id, action: "category.reorder", entityType: "category" });
    refreshCategory();
  });
}

/** Deletes a category; its projects keep their other categories (join rows cascade). */
export async function deleteCategory(categoryId: string) {
  return adminAction(async (actor) => {
    assertCan(actor, "delete", "categories");
    const current = await findCategory(categoryId);
    await db.delete(categories).where(eq(categories.id, current.id));
    await logAudit({
      actorId: actor.id,
      action: "category.delete",
      entityType: "category",
      entityId: current.id,
      summary: { slug: current.slug },
    });
    refreshCategory(current.slug);
  });
}

// ---------------------------------------------------------------------------
// Services (nested under a category)
// ---------------------------------------------------------------------------

async function serviceWithCategory(serviceId: string) {
  const row = await db.query.services.findFirst({
    where: eq(services.id, id.parse(serviceId)),
    with: { category: true },
  });
  if (!row) throw new ActionFailure("notFound");
  return row;
}

export async function createService(categoryId: string, input: z.input<typeof serviceFormSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "create", "services");
    const category = await findCategory(categoryId);
    const data = serviceFormSchema.parse(input);
    const [{ value: last }] = await db
      .select({ value: max(services.sortOrder) })
      .from(services)
      .where(eq(services.categoryId, category.id));
    const [row] = await db
      .insert(services)
      .values({
        ...data,
        categoryId: category.id,
        sortOrder: (last ?? -1) + 1,
        createdBy: actor.id,
        updatedBy: actor.id,
      })
      .returning();
    await logAudit({ actorId: actor.id, action: "service.create", entityType: "service", entityId: row.id });
    refreshCategory(category.slug);
    return row;
  });
}

export async function updateService(
  serviceId: string,
  input: z.input<typeof serviceFormSchema> & { arReviewed?: boolean },
) {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "services");
    const current = await serviceWithCategory(serviceId);
    const data = serviceFormSchema.parse(input);
    const visibility = can(actor, "toggleVisibility", "services") ? { isVisible: data.isVisible } : {};
    await db
      .update(services)
      .set({
        name: data.name,
        description: data.description,
        ...visibility,
        ...(input.arReviewed !== undefined ? { arNeedsReview: !input.arReviewed } : {}),
        updatedBy: actor.id,
      })
      .where(eq(services.id, current.id));
    await logAudit({ actorId: actor.id, action: "service.update", entityType: "service", entityId: current.id });
    refreshCategory(current.category.slug);
  });
}

export async function toggleService(serviceId: string, isVisible: boolean) {
  return adminAction(async (actor) => {
    assertCan(actor, "toggleVisibility", "services");
    const current = await serviceWithCategory(serviceId);
    await db
      .update(services)
      .set({ isVisible: z.boolean().parse(isVisible), updatedBy: actor.id })
      .where(eq(services.id, current.id));
    refreshCategory(current.category.slug);
  });
}

export async function reorderServices(categoryId: string, orderedIds: string[]) {
  return adminAction(async (actor) => {
    assertCan(actor, "reorder", "services");
    const category = await findCategory(categoryId);
    const ids = z.array(id).parse(orderedIds);
    await db.transaction(async (tx) => {
      for (const [index, serviceId] of ids.entries()) {
        await tx
          .update(services)
          .set({ sortOrder: index })
          .where(and(eq(services.id, serviceId), eq(services.categoryId, category.id)));
      }
    });
    refreshCategory(category.slug);
  });
}

export async function deleteService(serviceId: string) {
  return adminAction(async (actor) => {
    assertCan(actor, "delete", "services");
    const current = await serviceWithCategory(serviceId);
    await db.delete(services).where(eq(services.id, current.id));
    await logAudit({ actorId: actor.id, action: "service.delete", entityType: "service", entityId: current.id });
    refreshCategory(current.category.slug);
  });
}

// ---------------------------------------------------------------------------
// Projects shown on the category page
// ---------------------------------------------------------------------------

export async function assignProjectToCategory(categoryId: string, projectId: string) {
  return adminAction(async (actor) => {
    assertCan(actor, "reorder", "categories");
    const category = await findCategory(categoryId);
    const project = await db.query.projects.findFirst({ where: eq(projects.id, id.parse(projectId)) });
    if (!project) throw new ActionFailure("notFound");
    const [{ value: last }] = await db
      .select({ value: max(projectCategories.sortOrder) })
      .from(projectCategories)
      .where(eq(projectCategories.categoryId, category.id));
    await db
      .insert(projectCategories)
      .values({ categoryId: category.id, projectId: project.id, sortOrder: (last ?? -1) + 1 })
      .onConflictDoNothing();
    refreshTags(TAGS.project(project.slug));
    refreshCategory(category.slug);
  });
}

export async function removeProjectFromCategory(categoryId: string, projectId: string) {
  return adminAction(async (actor) => {
    assertCan(actor, "reorder", "categories");
    const category = await findCategory(categoryId);
    await db
      .delete(projectCategories)
      .where(and(eq(projectCategories.categoryId, category.id), eq(projectCategories.projectId, id.parse(projectId))));
    refreshCategory(category.slug);
  });
}

export async function reorderCategoryProjects(categoryId: string, orderedProjectIds: string[]) {
  return adminAction(async (actor) => {
    assertCan(actor, "reorder", "categories");
    const category = await findCategory(categoryId);
    const ids = z.array(id).parse(orderedProjectIds);
    await db.transaction(async (tx) => {
      for (const [index, projectId] of ids.entries()) {
        await tx
          .update(projectCategories)
          .set({ sortOrder: index })
          .where(and(eq(projectCategories.categoryId, category.id), eq(projectCategories.projectId, projectId)));
      }
    });
    refreshCategory(category.slug);
  });
}

export async function setFeaturedInCategory(categoryId: string, projectId: string, featured: boolean) {
  return adminAction(async (actor) => {
    assertCan(actor, "publish", "projects");
    const category = await findCategory(categoryId);
    await db
      .update(projectCategories)
      .set({ isFeaturedInCategory: z.boolean().parse(featured) })
      .where(and(eq(projectCategories.categoryId, category.id), eq(projectCategories.projectId, id.parse(projectId))));
    refreshCategory(category.slug);
  });
}

/** Projects not yet assigned to this category (for the "add project" picker). */
export async function listAssignableProjects(categoryId: string) {
  return adminAction(async (actor) => {
    assertCan(actor, "view", "projects");
    const category = await findCategory(categoryId);
    const assigned = await db
      .select({ id: projectCategories.projectId })
      .from(projectCategories)
      .where(eq(projectCategories.categoryId, category.id));
    const rows = await db.select({ id: projects.id, title: projects.title, status: projects.status }).from(projects);
    const taken = new Set(assigned.map((a) => a.id));
    return rows.filter((row) => !taken.has(row.id) && row.status !== "archived");
  });
}
