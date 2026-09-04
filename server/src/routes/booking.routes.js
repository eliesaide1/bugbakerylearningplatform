import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { Availability } from "../models/Availability.js";
import { Booking } from "../models/Booking.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, httpError, requireDb } from "../middleware/error.js";
import { openSlots } from "../lib/slots.js";
import { emitChange, emitTo } from "../realtime.js";

export const publicBooking = Router();
export const adminBooking = Router();

/* ----------------------------- public ----------------------------- */

publicBooking.use(requireDb);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You have booked a few times already. Try again later." },
});

/** Everything still open, as UTC instants for the browser to localise. */
publicBooking.get(
  "/slots",
  asyncHandler(async (_req, res) => {
    const availability = await Availability.getSingleton();
    const booked = await Booking.find({
      start: { $gte: new Date() },
      status: { $ne: "cancelled" },
    }).select("start status");

    res.json({
      timezone: availability.timezone,
      slotMinutes: availability.slotMinutes,
      note: availability.note,
      price: availability.price,
      priceNote: availability.priceNote,
      slots: openSlots(availability, booked),
    });
  })
);

const bookingInput = z.object({
  name: z.string().trim().min(2, "Tell me your name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  program: z.string().trim().max(120).optional().or(z.literal("")),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
  start: z.string().datetime({ message: "Pick a time from the calendar." }),
});

publicBooking.post(
  "/bookings",
  limiter,
  asyncHandler(async (req, res) => {
    const data = bookingInput.parse(req.body);

    const availability = await Availability.getSingleton();
    const booked = await Booking.find({
      start: { $gte: new Date() },
      status: { $ne: "cancelled" },
    }).select("start status");

    // Never trust the posted time: it has to be one this server is offering
    // right now, which also rules out double-booking and expired slots.
    const slot = openSlots(availability, booked).find((s) => s.start === data.start);
    if (!slot) {
      throw httpError(409, "That time is no longer available. Pick another slot.");
    }

    let booking;
    try {
      booking = await Booking.create({
        ...data,
        start: new Date(slot.start),
        end: new Date(slot.end),
        timezone: availability.timezone,
      });
    } catch (err) {
      // Two people submitting the same slot at once: the unique index wins.
      if (err?.code === 11000) throw httpError(409, "Someone just took that slot. Pick another.");
      throw err;
    }

    emitTo("cms", "booking:new", booking.toJSON());
    res.status(201).json({ ok: true, id: booking.id, start: booking.start, end: booking.end });
  })
);

/* ------------------------------ admin ------------------------------ */

adminBooking.use(requireDb, requireAuth);

adminBooking.get(
  "/availability",
  asyncHandler(async (_req, res) => res.json(await Availability.getSingleton()))
);

adminBooking.patch(
  "/availability",
  asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    delete payload.id;
    delete payload._id;
    delete payload.key;

    const doc = await Availability.findOneAndUpdate({ key: "availability" }, payload, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });

    emitChange("availability", "updated", doc);
    res.json(doc);
  })
);

adminBooking.get(
  "/bookings",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.upcoming === "true") filter.start = { $gte: new Date() };
    res.json(await Booking.find(filter).sort({ start: 1 }).limit(500));
  })
);

adminBooking.patch(
  "/bookings/:id",
  asyncHandler(async (req, res) => {
    const doc = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, note: req.body.note },
      { new: true, runValidators: true }
    );
    if (!doc) throw httpError(404, "Not found.");
    emitTo("cms", "booking:updated", doc.toJSON());
    res.json(doc);
  })
);

adminBooking.delete(
  "/bookings/:id",
  asyncHandler(async (req, res) => {
    const doc = await Booking.findByIdAndDelete(req.params.id);
    if (!doc) throw httpError(404, "Not found.");
    emitTo("cms", "booking:deleted", { id: req.params.id });
    res.json({ ok: true, id: req.params.id });
  })
);
