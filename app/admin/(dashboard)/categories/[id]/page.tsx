import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { mediaByIds } from "@/lib/admin/media";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { categories, projectCategories, projects, services } from "@/lib/db/schema";
import { t as localized } from "@/lib/localized";
import { z } from "zod";
import { CategoryForm } from "./category-form";
import { CategoryProjects } from "./category-projects";
import { ServicesManager } from "./services-manager";

export default async function CategoryEditPage({ params }: PageProps<"/admin/categories/[id]">) {
  const user = await requireAdminPage();
  if (!can(user, "view", "categories")) notFound();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const category = await db.query.categories.findFirst({ where: eq(categories.id, id) });
  if (!category) notFound();
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: "admin.categories" });

  const [serviceRows, assigned, [ogImage], projectCount] = await Promise.all([
    db.select().from(services).where(eq(services.categoryId, id)).orderBy(asc(services.sortOrder)),
    db
      .select({
        id: projects.id,
        title: projects.title,
        status: projects.status,
        isFeaturedInCategory: projectCategories.isFeaturedInCategory,
        sortOrder: projectCategories.sortOrder,
      })
      .from(projectCategories)
      .innerJoin(projects, eq(projects.id, projectCategories.projectId))
      .where(eq(projectCategories.categoryId, id))
      .orderBy(asc(projectCategories.sortOrder)),
    mediaByIds([category.ogImageId]),
    db.$count(projectCategories, eq(projectCategories.categoryId, id)),
  ]);

  return (
    <>
      <PageHeader label={t("label")} title={localized(category.name, locale) || t("editTitle")} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <CategoryForm
          category={category}
          ogImage={ogImage ?? null}
          serviceCount={serviceRows.length}
          projectCount={projectCount}
          permissions={{
            toggle: can(user, "toggleVisibility", "categories"),
            delete: can(user, "delete", "categories"),
          }}
        />
        <div className="space-y-8">
          <ServicesManager
            categoryId={category.id}
            services={serviceRows}
            permissions={{
              create: can(user, "create", "services"),
              reorder: can(user, "reorder", "services"),
              toggle: can(user, "toggleVisibility", "services"),
              delete: can(user, "delete", "services"),
            }}
          />
          <CategoryProjects
            categoryId={category.id}
            projects={assigned}
            canManage={can(user, "reorder", "categories")}
            canFeature={can(user, "publish", "projects")}
          />
        </div>
      </div>
    </>
  );
}
