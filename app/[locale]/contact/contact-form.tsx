"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Icon } from "@/components/brand/icon";
import { contactSchema, type ContactInput } from "@/lib/site/contact-schema";
import { cn } from "@/lib/cn";
import { submitContact } from "./actions";

type Option = { id: string; name: string };

const inputClass =
  "bg-surface text-foreground border-line-strong type-body block min-h-12 w-full border px-3 py-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 aria-invalid:border-2";

export function ContactForm({ categories }: { categories: Option[] }) {
  const t = useTranslations("site.contact");
  const locale = useLocale() as "en" | "ar";
  const [status, setStatus] = useState<"idle" | "sent" | "rateLimited" | "server">("idle");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", company: "", phone: "", message: "", categoryIds: [], website: "", locale },
  });
  const selected = useWatch({ control, name: "categoryIds" }) ?? [];

  const onSubmit = handleSubmit(async (values) => {
    setStatus("idle");
    const result = await submitContact({ ...values, locale });
    if (result.ok) {
      setStatus("sent");
      reset();
      return;
    }
    if (result.error === "validation") {
      for (const [field, message] of Object.entries(result.fields)) setError(field as keyof ContactInput, { message });
      return;
    }
    setStatus(result.error);
  });

  const error = (message?: string) => (message ? t(`errors.${message}` as "errors.name") : null);

  if (status === "sent") {
    return (
      <div role="status" className="border-line-strong border-t-2 pt-fib-21">
        <p className="type-h3 text-foreground">{t("successTitle")}</p>
        <p className="type-body-lg text-muted mt-fib-13">{t("successBody")}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="type-button text-foreground mt-fib-21 underline underline-offset-4"
        >
          {t("another")}
        </button>
      </div>
    );
  }

  const field = (
    name: "name" | "email" | "company" | "phone",
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    optional = false,
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={`contact-${name}`} className="type-button text-foreground block">
        {label}
        {optional ? <span className="text-muted ms-2 font-normal">({t("optional")})</span> : null}
      </label>
      <input
        id={`contact-${name}`}
        className={inputClass}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `contact-${name}-error` : undefined}
        {...props}
        {...register(name)}
      />
      {errors[name] ? (
        <p id={`contact-${name}-error`} className="type-body text-foreground text-sm font-semibold">
          {error(errors[name]?.message)}
        </p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-fib-21">
      {status === "rateLimited" || status === "server" ? (
        <p role="alert" className="border-foreground type-body text-foreground border-s-2 ps-4 font-semibold">
          {t(`errors.${status}`)}
        </p>
      ) : null}
      <div className="grid gap-fib-21 sm:grid-cols-2">
        {field("name", t("name"), { autoComplete: "name" })}
        {field("email", t("email"), { type: "email", autoComplete: "email", dir: "ltr" })}
        {field("company", t("company"), { autoComplete: "organization" }, true)}
        {field("phone", t("phone"), { type: "tel", autoComplete: "tel", dir: "ltr" }, true)}
      </div>

      {categories.length ? (
        <fieldset>
          <legend className="type-button text-foreground">
            {t("interests")} <span className="text-muted ms-2 font-normal">({t("optional")})</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((category) => {
              const on = selected.includes(category.id);
              return (
                <label
                  key={category.id}
                  className={cn(
                    "type-button inline-flex min-h-11 cursor-pointer items-center gap-2 border px-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                    on ? "bg-inverse text-on-inverse border-inverse" : "border-line-strong text-foreground",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={(e) =>
                      setValue(
                        "categoryIds",
                        e.target.checked ? [...selected, category.id] : selected.filter((id) => id !== category.id),
                      )
                    }
                  />
                  {on ? <Icon name="check" size={16} /> : null}
                  {category.name}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="contact-message" className="type-button text-foreground block">
          {t("message")}
        </label>
        <textarea
          id="contact-message"
          rows={6}
          dir="auto"
          className={cn(inputClass, "min-h-40")}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          {...register("message")}
        />
        {errors.message ? (
          <p id="contact-message-error" className="type-body text-foreground text-sm font-semibold">
            {error(errors.message.message)}
          </p>
        ) : null}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden className="absolute -inset-s-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting || undefined}
        className="type-button bg-accent text-on-accent hover:bg-inverse hover:text-on-inverse inline-flex min-h-12 items-center gap-2 px-6 transition-colors disabled:opacity-70"
      >
        {isSubmitting ? t("sending") : t("submit")}
        {!isSubmitting ? <Icon name="arrow-right" size={18} /> : null}
      </button>
    </form>
  );
}
