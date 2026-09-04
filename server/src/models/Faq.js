import mongoose from "mongoose";
import { baseOptions, orderedFields } from "./plugins.js";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    ...orderedFields,
  },
  baseOptions
);

export const Faq = mongoose.model("Faq", faqSchema);
