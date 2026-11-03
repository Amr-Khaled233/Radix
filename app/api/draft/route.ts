import { asc, eq } from "drizzle-orm";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "@/lib/zod";
import { can } from "@/lib/auth/permissions";
import { getAdminUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { categories, projectCategories, projects } from "@/lib/db/schema";
import { projectPath } from "@/lib/site/paths";
import { SLUG_RE } from "@/lib/slug";

const querySchema = z.object({
  type: z.enum(["project", "team", "category", "page"]),
  slug: z.string().regex(SLUG_RE).optional(),
  locale: z.enum(["en", "ar"]).default("en"),
});

/** A case study opens under its first pillar; without one it has no page yet. */
async function projectPreviewPath(slug: string) {
  const [pillar] = await db
    .select({ slug: categories.slug })
    .from(projects)
    .innerJoin(projectCategories, eq(projectCategories.projectId, projects.id))
    .innerJoin(categories, eq(categories.id, projectCategories.categoryId))
    .where(eq(projects.slug, slug))
    .orderBy(asc(categories.sortOrder))
    .limit(1);
  return pillar ? projectPath(pillar.slug, slug) : "/services";
}

const PATHS = {
  project: projectPreviewPath,
  team: async (slug: string) => `/team/${slug}`,
  category: async (slug: string) => `/services/${slug}`,
  page: async () => "",
} as const;

/** Enables draft mode for signed-in admins and opens the public page with unpublished content. */
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user || !can(user, "view", "projects")) return new Response("Unauthorized", { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return new Response("Invalid request", { status: 400 });
  const { type, slug, locale } = parsed.data;
  (await draftMode()).enable();
  redirect(`/${locale}${slug ? await PATHS[type](slug) : ""}`);
}
