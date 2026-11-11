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
import { getCategoryPage, getProjectPage, getPublicSlugs, getSetting, PLACEHOLDER_SLUG } from "@/lib/site/data";
import { projectPath } from "@/lib/site/paths";
import { localizeDigits } from "@/lib/site/digits";
import { localeUrl, pageMetadata, siteOrigin } from "@/lib/site/seo";

// A case study unknown at build time renders on its first request (then cached) instead of
// streaming a generic shell: the header needs the full URL (language switch).
export const instant = false;

type Params = PageProps<"/[locale]/services/[slug]/[project]">["params"];

/** Case studies are pre-rendered under their primary pillar; other pillars render on demand. */
export async function generateStaticParams({ params }: { params: { slug: string } }) {
  const { projects } = await getPublicSlugs();
  const own = projects.filter((p) => p.pillarSlug === params.slug);
  return own.length ? own.map(({ slug }) => ({ project: slug })) : [{ project: PLACEHOLDER_SLUG }];
}

/** The project, if it belongs to this pillar (a case study can sit under each of its pillars). */
async function projectIn(pillar: string, slug: string) {
  const data = await getProjectPage(slug);
  return data && data.categories.some((c) => c.slug === pillar) ? data : null;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug: pillar, project: slug } = await params;
  const locale = (await getLocale()) as Locale;
  const data = await projectIn(pillar, slug);
  if (!data) return {};
  const { project } = data;
  return pageMetadata({
    locale,
    // Canonical: the primary pillar.
    path: projectPath(data.categories[0].slug, slug),
    title: t(project.seoTitle, locale) || t(project.title, locale),
    description: t(project.seoDescription, locale) || t(project.summary, locale),
    image: data.ogImage ?? data.cover,
    type: "article",
  });
}

