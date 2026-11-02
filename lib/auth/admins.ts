import "server-only";
import { generateRandomString } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db/client";
import { ROLES, user, type Role } from "@/lib/db/schema";
import { asLocale, sendInviteEmail, sendResetPasswordEmail } from "@/lib/email/send";
import { auth } from "./auth";
import { inviteSchema, type InviteInput } from "./invite-schema";
import { assertCan, checkAdminChange, ForbiddenError, type Actor, type AdminChange } from "./permissions";
import { countActiveSuperAdmins } from "./queries";

/**
 * Admin-account management (super_admin only). Every function checks the
 * permission map and the account safeguards itself, so it is safe to call
 * from any Server Action.
 */

export const INVITE_TTL_SECONDS = 60 * 60 * 48;
export const RESET_TTL_SECONDS = 60 * 60;

export { inviteSchema, type InviteInput } from "./invite-schema";

export class AdminActionError extends Error {
  constructor(readonly code: "EMAIL_TAKEN" | "NOT_FOUND" | "SELF_CHANGE" | "LAST_SUPER_ADMIN") {
    super(code);
    this.name = "AdminActionError";
  }
}

/**
 * Creates a reset-style token stored exactly like Better Auth's own
 * `/request-password-reset` tokens, so `/reset-password` consumes it
 * (single use, revokes sessions). Invites simply live longer (48 h).
 */
async function issuePasswordToken(userId: string, ttlSeconds: number) {
  const ctx = await auth.$context;
  const token = generateRandomString(32, "a-z", "A-Z", "0-9");
  await ctx.internalAdapter.createVerificationValue({
    identifier: `reset-password:${token}`,
    value: userId,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
  });
  return token;
}

async function findAdmin(id: string) {
  const target = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!target) throw new AdminActionError("NOT_FOUND");
  return target;
}

async function guard(actor: Actor, target: { id: string; role: Role; banned: boolean | null }, change: AdminChange) {
  const result = checkAdminChange({
    actorId: actor.id,
    target,
    change,
    activeSuperAdminCount: await countActiveSuperAdmins(),
  });
  if (!result.ok) throw new AdminActionError(result.reason === "self" ? "SELF_CHANGE" : "LAST_SUPER_ADMIN");
}

export async function inviteAdmin(actor: Actor & { name: string }, input: InviteInput) {
  assertCan(actor, "create", "admins");
  const data = inviteSchema.parse(input);
  const ctx = await auth.$context;

  if (await ctx.internalAdapter.findUserByEmail(data.email)) throw new AdminActionError("EMAIL_TAKEN");

  // Random, unguessable password nobody knows; the invitee sets their own.
  const created = await ctx.internalAdapter.createUser(
    { name: data.name, email: data.email, emailVerified: true, role: data.role, preferredLocale: data.locale },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: await ctx.password.hash(generateRandomString(48, "a-z", "A-Z", "0-9", "-_")),
  });

  const token = await issuePasswordToken(created.id, INVITE_TTL_SECONDS);
  await sendInviteEmail({ to: data.email, locale: data.locale, token, inviterName: actor.name, role: data.role });
  await logAudit({
    actorId: actor.id,
    action: "admin.invite",
    entityType: "user",
    entityId: created.id,
    summary: { email: data.email, role: data.role },
  });
  return { id: created.id };
}

export async function sendAdminResetLink(actor: Actor, targetId: string) {
  assertCan(actor, "edit", "admins");
  const target = await findAdmin(targetId);
  const token = await issuePasswordToken(target.id, RESET_TTL_SECONDS);
  await sendResetPasswordEmail({ to: target.email, locale: asLocale(target.preferredLocale), token });
  await logAudit({ actorId: actor.id, action: "admin.sendResetLink", entityType: "user", entityId: target.id });
}

export async function changeAdminRole(actor: Actor, targetId: string, role: Role) {
  assertCan(actor, "edit", "admins");
  if (!ROLES.includes(role)) throw new ForbiddenError("edit", "admins");
  const target = await findAdmin(targetId);
  await guard(actor, target, { type: "setRole", role });
  await db.update(user).set({ role }).where(eq(user.id, target.id));
  await logAudit({
    actorId: actor.id,
    action: "admin.setRole",
    entityType: "user",
    entityId: target.id,
    summary: { from: target.role, to: role },
  });
}

export async function deactivateAdmin(actor: Actor, targetId: string) {
  assertCan(actor, "edit", "admins");
  const target = await findAdmin(targetId);
  await guard(actor, target, { type: "deactivate" });
  const ctx = await auth.$context;
  await db.update(user).set({ banned: true, banReason: "Deactivated", banExpires: null }).where(eq(user.id, target.id));
  await ctx.internalAdapter.deleteUserSessions(target.id);
  await logAudit({ actorId: actor.id, action: "admin.deactivate", entityType: "user", entityId: target.id });
}

export async function reactivateAdmin(actor: Actor, targetId: string) {
  assertCan(actor, "edit", "admins");
  const target = await findAdmin(targetId);
  if (target.id === actor.id) throw new AdminActionError("SELF_CHANGE");
  await db.update(user).set({ banned: false, banReason: null, banExpires: null }).where(eq(user.id, target.id));
  await logAudit({ actorId: actor.id, action: "admin.reactivate", entityType: "user", entityId: target.id });
}

export async function deleteAdmin(actor: Actor, targetId: string) {
  assertCan(actor, "delete", "admins");
  const target = await findAdmin(targetId);
  await guard(actor, target, { type: "delete" });
  // Sessions and accounts cascade; authored content keeps its rows (author set to null).
  await db.delete(user).where(eq(user.id, target.id));
  await logAudit({
    actorId: actor.id,
    action: "admin.delete",
    entityType: "user",
    entityId: target.id,
    summary: { email: target.email, role: target.role },
  });
}
