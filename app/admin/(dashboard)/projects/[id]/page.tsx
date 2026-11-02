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
import {
  categories,
  projectCategories,
  projectMedia,
  projectResults,
  projects,
  projectServices,
  projectTeam,
  services,
  teamMembers,
} from "@/lib/db/schema";
import { t as localized } from "@/lib/localized";
import { ProjectForm } from "./project-form";

export default async function ProjectEditPage({ params }: PageProps<"/admin/projects/[id]">) {
  const user = await requireAdminPage();
  if (!can(user, "view", "projects")) notFound();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) notFound();
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: "admin.projects" });

  const [cats, svc, members, pc, ps, pm, pr, pt] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder)),
    db
      .select({ id: services.id, name: services.name, categoryId: services.categoryId })
      .from(services)
      .orderBy(asc(services.sortOrder)),
    db.select({ id: teamMembers.id, name: teamMembers.name }).from(teamMembers).orderBy(asc(teamMembers.sortOrder)),
    db.select().from(projectCategories).where(eq(projectCategories.projectId, id)),
    db.select().from(projectServices).where(eq(projectServices.projectId, id)),
    db.select().from(projectMedia).where(eq(projectMedia.projectId, id)).orderBy(asc(projectMedia.sortOrder)),
    db.select().from(projectResults).where(eq(projectResults.projectId, id)).orderBy(asc(projectResults.sortOrder)),
    db.select().from(projectTeam).where(eq(projectTeam.projectId, id)).orderBy(asc(projectTeam.sortOrder)),
  ]);
  const mediaItems = await mediaByIds([project.coverImageId, project.ogImageId, ...pm.map((m) => m.mediaId)]);

  const isEditor = !can(user, "publish", "projects");
  const locked = isEditor && project.status !== "draft";

  return (
    <>
      <PageHeader
        label={t("label")}
        title={localized(project.title, locale)}
        description={locked ? t("editorLocked", { status: t(`status.${project.status}`) }) : undefined}
      />
      <ProjectForm
        project={{
          ...project,
          publishedAt: project.publishedAt ? project.publishedAt.toISOString().slice(0, 10) : null,
        }}
        initial={{
          categoryIds: pc.map((r) => r.categoryId),
          serviceIds: ps.map((r) => r.serviceId),
          gallery: pm.map((r) => ({ mediaId: r.mediaId, caption: r.caption })),
          results: pr.map((r) => ({ value: r.value, label: r.label })),
          team: pt.map((r) => ({ teamMemberId: r.teamMemberId, role: r.role })),
        }}
        media={mediaItems}
        options={{ categories: cats, services: svc, members }}
        permissions={{ publish: !isEditor, delete: can(user, "delete", "projects"), locked }}
      />
    </>
  );
}
