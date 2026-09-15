import http from "node:http";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { initRealtime, closeRealtime } from "./realtime.js";
import { env } from "./config/env.js";
import { recoverStuckReviews } from "./routes/bootcamp.routes.js";

const app = createApp();
const server = http.createServer(app);

initRealtime(server);

// A review runs in the background, so a restart mid-pass would leave a trainee
// waiting on a reply that is never coming. Sweep those into the queue instead.
connectDb().then((ok) => ok && recoverStuckReviews().catch(() => {}));

server.listen(env.port, () => {
  console.log(`[api]  http://localhost:${env.port}/api`);
  console.log(`[site] allowed origins: ${env.corsOrigins.join(", ")}`);
});

let shuttingDown = false;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[api] ${signal} received, closing`);

    // Every open browser holds a socket, and server.close() waits on all of
    // them — so without hanging up the sockets first, a restart never finishes.
    closeRealtime();
    server.close(() => process.exit(0));

    // A connection that will not close should not hold the process open.
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
