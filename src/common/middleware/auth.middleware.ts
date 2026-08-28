import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";

export interface AuthUser {
  id: string;
  role: "user" | "admin";
}

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  const token = header.substring(7);

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret) as AuthUser;

    req.user = payload;

    next();
  } catch {
    throw new AppError("Invalid or expired access token", 401, "INVALID_TOKEN");
  }
};
