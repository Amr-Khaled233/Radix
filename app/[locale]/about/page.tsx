import { getLocale, getTranslations } from "next-intl/server";
import { CoreLines } from "@/components/brand/core-lines";
import { formatIndex, IndexMarker } from "@/components/brand/index-marker";
import { Reveal } from "@/components/brand/reveal";
import { Strata } from "@/components/brand/strata";
import { SurfaceLine } from "@/components/brand/surface-line";
import { TeamCard } from "@/components/site/cards";
import { SectionHeading } from "@/components/site/ui";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getSetting, getVisibleTeam } from "@/lib/site/data";
import { localizeDigits } from "@/lib/site/digits";
import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const tNav = await getTranslations("nav");
  const about = await getSetting("about");
  return pageMetadata({
    locale,
    path: "/about",
    title: tNav("about"),
    description: t(about?.intro?.statement, locale),
  });
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default async function AboutPage() {
  const locale = (await getLocale()) as Locale;
  const tA = await getTranslations("site.about");
  const [about, team, localeSettings] = await Promise.all([
    getSetting("about"),
    getVisibleTeam(),
    getSetting("locale"),
  ]);
  const digits = localeSettings.arabicDigits;
  if (!about) return null;
  const idx = (n: number) => localizeDigits(formatIndex(n), locale, digits);

  return (
    <div className="space-y-fib-144">
      {/* Introduction */}
      <Reveal as="section" className="container-site pt-fib-55">
        <SectionHeading as="h1" size="h1" label={tA("label")} heading={t(about.intro.statement, locale)} />
        <SurfaceLine className="mt-fib-55" />
        <Strata count={3} />
        <p className="type-body-lg text-muted reveal-settle mt-fib-21 max-w-2xl">{t(about.intro.body, locale)}</p>
      </Reveal>

      {/* The meaning behind RADIX */}
      <Reveal as="section" className="scope-dark">
        <div className="container-site grid gap-fib-55 py-fib-89 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="type-label text-label">{t(about.meaning.label, locale)}</p>
            <p className="type-display reveal-lift mt-fib-21" lang="en" dir="ltr">
              {about.meaning.word.en || t(about.meaning.word, locale)}
            </p>
            {locale === "ar" && about.meaning.word.ar ? (
              <p className="type-h3 text-muted mt-2">{about.meaning.word.ar}</p>
            ) : null}
            <p className="type-body-lg text-muted mt-fib-21 max-w-xl">{t(about.meaning.body, locale)}</p>
          </div>
          <ul className="border-line-strong reveal-settle border-t lg:col-span-5 lg:col-start-8">
            {about.meaning.points.map((point, i) => (
              <li key={i} className="border-line border-b py-fib-21">
                <p className="type-label text-label">{LETTERS[i]}</p>
                <p className="type-h4 mt-1">{t(point.title, locale)}</p>
                <p className="type-body text-muted">{t(point.body, locale)}</p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* Brand essence */}
      <Reveal as="section" className="container-site">
        <SectionHeading
          label={t(about.essence.label, locale) || tA("essence")}
          heading={t(about.essence.headline, locale)}
          size="display"
        />
        <SurfaceLine className="mt-fib-34" />
        <Strata count={4} />
        <p className="type-body-lg text-muted reveal-settle mt-fib-21 max-w-xl lg:ms-auto">
          {t(about.essence.body, locale)}
        </p>
      </Reveal>

      {/* Core idea: outcome above the surface, foundations below */}
      <Reveal as="section" className="container-site">
        <SectionHeading label={tA("coreIdea")} heading={t(about.coreIdea.headline, locale)} className="pb-fib-21" />
        <SurfaceLine label={tA("surface")} />
        <CoreLines
          nodes={about.coreIdea.pillars.map((pillar, i) => ({
            depth: [55, 89, 55, 89][i % 4],
            content: (
              <>
                <p className="type-h3 text-foreground">{t(pillar.title, locale)}</p>
                <p className="type-body text-muted mt-1">{t(pillar.body, locale)}</p>
              </>
            ),
          }))}
        />
      </Reveal>

      {/* Purpose, vision, mission */}
      <Reveal as="section" className="container-site">
        <ul className="border-line-strong border-t">
          {(["purpose", "vision", "mission"] as const).map((key) => (
            <li key={key} className="border-line reveal-settle grid gap-fib-13 border-b py-fib-34 md:grid-cols-12">
              <p className="type-label text-label md:col-span-3">{tA(key)}</p>
              <p className={`text-foreground md:col-span-9 ${key === "purpose" ? "type-h3" : "type-body-lg"}`}>
                {t(about[key], locale)}
              </p>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* Brand promise */}
      <Reveal as="section" className="container-site">
        <p className="type-label text-label">{tA("promise")}</p>
        <ul className="border-line-strong mt-fib-21 border-t">
          {about.promise.map((item, i) => (
            <li
              key={i}
              className="border-line reveal-rise grid items-baseline gap-fib-13 border-b py-fib-21 md:grid-cols-12"
            >
              <p className="type-label text-label md:col-span-2">{t(item.title, locale)}</p>
              <p className="type-h1 text-foreground md:col-span-10">{t(item.line, locale)}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* Values */}
      <Reveal as="section" className="scope-dark">
        <div className="container-site py-fib-89">
          <SectionHeading label={tA("values")} />
          <ul className="mt-fib-34 grid gap-x-fib-34 gap-y-fib-55 sm:grid-cols-2 lg:grid-cols-3">
            {about.values.map((value, i) => (
              <li
                key={i}
                className="border-line-strong reveal-settle border-t pt-fib-21"
                style={{ ["--stagger" as string]: `${i * 80}ms` }}
              >
                <IndexMarker n={idx(i + 1)} />
                <p className="type-h4 mt-fib-13">{t(value.title, locale)}</p>
                <p className="type-body text-muted mt-1">{t(value.body, locale)}</p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* Personality */}
      <Reveal as="section" className="container-site grid gap-fib-55 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="type-label text-label">{tA("is")}</p>
          <p className="type-h2 text-foreground reveal-rise mt-fib-13">{t(about.personality.is, locale)}</p>
        </div>
        <div className="border-line border-s ps-fib-34 lg:col-span-4 lg:col-start-9">
          <p className="type-label text-label">{tA("isNot")}</p>
          <p className="type-body-lg text-muted mt-fib-13">{t(about.personality.isNot, locale)}</p>
        </div>
      </Reveal>

      {/* The problem + audiences */}
      <Reveal as="section" className="container-site grid gap-fib-55 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading label={t(about.problem.label, locale)} heading={t(about.problem.headline, locale)} />
          <p className="type-body-lg text-muted mt-fib-21">{t(about.problem.body, locale)}</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p className="type-label text-label">{tA("audiences")}</p>
          <ul className="border-line-strong mt-fib-13 border-t">
            {about.audiences.map((audience, i) => (
              <li key={i} className="border-line reveal-settle grid grid-cols-[2rem_1fr] gap-fib-13 border-b py-fib-21">
                <span className="type-label text-label">{LETTERS[i]}</span>
                <span>
                  <span className="type-h4 text-foreground block">{t(audience.title, locale)}</span>
                  <span className="type-body text-muted block">{t(audience.body, locale)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* Brand narrative */}
      <Reveal as="section" className="container-site grid gap-fib-55 lg:grid-cols-12">
        <h2 className="type-h2 text-foreground reveal-rise text-balance lg:col-span-5">
          {t(about.narrative.headline, locale)}
        </h2>
        <div className="reveal-settle space-y-fib-21 lg:col-span-6 lg:col-start-7">
          {about.narrative.paragraphs.map((paragraph, i) => (
            <p key={i} className="type-body-lg text-muted">
              {t(paragraph, locale)}
            </p>
          ))}
        </div>
      </Reveal>

      {team.length ? (
        <Reveal as="section" className="container-site">
          <SectionHeading label={tA("team")} />
          <div className="dim-scope mt-fib-34 grid grid-cols-2 gap-fib-21 lg:grid-cols-4">
            {team.map((member) => (
              <TeamCard key={member.slug} member={member} locale={locale} />
            ))}
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}
