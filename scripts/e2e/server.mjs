/**
 * Self-contained server for the Playwright suite:
 * in-memory Postgres (PGlite) → migrations → seeds + test super admin →
 * production build → `next start`. Emails are written to .data/e2e-emails.log.
 *
 * Run by playwright.config.ts (webServer); not for production use.
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const DB_PORT = 54330;
const APP_PORT = Number(process.env.E2E_PORT ?? 3999);
const url = `postgres://postgres:postgres@127.0.0.1:${DB_PORT}/postgres?sslmode=disable`;

mkdirSync(".data", { recursive: true });
writeFileSync(".data/e2e-emails.log", "");

const pg = new PGlite();
const server = new PGLiteSocketServer({ db: pg, port: DB_PORT, host: "127.0.0.1", maxConnections: 200 });
await server.start();

const env = {
  ...process.env,
  DATABASE_URL: url,
  BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-123456",
  BETTER_AUTH_URL: `http://localhost:${APP_PORT}`,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${APP_PORT}`,
  EMAIL_TRANSPORT: "console",
  EMAIL_LOG_FILE: ".data/e2e-emails.log",
  MEDIA_STORAGE: "local",
  SEED_SUPER_ADMIN_EMAIL: "e2e-owner@example.com",
  SEED_SUPER_ADMIN_NAME: "E2E Owner",
  SEED_SUPER_ADMIN_PASSWORD: "e2e-owner-password",
  NODE_ENV: "production",
};

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit", shell: true });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`)),
    );
  });
}

await run("pnpm", ["db:migrate"]);
await run("pnpm", ["db:seed"]);
await run("pnpm", ["db:seed:admin"]);
if (!process.env.E2E_SKIP_BUILD) await run("pnpm", ["build"]);

const app = spawn("pnpm", ["start", "-p", String(APP_PORT)], { env, stdio: "inherit", shell: true });
const stop = async () => {
  app.kill();
  await server.stop();
  await pg.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
