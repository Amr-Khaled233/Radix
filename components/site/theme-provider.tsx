"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/** Light or dark, chosen by the visitor (never follows the OS). First visit: dark. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={["light", "dark"]}
      defaultTheme="dark"
      enableSystem={false}
      enableColorScheme
      disableTransitionOnChange
      // A new key starts every visitor on dark again (choices saved under the earlier keys don't carry over).
      storageKey="radix-theme-v2"
    >
      {children}
    </NextThemesProvider>
  );
}
