import cron from "node-cron";
import { OrderService } from "../order.service.js";

const service = new OrderService();

export function startTrackingSyncJob() {
  cron.schedule("*/30 * * * *", async () => {
    const shipped = await service.findShippedWithConsignment();
    for (const order of shipped) {
      await service
        .syncTracking(order.id)
        .catch((err) =>
          console.error(`Tracking sync failed for order ${order.id}:`, err),
        );
    }
  });
}
