import { Router } from "express";
import { asyncHandler, httpError, requireDb } from "../middleware/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { emitChange } from "../realtime.js";

/**
 * Every content type in the CMS needs the same five endpoints and the same
 * "tell everyone it changed" behaviour, so they are generated from one place.
 * Mount at /api/admin/<resource>.
 */
export function crudRouter({
  Model,
  resource,
  populate = "",
  sort = { order: 1, createdAt: 1 },
  filterable = [],
  transform = (body) => body,
}) {
  const router = Router();
  // Content is staff-only. Trainees hold a valid token too, so checking
  // that one exists is not enough: without the role check, anyone who
  // signed up could read the bug answer keys and rewrite the site.
  router.use(requireDb, requireAuth, requireRole("admin", "editor"));

  const load = (id) => {
    const q = Model.findById(id);
    return populate ? q.populate(populate) : q;
  };

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const filter = {};
      for (const key of filterable) {
        if (req.query[key] !== undefined && req.query[key] !== "") filter[key] = req.query[key];
      }
      const q = Model.find(filter).sort(sort);
      res.json(await (populate ? q.populate(populate) : q));
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const doc = await load(req.params.id);
      if (!doc) throw httpError(404, "Not found.");
      res.json(doc);
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const created = await Model.create(await transform(req.body, req));
      const doc = await load(created._id);
      emitChange(resource, "created", doc);
      res.status(201).json(doc);
    })
  );

  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const payload = await transform(req.body, req);
      delete payload.id;
      delete payload._id;
      const doc = await Model.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true,
      });
      if (!doc) throw httpError(404, "Not found.");
      const fresh = await load(doc._id);
      emitChange(resource, "updated", fresh);
      res.json(fresh);
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) throw httpError(404, "Not found.");
      emitChange(resource, "deleted", doc);
      res.json({ ok: true, id: req.params.id });
    })
  );

  /** Drag-and-drop ordering: send the ids in their new order. */
  router.patch(
    "/bulk/reorder",
    asyncHandler(async (req, res) => {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      if (!ids.length) throw httpError(400, "Send an `ids` array in the new order.");
      await Model.bulkWrite(
        ids.map((id, index) => ({
          updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
        }))
      );
      emitChange(resource, "reordered", { ids });
      res.json({ ok: true, count: ids.length });
    })
  );

  return router;
}
