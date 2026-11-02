import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Icon } from "@/components/brand/icon";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { seedCategories } from "@/lib/content/brand";
import { HeaderShell } from "./header-shell";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileMenu } from "./mobile-menu";
import { ServicesMenu } from "./services-menu";
import { ThemeToggle } from "./theme-toggle";
import type { NavCategory, NavLink } from "./nav-types";

/** Horizontal lockup at its 220 px minimum width → 74 px artwork height; clear space x ≈ 23 px. */
const FULL_LOGO_HEIGHT = 74;
const FULL_LOGO_CLEAR = FULL_LOGO_HEIGHT * 0.312;
const ICON_HEIGHT = 32;
const ICON_CLEAR = ICON_HEIGHT * 0.25;

const navLinkClass =
  "type-button text-foreground hover:text-muted py-2 transition-colors duration-(--duration-hover) whitespace-nowrap";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const tA11y = await getTranslations("a11y");
  const locale = (await getLocale()) as Locale;

  // Phase 4: visible categories with show_in_nav come from the database.
  const categories: NavCategory[] = seedCategories.map((category, i) => ({
    index: i + 1,
    href: `/services/${category.slug}`,
    label: category.name[locale],
  }));
  const listCategoriesInline = categories.length <= 4;

  const links: NavLink[] = [
    { href: "/about", label: t("about") },
    { href: "/services", label: t("services") },
    { href: "/work", label: t("work") },
    { href: "/team", label: t("team") },
  ];
  const cta: NavLink = { href: "/contact", label: t("cta") };

  // The logo's leading clear space overlaps the (empty) page gutter so the
  // artwork itself aligns with the content edge.
  const homeLink = (logo: React.ReactNode, clear: number) => (
    <Link href="/" aria-label={tA11y("home")} className="block" style={{ marginInlineStart: -clear }}>
      {logo}
    </Link>
  );

  return (
    <HeaderShell
      logoFull={homeLink(<Logo variant="horizontal" height={FULL_LOGO_HEIGHT} title={null} />, FULL_LOGO_CLEAR)}
      logoCompact={homeLink(<Logo variant="icon" height={ICON_HEIGHT} title={null} />, ICON_CLEAR)}
      mobileControls={
        <MobileMenu
          logo={homeLink(<Logo variant="icon" height={ICON_HEIGHT} title={null} />, ICON_CLEAR)}
          links={links}
          categories={categories}
          servicesLabel={t("services")}
          cta={cta}
          controls={
            <>
              <LocaleSwitcher />
              <ThemeToggle />
            </>
          }
        />
      }
    >
      <nav aria-label={tA11y("primaryNav")} className="flex items-center gap-7">
        <Link href="/about" className={navLinkClass}>
          {t("about")}
        </Link>
        {listCategoriesInline ? (
          <>
            <span className="contents min-[90rem]:hidden">
              <ServicesMenu label={t("services")} categories={categories} />
            </span>
            {categories.map((category) => (
              <Link key={category.href} href={category.href} className={`${navLinkClass} hidden min-[90rem]:inline`}>
                {category.label}
              </Link>
            ))}
          </>
        ) : (
          <ServicesMenu label={t("services")} categories={categories} />
        )}
        <Link href="/work" className={navLinkClass}>
          {t("work")}
        </Link>
        <Link href="/team" className={navLinkClass}>
          {t("team")}
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
      <Link
        href={cta.href}
        className="type-button bg-accent text-on-accent inline-flex min-h-11 items-center gap-2 px-5 whitespace-nowrap transition-colors duration-(--duration-hover) hover:bg-inverse hover:text-on-inverse"
      >
        {cta.label}
        <Icon name="arrow-right" size={18} />
      </Link>
    </HeaderShell>
  );
}
