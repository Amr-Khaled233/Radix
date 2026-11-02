import { getTranslations } from "next-intl/server";
import { getAdminLocale } from "@/lib/admin/locale";
import { AboutEditor } from "../page-editors";
import { PageEditorShell } from "../page-shell";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.pages.about" });
  return { title: t("title") };
}

export default function Page() {
  return <PageEditorShell settingKey="about" messageKey="about" Editor={AboutEditor} />;
}
