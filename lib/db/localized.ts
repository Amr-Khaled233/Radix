import { jsonb } from "drizzle-orm/pg-core";
import type { Localized, LocalizedRich } from "@/lib/localized";

export * from "@/lib/localized";

/** Localized plain-text column `{ en, ar }`. */
export const localized = (name: string) => jsonb(name).$type<Localized>().notNull().default({ en: "", ar: "" });

/** Localized rich-text column `{ en: doc | null, ar: doc | null }`. */
export const localizedRich = (name: string) =>
  jsonb(name).$type<LocalizedRich>().notNull().default({ en: null, ar: null });
