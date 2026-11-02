import { getTranslations } from "next-intl/server";
import { getAdminLocale } from "@/lib/admin/locale";
import { FooterEditor } from "../page-editors";
import { PageEditorShell } from "../page-shell";

export async function generateMetadata() {
  const t = await getTranslations({ locale: await getAdminLocale(), namespace: "admin.pages.footer" });
  return { title: t("title") };
}

export default function Page() {
  return <PageEditorShell settingKey="footer" messageKey="footer" Editor={FooterEditor} />;
}
