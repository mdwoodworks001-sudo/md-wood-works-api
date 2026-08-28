import { z } from "zod";

const shippingAddressSchema = z
  .object({
    fullName: z.string().trim().min(2),
    phone: z.string().trim().min(6),
    line1: z.string().trim().min(3),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    postalCode: z.string().trim().min(3).optional(),
    pincode: z.string().trim().min(3).optional(),
    country: z.string().trim().min(2).default("India"),
  })
  .refine((data) => data.postalCode ?? data.pincode, {
    message: "postalCode (or pincode) is required",
    path: ["postalCode"],
  })
  .transform((data) => ({
    ...data,
    postalCode: (data.postalCode ?? data.pincode)!,
  }));

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string().trim().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["COD", "ONLINE"]).default("COD"),
});

export const updateOrderStatusSchema = z
  .object({
    status: z.enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    consignmentNumber: z.string().trim().min(4).optional(),
    courierProvider: z.enum(["INDIA_POST", "SPEED_POST"]).optional(),
    note: z.string().trim().optional(),
  })
  .refine((data) => data.status !== "shipped" || !!data.consignmentNumber, {
    message: "consignmentNumber is required when marking an order as shipped",
    path: ["consignmentNumber"],
  });
