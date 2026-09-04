import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import { env, isProd } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  // Media is served from this origin and embedded by the site and the CMS,
  // so the default same-origin resource policy has to be relaxed.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(compression());
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`Origin ${origin} is not allowed`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  if (!isProd) app.use(morgan("dev"));

  // Uploaded images and videos. maxAge keeps repeat views cheap; filenames are
  // content-hashed on upload so a replaced file gets a new url.
  app.use(
    "/uploads",
    express.static(env.uploadsDir, {
      maxAge: isProd ? "30d" : 0,
      fallthrough: true,
    })
  );

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
