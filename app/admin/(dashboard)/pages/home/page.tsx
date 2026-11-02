import { getTranslations } from "next-intl/server";
import { getAdminLocale } from "@/lib/admin/locale";
import { HomeEditor } from "../page-editors";
import { PageEditorShell } from "../page-shell";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.pages.home" });
  return { title: t("title") };
}

export default function Page() {
  return <PageEditorShell settingKey="home" messageKey="home" Editor={HomeEditor} />;
}
