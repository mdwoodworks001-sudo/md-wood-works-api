import mongoose from "mongoose";
import { ProductModel } from "../products/product.model.js";
import { AppError } from "../../common/errors/AppError.js";

interface CreateReviewInput {
  product: string;
  rating: number;
  comment: string;
}

function recalculateRating(reviews: { rating: number }[]) {
  const reviewCount = reviews.length;
  const rating = reviewCount
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;

  return { rating: Math.round(rating * 10) / 10, reviewCount };
}

export class ReviewService {
  async create(userId: string, userName: string, input: CreateReviewInput) {
    const product = await ProductModel.findById(input.product);

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    const alreadyReviewed = product.reviews.some(
      (review) => review.user.toString() === userId,
    );

    if (alreadyReviewed) {
      throw new AppError(
        "You have already reviewed this product",
        409,
        "ALREADY_REVIEWED",
      );
    }

    product.reviews.push({
      user: new mongoose.Types.ObjectId(userId),
      userName,
      rating: input.rating,
      comment: input.comment,
    } as any);

    const { rating, reviewCount } = recalculateRating(product.reviews as any);
    product.rating = rating;
    product.reviewCount = reviewCount;

    await product.save();

    return product.reviews[product.reviews.length - 1];
  }

  async listForProduct(productId: string) {
    const product = await ProductModel.findById(productId)
      .select("reviews")
      .lean();

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    return product.reviews;
  }

  async update(
    productId: string,
    reviewId: string,
    userId: string,
    input: { rating?: number; comment?: string },
  ) {
    const product = await ProductModel.findById(productId);

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    const review = (product.reviews as any).id(reviewId);

    if (!review) {
      throw new AppError("Review not found", 404, "REVIEW_NOT_FOUND");
    }

    if (review.user.toString() !== userId) {
      throw new AppError("You can only edit your own review", 403, "FORBIDDEN");
    }

    if (input.rating !== undefined) review.rating = input.rating;
    if (input.comment !== undefined) review.comment = input.comment;

    const { rating, reviewCount } = recalculateRating(product.reviews as any);
    product.rating = rating;
    product.reviewCount = reviewCount;

    await product.save();

    return review;
  }

  async delete(
    productId: string,
    reviewId: string,
    requester: { id: string; role: "user" | "admin" },
  ) {
    const product = await ProductModel.findById(productId);

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    const review = (product.reviews as any).id(reviewId);

    if (!review) {
      throw new AppError("Review not found", 404, "REVIEW_NOT_FOUND");
    }

    if (requester.role !== "admin" && review.user.toString() !== requester.id) {
      throw new AppError(
        "You can only delete your own review",
        403,
        "FORBIDDEN",
      );
    }

    review.deleteOne();

    const { rating, reviewCount } = recalculateRating(product.reviews as any);
    product.rating = rating;
    product.reviewCount = reviewCount;

    await product.save();
  }
}
