import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";

const service = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await service.register(req.body);

    res.status(201).json({
      success: true,
      message: "Registered successfully",
      data: result,
    });
  }

  async login(req: Request, res: Response) {
    const result = await service.login(req.body);

    res.json({
      success: true,
      message: "Logged in successfully",
      data: result,
    });
  }

  async adminLogin(req: Request, res: Response) {
    const result = await service.adminLogin(req.body);

    res.json({
      success: true,
      message: "Logged in successfully",
      data: result,
    });
  }

  async refresh(req: Request, res: Response) {
    const result = await service.refresh(req.body.refreshToken);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  }

  async logout(req: Request, res: Response) {
    await service.logout(req.user!.id);

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
}
