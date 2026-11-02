import type { Locale } from "@/lib/i18n/routing";
import { tRich, type LocalizedRich } from "@/lib/localized";
import { renderRichText } from "@/lib/rich-text/render";
import { cn } from "@/lib/cn";

/** Server-rendered, sanitized rich text (Tiptap JSON → HTML). Renders nothing when empty. */
export function RichText({
  value,
  locale,
  className,
}: {
  value: LocalizedRich | null | undefined;
  locale: Locale;
  className?: string;
}) {
  const html = renderRichText(tRich(value, locale));
  if (!html) return null;
  return (
    <div className={cn("rich-text type-body text-foreground", className)} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
