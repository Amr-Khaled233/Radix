"use client";

import { useTranslations } from "next-intl";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("error");
  return (
    <section className="container-site py-fib-89">
      <p className="type-label text-label mb-fib-21">{t("label")}</p>
      <h1 className="type-h1 text-foreground">{t("title")}</h1>
      <p className="type-body-lg text-muted mt-fib-21 max-w-xl">{t("body")}</p>
      <button
        type="button"
        onClick={reset}
        className="type-button bg-accent text-on-accent mt-fib-34 inline-flex min-h-12 items-center px-6"
      >
        {t("retry")}
      </button>
    </section>
  );
}
