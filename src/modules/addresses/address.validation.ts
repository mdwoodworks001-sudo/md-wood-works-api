import { z } from "zod";

export const addressSchema = z
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
    isDefault: z.boolean().optional(),
  })
  .refine((data) => data.postalCode ?? data.pincode, {
    message: "postalCode (or pincode) is required",
    path: ["postalCode"],
  })
  .transform((data) => ({
    ...data,
    postalCode: (data.postalCode ?? data.pincode)!,
  }));
