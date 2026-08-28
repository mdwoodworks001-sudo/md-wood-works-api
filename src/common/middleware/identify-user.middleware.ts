import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

export function identifyUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    const headerId = req.header("x-user-id");
    if (headerId) {
      req.user = { id: headerId, role: "user" };
    }
  }

  if (!req.user?.id) {
    throw new AppError("User not authenticated", 401, "UNAUTHORIZED");
  }

  next();
}
