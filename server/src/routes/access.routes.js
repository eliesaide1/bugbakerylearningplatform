import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

import { AccessCode } from "../models/AccessCode.js";
import { ProgramAccess } from "../models/ProgramAccess.js";
import { Program } from "../models/Program.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, httpError, requireDb } from "../middleware/error.js";
import { emitTo } from "../realtime.js";

export const accessRoutes = Router();
accessRoutes.use(requireDb, requireAuth);

/**
 * Codes are short and typed by hand, so they are guessable given enough
 * attempts. This is the only thing standing between a stranger and the paid
 * content, so the limit is deliberately tight.
 */
const redeemLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Wait an hour and try again." },
});

/** Which programs this person can open. */
accessRoutes.get(
  "/access",
  asyncHandler(async (req, res) => {
    const rows = await ProgramAccess.find({ trainee: req.user._id }).populate(
      "program",
      "title slug"
    );
    res.json(
      rows
        .filter((row) => row.program)
        .map((row) => ({
          id: row.id,
          program: { id: row.program.id, title: row.program.title, slug: row.program.slug },
          grantedAt: row.createdAt,
        }))
    );
  })
);

accessRoutes.post(
  "/redeem",
  redeemLimiter,
  asyncHandler(async (req, res) => {
    const { code } = z
      .object({ code: z.string().trim().min(3, "Enter the code you were given.").max(64) })
      .parse(req.body);

    const record = await AccessCode.findOne({ code: code.toUpperCase() }).populate(
      "program",
      "title slug"
    );
    // The same message whether the code is wrong or simply unknown: a
    // different one would let someone probe for which codes exist.
    if (!record) throw httpError(404, "That code was not recognised.");

    const problem = record.problem();
    if (problem) throw httpError(409, problem);

    const programs = record.program
      ? [record.program]
      : await Program.find({ visible: true }).select("title slug");

    const granted = [];
    for (const program of programs) {
      const existing = await ProgramAccess.findOne({
        trainee: req.user._id,
        program: program._id,
      });
      if (existing) continue;
      await ProgramAccess.create({
        trainee: req.user._id,
        program: program._id,
        source: "code",
        code: record.code,
      });
      granted.push({ id: program.id, title: program.title, slug: program.slug });
    }

    // Redeeming a code you already hold should not burn one of its uses.
    if (granted.length) {
      record.uses += 1;
      await record.save();
      emitTo("cms", "access:redeemed", {
        code: record.code,
        trainee: { id: req.user.id, name: req.user.name, email: req.user.email },
        programs: granted.map((p) => p.title),
      });
    }

    res.json({
      ok: true,
      alreadyHad: granted.length === 0,
      programs: granted.length ? granted : programs.map((p) => ({ id: p.id, title: p.title, slug: p.slug })),
    });
  })
);
