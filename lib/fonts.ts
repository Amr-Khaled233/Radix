import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";

// Single place for brand fonts. To change the Arabic face, swap the import
// below and keep the `--font-plex-arabic` variable name (used in globals.css).
// The stacks in globals.css name the families directly ("Manrope", "IBM Plex Mono").

/** Variable font: one file covers every weight used (300–700). */
export const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

/**
 * Arabic glyphs only (unicode-range), so English pages never download it.
 * Not preloaded: on Arabic pages it loads with the CSS instead of competing
 * with it for bandwidth.
 */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-plex-arabic",
});

export const fontVariables = `${manrope.variable} ${plexMono.variable} ${plexArabic.variable}`;
