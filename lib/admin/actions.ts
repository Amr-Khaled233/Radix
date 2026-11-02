"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";
import { getAdminUser } from "@/lib/auth/session";
import { setAdminLocaleCookie } from "./locale";

/** Switches the dashboard UI language; saved to the profile when signed in. */
export async function setAdminLocale(locale: "en" | "ar") {
  const value = locale === "ar" ? "ar" : "en";
  await setAdminLocaleCookie(value);
  const current = await getAdminUser();
  if (current) await db.update(user).set({ preferredLocale: value }).where(eq(user.id, current.id));
}
