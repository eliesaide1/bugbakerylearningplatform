import http from "node:http";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { initRealtime } from "./realtime.js";
import { env } from "./config/env.js";

const app = createApp();
const server = http.createServer(app);

initRealtime(server);
connectDb();

server.listen(env.port, () => {
  console.log(`[api]  http://localhost:${env.port}/api`);
  console.log(`[site] allowed origins: ${env.corsOrigins.join(", ")}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`\n[api] ${signal} received, closing`);
    server.close(() => process.exit(0));
  });
}
