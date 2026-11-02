import { cacheLife } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { formatIndex } from "@/components/brand/index-marker";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { brandCopy, seedCategories } from "@/lib/content/brand";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

async function Copyright() {
  "use cache";
  cacheLife("days");
  const t = await getTranslations("footer");
  return <p className="type-label text-label">{t("copyright", { year: new Date().getFullYear() })}</p>;
}

const linkClass = "type-body text-foreground hover:text-muted transition-colors duration-(--duration-hover)";

export async function SiteFooter() {
  const t = await getTranslations("nav");
  const tFooter = await getTranslations("footer");
  const tA11y = await getTranslations("a11y");
  const locale = (await getLocale()) as Locale;

  const links = [
    { href: "/about", label: t("about") },
    { href: "/services", label: t("services") },
    { href: "/work", label: t("work") },
    { href: "/team", label: t("team") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <footer className="border-line-strong mt-fib-144 border-t-2">
      <div className="container-site grid gap-fib-55 py-fib-55 md:grid-cols-12">
        <div className="space-y-fib-21 md:col-span-5">
          <Logo variant="horizontal" height={74} clearSpace={false} />
          <p className="type-h4 text-foreground max-w-sm">{brandCopy.statement[locale]}</p>
        </div>

        <nav aria-label={tA11y("footerNav")} className="grid grid-cols-2 gap-fib-34 md:col-span-7 md:grid-cols-3">
          <div>
            <h2 className="type-label text-label mb-fib-13">{tFooter("navigation")}</h2>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="type-label text-label mb-fib-13">{tFooter("categories")}</h2>
            <ul className="space-y-2">
              {seedCategories.map((category, i) => (
                <li key={category.slug} className="flex items-baseline gap-3">
                  <span className="type-label text-label tabular-nums">
                    <bdi>{formatIndex(i + 1)}</bdi>
                  </span>
                  <Link href={`/services/${category.slug}`} className={linkClass}>
                    {category.name[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Phase 4: contact details and social links from settings (hidden while empty). */}
        </nav>
      </div>

      <div className="border-line border-t">
        <div className="container-site flex flex-col gap-4 py-fib-21 sm:flex-row sm:items-center sm:justify-between">
          <Copyright />
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="type-label text-label hover:text-foreground">
              {t("privacy")}
            </Link>
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
