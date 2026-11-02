const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/**
 * Index markers, data and years use Western digits in both languages by
 * default; the dashboard setting can switch Arabic pages to Arabic-Indic.
 */
export function localizeDigits(value: string | number, locale: string, style: "western" | "arabic-indic") {
  const text = String(value);
  if (locale !== "ar" || style !== "arabic-indic") return text;
  return text.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}
