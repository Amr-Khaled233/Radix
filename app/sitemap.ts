import type { MetadataRoute } from "next";
import { routing } from "@/lib/i18n/routing";
import { getPublicSlugs, getVisibleTeam } from "@/lib/site/data";
import { projectPath } from "@/lib/site/paths";
import { localeUrl } from "@/lib/site/seo";

/** Both locales for every public page, with hreflang alternates. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, team] = await Promise.all([getPublicSlugs(), getVisibleTeam()]);
  const paths: { path: string; lastModified?: Date; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/about", priority: 0.8 },
    { path: "/services", priority: 0.9 },
    { path: "/contact", priority: 0.7 },
    { path: "/privacy", priority: 0.2 },
    ...(team.length ? [{ path: "/team", priority: 0.6 }] : []),
    ...slugs.categories.map((c) => ({ path: `/services/${c.slug}`, lastModified: c.updatedAt, priority: 0.8 })),
    ...slugs.projects.map((p) => ({
      path: projectPath(p.pillarSlug, p.slug),
      lastModified: p.updatedAt,
      priority: 0.7,
    })),
    ...slugs.team.map((m) => ({ path: `/team/${m.slug}`, lastModified: m.updatedAt, priority: 0.5 })),
  ];

  return paths.flatMap(({ path, lastModified, priority }) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified,
      priority,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, localeUrl(l, path)])) },
    })),
  );
}
