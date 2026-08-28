import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { AuthUser } from "../middleware/auth.middleware.js";

export function signAccessToken(payload: AuthUser): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: AuthUser): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): AuthUser {
  return jwt.verify(token, env.jwt.refreshSecret) as AuthUser;
}
