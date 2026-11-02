import { Button, Heading, Link, Text } from "@react-email/components";
import type { Locale } from "@/lib/i18n/routing";
import { EMAIL_COLORS, EmailLayout } from "./layout";

export type ActionEmailProps = {
  locale: Locale;
  siteUrl: string;
  preview: string;
  heading: string;
  body: string;
  cta: string;
  url: string;
  linkFallback: string;
  ignore: string;
  footer: string;
};

/** One call-to-action email (invite, password reset). Copy arrives already translated. */
export function ActionEmail(props: ActionEmailProps) {
  const { locale, siteUrl, preview, heading, body, cta, url, linkFallback, ignore, footer } = props;
  return (
    <EmailLayout locale={locale} preview={preview} footer={footer} siteUrl={siteUrl}>
      <Heading
        as="h1"
        style={{ margin: "0 0 21px", fontSize: 28, lineHeight: "36px", fontWeight: 600, color: EMAIL_COLORS.aubergine }}
      >
        {heading}
      </Heading>
      <Text style={{ margin: "0 0 34px", fontSize: 16, lineHeight: "26px", color: EMAIL_COLORS.aubergine }}>
        {body}
      </Text>
      <Button
        href={url}
        style={{
          backgroundColor: EMAIL_COLORS.violet,
          color: EMAIL_COLORS.white,
          fontSize: 15,
          fontWeight: 600,
          lineHeight: "20px",
          padding: "14px 24px",
          borderRadius: 0,
          textDecoration: "none",
        }}
      >
        {cta}
      </Button>
      <Text style={{ margin: "34px 0 8px", fontSize: 13, lineHeight: "20px", color: EMAIL_COLORS.muted }}>
        {linkFallback}
      </Text>
      <Link
        href={url}
        style={{ fontSize: 13, lineHeight: "20px", color: EMAIL_COLORS.aubergine, wordBreak: "break-all" }}
      >
        <span dir="ltr">{url}</span>
      </Link>
      <Text style={{ margin: "21px 0 0", fontSize: 13, lineHeight: "20px", color: EMAIL_COLORS.muted }}>{ignore}</Text>
    </EmailLayout>
  );
}
