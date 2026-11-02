import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/brand/icon";
import { Reveal } from "@/components/brand/reveal";
import { Strata } from "@/components/brand/strata";
import { SurfaceLine } from "@/components/brand/surface-line";
import { JsonLd } from "@/components/site/json-ld";
import { RichText } from "@/components/site/rich-text";
import { SiteImage } from "@/components/site/site-image";
import { CtaLink, SectionHeading } from "@/components/site/ui";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getProjectPage, getPublicSlugs, getSetting, PLACEHOLDER_SLUG } from "@/lib/site/data";
import { localizeDigits } from "@/lib/site/digits";
import { localeUrl, pageMetadata, siteOrigin } from "@/lib/site/seo";

export async function generateStaticParams() {
  const { projects } = await getPublicSlugs();
  return projects.length ? projects.map(({ slug }) => ({ slug })) : [{ slug: PLACEHOLDER_SLUG }];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/work/[slug]">) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const data = await getProjectPage(slug);
  if (!data) return {};
  const { project } = data;
  return pageMetadata({
    locale,
    path: `/work/${slug}`,
    title: t(project.seoTitle, locale) || t(project.title, locale),
    description: t(project.seoDescription, locale) || t(project.summary, locale),
    image: data.ogImage ?? data.cover,
    type: "article",
  });
}

async function CaseStudy({ params }: { params: PageProps<"/[locale]/work/[slug]">["params"] }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const tW = await getTranslations("site.work");
  const tNav = await getTranslations("nav");
  const [data, localeSettings] = await Promise.all([getProjectPage(slug), getSetting("locale")]);
  if (!data) notFound();
  const { project, cover, categories, services, gallery, results, credits, next } = data;
  const digits = localeSettings.arabicDigits;
  const title = t(project.title, locale);
  const client = t(project.clientName, locale);

  const facts = [
    client && { label: tW("client"), value: client },
    project.year && { label: tW("year"), value: <bdi>{localizeDigits(project.year, locale, digits)}</bdi> },
    categories.length && {
      label: tW("categories"),
      value: categories.map((c, i) => (
        <span key={c.slug}>
          {i ? " · " : ""}
          <Link href={`/services/${c.slug}`} className="underline-offset-4 hover:underline">
            {t(c.name, locale)}
          </Link>
        </span>
      )),
    },
    services.length && { label: tW("services"), value: services.map((s) => t(s.name, locale)).join(" · ") },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[];

  return (
    <article className="space-y-fib-89">
      {data.isDraft ? (
        <div className="bg-inverse text-on-inverse">
          <div className="container-site flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span>{tW("draft")}</span>
            <a href={`/api/draft/disable?to=/${locale}/work`} className="underline underline-offset-4">
              {tW("exitPreview")}
            </a>
          </div>
        </div>
      ) : null}

      <Reveal as="header" className="container-site pt-fib-55">
        <SectionHeading as="h1" size="h1" label={client || tW("label")} heading={title} />
        {t(project.summary, locale) ? (
          <p className="type-body-lg text-muted reveal-rise mt-fib-21 max-w-3xl">{t(project.summary, locale)}</p>
        ) : null}
        <SurfaceLine className="mt-fib-55" />
        <dl className="grid gap-fib-21 pt-fib-21 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="reveal-settle">
              <dt className="type-label text-label">{fact.label}</dt>
              <dd className="type-body text-foreground mt-1">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      {cover ? (
        <div className="container-site">
          <div className="bg-inverse relative aspect-[16/9] overflow-hidden">
            <SiteImage image={cover} locale={locale} priority sizes="(min-width: 1440px) 1248px, 100vw" />
          </div>
        </div>
      ) : null}

      <section className="container-site grid gap-fib-55 lg:grid-cols-12">
        <RichText value={project.body} locale={locale} className="lg:col-span-8" />
        {project.externalUrl ? (
          <div className="lg:col-span-3 lg:col-start-10">
            <a
              href={project.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="type-button text-foreground border-line-strong inline-flex items-center gap-2 border-b pb-1"
            >
              {tW("visit")}
              <Icon name="arrow-up-right" size={16} />
            </a>
          </div>
        ) : null}
      </section>

      {gallery.length ? (
        <section className="container-site" aria-label={tW("gallery")}>
          <ul className="grid gap-fib-21 md:grid-cols-2">
            {gallery.map((item, i) => (
              <li key={item.media!.id} className={i % 3 === 0 ? "md:col-span-2" : undefined}>
                <figure>
                  <div
                    className={`bg-inverse relative overflow-hidden ${i % 3 === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}
                  >
                    <SiteImage
                      image={item.media!}
                      locale={locale}
                      sizes={i % 3 === 0 ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
                    />
                  </div>
                  {t(item.caption, locale) ? (
                    <figcaption className="type-label text-label mt-fib-8">{t(item.caption, locale)}</figcaption>
                  ) : null}
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.length ? (
        <Reveal as="section" className="container-site">
          <SectionHeading label={tW("results")} />
          <SurfaceLine className="mt-fib-21" />
          <Strata count={2} />
          <dl className="grid gap-fib-34 pt-fib-21 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((result, i) => (
              <div key={i} className="reveal-settle flex flex-col-reverse gap-1">
                <dt className="type-label text-label">{t(result.label, locale)}</dt>
                <dd className="type-h1 text-foreground font-mono tabular-nums">
                  <bdi>{localizeDigits(result.value, locale, digits)}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      ) : null}

      {credits.length ? (
        <section className="container-site">
          <SectionHeading label={tW("credits")} />
          <ul className="border-line-strong mt-fib-21 border-t">
            {credits.map((credit, i) => (
              <li
                key={i}
                className="border-line flex flex-wrap items-baseline justify-between gap-2 border-b py-fib-13"
              >
                {credit.slug ? (
                  <Link href={`/team/${credit.slug}`} className="type-h4 text-foreground hover:text-muted">
                    {t(credit.name, locale)}
                  </Link>
                ) : (
                  <span className="type-h4 text-foreground">{t(credit.name, locale)}</span>
                )}
                <span className="type-label text-label">{t(credit.role, locale)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="container-site flex flex-wrap items-center justify-between gap-fib-21">
        {next ? (
          <Link href={`/work/${next.slug}`} className="group">
            <span className="type-label text-label block">{tW("next")}</span>
            <span className="type-h3 text-foreground group-hover:text-muted mt-1 inline-flex items-center gap-2">
              {t(next.title, locale)}
              <Icon name="arrow-right" size={22} />
            </span>
          </Link>
        ) : (
          <span />
        )}
        <CtaLink href="/contact">{tNav("cta")}</CtaLink>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: title,
          description: t(project.summary, locale) || undefined,
          url: localeUrl(locale, `/work/${project.slug}`),
          inLanguage: locale,
          dateCreated: project.year ? String(project.year) : undefined,
          image: cover?.url,
          creator: { "@type": "Organization", "@id": `${siteOrigin()}/#organization`, name: "RADIX" },
          ...(client ? { sourceOrganization: { "@type": "Organization", name: client } } : {}),
          keywords: categories.map((c) => t(c.name, "en")).join(", ") || undefined,
        }}
      />
    </article>
  );
}

export default function ProjectPage(props: PageProps<"/[locale]/work/[slug]">) {
  return (
    <Suspense fallback={<div className="container-site min-h-[60vh] pt-fib-55" />}>
      <CaseStudy params={props.params} />
    </Suspense>
  );
}
