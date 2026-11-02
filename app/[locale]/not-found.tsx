import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Strata } from "@/components/brand/strata";
import { Link } from "@/lib/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <section className="container-site py-fib-89">
      <div className="grid items-end gap-fib-55 md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="type-label text-label mb-fib-21">{t("label")}</p>
          <h1 className="type-h1 text-foreground">{t("title")}</h1>
          <p className="type-body-lg text-muted mt-fib-21 max-w-xl">{t("body")}</p>
          <Link
            href="/"
            className="type-button bg-accent text-on-accent mt-fib-34 inline-flex min-h-12 items-center px-6"
          >
            {t("back")}
          </Link>
        </div>
        <div className="text-foreground md:col-span-4 md:col-start-9">
          <Logo variant="vertical" height={200} className="md:ms-auto" />
        </div>
      </div>
      <div className="bg-line-strong full-bleed mt-fib-55 h-0.5" aria-hidden />
      <Strata count={4} />
    </section>
  );
}
