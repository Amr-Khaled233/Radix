# RADIX — website and dashboard

Marketing website and content dashboard for RADIX. Bilingual (English / Arabic with RTL), light and dark themes, multiple admins with roles, and a scroll-driven hero animation controlled from the dashboard.

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, next-intl, Drizzle ORM + Postgres (Neon), Better Auth, Vercel Blob, Nodemailer (SMTP) + React Email.
- **Specs:** [`docs/BUILD_SPEC.md`](docs/BUILD_SPEC.md) (functionality), [`docs/brand-guidelines.pdf`](docs/brand-guidelines.pdf) (visual), [`docs/brand-content.md`](docs/brand-content.md) (copy), [`docs/PLAN.md`](docs/PLAN.md) (architecture).

## Local development

Requirements: Node.js 22+ and pnpm (`npm i -g pnpm`).

```bash
pnpm install
cp .env.example .env.local        # then fill it in (see below)
pnpm db:local                     # terminal 1: embedded Postgres (PGlite) on port 5433, data in .data/pglite
pnpm db:migrate                   # terminal 2
pnpm db:seed                      # brand content: categories, services, page copy, settings
pnpm db:seed:admin                # first super admin, from SEED_SUPER_ADMIN_* in .env.local
pnpm db:seed:demo                 # optional: fake "Sample project" drafts for the dashboard
pnpm dev                          # http://localhost:3000 — dashboard at /admin
```

Minimum `.env.local` for local work:

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable
BETTER_AUTH_SECRET=<any random string, 32+ characters>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SEED_SUPER_ADMIN_EMAIL=you@example.com
SEED_SUPER_ADMIN_NAME=Your Name
SEED_SUPER_ADMIN_PASSWORD=<10+ characters>
```

In development, emails (invites, password resets) are printed to the terminal instead of being sent, and uploads are stored in `.data/uploads`. You can also point `DATABASE_URL` at a Neon development branch instead of PGlite.

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm typecheck` · `pnpm lint` · `pnpm format` | Checks |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | End-to-end tests (Playwright). Starts its own in-memory database and production build on port 3999. First run: `pnpm exec playwright install chromium` |
| `node scripts/e2e/screenshots.mjs http://localhost:3000` | Review screenshots of every page (EN/AR × light/dark × mobile/desktop) into `.data/screenshots` |
| `node scripts/qa/security.mjs` · `node scripts/qa/responsive.mjs` | Black-box security checks (headers, auth on every endpoint, open redirect, path traversal, rate limits) and horizontal-overflow checks at 320–1920 px. Run against the e2e server: `node scripts/e2e/server.mjs` in another terminal |
| `pnpm db:generate` | New migration after a schema change in `lib/db/schema` |
| `pnpm db:studio` | Browse the database |
| `pnpm brand:generate` | Rebuild the logo/icon components from `public/brand` |

The developer-only `/styleguide` page shows the tokens, type scale and brand components.

## Hero animation: preparing the video

Upload videos from **Dashboard → Pages → Hero animation**. For smooth scrubbing in both directions every frame should be a keyframe:

```bash
# Desktop MP4 — every frame a keyframe for perfect scrubbing
ffmpeg -i input.mov -an -vf "scale=1920:-2,fps=30" -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 23 -g 1 -movflags +faststart hero-desktop.mp4

# Desktop WebM (optional, smaller in Chrome/Firefox)
ffmpeg -i input.mov -an -vf "scale=1920:-2,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 34 -g 1 -row-mt 1 hero-desktop.webm

# Mobile portrait MP4
ffmpeg -i input-portrait.mov -an -vf "scale=1080:-2,fps=30" -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 25 -g 1 -movflags +faststart hero-mobile.mp4
```

`-g 1` gives perfect scrubbing but a larger file; `-g 2` to `-g 5` is a lighter compromise. Aim for 6–15 seconds, at most 12 MB on desktop and 6 MB on mobile. If the file is still too heavy, use **Frame sequence** mode: the dashboard turns the uploaded video into WebP frames in your browser. Posters are required for every mode; they are shown first, and they are all that visitors with reduced motion or Save-Data see.

## Deploying on Vercel

