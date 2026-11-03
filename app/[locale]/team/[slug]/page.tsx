import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/brand/icon";
import { Reveal } from "@/components/brand/reveal";
import { SurfaceLine } from "@/components/brand/surface-line";
import { JsonLd } from "@/components/site/json-ld";
import { RichText } from "@/components/site/rich-text";
import { SiteImage } from "@/components/site/site-image";
import { SectionHeading } from "@/components/site/ui";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getPublicSlugs, getTeamMemberPage, PLACEHOLDER_SLUG } from "@/lib/site/data";
import { projectPath } from "@/lib/site/paths";
import { localeUrl, pageMetadata, siteOrigin } from "@/lib/site/seo";

export async function generateStaticParams() {
  const { team } = await getPublicSlugs();
  return team.length ? team.map(({ slug }) => ({ slug })) : [{ slug: PLACEHOLDER_SLUG }];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/team/[slug]">) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const data = await getTeamMemberPage(slug);
  if (!data) return {};
  return pageMetadata({
    locale,
    path: `/team/${slug}`,
    title: t(data.member.name, locale),
    description: t(data.member.shortBio, locale) || t(data.member.role, locale),
    image: data.photo,
    type: "profile",
  });
}

const LINK_LABELS: Record<string, string> = {
  website: "Website",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  behance: "Behance",
  dribbble: "Dribbble",
  x: "X",
  github: "GitHub",
};

async function MemberContent({ params }: { params: PageProps<"/[locale]/team/[slug]">["params"] }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const tT = await getTranslations("site.team");
  const data = await getTeamMemberPage(slug);
  if (!data) notFound();
  const { member, photo, expertise, work } = data;
  const name = t(member.name, locale);

  return (
    <article className="container-site space-y-fib-89 pt-fib-55">
      <Reveal as="header" className="grid gap-fib-55 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Link href="/team" className="type-label text-label hover:text-foreground inline-flex items-center gap-2">
            <Icon name="arrow-right" size={14} className="-scale-x-100 rtl:scale-x-100" />
            {tT("back")}
          </Link>
          <SectionHeading as="h1" size="h1" heading={name} className="mt-fib-21" />
          <p className="type-label text-label reveal-rise mt-fib-13">{t(member.role, locale)}</p>
          {t(member.shortBio, locale) ? (
            <p className="type-body-lg text-muted reveal-rise mt-fib-21">{t(member.shortBio, locale)}</p>
          ) : null}
        </div>
        {photo ? (
          <div className="bg-inverse relative aspect-square overflow-hidden lg:col-span-4 lg:col-start-9">
            <SiteImage image={photo} locale={locale} priority sizes="(min-width: 1024px) 33vw, 100vw" decorative />
          </div>
        ) : null}
      </Reveal>

      <SurfaceLine />

      <div className="grid gap-fib-55 lg:grid-cols-12">
        <RichText value={member.bio} locale={locale} className="lg:col-span-7" />
        <aside className="space-y-fib-34 lg:col-span-4 lg:col-start-9">
          {expertise.length ? (
            <div>
              <p className="type-label text-label">{tT("expertise")}</p>
              <ul className="mt-fib-13 space-y-1">
                {expertise.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/services/${c.slug}`}
                      className="type-body text-foreground underline-offset-4 hover:underline"
                    >
                      {t(c.name, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {member.links.length || member.email ? (
            <div>
              <p className="type-label text-label">{tT("links")}</p>
              <ul className="mt-fib-13 space-y-1">
                {member.email ? (
                  <li>
                    <a
                      href={`mailto:${member.email}`}
                      className="type-body text-foreground underline-offset-4 hover:underline"
                    >
                      <bdi dir="ltr">{member.email}</bdi>
                    </a>
                  </li>
                ) : null}
                {member.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="type-body text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      {LINK_LABELS[link.type] ?? new URL(link.url).hostname}
                      <Icon name="arrow-up-right" size={14} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {work.length ? (
        <section>
          <SectionHeading label={tT("work")} />
          <ul className="border-line-strong mt-fib-21 border-t">
            {work.map((project) => (
              <li key={project.slug} className="border-line border-b">
                <Link
                  href={projectPath(project.pillarSlug, project.slug)}
                  className="group flex flex-wrap items-baseline justify-between gap-2 py-fib-13"
                >
                  <span className="type-h4 text-foreground group-hover:text-muted">{t(project.title, locale)}</span>
                  <span className="type-label text-label">{t(project.role, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name,
          jobTitle: t(member.role, locale) || undefined,
          url: localeUrl(locale, `/team/${member.slug}`),
          image: photo?.url,
          worksFor: { "@type": "Organization", "@id": `${siteOrigin()}/#organization`, name: "RADIX" },
          sameAs: member.links.map((l) => l.url),
        }}
      />
    </article>
  );
}

export default function TeamMemberPage(props: PageProps<"/[locale]/team/[slug]">) {
  return (
    <Suspense fallback={<div className="container-site min-h-[60vh] pt-fib-55" />}>
      <MemberContent params={props.params} />
    </Suspense>
  );
}
