"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormSection, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { MediaPicker } from "@/components/admin/media/media-picker";
import { MediaThumb } from "@/components/admin/media/media-thumb";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SortableList } from "@/components/admin/sortable-list";
import { uiIcon } from "@/components/admin/ui-icon";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";
import { useAction } from "@/components/admin/use-action";
import { useFieldError } from "@/components/admin/use-field-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectFormSchema, PROJECT_STATUSES } from "@/lib/admin/schemas";
import type { projects } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/routing";
import { completeness, t as localized, type Localized } from "@/lib/localized";
import type { MediaItem } from "@/lib/media/types";
import { deleteProject, duplicateProject, updateProject } from "../actions";

type Values = z.input<typeof projectFormSchema>;
type Project = Omit<typeof projects.$inferSelect, "publishedAt"> & { publishedAt: string | null };

type ProjectFormProps = {
  project: Project;
  initial: Pick<Values, "categoryIds" | "serviceIds" | "gallery" | "results" | "team">;
  media: MediaItem[];
  options: {
    categories: { id: string; name: Localized }[];
    services: { id: string; name: Localized; categoryId: string }[];
    members: { id: string; name: Localized }[];
  };
  permissions: { publish: boolean; delete: boolean; locked: boolean };
};

const emptyL = { en: "", ar: "" };

