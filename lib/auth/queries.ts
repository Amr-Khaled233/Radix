import "server-only";
import { and, count, eq, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema";

export async function countActiveSuperAdmins() {
  const [row] = await db
    .select({ value: count() })
    .from(user)
    .where(and(eq(user.role, "super_admin"), or(eq(user.banned, false), isNull(user.banned))));
  return row?.value ?? 0;
}
