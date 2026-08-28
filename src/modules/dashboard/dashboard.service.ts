import { ProductModel } from "../products/product.model.js";
import { UserModel } from "../users/user.model.js";
import { OrderModel } from "../orders/order.model.js";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export class DashboardService {
  async getOverview() {
    const todayStart = startOfToday();

    const [
      totalProducts,
      totalUsers,
      totalOrders,
      todayOrders,
      todayUsers,
      revenueAgg,
      todayRevenueAgg,
      allProducts,
    ] = await Promise.all([
      ProductModel.countDocuments(),
      UserModel.countDocuments({ role: "user" }),
      OrderModel.countDocuments(),
      OrderModel.countDocuments({ createdAt: { $gte: todayStart } }),
      UserModel.countDocuments({
        role: "user",
        createdAt: { $gte: todayStart },
      }),
      OrderModel.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]),
      OrderModel.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: todayStart } } },
        { $group: { _id: null, todayRevenue: { $sum: "$total" } } },
      ]),
      ProductModel.find().select("name stock initialStock").lean(),
    ]);

    const lowStockProducts = allProducts.filter(
      (p) =>
        p.stock > 0 && p.initialStock > 0 && p.stock < p.initialStock * 0.8,
    );
    const outOfStockProducts = allProducts.filter((p) => p.stock === 0);

    return {
      totalProducts,
      totalUsers,
      totalOrders,
      todayOrders,
      todayUsers,
      totalRevenue: revenueAgg[0]?.totalRevenue ?? 0,
      todayRevenue: todayRevenueAgg[0]?.todayRevenue ?? 0,
      lowStockProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockProducts,
      outOfStockCount: outOfStockProducts.length,
    };
  }

  async getOrdersChart(days = 14) {
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);

    const rows = await OrderModel.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byDate = new Map(rows.map((r) => [r._id, r]));
    const series: { date: string; orders: number; revenue: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const row = byDate.get(key);
      series.push({
        date: key,
        orders: row?.orders ?? 0,
        revenue: row?.revenue ?? 0,
      });
    }

    return series;
  }
}
