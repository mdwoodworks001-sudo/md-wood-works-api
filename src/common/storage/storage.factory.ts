import { env } from "../../config/env.js";
import { LocalStorageProvider } from "./local.storage.js";
import { S3StorageProvider } from "./s3.storage.js";
import type { StorageProvider } from "./storage.types.js";

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!instance) {
    instance = env.storageDriver === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
  }
  return instance;
}