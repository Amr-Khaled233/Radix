// Review screenshots: every public page × EN/AR × light/dark × mobile/desktop.
// Usage: node scripts/e2e/screenshots.mjs [baseUrl]  (default http://localhost:3000)
// Output: .data/screenshots/ (gitignored).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const pages = [
  "",
  "/about",
  "/services",
  "/services/brand",
  "/services/sites-and-systems",
  "/team",
  "/contact",
  "/privacy",
];
const viewports = { mobile: { width: 375, height: 812 }, desktop: { width: 1440, height: 900 } };
const out = ".data/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const [device, viewport] of Object.entries(viewports)) {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    await context.addInitScript((value) => localStorage.setItem("radix-theme", value), theme);
    const page = await context.newPage();
    for (const locale of ["en", "ar"]) {
      for (const path of pages) {
        await page.goto(`${base}/${locale}${path}`, { waitUntil: "networkidle" });
        // Scroll through so scroll reveals run, then return to the top.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
            scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
          scrollTo(0, 0);
          await new Promise((r) => setTimeout(r, 400));
        });
        const name = `${locale}-${path.replaceAll("/", "_").slice(1) || "home"}-${theme}-${device}.png`;
        await page.screenshot({ path: `${out}/${name}`, fullPage: true });
        console.log(name);
      }
    }
    await context.close();
  }
}
await browser.close();
