import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { adminMiddleware } from "../../common/middleware/admin.middleware.js";

const router = Router();
const controller = new DashboardController();

router.get(
  "/overview",
  authMiddleware,
  adminMiddleware,
  controller.overview.bind(controller),
);
router.get(
  "/orders-chart",
  authMiddleware,
  adminMiddleware,
  controller.ordersChart.bind(controller),
);

export default router;
