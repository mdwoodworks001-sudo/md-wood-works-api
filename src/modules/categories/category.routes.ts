import { Router } from "express";
import { CategoryController } from "./category.controller.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { adminMiddleware } from "../../common/middleware/admin.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation.js";
import { uploadImages } from "../uploads/upload.middleware.js";

const router = Router();
const controller = new CategoryController();

router.get("/", controller.list.bind(controller));

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  controller.adminList.bind(controller),
);

router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  validate({ body: createCategorySchema }),
  controller.create.bind(controller),
);

router.post(
  "/admin/:id/image",
  authMiddleware,
  adminMiddleware,
  uploadImages.single("image"),
  controller.uploadImage.bind(controller),
);

router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  validate({ body: updateCategorySchema }),
  controller.update.bind(controller),
);

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  controller.delete.bind(controller),
);

export default router;
