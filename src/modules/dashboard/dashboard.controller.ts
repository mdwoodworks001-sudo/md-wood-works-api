import type { Request, Response } from "express";
import { DashboardService } from "./dashboard.service.js";

const service = new DashboardService();

export class DashboardController {
  async overview(_req: Request, res: Response) {
    const data = await service.getOverview();
    res.json({ success: true, data });
  }

  async ordersChart(req: Request, res: Response) {
    const days = Number(req.query["days"] ?? 14);
    const data = await service.getOrdersChart(days);
    res.json({ success: true, data });
  }
}
