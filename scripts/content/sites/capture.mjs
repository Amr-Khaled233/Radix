// Capture the live websites we built (read-only browsing: no forms, no cart actions): a cover
// and a desktop + phone walkthrough video per site.
// Output: scripts/content/sites/images/ + capture.json. Run: node scripts/content/sites/capture.mjs
import { chromium } from "@playwright/test";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "scripts/content/sites/images";
mkdirSync(OUT, { recursive: true });

/** tour: [path, scroll to ("end" or px), seconds] per page, for the desktop and the phone walkthrough. */
const SITES = {
  jexi: {
    base: "https://jexi-store.vercel.app",
    tour: {
      desktop: [
        ["/", "end", 16],
        ["/shop", 900, 6],
        ["/product/aurelia-pendant-necklace", 700, 6],
        ["/gift-boxes/rose-keepsake-box", 500, 5],
      ],
      mobile: [
        ["/", "end", 16],
        ["/product/aurelia-pendant-necklace", "end", 8],
      ],
    },
  },
  luwjje: {
    base: "https://www.luwjje.com",
    tour: {
      desktop: [
        ["/", "end", 8],
        ["/shop", "end", 5],
        ["/product/luwjje-hoodie", "end", 7],
      ],
      mobile: [
        ["/", "end", 8],
        ["/product/luwjje-hoodie", "end", 9],
      ],
    },
  },
  eldeeb: {
    base: "https://eldeeb-flax.vercel.app",
    // The building animation, then the rest of the page.
    tour: { desktop: [["/", 12000, 30]], mobile: [["/", "end", 26]] },
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

const DEVICES = {
  desktop: { viewport: { width: 1280, height: 720 }, video: { width: 1280, height: 720 } },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    // Playwright records CSS pixels: record at the viewport size, then scale 2× in ffmpeg
    // (a larger recordVideo size leaves the page in a corner of a gray frame).
    video: { width: 390, height: 844 },
    scale: "scale=780:1688:flags=lanczos",
  },
};

/**
 * Walkthrough video: opens each page of the tour and scrolls it smoothly
 * (to "end" or a pixel offset) over the given seconds. View-only: no clicks on
 * cart, forms or checkout. Converted to H.264 MP4 so it plays on every device.
 */
async function recordTour(key, site, device) {
  const { video, scale, ...options } = DEVICES[device];
  const ctx = await browser.newContext({ ...options, recordVideo: { dir: ".data/recordings", size: video } });
  const page = await ctx.newPage();
  for (const [path, to, seconds] of site.tour[device]) {
    await page.goto(site.base + path, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(1200);
    const target = await page.evaluate(
      (to) => (to === "end" ? document.documentElement.scrollHeight - innerHeight : to),
      to,
    );
    const steps = Math.round(seconds * 30);
    for (let i = 1; i <= steps; i++) {
      // Ease in and out, like a person scrolling.
      const t = i / steps;
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      await page.evaluate((y) => scrollTo(0, y), Math.round(target * eased));
      await page.waitForTimeout(1000 / 30);
    }
    await page.waitForTimeout(900);
  }
  const webm = await page.video().path();
  await ctx.close();
  const file = `${key}-tour-${device}.mp4`;
  execFileSync(
    ffmpegPath,
    [
      "-y",
      "-ss",
      "1.0",
      "-i",
      webm,
      ...(scale ? ["-vf", scale] : []),
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "27",
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

// Each case study shows its cover (the first screen) and two full walkthroughs: desktop, then phone.
// (Set SCREENSHOTS=1 to also save section screenshots into images/ for picking a different cover.)
const capture = {};
const browser = await chromium.launch();
for (const [key, site] of Object.entries(SITES)) {
  const desktop = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await desktop.goto(site.base + (site.home ?? "/"), { waitUntil: "networkidle", timeout: 90_000 });
  await settle(desktop);
  await toWebp(await desktop.screenshot(), `${key}-cover.webp`);
  capture[`${key}:cover`] = `${key}-cover.webp`;
  if (process.env.SCREENSHOTS) {
    const full = await desktop.screenshot({ fullPage: true });
    for (const [i, part] of (await slice(full)).entries()) await toWebp(part, `${key}-section-${i + 1}.webp`);
  }
  await desktop.context().close();
  capture[key] = [await recordTour(key, site, "desktop"), await recordTour(key, site, "mobile")];
  console.log(key, capture[key]);
}
writeFileSync("scripts/content/sites/capture.json", JSON.stringify(capture, null, 2) + "\n");
await browser.close();
