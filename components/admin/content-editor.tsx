"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
  type UseFormRegister,
} from "react-hook-form";
import type { savePageContent } from "@/app/admin/(dashboard)/pages/actions";
import type { ActionResult } from "@/lib/admin/action";
import type { Locale } from "@/lib/i18n/routing";
import type { Localized, LocalizedRich } from "@/lib/localized";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSection, TextArea, TextInput } from "./fields";
import { LocaleTabs, type Completeness } from "./locale-tabs";
import { RichTextEditor } from "./rich-text-editor";
import { SortableList } from "./sortable-list";
import { uiIcon } from "./ui-icon";
import { UnsavedGuard } from "./unsaved-guard";
import { useAction } from "./use-action";

/** A localized field at `name` (dot path inside the settings value). */
export type CopyField = { name: string; label: string; kind?: "text" | "textarea" | "rich"; hint?: string };

export type CopySection = {
  title: string;
  description?: ReactNode;
  fields?: CopyField[];
  /** Repeatable items: each item is an object of localized fields. */
  list?: { name: string; addLabel: string; itemLabel: string; fields: CopyField[]; empty: Record<string, unknown> };
  /** Extra controls rendered at the top of the section (e.g. home section order). */
  render?: (control: Control<FieldValues>) => ReactNode;
};

function isLocalized(value: unknown): value is Localized | LocalizedRich {
  return Boolean(value && typeof value === "object" && "en" in value && "ar" in value);
}

/** Walks a settings value and checks every localized leaf. */
function completenessOf(value: unknown): Completeness {
  const result = { en: true, ar: true };
  const filled = (v: unknown) =>
    typeof v === "string" ? v.trim().length > 0 : Boolean((v as { content?: unknown[] } | null)?.content?.length);
  const walk = (node: unknown) => {
    if (isLocalized(node)) {
      result.en &&= filled(node.en);
      result.ar &&= filled(node.ar);
      return;
    }
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === "object") Object.values(node).forEach(walk);
  };
  walk(value);
  return result;
}

function FieldInput({
  field,
  prefix,
  locale,
  register,
  control,
}: {
  field: CopyField;
  prefix: string;
  locale: Locale;
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues>;
}) {
  // Empty field names address list items that are themselves `{ en, ar }`.
  const name = [prefix.replace(/.$/, ""), field.name, locale].filter(Boolean).join(".");
  if (field.kind === "rich") {
    return (
      <Controller
        control={control}
        name={name}
        render={({ field: f }) => (
          <RichTextEditor
            label={field.label}
            hint={field.hint}
            locale={locale}
            value={f.value ?? null}
            onChange={f.onChange}
          />
        )}
      />
    );
  }
  if (field.kind === "textarea") return <TextArea label={field.label} hint={field.hint} rows={3} {...register(name)} />;
  return <TextInput label={field.label} hint={field.hint} {...register(name)} />;
}

function ListEditor({
  list,
  locale,
  control,
  register,
}: {
  list: NonNullable<CopySection["list"]>;
  locale: Locale;
  control: Control<FieldValues>;
  register: UseFormRegister<FieldValues>;
}) {
  const t = useTranslations("admin.actions");
  const items = useFieldArray({ control, name: list.name });
  return (
    <div className="space-y-3">
      {items.fields.length ? (
        <SortableList
          items={items.fields}
          onReorder={(_next, from, to) => items.move(from, to)}
          renderItem={(item) => {
            const index = items.fields.findIndex((f) => f.id === item.id);
            return (
              <div className="flex items-start gap-3 py-2">
                <div className="flex-1 space-y-3">
                  <p className="type-label text-label">
                    {list.itemLabel} <bdi>{String(index + 1).padStart(2, "0")}</bdi>
                  </p>
                  {list.fields.map((field) => (
                    <FieldInput
                      key={field.name}
                      field={field}
                      prefix={`${list.name}.${index}.`}
                      locale={locale}
                      register={register}
                      control={control}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("remove")}
                  onClick={() => items.remove(index)}
                >
                  <Trash2 {...uiIcon} size={14} />
                </Button>
              </div>
            );
          }}
        />
      ) : null}
      <Button type="button" variant="outline" size="sm" onClick={() => items.append(structuredClone(list.empty))}>
        <Plus {...uiIcon} size={14} />
        {list.addLabel}
      </Button>
    </div>
  );
}

type ContentEditorProps = {
  settingKey: Parameters<typeof savePageContent>[0];
  initial: Record<string, unknown>;
  sections: CopySection[];
  save: (key: Parameters<typeof savePageContent>[0], value: unknown) => Promise<ActionResult<undefined | void>>;
  canEdit: boolean;
};

/** Settings-backed page copy editor: EN | AR tabs per section, lists, rich text, review flag. */
export function ContentEditor({ settingKey, initial, sections, save, canEdit }: ContentEditorProps) {
  const t = useTranslations("admin");
  const { run, pending } = useAction();
  const form = useForm<FieldValues>({
    defaultValues: { ...initial, arReviewed: !initial.arNeedsReview },
    disabled: !canEdit,
  });
  const { register, control, formState } = form;
  const values = useWatch({ control });

  const submit = form.handleSubmit((data) => {
    const { arReviewed, ...rest } = data;
    return run(() => save(settingKey, { ...rest, arNeedsReview: !arReviewed }), { onSuccess: () => form.reset(data) });
  });

  return (
    <form onSubmit={submit} noValidate className="max-w-4xl space-y-6">
      {sections.map((section) => {
        // Root keys this section edits, for its EN/AR completeness badge.
        const roots = section.list ? [section.list.name] : (section.fields ?? []).map((f) => f.name);
        const scoped = roots.map((path) =>
          path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], values),
        );
        return (
          <FormSection key={section.title} title={section.title} description={section.description}>
            {section.render?.(control)}
            {section.fields?.length || section.list ? (
              <LocaleTabs completeness={completenessOf(scoped)}>
                {(locale) => (
                  <>
                    {section.fields?.map((field) => (
                      <FieldInput
                        key={field.name}
                        field={field}
                        prefix=""
                        locale={locale}
                        register={register}
                        control={control}
                      />
                    ))}
                    {section.list ? (
                      <ListEditor list={section.list} locale={locale} control={control} register={register} />
                    ) : null}
                  </>
                )}
              </LocaleTabs>
            ) : null}
          </FormSection>
        );
      })}

      <Controller
        control={control}
        name="arReviewed"
        render={({ field }) => (
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={Boolean(field.value)}
              disabled={field.disabled}
              onCheckedChange={(v) => field.onChange(v === true)}
              className="mt-0.5"
            />
            <span>
              <span className="text-foreground block font-semibold">{t("locale.markReviewed")}</span>
              <span className="text-muted block">{t("locale.markReviewedHint")}</span>
            </span>
          </label>
        )}
      />

      {canEdit ? (
        <div className="bg-background/95 border-line sticky bottom-0 z-10 flex items-center gap-3 border-t py-4">
          <Button type="submit" disabled={pending}>
            {pending ? t("actions.saving") : t("actions.save")}
          </Button>
          <UnsavedGuard dirty={formState.isDirty} />
        </div>
      ) : null}
    </form>
  );
}
