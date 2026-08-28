import { Router } from "express";
import { AddressController } from "./address.controller.js";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { identifyUser } from "../../common/middleware/identify-user.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import { addressSchema } from "./address.validation.js";

const router = Router();
const controller = new AddressController();

router.get("/", authMiddleware, identifyUser, controller.list.bind(controller));
router.post(
  "/",
  authMiddleware,
  identifyUser,
  validate({ body: addressSchema }),
  controller.create.bind(controller),
);
router.patch(
  "/:id/default",
  authMiddleware,
  identifyUser,
  controller.setDefault.bind(controller),
);
router.delete(
  "/:id",
  authMiddleware,
  identifyUser,
  controller.remove.bind(controller),
);

export default router;
