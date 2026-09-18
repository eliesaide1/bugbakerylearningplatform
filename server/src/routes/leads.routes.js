import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { Lead } from "../models/Lead.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler, httpError, requireDb } from "../middleware/error.js";
import { emitTo } from "../realtime.js";

export const publicLeads = Router();
export const adminLeads = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You have sent a few requests already. Try again later." },
});

const leadSchema = z.object({
  name: z.string().trim().min(2, "Tell me your name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  program: z.string().trim().max(120).optional().or(z.literal("")),
  format: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  technologies: z.array(z.string().max(60)).max(30).optional(),
  estimatedWeeks: z.number().int().min(1).max(60).optional(),
  source: z.enum(["enroll", "builder"]).optional(),
});

publicLeads.post(
  "/",
  requireDb,
  limiter,
  asyncHandler(async (req, res) => {
    const data = leadSchema.parse(req.body);
    const lead = await Lead.create(data);
    // Editors watching the CMS see it arrive; public visitors must not.
    emitTo("cms", "lead:new", lead.toJSON());
    res.status(201).json({ ok: true, id: lead.id });
  })
);

// Content is staff-only. Trainees hold a valid token too, so checking
// that one exists is not enough: without the role check, anyone who
// signed up could read the bug answer keys and rewrite the site.
adminLeads.use(requireDb, requireAuth, requireRole("admin", "editor"));

adminLeads.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.source) filter.source = req.query.source;
    res.json(await Lead.find(filter).sort({ createdAt: -1 }).limit(500));
  })
);

adminLeads.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const doc = await Lead.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, notes: req.body.notes },
      { new: true, runValidators: true }
    );
    if (!doc) throw httpError(404, "Not found.");
    emitTo("cms", "lead:updated", doc.toJSON());
    res.json(doc);
  })
);

adminLeads.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const doc = await Lead.findByIdAndDelete(req.params.id);
    if (!doc) throw httpError(404, "Not found.");
    emitTo("cms", "lead:deleted", { id: req.params.id });
    res.json({ ok: true, id: req.params.id });
  })
);
