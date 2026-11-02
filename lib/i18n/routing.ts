import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

const envDefault = process.env.DEFAULT_LOCALE;
export const defaultLocale: Locale = envDefault === "ar" ? "ar" : "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
});

export function directionOf(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}
