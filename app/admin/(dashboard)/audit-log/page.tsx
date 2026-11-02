import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { auditLog, user as userTable } from "@/lib/db/schema";
import { AuditTable } from "./audit-table";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.audit" });
  return { title: t("title") };
}

export default async function AuditLogPage() {
  const user = await requireAdminPage();
  if (!can(user, "view", "auditLog")) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.audit" });
  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      summary: auditLog.summary,
      createdAt: auditLog.createdAt,
      actorName: userTable.name,
      actorEmail: userTable.email,
    })
    .from(auditLog)
    .leftJoin(userTable, eq(userTable.id, auditLog.actorId))
    .orderBy(desc(auditLog.createdAt))
    .limit(500);

  return (
    <>
      <PageHeader label={t("label")} title={t("title")} description={t("description")} />
      <AuditTable rows={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
    </>
  );
}
