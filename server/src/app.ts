import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import apiRouter from "./routes/index.js";

export function createApp() {
  const app = express();

  // Behind a managed proxy (Render/Vercel/Fly) so req.ip and rate limiting see
  // the real client address rather than the load balancer's.
  if (config.isProduction) app.set("trust proxy", 1);

  // Security headers. The API only returns JSON, so the default policy is fine.
  app.use(helmet());

  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
