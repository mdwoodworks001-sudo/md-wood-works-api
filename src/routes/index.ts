import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import productRoutes from "../modules/products/product.routes.js";
import orderRoutes from "../modules/orders/order.routes.js";
import reviewRoutes from "../modules/reviews/review.routes.js";
import categoryRoutes from "../modules/categories/category.routes.js";
import uploadRoutes from "../modules/uploads/upload.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import addressRoutes from "../modules/addresses/address.routes.js";
import reportsRoutes from "../modules/reports/report.route.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "MD Wood Works API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/categories", categoryRoutes);
router.use("/uploads", uploadRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/addresses", addressRoutes);
router.use("/reports", reportsRoutes);

export default router;
