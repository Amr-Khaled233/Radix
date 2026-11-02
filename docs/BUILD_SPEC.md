# RADIX — Website + CMS Build Brief (for Claude Code)

> Project build spec. Read it together with `CLAUDE.md` (project rules), `docs/brand-guidelines.pdf` (visual source of truth) and `docs/brand-content.md` (exact brand copy).

---

## 0. Your role and how to work

You are a senior full-stack engineer and product designer. Build a production-ready marketing website for **RADIX** (an integrated creative & digital solutions company) with a full admin dashboard (CMS). The site must be:

- **Bilingual:** English and Arabic, with full LTR / RTL support.
- **Themed:** Light mode and Dark mode, both on-brand.
- **Fully content-managed:** every piece of public content (categories, services, projects, portfolio, team, page copy, settings) is editable from the dashboard.
- **Multi-admin:** several admin accounts with roles, invitations, and a working password-reset flow for every admin.
- **Deployed on Vercel**, with the database and file storage provisioned through Vercel.
- **Scroll-driven hero video:** the first thing visitors see on the home page is a full-screen video animation that plays forward as they scroll down and backward as they scroll up — fully controlled from the dashboard (see §4A).

### Working rules

1. Before writing any code, read this entire file, then read `docs/brand-guidelines.pdf` page by page, then `docs/brand-content.md`. **The PDF is the source of truth for visual decisions; this file is the source of truth for functionality.** If they conflict on a visual point, follow the PDF and tell me. Most text in the PDF is outlined (not selectable), so take every piece of copy from `docs/brand-content.md`, which transcribes it exactly.
2. Start in **plan mode**. Produce a plan (architecture, database schema, route map, component inventory, phases, risks) and wait for my approval before coding.
3. Work through the phases in §15. At the end of each phase: run typecheck, lint, build and tests; commit with a clear message; give me a short summary of what's done and anything I need to do (accounts, env vars, decisions).
4. **Verify current APIs in the official docs before using them** (Next.js, next-intl, Better Auth, Drizzle, Neon, Vercel Blob, Resend, Tailwind CSS, shadcn/ui). Use the latest stable versions. Do not rely on memory for APIs that change between versions.
5. **Never invent content.** No fake clients, projects, testimonials, figures, awards or team members (this is a brand rule). Use the real brand copy from the PDF; leave everything else empty with good empty states.
6. Ask me before adding any paid service or deviating from the stack below.

---

## 1. Brand assets (already in the repo)

```
/public/brand/hor.svg      — horizontal lockup (icon + wordmark + "FOR CREATIVE SOLUTION")
/public/brand/ver.svg      — vertical lockup
/public/brand/typo.svg     — wordmark only
/public/brand/icon.svg     — standalone icon (eight ribbon forms)
/public/brand/icons/*.svg  — the 24 brand icons (4 pillar icons + 20 utility icons), 24×24, currentColor
/docs/brand-guidelines.pdf — visual source of truth
/docs/brand-content.md     — exact brand copy (EN) + Arabic drafts for review
```

**Provenance:** the logo and icon SVGs were extracted point-for-point from the vector artwork inside `brand-guidelines.pdf` (exported from Adobe Illustrator); geometry is untouched, only translated to the origin. Logos are filled `#1B1028` (Aubergine); icons use `currentColor`, 1.5 stroke, square caps, mitre joins. If the designer later supplies the original files, they replace these 1:1 with the same file names — build everything so that swap needs no code change.

### Logo rules (strict)

- The logo is **always** placed from the supplied SVG files. Never redraw, trace, retype, recreate or AI-generate the logo or the wordmark. Never set "radix" in a font to imitate the wordmark.
- The only allowed modification: replace fills with a single `currentColor` fill so the colour follows the theme. Geometry stays untouched. Do this with a small script that only touches `fill` attributes, keep the originals, and expose the result as a `<Logo variant="horizontal | vertical | wordmark | icon" />` component.
- Which version to use:
  - `hor.svg` — default: website header, footer, documents, email header.
  - `icon.svg` — small spaces: mobile header, favicon, app icons, sign-off after the full logo has appeared.
  - `ver.svg` — square/portrait formats: OG images, 404 page, closing sections.
  - `typo.svg` — where the icon is already present nearby, or space is too narrow for the descriptor.
- **Clear space** = x, where x ≈ 31% of the horizontal lockup's height. For the icon alone, 25% of its width.
- **Minimum sizes** (switch to a smaller version below these): horizontal 220 px wide, vertical 140 px, wordmark 72 px, icon 16 px.
- **Approved logo / background pairs only:** Ivory on Aubergine · Aubergine on White or Ivory · White on Electric Violet · Aubergine on Soft Lavender · Ivory on Graphite · Violet on Aubergine (large sizes only).
- The icon: always upright in its supplied orientation, one solid colour, never cropped, outlined, filled with imagery, or used as a container. **Never mirrored in RTL.**
- Logo motion: fades or slides as a whole only. Never morphed, spun or rebuilt.
- Generate favicon, `apple-touch-icon`, PWA icons and `manifest` from `icon.svg` (Ivory on Aubergine).
- The brand name is written **RADIX** in running text, exactly. In Arabic text keep "RADIX" in Latin letters (do not transliterate).

---

## 2. Design system

### 2.1 Colour palette (exact hex values only — never introduce new brand colours)

| Token | Name | Hex | Role |
|---|---|---|---|
| `aubergine` | Deep Aubergine | `#1B1028` | Primary. Depth, main dark ground, text on light |
| `violet` | Electric Violet | `#7854F6` | Primary accent. Actions, markers, core lines |
| `lavender` | Soft Lavender | `#C5B8FF` | Secondary. Secondary text on dark |
| `ivory` | Warm Ivory | `#F6F3EE` | Secondary. Light ground, text on dark |
| `graphite` | Graphite | `#292631` | Support. Dark UI surfaces |
| `white` | White | `#FFFFFF` | Support. Light surfaces |

