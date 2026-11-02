import { asc, count } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { categories, projectCategories, services } from "@/lib/db/schema";
import { completeness } from "@/lib/localized";
import { CategoryList, NewCategoryButton } from "./category-list";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.categories" });
  return { title: t("title") };
}

export default async function CategoriesPage() {
  const user = await requireAdminPage();
  if (!can(user, "view", "categories")) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.categories" });

  const [rows, serviceCounts, projectCounts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select({ id: services.categoryId, value: count() }).from(services).groupBy(services.categoryId),
    db
      .select({ id: projectCategories.categoryId, value: count() })
      .from(projectCategories)
      .groupBy(projectCategories.categoryId),
  ]);
  const servicesBy = new Map(serviceCounts.map((r) => [r.id, r.value]));
  const projectsBy = new Map(projectCounts.map((r) => [r.id, r.value]));

  return (
    <>
      <PageHeader
        label={t("label")}
        title={t("title")}
        description={t("description")}
        actions={can(user, "create", "categories") ? <NewCategoryButton /> : null}
      />
      <CategoryList
        items={rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          iconKey: row.iconKey,
          isVisible: row.isVisible,
          showInNav: row.showInNav,
          showOnHome: row.showOnHome,
          arNeedsReview: row.arNeedsReview,
          completeness: completeness([row.name, row.tagline]),
          services: servicesBy.get(row.id) ?? 0,
          projects: projectsBy.get(row.id) ?? 0,
        }))}
        canReorder={can(user, "reorder", "categories")}
        canToggle={can(user, "toggleVisibility", "categories")}
      />
      {!can(user, "reorder", "categories") ? <p className="text-muted mt-4 text-sm">{t("editorNote")}</p> : null}
    </>
  );
}
