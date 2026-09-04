import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { env } from "../config/env.js";

fs.mkdirSync(env.uploadsDir, { recursive: true });

const IMAGE = /^image\/(png|jpe?g|gif|webp|avif|svg\+xml)$/;
const VIDEO = /^video\/(mp4|webm|ogg|quicktime|x-matroska)$/;
const DOC = /^application\/pdf$/;

export function kindOf(mimeType = "") {
  if (IMAGE.test(mimeType)) return "image";
  if (VIDEO.test(mimeType)) return "video";
  return "file";
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    // Multer parses a multipart body in order, so `req.body.folder` is only
    // populated here if the field was sent before the file. Whatever it
    // resolves to, remember it on the request: the route builds the public url
    // from `req.uploadFolder`, so the path on disk and the url always agree
    // even when a client sends the fields the other way round.
    const folder = sanitizeFolder(req.body?.folder);
    req.uploadFolder = folder;
    const dir = path.join(env.uploadsDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    const base = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "file";
    cb(null, `${base}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 * 1024 }, // 512MB, videos are the reason
  fileFilter(_req, file, cb) {
    const ok = IMAGE.test(file.mimetype) || VIDEO.test(file.mimetype) || DOC.test(file.mimetype);
    if (!ok) return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    cb(null, true);
  },
});

export function sanitizeFolder(folder) {
  const clean = String(folder || "general")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
  return clean || "general";
}

export function publicUrlFor(folder, filename) {
  return `${env.publicUrl}/uploads/${folder}/${filename}`;
}
