# RADIX — Implementation Plan (Phase 0)

Status: **awaiting owner approval**. Companion to `docs/BUILD_SPEC.md` (functionality) and `docs/brand-guidelines.pdf` (visuals). Brand copy comes from `docs/brand-content.md`.

---

## 1. Findings from reading the guidelines (all 45 pages)

Points where the PDF, the spec and the repo differ, and what this plan does:

| # | Topic | Finding | Resolution |
|---|---|---|---|
| F1 | Icon set | Spec §2.6 says "recreate" the icons. `CLAUDE.md` says use only `public/brand/icons/` (24 SVGs extracted from the PDF). The PDF Iconography page shows 4 pillar icons + 20 utility icons: `core-lines, connector, arrow-right, arrow-up-right, filter, chart, mail, calendar, sliders, search, menu, close, check, plus, home, folder, bell, user, link, pin`. Spec lists `layers`, which is **not** in the PDF; the PDF has `pin` and `core-lines`, which the spec doesn't list. | Use the supplied 24 files as-is (PDF wins on visuals). Generate typed React components from them by script; no geometry changes. No `layers` icon. |
| F2 | Small violet labels | The PDF mockups set small mono labels (e.g. `BRAND ESSENCE`, `PURPOSE`) in Violet on Ivory (4.3:1) and on Aubergine (3.8:1). Both fail AA for small text. | Follow spec §2.2: small labels use `--label` (Aubergine 70% in light, Lavender in dark). Violet stays for large index numbers (≥ 24 px), buttons, core lines and nodes. |
| F3 | Header nav | Website Direction mockup: `About · Services · Brand · Digital · Intelligence · Growth · [Start a conversation]`. Spec adds Work and Team. | `About · Services · [visible nav categories if ≤ 4] · Work · Team · [CTA]`. Team is hidden when the section is off or empty. Collapses to the mobile menu below ~1180 px. |
| F4 | Rendered colours | The PDF renders Violet/Lavender slightly muted (colour-profile effect). | Use the printed hex values only. |
| F5 | Clear space | PDF: x = x-height of the "r" in the wordmark ≈ 31% of lockup height; icon alone 25% of width. Matches spec. | `<Logo>` applies clear-space padding by default (opt-out prop for tight dev previews only). |
| F6 | Logo SVGs | Each logo SVG wraps all paths in one `<g fill="#1B1028">`. | Script writes `currentColor` copies to `public/brand/current/` and React components; originals untouched. |
| F7 | Website direction | "Eight pages, desktop and mobile, 1440 px max width, fluid margins, sticky header." Mobile header: icon + square menu button. | Matches the route map below. |

## 2. Architecture

```
Browser ──► Vercel (Next.js 16, App Router)
              ├─ proxy.ts           locale negotiation for public routes, session-cookie presence check for /admin (UX only)
              ├─ app/[locale]/(site) public pages: Server Components, cached with tags
              ├─ app/admin           dashboard: Server Components + Server Actions, every action calls can()
              ├─ app/api/auth/[...all]  Better Auth handler
              ├─ app/api/upload      Vercel Blob client-upload token route (signed-in admins, type/size limits)
              ├─ app/api/contact     contact form (honeypot + DB rate limit) — or a Server Action
              └─ app/api/draft       enable/disable draft mode for previews
            ──► Neon Postgres (Drizzle, pooled URL at runtime, unpooled for migrations)
            ──► Vercel Blob (images, hero videos, frame sequences)
            ──► Resend (auth + notification emails, React Email EN/AR)
```

Key decisions:

