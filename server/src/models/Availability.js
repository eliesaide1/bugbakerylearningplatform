import mongoose from "mongoose";
import { baseOptions } from "./plugins.js";

/**
 * Singleton describing when 1:1 sessions can be booked. Written as wall-clock
 * hours in one timezone — the way you would say it out loud — and turned into
 * real instants by lib/slots.js.
 */
const ruleSchema = new mongoose.Schema(
  {
    /** 0 = Sunday, matching Date#getDay. */
    day: { type: Number, min: 0, max: 6, required: true },
    enabled: { type: Boolean, default: false },
    start: { type: String, default: "18:00" },
    end: { type: String, default: "21:00" },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    key: { type: String, default: "availability", unique: true },

    timezone: { type: String, default: "Asia/Beirut" },
    slotMinutes: { type: Number, default: 60, min: 15, max: 240 },
    /** How soon someone may book. Stops a slot being taken minutes before it. */
    leadTimeHours: { type: Number, default: 12, min: 0, max: 336 },
    /** How far ahead the calendar opens. */
    horizonDays: { type: Number, default: 28, min: 1, max: 120 },

    week: {
      type: [ruleSchema],
      default: () => [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, enabled: day >= 1 && day <= 5 })),
    },

    /** "YYYY-MM-DD" dates closed regardless of the weekly hours. */
    blockedDates: { type: [String], default: [] },

    /** Shown above the calendar on the public page. */
    note: { type: String, default: "" },

    /** Written as you want it read, currency included. */
    price: { type: String, default: "" },
    priceNote: { type: String, default: "per hour" },
  },
  baseOptions
);

availabilitySchema.statics.getSingleton = async function getSingleton() {
  return (await this.findOne({ key: "availability" })) || (await this.create({ key: "availability" }));
};

export const Availability = mongoose.model("Availability", availabilitySchema);
