"use client";

import { useTranslations } from "next-intl";
import { useFieldArray, type Control, type FieldValues } from "react-hook-form";
import { ContentEditor, type CopySection } from "@/components/admin/content-editor";
import { SortableList } from "@/components/admin/sortable-list";
import { Switch } from "@/components/ui/switch";
import { savePageContent } from "./actions";

const L = { en: "", ar: "" };
type EditorProps = { initial: Record<string, unknown>; canEdit: boolean };

function HomeSections({ control }: { control: Control<FieldValues> }) {
  const t = useTranslations("admin.pages.home");
  const sections = useFieldArray({ control, name: "sections" });
  return (
    <div className="space-y-2">
      <p className="text-foreground text-sm font-semibold">{t("sections")}</p>
      <p className="text-muted text-sm">{t("sectionsHint")}</p>
      <SortableList
        items={sections.fields}
        onReorder={(_next, from, to) => sections.move(from, to)}
        renderItem={(item, index) => {
          const section = item as unknown as { key: string; visible: boolean };
          return (
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground text-sm font-semibold">
                {t(`sectionNames.${section.key}` as "sectionNames.hero")}
              </span>
              <Switch
                checked={section.visible}
                aria-label={t(`sectionNames.${section.key}` as "sectionNames.hero")}
                onCheckedChange={(visible) => sections.update(index, { ...section, visible })}
              />
            </div>
          );
        }}
      />
    </div>
  );
}

export function HomeEditor({ initial, canEdit }: EditorProps) {
  const t = useTranslations("admin.pages");
  const sections: CopySection[] = [
    { title: t("home.sections"), render: (control) => <HomeSections control={control} /> },
    {
      title: t("home.hero"),
      description: t("home.heroHint"),
      fields: [
        { name: "hero.label", label: t("common.label") },
        { name: "hero.headline", label: t("home.headline") },
        { name: "hero.body", label: t("common.body"), kind: "textarea" },
        { name: "hero.primaryCta", label: t("home.primaryCta") },
        { name: "hero.secondaryCta", label: t("home.secondaryCta") },
      ],
    },
    {
      title: t("home.sectionNames.pillars"),
      fields: [
        { name: "pillars.label", label: t("common.label") },
        { name: "pillars.heading", label: t("common.heading") },
      ],
    },
    {
      title: t("home.sectionNames.positioning"),
      fields: [
        { name: "positioning.label", label: t("common.label") },
        { name: "positioning.heading", label: t("common.heading"), kind: "textarea" },
      ],
    },
    {
      title: t("home.disciplines"),
      list: {
        name: "positioning.disciplines",
        addLabel: t("home.addDiscipline"),
        itemLabel: t("home.discipline"),
        fields: [{ name: "", label: t("home.discipline") }],
        empty: L,
      },
    },
    {
      title: t("home.sectionNames.featuredWork"),
      fields: [
        { name: "featuredWork.label", label: t("common.label") },
        { name: "featuredWork.heading", label: t("common.heading") },
      ],
    },
    {
      title: t("home.sectionNames.process"),
      fields: [
        { name: "process.label", label: t("common.label") },
        { name: "process.heading", label: t("common.heading") },
      ],
    },
    {
      title: t("home.sectionNames.teamPreview"),
      fields: [
        { name: "teamPreview.label", label: t("common.label") },
        { name: "teamPreview.heading", label: t("common.heading") },
      ],
    },
    {
      title: t("home.sectionNames.closingCta"),
      fields: [
        { name: "closingCta.statement", label: t("home.statement") },
        { name: "closingCta.cta", label: t("home.cta") },
      ],
    },
  ];
  return (
    <ContentEditor settingKey="home" initial={initial} sections={sections} save={savePageContent} canEdit={canEdit} />
  );
}

