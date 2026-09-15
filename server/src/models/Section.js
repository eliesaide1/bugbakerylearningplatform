import mongoose from "mongoose";
import { baseOptions, orderedFields } from "./plugins.js";

/**
 * Layouts a section can render as. The last three pull in managed lists rather
 * than their own items, which is how the CMS controls *where* on the page the
 * programs, the FAQ and the track builder appear.
 */
export const SECTION_TYPES = [
  "rich",
  "cards",
  "week",
  "steps",
  "split",
  "video",
  "gallery",
  "quote",
  "cta",
  "callout",
  "programs",
  "bootcamp",
  "faq",
  "builder",
];

export const SECTION_THEMES = ["paper", "ink", "primary", "secondary", "tertiary"];

const itemSchema = new mongoose.Schema(
  {
    title: String,
    text: String,
    /** Bullet lines, one per line. */
    meta: String,
    /** Small pill above the title, e.g. "Most attention". */
    badge: String,
    /** Lifts this card: accent bar, tint, stronger border. */
    featured: { type: Boolean, default: false },
    /** Written as you want it read: "$50", "per hour from $50". */
    price: String,
    priceNote: String,
    ctaLabel: String,
    href: String,
    media: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
  },
  { _id: true }
);

/**
 * A band on the public page. Everything between the hero and the enrolment form
 * is a Section, so adding a new place to teach people is a CMS action: create
 * it, pick a layout and theme, drag it into position. Every visitor gets it over
 * the socket without reloading.
 */
const sectionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    type: { type: String, enum: SECTION_TYPES, default: "rich" },
    theme: { type: String, enum: SECTION_THEMES, default: "paper" },

    /** Shown in the nav when set. */
    navLabel: String,

    eyebrow: String,
    title: String,
    lede: String,
    body: String,

    items: [itemSchema],
    media: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },
    videoUrl: String,

    ctaLabel: String,
    ctaHref: String,

    ...orderedFields,
  },
  baseOptions
);

export const Section = mongoose.model("Section", sectionSchema);
