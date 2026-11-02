import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { getAdminLocale } from "@/lib/admin/locale";
import { listMedia, mediaUsage } from "@/lib/admin/media";
import { can } from "@/lib/auth/permissions";
import { requireAdminPage } from "@/lib/auth/session";
import { MediaLibrary } from "./media-library";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.media" });
  return { title: t("title") };
}

export default async function MediaPage() {
  const user = await requireAdminPage();
  if (!can(user, "view", "media")) notFound();
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.media" });
  const [items, usage] = await Promise.all([listMedia(), mediaUsage()]);

  return (
    <>
      <PageHeader label={t("label")} title={t("title")} description={t("description")} />
      <MediaLibrary
        items={items}
        usage={Object.fromEntries(usage)}
        canUpload={can(user, "create", "media")}
        canEdit={can(user, "edit", "media")}
        canDelete={can(user, "delete", "media")}
      />
    </>
  );
}
