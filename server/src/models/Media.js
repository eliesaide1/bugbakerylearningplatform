import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

/** Every uploaded image or video the CMS knows about. */
const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: String,
    kind: { type: String, enum: ["image", "video", "file"], default: "image", index: true },
    mimeType: String,
    size: Number,
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    folder: { type: String, default: "general", index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  baseOptions
);

export const Media = mongoose.model("Media", mediaSchema);
