"use server";

import { inArray } from "drizzle-orm";
import { z } from "@/lib/zod";
import { logAudit } from "@/lib/audit";
import { adminAction } from "@/lib/admin/action";
import { assertCan } from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import { contactSubmissions } from "@/lib/db/schema";

const statusSchema = z.enum(["new", "read", "archived"]);

export async function setMessageStatus(ids: string[], status: z.infer<typeof statusSchema>) {
  return adminAction(async (actor) => {
    assertCan(actor, "edit", "messages");
    const parsed = z.array(z.uuid()).min(1).parse(ids);
    const next = statusSchema.parse(status);
    await db.update(contactSubmissions).set({ status: next }).where(inArray(contactSubmissions.id, parsed));
    if (next === "archived") {
      await logAudit({
        actorId: actor.id,
        action: "message.archive",
        entityType: "message",
        summary: { count: parsed.length },
      });
    }
  });
}
