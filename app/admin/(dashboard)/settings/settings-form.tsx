"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FormSection, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { MediaPicker } from "@/components/admin/media/media-picker";
import { uiIcon } from "@/components/admin/ui-icon";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LINK_TYPES } from "@/lib/admin/schemas";
import { completeness, type Localized } from "@/lib/localized";
import type { MediaItem } from "@/lib/media/types";
import type { SettingsValue } from "@/lib/settings/schemas";
import { saveSiteSettings } from "./actions";

type Initial = {
  general: SettingsValue<"general">;
  seo: SettingsValue<"seo">;
  contact: SettingsValue<"contact">;
  locale: SettingsValue<"locale">;
};

type FormValues = Omit<Initial, "contact"> & { notificationEmails: string };

export function SettingsForm({ initial, ogImage }: { initial: Initial; ogImage: MediaItem | null }) {
  const t = useTranslations("admin");
  const { run, pending } = useAction();
  const [og, setOg] = useState<MediaItem | null>(ogImage);
  const [emailError, setEmailError] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      general: initial.general,
      seo: initial.seo,
      locale: initial.locale,
      notificationEmails: initial.contact.notificationEmails.join("\n"),
    },
  });
  const { register, control, formState } = form;
  const socials = useFieldArray({ control, name: "general.socials" });
  const watched = useWatch({ control });

  const submit = form.handleSubmit((values) => {
    const emails = values.notificationEmails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.some((e) => !z.email().safeParse(e).success)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    return run(
      () =>
        saveSiteSettings({
          general: values.general,
          seo: { ...values.seo, defaultOgImageId: og?.id ?? null },
          contact: { notificationEmails: emails },
          locale: values.locale,
        }),
      { onSuccess: () => form.reset(values) },
    );
  });

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      <FormSection title={t("settings.general")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label={t("settings.email")} type="email" dir="ltr" optional {...register("general.email")} />
          <TextInput label={t("settings.phone")} type="tel" dir="ltr" optional {...register("general.phone")} />
        </div>
        <LocaleTabs completeness={completeness([(watched.general?.address ?? { en: "", ar: "" }) as Localized])}>
          {(l) => <TextArea label={t("settings.address")} optional rows={2} {...register(`general.address.${l}`)} />}
        </LocaleTabs>
        <div className="space-y-2">
          <p className="text-foreground text-sm font-semibold">{t("settings.socials")}</p>
          {socials.fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
              <Controller
                control={control}
                name={`general.socials.${index}.type`}
                render={({ field: f }) => (
                  <Select value={f.value} onValueChange={f.onChange}>
                    <SelectTrigger aria-label={t("settings.socialType")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`team.linkTypes.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Input
                type="url"
                dir="ltr"
                placeholder="https://"
                aria-label={t("settings.socialUrl")}
                {...register(`general.socials.${index}.url`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("actions.remove")}
                onClick={() => socials.remove(index)}
              >
                <Trash2 {...uiIcon} size={14} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => socials.append({ type: "linkedin", url: "" })}
          >
            <Plus {...uiIcon} size={14} />
            {t("settings.addSocial")}
          </Button>
        </div>
      </FormSection>

      <FormSection title={t("settings.seo")}>
        <TextInput
          label={t("settings.titleTemplate")}
          hint={t("settings.titleTemplateHint")}
          dir="ltr"
          {...register("seo.titleTemplate")}
        />
        <LocaleTabs
          completeness={completeness([
            (watched.seo?.defaultTitle ?? { en: "", ar: "" }) as Localized,
            (watched.seo?.defaultDescription ?? { en: "", ar: "" }) as Localized,
          ])}
        >
          {(l) => (
            <>
              <TextInput label={t("settings.defaultTitle")} {...register(`seo.defaultTitle.${l}`)} />
              <TextArea
                label={t("settings.defaultDescription")}
                rows={3}
                {...register(`seo.defaultDescription.${l}`)}
              />
            </>
          )}
        </LocaleTabs>
        <MediaPicker
          label={t("settings.defaultOgImage")}
          value={og}
          onChange={(item) => {
            setOg(item);
            form.setValue("seo.defaultOgImageId", item?.id ?? null, { shouldDirty: true });
          }}
        />
      </FormSection>

      <FormSection title={t("settings.notifications")}>
        <TextArea
          label={t("settings.notificationEmails")}
          hint={t("settings.notificationEmailsHint")}
          rows={3}
          dir="ltr"
          error={emailError ? t("settings.invalidEmails") : undefined}
          {...register("notificationEmails")}
        />
      </FormSection>

      <FormSection title={t("settings.localeSection")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="locale.defaultLocale"
            render={({ field }) => (
              <div className="space-y-1.5">
                <p className="text-foreground text-sm font-semibold">{t("settings.defaultLocale")}</p>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label={t("settings.defaultLocale")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("locale.en")}</SelectItem>
                    <SelectItem value="ar">{t("locale.ar")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted text-sm">{t("settings.defaultLocaleHint")}</p>
              </div>
            )}
          />
          <Controller
            control={control}
            name="locale.arabicDigits"
            render={({ field }) => (
              <div className="space-y-1.5">
                <p className="text-foreground text-sm font-semibold">{t("settings.digits")}</p>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label={t("settings.digits")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="western">{t("settings.digitsWestern")}</SelectItem>
                    <SelectItem value="arabic-indic">{t("settings.digitsArabic")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </div>
      </FormSection>

      <FormSection title={t("settings.analytics")}>
        <Controller
          control={control}
          name="general.analyticsEnabled"
          render={({ field }) => (
            <Toggle
              label={t("settings.analyticsToggle")}
              hint={t("settings.analyticsHint")}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </FormSection>

      <div className="bg-background/95 border-line sticky bottom-0 z-10 flex items-center gap-3 border-t py-4">
        <Button type="submit" disabled={pending}>
          {pending ? t("actions.saving") : t("actions.save")}
        </Button>
        <UnsavedGuard dirty={formState.isDirty} />
      </div>
    </form>
  );
}
