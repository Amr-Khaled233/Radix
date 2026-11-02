import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getAdminUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/routing";

export const ADMIN_LOCALE_COOKIE = "ADMIN_LOCALE";

/**
 * Dashboard UI language: the language last chosen in this browser (ADMIN_LOCALE
 * cookie, set by the toggle), otherwise the admin's saved preference (applies on
 * a new device), else English.
 */
export const getAdminLocale = cache(async (): Promise<Locale> => {
  const cookieValue = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  const value = cookieValue ?? (await getAdminUser())?.preferredLocale;
  return value === "ar" ? "ar" : "en";
});

/** Remembers the dashboard language in this browser for a year. */
export async function setAdminLocaleCookie(locale: Locale) {
  (await cookies()).set(ADMIN_LOCALE_COOKIE, locale, {
    path: "/admin",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
