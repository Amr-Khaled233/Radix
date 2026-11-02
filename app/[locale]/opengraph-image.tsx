import { connection } from "next/server";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getSetting } from "@/lib/site/data";
import { OG_SIZE, renderOg } from "@/lib/site/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "RADIX";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  // Rendered at request time: image generation reads its renderer from disk (uncached I/O).
  await connection();
  // Route handlers can't read next/root-params, so the locale comes from the URL params.
  const { locale: raw } = await params;
  const locale: Locale = raw === "ar" ? "ar" : "en";
  const home = await getSetting("home");
  return renderOg({
    locale,
    label: t(home.hero.label, locale) || "RADIX",
    title: t(home.hero.headline, locale) || "RADIX",
  });
}
