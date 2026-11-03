import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["", "/about", "/services", "/services/brand", "/work", "/contact", "/privacy"];

test.describe("public site", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`${locale}: every page renders with the right direction`, async ({ page }) => {
      for (const path of PAGES) {
        const res = await page.goto(`/${locale}${path}`);
        expect(res?.status(), path).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
      }
    });
  }

  test("language switch keeps the page and query string", async ({ page }) => {
    await page.goto("/en/work?category=brand");
    await page.getByRole("link", { name: "Switch language to العربية" }).first().click();
    await expect(page).toHaveURL(/\/ar\/work\?category=brand$/);
  });

  test("theme: dark by default (even on a light OS), toggles to light and persists", async ({ browser }) => {
    const page = await (await browser.newContext({ colorScheme: "light" })).newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Switch to Light mode" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Switch to Dark mode" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("first visit opens in English even with an Arabic browser", async ({ browser }) => {
    const page = await (await browser.newContext({ locale: "ar-EG" })).newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
  });

  test("language switch shows only the other language", async ({ page }) => {
    await page.goto("/en");
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Switch language to العربية" }).first()).toBeVisible();
    await expect(header.getByRole("link", { name: /Switch language to English/ })).toHaveCount(0);
    await page.goto("/ar");
    await expect(page.getByRole("banner").getByRole("link", { name: "التبديل إلى English" }).first()).toBeVisible();
  });

  test("reduced motion: hero is static, all content visible", async ({ browser }) => {
    const page = await (await browser.newContext({ reducedMotion: "reduce" })).newPage();
    await page.goto("/en");
    await expect(page.locator("section .sticky")).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByText("Four pillars. One foundation.")).toBeVisible();
  });

  test("SEO endpoints and alternates", async ({ page, request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/ar/services/brand");
    await page.goto("/en/services/brand");
    await expect(page.locator('link[rel="alternate"][hreflang="ar"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
    const og = await request.get("/ar/services/brand/opengraph-image");
    expect(og.headers()["content-type"]).toBe("image/png");
  });

  for (const path of ["/en", "/ar", "/en/contact", "/ar/about", "/en/work"]) {
    test(`accessibility (axe, WCAG 2.2 AA): ${path}`, async ({ browser }) => {
      for (const theme of ["light", "dark"] as const) {
        const context = await browser.newContext({ reducedMotion: "reduce" });
        await context.addInitScript((value) => localStorage.setItem("radix-theme", value), theme);
        const page = await context.newPage();
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")}`);
        expect(summary, `${path} ${theme}`).toEqual([]);
      }
    });
  }
});
