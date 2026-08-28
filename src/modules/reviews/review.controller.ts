import type { Request, Response } from "express";
import { ReviewService } from "./review.service.js";
import { param } from "../../common/utils/params.js";

const service = new ReviewService();

export class ReviewController {
  async create(req: Request, res: Response) {
    const review = await service.create(
      req.user!.id,
      req.body.userName ?? "Anonymous",
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  }

  async listForProduct(req: Request, res: Response) {
    const reviews = await service.listForProduct(param(req.params.productId));

    res.json({
      success: true,
      data: reviews,
    });
  }

  async update(req: Request, res: Response) {
    const productId = (req.query["product"] as string) ?? req.body.product;

    const review = await service.update(
      productId,
      param(req.params.id),
      req.user!.id,
      req.body,
    );

    res.json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  }

  async delete(req: Request, res: Response) {
    const productId = (req.query["product"] as string) ?? req.body?.product;

    await service.delete(productId, param(req.params.id), req.user!);

    res.status(204).send();
  }
}
