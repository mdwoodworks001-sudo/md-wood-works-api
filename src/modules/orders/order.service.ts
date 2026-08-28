import mongoose from "mongoose";
import { OrderModel } from "./order.model.js";
import { ProductModel } from "../products/product.model.js";
import { AppError } from "../../common/errors/AppError.js";
import {
  resolvePagination,
  buildPaginatedResponse,
} from "../../common/utils/pagination.js";
import type { CreateOrderInput } from "./order.types.js";
import { SpeedPostProvider } from "./tracking/speed-post.provider.js";
import { socketEvents } from "../../socket/socket.js";

const SHIPPING_FEE = 0;
const courierProvider = new SpeedPostProvider();
export class OrderService {
  async create(userId: string, input: CreateOrderInput) {
    const session = await mongoose.startSession();

    try {
      let createdOrder;

      await session.withTransaction(async () => {
        const productIds = input.items.map((item) => item.product);

        const products = await ProductModel.find({
          _id: { $in: productIds },
        }).session(session);

        const productMap = new Map(
          products.map((product) => [product.id, product]),
        );

        const orderItems = input.items.map((item) => {
          const product = productMap.get(item.product);

          if (!product) {
            throw new AppError(
              `Product ${item.product} not found`,
              404,
              "PRODUCT_NOT_FOUND",
            );
          }

          if (product.stock < item.quantity) {
            throw new AppError(
              `Insufficient stock for ${product.name}`,
              409,
              "INSUFFICIENT_STOCK",
            );
          }

          const subtotal = product.price * item.quantity;

          return {
            product: product.id,
            name: product.name,
            image: product.images?.[0],
            price: product.price,
            quantity: item.quantity,
            subtotal,
          };
        });

        const subtotal = orderItems.reduce(
          (sum, item) => sum + item.subtotal,
          0,
        );
        const total = subtotal + SHIPPING_FEE;

        const [order] = await OrderModel.create(
          [
            {
              user: userId,
              items: orderItems,
              shippingAddress: input.shippingAddress,
              subtotal,
              shippingFee: SHIPPING_FEE,
              discount: 0,
              total,
              paymentMethod: input.paymentMethod,
              paymentStatus: "pending",
              orderStatus: "pending",
              trackingHistory: [
                { status: "pending", changedAt: new Date(), source: "SYSTEM" },
              ],
            },
          ],
          { session },
        );

        for (const item of orderItems) {
          await ProductModel.updateOne(
            { _id: item.product },
            { $inc: { stock: -item.quantity } },
            { session },
          );
        }

        createdOrder = order;
      });
      socketEvents.newOrder(createdOrder);
      return createdOrder;
    } finally {
      await session.endSession();
    }
  }

  async getTracking(
    id: string,
    requester: { id: string; role: "user" | "admin" },
  ) {
    const order = await OrderModel.findById(id);

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    if (requester.role !== "admin" && order.user.toString() !== requester.id) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    return order;
  }

  async syncTracking(orderId: string) {
    const order = await OrderModel.findById(orderId);
    if (
      !order?.consignmentNumber ||
      order.orderStatus === "delivered" ||
      order.orderStatus === "cancelled"
    ) {
      return;
    }

    const events = await courierProvider.track(order.consignmentNumber);
    const seen = new Set(
      order.trackingHistory.map((e) => `${e.status}|${e.changedAt.getTime()}`),
    );

    let becameDelivered = false;

    for (const event of events) {
      const mapped = courierProvider.mapStatus(event.status);
      const key = `${mapped ?? event.status}|${event.timestamp.getTime()}`;
      if (seen.has(key)) continue;

      order.trackingHistory.push({
        status: (mapped ?? order.orderStatus) as typeof order.orderStatus,
        location: event.location,
        note: event.description,
        changedAt: event.timestamp,
        source: "COURIER",
      });

      if (mapped === "delivered") becameDelivered = true;
    }

    if (becameDelivered) {
      order.orderStatus = "delivered";
      order.paymentStatus = "paid";
    }
    order.lastTrackedAt = new Date();
    await order.save();
    socketEvents.orderUpdated(order);
  }

  async findShippedWithConsignment() {
    return OrderModel.find({
      orderStatus: "shipped",
      consignmentNumber: { $exists: true },
    });
  }

  async getMyOrders(userId: string, query: { page?: string; limit?: string }) {
    const { page, limit, skip } = resolvePagination(query);

    const [items, total] = await Promise.all([
      OrderModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments({ user: userId }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async getById(id: string, requester: { id: string; role: "user" | "admin" }) {
    const order = await OrderModel.findById(id).lean();

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    if (requester.role !== "admin" && order.user.toString() !== requester.id) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    return order;
  }

  async cancel(id: string, userId: string) {
    const order = await OrderModel.findOne({ _id: id, user: userId });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
      throw new AppError(
        `Order cannot be cancelled once it is ${order.orderStatus}`,
        409,
        "ORDER_NOT_CANCELLABLE",
      );
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        order.orderStatus = "cancelled";
        order.trackingHistory.push({
          status: "cancelled",
          changedAt: new Date(),
          source: "SYSTEM",
        });
        await order.save({ session });

        for (const item of order.items) {
          await ProductModel.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session },
          );
        }
      });
    } finally {
      await session.endSession();
    }

    return order;
  }

  async adminList(query: { page?: string; limit?: string; status?: string }) {
    const { page, limit, skip } = resolvePagination(query);

    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.orderStatus = query.status;
    }

    const [items, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      OrderModel.countDocuments(filter),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async updateStatus(
    id: string,
    status: string,
    note?: string,
    consignmentNumber?: string,
    courierProviderName?: "INDIA_POST" | "SPEED_POST",
  ) {
    const order = await OrderModel.findById(id);

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    order.orderStatus = status as typeof order.orderStatus;

    if (consignmentNumber) {
      order.consignmentNumber = consignmentNumber;
      order.courierProvider =
        courierProviderName ?? order.courierProvider ?? "SPEED_POST";
    }

    order.trackingHistory.push({
      status: status as typeof order.orderStatus,
      changedAt: new Date(),
      note,
      source: "SYSTEM",
    });

    if (status === "delivered") {
      order.paymentStatus = "paid";
    }

    await order.save();

    socketEvents.orderUpdated(order);

    if (status === "shipped" && consignmentNumber) {
      this.syncTracking(order.id).catch(() => void 0);
    }
    return order;
  }
  async dashboardStats() {
    const [totals] = await OrderModel.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
            },
          },
        },
      },
    ]);

    const statusBreakdown = await OrderModel.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentOrders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .lean();

    return {
      totalOrders: totals?.totalOrders ?? 0,
      totalRevenue: totals?.totalRevenue ?? 0,
      statusBreakdown,
      recentOrders,
    };
  }
}
