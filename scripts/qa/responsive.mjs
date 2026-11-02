// QA: horizontal overflow at common widths, public + dashboard, EN/AR.
// Usage: node scripts/qa/responsive.mjs [baseUrl]  (default: the e2e server, http://localhost:3999)
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3999";
const widths = [320, 375, 768, 1024, 1440, 1920];
const site = ["", "/about", "/services", "/services/brand", "/work", "/team", "/contact", "/privacy", "/nope-404"];
const admin = [
  "/admin",
  "/admin/categories",
  "/admin/projects",
  "/admin/team",
  "/admin/pages/home",
  "/admin/pages/hero",
  "/admin/messages",
  "/admin/media",
  "/admin/admins",
  "/admin/settings",
  "/admin/profile",
  "/admin/audit-log",
];

const browser = await chromium.launch();
const login = await (await browser.newContext()).newPage();
await login.goto(`${base}/admin/login`);
await login.getByLabel("Email", { exact: true }).fill("e2e-owner@example.com");
await login.getByLabel("Password", { exact: true }).fill("e2e-owner-password");
await login.getByRole("button", { name: "Sign in" }).click();
await login.waitForURL(/\/admin$/);
const cookies = await login.context().cookies();
const projectLink = await login.goto(`${base}/admin/projects`).then(() =>
  login
    .locator('a[href^="/admin/projects/"]')
    .first()
    .getAttribute("href")
    .catch(() => null),
);
const categoryLink = await login.goto(`${base}/admin/categories`).then(() =>
  login
    .locator('a[href^="/admin/categories/"]')
    .first()
    .getAttribute("href")
    .catch(() => null),
);
if (projectLink) admin.push(projectLink);
if (categoryLink) admin.push(categoryLink);

const problems = [];
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  const urls = [
    ...["en", "ar"].flatMap((l) => site.map((p) => `/${l}${p}`)),
    ...admin,
    ...admin.slice(0, 4).map((p) => `${p}?__ar`),
  ];
  for (const url of urls) {
    if (url.endsWith("?__ar")) {
      await ctx.addCookies([{ name: "ADMIN_LOCALE", value: "ar", url: `${base}/admin` }]);
    }
    await page.goto(`${base}${url.replace("?__ar", "")}`, { waitUntil: "networkidle" });
    const result = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const over = document.documentElement.scrollWidth - docW;
      const offenders = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > docW + 1 || r.left < -1) {
          // Ignore content inside horizontal scrollers and clipped containers.
          let p = el.parentElement,
            clipped = false;
          while (p && p !== document.body) {
            const s = getComputedStyle(p);
            if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) {
              clipped = true;
              break;
            }
            p = p.parentElement;
          }
          const s = getComputedStyle(el);
          if (
            !clipped &&
            s.position !== "fixed" &&
            s.visibility !== "hidden" &&
            !el.closest("[aria-hidden=true],.sr-only")
          )
            offenders.push(
              `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} [${Math.round(r.left)}→${Math.round(r.right)}]`,
            );
        }
      }
      return { over, offenders: offenders.slice(0, 3) };
    });
    if (result.over > 0 || result.offenders.length)
      problems.push(`${width} ${url} overflow=${result.over} ${result.offenders.join(" | ")}`);
  }
  await ctx.close();
}
console.log(problems.length ? problems.join("\n") : "No horizontal overflow found.");
await browser.close();