- **Caching:** public data access goes through `lib/db/queries/*` functions tagged per entity (`categories`, `category:{slug}`, `projects`, `project:{slug}`, `team`, `settings:{key}`, `hero`). Server Actions revalidate the matching tags, so both locales update together. Which Next 16 caching API to use (Cache Components / `"use cache"` + `cacheTag`, and the current `revalidateTag` / `updateTag` signatures) gets checked against the docs at the start of Phase 1.
- **Dashboard i18n:** `/admin` is not locale-prefixed. next-intl runs without i18n routing there: the locale comes from `user.preferred_locale` (cookie `ADMIN_LOCALE` before login). `<html dir>` is set from it.
- **Authorization:** `lib/auth/permissions.ts` holds one map `can(user, action, resource)`. Every Server Action starts with `requireAdmin()` + `can()`. `proxy.ts` only redirects unauthenticated visitors for UX and is never the security boundary.
- **Better Auth admin-plugin endpoints** (`/api/auth/admin/*`) are restricted with its access-control config (only `super_admin` manages users). `hooks.before` blocks self-demotion/deactivation/deletion and any change to the last `super_admin`. Dashboard UI calls our own Server Actions, which wrap these.
- **Rate limiting:** Better Auth rate limit with `storage: "database"` (in-memory doesn't survive serverless). The contact form uses a small `rate_limits` table keyed by hashed IP. No Redis/Upstash, so no extra service.
- **Rich text:** Tiptap JSON stored in `jsonb`. Rendered server-side with `@tiptap/html` + `sanitize-html` allowlist (h2, h3, p, strong, em, ul, ol, li, a[href], blockquote).

## 3. Database schema (Drizzle)

`L` = localized jsonb `{ en: string; ar: string }`. `LR` = localized rich `{ en: TiptapJSON|null; ar: TiptapJSON|null }`.
Content tables carry `id (uuid)`, `created_at`, `updated_at`, `created_by`, `updated_by`, and `ar_needs_review boolean` (drives the "Needs review" badge; seeded Arabic = true, cleared when an editor saves the AR tab and ticks "Reviewed").

```
user ─────────────┐ (Better Auth) + role(super_admin|admin|editor), banned, ban_reason,
session, account, │  preferred_locale, preferred_theme, image, last_login_at
verification      │
rate_limit        │ (Better Auth DB rate-limit storage)
                  │
categories ───────┼─< services
  slug U, name L, tagline L, description LR, icon_key enum, sort_order, is_visible,
  show_in_nav, show_on_home, seo_title L, seo_description L, og_image_id → media
                  │
projects ─────────┼─< project_categories (project_id, category_id, is_featured_in_category, sort_order)  >── categories
  slug U, title L, client_name L, summary L, body LR, cover_image_id → media, year,
  external_url, status(draft|published|archived), is_featured, sort_order, published_at,
  seo_title L, seo_description L, og_image_id
                  ├─< project_services (project_id, service_id)                      >── services
                  ├─< project_media    (project_id, media_id, caption L, sort_order) >── media
                  ├─< project_results  (project_id, value, label L, sort_order)
                  └─< project_team     (project_id, team_member_id, role L)          >── team_members
team_members ─────┴─< team_member_categories (team_member_id, category_id)
  slug U, name L, role L, short_bio L, bio LR, photo_id → media, email, show_email,
  links jsonb[{type,url}], sort_order, is_visible, show_on_home
media           kind(image|video), url, pathname, content_type, size, width, height,
                duration, alt L (required for images), uploaded_by
frame_sequences source_media_id → media, variant(desktop|mobile), base_path, frame_count,
                fps, width, height, format
settings        key PK (general|seo|home|about|process|legal|contact|locale|hero|footer), value jsonb
                — each key validated by its own zod schema in lib/settings/schemas.ts
contact_submissions name, email, company, phone, message, category_ids uuid[], locale,
                status(new|read|archived), ip_hash, user_agent, created_at
rate_limits     key (hashed ip + bucket), count, window_start   (contact form)
audit_log       actor_id, action, entity_type, entity_id, summary jsonb, created_at
admin_invites   user_id, token_hash, expires_at (48 h), used_at   (see Risk R4)
```

Indexes: unique `slug` on categories/projects/team; `status`, `sort_order`, all FKs; `contact_submissions(status, created_at)`; `audit_log(created_at)`.
Deletes: category delete with linked projects → confirmation; join rows cascade, projects keep their other categories. Projects archive by default; hard delete only for `super_admin`/`admin` from the archive view. Media delete blocked while referenced (usage computed by query across FK columns + settings `hero`).

`hero` settings value (zod): `{ enabled, mode: scrub|frames|loop|static, assets: { desktopMp4, desktopWebm?, mobileMp4?, posterDesktop, posterMobile, arVideo? } (media ids), frames: { desktop?, mobile? } (frame_sequence ids), scrollLength: { desktop, mobile }, trim: { start, end }, introAutoplayTo: number|null, smoothing, fit: cover|contain, focal: { desktop: {x,y}, mobile: {x,y} }, overlayOpacity, beats: [{ id, text L, style, position: {inline, block}, from, to, visible }], toggles: { scrollHint, skipLink, exitSurfaceLine }, allowLoopOnSaveData }` + `previous` (last published copy for one-click revert).

## 4. Route map

**Public (`/[locale]`, locales `en | ar`)**

| Route | Data | Notes |
|---|---|---|
| `/` | settings.home, hero, categories(show_on_home), featured projects, process, team(show_on_home) | sections ordered/toggled from settings |
| `/about` | settings.about, team preview | |
| `/services` | visible categories + services | |
| `/services/[slug]` | category, visible services, assigned published projects | `generateStaticParams` |
| `/work` `?category=` | published projects | filter is a link list (no client JS needed) |
| `/work/[slug]` | project + media, results, credits, next project | draft mode shows drafts |
| `/team`, `/team/[slug]` | visible members | 404 when section off |
| `/contact` | settings.general, visible categories | form via Server Action |
| `/privacy` | settings.legal | |
| `not-found`, `error` | | `ver.svg`, localized |
| `/sitemap.xml`, `/robots.txt`, `opengraph-image` per route | | |
| `/styleguide` | | dev-only (404 in production) |

**Dashboard (`/admin`, noindex)**
`/admin/login`, `/admin/forgot-password`, `/admin/reset-password`, `/admin/accept-invite` · `/admin` (overview) · `/admin/categories`, `/admin/categories/[id]` (incl. services + project assignment) · `/admin/projects`, `/new`, `/[id]` · `/admin/team`, `/[id]` · `/admin/pages/home`, `/admin/pages/home/hero`, `/admin/pages/about`, `/admin/pages/process`, `/admin/pages/privacy`, `/admin/pages/footer` · `/admin/messages`, `/[id]` · `/admin/media` · `/admin/admins` · `/admin/settings` · `/admin/profile` · `/admin/audit-log`.

**API:** `/api/auth/[...all]`, `/api/upload`, `/api/draft`, `/api/messages/export` (CSV).

## 5. Component inventory

- `components/brand/` — `Logo` (variant, auto-switch below min size, clear space, never mirrored), `SurfaceLine` (draw-in, direction follows `dir`), `Strata` (Fibonacci gaps), `CoreLines` (nodes at staggered depths, inline-start anchored), `IndexMarker`, `Icon` (+ generated icon components, `mirrorInRtl` only for arrows), `Reveal` (IntersectionObserver + CSS, reduced-motion aware), `Bdi` helper.
- `components/site/` — `Header`, `MobileMenu`, `Footer`, `LocaleSwitcher`, `ThemeToggle`, `SkipLink`, `Hero` (static), `HeroScroll` (client: scrub / frames / loop + fallbacks), `HeroBeats`, `PillarsSection`, `PositioningSection`, `FeaturedWork`, `ProcessSection`, `TeamPreview`, `ClosingCta`, `ProjectCard`, `TeamCard`, `CategoryFilter`, `RichText`, `ContactForm`, `EmptyState`, `Breadcrumbs`, `JsonLd`.
- `components/admin/` — `AdminShell` (sidebar, top bar with theme + language), `DataTable` (TanStack), `SortableList` (dnd-kit), `LocaleTabs` + `CompletenessBadge`, `LocalizedInput/Textarea`, `RichTextEditor` (Tiptap, RTL per tab), `MediaPicker`, `Uploader` (Blob client multipart + imagery guidance), `IconPicker`, `ImageCropper` (square team photos), `ConfirmDialog`, `UnsavedChangesGuard`, `StatusBadge`, `HeroEditor` (preview stage, timeline with thumbnails, focal-point picker, contrast meter, beat list, frame-sequence generator worker), shadcn/ui primitives re-themed (radius 0, 2 px inputs).
- `emails/` — `Layout`, `InviteEmail`, `ResetPasswordEmail`, `ContactNotificationEmail` (EN/AR, RTL, plain-text).
- `lib/` — `db/` (schema, client, queries, `localized()`, `t()`), `auth/` (config, client, `permissions.ts`, `session.ts`), `i18n/`, `settings/` (zod schemas + getters), `hero/` (progress→time mapping, frame loader order; pure + unit-tested), `contrast.ts` (token-pair checker used by tests and the hero overlay meter), `audit.ts`, `revalidate.ts`.

## 6. Phases (per spec §15, with the concrete steps)

**Phase 1 — Foundation**
Install pnpm, `git init`; scaffold Next.js 16 in a temp dir and merge (existing files untouched); Tailwind v4 tokens (light/dark, semantic only); fonts (Manrope, IBM Plex Mono, IBM Plex Sans Arabic) via `next/font`; next-intl routing + `proxy.ts`; `next-themes` (no flash); logo script → `currentColor` assets + `<Logo>`; icon generation script → `<Icon>`; brand components + motion utilities; header, mobile menu, footer (static placeholders until Phase 4 data); favicon/manifest/apple-touch from `icon.svg` (Ivory on Aubergine); `/styleguide`; automated contrast test over every token pair; ESLint, Prettier, Vitest set-up.
*Owner check:* `pnpm dev` → `/en/styleguide` and `/ar/styleguide`, both themes.

**Phase 2 — Database & auth**
Drizzle schema + migrations; seeds (`db:seed` brand content with AR flagged, `db:seed:admin`, dev-only `db:seed:demo`); Better Auth (email/password, admin plugin, custom roles, DB rate limit, sessions 7 d sliding); login / forgot / reset / invite / accept-invite; Resend + React Email (console fallback in dev); `can()` + safeguards + unit tests; audit-log helper.
*Owner action:* create the Vercel project, add Neon + Blob from Storage, run `vercel env pull .env.local`; Resend account (optional until deploy).

**Phase 3 — Dashboard**
All 11 sections of spec §8, incl. hero editor with live preview and in-browser frame-sequence generation; media library with usage tracking; CSV export; revalidation on every save; draft-mode preview.

**Phase 4 — Public site**
Every page from the DB; `HeroScroll` with all four modes and fallbacks; caching + tags; contact form (Server Action, honeypot, rate limit, email); metadata, hreflang, sitemap, robots, JSON-LD, OG images (`next/og`, Manrope / Plex Sans Arabic, logo from SVG); security headers + CSP.

**Phase 5 — QA & deploy**
Playwright e2e (list in spec §15), axe audit, Lighthouse, screenshot matrix (pages × EN/AR × light/dark × 375/1440), README with Vercel guide + encode commands; owner tests hero on a real iPhone and Android phone.

Each phase ends with typecheck, lint, build, tests and a commit.

## 7. Risks and mitigations

| # | Risk | Mitigation |
|---|---|---|
| R1 | **iOS Safari video scrubbing** is unreliable (seeking `currentTime` stutters, autoplay rules). | Default to Frame-sequence mode on iOS when a sequence exists; `-g 1` encode guidance; poster always stays as fallback. Real-device test in Phase 5. |
| R2 | **Frame-sequence generation in the browser** is memory- and time-heavy (e.g. 10 s × 24 fps = 240 WebP files), and `requestVideoFrameCallback` / WebP export differ by browser. | Run in a Web Worker with `OffscreenCanvas` where supported; seek-and-capture fallback; upload in parallel batches with retry; progress bar; recommend Chrome/Edge in the help panel. |
| R3 | **Hero vs Lighthouse ≥ 95 (mobile).** | Poster is the LCP `<Image priority>`; video/frames load after `load` + idle; hero client JS kept small and lazy; Save-Data / 2g/3g → static. |
| R4 | **48 h invite tokens vs 1 h reset tokens.** Better Auth has one global reset-token lifetime. | Own `admin_invites` table (hashed token, 48 h). Accepting an invite sets the password through Better Auth's server API / internal adapter, which gets checked against the docs in Phase 2. Reset keeps the 1 h default. |
| R5 | **Custom roles in the Better Auth admin plugin** (the default is `admin` / `user`). | `createAccessControl` with `super_admin`, `admin`, `editor`; our own `can()` remains the single source for app permissions. |
| R6 | **Next.js 16 caching API changes** (Cache Components, `revalidateTag` signature, `updateTag`). | Verify in the docs before Phase 1; isolate in `lib/revalidate.ts`. |
| R7 | **Arabic typography** in mixed text (RADIX, emails, numbers). | `<bdi>` helper; `html[lang=ar]` overrides; styleguide shows mixed samples; Arabic copy is a draft flagged "Needs review". |
| R8 | **Large uploads** (videos up to 200 MB). | Blob client multipart uploads straight from the browser; token route validates role, type, size. |
| R9 | **Costs / plan.** Vercel Hobby is non-commercial; a company site needs **Pro**. Blob storage/egress and Neon have usage-based tiers; Resend free tier covers 3,000 emails/month. | Owner decision before launch (not needed to start). |
| R10 | Local environment: `pnpm` not installed; folder isn't a git repo yet. | Phase 1 installs pnpm (corepack/npm) and runs `git init`. |

## 8. Decisions needed from the owner

1. Approve the plan (or request changes).
2. Header nav per F3 OK?
3. Default site language: English (current default) or Arabic?
4. Arabic font: IBM Plex Sans Arabic (recommended) or another?
5. Two-factor auth: leave for after launch (spec says optional, phase 2)?
