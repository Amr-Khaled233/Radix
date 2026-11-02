import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Reveal } from "@/components/brand/reveal";
import { SurfaceLine } from "@/components/brand/surface-line";
import { RichText } from "@/components/site/rich-text";
import { SectionHeading } from "@/components/site/ui";
import type { Locale } from "@/lib/i18n/routing";
import { t, tRich } from "@/lib/localized";
import { getSetting } from "@/lib/site/data";
import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const legal = await getSetting("legal");
  return pageMetadata({ locale, path: "/privacy", title: t(legal.privacyTitle, locale) });
}

export default async function PrivacyPage() {
  const locale = (await getLocale()) as Locale;
  const tP = await getTranslations("site.privacy");
  const format = await getFormatter();
  const legal = await getSetting("legal");
  const hasBody = Boolean(tRich(legal.privacyBody, locale)?.content?.length);

  return (
    <div className="container-site pt-fib-55">
      <Reveal>
        <SectionHeading as="h1" size="h1" heading={t(legal.privacyTitle, locale)} />
        {legal.updatedAt ? (
          <p className="type-label text-label reveal-rise mt-fib-13">
            {tP("updated", { date: format.dateTime(new Date(legal.updatedAt), { dateStyle: "long" }) })}
          </p>
        ) : null}
        <SurfaceLine className="mt-fib-34" />
      </Reveal>
      <div className="max-w-3xl pt-fib-34">
        {hasBody ? (
          <RichText value={legal.privacyBody} locale={locale} />
        ) : (
          <p className="type-body text-muted">{tP("empty")}</p>
        )}
      </div>
    </div>
  );
}
