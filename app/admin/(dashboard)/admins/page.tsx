import { asc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { user as userTable } from "@/lib/db/schema";
import { AdminsTable, InviteAdminButton } from "./admins-table";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.admins" });
  return { title: t("title") };
}

export default async function AdminsPage() {
  const user = await requireAdminPage();
  if (!can(user, "view", "admins")) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.admins" });
  const rows = await db
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
    .orderBy(asc(userTable.createdAt));

  return (
    <>
      <PageHeader
        label={t("label")}
        title={t("title")}
        description={t("description")}
        actions={<InviteAdminButton />}
      />
      <AdminsTable
        currentUserId={user.id}
        admins={rows.map((r) => ({
          ...r,
          banned: Boolean(r.banned),
          lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
      <p className="text-muted mt-4 max-w-3xl text-sm">{t("rolesHelp")}</p>
    </>
  );
}
