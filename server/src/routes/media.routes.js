import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { Media } from "../models/Media.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, httpError, requireDb } from "../middleware/error.js";
import { upload, kindOf, sanitizeFolder, publicUrlFor } from "../middleware/upload.js";
import { env } from "../config/env.js";
import { emitChange } from "../realtime.js";

const router = Router();
router.use(requireDb, requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.kind) filter.kind = req.query.kind;
    if (req.query.folder) filter.folder = req.query.folder;
    // Generous ceiling: the CMS pages this list client-side, and an admin
    // library of a few thousand rows is still a small payload.
    res.json(await Media.find(filter).sort({ createdAt: -1 }).limit(2000));
  })
);

/** Accepts images and videos; `folder` groups them in the library. */
router.post(
  "/upload",
  upload.array("files", 10),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) throw httpError(400, "Choose at least one file.");
    // Set while the file was being written, so it matches the path on disk.
    const folder = req.uploadFolder ?? sanitizeFolder(req.body?.folder);

    const docs = await Media.insertMany(
      req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        kind: kindOf(file.mimetype),
        mimeType: file.mimetype,
        size: file.size,
        url: publicUrlFor(folder, file.filename),
        alt: req.body?.alt || "",
        folder,
        uploadedBy: req.user.id,
      }))
    );

    docs.forEach((doc) => emitChange("media", "created", doc));
    res.status(201).json(docs);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const doc = await Media.findByIdAndUpdate(
      req.params.id,
      { alt: req.body.alt, folder: sanitizeFolder(req.body.folder) },
      { new: true, runValidators: true }
    );
    if (!doc) throw httpError(404, "Not found.");
    emitChange("media", "updated", doc);
    res.json(doc);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const doc = await Media.findByIdAndDelete(req.params.id);
    if (!doc) throw httpError(404, "Not found.");

    // Best effort: a missing file should not fail the request.
    const onDisk = path.join(env.uploadsDir, doc.folder, doc.filename);
    await fs.unlink(onDisk).catch(() => {});

    emitChange("media", "deleted", doc);
    res.json({ ok: true, id: req.params.id });
  })
);

export default router;
