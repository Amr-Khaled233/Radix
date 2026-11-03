"use server";

import { z } from "@/lib/zod";
import { adminAction } from "@/lib/admin/action";
import {
  changeAdminRole,
  deactivateAdmin,
  deleteAdmin,
  inviteAdmin,
  reactivateAdmin,
  sendAdminResetLink,
  setAdminCategories,
  type InviteInput,
} from "@/lib/auth/admins";
import { INVITABLE_ROLES } from "@/lib/auth/invite-schema";
import type { Role } from "@/lib/db/schema";

const id = z.uuid().or(z.string().min(1).max(64));

export async function inviteAdminAction(input: InviteInput) {
  return adminAction((actor) => inviteAdmin(actor, input));
}

export async function changeRoleAction(userId: string, role: Role) {
  return adminAction((actor) => changeAdminRole(actor, id.parse(userId), z.enum(INVITABLE_ROLES).parse(role)));
}

export async function sendResetLinkAction(userId: string) {
  return adminAction((actor) => sendAdminResetLink(actor, id.parse(userId)));
}

export async function deactivateAction(userId: string) {
  return adminAction((actor) => deactivateAdmin(actor, id.parse(userId)));
}

export async function reactivateAction(userId: string) {
  return adminAction((actor) => reactivateAdmin(actor, id.parse(userId)));
}

export async function deleteAdminAction(userId: string) {
  return adminAction((actor) => deleteAdmin(actor, id.parse(userId)));
}

export async function setCategoriesAction(userId: string, categoryIds: string[]) {
  return adminAction((actor) =>
    setAdminCategories(actor, id.parse(userId), z.array(z.uuid()).max(20).parse(categoryIds)),
  );
}
