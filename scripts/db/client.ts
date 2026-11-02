/**
 * Standalone database client for CLI scripts (migrate, seeds). The app uses
 * lib/db/client.ts, which is server-only.
 */
import { config } from "dotenv";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as schema from "../../lib/db/schema";
import type { Db } from "../../lib/db/client";

config({ path: [".env.local", ".env"], quiet: true });

export function scriptDb({ unpooled = false } = {}) {
  const url = (unpooled && process.env.DATABASE_URL_UNPOOLED) || process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Run `vercel env pull .env.local` or add it to .env.local.");
    process.exit(1);
  }
  if (/\.neon\.tech|neon\.build/.test(url)) {
    const pool = new NeonPool({ connectionString: url });
    return {
      db: drizzleNeon({ client: pool, schema, casing: "snake_case" }) as unknown as Db,
      close: () => pool.end(),
      neon: true,
    };
  }
  const pool = new PgPool({ connectionString: url, max: 3 });
  return { db: drizzlePg({ client: pool, schema, casing: "snake_case" }), close: () => pool.end(), neon: false };
}
