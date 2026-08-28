import type { ErrorRequestHandler, Request } from "express";

import { env } from "../../config/env.js";
import { AppError } from "./AppError.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res,
  _next,
) => {
  console.error(error);

  if (res.headersSent) {
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });

    return;
  }

  if (error?.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: Object.values(error.errors).map((item: any) => item.message),
    });

    return;
  }

  if (error?.name === "ZodError") {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: error.issues?.map(
        (issue: any) => `${issue.path.join(".")}: ${issue.message}`,
      ),
    });

    return;
  }

  if (error?.code === 11000) {
    res.status(409).json({
      success: false,
      message: "Duplicate resource",
      code: "DUPLICATE_RESOURCE",
    });

    return;
  }

  res.status(500).json({
    success: false,
    message:
      env.nodeEnv === "production"
        ? "Internal server error"
        : (error?.message ?? "Internal server error"),
    code: "INTERNAL_SERVER_ERROR",
  });
};
