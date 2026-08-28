import type { Request, Response } from "express";
import { AddressService } from "./address.service.js";
import { param } from "../../common/utils/params.js";

const service = new AddressService();

export class AddressController {
  async list(req: Request, res: Response) {
    const addresses = await service.list(req.user!.id);
    res.json({ success: true, data: addresses });
  }

  async create(req: Request, res: Response) {
    const address = await service.create(req.user!.id, req.body);
    res
      .status(201)
      .json({ success: true, message: "Address saved", data: address });
  }

  async setDefault(req: Request, res: Response) {
    const address = await service.setDefault(
      req.user!.id,
      param(req.params.id),
    );
    res.json({
      success: true,
      message: "Default address updated",
      data: address,
    });
  }

  async remove(req: Request, res: Response) {
    await service.remove(req.user!.id, param(req.params.id));
    res.json({ success: true, message: "Address removed" });
  }
}
