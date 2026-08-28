import bcrypt from "bcryptjs";
import { UserModel } from "../users/user.model.js";
import { AppError } from "../../common/errors/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.js";
import type { AuthResponse, LoginInput, RegisterInput } from "./auth.types.js";

const SALT_ROUNDS = 12;

function toAuthResponse(
  user: { id: string; name: string; email: string; role: "user" | "admin" },
  accessToken: string,
  refreshToken: string,
): AuthResponse {
  return {
    accessToken,
    refreshToken,
    user,
  };
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await UserModel.findOne({ email: input.email });

    if (existing) {
      throw new AppError("Email already registered", 409, "EMAIL_TAKEN");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "user",
    });

    const payload = { id: user.id, role: user.role as "user" | "admin" };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await user.save();

    return toAuthResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "user" | "admin",
      },
      accessToken,
      refreshToken,
    );
  }

  private async authenticate(input: LoginInput, requireAdmin: boolean) {
    const user = await UserModel.findOne({ email: input.email }).select(
      "+passwordHash +refreshTokenHash",
    );

    if (!user || !user.isActive) {
      throw new AppError(
        "Invalid email or password",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);

    if (!valid) {
      throw new AppError(
        "Invalid email or password",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    if (requireAdmin && user.role !== "admin") {
      throw new AppError("Admin access required", 403, "FORBIDDEN");
    }

    const payload = { id: user.id, role: user.role as "user" | "admin" };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await user.save();

    return toAuthResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "user" | "admin",
      },
      accessToken,
      refreshToken,
    );
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    return this.authenticate(input, false);
  }

  async adminLogin(input: LoginInput): Promise<AuthResponse> {
    return this.authenticate(input, true);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(
        "Invalid or expired refresh token",
        401,
        "INVALID_TOKEN",
      );
    }

    const user = await UserModel.findById(payload.id).select(
      "+refreshTokenHash",
    );

    if (!user || !user.refreshTokenHash) {
      throw new AppError(
        "Invalid or expired refresh token",
        401,
        "INVALID_TOKEN",
      );
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!matches) {
      throw new AppError(
        "Invalid or expired refresh token",
        401,
        "INVALID_TOKEN",
      );
    }

    const newPayload = { id: user.id, role: user.role as "user" | "admin" };
    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
    await user.save();

    return toAuthResponse(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "user" | "admin",
      },
      accessToken,
      newRefreshToken,
    );
  }

  async logout(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $unset: { refreshTokenHash: 1 },
    });
  }
}
