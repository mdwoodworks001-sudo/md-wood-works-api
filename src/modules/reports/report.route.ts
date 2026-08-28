import { Router } from "express";
import { ReportController } from "./report.controller.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { adminMiddleware } from "../../common/middleware/admin.middleware.js";

const router = Router();
const controller = new ReportController();

router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  controller.orders.bind(controller),
);
router.get(
  "/products",
  authMiddleware,
  adminMiddleware,
  controller.products.bind(controller),
);
router.get(
  "/users/list",
  authMiddleware,
  adminMiddleware,
  controller.listUsers.bind(controller),
);
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  controller.users.bind(controller),
);

export default router;
