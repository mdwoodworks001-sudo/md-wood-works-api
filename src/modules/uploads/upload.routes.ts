import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware.js";
import { adminMiddleware } from "../../common/middleware/admin.middleware.js";
import { uploadImages } from "./upload.middleware.js";
import { env } from "../../config/env.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  uploadImages.array("files", 6),
  (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    const urls = files.map((file) => `/${env.uploadDir}/${file.filename}`);

    res.status(201).json({
      success: true,
      message: "Files uploaded successfully",
      data: { urls },
    });
  },
);

export default router;
