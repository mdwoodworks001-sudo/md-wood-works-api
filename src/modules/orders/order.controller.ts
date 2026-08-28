import type { Request, Response } from "express";
import { OrderService } from "./order.service.js";
import { param } from "../../common/utils/params.js";

const service = new OrderService();

export class OrderController {
  async create(req: Request, res: Response) {
    const order = await service.create(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  }

  async myOrders(req: Request, res: Response) {
    const result = await service.getMyOrders(req.user!.id, {
      page: req.query["page"] as string | undefined,
      limit: req.query["limit"] as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  }

  async getById(req: Request, res: Response) {
    const order = await service.getById(param(req.params.id), req.user!);

    res.json({
      success: true,
      data: order,
    });
  }

  async cancel(req: Request, res: Response) {
    const order = await service.cancel(param(req.params.id), req.user!.id);

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  }

  async adminList(req: Request, res: Response) {
    const result = await service.adminList({
      page: req.query["page"] as string | undefined,
      limit: req.query["limit"] as string | undefined,
      status: req.query["status"] as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  }

  async updateStatus(req: Request, res: Response) {
    const order = await service.updateStatus(
      param(req.params.id),
      req.body.status,
      req.body.note,
      req.body.consignmentNumber,
      req.body.courierProvider,
    );

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  }
  async trackOrder(req: Request, res: Response) {
    const order = await service.getTracking(param(req.params.id), req.user!);
    res.json({ success: true, data: order });
  }

  async dashboardStats(_req: Request, res: Response) {
    const stats = await service.dashboardStats();

    res.json({
      success: true,
      data: stats,
    });
  }
}
