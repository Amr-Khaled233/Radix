"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";
import { getAdminUser } from "@/lib/auth/session";
import { ADMIN_LOCALE_COOKIE } from "./locale";

/** Switches the dashboard UI language; saved to the profile when signed in. */
export async function setAdminLocale(locale: "en" | "ar") {
  const value = locale === "ar" ? "ar" : "en";
  (await cookies()).set(ADMIN_LOCALE_COOKIE, value, {
    path: "/admin",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  const current = await getAdminUser();
  if (current) await db.update(user).set({ preferredLocale: value }).where(eq(user.id, current.id));
}
