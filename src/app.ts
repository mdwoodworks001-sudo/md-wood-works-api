import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "node:path";

import { env } from "./config/env.js";
import { errorHandler } from "./common/errors/errorHandler.js";
import { notFoundMiddleware } from "./common/middleware/notFound.middleware.js";
import apiRoutes from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  `/${env.uploadDir}`,
  express.static(path.resolve(process.cwd(), env.uploadDir)),
);
app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(compression());

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  }),
);

app.use(cookieParser());

app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use(`/${env.uploadDir}`, express.static(path.resolve(env.uploadDir)));

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
  }),
);

app.use("/api", apiRoutes);

app.use(notFoundMiddleware);

app.use(errorHandler);

export default app;
