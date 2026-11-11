/** A case study imported as a draft project by `pnpm db:import:case-studies`. */
export type L = { en: string; ar: string };
export const both = (en: string, ar: string): L => ({ en, ar });

export type CaseStudy = {
  /** Key in the set's capture.json (cover = `${key}:cover`, gallery = `${key}`). */
  key: string;
  slug: string;
  title: L;
  client: L;
  year: number | null;
  summary: L;
  /** Case-study paragraphs. */
  body: L[];
  /** What we delivered / what the visitor can do (rendered as a list). */
  applications: L[];
  /** Pillar services, by English name. */
  services: string[];
  /** Live link shown as "Visit the project" (only real, public URLs). */
  externalUrl?: string;
  /** Alt text for the gallery files, in order. */
  alt: (index: number) => L;
};
