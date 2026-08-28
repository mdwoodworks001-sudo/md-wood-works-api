import { z } from "zod";

const specificationSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().optional(),
  brand: z.string().trim().max(100).optional(),
  description: z.string().trim().min(10),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  images: z.array(z.string()).optional(),
  category: z.string().trim().min(1),
  stock: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  features: z.array(z.string().trim().min(1)).optional(),
  highlights: z.array(z.string().trim().min(1)).optional(),
  specifications: z.array(specificationSchema).optional(),
  initialStock: z.number().int().nonnegative().optional(),
});

export const addReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
});

export const updateProductSchema = createProductSchema.partial();
