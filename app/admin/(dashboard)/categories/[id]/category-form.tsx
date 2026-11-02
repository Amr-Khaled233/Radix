"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormSection, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { IconPicker } from "@/components/admin/icon-picker";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { MediaPicker } from "@/components/admin/media/media-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { uiIcon } from "@/components/admin/ui-icon";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";
import { useAction } from "@/components/admin/use-action";
import { useFieldError } from "@/components/admin/use-field-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { categories } from "@/lib/db/schema";
import { categoryFormSchema } from "@/lib/admin/schemas";
import { completeness } from "@/lib/localized";
import type { MediaItem } from "@/lib/media/types";
import { deleteCategory, updateCategory } from "../actions";

type Values = z.input<typeof categoryFormSchema>;

type CategoryFormProps = {
  category: typeof categories.$inferSelect;
  ogImage: MediaItem | null;
  serviceCount: number;
  projectCount: number;
  permissions: { toggle: boolean; delete: boolean };
};

export function CategoryForm({ category, ogImage, serviceCount, projectCount, permissions }: CategoryFormProps) {
  const t = useTranslations("admin");
  const fieldError = useFieldError();
  const router = useRouter();
  const { run, pending } = useAction();
  const [og, setOg] = useState<MediaItem | null>(ogImage);

  const form = useForm<Values>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      slug: category.slug,
      name: category.name,
      tagline: category.tagline,
      description: category.description,
      iconKey: category.iconKey,
      isVisible: category.isVisible,
      showInNav: category.showInNav,
      showOnHome: category.showOnHome,
      arReviewed: !category.arNeedsReview,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      ogImageId: category.ogImageId,
    },
  });
  const { register, control, formState } = form;
  const watched = useWatch({ control });
  const status = completeness([watched.name ?? { en: "", ar: "" }, watched.tagline ?? { en: "", ar: "" }] as {
    en: string;
    ar: string;
  }[]);

  const submit = form.handleSubmit((values) =>
    run(() => updateCategory(category.id, values), { onSuccess: () => form.reset(values) }),
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <FormSection title={t("categories.content")}>
        <LocaleTabs completeness={status}>
          {(locale) => (
            <>
              <TextInput
                label={t("categories.name")}
                error={fieldError(formState.errors.name?.[locale])}
                {...register(`name.${locale}`)}
              />
              <TextInput label={t("categories.tagline")} {...register(`tagline.${locale}`)} />
              <Controller
                control={control}
                name={`description.${locale}`}
                render={({ field }) => (
                  <RichTextEditor
                    label={t("categories.descriptionField")}
                    locale={locale}
                    value={field.value ?? null}
                    onChange={field.onChange}
                  />
                )}
              />
            </>
          )}
        </LocaleTabs>
        <Controller
          control={control}
          name="arReviewed"
          render={({ field }) => (
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
              <span>
                <span className="text-foreground block font-semibold">{t("locale.markReviewed")}</span>
                <span className="text-muted block">{t("locale.markReviewedHint")}</span>
              </span>
            </label>
          )}
        />
      </FormSection>

      <FormSection title={t("categories.icon")}>
        <Controller
          control={control}
          name="iconKey"
          render={({ field }) => (
            <IconPicker label={t("categories.icon")} value={field.value} onChange={field.onChange} />
          )}
        />
        <TextInput
          label={t("fields.slug")}
          hint={t("fields.slugHint")}
          dir="ltr"
          error={fieldError(formState.errors.slug)}
          {...register("slug")}
        />
      </FormSection>

      <FormSection title={t("categories.visibility")}>
        {(["isVisible", "showInNav", "showOnHome"] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <Toggle
                label={t(`fields.${name === "isVisible" ? "visible" : name}`)}
                checked={field.value}
                disabled={!permissions.toggle}
                onCheckedChange={field.onChange}
              />
            )}
          />
        ))}
      </FormSection>

      <FormSection title={t("categories.seo")}>
        <LocaleTabs
          completeness={completeness([(watched.seoTitle ?? { en: "", ar: "" }) as { en: string; ar: string }])}
        >
          {(locale) => (
            <>
              <TextInput label={t("fields.seoTitle")} optional {...register(`seoTitle.${locale}`)} />
              <TextArea
                label={t("fields.seoDescription")}
                optional
                rows={3}
                {...register(`seoDescription.${locale}`)}
              />
            </>
          )}
        </LocaleTabs>
        <MediaPicker
          label={t("fields.ogImage")}
          value={og}
          onChange={(item) => {
            setOg(item);
            form.setValue("ogImageId", item?.id ?? null, { shouldDirty: true });
          }}
        />
      </FormSection>

      <div className="bg-background/95 border-line sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t py-4">
        <Button type="submit" disabled={pending}>
          {pending ? t("actions.saving") : t("actions.save")}
        </Button>
        <Button asChild variant="outline">
          <Link href={`/en/services/${category.slug}`} target="_blank">
            <ExternalLink {...uiIcon} size={16} className="rtl:-scale-x-100" />
            {t("categories.preview")}
          </Link>
        </Button>
        <UnsavedGuard dirty={formState.isDirty} />
        {permissions.delete ? (
          <div className="ms-auto">
            <ConfirmDialog
              title={t("categories.deleteTitle")}
              trigger={
                <Button type="button" variant="destructive">
                  {t("actions.delete")}
                </Button>
              }
              description={t("categories.deleteWithProjects", {
                name: category.name.en,
                services: serviceCount,
                projects: projectCount,
              })}
              onConfirm={() =>
                run(() => deleteCategory(category.id), {
                  success: "deleted",
                  onSuccess: () => router.replace("/admin/categories"),
                })
              }
            />
          </div>
        ) : null}
      </div>
    </form>
  );
}
