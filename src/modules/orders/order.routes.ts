import { Router } from "express";
import { OrderController } from "./order.controller.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { adminMiddleware } from "../../common/middleware/admin.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "./order.validation.js";

const router = Router();
const controller = new OrderController();

router.post(
  "/",
  authMiddleware,
  validate({ body: createOrderSchema }),
  controller.create.bind(controller),
);

router.get("/my-orders", authMiddleware, controller.myOrders.bind(controller));

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  controller.adminList.bind(controller),
);

router.get(
  "/admin/dashboard-stats",
  authMiddleware,
  adminMiddleware,
  controller.dashboardStats.bind(controller),
);

router.patch(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  validate({ body: updateOrderStatusSchema }),
  controller.updateStatus.bind(controller),
);

router.get("/:id", authMiddleware, controller.getById.bind(controller));
router.get(
  "/:id/tracking",
  authMiddleware,
  controller.trackOrder.bind(controller),
);

router.patch("/:id/cancel", authMiddleware, controller.cancel.bind(controller));

export default router;
