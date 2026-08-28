import { AddressModel } from "./address.model.js";
import { AppError } from "../../common/errors/AppError.js";
import type { AddressInput } from "./address.types.js";

export class AddressService {
  async list(userId: string | undefined) {
    if (!userId)
      throw new AppError("User not authenticated", 401, "UNAUTHORIZED");
    return AddressModel.find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
  }

  async create(userId: string | undefined, input: AddressInput) {
    if (!userId)
      throw new AppError("User not authenticated", 401, "UNAUTHORIZED");

    const existingCount = await AddressModel.countDocuments({ user: userId });
    const makeDefault = input.isDefault || existingCount === 0;

    if (makeDefault) {
      await AddressModel.updateMany(
        { user: userId },
        { $set: { isDefault: false } },
      );
    }

    return AddressModel.create({
      ...input,
      user: userId,
      isDefault: makeDefault,
    });
  }

  async setDefault(userId: string | undefined, addressId: string) {
    if (!userId)
      throw new AppError("User not authenticated", 401, "UNAUTHORIZED");

    const address = await AddressModel.findOne({
      _id: addressId,
      user: userId,
    });
    if (!address)
      throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");

    await AddressModel.updateMany(
      { user: userId },
      { $set: { isDefault: false } },
    );
    address.isDefault = true;
    await address.save();

    return address;
  }

  async remove(userId: string | undefined, addressId: string) {
    if (!userId)
      throw new AppError("User not authenticated", 401, "UNAUTHORIZED");

    const address = await AddressModel.findOneAndDelete({
      _id: addressId,
      user: userId,
    });
    if (!address)
      throw new AppError("Address not found", 404, "ADDRESS_NOT_FOUND");

    if (address.isDefault) {
      const next = await AddressModel.findOne({ user: userId }).sort({
        createdAt: -1,
      });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }
  }
}
