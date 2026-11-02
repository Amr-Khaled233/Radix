import "server-only";
import { generateHTML } from "@tiptap/html/server";
import sanitizeHtml from "sanitize-html";
import type { RichDoc } from "@/lib/db/localized";
import { richTextExtensions } from "./extensions";

const ALLOWED: sanitizeHtml.IOptions = {
  allowedTags: ["h2", "h3", "p", "strong", "em", "ul", "ol", "li", "a", "blockquote", "br"],
  allowedAttributes: { a: ["href", "rel", "target"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        href: attribs.href ?? "#",
        rel: "noopener noreferrer",
        ...(attribs.href?.startsWith("http") ? { target: "_blank" } : {}),
      },
    }),
  },
};

/** Tiptap JSON → sanitized HTML (server only). Returns "" for empty documents. */
export function renderRichText(doc: RichDoc | null | undefined): string {
  if (!doc?.content?.length) return "";
  try {
    return sanitizeHtml(generateHTML(doc as Parameters<typeof generateHTML>[0], richTextExtensions), ALLOWED);
  } catch {
    return "";
  }
}
