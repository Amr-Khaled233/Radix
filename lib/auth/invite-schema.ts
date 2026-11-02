import { z } from "zod";
import { ROLES } from "@/lib/db/schema/auth";
import { emailSchema } from "./schemas";

/** Admin invitation form (shared by the dashboard form and the server). */
export const inviteSchema = z.object({
  name: z.string().trim().min(1, "required").max(120),
  email: emailSchema,
  role: z.enum(ROLES),
  locale: z.enum(["en", "ar"]).default("en"),
});
export type InviteInput = z.input<typeof inviteSchema>;
