import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./config/env.js";

/**
 * Two rooms:
 *   "site" — every public visitor. Gets content:changed so the page repaints live.
 *   "cms"  — authenticated editors. Gets the same events plus presence, so two
 *            people editing at once see each other's saves immediately.
 */
let io = null;

export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    const { token } = socket.handshake.auth || {};
    if (token) {
      try {
        socket.user = jwt.verify(token, env.jwtSecret);
      } catch {
        socket.user = null;
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    const wantsCms = socket.handshake.auth?.room === "cms" && socket.user;
    socket.join("site");
    if (wantsCms) {
      socket.join("cms");
      socket.emit("cms:welcome", { user: socket.user });
      broadcastPresence();
    }

    socket.on("cms:editing", (payload) => {
      if (!socket.user) return;
      socket.to("cms").emit("cms:editing", {
        ...payload,
        user: { id: socket.user.id, name: socket.user.name },
      });
    });

    socket.on("disconnect", () => {
      if (wantsCms) broadcastPresence();
    });
  });

  console.log("[realtime] socket.io ready");
  return io;
}

async function broadcastPresence() {
  if (!io) return;
  const sockets = await io.in("cms").fetchSockets();
  const editors = sockets
    .map((s) => s.user)
    .filter(Boolean)
    .map((u) => ({ id: u.id, name: u.name }));
  io.to("cms").emit("cms:presence", { editors, count: editors.length });
}

/**
 * Called by every write path. `resource` matches the query key the frontends
 * use, so a change here invalidates exactly the right cache on every client.
 */
export function emitChange(resource, action, doc) {
  if (!io) return;
  const payload = {
    resource,
    action,
    id: doc?._id?.toString?.() ?? doc?.id ?? null,
    doc: doc?.toJSON ? doc.toJSON() : doc ?? null,
    at: new Date().toISOString(),
  };
  io.to("site").emit("content:changed", payload);
  io.to("cms").emit("content:changed", payload);
}

export function emitTo(room, event, payload) {
  if (io) io.to(room).emit(event, payload);
}

export function getIo() {
  return io;
}
