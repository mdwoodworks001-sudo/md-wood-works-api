import type {
  CourierProvider,
  CourierTrackingEvent,
} from "./courier-provider.js";

const TRACKING_API_URL = process.env.COURIER_TRACKING_API_URL!;
const TRACKING_API_KEY = process.env.COURIER_TRACKING_API_KEY!;

export class SpeedPostProvider implements CourierProvider {
  async track(consignmentNumber: string): Promise<CourierTrackingEvent[]> {
    const res = await fetch(`${TRACKING_API_URL}/track/${consignmentNumber}`, {
      headers: { Authorization: `Bearer ${TRACKING_API_KEY}` },
    });

    if (!res.ok) {
      throw new Error(`Tracking API error: ${res.status}`);
    }

    const body = await res.json();

    return (body.events ?? []).map((e: any) => ({
      status: e.status,
      location: e.location,
      timestamp: new Date(e.timestamp),
      description: e.description,
    }));
  }

  mapStatus(rawStatus: string): "shipped" | "delivered" | null {
    const s = rawStatus.toLowerCase();
    if (s.includes("delivered")) return "delivered";
    if (
      s.includes("transit") ||
      s.includes("dispatched") ||
      s.includes("out for delivery")
    )
      return "shipped";
    return null;
  }
}
