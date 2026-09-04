import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

/**
 * Singleton document. Everything on the public page that is not a repeating
 * list lives here, so the CMS can change copy, contacts and the hero without
 * a deploy.
 */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true },

    brandName: { type: String, default: "Bug Bakery" },
    brandTagline: { type: String, default: "Software training" },
    logo: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },

    metaTitle: String,
    metaDescription: String,
    ogImage: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },

    heroTitle: String,
    heroHighlight: String,
    heroLede: String,
    heroPrimaryCta: { label: String, href: String },
    heroSecondaryCta: { label: String, href: String },
    heroStats: [{ value: String, label: String }],
    heroMedia: { type: mongoose.Schema.Types.ObjectId, ref: "Media" },

    weekTitle: String,
    weekLede: String,
    week: [{ day: String, label: String, highlight: Boolean }],

    builderTitle: { type: String, default: "Build your own track" },
    builderNote: String,

    enrollTitle: String,
    enrollLede: String,

    email: String,
    whatsapp: String,
    linkedin: String,
    location: String,
    footerNote: String,

    announcement: { text: String, href: String, active: { type: Boolean, default: false } },
  },
  baseOptions
);

settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({ key: "site" }).populate("logo ogImage heroMedia");
  if (!doc) doc = await this.create({ key: "site" });
  return doc;
};

export const SiteSettings = mongoose.model("SiteSettings", settingsSchema);
