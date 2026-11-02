# RADIX Website — Project Rules for Claude Code

This repo will become the RADIX marketing website + admin dashboard (CMS): bilingual EN/AR (RTL), light/dark, multi-admin, scroll-driven hero video, deployed on Vercel.

## Read first (every new session)
1. `docs/BUILD_SPEC.md` — the full build spec. It is the source of truth for functionality.
2. `docs/brand-guidelines.pdf` — the source of truth for visual decisions.
3. `docs/brand-content.md` — exact brand copy (the PDF text is outlined, so take all copy from here).

## Starting state of the repo
The folder already contains `CLAUDE.md`, `START_HERE.md`, `docs/` and `public/brand/` (logos + icons). When scaffolding Next.js, scaffold into a temporary directory and merge into this one. **Never delete, move or overwrite these existing files.**

## Non-negotiables
- **Logo:** only from `public/brand/hor.svg`, `ver.svg`, `typo.svg`, `icon.svg`. Never redraw, retype, trace or generate it. The only allowed change is swapping fills to `currentColor` (keep the originals). Never mirror it in RTL.
- **Icons:** only from `public/brand/icons/` via an `<Icon name>` component; don't alter geometry.
- **Colours:** exact palette hex only — `#1B1028` `#7854F6` `#C5B8FF` `#F6F3EE` `#292631` `#FFFFFF`. Components use semantic tokens, never raw hex. Text contrast ≥ 4.5:1 in both themes.
- **Fonts:** Manrope + IBM Plex Mono; IBM Plex Sans Arabic for Arabic. Nothing else.
- **Copy:** brand name written RADIX exactly. No invented clients, projects, figures, testimonials, awards or team members.
- **Graphic language:** one surface line per composition; every graphic element has a job; square corners; no gradients, glows or filler shapes.
- **Motion:** native scroll only (no scroll-jacking, no smooth-scroll libraries); respect `prefers-reduced-motion`.
- **Security:** authorization checked server-side in every Server Action and route handler.

## How to work
- Start in plan mode; wait for approval before coding. Then follow the phases in `docs/BUILD_SPEC.md` §15.
- Verify current library APIs in official docs before using them; use latest stable versions; package manager is pnpm.
- End of each phase: typecheck, lint, build, tests, commit, short summary + what the owner must do next.
- Ask before adding paid services or deviating from the stack.

## Communication
- The owner prefers explanations in Arabic (Egyptian dialect is fine). Keep code, comments, commit messages and repo docs in English.
- When you need something from the owner (an account, an env var, a decision), say exactly what and where to get it, step by step.
