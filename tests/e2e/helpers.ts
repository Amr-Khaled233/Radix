import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

export const OWNER = { email: "e2e-owner@example.com", password: "e2e-owner-password" };

/** Last emailed link sent to `to` (dev transport writes them to .data/e2e-emails.log). */
export function lastEmailLink(to: string) {
  const lines = readFileSync(".data/e2e-emails.log", "utf8").trim().split("\n").filter(Boolean);
  const match = lines
    .map((line) => JSON.parse(line) as { to: string; url?: string })
    .reverse()
    .find((entry) => entry.to.includes(to) && entry.url);
  if (!match?.url) throw new Error(`No email link for ${to}`);
  return match.url;
}

export async function signIn(page: Page, email = OWNER.email, password = OWNER.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
}

export async function expectSaved(page: Page) {
  await expect(page.getByText("Changes saved.").last()).toBeVisible({ timeout: 10_000 });
}

/** Unique, slug-safe suffix per test run. */
export const runId = Date.now().toString(36);
