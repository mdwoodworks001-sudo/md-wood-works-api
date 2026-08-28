// import crypto from "node:crypto";
// import path from "node:path";
// import {
//   PutObjectCommand,
//   DeleteObjectCommand,
//   GetObjectCommand,
// } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { s3Client } from "../../config/s3.js";
// import { env } from "../../config/env.js";

// export function buildS3Key(prefix: string, originalName: string): string {
//   const ext = path.extname(originalName).toLowerCase();
//   const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
//   return `${prefix}/${unique}`;
// }

// export async function uploadBufferToS3(
//   buffer: Buffer,
//   key: string,
//   mimetype: string,
// ): Promise<void> {
//   await s3Client.send(
//     new PutObjectCommand({
//       Bucket: env.aws.bucketName,
//       Key: key,
//       Body: buffer,
//       ContentType: mimetype,
//     }),
//   );
// }

// export async function deleteFromS3(key: string): Promise<void> {
//   await s3Client.send(
//     new DeleteObjectCommand({ Bucket: env.aws.bucketName, Key: key }),
//   );
// }

// export async function getSignedImageUrl(
//   key: string | null | undefined,
// ): Promise<string | null> {
//   if (!key) return null;
//   if (key.startsWith("/") || /^https?:\/\//i.test(key)) return key;

//   const command = new GetObjectCommand({ Bucket: env.aws.bucketName, Key: key });
//   return getSignedUrl(s3Client, command, {
//     expiresIn: env.aws.signedUrlExpirySeconds,
//   });
// }

// export async function signMany(
//   keys: (string | null | undefined)[],
// ): Promise<(string | null)[]> {
//   return Promise.all(keys.map((k) => getSignedImageUrl(k)));
// }

// export function extractS3Key(urlOrKey: string): string {
//   if (!/^https?:\/\//i.test(urlOrKey)) return urlOrKey; 
//   const { pathname } = new URL(urlOrKey);
//   return decodeURIComponent(pathname.replace(/^\/+/, ""));
// }