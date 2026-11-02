"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormSection, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { PhotoCropField } from "@/components/admin/media/photo-crop-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { uiIcon } from "@/components/admin/ui-icon";
import { UnsavedGuard } from "@/components/admin/unsaved-guard";
import { useAction } from "@/components/admin/use-action";
import { useFieldError } from "@/components/admin/use-field-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LINK_TYPES, teamFormSchema } from "@/lib/admin/schemas";
import type { teamMembers } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/routing";
import { completeness, t as localized, type Localized } from "@/lib/localized";
import type { MediaItem } from "@/lib/media/types";
import { deleteTeamMember, updateTeamMember } from "../actions";

type Values = z.input<typeof teamFormSchema>;
const emptyL = { en: "", ar: "" };

export function TeamForm({
  member,
  photo,
  categoryIds,
  categories,
  permissions,
}: {
  member: typeof teamMembers.$inferSelect;
  photo: MediaItem | null;
  categoryIds: string[];
  categories: { id: string; name: Localized }[];
  permissions: { toggle: boolean; delete: boolean };
}) {
  const t = useTranslations("admin");
  const locale = useLocale() as Locale;
  const fieldError = useFieldError();
  const router = useRouter();
  const { run, pending } = useAction();
  const [photoItem, setPhotoItem] = useState<MediaItem | null>(photo);

  const form = useForm<Values>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      slug: member.slug,
      name: member.name,
      role: member.role,
      shortBio: member.shortBio,
      bio: member.bio,
      photoId: member.photoId,
      email: member.email ?? "",
      showEmail: member.showEmail,
      links: member.links as Values["links"],
      categoryIds,
      isVisible: member.isVisible,
      showOnHome: member.showOnHome,
      arReviewed: !member.arNeedsReview,
    },
  });
  const { register, control, formState, setValue } = form;
  const links = useFieldArray({ control, name: "links" });
  const watched = useWatch({ control });
  const selected = watched.categoryIds ?? [];

  const submit = form.handleSubmit((values) =>
    run(() => updateTeamMember(member.id, values), { onSuccess: () => form.reset(values) }),
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <FormSection title={t("team.profile")}>
            <LocaleTabs
              completeness={completeness([
                (watched.name ?? emptyL) as Localized,
                (watched.role ?? emptyL) as Localized,
                (watched.shortBio ?? emptyL) as Localized,
              ])}
            >
              {(l) => (
                <>
                  <TextInput
                    label={t("team.name")}
                    error={fieldError(formState.errors.name?.[l])}
                    {...register(`name.${l}`)}
                  />
                  <TextInput label={t("team.role")} {...register(`role.${l}`)} />
                  <TextArea label={t("team.shortBio")} rows={3} {...register(`shortBio.${l}`)} />
                  <Controller
                    control={control}
                    name={`bio.${l}`}
                    render={({ field }) => (
                      <RichTextEditor
                        label={t("team.bio")}
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
                    className="mt-0.5"
                  />
                  <span className="text-foreground font-semibold">{t("locale.markReviewed")}</span>
                </label>
              )}
            />
          </FormSection>

          <FormSection title={t("team.contact")}>
            <TextInput label={t("team.email")} type="email" optional dir="ltr" {...register("email")} />
            <Controller
              control={control}
              name="showEmail"
              render={({ field }) => (
                <Toggle label={t("team.showEmail")} checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <div className="space-y-2">
              <p className="text-foreground text-sm font-semibold">{t("team.links")}</p>
              {links.fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[160px_1fr_auto]">
                  <Controller
                    control={control}
                    name={`links.${index}.type`}
                    render={({ field: f }) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger aria-label={t("team.linkType")}>
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
                  <div>
                    <Input
                      type="url"
                      dir="ltr"
                      placeholder="https://"
                      aria-label={t("team.linkUrl")}
                      aria-invalid={formState.errors.links?.[index]?.url ? true : undefined}
                      {...register(`links.${index}.url`)}
                    />
                    {formState.errors.links?.[index]?.url ? (
                      <p className="text-danger mt-1 text-xs">{t("validation.url")}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("actions.remove")}
                    onClick={() => links.remove(index)}
                  >
                    <Trash2 {...uiIcon} size={14} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => links.append({ type: "website", url: "" })}
              >
                <Plus {...uiIcon} size={14} />
                {t("team.addLink")}
              </Button>
            </div>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title={t("team.photo")}>
            <PhotoCropField
              label={t("team.photo")}
              hint={t("team.photoHint")}
              value={photoItem}
              alt={(watched.name ?? member.name) as Localized}
              onChange={(item) => {
                setPhotoItem(item);
                setValue("photoId", item?.id ?? null, { shouldDirty: true });
              }}
            />
          </FormSection>
          <FormSection title={t("team.visibility")}>
            <Controller
              control={control}
              name="isVisible"
              render={({ field }) => (
                <Toggle
                  label={t("team.visible")}
                  checked={field.value}
                  disabled={!permissions.toggle}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="showOnHome"
              render={({ field }) => (
                <Toggle
                  label={t("team.onHome")}
                  checked={field.value}
                  disabled={!permissions.toggle}
                  onCheckedChange={field.onChange}
                />
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
          <FormSection title={t("team.expertise")}>
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={selected.includes(c.id)}
                  onCheckedChange={(v) =>
                    setValue("categoryIds", v === true ? [...selected, c.id] : selected.filter((x) => x !== c.id), {
                      shouldDirty: true,
                    })
                  }
                />
                {localized(c.name, locale)}
              </label>
            ))}
          </FormSection>
        </div>
      </div>

      <div className="bg-background/95 border-line sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t py-4">
        <Button type="submit" disabled={pending}>
          {pending ? t("actions.saving") : t("actions.save")}
        </Button>
        <Button asChild variant="outline">
          <a href={`/api/draft?type=team&slug=${member.slug}&locale=${locale}`} target="_blank" rel="noreferrer">
            <Eye {...uiIcon} size={16} />
            {t("actions.preview")}
          </a>
        </Button>
        <UnsavedGuard dirty={formState.isDirty} />
        {permissions.delete ? (
          <div className="ms-auto">
            <ConfirmDialog
              trigger={
                <Button type="button" variant="destructive">
                  {t("actions.delete")}
                </Button>
              }
              description={t("confirm.deleteBody", { name: member.name.en })}
              onConfirm={() =>
                run(() => deleteTeamMember(member.id), {
                  success: "deleted",
                  onSuccess: () => router.replace("/admin/team"),
                })
              }
            />
          </div>
        ) : null}
      </div>
    </form>
  );
}
