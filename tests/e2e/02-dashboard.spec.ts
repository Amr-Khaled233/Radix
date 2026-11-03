import { expect, test, type BrowserContext } from "@playwright/test";
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { expectSaved, lastEmailLink, runId, signIn } from "./helpers";

const OWNER_PASSWORD = "e2e-owner-password-2"; // set by the reset test

test.describe.configure({ mode: "serial" });

// Sign in once and reuse the session cookies (the sign-in rate limit allows 5 attempts a minute).
let sessionCookies: Awaited<ReturnType<BrowserContext["cookies"]>> | null = null;
test.beforeEach(async ({ context, page }) => {
  if (sessionCookies) {
    await context.addCookies(sessionCookies);
    return;
  }
  await signIn(page, "e2e-owner@example.com", OWNER_PASSWORD);
  sessionCookies = await context.cookies();
});

// The invited editor (responsible for Sites & Systems) — reused by the inbox test.
const EDITOR_EMAIL = `editor-${runId}@example.com`;
let editorCookies: Awaited<ReturnType<BrowserContext["cookies"]>> = [];

test("invite an account responsible for a pillar, who sets a password and signs in", async ({ page, browser }) => {
  const email = EDITOR_EMAIL;
  await page.goto("/admin/admins");
  await page.getByRole("button", { name: "Invite account" }).click();
  await page.getByLabel("Name").fill("E2E Editor");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("dialog").getByRole("checkbox", { name: "Sites & Systems" }).click();
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByText("Invitation sent.")).toBeVisible();

  const invitee = await (await browser.newContext()).newPage();
  await invitee.goto(lastEmailLink(email));
  await expect(invitee.getByRole("heading", { name: "Set your password" })).toBeVisible();
  await invitee.getByLabel("New password", { exact: true }).fill("editor-password-1");
  await invitee.getByLabel("Confirm new password").fill("editor-password-1");
  await invitee.getByRole("button", { name: "Save password" }).click();
  await signIn(invitee, email, "editor-password-1");
  editorCookies = await invitee.context().cookies();
  // Editors can't open admin management (and don't see it in the navigation).
  await invitee.goto("/admin/admins");
  await expect(invitee.getByRole("heading", { name: "Admins" })).toHaveCount(0);
  await expect(
    invitee.getByRole("navigation", { name: "Dashboard" }).getByRole("link", { name: "Admins" }),
  ).toHaveCount(0);
});

test("category: create, edit, toggle visibility, reorder", async ({ page }) => {
  const name = `Pillar ${runId}`;
  await page.goto("/admin/categories");
  await page.getByRole("button", { name: "New category" }).click();
  await page.getByLabel("Name (English)").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/admin\/categories\/[0-9a-f-]{36}$/);
  await page.getByLabel("Tagline").first().fill("Tested end to end.");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectSaved(page);

  await page.goto("/admin/categories");
  const row = page.getByRole("listitem").filter({ hasText: name });
  const visible = row.getByRole("switch", { name: new RegExp(`^Visible on the site — ${name}`) });
  await expect(visible).not.toBeChecked(); // new categories start hidden
  await visible.click();
  await expect(page.getByText("Updated.").last()).toBeVisible();

  // Keyboard reorder: move the new category up one place.
  const handle = row.getByRole("button", { name: "Drag to reorder" });
  await handle.focus();
  // dnd-kit's keyboard sensor: pick up, move, drop — it measures between steps.
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(300);
  await page.keyboard.press("Space");
  await expect(page.getByText("Order updated.").last()).toBeVisible();
});

test("project: create, publish, appears on its pillar page", async ({ page }) => {
  const title = `Case Study ${runId}`;
  await page.goto("/admin/projects");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Title (English)").fill(title);
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/admin\/projects\/[0-9a-f-]{36}$/);
  await page.getByLabel("Summary").first().fill("An end-to-end test project.");
  await page.getByRole("checkbox", { name: "Brand" }).click();
  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Published" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectSaved(page);

  // The pre-rendered pillar page refreshes on its next visit after a change, so reload until it shows.
  const card = page.getByRole("link", { name: new RegExp(title) });
  await expect
    .poll(
      async () => {
        await page.goto("/en/services/brand");
        return card.count();
      },
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);
  await card.click();
  await expect(page).toHaveURL(new RegExp(`/en/services/brand/case-study-${runId}$`));
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
});