export function ProjectForm({ project, initial, media, options, permissions }: ProjectFormProps) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const fieldError = useFieldError();
  const router = useRouter();
  const { run, pending } = useAction();
  const [mediaById, setMediaById] = useState(() => new Map(media.map((m) => [m.id, m])));
  const remember = (item: MediaItem) => setMediaById((prev) => new Map(prev).set(item.id, item));

  const form = useForm<Values>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      slug: project.slug,
      title: project.title,
      clientName: project.clientName,
      summary: project.summary,
      body: project.body,
      coverImageId: project.coverImageId,
      year: project.year,
      externalUrl: project.externalUrl ?? "",
      status: project.status,
      isFeatured: project.isFeatured,
      publishedAt: project.publishedAt,
      seoTitle: project.seoTitle,
      seoDescription: project.seoDescription,
      ogImageId: project.ogImageId,
      arReviewed: !project.arNeedsReview,
      ...initial,
    },
    disabled: permissions.locked,
  });
  const { register, control, formState, setValue } = form;
  const gallery = useFieldArray({ control, name: "gallery" });
  const results = useFieldArray({ control, name: "results" });
  const team = useFieldArray({ control, name: "team" });
  const watched = useWatch({ control });

  const status = completeness([(watched.title ?? emptyL) as Localized, (watched.summary ?? emptyL) as Localized]);
  const selectedCategories = useMemo(() => watched.categoryIds ?? [], [watched.categoryIds]);
  const availableServices = useMemo(
    () => options.services.filter((s) => selectedCategories.includes(s.categoryId)),
    [options.services, selectedCategories],
  );

  const submit = form.handleSubmit((values) =>
    run(() => updateProject(project.id, values), {
      onSuccess: () => form.reset(values),
      onError: (result) => {
        if (result.error === "validation" && values.gallery.length) form.setError("gallery", { message: "altMissing" });
      },
    }),
  );

  const toggleIn = (list: string[], value: string, on: boolean) =>
    on ? [...new Set([...list, value])] : list.filter((v) => v !== value);

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <FormSection title={t("projects.content")}>
            <LocaleTabs completeness={status}>
              {(l) => (
                <>
                  <TextInput
                    label={t("projects.titleField")}
                    error={fieldError(formState.errors.title?.[l])}
                    {...register(`title.${l}`)}
                  />
                  <TextInput label={t("projects.client")} {...register(`clientName.${l}`)} />
                  <TextArea label={t("projects.summary")} rows={3} {...register(`summary.${l}`)} />
                  <Controller
                    control={control}
                    name={`body.${l}`}
                    render={({ field }) => (
                      <RichTextEditor
                        label={t("projects.body")}
                        locale={l}
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
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    disabled={field.disabled}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="text-foreground block font-semibold">{t("locale.markReviewed")}</span>
                    <span className="text-muted block">{t("locale.markReviewedHint")}</span>
                  </span>
                </label>
              )}
            />
          </FormSection>

          <FormSection title={t("projects.media")}>
            <Controller
              control={control}
              name="coverImageId"
              render={({ field }) => (
                <MediaPicker
                  label={t("projects.cover")}
                  value={field.value ? (mediaById.get(field.value) ?? null) : null}
                  onChange={(item) => {
                    if (item) remember(item);
                    field.onChange(item?.id ?? null);
                  }}
                />
              )}
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-foreground text-sm font-semibold">{t("projects.gallery")}</p>
                <MediaPicker
                  label=""
                  value={null}
                  onChange={(item) => {
                    if (!item) return;
                    remember(item);
                    gallery.append({ mediaId: item.id, caption: emptyL });
                  }}
                />
              </div>
              {gallery.fields.length ? (
                <SortableList
                  items={gallery.fields}
                  onReorder={(next) => gallery.replace(next.map(({ id: _id, ...rest }) => rest))}
                  renderItem={(field) => {
                    const index = gallery.fields.findIndex((f) => f.id === field.id);
                    const item = mediaById.get(field.mediaId);
                    return (
                      <div className="flex items-start gap-3">
                        <div className="w-24 shrink-0">
                          {item ? <MediaThumb item={item} className="aspect-video w-full" /> : null}
                        </div>
                        <div className="grid flex-1 gap-2 sm:grid-cols-2">
                          <Input
                            placeholder={`${t("projects.caption")} (EN)`}
                            dir="ltr"
                            {...register(`gallery.${index}.caption.en`)}
                          />
                          <Input
                            placeholder={`${t("projects.caption")} (AR)`}
                            dir="rtl"
                            lang="ar"
                            {...register(`gallery.${index}.caption.ar`)}
                          />
                          {item && item.kind === "image" && (!item.alt.en || !item.alt.ar) ? (
                            <p className="text-warning text-xs sm:col-span-2">{t("validation.altMissing")}</p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("actions.remove")}
                          onClick={() => gallery.remove(index)}
                        >
                          <Trash2 {...uiIcon} size={14} />
                        </Button>
                      </div>
                    );
                  }}
                />
              ) : (
                <p className="text-muted text-sm">{t("projects.noGallery")}</p>
              )}
              {formState.errors.gallery?.message ? (
                <p className="text-danger text-sm font-semibold">{fieldError(formState.errors.gallery)}</p>
              ) : null}
            </div>
          </FormSection>

          <FormSection title={t("projects.results")} description={t("projects.resultsHint")}>
            {results.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[120px_1fr_1fr_auto]">
                <Input
                  placeholder={t("projects.resultValue")}
                  dir="ltr"
                  aria-label={t("projects.resultValue")}
                  {...register(`results.${index}.value`)}
                />
                <Input
                  placeholder={`${t("projects.resultLabel")} (EN)`}
                  dir="ltr"
                  {...register(`results.${index}.label.en`)}
                />
                <Input
                  placeholder={`${t("projects.resultLabel")} (AR)`}
                  dir="rtl"
                  lang="ar"
                  {...register(`results.${index}.label.ar`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("actions.remove")}
                  onClick={() => results.remove(index)}
                >
                  <Trash2 {...uiIcon} size={14} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => results.append({ value: "", label: emptyL })}
            >
              <Plus {...uiIcon} size={14} />
              {t("projects.addResult")}
            </Button>
          </FormSection>

          <FormSection title={t("projects.team")}>
            {options.members.length === 0 ? (
              <p className="text-muted text-sm">{t("projects.noTeam")}</p>
            ) : (
              <>
                {team.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <Controller
                      control={control}
                      name={`team.${index}.teamMemberId`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange} disabled={f.disabled}>
                          <SelectTrigger aria-label={t("projects.member")}>
                            <SelectValue placeholder={t("projects.member")} />
                          </SelectTrigger>
                          <SelectContent>
                            {options.members.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {localized(m.name, locale)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Input
                      placeholder={`${t("projects.creditRole")} (EN)`}
                      dir="ltr"
                      {...register(`team.${index}.role.en`)}
                    />
                    <Input
                      placeholder={`${t("projects.creditRole")} (AR)`}
                      dir="rtl"
                      lang="ar"
                      {...register(`team.${index}.role.ar`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("actions.remove")}
                      onClick={() => team.remove(index)}
                    >
                      <Trash2 {...uiIcon} size={14} />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => team.append({ teamMemberId: options.members[0].id, role: emptyL })}
                >
                  <Plus {...uiIcon} size={14} />
                  {t("projects.addCredit")}
                </Button>
              </>
            )}
          </FormSection>

          <FormSection title={t("projects.seo")}>
            <LocaleTabs completeness={completeness([(watched.seoTitle ?? emptyL) as Localized])}>
              {(l) => (
                <>
                  <TextInput label={t("fields.seoTitle")} optional {...register(`seoTitle.${l}`)} />
                  <TextArea label={t("fields.seoDescription")} optional rows={3} {...register(`seoDescription.${l}`)} />
                </>
              )}
            </LocaleTabs>
            <Controller
              control={control}
              name="ogImageId"
              render={({ field }) => (
                <MediaPicker
                  label={t("fields.ogImage")}
                  value={field.value ? (mediaById.get(field.value) ?? null) : null}
                  onChange={(item) => {
                    if (item) remember(item);
                    field.onChange(item?.id ?? null);
                  }}
                />
              )}
            />
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title={t("projects.publishing")}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <p className="text-foreground text-sm font-semibold">{t("projects.statusField")}</p>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!permissions.publish || field.disabled}
                  >
                    <SelectTrigger aria-label={t("projects.statusField")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`projects.status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <Toggle
                  label={t("projects.featured")}
                  checked={field.value}
                  disabled={!permissions.publish || field.disabled}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <TextInput label={t("projects.publishedAt")} type="date" optional {...register("publishedAt")} />
            <TextInput
              label={t("fields.slug")}
              hint={t("fields.slugHint")}
              dir="ltr"
              error={fieldError(formState.errors.slug)}
              {...register("slug")}
            />
          </FormSection>

          <FormSection title={t("projects.classification")}>
            <fieldset className="space-y-2">
              <legend className="text-foreground text-sm font-semibold">{t("projects.categoriesField")}</legend>
              {options.categories.map((c) => (
                <label key={c.id} className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={selectedCategories.includes(c.id)}
                    disabled={permissions.locked}
                    onCheckedChange={(v) =>
                      setValue("categoryIds", toggleIn(selectedCategories, c.id, v === true), { shouldDirty: true })
                    }
                  />
                  {localized(c.name, locale)}
                </label>
              ))}
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-foreground text-sm font-semibold">{t("projects.servicesField")}</legend>
              {availableServices.length ? (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {availableServices.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={(watched.serviceIds ?? []).includes(s.id)}
                        disabled={permissions.locked}
                        onCheckedChange={(v) =>
                          setValue("serviceIds", toggleIn(watched.serviceIds ?? [], s.id, v === true), {
                            shouldDirty: true,
                          })
                        }
                      />
                      {localized(s.name, locale)}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">{t("projects.selectCategoriesFirst")}</p>
              )}
            </fieldset>
            <TextInput
              label={t("projects.year")}
              type="number"
              optional
              dir="ltr"
              {...register("year", { setValueAs: (v) => (v === "" || v === null ? null : Number(v)) })}
            />
            <TextInput
              label={t("projects.externalUrl")}
              type="url"
              optional
              dir="ltr"
              placeholder="https://"
              error={formState.errors.externalUrl ? t("validation.url") : undefined}
              {...register("externalUrl")}
            />
          </FormSection>
        </div>
      </div>

      <div className="bg-background/95 border-line sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t py-4">
        {!permissions.locked ? (
          <Button type="submit" disabled={pending}>
            {pending ? t("actions.saving") : t("actions.save")}
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <a href={`/api/draft?type=project&slug=${project.slug}&locale=${locale}`} target="_blank" rel="noreferrer">
            <Eye {...uiIcon} size={16} />
            {t("projects.preview")}
          </a>
        </Button>
        {project.status === "published" ? (
          <Button asChild variant="ghost">
            <Link href={`/${locale}/work/${project.slug}`} target="_blank">
              <ExternalLink {...uiIcon} size={16} className="rtl:-scale-x-100" />
              {t("projects.viewLive")}
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            run(() => duplicateProject(project.id), {
              success: "created",
              onSuccess: ({ id }) => router.push(`/admin/projects/${id}`),
            })
          }
        >
          {t("projects.duplicate")}
        </Button>
        <UnsavedGuard dirty={formState.isDirty} />
        {permissions.delete ? (
          <div className="ms-auto">
            {project.status === "archived" ? (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="destructive">
                    {t("actions.delete")}
                  </Button>
                }
                description={t("confirm.deleteBody", { name: project.title.en })}
                onConfirm={() =>
                  run(() => deleteProject(project.id), {
                    success: "deleted",
                    onSuccess: () => router.replace("/admin/projects"),
                  })
                }
              />
            ) : (
              <span className="text-muted text-xs">{t("projects.deleteArchivedOnly")}</span>
            )}
          </div>
        ) : null}
      </div>
    </form>
  );
}
