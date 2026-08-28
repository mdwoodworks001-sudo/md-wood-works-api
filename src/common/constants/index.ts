export const ORDER_STATUS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUS = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export const USER_ROLES = ["user", "admin"] as const;
