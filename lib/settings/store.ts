import "server-only";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import { refreshTags } from "@/lib/admin/action";
import type { Actor } from "@/lib/auth/permissions";
import { TAGS } from "@/lib/cache/tags";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { SETTINGS_SCHEMAS, type SettingsKey, type SettingsValue } from "./schemas";

/** Uncached read for the dashboard; missing or invalid values fall back to schema defaults. */
export async function readSetting<K extends SettingsKey>(key: K): Promise<SettingsValue<K>> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
  const schema = SETTINGS_SCHEMAS[key];
  const parsed = schema.safeParse(row?.value ?? {});
  if (parsed.success) return parsed.data as SettingsValue<K>;
  // `about` has no defaults; an unseeded database returns an empty structure.
  return schema.parse(row?.value ?? {}) as SettingsValue<K>;
}

/** Validates, saves, audits and refreshes the public cache for one settings key. */
export async function writeSetting<K extends SettingsKey>(actor: Actor, key: K, value: unknown) {
  const parsed = SETTINGS_SCHEMAS[key].parse(value);
  await db
    .insert(settings)
    .values({ key, value: parsed, updatedBy: actor.id })
    .onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedBy: actor.id, updatedAt: new Date() } });
  await logAudit({ actorId: actor.id, action: "settings.update", entityType: "settings", entityId: key });
  refreshTags(TAGS.settings(key));
  return parsed as SettingsValue<K>;
}
