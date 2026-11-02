"use server";

import { eq, max } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { ActionFailure, adminAction, refreshTags } from "@/lib/admin/action";
import { requiredEn, teamFormSchema } from "@/lib/admin/schemas";
import { assertCan, can } from "@/lib/auth/permissions";
import { TAGS } from "@/lib/cache/tags";
import { db } from "@/lib/db/client";
import { teamMemberCategories, teamMembers } from "@/lib/db/schema";
import { slugSchema } from "@/lib/slug";

const id = z.uuid();

async function findMember(memberId: string) {
  const row = await db.query.teamMembers.findFirst({ where: eq(teamMembers.id, id.parse(memberId)) });
  if (!row) throw new ActionFailure("notFound");
  return row;
}

function refreshTeam(...slugs: string[]) {
  // Credits appear on project pages too.
  refreshTags(TAGS.team, TAGS.projects, ...slugs.map(TAGS.teamMember));
}

const createSchema = z.object({ slug: slugSchema, name: requiredEn });

export async function createTeamMember(input: z.input<typeof createSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "create", "team");
    const data = createSchema.parse(input);
    const [{ value: last }] = await db.select({ value: max(teamMembers.sortOrder) }).from(teamMembers);
    const [row] = await db
      .insert(teamMembers)
      .values({
        slug: data.slug,
        name: data.name,
        isVisible: false,
        sortOrder: (last ?? -1) + 1,
        createdBy: actor.id,
        updatedBy: actor.id,
      })
      .returning({ id: teamMembers.id });
    await logAudit({
      actorId: actor.id,
      action: "team.create",
      entityType: "team",
      entityId: row.id,
      summary: { slug: data.slug },
    });
    return { id: row.id };
  });
}

export async function updateTeamMember(memberId: string, input: z.input<typeof teamFormSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "team");
    const current = await findMember(memberId);
    const data = teamFormSchema.parse(input);
    const flags = can(actor, "toggleVisibility", "team")
      ? { isVisible: data.isVisible, showOnHome: data.showOnHome }
      : {};
    await db.transaction(async (tx) => {
      await tx
        .update(teamMembers)
        .set({
          slug: data.slug,
          name: data.name,
          role: data.role,
          shortBio: data.shortBio,
          bio: data.bio,
          photoId: data.photoId,
          email: data.email || null,
          showEmail: data.showEmail,
          links: data.links,
          arNeedsReview: !data.arReviewed,
          updatedBy: actor.id,
          ...flags,
        })
        .where(eq(teamMembers.id, current.id));
      await tx.delete(teamMemberCategories).where(eq(teamMemberCategories.teamMemberId, current.id));
      if (data.categoryIds.length) {
        await tx
          .insert(teamMemberCategories)
          .values(data.categoryIds.map((categoryId) => ({ teamMemberId: current.id, categoryId })));
      }
    });
    await logAudit({ actorId: actor.id, action: "team.update", entityType: "team", entityId: current.id });
    refreshTeam(current.slug, data.slug);
  });
}

const toggleField = z.enum(["isVisible", "showOnHome"]);

export async function toggleTeamMember(memberId: string, field: z.infer<typeof toggleField>, value: boolean) {
  return adminAction(async (actor) => {
    assertCan(actor, "toggleVisibility", "team");
    const current = await findMember(memberId);
    await db
      .update(teamMembers)
      .set({ [toggleField.parse(field)]: z.boolean().parse(value), updatedBy: actor.id })
      .where(eq(teamMembers.id, current.id));
    refreshTeam(current.slug);
  });
}

export async function reorderTeam(orderedIds: string[]) {
  return adminAction(async (actor) => {
    assertCan(actor, "reorder", "team");
    const ids = z.array(id).parse(orderedIds);
    await db.transaction(async (tx) => {
      for (const [index, memberId] of ids.entries()) {
        await tx.update(teamMembers).set({ sortOrder: index }).where(eq(teamMembers.id, memberId));
      }
    });
    await logAudit({ actorId: actor.id, action: "team.reorder", entityType: "team" });
    refreshTeam();
  });
}

export async function deleteTeamMember(memberId: string) {
  return adminAction(async (actor) => {
    assertCan(actor, "delete", "team");
    const current = await findMember(memberId);
    await db.delete(teamMembers).where(eq(teamMembers.id, current.id));
    await logAudit({
      actorId: actor.id,
      action: "team.delete",
      entityType: "team",
      entityId: current.id,
      summary: { slug: current.slug },
    });
    refreshTeam(current.slug);
  });
}
