"use server";

import { z } from "@/lib/zod";
import { adminAction } from "@/lib/admin/action";
import { assertCan } from "@/lib/auth/permissions";
import { contactSchema, generalSchema, localeSchema, seoSchema } from "@/lib/settings/schemas";
import { writeSetting } from "@/lib/settings/store";

const settingsFormSchema = z.object({
  general: generalSchema,
  seo: seoSchema,
  contact: contactSchema,
  locale: localeSchema,
});

export async function saveSiteSettings(input: z.input<typeof settingsFormSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "settings");
    const data = settingsFormSchema.parse(input);
    await writeSetting(actor, "general", data.general);
    await writeSetting(actor, "seo", data.seo);
    await writeSetting(actor, "contact", data.contact);
    await writeSetting(actor, "locale", data.locale);
  });
}
