import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as presign } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import path from "node:path";
import { env } from "../../config/env.js";
import type { StorageProvider, UploadResult } from "./storage.types.js";

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.aws!.region,
      credentials: {
        accessKeyId: env.aws!.accessKeyId,
        secretAccessKey: env.aws!.secretAccessKey,
      },
    });
  }

  async upload(file: Express.Multer.File, folder = "uploads"): Promise<UploadResult> {
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: env.aws!.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = await this.getSignedUrl(key);
    return { key, url };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: env.aws!.bucket, Key: key }));
  }

  async getSignedUrl(key: string, expiresInSeconds = 60 * 60): Promise<string> {
    const command = new GetObjectCommand({ Bucket: env.aws!.bucket, Key: key });
    return presign(this.client, command, { expiresIn: expiresInSeconds });
  }
}