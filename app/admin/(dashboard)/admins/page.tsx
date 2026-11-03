import { asc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { categories, categoryAssignments, user as userTable } from "@/lib/db/schema";
import { AdminsTable, InviteAdminButton } from "./admins-table";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.admins" });
  return { title: t("title") };
}

export default async function AdminsPage() {
  const user = await requireAdminPage();
  if (!can(user, "view", "admins")) notFound();
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: "admin.admins" });
  const [rows, cats, assignments] = await Promise.all([
    db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        banned: userTable.banned,
        lastLoginAt: userTable.lastLoginAt,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .orderBy(asc(userTable.createdAt)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(categoryAssignments),
  ]);
  const pillars = cats.map((c) => ({ id: c.id, name: c.name[locale] || c.name.en }));

  return (
    <>
      <PageHeader
        label={t("label")}
        title={t("title")}
        description={t("description")}
        actions={<InviteAdminButton pillars={pillars} />}
      />
      <AdminsTable
        currentUserId={user.id}
        pillars={pillars}
        admins={rows.map((r) => ({
          ...r,
          banned: Boolean(r.banned),
          lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          categoryIds: assignments.filter((a) => a.userId === r.id).map((a) => a.categoryId),
        }))}
      />
      <p className="text-muted mt-4 max-w-3xl text-sm">{t("rolesHelp")}</p>
    </>
  );
}
