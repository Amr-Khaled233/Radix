/** Localized field types, schemas and helpers (safe for client and server). */
import { z } from "@/lib/zod";
import type { Locale } from "@/lib/i18n/routing";

/** Tiptap/ProseMirror document JSON (rendered to sanitized HTML on the server). */
export type RichDoc = { type: "doc"; content?: unknown[] };

export type Localized = { en: string; ar: string };
export type LocalizedRich = { en: RichDoc | null; ar: RichDoc | null };

export const localizedSchema = z.object({ en: z.string().trim(), ar: z.string().trim() });
export const richDocSchema = z.object({ type: z.literal("doc"), content: z.array(z.unknown()).optional() });
export const localizedRichSchema = z.object({ en: richDocSchema.nullable(), ar: richDocSchema.nullable() });

const other = (locale: Locale): Locale => (locale === "en" ? "ar" : "en");

function isEmptyRich(doc: RichDoc | null | undefined) {
  return !doc || !doc.content || doc.content.length === 0;
}

/** Value in `locale`, falling back to the other language when empty. */
export function t(field: Localized | null | undefined, locale: Locale): string {
  if (!field) return "";
  return field[locale]?.trim() ? field[locale] : (field[other(locale)] ?? "");
}

export function tRich(field: LocalizedRich | null | undefined, locale: Locale): RichDoc | null {
  if (!field) return null;
  return isEmptyRich(field[locale]) ? field[other(locale)] : field[locale];
}

/** Which languages are filled in — drives the dashboard "EN ✓ · AR ⚠" badges. */
export function completeness(fields: (Localized | LocalizedRich)[]) {
  const filled = (locale: Locale) =>
    fields.every((field) => {
      const value = field[locale];
      return typeof value === "string" ? value.trim().length > 0 : !isEmptyRich(value);
    });
  return { en: filled("en"), ar: filled("ar") };
}
