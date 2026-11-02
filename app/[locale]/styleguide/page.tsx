import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { CoreLines } from "@/components/brand/core-lines";
import { Icon, ICON_NAMES } from "@/components/brand/icon";
import { IndexMarker } from "@/components/brand/index-marker";
import { Logo, LOGO_MIN_WIDTH } from "@/components/brand/logo";
import { Reveal } from "@/components/brand/reveal";
import { Strata, STRATA_GAPS } from "@/components/brand/strata";
import { SurfaceLine } from "@/components/brand/surface-line";
import { brandCopy, seedCategories, seedProcessSteps } from "@/lib/content/brand";
import { cn } from "@/lib/cn";

// Developer reference — not localized and not linked from the site.
export const metadata: Metadata = { title: "Styleguide", robots: { index: false, follow: false } };

const PALETTE = [
  ["Deep Aubergine", "aubergine", "#1B1028"],
  ["Electric Violet", "violet", "#7854F6"],
  ["Soft Lavender", "lavender", "#C5B8FF"],
  ["Warm Ivory", "ivory", "#F6F3EE"],
  ["Graphite", "graphite", "#292631"],
  ["White", "white", "#FFFFFF"],
] as const;

const TOKENS = [
  "background",
  "surface",
  "foreground",
  "muted",
  "label",
  "line",
  "line-strong",
  "accent",
  "on-accent",
  "focus",
  "inverse",
  "on-inverse",
] as const;

const TYPE_STYLES = [
  ["type-display", "Display", "96 / 96 · 500 · −3.5%"],
  ["type-h1", "H1", "64 / 68 · 500 · −3%"],
  ["type-h2", "H2", "44 / 50 · 500 · −2%"],
  ["type-h3", "H3", "28 / 36 · 600 · −1%"],
  ["type-h4", "H4", "20 / 28 · 600 · 0"],
  ["type-body-lg", "Body large", "20 / 32 · 400"],
  ["type-body", "Body", "17 / 28 · 400"],
  ["type-button", "Button", "15 / 20 · 600 · +1%"],
  ["type-label", "Label", "Mono 12 / 16 · 500 · +12% caps"],
  ["type-data", "Data", "Mono 14 / 20 · 400 · tabular"],
] as const;

const SAMPLES = {
  en: {
    "type-display": "Takes Root.",
    "type-h1": "Build from the Core",
    "type-h2": "Connected disciplines",
    "type-h3": "Workflow automation",
    "type-h4": "Discovery and strategy",
    "type-body-lg": "We design and build websites that are clear to use and built to evolve.",
    "type-body": "We design and build websites that are clear to use and built to evolve.",
    "type-button": "Start a conversation",
    "type-label": "02 — Digital",
    "type-data": "1,248 · 12.4% · 09:30",
  },
  ar: {
    "type-display": "يتجذّر النمو.",
    "type-h1": "نبني من الجوهر",
    "type-h2": "تخصصات مترابطة",
    "type-h3": "أتمتة سير العمل",
    "type-h4": "الاكتشاف والاستراتيجية",
    "type-body-lg": "نصمّم مواقع واضحة في استخدامها ومبنية لتتطوّر، ونعمل مع RADIX على كل التفاصيل.",
    "type-body": "نصمّم مواقع واضحة في استخدامها ومبنية لتتطوّر. للتواصل: hello@example.com",
    "type-button": "ابدأ محادثة",
    "type-label": "02 — الرقمي",
    "type-data": "1,248 · 12.4% · 09:30",
  },
} as const;

/** Approved logo/background pairs from the guidelines. Palette vars are allowed here only. */
const LOGO_PAIRS: { name: string; bg: string; fg: string; note?: string }[] = [
  { name: "Ivory on Aubergine", bg: "aubergine", fg: "ivory" },
  { name: "Aubergine on White", bg: "white", fg: "aubergine" },
  { name: "Aubergine on Ivory", bg: "ivory", fg: "aubergine" },
  { name: "White on Electric Violet", bg: "violet", fg: "white" },
  { name: "Aubergine on Soft Lavender", bg: "lavender", fg: "aubergine" },
  { name: "Ivory on Graphite", bg: "graphite", fg: "ivory" },
  { name: "Violet on Aubergine", bg: "aubergine", fg: "violet", note: "Large sizes only" },
];

const palette = (name: string) => `var(--palette-${name})`;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="border-line border-t py-fib-55">
      <h2 className="type-label text-label mb-fib-34">{title}</h2>
      {children}
    </section>
  );
}

