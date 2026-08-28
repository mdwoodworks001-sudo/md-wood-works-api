import { Router } from "express";
import { ProductController } from "./product.controller.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { adminMiddleware } from "../../common/middleware/admin.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
} from "./product.validation.js";
import { uploadImages } from "../uploads/upload.middleware.js";
import { addReviewSchema } from "./product.validation.js";

const router = Router();
const controller = new ProductController();

router.get("/", controller.list.bind(controller));
router.get("/featured", controller.featured.bind(controller));
router.get("/categories", controller.categories.bind(controller));
router.get("/suggest", controller.suggest.bind(controller));
router.get("/slug/:slug", controller.getBySlug.bind(controller));
router.get("/:id", controller.getById.bind(controller));

router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  validate({ body: createProductSchema }),
  controller.create.bind(controller),
);

router.put(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  validate({ body: updateProductSchema }),
  controller.update.bind(controller),
);

router.delete(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  controller.delete.bind(controller),
);

router.post(
  "/admin/:id/images",
  authMiddleware,
  adminMiddleware,
  uploadImages.array("images", 6),
  controller.uploadImages.bind(controller),
);

router.patch(
  "/admin/:id/images/remove",
  authMiddleware,
  adminMiddleware,
  controller.removeImage.bind(controller),
);

router.post(
  "/:id/reviews",
  authMiddleware,
  validate({ body: addReviewSchema }),
  controller.addReview.bind(controller),
);

export default router;
