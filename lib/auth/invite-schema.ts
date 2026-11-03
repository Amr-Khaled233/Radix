import { z } from "@/lib/zod";
import { emailSchema } from "./schemas";

/** Roles that can be given to other accounts. */
export const INVITABLE_ROLES = ["admin", "editor"] as const;

/** Admin invitation form (shared by the dashboard form and the server). */
export const inviteSchema = z.object({
  name: z.string().trim().min(1, "required").max(120),
  email: emailSchema,
  // There is one super admin (the owner); everyone else is invited as admin or editor.
  role: z.enum(INVITABLE_ROLES),
  /** Pillars this account is responsible for (it sees and is emailed their messages). */
  categoryIds: z.array(z.uuid()).max(20).default([]),
  locale: z.enum(["en", "ar"]).default("en"),
});
export type InviteInput = z.input<typeof inviteSchema>;
