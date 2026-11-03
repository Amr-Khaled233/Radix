import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { HeroPoster } from "@/components/site/hero/hero-poster";
import { HeroScroll } from "@/components/site/hero/hero-scroll";
import {
  ClosingCta,
  FeaturedWorkSection,
  PillarsSection,
  PositioningSection,
  ProcessSection,
  StandardHero,
  TeamPreviewSection,
} from "@/components/site/home-sections";
import { JsonLd } from "@/components/site/json-ld";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getHero, getPublishedProjects, getSetting, getVisibleCategories, getVisibleTeam } from "@/lib/site/data";
import { localeUrl, pageMetadata, siteOrigin } from "@/lib/site/seo";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const home = await getSetting("home");
  return pageMetadata({
    locale,
    path: "",
    title: `RADIX — ${t(home.hero.headline, locale)}`,
    description: t(home.hero.body, locale),
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  const tSite = await getTranslations("site");
  const [home, process, localeSettings, general, hero, categories, projects, team] = await Promise.all([
    getSetting("home"),
    getSetting("process"),
    getSetting("locale"),
    getSetting("general"),
    getHero(),
    getVisibleCategories(),
    getPublishedProjects(),
    getVisibleTeam(),
  ]);
  const digits = localeSettings.arabicDigits;
  const indexed = categories.map((category, i) => ({ ...category, index: i + 1 }));
  const categoryNames = new Map(categories.map((c) => [c.id, t(c.name, locale)]));
  const config = hero.config;
  const posters = {
    desktop: config.assets.posterDesktop ? hero.media[config.assets.posterDesktop] : null,
    mobile: config.assets.posterMobile ? hero.media[config.assets.posterMobile] : null,
  };
  const useScrollHero = config.enabled && Boolean(posters.desktop ?? posters.mobile);

  const sections: Record<string, ReactNode> = {
    hero: useScrollHero ? (
      <HeroScroll
        config={config}
        media={hero.media}
        frames={hero.frames}
        locale={locale}
        afterId="after-hero"
        labels={{ scroll: tSite("hero.scroll"), skip: tSite("hero.skip") }}
        poster={
          <HeroPoster
            desktop={posters.desktop ?? null}
            mobile={posters.mobile ?? null}
            fit={config.fit}
            focal={config.focal}
          />
        }
      />
    ) : (
      <StandardHero copy={home.hero} locale={locale} />
    ),
    pillars: (
      <PillarsSection
        copy={home.pillars}
        categories={indexed.filter((c) => c.showOnHome)}
        locale={locale}
        digits={digits}
        allLabel={tSite("home.allServices")}
      />
    ),
    positioning: <PositioningSection copy={home.positioning} locale={locale} />,
    featuredWork: (
      <FeaturedWorkSection
        copy={home.featuredWork}
        projects={projects.filter((p) => p.isFeatured).slice(0, 6)}
        categoryNames={categoryNames}
        locale={locale}
        digits={digits}
      />
    ),
    process: <ProcessSection copy={home.process} steps={process.steps} locale={locale} digits={digits} />,
    teamPreview: (
      <TeamPreviewSection
        copy={home.teamPreview}
        team={team.filter((m) => m.showOnHome)}
        locale={locale}
        allLabel={tSite("home.meetTeam")}
      />
    ),
    closingCta: <ClosingCta copy={home.closingCta} locale={locale} />,
  };

  const visible = home.sections.filter((section) => section.visible);
  const heroFirst = visible[0]?.key === "hero";

  return (
    <>
      {/* The standard hero carries the page h1; the scroll hero's h1 is its first beat, so keep one here for structure. */}
      {useScrollHero && visible.some((s) => s.key === "hero") ? (
        <h1 className="sr-only">{`RADIX — ${t(home.hero.headline, locale)}`}</h1>
      ) : !visible.some((s) => s.key === "hero") ? (
        <h1 className="sr-only">RADIX</h1>
      ) : null}
      <div className="space-y-fib-144">
        {visible.map((section, i) => (
          // The section after a leading hero is the "Skip intro" target.
          <div key={section.key} id={heroFirst && i === 1 ? "after-hero" : undefined} className="scroll-mt-24">
            {sections[section.key]}
          </div>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${siteOrigin()}/#organization`,
              name: "RADIX",
              url: siteOrigin(),
              logo: `${siteOrigin()}/icons/icon-512.png`,
              slogan: t(home.hero.headline, locale) || undefined,
              email: general.email || undefined,
              telephone: general.phone || undefined,
              sameAs: general.socials.map((s) => s.url),
            },
            {
              "@type": "WebSite",
              "@id": `${siteOrigin()}/#website`,
              url: localeUrl(locale),
              name: "RADIX",
              inLanguage: locale,
              publisher: { "@id": `${siteOrigin()}/#organization` },
            },
          ],
        }}
      />
    </>
  );
}
