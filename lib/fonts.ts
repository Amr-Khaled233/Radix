import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";

// Single place for brand fonts. To change the Arabic face, swap the import
// below and keep the `--font-plex-arabic` variable name (used in globals.css).

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-manrope",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-arabic",
});

export const fontVariables = `${manrope.variable} ${plexMono.variable} ${plexArabic.variable}`;
