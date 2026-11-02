import { CoreLines } from "@/components/brand/core-lines";
import { Icon, type IconName } from "@/components/brand/icon";
import { formatIndex, IndexMarker } from "@/components/brand/index-marker";
import { Reveal } from "@/components/brand/reveal";
import { Strata } from "@/components/brand/strata";
import { SurfaceLine } from "@/components/brand/surface-line";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { t, type Localized } from "@/lib/localized";
import type { PublicCategory, PublicProjectCard, PublicTeamCard } from "@/lib/site/data";
import { localizeDigits } from "@/lib/site/digits";
import { ProjectCard, TeamCard } from "./cards";
import { CtaLink, SectionHeading } from "./ui";

type Digits = "western" | "arabic-indic";

export function StandardHero({
  copy,
  locale,
}: {
  copy: { label: Localized; headline: Localized; body: Localized; primaryCta: Localized; secondaryCta: Localized };
  locale: Locale;
}) {
  return (
    <Reveal as="section" className="container-site pt-fib-55 pb-fib-55">
      {t(copy.label, locale) ? <p className="type-label text-label reveal-rise">{t(copy.label, locale)}</p> : null}
      <div className="grid gap-fib-34 pt-fib-21 lg:grid-cols-12 lg:items-end">
        <h1 className="type-display text-foreground reveal-lift text-balance lg:col-span-8">
          {t(copy.headline, locale)}
        </h1>
        <div className="reveal-rise space-y-fib-21 lg:col-span-4">
          {t(copy.body, locale) ? <p className="type-body-lg text-muted">{t(copy.body, locale)}</p> : null}
          <div className="flex flex-wrap gap-3">
            {t(copy.primaryCta, locale) ? <CtaLink href="/contact">{t(copy.primaryCta, locale)}</CtaLink> : null}
            {t(copy.secondaryCta, locale) ? (
              <CtaLink href="/services" variant="secondary">
                {t(copy.secondaryCta, locale)}
              </CtaLink>
            ) : null}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/** The four pillars, opened by the surface line, strata and core lines (surface first, foundation second). */
export function PillarsSection({
  copy,
  categories,
  locale,
  digits,
  allLabel,
}: {
  copy: { label: Localized; heading: Localized };
  categories: (PublicCategory & { index: number })[];
  locale: Locale;
  digits: Digits;
  allLabel: string;
}) {
  if (!categories.length) return null;
  return (
    <Reveal as="section" className="container-site">
      {t(copy.heading, locale) ? (
        <SectionHeading label={t(copy.label, locale)} heading={t(copy.heading, locale)} className="pb-fib-34" />
      ) : null}
      <SurfaceLine />
      <div className="relative">
        <Strata count={5} className="absolute inset-x-0 top-0" />
        <CoreLines
          className="relative"
          columns={categories.length >= 4 ? 4 : categories.length === 3 ? 3 : 2}
          nodes={categories.map((category, i) => ({
            depth: [55, 89, 55, 89][i % 4],
            content: (
              <Link href={`/services/${category.slug}`} className="group block">
                <div className="text-foreground flex items-center justify-between">
                  <IndexMarker n={localizeDigits(formatIndex(category.index), locale, digits)} />
                  <Icon name={category.iconKey as IconName} />
                </div>
                <h3 className="type-h3 text-foreground group-hover:text-muted mt-fib-13 transition-colors">
                  {t(category.name, locale)}
                </h3>
                <p className="type-body text-muted mt-1">{t(category.tagline, locale)}</p>
              </Link>
            ),
          }))}
        />
      </div>
      <div className="pt-fib-21">
        <CtaLink href="/services" variant="secondary">
          {allLabel}
        </CtaLink>
      </div>
    </Reveal>
  );
}

export function PositioningSection({
  copy,
  locale,
}: {
  copy: { label: Localized; heading: Localized; disciplines: Localized[] };
  locale: Locale;
}) {
  if (!t(copy.heading, locale)) return null;
  return (
    <Reveal as="section" className="container-site">
      <div className="grid gap-fib-55 lg:grid-cols-12">
        <SectionHeading label={t(copy.label, locale)} heading={t(copy.heading, locale)} className="lg:col-span-6" />
        {copy.disciplines.length ? (
          <ul className="border-line-strong reveal-settle border-t lg:col-span-5 lg:col-start-8">
            {copy.disciplines.map((discipline, i) => (
              <li key={i} className="border-line flex items-center justify-between gap-4 border-b py-fib-13">
                <span className="type-body text-foreground">{t(discipline, locale)}</span>
                <span aria-hidden className="bg-accent h-px w-fib-34 shrink-0" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Reveal>
  );
}

export function FeaturedWorkSection({
  copy,
  projects,
  categoryNames,
  locale,
  digits,
  allLabel,
}: {
  copy: { label: Localized; heading: Localized };
  projects: PublicProjectCard[];
  categoryNames: Map<string, string>;
  locale: Locale;
  digits: Digits;
  allLabel: string;
}) {
  if (!projects.length) return null;
  return (
    <Reveal as="section" className="container-site">
      <div className="flex flex-wrap items-end justify-between gap-fib-21 pb-fib-34">
        <SectionHeading label={t(copy.label, locale)} heading={t(copy.heading, locale) || undefined} />
        <CtaLink href="/work" variant="secondary">
          {allLabel}
        </CtaLink>
      </div>
      <div className="reveal-settle grid gap-fib-34 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.slug}
            project={project}
            locale={locale}
            digits={digits}
            categoryNames={project.categoryIds
              .map((id) => categoryNames.get(id))
              .filter((n): n is string => Boolean(n))}
          />
        ))}
      </div>
    </Reveal>
  );
}

export function ProcessSection({
  copy,
  steps,
  locale,
  digits,
}: {
  copy: { label: Localized; heading: Localized };
  steps: { title: Localized; description: Localized }[];
  locale: Locale;
  digits: Digits;
}) {
  const shown = steps.filter((step) => t(step.title, locale));
  if (!shown.length) return null;
  return (
    <Reveal as="section" className="container-site">
      <SectionHeading
        label={t(copy.label, locale)}
        heading={t(copy.heading, locale) || undefined}
        className="pb-fib-34"
      />
      <SurfaceLine />
      <CoreLines
        columns={shown.length >= 4 ? 4 : shown.length === 3 ? 3 : 2}
        nodes={shown.map((step, i) => ({
          depth: 34 + i * 21,
          content: (
            <>
              <IndexMarker n={localizeDigits(formatIndex(i + 1), locale, digits)} />
              <h3 className="type-h3 text-foreground mt-2">{t(step.title, locale)}</h3>
              {t(step.description, locale) ? (
                <p className="type-body text-muted mt-2">{t(step.description, locale)}</p>
              ) : null}
            </>
          ),
        }))}
      />
    </Reveal>
  );
}

export function TeamPreviewSection({
  copy,
  team,
  locale,
  allLabel,
}: {
  copy: { label: Localized; heading: Localized };
  team: PublicTeamCard[];
  locale: Locale;
  allLabel: string;
}) {
  if (!team.length) return null;
  return (
    <Reveal as="section" className="container-site">
      <div className="flex flex-wrap items-end justify-between gap-fib-21 pb-fib-34">
        <SectionHeading label={t(copy.label, locale)} heading={t(copy.heading, locale) || undefined} />
        <CtaLink href="/team" variant="secondary">
          {allLabel}
        </CtaLink>
      </div>
      <div className="reveal-settle grid grid-cols-2 gap-fib-21 lg:grid-cols-4">
        {team.map((member) => (
          <TeamCard key={member.slug} member={member} locale={locale} />
        ))}
      </div>
    </Reveal>
  );
}

/** Closing call to action on the inverse ground (keeps the dark/light rhythm in both themes). */
export function ClosingCta({ copy, locale }: { copy: { statement: Localized; cta: Localized }; locale: Locale }) {
  if (!t(copy.statement, locale)) return null;
  return (
    <Reveal as="section" className="scope-inverse">
      <div className="container-site py-fib-89">
        <p className="type-h1 reveal-rise max-w-3xl text-balance">{t(copy.statement, locale)}</p>
        {t(copy.cta, locale) ? (
          <div className="reveal-rise mt-fib-34">
            <CtaLink href="/contact">{t(copy.cta, locale)}</CtaLink>
          </div>
        ) : null}
      </div>
      <SurfaceLine />
    </Reveal>
  );
}