export function AboutEditor({ initial, canEdit }: EditorProps) {
  const t = useTranslations("admin.pages");
  const titled = (titleLabel: string) => [
    { name: "title", label: titleLabel },
    { name: "body", label: t("about.text"), kind: "textarea" as const },
  ];
  const sections: CopySection[] = [
    {
      title: t("about.intro"),
      fields: [
        { name: "intro.statement", label: t("about.statement"), kind: "textarea" },
        { name: "intro.body", label: t("common.body"), kind: "textarea" },
      ],
    },
    {
      title: t("about.meaning"),
      fields: [
        { name: "meaning.label", label: t("common.label") },
        { name: "meaning.word", label: t("about.word") },
        { name: "meaning.body", label: t("common.body"), kind: "textarea" },
      ],
    },
    {
      title: `${t("about.meaning")} — ${t("about.points")}`,
      list: {
        name: "meaning.points",
        addLabel: t("about.addPoint"),
        itemLabel: t("about.point"),
        fields: titled(t("common.title")),
        empty: { title: L, body: L },
      },
    },
    {
      title: t("about.essence"),
      fields: [
        { name: "essence.label", label: t("common.label") },
        { name: "essence.headline", label: t("common.heading") },
        { name: "essence.body", label: t("common.body"), kind: "textarea" },
      ],
    },
    { title: t("about.coreIdea"), fields: [{ name: "coreIdea.headline", label: t("common.heading") }] },
    {
      title: `${t("about.coreIdea")} — ${t("about.pillar")}`,
      list: {
        name: "coreIdea.pillars",
        addLabel: t("about.addPillar"),
        itemLabel: t("about.pillar"),
        fields: titled(t("common.title")),
        empty: { title: L, body: L },
      },
    },
    {
      title: t("about.purposeVisionMission"),
      fields: [
        { name: "purpose", label: t("about.purpose"), kind: "textarea" },
        { name: "vision", label: t("about.vision"), kind: "textarea" },
        { name: "mission", label: t("about.mission"), kind: "textarea" },
      ],
    },
    {
      title: t("about.promise"),
      list: {
        name: "promise",
        addLabel: t("about.addPromise"),
        itemLabel: t("about.promiseItem"),
        fields: [
          { name: "title", label: t("common.title") },
          { name: "line", label: t("about.line") },
        ],
        empty: { title: L, line: L },
      },
    },
    {
      title: t("about.values"),
      list: {
        name: "values",
        addLabel: t("about.addValue"),
        itemLabel: t("about.value"),
        fields: titled(t("common.title")),
        empty: { title: L, body: L },
      },
    },
    {
      title: t("about.personality"),
      fields: [
        { name: "personality.is", label: t("about.is"), kind: "textarea" },
        { name: "personality.isNot", label: t("about.isNot"), kind: "textarea" },
      ],
    },
    {
      title: t("about.problem"),
      fields: [
        { name: "problem.label", label: t("common.label") },
        { name: "problem.headline", label: t("common.heading"), kind: "textarea" },
        { name: "problem.body", label: t("common.body"), kind: "textarea" },
      ],
    },
    {
      title: t("about.audiences"),
      list: {
        name: "audiences",
        addLabel: t("about.addAudience"),
        itemLabel: t("about.audience"),
        fields: titled(t("common.title")),
        empty: { title: L, body: L },
      },
    },
    { title: t("about.narrative"), fields: [{ name: "narrative.headline", label: t("common.heading") }] },
    {
      title: `${t("about.narrative")} — ${t("about.paragraph")}`,
      list: {
        name: "narrative.paragraphs",
        addLabel: t("about.addParagraph"),
        itemLabel: t("about.paragraph"),
        fields: [{ name: "", label: t("about.paragraph"), kind: "textarea" }],
        empty: L,
      },
    },
  ];
  return (
    <ContentEditor settingKey="about" initial={initial} sections={sections} save={savePageContent} canEdit={canEdit} />
  );
}

export function ProcessEditor({ initial, canEdit }: EditorProps) {
  const t = useTranslations("admin.pages.process");
  const sections: CopySection[] = [
    {
      title: t("steps"),
      list: {
        name: "steps",
        addLabel: t("addStep"),
        itemLabel: t("step"),
        fields: [
          { name: "title", label: t("step") },
          { name: "description", label: t("description2"), kind: "textarea" },
        ],
        empty: { title: L, description: L },
      },
    },
  ];
  return (
    <ContentEditor
      settingKey="process"
      initial={initial}
      sections={sections}
      save={savePageContent}
      canEdit={canEdit}
    />
  );
}

export function PrivacyEditor({ initial, canEdit }: EditorProps) {
  const t = useTranslations("admin.pages.privacy");
  const sections: CopySection[] = [
    {
      title: t("page"),
      fields: [
        { name: "privacyTitle", label: t("pageTitle") },
        { name: "privacyBody", label: t("body"), kind: "rich" },
      ],
    },
  ];
  return (
    <ContentEditor settingKey="legal" initial={initial} sections={sections} save={savePageContent} canEdit={canEdit} />
  );
}

export function FooterEditor({ initial, canEdit }: EditorProps) {
  const t = useTranslations("admin.pages.footer");
  const sections: CopySection[] = [
    { title: t("title"), fields: [{ name: "text", label: t("text"), hint: t("textHint") }] },
  ];
  return (
    <ContentEditor settingKey="footer" initial={initial} sections={sections} save={savePageContent} canEdit={canEdit} />
  );
}
