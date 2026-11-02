import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Reveal } from "@/components/brand/reveal";
import { ProjectCard } from "@/components/site/cards";
import { SectionHeading } from "@/components/site/ui";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getPublishedProjects, getSetting, getVisibleCategories } from "@/lib/site/data";
import { pageMetadata } from "@/lib/site/seo";
import { cn } from "@/lib/cn";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const tW = await getTranslations("site.work");
  return pageMetadata({ locale, path: "/work", title: tW("title"), description: tW("intro") });
}

async function WorkGrid({ searchParams }: { searchParams: PageProps<"/[locale]/work">["searchParams"] }) {
  const locale = (await getLocale()) as Locale;
  const tW = await getTranslations("site.work");
  const { category } = await searchParams;
  const [projects, categories, localeSettings] = await Promise.all([
    getPublishedProjects(),
    getVisibleCategories(),
    getSetting("locale"),
  ]);
  const active = categories.find((c) => c.slug === category) ?? null;
  const names = new Map(categories.map((c) => [c.id, t(c.name, locale)]));
  const shown = active ? projects.filter((p) => p.categoryIds.includes(active.id)) : projects;

  return (
    // Same minimum height as the Suspense fallback, so the footer doesn't jump when this streams in.
    <div className="min-h-96">
      {projects.length && categories.length ? (
        <nav aria-label={tW("filter")} className="border-line flex flex-wrap gap-x-fib-21 gap-y-2 border-b pb-fib-13">
          {[
            { slug: null, label: tW("all") },
            ...categories.map((c) => ({ slug: c.slug, label: t(c.name, locale) })),
          ].map((item) => {
            const current = (item.slug ?? null) === (active?.slug ?? null);
            return (
              <Link
                key={item.slug ?? "all"}
                href={item.slug ? { pathname: "/work", query: { category: item.slug } } : "/work"}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "type-button -mb-[calc(var(--spacing-fib-13)+1px)] border-b-2 pb-fib-13 transition-colors",
                  current ? "border-accent text-foreground" : "text-muted hover:text-foreground border-transparent",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
      {shown.length ? (
        <div className="mt-fib-34 grid gap-x-fib-34 gap-y-fib-55 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((project, i) => (
            <ProjectCard
              key={project.slug}
              project={project}
              locale={locale}
              digits={localeSettings.arabicDigits}
              priority={i < 3}
              categoryNames={project.categoryIds.map((id) => names.get(id)).filter((n): n is string => Boolean(n))}
            />
          ))}
        </div>
      ) : (
        <p className="border-line text-muted mt-fib-34 border border-dashed p-fib-34">
          {projects.length ? tW("emptyFiltered") : tW("empty")}
        </p>
      )}
    </div>
  );
}

export default async function WorkPage(props: PageProps<"/[locale]/work">) {
  const tW = await getTranslations("site.work");
  return (
    <div className="container-site space-y-fib-55 pt-fib-55">
      <Reveal>
        <SectionHeading as="h1" size="h1" label={tW("label")} heading={tW("title")} />
        <p className="type-body-lg text-muted reveal-rise mt-fib-21 max-w-2xl">{tW("intro")}</p>
      </Reveal>
      <Suspense fallback={<div className="min-h-96" />}>
        <WorkGrid searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
