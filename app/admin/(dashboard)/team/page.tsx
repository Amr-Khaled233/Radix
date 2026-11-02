import { asc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { mediaByIds } from "@/lib/admin/media";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { teamMembers } from "@/lib/db/schema";
import { completeness } from "@/lib/localized";
import { NewTeamMemberButton, TeamList } from "./team-list";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.team" });
  return { title: t("title") };
}

export default async function TeamPage() {
  const user = await requireAdminPage();
  if (!can(user, "view", "team")) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.team" });
  const rows = await db.select().from(teamMembers).orderBy(asc(teamMembers.sortOrder));
  const photos = new Map((await mediaByIds(rows.map((r) => r.photoId))).map((m) => [m.id, m]));

  return (
    <>
      <PageHeader
        label={t("label")}
        title={t("title")}
        description={t("description")}
        actions={can(user, "create", "team") ? <NewTeamMemberButton /> : null}
      />
      <TeamList
        items={rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          role: row.role,
          isVisible: row.isVisible,
          showOnHome: row.showOnHome,
          photo: row.photoId ? (photos.get(row.photoId) ?? null) : null,
          completeness: completeness([row.name, row.role, row.shortBio]),
          arNeedsReview: row.arNeedsReview,
        }))}
        canReorder={can(user, "reorder", "team")}
        canToggle={can(user, "toggleVisibility", "team")}
      />
      {!can(user, "toggleVisibility", "team") ? <p className="text-muted mt-4 text-sm">{t("editorNote")}</p> : null}
    </>
  );
}
