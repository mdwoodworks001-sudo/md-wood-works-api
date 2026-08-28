import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./auth.validation.js";

const router = Router();
const controller = new AuthController();

router.post(
  "/register",
  validate({ body: registerSchema }),
  controller.register.bind(controller),
);

router.post(
  "/login",
  validate({ body: loginSchema }),
  controller.login.bind(controller),
);

router.post(
  "/admin-login",
  validate({ body: loginSchema }),
  controller.adminLogin.bind(controller),
);

router.post(
  "/refresh",
  validate({ body: refreshSchema }),
  controller.refresh.bind(controller),
);

router.post("/logout", authMiddleware, controller.logout.bind(controller));

export default router;
