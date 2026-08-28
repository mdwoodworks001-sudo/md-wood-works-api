import { CategoryModel } from "./category.model.js";
import { ProductModel } from "../products/product.model.js";
import { AppError } from "../../common/errors/AppError.js";
import { slugify } from "../../common/utils/slug.js";
import { socketEvents } from "../../socket/socket.js";
import { getStorageProvider } from "../../common/storage/storage.factory.js";

export class CategoryService {
  async list() {
    return CategoryModel.find({
      isActive: true,
      name: { $not: /^custom$/i },
    })
      .sort({ name: 1 })
      .lean();
  }
  async adminList() {
    return CategoryModel.find().sort({ name: 1 }).lean();
  }

  
  async create(payload: any) {
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);
    const category = await CategoryModel.create({ ...payload, slug });
    socketEvents.categoryChanged("created", category);
    return category;
  }
  

async setImage(id: string, imageKey: string) {
  const category = await CategoryModel.findByIdAndUpdate(id, { image: imageKey }, { new: true });
  if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  socketEvents.categoryChanged("updated", category);
  const url = await getStorageProvider().getSignedUrl(imageKey);
  return { ...category.toObject(), image: url };
}

  async update(id: string, payload: any) {
    const existing = await CategoryModel.findById(id);
    if (!existing) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }

    const update = { ...payload };
    if (update.slug) {
      update.slug = slugify(update.slug);
    }

    const category = await CategoryModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }

    if (existing.isActive && category.isActive === false) {
      await ProductModel.updateMany(
        { category: existing.name },
        { $set: { isActive: false } },
      );
    }
    socketEvents.categoryChanged("updated", category);
    return category;
  }

  async delete(id: string) {
    const category = await CategoryModel.findByIdAndDelete(id);
    if (!category) {
      throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    }
    await ProductModel.updateMany(
      { category: category.name },
      { $set: { isActive: false } },
    );
    socketEvents.categoryChanged("updated", category);
  }
}