Recommended proportion across a page: Aubergine 45% · Ivory 30% · Violet 10% · Lavender 8% · Graphite 5% · White 2%.

**Never use these combinations** (they fail contrast): Lavender on Ivory · Violet on Graphite · Aubergine on Graphite · Violet on Lavender.

Contrast reference: Ivory/Aubergine 16.5 (AAA) · Lavender/Aubergine 10.1 (AAA) · White/Violet 4.8 (AA) · Violet/Ivory 4.3 (large text only) · Violet/Aubergine 3.8 (large text & graphics only). Violet is **never** a body-text colour on dark.

### 2.2 Semantic theme tokens (Light & Dark)

Define CSS variables on `:root` (light) and `[data-theme="dark"]`, mapped into Tailwind v4 `@theme`. Components only use semantic tokens, never raw hex.

| Semantic token | Light | Dark |
|---|---|---|
| `--bg` | Ivory | Aubergine |
| `--surface` (cards, panels) | White | Graphite |
| `--text` | Aubergine | Ivory |
| `--text-muted` | Aubergine at ~70% (verify ≥ 4.5:1) | Lavender |
| `--label` (mono labels, small) | Aubergine at ~70% | Lavender |
| `--line` (hairlines, strata) | Aubergine at ~16% | Ivory at ~14% |
| `--line-strong` (surface line) | Aubergine | Ivory |
| `--accent` | Violet | Violet |
| `--on-accent` | White | White |
| `--inverse-bg` / `--inverse-text` | Aubergine / Ivory | Ivory / Aubergine |

Rules:
- In light mode, small violet text on Ivory fails AA (4.3:1), so small labels use `--label`. Violet is used for buttons (white text), core lines, nodes, focus rings, and large index numbers (≥ 24 px).
- In dark mode, no violet text and no thin violet lines on Graphite surfaces. Core lines and nodes sit on the Aubergine ground.
- "Inverse" sections (e.g. the "Shared foundation" bar, closing CTA) use the inverse tokens to keep the brand's dark/light rhythm in both themes.
- Functional status colours (success / warning / error) are **dashboard-only** and never appear on the public site. Pick values that pass AA in both themes.
- Border radius is **0** across the brand (square buttons, cards, inputs, images). Up to 2 px is acceptable for dashboard inputs only.

**Theme switching:** use `next-themes`. Options: System / Light / Dark; default System; persisted; no flash of wrong theme on load; set `color-scheme`. Theme toggle in the public header and in the dashboard, with a localized accessible label. The logo colour follows the theme via `currentColor`.

### 2.3 Typography

**Latin**
- **Manrope** (weights 300–700) — display, headings, body, UI.
- **IBM Plex Mono** (400, 500) — labels, index numbers, data, captions.

