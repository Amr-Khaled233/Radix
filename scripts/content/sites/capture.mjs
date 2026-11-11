// Capture screenshots of the live websites we built (read-only browsing: no forms, no cart actions).
// Output: scripts/content/sites/images/*.webp + capture.json. Run: node scripts/content/sites/capture.mjs
import { chromium } from "@playwright/test";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "scripts/content/sites/images";
mkdirSync(OUT, { recursive: true });

/** home: cover + up to `slices` desktop sections; pages: one desktop view each; mobile: phone views. */
const SITES = {
  jexi: {
    base: "https://jexi-store.vercel.app",
    slices: 3,
    pages: ["/shop", "/product/aurelia-pendant-necklace", "/gift-boxes/rose-keepsake-box"],
    mobile: ["/", "/product/aurelia-pendant-necklace"],
  },
  luwjje: {
    base: "https://www.luwjje.com",
    slices: 1,
    pages: ["/shop", "/product/luwjje-hoodie"],
    mobile: ["/", "/product/luwjje-hoodie"],
  },
  eldeeb: {
    base: "https://eldeeb-flax.vercel.app",
    // A scroll-driven animation: content lives in the viewport, so capture it at scroll positions.
    slices: 0,
    scrollShots: [2400, 4000, 4800, 5600, 6400, 8000, 8800, 10400, 12000],
    // Screen recording of the building animation (0 → 6400px of scroll).
    video: { to: 6400, seconds: 16 },
    pages: [],
    mobile: ["/"],
  },
  sinemai: {
    base: "https://sinemai-ai.vercel.app",
    home: "/en",
    slices: 3,
    pages: [],
    mobile: ["/en"],
  },
};

const toWebp = (input, file) => sharp(input).webp({ quality: 82 }).toFile(`${OUT}/${file}`);

/** Cut a tall screenshot into ~950px slices at rows of plain background. */
async function slice(png, { target = 950, min = 600, max = 1300 } = {}) {
  const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const spread = new Float64Array(height);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    let sq = 0;
    const n = Math.ceil(width / 4);
    for (let x = 0; x < width; x += 4) {
      const v = data[y * width + x];
      sum += v;
      sq += v * v;
    }
    spread[y] = Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2));
  }
  const cuts = [0];
  while (height - cuts.at(-1) > max) {
    const start = cuts.at(-1);
    let best = start + target;
    let bestScore = Infinity;
    for (let y = start + min; y < Math.min(start + max, height - min); y++) {
      let band = 0;
      for (let k = -6; k <= 6; k++) band = Math.max(band, spread[Math.min(height - 1, Math.max(0, y + k))]);
      const score = band * 4 + Math.abs(y - (start + target)) / 60;
      if (score < bestScore) {
        bestScore = score;
        best = y;
      }
    }
    cuts.push(best);
  }
  cuts.push(height);
  const parts = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    parts.push(
      await sharp(png)
        .extract({ left: 0, top: cuts[i], width, height: cuts[i + 1] - cuts[i] })
        .png()
        .toBuffer(),
    );
  }
  return parts;
}

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
}

/** Records a smooth scroll through the page and converts it to H.264 MP4 (plays everywhere). */
async function recordScroll(key, site) {
  const dir = ".data/recordings";
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir, size: { width: 1280, height: 720 } },
  });
  const page = await ctx.newPage();
  await page.goto(site.base + (site.home ?? "/"), { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(1500);
  const steps = site.video.seconds * 30;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => scrollTo(0, y), Math.round((site.video.to * i) / steps));
    await page.waitForTimeout(1000 / 30);
  }
  await page.waitForTimeout(1200);
  const webm = await page.video().path();
  await ctx.close();
  const file = `${key}-scroll.mp4`;
  // Trim the blank page-load start; no audio; web-friendly.
  execFileSync(
    ffmpegPath,
    [
      "-y",
      "-ss",
      "1.2",
      "-i",
      webm,
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "26",
      "-preset",
      "slow",
      "-movflags",
      "+faststart",
      `${OUT}/${file}`,
    ],
    { stdio: "ignore" },
  );
  return file;
}

const capture = {};
const browser = await chromium.launch();
for (const [key, site] of Object.entries(SITES)) {
  const files = [];
  const desktop = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await desktop.goto(site.base + (site.home ?? "/"), { waitUntil: "networkidle", timeout: 90_000 });
  await settle(desktop);
  // Cover: the first screen.
  await toWebp(await desktop.screenshot(), `${key}-cover.webp`);
  capture[`${key}:cover`] = `${key}-cover.webp`;
  // Home sections (after the first screen).
  const full = await desktop.screenshot({ fullPage: true });
  const meta = await sharp(full).metadata();
  if (site.slices && meta.height > 1100) {
    const rest = await sharp(full)
      .extract({ left: 0, top: 900, width: meta.width, height: meta.height - 900 })
      .png()
      .toBuffer();
    for (const [i, part] of (await slice(rest)).slice(0, site.slices).entries()) {
      const file = `${key}-home-${i + 1}.webp`;
      await toWebp(part, file);
      files.push(file);
    }
  }
  for (const [i, y] of (site.scrollShots ?? []).entries()) {
    await desktop.evaluate((y) => scrollTo(0, y), y);
    await desktop.waitForTimeout(1000);
    const file = `${key}-scene-${i + 1}.webp`;
    await toWebp(await desktop.screenshot(), file);
    files.push(file);
  }
  for (const [i, path] of site.pages.entries()) {
    await desktop.goto(site.base + path, { waitUntil: "networkidle", timeout: 90_000 });
    await settle(desktop);
    const file = `${key}-page-${i + 1}.webp`;
    await toWebp(await desktop.screenshot(), file);
    files.push(file);
  }
  await desktop.context().close();

  const phone = await (
    await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    })
  ).newPage();
  for (const [i, path] of site.mobile.entries()) {
    await phone.goto(site.base + path, { waitUntil: "networkidle", timeout: 90_000 });
    await settle(phone);
    const file = `${key}-mobile-${i + 1}.webp`;
    await toWebp(await phone.screenshot(), file);
    files.push(file);
  }
  await phone.context().close();
  if (site.video) files.unshift(await recordScroll(key, site));
  capture[key] = files;
  console.log(key, files.length);
}
writeFileSync("scripts/content/sites/capture.json", JSON.stringify(capture, null, 2) + "\n");
await browser.close();
