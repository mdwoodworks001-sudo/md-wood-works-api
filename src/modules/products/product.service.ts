import { ProductModel } from "./product.model.js";
import { AppError } from "../../common/errors/AppError.js";
import { slugify } from "../../common/utils/slug.js";
import { UserModel } from "../users/user.model.js";
import { CategoryModel } from "../categories/category.model.js";
import { socketEvents } from "../../socket/socket.js";

interface ProductFilter {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "popularity" | "priceAsc" | "priceDesc" | "rating" | "newest";
}

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  popularity: { reviewCount: -1, createdAt: -1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
  rating: { rating: -1 },
  newest: { createdAt: -1 },
};
export class ProductService {
  async list(filter: ProductFilter) {
    const page = Math.max(filter.page ?? 1, 1);
    const limit = Math.min(filter.limit ?? 20, 100);

    const query: Record<string, unknown> = {};

    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.isFeatured !== undefined) {
      query.isFeatured = filter.isFeatured;
    }
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    if (filter.search) {
      const escaped = filter.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [{ name: regex }, { description: regex }];
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      const priceQuery: Record<string, number> = {};
      if (filter.minPrice !== undefined) priceQuery.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) priceQuery.$lte = filter.maxPrice;
      query.price = priceQuery;
    }

    const sort =
      SORT_MAP[filter.sortBy ?? "popularity"] ?? SORT_MAP["popularity"];

    const [items, total] = await Promise.all([
      ProductModel.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const product = await ProductModel.findById(id).lean();

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    return product;
  }

  async getFeatured() {
    return ProductModel.find({ isFeatured: true, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getBySlug(slug: string) {
    const product = await ProductModel.findOne({ slug, isActive: true }).lean();
    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }
    return product;
  }

  async suggest(term: string) {
    const regex = new RegExp(
      term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    return ProductModel.find({
      isActive: true,
      name: regex,
    })
      .select("name slug images price category")
      .limit(8)
      .lean();
  }

  async addReview(
    id: string,
    userId: string,
    payload: { rating: number; comment: string },
  ) {
    const product = await ProductModel.findById(id);

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    const alreadyReviewed = product.reviews.some(
      (r) => r.user.toString() === userId,
    );
    if (alreadyReviewed) {
      throw new AppError(
        "You have already reviewed this product",
        409,
        "ALREADY_REVIEWED",
      );
    }

    const user = await UserModel.findById(userId).select("name").lean();
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    product.reviews.push({
      user: userId,
      userName: user.name,
      rating: payload.rating,
      comment: payload.comment,
    } as any);

    product.reviewCount = product.reviews.length;
    product.rating =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.reviews.length;

    await product.save();
    return product;
  }
  async removeImage(id: string, imageUrl: string) {
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $pull: { images: imageUrl } },
      { new: true },
    );

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }
    socketEvents.productChanged("updated", product);
    return product;
  }

  async getCategories() {
    const activeCategoryNames = await CategoryModel.distinct("name", {
      isActive: true,
    });
    return ProductModel.distinct("category", {
      category: { $in: activeCategoryNames },
    });
  }

  async create(payload: any) {
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);
    const product = await ProductModel.create({
      ...payload,
      slug,
      initialStock: payload.stock ?? 0,
    });
    socketEvents.productChanged("created", product);
    return product;
  }

  async update(id: string, payload: any) {
    const update = { ...payload };
    if (update.slug) update.slug = slugify(update.slug);
    const { initialStock, ...safePayload } = payload;
    const product = await ProductModel.findByIdAndUpdate(id, safePayload, {
      new: true,
      runValidators: true,
    });
    if (!product)
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    socketEvents.productChanged("updated", product);
    return product;
  }

  async delete(id: string) {
    const product = await ProductModel.findByIdAndDelete(id);
    if (!product)
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    socketEvents.productChanged("deleted", product);
  }

  async addImages(id: string, imageUrls: string[]) {
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $push: { images: { $each: imageUrls } } },
      { new: true },
    );

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }
    socketEvents.productChanged("updated", product);
    return product;
  }

  async adjustStock(id: string, delta: number) {
    const product = await ProductModel.findById(id);

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    if (product.stock + delta < 0) {
      throw new AppError("Insufficient stock", 409, "INSUFFICIENT_STOCK");
    }

    product.stock += delta;
    await product.save();

    return product;
  }
}
