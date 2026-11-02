import { getLocale, getTranslations } from "next-intl/server";
import { Reveal } from "@/components/brand/reveal";
import { SurfaceLine } from "@/components/brand/surface-line";
import { SectionHeading } from "@/components/site/ui";
import type { Locale } from "@/lib/i18n/routing";
import { t } from "@/lib/localized";
import { getSetting, getVisibleCategories } from "@/lib/site/data";
import { pageMetadata } from "@/lib/site/seo";
import { ContactForm } from "./contact-form";

export async function generateMetadata() {
  const locale = (await getLocale()) as Locale;
  const tC = await getTranslations("site.contact");
  return pageMetadata({ locale, path: "/contact", title: tC("title"), description: tC("intro") });
}

export default async function ContactPage() {
  const locale = (await getLocale()) as Locale;
  const tC = await getTranslations("site.contact");
  const [categories, general] = await Promise.all([getVisibleCategories(), getSetting("general")]);
  const address = t(general.address, locale);

  return (
    <div className="container-site pt-fib-55">
      <Reveal>
        <SectionHeading as="h1" size="h1" label={tC("label")} heading={tC("title")} />
        <p className="type-body-lg text-muted reveal-rise mt-fib-21 max-w-2xl">{tC("intro")}</p>
        <SurfaceLine className="mt-fib-55" />
      </Reveal>
      <div className="grid gap-fib-55 pt-fib-34 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm categories={categories.map((c) => ({ id: c.id, name: t(c.name, locale) }))} />
        </div>
        {general.email || general.phone || address ? (
          <aside className="lg:col-span-4 lg:col-start-9">
            <p className="type-label text-label">{tC("details")}</p>
            <ul className="mt-fib-13 space-y-fib-13">
              {general.email ? (
                <li>
                  <span className="type-label text-label block">{tC("email")}</span>
                  <a
                    href={`mailto:${general.email}`}
                    className="type-h4 text-foreground underline-offset-4 hover:underline"
                  >
                    <bdi dir="ltr">{general.email}</bdi>
                  </a>
                </li>
              ) : null}
              {general.phone ? (
                <li>
                  <span className="type-label text-label block">{tC("phone")}</span>
                  <a
                    href={`tel:${general.phone.replace(/[^+\d]/g, "")}`}
                    className="type-h4 text-foreground underline-offset-4 hover:underline"
                  >
                    <bdi dir="ltr">{general.phone}</bdi>
                  </a>
                </li>
              ) : null}
              {address ? <li className="type-body text-muted whitespace-pre-line">{address}</li> : null}
            </ul>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
