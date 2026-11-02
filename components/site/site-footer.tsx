import { cacheLife } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { formatIndex } from "@/components/brand/index-marker";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { t as localized } from "@/lib/localized";
import { getSetting, getVisibleCategories, getVisibleTeam } from "@/lib/site/data";
import { localizeDigits } from "@/lib/site/digits";
import { brandCopy } from "@/lib/content/brand";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

async function Copyright() {
  "use cache";
  cacheLife("days");
  const t = await getTranslations("footer");
  return <p className="type-label text-label">{t("copyright", { year: new Date().getFullYear() })}</p>;
}

const linkClass = "type-body text-foreground hover:text-muted transition-colors duration-(--duration-hover)";

const SOCIAL_LABELS: Record<string, string> = {
  website: "Website",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  behance: "Behance",
  dribbble: "Dribbble",
  x: "X",
  github: "GitHub",
};

export async function SiteFooter() {
  const t = await getTranslations("nav");
  const tFooter = await getTranslations("footer");
  const tSite = await getTranslations("site");
  const tA11y = await getTranslations("a11y");
  const locale = (await getLocale()) as Locale;
  const [categories, team, general, footer, localeSettings] = await Promise.all([
    getVisibleCategories(),
    getVisibleTeam(),
    getSetting("general"),
    getSetting("footer"),
    getSetting("locale"),
  ]);
  const statement = localized(footer.text, locale) || brandCopy.statement[locale];
  const address = localized(general.address, locale);
  const hasContact = Boolean(general.email || general.phone || address);

  const links = [
    { href: "/about", label: t("about") },
    { href: "/services", label: t("services") },
    { href: "/work", label: t("work") },
    ...(team.length ? [{ href: "/team", label: t("team") }] : []),
    { href: "/contact", label: t("contact") },
  ];

  return (
    <footer className="border-line-strong mt-fib-144 border-t-2">
      <div className="container-site grid gap-fib-55 py-fib-55 md:grid-cols-12">
        <div className="space-y-fib-21 md:col-span-4">
          <div className="text-foreground">
            <Logo variant="horizontal" height={74} clearSpace={false} />
          </div>
          <p className="type-h4 text-foreground max-w-sm">{statement}</p>
        </div>

        <nav aria-label={tA11y("footerNav")} className="grid grid-cols-2 gap-fib-34 md:col-span-8 md:grid-cols-3">
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
          {categories.length ? (
            <div>
              <h2 className="type-label text-label mb-fib-13">{tFooter("categories")}</h2>
              <ul className="space-y-2">
                {categories.map((category, i) => (
                  <li key={category.slug} className="flex items-baseline gap-3">
                    <span className="type-label text-label tabular-nums">
                      <bdi>{localizeDigits(formatIndex(i + 1), locale, localeSettings.arabicDigits)}</bdi>
                    </span>
                    <Link href={`/services/${category.slug}`} className={linkClass}>
                      {localized(category.name, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {hasContact || general.socials.length ? (
            <div className="col-span-2 md:col-span-1">
              {hasContact ? (
                <>
                  <h2 className="type-label text-label mb-fib-13">{tFooter("contact")}</h2>
                  <ul className="space-y-2">
                    {general.email ? (
                      <li>
                        <a href={`mailto:${general.email}`} className={linkClass}>
                          <bdi dir="ltr">{general.email}</bdi>
                        </a>
                      </li>
                    ) : null}
                    {general.phone ? (
                      <li>
                        <a href={`tel:${general.phone.replace(/[^+\d]/g, "")}`} className={linkClass}>
                          <bdi dir="ltr">{general.phone}</bdi>
                        </a>
                      </li>
                    ) : null}
                    {address ? <li className="type-body text-muted whitespace-pre-line">{address}</li> : null}
                  </ul>
                </>
              ) : null}
              {general.socials.length ? (
                <>
                  <h2 className="type-label text-label mt-fib-21 mb-fib-13">{tSite("footer.follow")}</h2>
                  <ul className="flex flex-wrap gap-x-4 gap-y-2">
                    {general.socials.map((social) => (
                      <li key={social.url}>
                        <a href={social.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          {SOCIAL_LABELS[social.type] ?? new URL(social.url).hostname}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
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
