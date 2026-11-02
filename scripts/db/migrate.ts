import { migrate as migrateNeon } from "drizzle-orm/neon-serverless/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { scriptDb } from "./client";

async function main() {
  const { db, close, neon } = scriptDb({ unpooled: true });
  const migrationsFolder = "./drizzle";
  if (neon) await migrateNeon(db as unknown as NeonDatabase, { migrationsFolder });
  else await migratePg(db, { migrationsFolder });
  await close();
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
