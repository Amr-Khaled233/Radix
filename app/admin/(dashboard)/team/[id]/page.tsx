import { asc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { z } from "@/lib/zod";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { mediaByIds } from "@/lib/admin/media";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { categories, teamMemberCategories, teamMembers } from "@/lib/db/schema";
import { t as localized } from "@/lib/localized";
import { TeamForm } from "./team-form";

export default async function TeamMemberPage({ params }: PageProps<"/admin/team/[id]">) {
  const user = await requireAdminPage();
  if (!can(user, "view", "team")) notFound();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const member = await db.query.teamMembers.findFirst({ where: eq(teamMembers.id, id) });
  if (!member) notFound();
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: "admin.team" });

  const [cats, expertise, [photo]] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(teamMemberCategories).where(eq(teamMemberCategories.teamMemberId, id)),
    mediaByIds([member.photoId]),
  ]);

  return (
    <>
      <PageHeader label={t("label")} title={localized(member.name, locale)} />
      <TeamForm
        member={member}
        photo={photo ?? null}
        categoryIds={expertise.map((e) => e.categoryId)}
        categories={cats}
        permissions={{ toggle: can(user, "toggleVisibility", "team"), delete: can(user, "delete", "team") }}
      />
    </>
  );
}
