"use client";

import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import type { RichDoc } from "@/lib/localized";
import { richTextExtensions } from "@/lib/rich-text/extensions";
import { cn } from "@/lib/cn";
import { uiIcon } from "./ui-icon";

type RichTextEditorProps = {
  label: string;
  value: RichDoc | null;
  onChange: (value: RichDoc | null) => void;
  locale: "en" | "ar";
  hint?: string;
};

/** Tiptap editor storing JSON; RTL in the Arabic tab. Toolbar: H2, H3, bold, italic, lists, link, quote. */
export function RichTextEditor({ label, value, onChange, locale, hint }: RichTextEditorProps) {
  const labelId = useId();
  const editor = useEditor({
    extensions: richTextExtensions,
    content: (value as JSONContent | null) ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        dir: locale === "ar" ? "rtl" : "ltr",
        lang: locale,
        "aria-labelledby": labelId,
        "aria-multiline": "true",
        role: "textbox",
        class: "rich-text min-h-48 px-4 py-3 outline-none",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? null : (e.getJSON() as RichDoc)),
  });

  return (
    <div className="space-y-1.5">
      <p id={labelId} className="text-foreground text-sm font-semibold">
        {label}
      </p>
      <div className="bg-background border-line-strong rounded-input focus-within:outline-focus border focus-within:outline-2 focus-within:outline-offset-2">
        {editor ? <Toolbar editor={editor} /> : null}
        <EditorContent editor={editor} />
      </div>
      {hint ? <p className="text-muted text-sm">{hint}</p> : null}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const t = useTranslations("admin.editor");
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
    }),
  });

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("linkPrompt"), previous ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:|tel:)/.test(url)) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const buttons = [
    {
      key: "h2",
      icon: Heading2,
      active: state.h2,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: "h3",
      icon: Heading3,
      active: state.h3,
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    { key: "bold", icon: Bold, active: state.bold, run: () => editor.chain().focus().toggleBold().run() },
    { key: "italic", icon: Italic, active: state.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { key: "bulletList", icon: List, active: state.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
    {
      key: "orderedList",
      icon: ListOrdered,
      active: state.ordered,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    { key: "quote", icon: Quote, active: state.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { key: "link", icon: Link2, active: state.link, run: setLink },
  ] as const;

  return (
    <div role="toolbar" aria-label={t("toolbar")} className="border-line flex flex-wrap gap-0.5 border-b p-1">
      {buttons.map(({ key, icon: Icon, active, run }) => (
        <button
          key={key}
          type="button"
          aria-label={t(key)}
          aria-pressed={active}
          title={t(key)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={run}
          className={cn(
            "inline-flex size-8 items-center justify-center",
            active ? "bg-inverse text-on-inverse" : "text-foreground hover:bg-surface",
          )}
        >
          <Icon {...uiIcon} size={16} />
        </button>
      ))}
      {state.link ? (
        <button
          type="button"
          aria-label={t("unlink")}
          title={t("unlink")}
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="text-foreground hover:bg-surface inline-flex size-8 items-center justify-center"
        >
          <Unlink {...uiIcon} size={16} />
        </button>
      ) : null}
    </div>
  );
}
