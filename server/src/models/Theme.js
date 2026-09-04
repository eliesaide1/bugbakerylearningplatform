import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

/**
 * Singleton holding the design tokens. These mirror shared/styles.ts exactly:
 * the CMS writes them here, the server broadcasts the change, and both
 * frontends push the values onto :root as CSS custom properties.
 */
const color = (fallback) => ({ type: String, default: fallback, trim: true });

const themeSchema = new mongoose.Schema(
  {
    key: { type: String, default: "theme", unique: true },

    primary: color("#1B3FD8"),
    primaryDeep: color("#152FA0"),
    primarySoft: color("#E7EAFB"),

    secondary: color("#E9A13B"),
    secondaryDeep: color("#C9821F"),
    secondarySoft: color("#FBEFD9"),

    tertiary: color("#1F7A6B"),
    tertiaryDeep: color("#155C50"),
    tertiarySoft: color("#E2F1ED"),

    ink: color("#14181F"),
    ink2: color("#39424F"),
    muted: color("#6C7686"),
    paper: color("#F4F5F3"),
    panel: color("#FFFFFF"),
    line: color("#DCDFDA"),
    lineStrong: color("#C3C8C0"),

    surfaceDark: color("#191E27"),
    borderDark: color("#2C333F"),
    onDark: color("#EDEFEC"),
    onDarkMuted: color("#B7BFC9"),
    fieldBg: color("#1D232D"),
    fieldBorder: color("#333B47"),

    danger: color("#C4352B"),
    success: color("#1F7A4D"),

    radius: color("4px"),
    radiusLarge: color("10px"),
    fontDisplay: color('"Bricolage Grotesque", "IBM Plex Sans", sans-serif'),
    fontSans: color('"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif'),
    fontMono: color('"IBM Plex Mono", ui-monospace, monospace'),
  },
  baseOptions
);

themeSchema.statics.getSingleton = async function getSingleton() {
  return (await this.findOne({ key: "theme" })) || (await this.create({ key: "theme" }));
};

export const Theme = mongoose.model("Theme", themeSchema);
