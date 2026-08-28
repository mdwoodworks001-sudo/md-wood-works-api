// import "dotenv/config";

// function required(name: string): string {
//   const value = process.env[name];

//   if (!value) {
//     throw new Error(`Missing environment variable: ${name}`);
//   }

//   return value;
// }

// export const env = {
//   nodeEnv: process.env.NODE_ENV ?? "development",

//   port: Number(process.env.PORT ?? 5000),

//   mongodbUri: required("MONGODB_URI"),

//   jwt: {
//     accessSecret: required("JWT_ACCESS_SECRET"),
//     refreshSecret: required("JWT_REFRESH_SECRET"),
//     accessExpires: process.env.JWT_ACCESS_EXPIRES ?? "7d",
//     refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "7d",
//   },

//   frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:4200",

//   uploadDir: process.env.UPLOAD_DIR ?? "uploads",

//   aws: {
//     accessKeyId: required("AWS_ACCESS_KEY_ID"),
//     secretAccessKey: required("AWS_SECRET_ACCESS_KEY"),
//     region: required("AWS_REGION"),
//     bucketName: required("AWS_BUCKET_NAME"),
//     signedUrlExpirySeconds: Number(process.env.AWS_SIGNED_URL_EXPIRY ?? 3600),
//   },
// } as const;
import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const storageDriver = (process.env.STORAGE_DRIVER ?? "local") as "local" | "s3";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  mongodbUri: required("MONGODB_URI"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? "7d",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  },

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:4200",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",

  storageDriver,
  aws:
    storageDriver === "s3"
      ? {
          accessKeyId: required("AWS_ACCESS_KEY_ID"),
          secretAccessKey: required("AWS_SECRET_ACCESS_KEY"),
          region: required("AWS_REGION"),
          bucket: required("AWS_BUCKET_NAME"),
        }
      : undefined,
} as const;