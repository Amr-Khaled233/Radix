import { getLocale, getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { formatIndex, IndexMarker } from "@/components/brand/index-marker";
import { Reveal } from "@/components/brand/reveal";
import { SurfaceLine } from "@/components/brand/surface-line";
import { SectionHeading } from "@/components/site/ui";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getCategoryPage, getSetting, getVisibleCategories } from "@/lib/site/data";
import { localizeDigits } from "@/lib/site/digits";
import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const tS = await getTranslations("site.services");
  const tNav = await getTranslations("nav");
  return pageMetadata({ locale, path: "/services", title: tNav("services"), description: tS("intro") });
}

export default async function ServicesPage() {
  const locale = (await getLocale()) as Locale;
  const tS = await getTranslations("site.services");
  const [categories, localeSettings] = await Promise.all([getVisibleCategories(), getSetting("locale")]);
  const details = await Promise.all(categories.map((c) => getCategoryPage(c.slug)));

  return (
    <div className="space-y-fib-89">
      <Reveal as="section" className="container-site pt-fib-55">
        <SectionHeading as="h1" size="h1" label={tS("label")} heading={tS("title")} />
        <p className="type-body-lg text-muted reveal-rise mt-fib-21 max-w-2xl">{tS("intro")}</p>
      </Reveal>

      {categories.length ? (
        <Reveal as="section" className="container-site">
          <SurfaceLine />
          <div className="grid gap-x-fib-34 gap-y-fib-55 pt-fib-34 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, i) => {
              const services = details[i]?.services ?? [];
              return (
                <article
                  key={category.slug}
                  className="reveal-settle flex flex-col"
                  style={{ ["--stagger" as string]: `${i * 80}ms` }}
                >
                  <div className="text-foreground flex items-center justify-between">
                    <IndexMarker n={localizeDigits(formatIndex(i + 1), locale, localeSettings.arabicDigits)} />
                    <Icon name={category.iconKey as IconName} />
                  </div>
                  <h2 className="type-h3 text-foreground mt-fib-13">
                    <Link href={`/services/${category.slug}`} className="hover:text-muted transition-colors">
                      {t(category.name, locale)}
                    </Link>
                  </h2>
                  <p className="type-label text-label mt-1">{t(category.tagline, locale)}</p>
                  <ul className="mt-fib-21 flex-1 space-y-1.5">
                    {services.map((service) => (
                      <li key={service.id} className="type-body text-foreground">
                        {t(service.name, locale)}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/services/${category.slug}`}
                    className="type-button text-foreground border-line-strong mt-fib-21 inline-flex items-center gap-2 self-start border-b pb-1"
                  >
                    {tS("explore", { name: t(category.name, locale) })}
                    <Icon name="arrow-right" size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
        </Reveal>
      ) : (
        <p className="container-site text-muted">{tS("empty")}</p>
      )}
    </div>
  );
}
