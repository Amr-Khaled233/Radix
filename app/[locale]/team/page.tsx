import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/brand/reveal";
import { TeamCard } from "@/components/site/cards";
import { SectionHeading } from "@/components/site/ui";
import type { Locale } from "@/lib/i18n/routing";
import { getVisibleTeam } from "@/lib/site/data";
import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const tT = await getTranslations("site.team");
  return pageMetadata({ locale, path: "/team", title: tT("title"), description: tT("intro") });
}

export default async function TeamPage() {
  const locale = (await getLocale()) as Locale;
  const tT = await getTranslations("site.team");
  const team = await getVisibleTeam();
  // The Team section is off until at least one member is visible.
  if (!team.length) notFound();

  return (
    <div className="container-site space-y-fib-55 pt-fib-55">
      <Reveal>
        <SectionHeading as="h1" size="h1" label={tT("label")} heading={tT("title")} />
        <p className="type-body-lg text-muted reveal-rise mt-fib-21 max-w-2xl">{tT("intro")}</p>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-fib-21 gap-y-fib-55 lg:grid-cols-4">
        {team.map((member) => (
          <TeamCard key={member.slug} member={member} locale={locale} />
        ))}
      </div>
    </div>
  );
}
