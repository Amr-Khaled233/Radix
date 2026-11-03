import { asc, desc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { mediaByIds } from "@/lib/admin/media";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { categories, projectCategories, projects } from "@/lib/db/schema";
import { completeness } from "@/lib/localized";
import { NewProjectButton, ProjectTable } from "./project-table";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.projects" });
  return { title: t("title") };
}

export default async function ProjectsPage() {
  const user = await requireAdminPage();
  if (!can(user, "view", "projects")) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.projects" });

  const [rows, links, cats] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.updatedAt)),
    db
      .select({ projectId: projectCategories.projectId, categoryId: projectCategories.categoryId })
      .from(projectCategories),
    db
      .select({ id: categories.id, slug: categories.slug, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.sortOrder)),
  ]);
  const covers = await mediaByIds(rows.map((r) => r.coverImageId));
  const coverBy = new Map(covers.map((m) => [m.id, m]));
  const categoriesBy = new Map<string, string[]>();
  for (const link of links)
    categoriesBy.set(link.projectId, [...(categoriesBy.get(link.projectId) ?? []), link.categoryId]);

  return (
    <>
      <PageHeader
        label={t("label")}
        title={t("title")}
        description={t("description")}
        actions={can(user, "create", "projects") ? <NewProjectButton /> : null}
      />
      <ProjectTable
        categories={cats}
        projects={rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          clientName: row.clientName,
          status: row.status,
          isFeatured: row.isFeatured,
          year: row.year,
          updatedAt: row.updatedAt.toISOString(),
          cover: row.coverImageId ? (coverBy.get(row.coverImageId) ?? null) : null,
          categoryIds: categoriesBy.get(row.id) ?? [],
          completeness: completeness([row.title, row.summary]),
          arNeedsReview: row.arNeedsReview,
        }))}
        permissions={{
          create: can(user, "create", "projects"),
          publish: can(user, "publish", "projects"),
          delete: can(user, "delete", "projects"),
        }}
      />
      {!can(user, "publish", "projects") ? <p className="text-muted mt-4 text-sm">{t("editorDraftOnly")}</p> : null}
    </>
  );
}
