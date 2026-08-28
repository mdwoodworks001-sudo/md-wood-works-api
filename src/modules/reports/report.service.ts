import { OrderModel } from "../orders/order.model.js";
import { ProductModel } from "../products/product.model.js";
import { UserModel } from "../users/user.model.js";
import { AddressModel } from "../addresses/address.model.js";
import {
  resolvePagination,
  buildPaginatedResponse,
} from "../../common/utils/pagination.js";

export class ReportService {
  async orders(filter: { status?: string; from?: string; to?: string }) {
    const query: Record<string, unknown> = {};
    if (filter.status) query.orderStatus = filter.status;
    if (filter.from || filter.to) {
      query.createdAt = {
        ...(filter.from ? { $gte: new Date(filter.from) } : {}),
        ...(filter.to ? { $lte: new Date(filter.to) } : {}),
      };
    }

    const orders = await OrderModel.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return orders.map((o) => ({
      orderId: o._id.toString(),
      customerName: (o.user as any)?.name ?? "",
      customerEmail: (o.user as any)?.email ?? "",
      items: o.items.length,
      subtotal: o.subtotal,
      shippingFee: o.shippingFee,
      discount: o.discount,
      total: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      placedAt: o.createdAt,
    }));
  }

  async products() {
    const products = await ProductModel.find().sort({ name: 1 }).lean();
    return products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      category: p.category,
      price: p.price,
      mrp: p.mrp,
      stock: p.stock,
      initialStock: p.initialStock,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      rating: p.rating,
      reviewCount: p.reviewCount,
    }));
  }

  async users() {
    const users = await UserModel.find({ role: "user" })
      .sort({ createdAt: -1 })
      .lean();
    return users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      joinedAt: u.createdAt,
    }));
  }

  async adminListUsers(query: { page?: string; limit?: string }) {
    const { page, limit, skip } = resolvePagination(query);

    const filter = { role: { $ne: "admin" } };

    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .select("name email isActive createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    const userIds = items.map((u) => u._id);
    const addresses = await AddressModel.find({ user: { $in: userIds } })
      .select(
        "user fullName phone line1 line2 city state postalCode country isDefault",
      )
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    const addressesByUser = new Map<string, typeof addresses>();
    for (const addr of addresses) {
      const key = addr.user.toString();
      if (!addressesByUser.has(key)) addressesByUser.set(key, []);
      addressesByUser.get(key)!.push(addr);
    }

    const itemsWithAddresses = items.map((u) => ({
      ...u,
      addresses: addressesByUser.get(u._id.toString()) ?? [],
    }));

    return buildPaginatedResponse(itemsWithAddresses, total, page, limit);
  }
}
