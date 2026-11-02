import { Body, Container, Head, Html, Img, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/routing";

// Email clients need inline values; these mirror the brand palette exactly.
export const EMAIL_COLORS = {
  aubergine: "#1B1028",
  violet: "#7854F6",
  ivory: "#F6F3EE",
  white: "#FFFFFF",
  muted: "#5B5263", // Aubergine 72% on Ivory (same mix as --muted)
} as const;

export const emailFont = (locale: Locale) =>
  locale === "ar"
    ? '"IBM Plex Sans Arabic", Tahoma, Arial, sans-serif'
    : 'Manrope, "Helvetica Neue", Arial, sans-serif';

type EmailLayoutProps = {
  locale: Locale;
  preview: string;
  footer: string;
  siteUrl: string;
  children: ReactNode;
};

export function EmailLayout({ locale, preview, footer, siteUrl, children }: EmailLayoutProps) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{ backgroundColor: EMAIL_COLORS.ivory, margin: 0, padding: "34px 0", fontFamily: emailFont(locale) }}
      >
        <Container style={{ maxWidth: 560, backgroundColor: EMAIL_COLORS.white, direction: dir }}>
          <Section style={{ backgroundColor: EMAIL_COLORS.aubergine, padding: "21px 34px" }}>
            <Img
              src={`${siteUrl}/icons/icon-192.png`}
              width="48"
              height="48"
              alt="RADIX"
              style={{ display: "block" }}
            />
          </Section>
          <Section style={{ height: 2, backgroundColor: EMAIL_COLORS.aubergine }} />
          <Section style={{ padding: "34px", textAlign: locale === "ar" ? "right" : "left" }}>{children}</Section>
          <Section style={{ borderTop: `1px solid ${EMAIL_COLORS.ivory}`, padding: "21px 34px" }}>
            <Text style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: EMAIL_COLORS.muted }}>{footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
