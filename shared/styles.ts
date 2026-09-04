/**
 * The single source of truth for colour, type and shape.
 *
 * Every token here is written to the document as a CSS custom property, and
 * Tailwind's theme reads those same properties — so `bg-primary` in any
 * component resolves to whatever `primary` currently is. The CMS edits these
 * values, the server broadcasts them, and `applyTheme` repaints every open tab
 * without a reload.
 */

export interface ThemeTokens {
  /** Brand blue: buttons, links, active states. */
  primary: string;
  primaryDeep: string;
  primarySoft: string;

  /** Accent amber: highlights, the live badge, the Monday marker. */
  secondary: string;
  secondaryDeep: string;
  secondarySoft: string;

  /** Third accent: available to any section that wants a different tone. */
  tertiary: string;
  tertiaryDeep: string;
  tertiarySoft: string;

  /** Neutrals on light surfaces. */
  ink: string;
  ink2: string;
  muted: string;
  paper: string;
  panel: string;
  line: string;
  lineStrong: string;

  /** Neutrals on the dark bands and form fields. */
  surfaceDark: string;
  borderDark: string;
  onDark: string;
  onDarkMuted: string;
  fieldBg: string;
  fieldBorder: string;

  /** Feedback. */
  danger: string;
  success: string;

  /** Shape and type. */
  radius: string;
  /** Larger radius for card surfaces; controls keep `radius`. */
  radiusLarge: string;
  fontDisplay: string;
  fontSans: string;
  fontMono: string;
}

export const DEFAULT_THEME: ThemeTokens = {
  primary: "#1B3FD8",
  primaryDeep: "#152FA0",
  primarySoft: "#E7EAFB",

  secondary: "#E9A13B",
  secondaryDeep: "#C9821F",
  secondarySoft: "#FBEFD9",

  tertiary: "#1F7A6B",
  tertiaryDeep: "#155C50",
  tertiarySoft: "#E2F1ED",

  ink: "#14181F",
  ink2: "#39424F",
  muted: "#6C7686",
  paper: "#F4F5F3",
  panel: "#FFFFFF",
  line: "#DCDFDA",
  lineStrong: "#C3C8C0",

  surfaceDark: "#191E27",
  borderDark: "#2C333F",
  onDark: "#EDEFEC",
  onDarkMuted: "#B7BFC9",
  fieldBg: "#1D232D",
  fieldBorder: "#333B47",

  danger: "#C4352B",
  success: "#1F7A4D",

  radius: "4px",
  radiusLarge: "10px",
  fontDisplay: '"Bricolage Grotesque", "IBM Plex Sans", sans-serif',
  fontSans: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
  fontMono: '"IBM Plex Mono", ui-monospace, monospace',
};

/** Token -> CSS custom property. These names match the Tailwind @theme block. */
export const CSS_VARS: Record<keyof ThemeTokens, string> = {
  primary: "--color-primary",
  primaryDeep: "--color-primary-deep",
  primarySoft: "--color-primary-soft",

  secondary: "--color-secondary",
  secondaryDeep: "--color-secondary-deep",
  secondarySoft: "--color-secondary-soft",

  tertiary: "--color-tertiary",
  tertiaryDeep: "--color-tertiary-deep",
  tertiarySoft: "--color-tertiary-soft",

  ink: "--color-ink",
  ink2: "--color-ink-2",
  muted: "--color-muted",
  paper: "--color-paper",
  panel: "--color-panel",
  line: "--color-line",
  lineStrong: "--color-line-strong",

  surfaceDark: "--color-surface-dark",
  borderDark: "--color-border-dark",
  onDark: "--color-on-dark",
  onDarkMuted: "--color-on-dark-muted",
  fieldBg: "--color-field",
  fieldBorder: "--color-field-border",

  danger: "--color-danger",
  success: "--color-success",

  radius: "--radius-card",
  radiusLarge: "--radius-panel",
  fontDisplay: "--font-display",
  fontSans: "--font-sans",
  fontMono: "--font-mono",
};

/** Fields the CMS shows as colour pickers, in the order they appear there. */
export const COLOR_TOKENS: Array<{ key: keyof ThemeTokens; label: string; hint: string }> = [
  { key: "primary", label: "Primary", hint: "Buttons, links, active chips" },
  { key: "primaryDeep", label: "Primary — pressed", hint: "Hover and active state" },
  { key: "primarySoft", label: "Primary — tint", hint: "Ghost button fill, featured cards" },
  { key: "secondary", label: "Secondary", hint: "Hero underline, Monday marker, live badge" },
  { key: "secondaryDeep", label: "Secondary — pressed", hint: "Hover state" },
  { key: "secondarySoft", label: "Secondary — tint", hint: "Callout background" },
  { key: "tertiary", label: "Tertiary", hint: "Spare accent for new sections" },
  { key: "tertiaryDeep", label: "Tertiary — pressed", hint: "Hover state" },
  { key: "tertiarySoft", label: "Tertiary — tint", hint: "Tinted backgrounds" },
  { key: "ink", label: "Ink", hint: "Headings and dark bands" },
  { key: "ink2", label: "Ink — body", hint: "Paragraph text" },
  { key: "muted", label: "Muted", hint: "Captions and hints" },
  { key: "paper", label: "Paper", hint: "Page background" },
  { key: "panel", label: "Panel", hint: "Card background" },
  { key: "line", label: "Line", hint: "Hairline dividers" },
  { key: "lineStrong", label: "Line — strong", hint: "Card borders" },
  { key: "surfaceDark", label: "Dark surface", hint: "Cards inside dark bands" },
  { key: "borderDark", label: "Dark border", hint: "Borders inside dark bands" },
  { key: "onDark", label: "Text on dark", hint: "Body text on dark bands" },
  { key: "onDarkMuted", label: "Muted on dark", hint: "Secondary text on dark bands" },
  { key: "fieldBg", label: "Field background", hint: "Form inputs on dark bands" },
  { key: "fieldBorder", label: "Field border", hint: "Form input borders" },
  { key: "danger", label: "Danger", hint: "Errors and destructive actions" },
  { key: "success", label: "Success", hint: "Confirmations" },
];

