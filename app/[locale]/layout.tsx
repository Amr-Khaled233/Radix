import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { fontVariables } from "@/lib/fonts";
import { directionOf, routing, type Locale } from "@/lib/i18n/routing";
import { t as localized } from "@/lib/localized";
import { getSetting } from "@/lib/site/data";
import { siteOrigin } from "@/lib/site/seo";
import { SiteAnalytics } from "@/components/site/analytics";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const locale = (await getLocale()) as Locale;
  const seo = await getSetting("seo");
  return {
    metadataBase: new URL(siteOrigin()),
    title: {
      default: localized(seo.defaultTitle, locale) || t("defaultTitle"),
      template: seo.titleTemplate.includes("%s") ? seo.titleTemplate : `%s — ${t("siteName")}`,
    },
    description: localized(seo.defaultDescription, locale) || t("defaultDescription"),
    applicationName: "RADIX",
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F3EE" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1028" },
  ],
};

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("a11y");

  return (
    <html lang={locale} dir={directionOf(locale)} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <ThemeProvider>
            <a
              href="#main"
              className="type-button bg-accent text-on-accent fixed inset-s-4 top-4 z-50 -translate-y-24 px-4 py-3 focus:translate-y-0"
            >
              {t("skipToContent")}
            </a>
            <SiteHeader />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <SiteFooter />
          </ThemeProvider>
          <SiteAnalytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
