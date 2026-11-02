import { getLocale, getTranslations } from "next-intl/server";
import { CoreLines } from "@/components/brand/core-lines";
import { Icon } from "@/components/brand/icon";
import { IndexMarker } from "@/components/brand/index-marker";
import { Reveal } from "@/components/brand/reveal";
import { Strata } from "@/components/brand/strata";
import { SurfaceLine } from "@/components/brand/surface-line";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { brandCopy, seedCategories } from "@/lib/content/brand";

/**
 * Phase 1 placeholder home: the standard (non-video) hero and the pillars,
 * built from brand copy. Phase 4 replaces this with database-driven sections
 * and the scroll-driven hero.
 */
export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations();

  return (
    <Reveal as="section" className="container-site pt-fib-55">
      <p className="type-label text-label reveal-rise">{brandCopy.descriptor[locale]}</p>
      <div className="grid gap-fib-34 pt-fib-21 pb-fib-55 lg:grid-cols-12 lg:items-end">
        <h1 className="type-display text-foreground reveal-rise lg:col-span-8">{brandCopy.tagline[locale]}</h1>
        <div className="reveal-rise space-y-fib-21 lg:col-span-4">
          <p className="type-body-lg text-muted">{brandCopy.heroBody[locale]}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="type-button bg-accent text-on-accent hover:bg-inverse hover:text-on-inverse inline-flex min-h-12 items-center gap-2 px-6 transition-colors duration-(--duration-hover)"
            >
              {t("nav.cta")}
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link
              href="/services"
              className="type-button border-line-strong text-foreground hover:bg-foreground hover:text-background inline-flex min-h-12 items-center border px-6 transition-colors duration-(--duration-hover)"
            >
              {t("home.exploreServices")}
            </Link>
          </div>
        </div>
      </div>

      <SurfaceLine />
      <div className="relative">
        <Strata count={5} className="absolute inset-x-0 top-0" />
        <CoreLines
          className="relative"
          nodes={seedCategories.map((category, i) => ({
            depth: [55, 89, 55, 89][i % 4],
            content: (
              <Link href={`/services/${category.slug}`} className="group block">
                <div className="text-foreground flex items-center justify-between">
                  <IndexMarker n={i + 1} />
                  <Icon name={category.icon} />
                </div>
                <h2 className="type-h3 text-foreground group-hover:text-muted mt-fib-13 transition-colors">
                  {category.name[locale]}
                </h2>
                <p className="type-body text-muted mt-1">{category.tagline[locale]}</p>
              </Link>
            ),
          }))}
        />
      </div>
    </Reveal>
  );
}
