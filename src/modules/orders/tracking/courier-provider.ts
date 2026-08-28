export interface CourierTrackingEvent {
  status: string;       
  location?: string;
  timestamp: Date;
  description?: string;
}

export interface CourierProvider {
  track(consignmentNumber: string): Promise<CourierTrackingEvent[]>;
  mapStatus(rawStatus: string): 'shipped' | 'delivered' | null;
}