function TokenPanel({ scope, title }: { scope: "scope-light" | "scope-dark"; title: string }) {
  return (
    <div className={cn(scope, "border-line border p-fib-21")}>
      <p className="type-label text-label mb-fib-21">{title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TOKENS.map((token) => (
          <div key={token} className="flex items-center gap-3">
            <span className="border-line size-8 shrink-0 border" style={{ background: `var(--${token})` }} />
            <span className="type-data text-foreground">--{token}</span>
          </div>
        ))}
      </div>
      <div className="bg-surface mt-fib-21 p-fib-21">
        <p className="type-h4 text-foreground">Surface card</p>
        <p className="type-body text-muted">Muted text on surface.</p>
        <p className="type-label text-label mt-2">Label on surface</p>
      </div>
      <div className="mt-fib-21 flex flex-wrap gap-3">
        <button type="button" className="type-button bg-accent text-on-accent min-h-12 px-6">
          Primary action
        </button>
        <button type="button" className="type-button border-line-strong text-foreground min-h-12 border px-6">
          Secondary
        </button>
      </div>
    </div>
  );
}

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_STYLEGUIDE !== "true") notFound();

  return (
    <div lang="en" dir="ltr" className="container-site py-fib-55">
      <p className="type-label text-label">Developer reference</p>
      <h1 className="type-h1 text-foreground mt-fib-13 mb-fib-55">Styleguide</h1>

      <Section id="palette" title="01 — Palette (exact hex only)">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {PALETTE.map(([name, key, hex]) => (
            <div key={key} className="border-line border">
              <div className="h-28" style={{ background: palette(key) }} />
              <div className="p-3">
                <p className="type-button text-foreground">{name}</p>
                <p className="type-data text-muted">{hex}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tokens" title="02 — Semantic tokens · light and dark">
        <div className="grid gap-fib-21 lg:grid-cols-2">
          <TokenPanel scope="scope-light" title="Light" />
          <TokenPanel scope="scope-dark" title="Dark" />
        </div>
      </Section>

      <Section id="type" title="03 — Type scale · English and Arabic">
        <div className="space-y-fib-34">
          {TYPE_STYLES.map(([cls, name, spec]) => (
            <div key={cls} className="border-line grid gap-fib-13 border-b pb-fib-21 lg:grid-cols-12">
              <div className="lg:col-span-2">
                <p className="type-label text-label">{name}</p>
                <p className="type-data text-muted mt-1">{spec}</p>
              </div>
              <p lang="en" dir="ltr" className={cn(cls, "text-foreground lg:col-span-5")}>
                {SAMPLES.en[cls]}
              </p>
              <p lang="ar" dir="rtl" className={cn(cls, "text-foreground lg:col-span-5")}>
                {SAMPLES.ar[cls]}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="logo" title="04 — Logo · versions, clear space, approved pairs">
        <div className="text-foreground grid gap-fib-21 md:grid-cols-4">
          {(["horizontal", "vertical", "wordmark", "icon"] as const).map((variant) => (
            <div key={variant} className="border-line flex flex-col justify-between border p-fib-21">
              <div className="flex min-h-56 items-center justify-center">
                <div className="outline-line outline outline-dashed">
                  <Logo variant={variant} height={{ horizontal: 74, vertical: 172, wordmark: 25, icon: 48 }[variant]} />
                </div>
              </div>
              <p className="type-label text-label mt-fib-13">
                {variant} · min {LOGO_MIN_WIDTH[variant]} px
              </p>
            </div>
          ))}
        </div>
        <p className="type-body text-muted mt-fib-13">Dashed outline = clear space x built into the component.</p>

        <div className="mt-fib-34 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOGO_PAIRS.map((pair) => (
            <div
              key={pair.name}
              className="flex min-h-44 flex-col justify-between p-fib-21"
              style={{ background: palette(pair.bg), color: palette(pair.fg) } as CSSProperties}
            >
              <Logo variant="horizontal" height={74} clearSpace={false} />
              <p className="type-label">
                {pair.name}
                {pair.note ? ` — ${pair.note}` : ""}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="icons" title="05 — Icons (24 px grid, 1.5 px stroke, square caps, mitre joins)">
        <div className="text-foreground grid grid-cols-3 gap-px sm:grid-cols-6 lg:grid-cols-8">
          {ICON_NAMES.map((name) => (
            <div key={name} className="bg-surface flex flex-col items-center gap-3 p-fib-21">
              <Icon name={name} size={32} />
              <span className="type-data text-muted">{name}</span>
            </div>
          ))}
        </div>
        <p className="type-body text-muted mt-fib-13">
          Arrows mirror in RTL; all other icons keep their orientation. Switch to /ar/styleguide to check.
        </p>
      </Section>

      <Section id="graphic-language" title="06 — Graphic language">
        <div className="space-y-fib-89">
          <div>
            <p className="type-h4 text-foreground mb-fib-21">A · Surface line + B · Strata</p>
            <p className="type-body text-muted mb-fib-21">Strata gaps: {STRATA_GAPS.join(" · ")} px</p>
            <SurfaceLine label="Surface" />
            <Strata />
          </div>

          <Reveal>
            <p className="type-h4 text-foreground mb-fib-21">C · Core lines + D · Index markers (structural reveal)</p>
            <h3 className="type-h2 text-foreground reveal-rise pb-fib-21">{brandCopy.tagline.en}</h3>
            <SurfaceLine />
            <CoreLines
              nodes={seedProcessSteps.map((step, i) => ({
                depth: [34, 55, 89, 55][i],
                content: (
                  <>
                    <IndexMarker n={i + 1} label={step.en} />
                    <p className="type-h3 text-foreground mt-2">{step.en}</p>
                  </>
                ),
              }))}
            />
          </Reveal>

          <div>
            <p className="type-h4 text-foreground mb-fib-21">Index markers</p>
            <div className="flex flex-wrap items-end gap-fib-34">
              {seedCategories.map((category, i) => (
                <IndexMarker key={category.slug} n={i + 1} label={category.name.en} />
              ))}
              <IndexMarker n={2} size="large" />
            </div>
          </div>

          <div className="scope-inverse p-fib-34">
            <p className="type-label text-label">Inverse section</p>
            <p className="type-h2 mt-fib-13">{brandCopy.statement.en}</p>
            <p className="type-body text-muted mt-fib-13">
              Inverse sections keep the brand&apos;s dark/light rhythm in both themes.
            </p>
          </div>
        </div>
      </Section>

      <Section id="motion" title="07 — Motion">
        <p className="type-data text-muted">
          Easing cubic-bezier(.2, 0, 0, 1) · 160 ms UI · 240 ms hover · 480 ms reveal · reduced motion: no movement
        </p>
      </Section>
    </div>
  );
}
