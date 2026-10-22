export type BookingNotice =
  "request_received" | "deposit_ready" | "booking_confirmed";
export type NotificationStatus =
  | "pending"
  | "not_configured"
  | "sending"
  | "accepted"
  | "delivered"
  | "failed"
  | "unknown"
  | "skipped";
export interface NotificationSummary {
  id: string;
  event: BookingNotice;
  channel: "email" | "whatsapp";
  audience: "owner" | "customer";
  status: NotificationStatus;
  detail?: string;
  updatedAt: number;
}
export interface NotificationFeed {
  emailConfigured: boolean;
  whatsappConfigured: boolean;
  notifications: NotificationSummary[];
}
