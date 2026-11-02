import "server-only";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

/**
 * Neon (Vercel Marketplace) in deployed environments; any other Postgres URL
 * (local Docker, embedded test server) uses node-postgres. Both drivers
 * expose the same Drizzle API, including transactions.
 */
function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (url && /\.neon\.tech|neon\.build/.test(url)) {
    return drizzleNeon({
      client: new NeonPool({ connectionString: url }),
      schema,
      casing: "snake_case",
    }) as unknown as Db;
  }
  return drizzlePg({ client: new PgPool({ connectionString: url, max: 5 }), schema, casing: "snake_case" });
}

const globalForDb = globalThis as unknown as { radixDb?: Db };

export const db: Db = globalForDb.radixDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.radixDb = db;
