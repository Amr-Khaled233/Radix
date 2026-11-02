"use server";

import { eq } from "drizzle-orm";
import { z } from "@/lib/zod";
import { setAdminLocaleCookie } from "@/lib/admin/locale";
import { adminAction } from "@/lib/admin/action";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";
import { isOwnUploadUrl } from "@/lib/media/storage";

const profileSchema = z.object({
  name: z.string().trim().min(1, "required").max(120),
  image: z.string().refine(isOwnUploadUrl).nullable(),
  preferredLocale: z.enum(["en", "ar"]),
  preferredTheme: z.enum(["system", "light", "dark"]),
});

/** Updates the signed-in admin's own profile (no permission beyond being signed in). */
export async function updateProfile(input: z.input<typeof profileSchema>) {
  return adminAction(async (actor) => {
    const data = profileSchema.parse(input);
    await db.update(user).set(data).where(eq(user.id, actor.id));
    await setAdminLocaleCookie(data.preferredLocale);
  });
}
