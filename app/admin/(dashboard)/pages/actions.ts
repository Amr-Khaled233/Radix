"use server";

import { z } from "zod";
import { adminAction } from "@/lib/admin/action";
import { assertCan } from "@/lib/auth/permissions";
import { writeSetting } from "@/lib/settings/store";

const PAGE_KEYS = ["home", "about", "process", "legal", "footer"] as const;

/** Saves a page-content settings key (validated by its own schema in writeSetting). */
export async function savePageContent(key: (typeof PAGE_KEYS)[number], value: unknown) {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "pages");
    const parsedKey = z.enum(PAGE_KEYS).parse(key);
    const next =
      parsedKey === "legal" && value && typeof value === "object"
        ? { ...value, updatedAt: new Date().toISOString().slice(0, 10) }
        : value;
    await writeSetting(actor, parsedKey, next);
  });
}
