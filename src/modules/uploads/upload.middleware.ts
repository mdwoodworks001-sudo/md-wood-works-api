import multer from "multer";
import { AppError } from "../../common/errors/AppError.js";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new AppError("Only JPEG, PNG, WEBP or AVIF images are allowed", 400, "INVALID_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
});