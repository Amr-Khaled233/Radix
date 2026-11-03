import type { Metadata } from "next";
import { getSetting, type MediaRef } from "@/lib/site/data";
import { routing, type Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";

export function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

/** Absolute URL for a locale-prefixed path ("" = home). */
export function localeUrl(locale: Locale, path = "") {
  return `${siteOrigin()}/${locale}${path}`;
}

type PageMetaInput = {
  locale: Locale;
  /** Path after the locale, e.g. "/services/brand/brand-refresh" ("" for home). */
  path: string;
  title?: string;
  description?: string;
  image?: MediaRef | null;
  /** Use the page title as-is (no "— RADIX" template), e.g. the home page. */
  absoluteTitle?: boolean;
  type?: "website" | "article" | "profile";
};

/** Localized metadata with canonical, hreflang alternates (en, ar, x-default) and Open Graph. */
export async function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  absoluteTitle,
  type = "website",
}: PageMetaInput): Promise<Metadata> {
  const seo = await getSetting("seo");
  const fallbackTitle = t(seo.defaultTitle, locale) || "RADIX";
  const fallbackDescription = t(seo.defaultDescription, locale);
  const resolvedTitle = title || fallbackTitle;
  const desc = description || fallbackDescription || undefined;
  const languages = Object.fromEntries(routing.locales.map((l) => [l, localeUrl(l, path)]));

  return {
    title: absoluteTitle || !title ? { absolute: resolvedTitle } : resolvedTitle,
    description: desc,
    alternates: {
      canonical: localeUrl(locale, path),
      languages: { ...languages, "x-default": localeUrl(routing.defaultLocale, path) },
    },
    openGraph: {
      type,
      siteName: "RADIX",
      locale: locale === "ar" ? "ar_AR" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_AR"],
      url: localeUrl(locale, path),
      title: resolvedTitle,
      description: desc,
      // Custom share images override the generated ones (opengraph-image routes).
      ...(image
        ? {
            images: [
              {
                url: image.url,
                width: image.width ?? undefined,
                height: image.height ?? undefined,
                alt: t(image.alt, locale),
              },
            ],
          }
        : {}),
    },
    twitter: { card: "summary_large_image", title: resolvedTitle, description: desc },
  };
}
