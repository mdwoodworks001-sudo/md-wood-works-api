import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

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
} as const;
