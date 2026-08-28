import type { Request, Response } from "express";
import { ProductService } from "./product.service.js";
import { env } from "../../config/env.js";
import { param } from "../../common/utils/params.js";

const service = new ProductService();
interface ProductFilter {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "popularity" | "priceAsc" | "priceDesc" | "rating" | "newest";
}

export class ProductController {
  async list(req: Request, res: Response) {
    const result = await service.list({
      page: Number(req.query["page"] ?? 1),
      limit: Number(req.query["limit"] ?? 20),
      category: req.query["category"] as string | undefined,
      search: req.query["search"] as string | undefined,
      sortBy: req.query["sortBy"] as ProductFilter["sortBy"] | undefined,
      minPrice:
        req.query["minPrice"] !== undefined
          ? Number(req.query["minPrice"])
          : undefined,
      maxPrice:
        req.query["maxPrice"] !== undefined
          ? Number(req.query["maxPrice"])
          : undefined,
      isFeatured:
        req.query["isFeatured"] === undefined
          ? undefined
          : req.query["isFeatured"] === "true",
      isActive:
        req.query["isActive"] === undefined
          ? undefined
          : req.query["isActive"] === "true",
    });
    res.json({ success: true, data: result });
  }

  async suggest(req: Request, res: Response) {
    const q = (req.query["q"] as string | undefined)?.trim();
    if (!q) {
      res.json({ success: true, data: [] });
      return;
    }
    const suggestions = await service.suggest(q);
    res.json({ success: true, data: suggestions });
  }

  async addReview(req: Request, res: Response) {
    const product = await service.addReview(
      param(req.params.id),
      req.user!.id,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: product,
    });
  }

  async getById(req: Request, res: Response) {
    const product = await service.getById(param(req.params.id));

    res.json({
      success: true,
      data: product,
    });
  }

  async getBySlug(req: Request, res: Response) {
    const product = await service.getBySlug(param(req.params.slug));

    res.json({
      success: true,
      data: product,
    });
  }

  async removeImage(req: Request, res: Response) {
    const product = await service.removeImage(
      param(req.params.id),
      req.body.imageUrl,
    );
    res.json({ success: true, message: "Image removed", data: product });
  }

  async featured(_req: Request, res: Response) {
    const products = await service.getFeatured();

    res.json({
      success: true,
      data: products,
    });
  }

  async categories(_req: Request, res: Response) {
    const categories = await service.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  }

  async create(req: Request, res: Response) {
    const product = await service.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  }

  async update(req: Request, res: Response) {
    const product = await service.update(param(req.params.id), req.body);

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  }

  async delete(req: Request, res: Response) {
    await service.delete(param(req.params.id));

    res.status(204).send();
  }

  async uploadImages(req: Request, res: Response) {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    const imageUrls = files.map((file) => `/${env.uploadDir}/${file.filename}`);

    const product = await service.addImages(param(req.params.id), imageUrls);

    res.json({
      success: true,
      message: "Images uploaded successfully",
      data: product,
    });
  }
}
