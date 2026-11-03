import "server-only";
import { and, arrayOverlaps, count, eq, type SQL } from "drizzle-orm";
import { cache } from "react";
import type { Actor } from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import { categoryAssignments, contactSubmissions, user } from "@/lib/db/schema";
import { messageScopeFor, type MessageScope } from "./scope";

export async function assignedCategoryIds(userId: string) {
  const rows = await db
    .select({ categoryId: categoryAssignments.categoryId })
    .from(categoryAssignments)
    .where(eq(categoryAssignments.userId, userId));
  return rows.map((r) => r.categoryId);
}

/** The signed-in account's message scope (null = no inbox). Checked on the server for every read and write. */
export const getMessageScope = cache(async (actor: Actor): Promise<MessageScope | null> => {
  if (actor.banned) return null;
  return messageScopeFor(actor, actor.role === "super_admin" ? [] : await assignedCategoryIds(actor.id));
});

/** WHERE clause limiting contact submissions to a scope (undefined = everything). */
export function scopeWhere(scope: MessageScope): SQL | undefined {
  return scope.all ? undefined : arrayOverlaps(contactSubmissions.categoryIds, scope.categoryIds);
}

/** New (unread) messages in a scope, for the sidebar badge and the overview. */
export async function countNewMessages(scope: MessageScope | null) {
  if (!scope) return 0;
  const [row] = await db
    .select({ value: count() })
    .from(contactSubmissions)
    .where(and(eq(contactSubmissions.status, "new"), scopeWhere(scope)));
  return row?.value ?? 0;
}

/** Every dashboard account with the pillars it is responsible for (for routing notifications). */
export async function accountsWithAssignments() {
  const [accounts, assignments] = await Promise.all([
    db.select({ id: user.id, email: user.email, role: user.role, banned: user.banned }).from(user),
    db.select().from(categoryAssignments),
  ]);
  return accounts.map((a) => ({
    ...a,
    categoryIds: assignments.filter((x) => x.userId === a.id).map((x) => x.categoryId),
  }));
}
