import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const adminMiddleware: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    throw new AppError("Admin access required", 403, "FORBIDDEN");
  }

  next();
};
