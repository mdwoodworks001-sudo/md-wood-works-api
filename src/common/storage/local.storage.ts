import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import type { StorageProvider, UploadResult } from "./storage.types.js";

const uploadDir = path.resolve(process.cwd(), env.uploadDir);

export class LocalStorageProvider implements StorageProvider {
  async upload(file: Express.Multer.File, folder = ""): Promise<UploadResult> {
    const dir = folder ? path.join(uploadDir, folder) : uploadDir;
    await fs.mkdir(dir, { recursive: true });

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const key = folder ? `${folder}/${filename}` : filename;

    await fs.writeFile(path.join(uploadDir, key), file.buffer);
    return { key, url: `/${env.uploadDir}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(path.join(uploadDir, key)).catch(() => void 0);
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/${env.uploadDir}/${key}`;
  }
}