import { connection } from "next/server";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getProjectPage } from "@/lib/site/data";
import { OG_SIZE, renderOg } from "@/lib/site/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "RADIX case study";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string; project: string }>;
}) {
  // Rendered at request time: image generation reads its renderer from disk (uncached I/O).
  await connection();
  // Route handlers can't read next/root-params, so the locale comes from the URL params.
  const { locale: raw, project: slug } = await params;
  const locale: Locale = raw === "ar" ? "ar" : "en";
  const data = await getProjectPage(slug);
  return renderOg({
    locale,
    label: (data && t(data.project.clientName, locale)) || (locale === "ar" ? "دراسة حالة" : "Case study"),
    title: (data && t(data.project.title, locale)) || "RADIX",
  });
}
