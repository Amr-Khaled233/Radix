import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3999);

/**
 * End-to-end suite. `pnpm test:e2e` starts an isolated server (in-memory
 * Postgres, seeded content, production build) — see scripts/e2e/server.mjs.
 * Tests share one database, so they run in order.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/e2e/server.mjs",
    url: `http://localhost:${PORT}/en`,
    timeout: 600_000,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
  },
});
