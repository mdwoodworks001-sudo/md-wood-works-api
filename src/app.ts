// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import compression from "compression";
// import cookieParser from "cookie-parser";
// import morgan from "morgan";
// import rateLimit from "express-rate-limit";
// import path from "node:path";

// import { env } from "./config/env.js";
// import { errorHandler } from "./common/errors/errorHandler.js";
// import { notFoundMiddleware } from "./common/middleware/notFound.middleware.js";
// import apiRoutes from "./routes/index.js";

// const app = express();

// app.set("trust proxy", 1);

// app.use(
//   `/${env.uploadDir}`,
//   express.static(path.resolve(process.cwd(), env.uploadDir)),
// );
// app.use(helmet());

// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//   }),
// );

// app.use(compression());

// app.use(
//   express.json({
//     limit: "2mb",
//   }),
// );

// app.use(
//   express.urlencoded({
//     extended: true,
//     limit: "2mb",
//   }),
// );

// app.use(cookieParser());

// app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// app.use(`/${env.uploadDir}`, express.static(path.resolve(env.uploadDir)));

// app.use(
//   "/api/auth",
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     limit: 100,
//   }),
// );

// app.use("/api", apiRoutes);

// app.use(notFoundMiddleware);

// app.use(errorHandler);

// export default app;
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

/*
|--------------------------------------------------------------------------
| Static Upload Files
|--------------------------------------------------------------------------
*/

app.use(
  `/${env.uploadDir}`,
  express.static(
    path.resolve(process.cwd(), env.uploadDir),
  ),
);

/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: [
      "https://mdwoodworks.netlify.app",
      "http://localhost:4200",
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

/*
|--------------------------------------------------------------------------
| Compression
|--------------------------------------------------------------------------
*/

app.use(compression());

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Cookies
|--------------------------------------------------------------------------
*/

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/

app.use(
  morgan(
    env.nodeEnv === "production"
      ? "combined"
      : "dev",
  ),
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Rate Limiting
|--------------------------------------------------------------------------
*/

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api", apiRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use(notFoundMiddleware);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

export default app;
