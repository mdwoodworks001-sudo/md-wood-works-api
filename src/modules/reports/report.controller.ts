import type { Request, Response } from "express";
import { ReportService } from "./report.service.js";
import { toCsv } from "../../common/utils/csv.js";

const service = new ReportService();

function respond(
  res: Response,
  rows: Record<string, unknown>[],
  format: unknown,
  filename: string,
) {
  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(toCsv(rows));
    return;
  }
  res.json({ success: true, data: rows });
}

export class ReportController {
  async orders(req: Request, res: Response) {
    const rows = await service.orders({
      status: req.query["status"] as string | undefined,
      from: req.query["from"] as string | undefined,
      to: req.query["to"] as string | undefined,
    });
    respond(res, rows, req.query["format"], "orders-report.csv");
  }

  async products(req: Request, res: Response) {
    const rows = await service.products();
    respond(res, rows, req.query["format"], "products-report.csv");
  }

  async users(req: Request, res: Response) {
    const rows = await service.users();
    respond(res, rows, req.query["format"], "users-report.csv");
  }

  async listUsers(req: Request, res: Response) {
    const result = await service.adminListUsers({
      page: req.query["page"] as string | undefined,
      limit: req.query["limit"] as string | undefined,
    });

    res.json({ success: true, data: result });
  }
}