async function CaseStudy({ params }: { params: Params }) {
  const { slug: pillar, project: slug } = await params;
  const locale = (await getLocale()) as Locale;
  const tW = await getTranslations("site.work");
  const tNav = await getTranslations("nav");
  const [data, pillarPage, localeSettings] = await Promise.all([
    projectIn(pillar, slug),
    getCategoryPage(pillar),
    getSetting("locale"),
  ]);
  if (!data || !pillarPage) notFound();
  const { project, cover, categories, services, gallery, results, credits } = data;
  // Next case study within the same pillar, in the pillar page's order.
  const siblings = pillarPage.projects.filter((p) => p.status === "published");
  const position = siblings.findIndex((p) => p.slug === slug);
  const nextProject = siblings.length > 1 && position >= 0 ? siblings[(position + 1) % siblings.length] : null;
  const pillarName = t(pillarPage.category.name, locale);
  const digits = localeSettings.arabicDigits;
  const title = t(project.title, locale);
  const client = t(project.clientName, locale);

  type GalleryMedia = NonNullable<(typeof gallery)[number]["media"]>;
  const isUpright = ({ width, height }: GalleryMedia) => Boolean(width && height && width / height < 1.2);
  // Screen recordings: the visitor starts them (no autoplay). "#t=0.1" makes Safari show the first frame.
  const videoOf = (m: GalleryMedia) => (
    <video
      src={`${m.url}#t=0.1`}
      controls
      muted
      playsInline
      preload="metadata"
      aria-label={t(m.alt, locale) || title}
      className="block h-auto w-full"
    />
  );
  const walkthroughs = gallery.length > 0 && gallery.every((item) => item.media!.kind === "video");

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
            <a href={`/api/draft/disable?to=/${locale}/services/${pillar}`} className="underline underline-offset-4">
              {tW("exitPreview")}
            </a>
          </div>
        </div>
      ) : null}

      <Reveal as="header" className="container-site pt-fib-55">
        <SectionHeading as="h1" size="h1" label={client || pillarName} heading={title} />
        {t(project.summary, locale) ? (
          <p className="type-body-lg text-muted reveal-rise mt-fib-21 max-w-3xl">{t(project.summary, locale)}</p>
        ) : null}
        {project.externalUrl ? (
          // The live site: the most useful thing on the page for a website case study.
          <a
            href={project.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="lift-button type-button bg-accent text-on-accent hover:bg-inverse hover:text-on-inverse mt-fib-34 inline-flex min-h-12 items-center gap-2 px-6"
          >
            {tW("visit")}
            <Icon name="arrow-up-right" size={18} />
            <span className="sr-only">{tW("opensNewTab")}</span>
          </a>
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
          <div className="bg-inverse relative aspect-video overflow-hidden">
            <SiteImage image={cover} locale={locale} priority sizes="(min-width: 1440px) 1248px, 100vw" />
          </div>
        </div>
      ) : null}

      <section className="container-site grid gap-fib-55 lg:grid-cols-12">
        <RichText value={project.body} locale={locale} className="lg:col-span-8" />
      </section>

      {walkthroughs ? (
        // Screen recordings only: the desktop walkthrough and, beside it, the phone one.
        <section className="container-site" aria-labelledby="walkthroughs">
          <h2 id="walkthroughs" className="type-label text-label">
            {tW("walkthroughs")}
          </h2>
          <ul className="mt-fib-34 grid items-start gap-fib-34 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
            {gallery.map((item) => {
              const upright = isUpright(item.media!);
              return (
                <li key={item.media!.id} className={upright ? "mx-auto w-full max-w-xs lg:max-w-none" : undefined}>
                  <figure>
                    <p className="type-label text-label mb-fib-13">{upright ? tW("onPhone") : tW("onDesktop")}</p>
                    <div className="bg-inverse overflow-hidden">{videoOf(item.media!)}</div>
                    {t(item.caption, locale) ? (
                      <figcaption className="text-muted mt-fib-13 text-sm">{t(item.caption, locale)}</figcaption>
                    ) : null}
                  </figure>
                </li>
              );
            })}
          </ul>
        </section>
      ) : gallery.length ? (
        <section className="container-site" aria-label={tW("gallery")}>
          {/* Natural aspect ratios (never cropped): wide images span the row, upright ones pair up
              (dense flow lets a later upright image fill the gap beside an earlier one). */}
          <ul className="grid items-start gap-fib-21 md:grid-flow-dense md:grid-cols-2">
            {gallery.map((item) => {
              // Phone recordings and screenshots (upright) pair up; desktop ones span the row.
              const wide = !isUpright(item.media!);
              return (
                <li key={item.media!.id} className={wide ? "md:col-span-2" : undefined}>
                  <figure>
                    <div className="bg-inverse overflow-hidden">
                      {item.media!.kind === "video" ? (
                        videoOf(item.media!)
                      ) : (
                        <SiteImage
                          image={item.media!}
                          locale={locale}
                          fill={false}
                          className="h-auto w-full"
                          sizes={wide ? "(min-width: 1440px) 1248px, 100vw" : "(min-width: 768px) 50vw, 100vw"}
                        />
                      )}
                    </div>
                    {t(item.caption, locale) ? (
                      <figcaption className="text-muted mt-fib-8 max-w-2xl text-sm">
                        {t(item.caption, locale)}
                      </figcaption>
                    ) : null}
                  </figure>
                </li>
              );
            })}
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
        {nextProject && nextProject.slug !== slug ? (
          <Link href={projectPath(pillar, nextProject.slug)} className="group">
            <span className="type-label text-label block">{tW("next")}</span>
            <span className="type-h3 text-foreground group-hover:text-muted mt-1 inline-flex items-center gap-2">
              {t(nextProject.title, locale)}
              <Icon name="arrow-right" size={22} />
            </span>
          </Link>
        ) : (
          <Link href={`/services/${pillar}`} className="group">
            <span className="type-label text-label block">{tW("backTo")}</span>
            <span className="type-h3 text-foreground group-hover:text-muted mt-1 inline-flex items-center gap-2">
              {pillarName}
              <Icon name="arrow-right" size={22} />
            </span>
          </Link>
        )}
        <CtaLink href="/contact">{tNav("cta")}</CtaLink>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: title,
          description: t(project.summary, locale) || undefined,
          url: localeUrl(locale, projectPath(categories[0].slug, project.slug)),
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

export default function ProjectPage(props: PageProps<"/[locale]/services/[slug]/[project]">) {
  return (
    <Suspense fallback={<div className="container-site min-h-[60vh] pt-fib-55" />}>
      <CaseStudy params={props.params} />
    </Suspense>
  );
}
