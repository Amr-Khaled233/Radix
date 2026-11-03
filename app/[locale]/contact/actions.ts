"use server";

import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "@/lib/zod";
import { db } from "@/lib/db/client";
import { categories, contactSubmissions } from "@/lib/db/schema";
import { sendContactNotification } from "@/lib/email/send";
import { contactSchema, type ContactInput } from "@/lib/site/contact-schema";
import { accountsWithAssignments } from "@/lib/messages/access";
import { notificationRecipients } from "@/lib/messages/scope";
import { allowRequest, hashIp } from "@/lib/site/rate-limit";
import { readSetting } from "@/lib/settings/store";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: "validation"; fields: Record<string, string> }
  | { ok: false; error: "rateLimited" | "server" };

/** Public contact form: validates, rate-limits per hashed IP, stores, then notifies the responsible accounts. */
export async function submitContact(input: ContactInput): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const fields = Object.fromEntries(
      Object.entries(z.flattenError(parsed.error).fieldErrors).map(([k, v]) => [k, (v as string[])[0] ?? "server"]),
    );
    // A filled honeypot looks like success to bots, but nothing is stored.
    if ("website" in fields) return { ok: true };
    return { ok: false, error: "validation", fields };
  }
  const data = parsed.data;

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ipHash = hashIp(ip);

  try {
    if (!(await allowRequest("contact", ipHash, 5, 60 * 60))) return { ok: false, error: "rateLimited" };

    // Only real, visible categories are recorded.
    const valid = data.categoryIds.length
      ? await db
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(and(inArray(categories.id, data.categoryIds), eq(categories.isVisible, true)))
      : [];

    await db.insert(contactSubmissions).values({
      name: data.name,
      email: data.email,
      company: data.company || null,
      phone: data.phone || null,
      message: data.message,
      categoryIds: valid.map((c) => c.id),
      locale: data.locale,
      ipHash,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    });

    // Only the accounts responsible for the chosen pillars are notified (fallback: Settings, then the super admin).
    const [{ notificationEmails }, accounts] = await Promise.all([readSetting("contact"), accountsWithAssignments()]);
    const to = notificationRecipients(
      valid.map((c) => c.id),
      accounts,
      notificationEmails,
    );
    if (to.length) {
      await sendContactNotification({
        to,
        submission: { ...data, interests: valid.map((c) => c.name.en) },
      }).catch((error) => console.error("[contact] notification failed", error));
    }
    return { ok: true };
  } catch (error) {
    console.error("[contact]", error);
    return { ok: false, error: "server" };
  }
}
