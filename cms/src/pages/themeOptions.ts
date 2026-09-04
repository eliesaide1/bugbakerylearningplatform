import type { SectionTheme } from "@shared/types";

/** The colour schemes a section can wear, named the way an editor thinks. */
export const SECTION_THEME_OPTIONS: Array<{ value: SectionTheme; label: string }> = [
  { value: "paper", label: "Paper — the default light band" },
  { value: "ink", label: "Ink — dark band, light text" },
  { value: "primary", label: "Primary tint" },
  { value: "secondary", label: "Secondary tint" },
  { value: "tertiary", label: "Tertiary tint" },
];
