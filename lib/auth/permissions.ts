import type { Role } from "@/lib/db/schema/auth";

/**
 * The single permission map (spec §6). Enforced server-side in every Server
 * Action and route handler via `assertCan`; the UI uses `can` to hide actions.
 */
export const RESOURCES = [
  "admins",
  "auditLog",
  "settings",
  "categories",
  "services",
  "projects",
  "team",
  "pages",
  "media",
  "messages",
] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["view", "create", "edit", "reorder", "toggleVisibility", "publish", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

type Grant = Partial<Record<Resource, readonly Action[]>>;

const ALL: readonly Action[] = ACTIONS;

const GRANTS: Record<Role, Grant> = {
  super_admin: Object.fromEntries(RESOURCES.map((resource) => [resource, ALL])),
  admin: {
    settings: ALL,
    categories: ALL,
    services: ALL,
    projects: ALL,
    team: ALL,
    pages: ALL,
    media: ALL,
    messages: ALL,
  },
  editor: {
    // Categories & services: edit only.
    categories: ["view", "edit"],
    services: ["view", "edit"],
    // Projects / team / pages: create and edit drafts; no publish or delete.
    projects: ["view", "create", "edit"],
    team: ["view", "create", "edit"],
    pages: ["view", "edit"],
    // Media: upload & edit alt text.
    media: ["view", "create", "edit"],
  },
};

export type Actor = { id: string; role: Role; banned?: boolean | null };

export function can(actor: Actor | null | undefined, action: Action, resource: Resource): boolean {
  if (!actor || actor.banned) return false;
  return GRANTS[actor.role]?.[resource]?.includes(action) ?? false;
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(action: Action, resource: Resource) {
    super(`Forbidden: ${action} ${resource}`);
    this.name = "ForbiddenError";
  }
}

export function assertCan(actor: Actor | null | undefined, action: Action, resource: Resource): asserts actor is Actor {
  if (!can(actor, action, resource)) throw new ForbiddenError(action, resource);
}

/** Editors may only save projects/team as drafts. */
export function canPublish(actor: Actor | null | undefined, resource: "projects" | "team" | "pages") {
  return can(actor, "publish", resource);
}

// ---------------------------------------------------------------------------
// Admin-account safeguards (spec §6): nobody changes their own role/status or
// deletes themselves, and the last active super admin is never demoted,
// deactivated or deleted.
// ---------------------------------------------------------------------------

export type AdminChange = { type: "setRole"; role: Role } | { type: "deactivate" } | { type: "delete" };

export type SafeguardResult = { ok: true } | { ok: false; reason: "self" | "lastSuperAdmin" };

export function checkAdminChange(params: {
  actorId: string;
  target: { id: string; role: Role; banned?: boolean | null };
  change: AdminChange;
  activeSuperAdminCount: number;
}): SafeguardResult {
  const { actorId, target, change, activeSuperAdminCount } = params;
  if (actorId === target.id) return { ok: false, reason: "self" };

  const removesSuperAdmin =
    target.role === "super_admin" && !target.banned && (change.type !== "setRole" || change.role !== "super_admin");
  if (removesSuperAdmin && activeSuperAdminCount <= 1) return { ok: false, reason: "lastSuperAdmin" };

  return { ok: true };
}
