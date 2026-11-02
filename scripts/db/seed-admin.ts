/**
 * Creates the first super admin from SEED_SUPER_ADMIN_* env vars. Idempotent:
 * an existing account with that email is left unchanged.
 */
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { account, user } from "../../lib/db/schema";
import { scriptDb } from "./client";

const MIN_PASSWORD = 10;

async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.SEED_SUPER_ADMIN_NAME?.trim();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!email || !name || !password) {
    console.error("Set SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_NAME and SEED_SUPER_ADMIN_PASSWORD first.");
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD) {
    console.error(`SEED_SUPER_ADMIN_PASSWORD must be at least ${MIN_PASSWORD} characters.`);
    process.exit(1);
  }

  const { db, close } = scriptDb();
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (existing) {
    console.log(`An account for ${email} already exists (role: ${existing.role}). Nothing changed.`);
    await close();
    return;
  }

  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(user).values({ id, name, email, emailVerified: true, role: "super_admin" });
    await tx.insert(account).values({
      id: randomUUID(),
      userId: id,
      accountId: id,
      providerId: "credential",
      password: await hashPassword(password),
    });
  });
  await close();

  console.log(`Super admin created: ${email}`);
  console.log("Reminder: sign in at /admin/login and change this password from your profile right away.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
