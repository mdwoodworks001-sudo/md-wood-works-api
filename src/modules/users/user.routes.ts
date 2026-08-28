import { Router } from "express";
import { UserController } from "./user.controller.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { adminMiddleware } from "../../common/middleware/admin.middleware.js";

const router = Router();
const controller = new UserController();

router.get("/me", authMiddleware, controller.me.bind(controller));

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  controller.list.bind(controller),
);

router.patch(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  controller.setActive.bind(controller),
);

export default router;