**Arabic** — Manrope and IBM Plex Mono have no Arabic glyphs. Use **IBM Plex Sans Arabic** (300–700, Open Font License, same Plex family as the brand's mono) for all Arabic text, including labels. Keep this in one place (font tokens) so it can be swapped if I choose another Arabic face later.

Load all fonts with `next/font/google` (self-hosted, `display: swap`). Font stacks:
- `--font-sans`: `Manrope, "IBM Plex Sans Arabic", system-ui, sans-serif` — Latin glyphs render in Manrope, Arabic glyphs fall back to Plex Sans Arabic.
- `--font-mono`: `"IBM Plex Mono", "IBM Plex Sans Arabic", ui-monospace, monospace`.

**Type scale (web, px)** — size / line-height · weight · letter-spacing

| Style | Spec | Mobile |
|---|---|---|
| Display | 96 / 96 · 500 · −3.5% | clamp down to ~48 |
| H1 | 64 / 68 · 500 · −3% | clamp down to ~40 |
| H2 | 44 / 50 · 500 · −2% | clamp down to ~32 |
| H3 | 28 / 36 · 600 · −1% | 24 |
| H4 | 20 / 28 · 600 · 0 | 20 |
| Body | 17 / 28 · 400 (Large: 20 / 32) | 16 / 26 |
| Button | 15 / 20 · 600 · +1% | same |
| Label | Mono 12 / 16 · 500 · +12% · UPPERCASE | same |
| Data | Mono 14 / 20 · 400 · tabular numbers | same |

**Arabic typography overrides** (`html[lang="ar"]`):
- `letter-spacing: 0` everywhere. Tracking (negative or positive) breaks Arabic letter joining.
- No `text-transform: uppercase` on Arabic labels (Arabic has no case). Arabic labels: weight 500, 1–2 px larger than the Latin label.
- Increase line-height ~10–15% for body and headings.
- Use Western digits (0–9) for index markers, data and years in both languages (keeps the index system consistent). Add a setting to switch Arabic pages to Arabic-Indic digits later.
- Wrap embedded Latin terms (RADIX, SaaS, UI/UX), emails and phone numbers in `<bdi>` or `dir="ltr"` spans so they don't scramble in RTL.

### 2.4 Spacing, grid, layout

- 8 px spacing base.
- Strata spacing follows a Fibonacci progression: 8 · 13 · 21 · 34 · 55 · 89 · 144 px.
- 12-column grid, 1440 px max content width, fluid side margins (≈ `clamp(16px, 6.25vw, 96px)`).
- Hairlines 1 px. Surface line 2 px, full-bleed.
- Sticky header.

### 2.5 Graphic language — four elements, each has a job

Build these as reusable components in `components/brand/`:

- **A. Surface line** `<SurfaceLine />` — a full-bleed 2 px rule that divides *outcome* (above: headline, result) from *foundation* (below: strategy, systems, detail). **One per composition / section.**
- **B. Strata** `<Strata />` — hairlines below the surface line, spaced 8 · 13 · 21 · 34 · 55 · 89 · 144 px. Express depth and growth. Used in hero, covers, section dividers.
- **C. Core lines** `<CoreLines nodes={[...]} />` — vertical violet lines descending from the surface line, each ending in a square node (~12 px). They connect a headline to its supporting detail (e.g. hero → the pillars, process steps). Nodes sit at staggered depths.
- **D. Index markers** `<IndexMarker n="01" label="Brand" />` — mono numbers and labels (`01 — BRAND`). Make structure visible: chapters, pillars, steps.

Combinations from the guidelines: Surface + Strata (covers, dividers, hero) · Surface + Core lines (processes, timelines, service maps) · Surface + Index (social-style cards, campaign frames; violet ground used sparingly).

Rules: no filler shapes, no gradients, no glows, no blobs, no literal roots, trees or leaves. Information design over illustration. In RTL these elements mirror (core lines anchor from the inline-start side).

### 2.6 Iconography

The brand icon set is **supplied** in `public/brand/icons/` — 24 SVGs extracted from the Iconography page: 24 px grid, 1.5 px stroke, square caps, mitre joins, angles of 0° / 45° / 90° only, a square node as the one filled detail. Independent of the RADIX icon and never derived from it.

- Pillar icons: `brand`, `digital`, `intelligence`, `growth`.
- Utility icons: `core-lines`, `connector`, `arrow-right`, `arrow-up-right`, `filter`, `chart`, `mail`, `calendar`, `sliders`, `search`, `menu`, `close`, `check`, `plus`, `home`, `folder`, `bell`, `user`, `link`, `pin`.
- Expose them through one `<Icon name="…" />` component (inline SVG, typed `name` union) so colour follows `currentColor`. Do not alter their geometry.
- Only if a needed icon is missing, draw a new one following exactly the same rules, and tell me.
- The category icon picker in the dashboard chooses from this set.
- Directional icons (arrows, chevrons) mirror in RTL; all others do not.
- The dashboard may use `lucide-react` for UI chrome only, set to 1.5 stroke, square caps, mitre joins.

### 2.7 Motion — "Structural reveal: surface first, foundation second"

| Time | What happens |
|---|---|
| 0–400 ms | Surface line draws from inline-start to inline-end (left→right in EN, right→left in AR) |
| 200–600 ms | Headline rises 24 px from the line and fades in |
| 500–900 ms | Core lines grow downward, staggered 80 ms |
| 800–1100 ms | Nodes and supporting text settle |

- Easing: `cubic-bezier(.2, 0, 0, 1)`. Durations: 160 ms UI · 240 ms hover · 480 ms reveal.
- Reveal once on viewport entry. No scroll-jacking (never take over wheel or touch scrolling), no parallax. The one scroll-linked element is the home hero video (§4A): it responds to native scroll, it never controls it.
- `prefers-reduced-motion`: no movement, opacity only or instant.
- Prefer CSS; use the `motion` library only where CSS isn't enough.

### 2.8 Imagery (used as guidance text in the dashboard uploader)

- **Do:** one light source, deep shadows, muted cool grade that sits with Aubergine, generous negative space for type. Themes: *Structure* (architecture, stairs, junctions, cut sections), *Process* (real work in progress, hands, paper, screens, natural light, unposed), *Material* (layered surfaces up close: edges, depth, precision).
- **Avoid:** glowing brains, robots, holograms, neon networks, literal roots and trees, generic office stock.
- The logo is never generated inside an image; it is always overlaid from the SVG.
- These rules apply equally to the hero video (§4A): slow, deliberate camera movement, one light source, muted cool grade, no logo or baked-in text inside the footage.

### 2.9 Voice and copy

- Confident and intelligent, never pretentious. Quality is shown through precision, proportion and space.
- Messaging principles: (1) lead with the foundation — explain the reasoning before the output; (2) say it plainly — name the service and the result, no jargon or hype; (3) show the connection between disciplines, not as a list; (4) use the "root / foundation" metaphor sparingly, once per piece; (5) claim only what is true.
- Write: "We design and build websites that are clear to use and built to evolve." Avoid: "Cutting-edge, next-generation digital solutions that revolutionise your brand."
- **Primary tagline** "Where Growth Takes Root." — hero, closing, campaign frames; once per page.
- **Secondary statement** "Rooted in Strategy. Built for Growth." — supporting copy, about sections, footer. Never set both at the same size.
- **Arabic copy:** natural Modern Standard Arabic with the same tone, not a literal translation. Seed Arabic versions of all brand copy and flag them **"Needs review"** in the dashboard. Suggested tagline seed: «حيث يتجذّر النمو.»

---

## 3. Tech stack

- **Framework:** Next.js, latest stable (16.x at time of writing), App Router, TypeScript strict, React Server Components, Server Actions. Use the request-interception file convention of the installed version (`proxy.ts` in v16).
- **Styling:** Tailwind CSS v4 with CSS-variable tokens. Logical properties for RTL (`ms-/me-/ps-/pe-/start-/end-`), `rtl:` variants only where needed.
- **i18n:** `next-intl`. Locales `["en", "ar"]`, locale-prefixed routes (`/en/...`, `/ar/...`), detection via `Accept-Language` + cookie on `/`, default locale from `DEFAULT_LOCALE` (default `en`).
- **Theme:** `next-themes`.
- **Database:** Postgres on **Neon via the Vercel Marketplace** (Vercel Postgres no longer exists; Neon is the native Vercel Postgres integration). **Drizzle ORM** + `drizzle-kit` migrations, Neon serverless driver. Pooled URL at runtime, unpooled URL for migrations.
- **Auth:** **Better Auth** — email + password, password reset, sessions, built-in rate limiting — with the **admin plugin** (roles, deactivate/ban, list users) and the Drizzle adapter. **Public sign-up disabled.**
- **Email:** Resend + React Email templates (EN / AR with RTL). If `RESEND_API_KEY` is missing in development, log email links to the console.
- **File storage:** Vercel Blob (client uploads through an authenticated token route). `next/image` with `remotePatterns` for the Blob host.
- **Forms & validation:** react-hook-form + zod (shared schemas between client and server).
- **Dashboard UI:** shadcn/ui re-themed to the brand tokens with square corners; TanStack Table for lists; dnd-kit for drag-to-reorder; Tiptap rich-text editor (JSON storage, RTL-aware per language tab, limited toolbar: H2, H3, bold, italic, lists, link, quote).
- **Rich-text output:** render Tiptap JSON to sanitized HTML on the server.
- **Analytics (optional, env flag):** `@vercel/analytics` and `@vercel/speed-insights`.
- **Testing:** Vitest (permissions, zod schemas, utils) and Playwright (e2e).
- **Package manager:** pnpm.

Note: shadcn/ui is built on "Radix UI" primitives. That's unrelated to the RADIX brand; keep brand components under `components/brand/` to avoid naming confusion.

### Suggested structure

```
app/[locale]/(site)/...      public site
app/admin/...                dashboard (not locale-prefixed; UI language from admin preference)
app/api/...                  auth, uploads, revalidation, contact
components/brand/            Logo, SurfaceLine, Strata, CoreLines, IndexMarker, Icon set
components/site/             public sections
components/admin/            dashboard components
lib/db/                      schema, queries, localized helpers
lib/auth/                    Better Auth config, permissions
lib/i18n/                    next-intl config
messages/en.json, ar.json    UI strings
public/brand/                supplied SVGs
docs/                        brand PDF, this spec
```

---

## 4. Public site — information architecture

All content comes from the database. Only UI strings live in `messages/{en,ar}.json`.

Routes under `/[locale]`:

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About RADIX |
| `/services` | All visible categories |
| `/services/[slug]` | Category detail (its services + related projects) |
| `/work` | Portfolio, filterable by category |
| `/work/[slug]` | Project case study |
| `/team` | Team grid (section can be toggled off) |
| `/team/[slug]` | Team member bio |
| `/contact` | Contact form + details |
| `/privacy` | Editable legal page |
| 404 / error | Localized, on-brand (uses `ver.svg`) |

Plus `sitemap.xml`, `robots.txt`, dynamic OG images.

**Header (sticky):** `hor.svg` (switch to `icon.svg` on mobile or when the lockup would render under 220 px) · nav: About, the visible categories listed directly if there are 4 or fewer (as in the brand website mockup) otherwise a "Services" dropdown, Work, Team · language switcher (`EN | عربي`) · theme toggle · primary CTA **"Start a conversation"** → `/contact`. Mobile: `icon.svg` + menu button → full-screen menu using index markers (`01 — BRAND` …).

**Footer:** logo, secondary statement, navigation, categories, contact details and social links (from settings), language and theme switchers, copyright.

**Home sections** (each section's copy is editable; each can be shown/hidden and reordered from the dashboard):
1. **Hero** — when the hero animation is enabled, this is the scroll-driven video hero described in §4A. Otherwise (or as its fallback): mono label "INTEGRATED CREATIVE & DIGITAL SOLUTIONS", Display tagline, intro paragraph, CTAs ("Start a conversation", "Explore services"). In both cases it ends with the surface line + strata + core lines descending to:
2. **Pillars** — visible categories, each with index number, icon, name, tagline, link.
3. **Positioning** — "One partner connecting the disciplines a business usually has to coordinate on its own." + the connected disciplines.
4. **Featured work** — featured projects (hidden when empty).
5. **How we work** — process steps using the core-lines pattern.
6. **Team preview** — hidden when empty.
7. **Closing CTA** — secondary statement + CTA (inverse section).

**About:** intro statement · the meaning of radix (Latin for root) · brand essence "Foundational Growth." · core idea (Strategy, Systems, Technology, Craft) · purpose / vision / mission · brand promise (Build / Connect / Create) · six values · who we work with · team.

**Category page:** index marker + name + tagline + description · list of visible services · projects assigned to this category (featured first, admin-ordered) · CTA.

**Work index:** category filter (URL query `?category=`), grid of project cards (cover, title, client, categories, year), empty state.

**Case study:** title, client, year, categories, services · cover · summary · rich body · gallery · results (only real figures entered by an admin) · credits (linked team members) · next project · CTA.

**Team:** cards (photo, name, role, short bio). Detail page: full bio, expertise (categories), links, projects they worked on.

**Contact:** name, email, company, phone (optional), interested categories (multi-select from visible categories), message. Honeypot + rate limit, success state. Saves to the database and emails a notification to the addresses set in settings.

---

## 4A. Home hero — scroll-driven video animation (controlled from the dashboard)

The first thing a visitor sees on the home page is a full-screen video animation that plays **forward as they scroll down and backward as they scroll up**. Every aspect of it is controlled from the dashboard.

### Behaviour

1. **On load — visible instantly.** The poster frame fills the viewport immediately (it is the LCP element, loaded with priority and correct sizes). The brand structural reveal runs on top of it: mono label → surface line draws → headline rises. If "Intro autoplay" is enabled, the video plays by itself from 0 to the configured progress (e.g. 0–15%) as soon as it has buffered, then hands control to scroll.
2. **On scroll.** The hero is a tall section (scroll length set in the dashboard, e.g. 300vh) containing a sticky full-viewport stage. Scroll progress through the section (0 → 1) maps to video time between the configured start and end times. Scrolling up reverses it. Interpolate toward the target time in a `requestAnimationFrame` loop with a smoothing factor so it feels fluid, not steppy.
3. **Text beats.** While scrolling, text "beats" defined in the dashboard rise/fade in and out at their progress ranges (e.g. 0–20% tagline, 25–55% positioning line, 60–90% secondary statement). They are real DOM text, localized EN/AR, positioned start / center / end (mirrors in RTL), styled with the brand type scale.
4. **Exit.** At the end of the section, the surface line draws across the bottom of the stage and the core lines descend into the Pillars section — "surface first, foundation second".
5. **Native scroll only.** Never hijack wheel or touch, no smooth-scroll libraries that take over scrolling, no scroll snapping. The page scrolls normally; only the video responds.
6. **Controls for the visitor:** a scroll hint at the start (mono "SCROLL" label + a short core line) and a "Skip intro" link (mono label, bottom inline-end) that jumps to the section after the hero.
7. **Colour:** the hero stage stays a dark composition in both themes (Aubergine ground, Ivory text, Aubergine overlay on the footage), so text contrast stays ≥ 4.5:1 regardless of light/dark mode.

### Rendering modes (chosen in the dashboard)

- **Video scrub (default):** `<video muted playsinline preload="auto">` with MP4 (H.264) + optional WebM (VP9); `currentTime` driven by scroll progress. Needs a scrub-friendly encode (keyframe every 1–2 frames, no audio, faststart) — see the encode commands below.
- **Frame sequence (smoothest, especially on iOS Safari):** the dashboard converts the uploaded video into a sequence of WebP frames **in the admin's browser** (seek frame by frame using `requestVideoFrameCallback`, draw to a canvas, export WebP at the chosen width and fps), then uploads the frames to Vercel Blob and stores the sequence. The public page draws frames onto a `<canvas>` (cover-fit with focal point). Loading strategy: first frame immediately, then every 8th frame, then fill the gaps, so scrubbing works before everything has loaded.
- **Autoplay loop:** plays muted and loops, not linked to scroll.
- **Static:** poster image only (classic hero).

### Automatic fallbacks

- `prefers-reduced-motion: reduce` → static poster with the text beats shown as a normal stacked hero; no scrubbing, no autoplay.
- Save-Data or slow connection (`navigator.connection.saveData`, effective type 2g/3g) → static poster (or the autoplay loop of the mobile asset if the admin allows it).
- Video or frames fail to load → the poster stays; no broken UI.
- Mobile → use the mobile asset (portrait 9:16 or 4:5) if uploaded, otherwise the desktop asset with the mobile focal point; separate, shorter scroll length on mobile.
- Hero off-screen → pause the rAF loop (IntersectionObserver).
- The video element is decorative (`aria-hidden="true"`); all meaning lives in the DOM text beats.

### Dashboard — "Pages & content → Home → Hero animation"

- **Enabled** on/off (off = standard hero).
- **Mode:** Video scrub · Frame sequence · Autoplay loop · Static.
- **Assets:** desktop video (16:9; MP4 required, WebM optional) · mobile video (optional) · poster images for desktop and mobile (required; offer "Use current frame as poster" from the preview) · optional Arabic-specific video in case the footage ever contains text. Large files go through Vercel Blob **client (multipart) uploads**.
- **Frame-sequence generation:** fps (12–30), width (desktop 1280 / 1600 / 1920; mobile 720 / 1080), quality; progress bar; regenerate.
- **Scroll length:** desktop (150–600vh) and mobile (100–400vh).
- **Trim:** start and end time used for scrubbing, on a timeline with thumbnails.
- **Intro autoplay:** off, or play to X% on load.
- **Smoothing:** 0 (direct) → 1 (very smooth).
- **Fit & focal point:** cover / contain; focal-point picker for desktop and mobile.
- **Overlay:** Aubergine overlay opacity 0–80%, with a live contrast indicator against the text beats.
- **Text beats** (repeatable, drag to reorder): text EN / AR, style (Label / Display / H2 / Body), position (start / center / end × top / middle / bottom), progress range from–to (%), visible toggle.
- **Toggles:** scroll hint · "Skip intro" link · exit surface line.
- **Live preview:** desktop / mobile switch, EN / AR switch, and a slider that simulates scroll progress with the text beats rendered on top.
- **Guidance & validation:** warn if desktop video > 12 MB or mobile > 6 MB, recommend 6–15 s duration and ≤ 1920 px width, show the imagery rules from §2.8, and a "How to export a scrub-friendly video" help panel with the commands below.
- **Publishing:** goes live on save (revalidate home in both locales); keep the previous published configuration so the admin can "Revert to previous" in one click.

### Recommended encode (include in the README and in the dashboard help panel)

```bash
# Desktop MP4 — every frame a keyframe for perfect scrubbing
ffmpeg -i input.mov -an -vf "scale=1920:-2,fps=30" -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 23 -g 1 -movflags +faststart hero-desktop.mp4

# Desktop WebM (optional, smaller in Chrome/Firefox)
ffmpeg -i input.mov -an -vf "scale=1920:-2,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 34 -g 1 -row-mt 1 hero-desktop.webm

# Mobile portrait MP4
ffmpeg -i input-portrait.mov -an -vf "scale=1080:-2,fps=30" -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 25 -g 1 -movflags +faststart hero-mobile.mp4
```

`-g 1` makes every frame a keyframe: perfect scrubbing in both directions, larger file. `-g 2` to `-g 5` is a lighter compromise. If the file is still too heavy, use Frame-sequence mode.

---

## 5. Data model (Drizzle / Postgres)

**Localized fields:** `jsonb` of shape `{ en: string; ar: string }` via a typed `localized()` helper with a zod schema. Rich text: `{ en: TiptapJSON | null; ar: TiptapJSON | null }`. A `t(field, locale)` helper falls back to the other language when one is empty; the dashboard shows translation-missing warnings.

Common columns on content tables: `id`, `created_at`, `updated_at`, `created_by`, `updated_by`.

- **Better Auth tables** — `user` (+ `role`: `super_admin | admin | editor`, `banned`, `preferred_locale`, `preferred_theme`), `session`, `account`, `verification`.
- **categories** — `slug` (unique), `name` (L), `tagline` (L), `description` (L, rich), `icon_key` (enum from the icon set), `sort_order`, `is_visible`, `show_in_nav`, `show_on_home`, `seo_title` (L), `seo_description` (L), `og_image_id`. The displayed index number (01, 02…) is derived from `sort_order`.
- **services** — `category_id`, `name` (L), `description` (L, short), `sort_order`, `is_visible`.
- **projects** — `slug`, `title` (L), `client_name` (L), `summary` (L), `body` (L, rich), `cover_image_id`, `year`, `external_url`, `status` (`draft | published | archived`), `is_featured`, `sort_order`, `published_at`, SEO fields.
- **project_categories** — `project_id`, `category_id`, `is_featured_in_category`, `sort_order` (a project can span several pillars).
- **project_services** — `project_id`, `service_id`.
- **project_media** — `project_id`, `media_id`, `caption` (L), `sort_order`.
- **project_results** — `project_id`, `value`, `label` (L), `sort_order` (dashboard helper text: real figures only).
- **project_team** — `project_id`, `team_member_id`, `role` (L).
- **team_members** — `slug`, `name` (L), `role` (L), `short_bio` (L), `bio` (L, rich), `photo_id`, `email` (optional, hidden unless toggled), `links` (jsonb `[{type, url}]`), `sort_order`, `is_visible`, `show_on_home`.
- **team_member_categories** — expertise.
- **media** — `kind` (`image | video`), `url`, `pathname`, `content_type`, `size`, `width`, `height`, `duration` (videos), `alt` (L, required for images), `uploaded_by`.
- **frame_sequences** — `source_media_id`, `variant` (`desktop | mobile`), `base_path` (Blob prefix, e.g. `hero/frames/{id}/0001.webp`), `frame_count`, `fps`, `width`, `height`, `format`, `created_at`.
- **settings** — `key` (PK) + `value` (jsonb), each key validated by its own zod schema: `general` (contact email, phone, address (L), socials), `seo` (title template, default description, default OG image), `home` (section copy, visibility, order), `about` (all about blocks), `process` (steps), `legal` (privacy page), `contact` (notification emails), `locale` (default locale, digit style), `hero` (every hero-animation setting from §4A, plus the previous published configuration for one-click revert).
- **contact_submissions** — `name`, `email`, `company`, `phone`, `message`, `category_ids`, `locale`, `status` (`new | read | archived`), `ip_hash`, `user_agent`, `created_at`.
- **audit_log** — `actor_id`, `action`, `entity_type`, `entity_id`, `summary` (jsonb), `created_at`.

Indexes on `slug`, `status`, `sort_order`, foreign keys. Deleting a category that has projects requires confirmation (projects keep their other categories). Projects use `archived` instead of hard delete by default.

---

## 6. Roles and permissions

| Capability | super_admin | admin | editor |
|---|---|---|---|
| Manage admins (invite, change role, deactivate, send reset link, delete) | ✓ | — | — |
| View audit log | ✓ | — | — |
| Site settings | ✓ | ✓ | — |
| Categories & services: create, edit, reorder, show/hide, delete | ✓ | ✓ | edit only |
| Projects / team / pages: create, edit | ✓ | ✓ | ✓ (drafts) |
| Publish, unpublish, feature, delete | ✓ | ✓ | — |
| Media library | ✓ | ✓ | upload & edit alt |
| Messages inbox | ✓ | ✓ | — |

- One central permission map `can(user, action, resource)`, **enforced server-side in every Server Action and route handler**. Never rely only on hidden UI or on `proxy.ts`.
- The UI hides actions the user can't perform.
- Safeguards: a user cannot demote, deactivate or delete themselves; the last `super_admin` can never be demoted, deactivated or deleted.

---

## 7. Authentication and admin accounts

- Dashboard lives at `/admin`. Not linked from the public site, `noindex`, disallowed in `robots.txt`.
- **Login:** email + password, generic error messages, strict rate limiting on sign-in and reset endpoints. Session cookie `httpOnly`, `secure`, `sameSite=lax`; 7-day sessions with sliding refresh.
- **No public sign-up.** Admins are created only by a `super_admin`.
- **Invite flow:** super admin enters name, email, role → account created with a random unguessable password → "Set your password" email (reset-style token, valid 48 h) → admin sets password → signs in.
- **Forgot password:** `/admin/forgot-password` → always responds "If an account exists, we've sent a link" (no user enumeration) → single-use token link valid 1 h → `/admin/reset-password?token=…` → new password (min 10 characters, strength meter) → all other sessions revoked → redirect to login.
- **Admin-initiated reset:** a super admin can send a reset link to any admin. Nobody can see or directly set another admin's password.
- **Profile:** change own password (requires current password), sign out of all sessions, preferred language and theme.
- **First super admin:** `pnpm db:seed:admin` reads `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_NAME`, `SEED_SUPER_ADMIN_PASSWORD`; idempotent; prints a reminder to change the password after first login.
- **Emails:** branded (icon PNG, Ivory/Aubergine), plain-text alternative, sent in the recipient's `preferred_locale` with RTL layout for Arabic.
- **Optional, phase 2:** two-factor authentication (Better Auth `twoFactor` plugin) behind a setting.

---

## 8. Dashboard (CMS)

**Look:** follow the "Digital Interface Direction" page of the guidelines — sidebar navigation; Graphite / Aubergine surfaces in dark, Ivory / White in light; violet only for primary actions, focus and the active chart series; status colours UI-only; mono labels; tabular mono numbers; square corners. Theme toggle and language toggle in the top bar. **The dashboard UI is fully localized (EN / AR, with RTL).**

**Every content form has EN | AR tabs**, with a completeness badge per item (EN ✓ · AR ⚠).

1. **Overview** — counts (published projects, drafts, categories, team members, new messages), recent messages, recent activity, translation gaps ("5 items missing Arabic"), quick actions.
2. **Categories** — list with drag-and-drop ordering; toggles: visible, in nav, on home; icon picker; edit form (name, tagline, description, SEO, OG image); a nested **Services** manager (add, edit, reorder, show/hide, delete); a panel to assign, feature and order projects shown on this category's page; preview link.
3. **Projects** — table with search and filters (category, status, featured); create / edit (EN | AR); slug auto-generated from the English title (editable, unique); cover + gallery uploader (drag to reorder, EN + AR alt text required); categories and services multi-select; team credits; results (real figures only); status (draft / published / archived); featured toggle; publish date; SEO; **Preview** (draft mode) and **View live**; duplicate project.
4. **Team** — drag-to-reorder list; visibility and "show on home" toggles; edit form: square photo crop, name, role, short bio, full bio, expertise categories, links.
5. **Pages & content** — **Hero animation** editor with live preview (all controls in §4A), Home sections (copy, visibility, order), About blocks (purpose / vision / mission, values, promise, audience…), process steps, privacy page, footer text.
6. **Messages** — inbox with status (new / read / archived), detail view, mark read / archive, CSV export, reply via `mailto:`.
7. **Media library** — grid, search, edit alt text, see where each file is used, delete only if unused. Uploader shows the imagery guidance from §2.8. Allowed uploads: images (JPG, PNG, WebP, AVIF) up to 10 MB; videos (MP4, WebM) up to 200 MB, used by the hero animation, uploaded via Blob client multipart uploads. No SVG uploads (XSS risk).
8. **Admins** (super_admin only) — list with role, status and last login; invite; change role; deactivate / reactivate; send reset link.
9. **Settings** — contact details, social links, SEO defaults, default locale, digit style, notification emails, analytics toggle.
10. **Profile** — name, photo, preferred language and theme, change password, active sessions.
11. **Audit log** (super_admin only).

**UX:** unsaved-changes warning, toasts, optimistic toggles, confirmation dialogs for destructive actions, inline validation in the current UI language, fully keyboard-accessible.

**Publishing:** every save revalidates the affected public pages in both locales (cache tags), so changes appear on the live site within seconds — no redeploy. Draft previews use Next.js draft mode.

---

## 9. Bilingual requirements (EN / AR)

- `<html lang dir>` set per locale; `dir="rtl"` for Arabic.
- All layouts use logical properties. Mirror in RTL: layout, core lines, surface-line draw direction, arrows, breadcrumbs, carousels. Never mirror: the logo, non-directional icons, photos, numbers.
- No hardcoded UI strings; ICU plurals.
- Content localized per field with fallback (see §5).
- One shared Latin slug per item across both locales (`/ar/work/project-slug`).
- SEO: `hreflang` alternates (`en`, `ar`, `x-default`), localized metadata, both locales in the sitemap, `og:locale`.
- Dates via `Intl` per locale.
- Language switcher (`EN | عربي`) keeps the same page and query string and sets the `NEXT_LOCALE` cookie.
- Forms, validation messages, emails, 404 and error pages are all localized.
- Test every page in both directions at 375, 768, 1280 and 1440 px.

## 10. Light / Dark requirements

- Implemented through the semantic tokens in §2.2 — no component hardcodes a colour.
- Toggle in the public header and the dashboard; default System; no flash on load.
- Both themes pass WCAG 2.2 AA (≥ 4.5:1 text, ≥ 3:1 UI components). Run an automated contrast check over every token pair you use.
- OG images always use the Aubergine ground.
- Test every component and page in both themes.

---

## 11. Quality: performance, SEO, accessibility, security

**Performance:** public pages statically rendered / cached with tag revalidation; mostly Server Components with minimal client JS; `next/image` with proper `sizes` and AVIF/WebP; fonts via `next/font`; no layout shift. Target Lighthouse ≥ 95 in all four categories on the home page (mobile). With the hero animation enabled, the poster stays the LCP element; video or frames start loading after first paint and never block it; the scrub loop must hold ~60 fps on a mid-range phone (no layout work inside the rAF loop, transforms/opacity only for text beats).

**SEO:** Metadata API with localized title/description from the DB (with defaults); canonical URLs; `hreflang`; sitemap; robots (disallow `/admin`, `/api`); JSON-LD: Organization, WebSite, CreativeWork (projects), Person (team); dynamic OG images with `next/og` in the brand layout (Manrope for EN, IBM Plex Sans Arabic for AR, logo from the SVG).

**Accessibility:** WCAG 2.2 AA; semantic landmarks; skip link; visible focus ring (violet, 2 px, offset); keyboard-operable menus and dialogs; required alt text; reduced motion; labelled form fields with clear errors.

**Security:** authorization in every Server Action and route handler; server-side zod validation; parameterized queries (Drizzle); sanitized rich-text output; Blob upload tokens only for signed-in admins with type/size limits; security headers (CSP, HSTS, `frame-ancestors`, Referrer-Policy, Permissions-Policy); rate limiting on login, reset and contact; honeypot on contact; no secrets in client bundles; audit log for all content and admin mutations; strong `BETTER_AUTH_SECRET`.

---

## 12. Seed content

Seed from `docs/brand-content.md` — English copy exactly as written there, plus the Arabic drafts it provides (and your own drafts for anything it doesn't cover), all Arabic flagged "Needs review":

- **Four categories with their services:**
  - **01 Brand** — "Build from the Core." — Brand strategy · Naming · Logo design for new clients · Brand identity systems · Visual identity · Brand guidelines · Packaging · Brand applications · Art direction · Brand communication systems.
  - **02 Digital** — "Turn Ideas into Experiences." — Website design · Website development · Landing pages · UI/UX design · Digital product design · SaaS interfaces · Responsive experiences · Digital platforms.
  - **03 Intelligence** — "Make Technology Work Smarter." — AI-powered video production · AI-assisted creative production · Intelligent digital systems · Workflow automation · AI integration · SaaS solutions · Business process improvement · Digital tools and systems.
  - **04 Growth** — "Grow with Purpose." — Social media management · Content strategy · Social media design · Digital campaigns · Creative production · Content development · Brand communication · Digital growth initiatives.
- **About content**, copied exactly from the PDF: intro statement, meaning of radix, brand essence, core idea (Strategy / Systems / Technology / Craft), purpose, vision, mission, brand promise, six values, personality, audiences, brand narrative.
- **Process steps:** Discover · Define · Build · Grow (titles only; descriptions left for me to write).
- **Settings:** empty contact details for me to fill in.
- **No projects, no team members, no testimonials.** Public sections hide gracefully when empty.
- Optional dev-only `pnpm db:seed:demo` with obviously fake "Sample project" items saved as drafts — never run against production.

---

## 13. Environment variables (`.env.example`)

```
# Injected by the Neon integration (read what it actually injects and map names if different)
DATABASE_URL=                 # pooled — runtime
DATABASE_URL_UNPOOLED=        # direct — migrations

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=              # e.g. https://radix.example
NEXT_PUBLIC_SITE_URL=

BLOB_READ_WRITE_TOKEN=        # injected by Vercel Blob

RESEND_API_KEY=
EMAIL_FROM="RADIX <no-reply@your-domain>"

DEFAULT_LOCALE=en

SEED_SUPER_ADMIN_EMAIL=
SEED_SUPER_ADMIN_NAME=
SEED_SUPER_ADMIN_PASSWORD=

NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

---

## 14. Deployment on Vercel — write this as a step-by-step README section

1. Push the repo to GitHub and import it in Vercel.
2. Project → **Storage** → add **Neon Postgres** from the Marketplace → connect to the project for all environments. Locally: `vercel env pull .env.local`.
3. Project → **Storage** → add a **Blob** store → connect (`BLOB_READ_WRITE_TOKEN`).
4. Resend: verify the sending domain, add `RESEND_API_KEY` and `EMAIL_FROM`.
5. Add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`.
6. Migrations: run `pnpm db:migrate` as part of the production build command (e.g. `pnpm db:migrate && next build`). Optional: Neon branching for preview deployments.
7. Create the first super admin once with `pnpm db:seed:admin`, then change the password from the profile page.
8. Connect the custom domain and update the URL env vars.
9. Run the smoke-test checklist (login, reset password, create category, publish project, contact form, both languages, both themes).

---

## 15. Phases and definition of done

- **Phase 0 — Plan (no code):** architecture, schema diagram, route map, component inventory, risks. Wait for my approval.
- **Phase 1 — Foundation:** project setup, design tokens (light/dark), fonts (Latin + Arabic), i18n routing + RTL, theme toggle, logo processing + `<Logo />`, graphic-language components, icon set, motion utilities, header and footer. Deliver a dev-only `/styleguide` page showing tokens, type scale in EN and AR, both themes and all brand components.
- **Phase 2 — Database & auth:** Drizzle schema + migrations, seeds, Better Auth with roles, login / forgot / reset / invite flows, emails, route protection, permission layer + unit tests.
- **Phase 3 — Dashboard:** every section in §8.
- **Phase 4 — Public site:** every page in §4 from the database, the scroll-driven hero (§4A) with all modes and fallbacks, caching + revalidation, contact form, SEO, OG images.
- **Phase 5 — QA & deploy:** Playwright e2e (login, password reset, invite, category CRUD + reorder + visibility, publish project, contact form, language switch, theme switch, hero animation: upload → configure → appears on home, reduced-motion fallback), a manual check of the hero scrub on a real iPhone (Safari) and Android phone (Chrome), Lighthouse, axe accessibility audit, screenshots of every page in EN/AR × light/dark at mobile and desktop for my review, README and deployment guide.

### Definition of done

**Brand consistency checklist**
- [ ] Brand name written RADIX, exactly.
- [ ] Logo placed only from the supplied SVG files; proportions intact; clear space of x; above minimum size for its version; no generated or retyped logo anywhere.
- [ ] Hex values match the palette; text contrast ≥ 4.5:1 in both themes.
- [ ] Manrope and IBM Plex Mono only (+ IBM Plex Sans Arabic for Arabic).
- [ ] One surface line per composition; every graphic element has a role.
- [ ] No invented clients, figures or awards.

**Functional**
- [ ] Every public page works in EN/AR, LTR/RTL, light/dark, from 375 px to 1440 px+.
- [ ] Admins can add, edit, hide, reorder and delete categories and their services, and control exactly what each category page shows.
- [ ] Admins can manage projects / portfolio, team members and bios, page content, settings, media and messages.
- [ ] Multiple admins with roles; invitations work; forgot/reset password works end-to-end by email; super admin can send reset links; the last super admin is protected.
- [ ] Content changes appear on the live site within seconds without a redeploy.
- [ ] The home hero video is visible instantly on load (poster first), scrubs smoothly forward and backward with native scroll on desktop and mobile (including iOS Safari), falls back correctly for reduced motion and slow connections, and every setting in §4A can be changed from the dashboard.
- [ ] A fresh clone deploys cleanly to Vercel by following the README.
