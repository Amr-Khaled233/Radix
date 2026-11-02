import * as rootParams from "next/root-params";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/** Locale segment of the public site, or undefined in the (unprefixed) dashboard tree. */
async function localeParam(): Promise<string | undefined> {
  try {
    return await rootParams.locale();
  } catch {
    return undefined;
  }
}

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await localeParam();
    if (paramValue === undefined) {
      // Dashboard (/admin): pages pass their locale explicitly; this covers
      // implicit lookups with the language toggle's cookie.
      const cookieValue = (await cookies()).get("ADMIN_LOCALE")?.value;
      locale = cookieValue === "ar" ? "ar" : "en";
    } else if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