export const FONT_TOKENS: Array<{ key: keyof ThemeTokens; label: string }> = [
  { key: "fontDisplay", label: "Display font (headings)" },
  { key: "fontSans", label: "Body font" },
  { key: "fontMono", label: "Mono font (labels, chips)" },
];

/** Merge whatever the API returned over the defaults, ignoring blanks. */
export function withDefaults(theme?: Partial<ThemeTokens> | null): ThemeTokens {
  const merged = { ...DEFAULT_THEME };
  if (!theme) return merged;
  for (const key of Object.keys(DEFAULT_THEME) as Array<keyof ThemeTokens>) {
    const value = theme[key];
    if (typeof value === "string" && value.trim()) merged[key] = value.trim();
  }
  return merged;
}

/**
 * Writes the tokens onto an element as inline custom properties. Inline styles
 * beat the stylesheet's :root block, so this overrides the Tailwind defaults
 * the moment a socket event arrives.
 */
export function applyTheme(theme?: Partial<ThemeTokens> | null, target?: HTMLElement): ThemeTokens {
  const resolved = withDefaults(theme);
  const root = target ?? (typeof document !== "undefined" ? document.documentElement : null);
  if (!root) return resolved;

  for (const key of Object.keys(CSS_VARS) as Array<keyof ThemeTokens>) {
    root.style.setProperty(CSS_VARS[key], resolved[key]);
  }
  return resolved;
}

/** Same tokens as a CSS string — handy for previews inside an iframe. */
export function themeToCss(theme?: Partial<ThemeTokens> | null): string {
  const resolved = withDefaults(theme);
  const lines = (Object.keys(CSS_VARS) as Array<keyof ThemeTokens>).map(
    (key) => `  ${CSS_VARS[key]}: ${resolved[key]};`
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

/* ------------------------------------------------------------------ *
 * Band themes: the class sets a section uses for each colour scheme.
 * Written out in full so Tailwind's scanner keeps them.
 * ------------------------------------------------------------------ */

export type SectionTheme = "paper" | "ink" | "primary" | "secondary" | "tertiary";

export interface BandClasses {
  band: string;
  title: string;
  lede: string;
  note: string;
  panel: string;
  border: string;
  eyebrow: string;
  /** Which button variant reads correctly on this background. */
  button: "solid" | "ghost" | "light";
  /** Inputs on dark bands need the dark field treatment. */
  tone: "light" | "dark";
}

export const BANDS: Record<SectionTheme, BandClasses> = {
  paper: {
    band: "bg-paper text-ink",
    title: "text-ink",
    lede: "text-ink-2",
    note: "text-muted",
    panel: "bg-panel border-line-strong",
    border: "border-line-strong",
    eyebrow: "text-muted",
    button: "solid",
    tone: "light",
  },
  ink: {
    band: "bg-ink text-on-dark",
    title: "text-white",
    lede: "text-on-dark-muted",
    note: "text-on-dark-muted",
    panel: "bg-surface-dark border-border-dark",
    border: "border-border-dark",
    eyebrow: "text-on-dark-muted",
    button: "light",
    tone: "dark",
  },
  primary: {
    band: "bg-primary-soft text-ink",
    title: "text-ink",
    lede: "text-ink-2",
    note: "text-muted",
    panel: "bg-panel border-line-strong",
    border: "border-line-strong",
    eyebrow: "text-primary",
    button: "solid",
    tone: "light",
  },
  secondary: {
    band: "bg-secondary-soft text-ink",
    title: "text-ink",
    lede: "text-ink-2",
    note: "text-ink-2",
    panel: "bg-panel border-line-strong",
    border: "border-line-strong",
    eyebrow: "text-secondary-deep",
    button: "solid",
    tone: "light",
  },
  tertiary: {
    band: "bg-tertiary-soft text-ink",
    title: "text-ink",
    lede: "text-ink-2",
    note: "text-ink-2",
    panel: "bg-panel border-line-strong",
    border: "border-line-strong",
    eyebrow: "text-tertiary",
    button: "solid",
    tone: "light",
  },
};

export const bandOf = (theme?: SectionTheme): BandClasses => BANDS[theme ?? "paper"] ?? BANDS.paper;
