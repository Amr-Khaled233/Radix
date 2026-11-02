import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "@/lib/zod";
import { can } from "@/lib/auth/permissions";
import { getAdminUser } from "@/lib/auth/session";
import { SLUG_RE } from "@/lib/slug";

const querySchema = z.object({
  type: z.enum(["project", "team", "category", "page"]),
  slug: z.string().regex(SLUG_RE).optional(),
  locale: z.enum(["en", "ar"]).default("en"),
});

const PATHS = {
  project: (slug: string) => `/work/${slug}`,
  team: (slug: string) => `/team/${slug}`,
  category: (slug: string) => `/services/${slug}`,
  page: () => "",
} as const;

/** Enables draft mode for signed-in admins and opens the public page with unpublished content. */
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user || !can(user, "view", "projects")) return new Response("Unauthorized", { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return new Response("Invalid request", { status: 400 });
  const { type, slug, locale } = parsed.data;
  (await draftMode()).enable();
  redirect(`/${locale}${slug ? PATHS[type](slug) : ""}`);
}
