import type { Role } from "@/lib/db/schema/auth";

/**
 * Who sees which contact messages:
 * - the super admin (the one account that manages all accounts) sees every message;
 * - any other account sees only messages about the pillars it is responsible for;
 * - an account responsible for nothing has no inbox.
 */
export type MessageScope = { all: true } | { all: false; categoryIds: string[] };

export function messageScopeFor(actor: { role: Role; banned?: boolean | null }, assignedCategoryIds: string[]) {
  if (actor.banned) return null;
  if (actor.role === "super_admin") return { all: true } as const;
  return assignedCategoryIds.length ? ({ all: false, categoryIds: assignedCategoryIds } as const) : null;
}

/** True when a message about `messageCategoryIds` is visible in `scope`. */
export function inScope(scope: MessageScope | null, messageCategoryIds: string[]) {
  if (!scope) return false;
  return scope.all || messageCategoryIds.some((id) => scope.categoryIds.includes(id));
}

type Account = { email: string; role: Role; banned?: boolean | null; categoryIds: string[] };

/**
 * Notification recipients for a new message: the active accounts responsible for
 * its pillars. When nobody is responsible (or no pillar was chosen), it goes to
 * the fallback addresses from Settings, else to the super admin.
 */
export function notificationRecipients(messageCategoryIds: string[], accounts: Account[], fallback: string[]) {
  const active = accounts.filter((a) => !a.banned);
  const responsible = active.filter((a) => a.categoryIds.some((id) => messageCategoryIds.includes(id)));
  const emails = responsible.length
    ? responsible.map((a) => a.email)
    : fallback.length
      ? fallback
      : active.filter((a) => a.role === "super_admin").map((a) => a.email);
  return [...new Set(emails.map((e) => e.toLowerCase()))];
}
