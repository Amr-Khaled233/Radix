"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { ADMIN_LOCALE_COOKIE } from "@/lib/admin/locale";
import { adminAction } from "@/lib/admin/action";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";
import { isOwnMediaUrl } from "@/lib/media/config";

const profileSchema = z.object({
  name: z.string().trim().min(1, "required").max(120),
  image: z.string().refine(isOwnMediaUrl).nullable(),
  preferredLocale: z.enum(["en", "ar"]),
  preferredTheme: z.enum(["system", "light", "dark"]),
});

/** Updates the signed-in admin's own profile (no permission beyond being signed in). */
export async function updateProfile(input: z.input<typeof profileSchema>) {
  return adminAction(async (actor) => {
    const data = profileSchema.parse(input);
    await db.update(user).set(data).where(eq(user.id, actor.id));
    (await cookies()).set(ADMIN_LOCALE_COOKIE, data.preferredLocale, {
      path: "/admin",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  });
}
