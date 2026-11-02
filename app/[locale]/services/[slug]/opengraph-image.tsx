import { connection } from "next/server";
import { formatIndex } from "@/components/brand/index-marker";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getCategoryPage } from "@/lib/site/data";
import { OG_SIZE, renderOg } from "@/lib/site/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "RADIX service";

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  // Rendered at request time: image generation reads its renderer from disk (uncached I/O).
  await connection();
  // Route handlers can't read next/root-params, so the locale comes from the URL params.
  const { locale: raw, slug } = await params;
  const locale: Locale = raw === "ar" ? "ar" : "en";
  const data = await getCategoryPage(slug);
  const name = data ? t(data.category.name, locale) : "RADIX";
  return renderOg({
    locale,
    label: data ? `${formatIndex(data.category.index)} — ${name}` : "RADIX",
    title: (data && t(data.category.tagline, locale)) || name,
  });
}
