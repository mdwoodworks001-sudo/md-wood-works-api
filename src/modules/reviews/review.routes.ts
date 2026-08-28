import { Router } from "express";
import { ReviewController } from "./review.controller.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import { createReviewSchema, updateReviewSchema } from "./review.validation.js";

const router = Router();
const controller = new ReviewController();

router.post(
  "/",
  authMiddleware,
  validate({ body: createReviewSchema }),
  controller.create.bind(controller),
);

router.get("/product/:productId", controller.listForProduct.bind(controller));

router.put(
  "/:id",
  authMiddleware,
  validate({ body: updateReviewSchema }),
  controller.update.bind(controller),
);

router.delete("/:id", authMiddleware, controller.delete.bind(controller));

export default router;