1. **GitHub:** push this repository to GitHub.
2. **Vercel project:** in [vercel.com](https://vercel.com) choose **Add New → Project** and import the repository. Vercel reads [`vercel.json`](vercel.json); its build command runs the migrations, the (idempotent) brand-content seed and the case-study import (below) before `next build`, so it works with Vercel's protected environment variables. Works on the free **Hobby** plan (check its current limits on vercel.com/pricing; Vercel’s terms reserve Hobby for non-commercial use, so move to Pro if that applies).
3. **Database:** Project → **Storage** → **Create Database** → **Neon** (Marketplace, free plan) → region **Frankfurt** → connect it to all environments. Then Settings → Functions → set the function region to **Frankfurt (fra1)** too. This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Optional: enable Neon branching for preview deployments so previews get their own database.
4. **File storage:** Project → **Storage** → **Create** → **Blob** (free tier) → connect it. This adds `BLOB_READ_WRITE_TOKEN`.
5. **Email (SMTP + app password, no domain needed):** on the Gmail account that will send the emails, turn on **2-Step Verification**, then open https://myaccount.google.com/apppasswords, create an app password named `RADIX` and copy the 16 characters. Add `SMTP_USER` (the Gmail address) and `SMTP_PASSWORD` (the app password) under Project → Settings → Environment Variables. Emails are sent as `RADIX <SMTP_USER>`; `EMAIL_FROM`, `SMTP_HOST` and `SMTP_PORT` are optional (defaults: Gmail, port 465). Gmail allows about 500 emails a day, plenty for invites, password resets and contact notifications.
6. **Remaining variables** (Settings → Environment Variables, Production and Preview):
   - `BETTER_AUTH_SECRET`: a random string; generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
   - `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL`: the site URL, for example `https://radix-xyz.vercel.app` (change them to the custom domain in step 9).
   - `SITE_TIME_ZONE`: for example `Africa/Cairo`.
   - Do **not** set `EMAIL_TRANSPORT` or `MEDIA_STORAGE` on Vercel; they are local-only.
7. **Deploy:** Deployments → **Redeploy** so the build runs with all variables.
8. **First super admin** (once): run the seed against the production database from your machine.
   ```bash
   pnpm dlx vercel link
   pnpm dlx vercel env pull .env.production.local --environment=production
   # add SEED_SUPER_ADMIN_EMAIL / _NAME / _PASSWORD to .env.production.local, then:
   pnpm dlx dotenv-cli -e .env.production.local -- pnpm db:seed:admin
   ```
   (Variables loaded this way take precedence over `.env.local`, so the seed writes to the production database.)
   Sign in at `/admin`, change the password from **Profile**, then delete `.env.production.local`. Invite the other admins from **Admins**.
9. **Custom domain (optional, any time later):** without one the site runs on its `*.vercel.app` address. Project → Settings → **Domains** → add the domain and follow the DNS instructions. Then update `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://your-domain` and redeploy.
10. **In the dashboard:** Settings → add the contact-notification email addresses, contact details and social links; review the Arabic texts flagged "Needs review".
11. **Smoke test:** sign in; forgot password → email → reset; create a category; publish a project; send the contact form; check both languages and both themes; test the hero on a real iPhone (Safari) and Android phone (Chrome).

Content changes go live within seconds (tag revalidation); no redeploy is needed.

## Importing the prepared case studies

`pnpm db:import:case-studies` runs in every Vercel build (see `vercel.json`). It creates projects that don't exist yet, refreshes an imported project when its files or text changed, and removes an imported project whose folder was deleted — **unless someone edited it in the dashboard**: then its text, status and order are left alone, and only a change to its image files here replaces the cover, gallery and captions. Text lives in `projects.ts` / `project.json`, images and videos in `images/`; each gallery file can carry a visible caption.

Each Sites & Systems case study shows a cover (the sign-in screen for a system, the first screen for a website), the write-up, then two full walkthroughs side by side: one recorded on a desktop and one on a phone. A gallery made only of videos gets that layout automatically.

- `scripts/content/portfolio/` → **Brand**, published: Mahmoud Hwary's brand identities (with his consent), credited to his team profile (created hidden).
- `scripts/content/sites/` → **Sites & Systems**, published: websites we built, with a desktop and a phone walkthrough video, captioned screenshots and a **Visit the live site** button (recaptured with `node scripts/content/sites/capture.mjs`).
- `scripts/content/systems/<slug>/` → **Sites & Systems** and `scripts/content/growth/<slug>/` → **Growth**: one folder per project (`project.json`, `capture.json`, `images/`, from the showcase prompts). Drafts by default; `"publish": true` in `project.json` publishes on import, `"captions"` (or `"captionsFromAlt": true`) adds the captions.

To add one: copy its `radix-case-study/` folder to `scripts/content/systems/<slug>/` (or `growth/<slug>/`), commit and push; the next deploy imports it.

Files are uploaded to Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set (local storage otherwise). Running it again skips what already exists. Then review each project in **Dashboard → Projects** and set it to **Published**; make Mahmoud visible in **Team** when his profile is ready. Project galleries accept images and videos (MP4/WebM), so a screen recording of a system can be added from the dashboard too.

## Accounts and who gets which messages

- **One super admin** (created once with `pnpm db:seed:admin`) manages every account from **Dashboard → Admins**: invites, roles, password reset links, deactivation and deletion. Nobody else can be made super admin, and the seed script won't create a second one.
- Other accounts are **Admin** (all content and settings) or **Editor** (content drafts).
- **Responsible for:** each account can be made responsible for one or more pillars (in the invite form, or later in the Admins table). It then sees in **Messages**, and is emailed, only the contact messages about those pillars. An account responsible for nothing has no inbox.
- The super admin sees every message. A message about a pillar nobody is responsible for (or with no pillar chosen) is emailed to the addresses in **Settings → Contact**, or to the super admin when that list is empty.
