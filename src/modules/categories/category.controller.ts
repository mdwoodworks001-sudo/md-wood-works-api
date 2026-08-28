import type { Request, Response } from "express";
import { CategoryService } from "./category.service.js";
import { param } from "../../common/utils/params.js";
import { env } from "../../config/env.js";

const service = new CategoryService();

export class CategoryController {
  async list(_req: Request, res: Response) {
    const categories = await service.list();

    res.json({
      success: true,
      data: categories,
    });
  }

  async adminList(_req: Request, res: Response) {
    const categories = await service.adminList();

    res.json({
      success: true,
      data: categories,
    });
  }

  async uploadImage(req: Request, res: Response) {
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      res
        .status(400)
        .json({
          success: false,
          message: "Image is required",
          code: "IMAGE_REQUIRED",
        });
      return;
    }
    const imageUrl = `/${env.uploadDir}/${file.filename}`;
    const category = await service.setImage(param(req.params.id), imageUrl);
    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: category,
    });
  }

  async create(req: Request, res: Response) {
    const category = await service.create(req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  }

  async update(req: Request, res: Response) {
    const category = await service.update(param(req.params.id), req.body);

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  }

  async delete(req: Request, res: Response) {
    await service.delete(param(req.params.id));

    res.status(204).send();
  }
}
