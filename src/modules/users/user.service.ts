import { UserModel } from "./user.model.js";
import { AppError } from "../../common/errors/AppError.js";
import {
  resolvePagination,
  buildPaginatedResponse,
} from "../../common/utils/pagination.js";

export class UserService {
  async getById(id: string) {
    const user = await UserModel.findById(id);

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return user;
  }

  async list(query: { page?: string; limit?: string }) {
    const { page, limit, skip } = resolvePagination(query);

    const [items, total] = await Promise.all([
      UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserModel.countDocuments(),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async setActive(id: string, isActive: boolean) {
    const user = await UserModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return user;
  }
}
