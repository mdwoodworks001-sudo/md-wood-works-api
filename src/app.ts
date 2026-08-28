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
  express.static(
    path.resolve(process.cwd(), env.uploadDir),
  ),
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  cors({
    origin: [
      "https://mdwoodworks.netlify.app",
      "http://localhost:4200",
      "http://localhost:4300",
      "http://localhost:5173",
    ],

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
    ],
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

app.use(
  morgan(
    env.nodeEnv === "production"
      ? "combined"
      : "dev",
  ),
);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "MD Wood Works API is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use("/api", apiRoutes);

app.use(notFoundMiddleware);

app.use(errorHandler);

export default app;