test("hero animation: upload poster → configure → appears on home", async ({ page }) => {
  mkdirSync(".data", { recursive: true });
  const poster = await sharp({ create: { width: 1600, height: 900, channels: 3, background: { r: 41, g: 38, b: 49 } } })
    .png()
    .toBuffer();
  writeFileSync(".data/e2e-poster.png", poster);

  await page.goto("/admin/pages/hero");
  await page.getByRole("switch", { name: "Show the hero animation" }).click();
  await page.getByRole("radio", { name: /Static poster/ }).click();

  for (const label of ["Desktop poster (required)", "Mobile poster (required)"]) {
    const field = page.locator("div.space-y-2").filter({ hasText: label }).first();
    await field.getByRole("button", { name: "Choose" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Upload file" }).click();
    await dialog.locator('input[type="file"]').setInputFiles(".data/e2e-poster.png");
    await dialog.getByLabel("Alt text (English)").fill("Test poster");
    await dialog.getByLabel("Alt text (Arabic)").fill("صورة اختبار");
    await dialog.getByRole("button", { name: "Upload file" }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
  }
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectSaved(page);

  await page.goto("/en");
  await expect(page.locator("[data-hero-poster]")).toBeVisible();
});

test("contact submissions arrive in the inbox", async ({ page, browser }) => {
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto("/en/contact");
  await visitor.getByLabel("Name").fill(`Visitor ${runId}`);
  await visitor.getByLabel("Email", { exact: true }).fill("visitor@example.com");
  await visitor.getByLabel("Message").fill("We would like to talk about a new brand.");
  await visitor.getByRole("button", { name: "Send message" }).click();
  await expect(visitor.getByText("Thank you.")).toBeVisible();

  await page.goto("/admin/messages");
  await expect(page.getByRole("button", { name: new RegExp(`Visitor ${runId}`) })).toBeVisible();
});

test("messages reach only the account responsible for their pillar", async ({ page, browser }) => {
  const visitor = await (await browser.newContext()).newPage();
  const leads = [
    ["Sites & Systems", `Sites lead ${runId}`],
    ["Brand", `Brand lead ${runId}`],
  ] as const;
  for (const [pillar, name] of leads) {
    await visitor.goto("/en/contact");
    await visitor.getByLabel("Name").fill(name);
    await visitor.getByLabel("Email", { exact: true }).fill("visitor@example.com");
    await visitor.getByRole("checkbox", { name: pillar }).check({ force: true });
    await visitor.getByLabel("Message").fill("We would like to talk about a project.");
    await visitor.getByRole("button", { name: "Send message" }).click();
    await expect(visitor.getByText("Thank you.")).toBeVisible();
  }

  // The notification went to the responsible account only.
  const log = readFileSync(".data/e2e-emails.log", "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as { to: string; subject: string });
  expect(log.find((e) => e.subject === `New message from Sites lead ${runId}`)?.to).toBe(EDITOR_EMAIL);

  // The responsible editor sees the Sites & Systems message and not the Brand one.
  const editorContext = await browser.newContext();
  await editorContext.addCookies(editorCookies);
  const editor = await editorContext.newPage();
  await editor.goto("/admin/messages");
  await expect(editor.getByRole("button", { name: new RegExp(`Sites lead ${runId}`) })).toBeVisible();
  await expect(editor.getByRole("button", { name: new RegExp(`Brand lead ${runId}`) })).toHaveCount(0);

  // The super admin sees both.
  await page.goto("/admin/messages");
  await expect(page.getByRole("button", { name: new RegExp(`Brand lead ${runId}`) })).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(`Sites lead ${runId}`) })).toBeVisible();
});
