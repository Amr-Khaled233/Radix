import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { getAdminLocale } from "@/lib/admin/locale";
import { fontVariables } from "@/lib/fonts";
import { directionOf } from "@/lib/i18n/routing";
import { ThemeProvider } from "@/components/site/theme-provider";
import "../globals.css";

// The dashboard reads the session and language on every request; it is
// private and low-traffic, so blocking on the request is intended.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: "admin.meta" });
  return {
    title: { default: t("title"), template: `%s — ${t("title")}` },
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const locale = await getAdminLocale();
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={directionOf(locale)} className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
