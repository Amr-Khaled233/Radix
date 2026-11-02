import StarterKit from "@tiptap/starter-kit";

/**
 * The single Tiptap configuration used by the dashboard editor and the server
 * renderer, so stored JSON always maps to the same allowed markup:
 * H2, H3, paragraphs, bold, italic, lists, links and quotes.
 */
export const richTextExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    underline: false,
    link: {
      openOnClick: false,
      autolink: true,
      protocols: ["http", "https", "mailto", "tel"],
      HTMLAttributes: { rel: "noopener noreferrer" },
    },
  }),
];
