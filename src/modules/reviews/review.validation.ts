import { z } from "zod";

export const createReviewSchema = z.object({
  product: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(3).max(1000).optional(),
});
