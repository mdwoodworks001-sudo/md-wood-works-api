import type { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { param } from "../../common/utils/params.js";

const service = new UserService();

export class UserController {
  async me(req: Request, res: Response) {
    const user = await service.getById(req.user!.id);

    res.json({
      success: true,
      data: user,
    });
  }

  async list(req: Request, res: Response) {
    const result = await service.list({
      page: req.query["page"] as string | undefined,
      limit: req.query["limit"] as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  }

  async setActive(req: Request, res: Response) {
    const user = await service.setActive(
      param(req.params.id),
      Boolean(req.body.isActive),
    );

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  }
}
