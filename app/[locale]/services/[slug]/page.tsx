import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { formatIndex, IndexMarker } from "@/components/brand/index-marker";
import { Reveal } from "@/components/brand/reveal";
import { Strata } from "@/components/brand/strata";
import { SurfaceLine } from "@/components/brand/surface-line";
import { ProjectCard } from "@/components/site/cards";
import { RichText } from "@/components/site/rich-text";
import { CtaLink, SectionHeading } from "@/components/site/ui";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getCategoryPage, getPublicSlugs, getSetting, PLACEHOLDER_SLUG } from "@/lib/site/data";
import { localizeDigits } from "@/lib/site/digits";
import { projectPath } from "@/lib/site/paths";
import { pageMetadata } from "@/lib/site/seo";

export async function generateStaticParams() {
  const { categories } = await getPublicSlugs();
  return categories.length ? categories.map(({ slug }) => ({ slug })) : [{ slug: PLACEHOLDER_SLUG }];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/services/[slug]">) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const data = await getCategoryPage(slug);
  if (!data) return {};
  const { category } = data;
  return pageMetadata({
    locale,
    path: `/services/${slug}`,
    title: t(category.seoTitle, locale) || t(category.name, locale),
    description: t(category.seoDescription, locale) || t(category.tagline, locale),
    image: data.ogImage,
  });
}

async function CategoryContent({ params }: { params: PageProps<"/[locale]/services/[slug]">["params"] }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const tS = await getTranslations("site.services");
  const [data, localeSettings] = await Promise.all([getCategoryPage(slug), getSetting("locale")]);
  if (!data) notFound();
  const { category, services, projects } = data;
  const digits = localeSettings.arabicDigits;
  const name = t(category.name, locale);

  return (
    <div className="space-y-fib-89">
      <Reveal as="section" className="container-site pt-fib-55">
        <div className="text-foreground flex items-center gap-fib-21">
          <IndexMarker n={localizeDigits(formatIndex(category.index), locale, digits)} size="large" />
          <Icon name={category.iconKey as IconName} size={32} />
        </div>
        <SectionHeading as="h1" size="display" heading={name} className="mt-fib-13" />
        <p className="type-h3 text-muted reveal-rise mt-fib-13">{t(category.tagline, locale)}</p>
        <SurfaceLine className="mt-fib-55" />
        <Strata count={3} />
        <RichText value={category.description} locale={locale} className="reveal-settle mt-fib-21 max-w-3xl" />
      </Reveal>

      {services.length ? (
        <Reveal as="section" className="container-site">
          <SectionHeading label={tS("servicesHeading")} />
          <ul className="border-line-strong mt-fib-21 grid border-t sm:grid-cols-2">
            {services.map((service, i) => (
              <li
                key={service.id}
                className="border-line reveal-settle flex gap-fib-21 border-b py-fib-21 sm:odd:pe-fib-34"
              >
                <span className="type-label text-label w-8 shrink-0 tabular-nums">
                  <bdi>{localizeDigits(formatIndex(i + 1), locale, digits)}</bdi>
                </span>
                <span>
                  <span className="type-h4 text-foreground block">{t(service.name, locale)}</span>
                  {t(service.description, locale) ? (
                    <span className="type-body text-muted block">{t(service.description, locale)}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}

      {projects.length ? (
        <Reveal as="section" className="container-site">
          <SectionHeading label={tS("projectsHeading")} />
          <div className="reveal-settle mt-fib-34 grid gap-fib-34 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                href={projectPath(slug, project.slug)}
                locale={locale}
                digits={digits}
              />
            ))}
          </div>
        </Reveal>
      ) : null}

      <section className="container-site">
        <CtaLink href="/contact">{tS("cta", { name })}</CtaLink>
      </section>
    </div>
  );
}

export default function CategoryPage(props: PageProps<"/[locale]/services/[slug]">) {
  return (
    <Suspense fallback={<div className="container-site min-h-[60vh] pt-fib-55" />}>
      <CategoryContent params={props.params} />
    </Suspense>
  );
}
