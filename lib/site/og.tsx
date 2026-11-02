import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { logoArtwork } from "@/components/brand/generated/logos";
import type { Locale } from "@/lib/i18n/routing";

export const OG_SIZE = { width: 1200, height: 630 };

const AUBERGINE = "#1B1028";
const IVORY = "#F6F3EE";
const LAVENDER = "#C5B8FF";

/** Font files for OG cards, cached (file reads are I/O, which Cache Components requires to be cached). */
async function fonts() {
  "use cache";
  cacheLife("max");
  return Promise.all(
    [
      ["Manrope", "Manrope-Medium.woff", 500],
      ["IBM Plex Mono", "IBMPlexMono-Medium.woff", 500],
      ["IBM Plex Sans Arabic", "IBMPlexSansArabic-Medium.woff", 500],
      ["IBM Plex Sans Arabic", "IBMPlexSansArabic-SemiBold.woff", 600],
    ].map(async ([name, file, weight]) => {
      const buffer = await readFile(join(process.cwd(), "assets/fonts", file as string));
      return {
        name: name as string,
        data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
        weight: weight as 500 | 600,
        style: "normal" as const,
      };
    }),
  );
}

/** The vertical lockup from the supplied artwork (paths copied as-is, single Ivory fill). */
function VerticalLogo({ height }: { height: number }) {
  const art = logoArtwork.vertical;
  const [, , w, h] = art.viewBox.split(" ").map(Number);
  const paths = [...art.paths.matchAll(/d="([^"]+)"/g)].map((m) => m[1]);
  return (
    <svg width={(w / h) * height} height={height} viewBox={art.viewBox} fill={IVORY}>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/** Brand OG card: Aubergine ground, Ivory text, surface line + strata, vertical lockup. */
export async function renderOg({ locale, label, title }: { locale: Locale; label: string; title: string }) {
  const rtl = locale === "ar";
  const sans = rtl ? "IBM Plex Sans Arabic" : "Manrope";
  const size = title.length > 60 ? 54 : title.length > 32 ? 66 : 80;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: AUBERGINE,
        color: IVORY,
        fontFamily: sans,
        padding: "64px 72px 0",
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexDirection: rtl ? "row-reverse" : "row",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 820,
            alignItems: rtl ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              fontFamily: rtl ? sans : "IBM Plex Mono",
              fontSize: 22,
              letterSpacing: rtl ? 0 : "0.12em",
              textTransform: rtl ? "none" : "uppercase",
              color: LAVENDER,
            }}
          >
            {label}
          </div>
          {rtl ? (
            // Satori has no bidi reordering: lay Arabic words out right-to-left ourselves (each word keeps its shaping).
            <div
              style={{
                marginTop: 28,
                display: "flex",
                flexDirection: "row-reverse",
                flexWrap: "wrap",
                columnGap: size * 0.08,
                fontSize: size,
                lineHeight: 1.3,
                fontWeight: 500,
              }}
            >
              {title.split(/\s+/).map((word, i) => (
                <span key={i}>{word}</span>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 28, fontSize: size, lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 500 }}>
              {title}
            </div>
          )}
        </div>
        <VerticalLogo height={170} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginLeft: -72, marginRight: -72 }}>
        <div style={{ height: 2, background: IVORY }} />
        {[8, 13, 21, 34].map((gap) => (
          <div key={gap} style={{ height: 1, marginTop: gap - 1, background: "rgba(246,243,238,0.14)" }} />
        ))}
        <div style={{ height: 24 }} />
      </div>
    </div>,
    { ...OG_SIZE, fonts: await fonts() },
  );
}
