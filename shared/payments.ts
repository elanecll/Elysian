export interface Customer {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface TreatmentSelection {
  serviceId: string;
  optionIndex: number;
}
export interface BookingRequest {
  customer: Customer;
  treatments: TreatmentSelection[];
  customTreatments: { title: string; durationMinutes: number }[];
  date: string;
  time: string;
  isCourse: boolean;
}
export interface ShopRequest {
  customer: Customer;
  items: { productId: string; quantity: number }[];
  deliveryOption: "collection" | "delivery";
  deliveryAddress: string;
  promoCode: string;
}
export interface RecordItem {
  id: string;
  name: string;
  quantity: number;
  unitPricePence: number | null;
  duration?: string;
  custom?: boolean;
}
export type PaymentStatus =
  "unpaid" | "paid" | "expired" | "failed" | "partially_refunded" | "refunded";
export type RecordStatus =
  | "requested"
  | "awaiting_payment"
  | "confirmed"
  | "completed"
  | "dispatched"
  | "expired";
export interface PaymentRecord {
  id: string;
  type: "booking" | "sale";
  createdAt: string;
  customer: Customer;
  items: RecordItem[];
  date?: string;
  time?: string;
  isCourse?: boolean;
  deliveryOption?: "collection" | "delivery";
  deliveryAddress?: string;
  promoCode?: string;
  subtotalPence: number;
  discountPence: number;
  shippingPence: number;
  totalPence: number;
  amountDuePence: number;
  paidPence: number;
  refundedPence: number;
  paymentStatus: PaymentStatus;
  status: RecordStatus;
  ownerNotes: string;
  receiptToken: string;
  checkoutUrl?: string;
  stripeSessionId?: string;
  expiresAt?: number;
  revision: number;
}
export type Receipt = Pick<
  PaymentRecord,
  | "id"
  | "type"
  | "items"
  | "date"
  | "time"
  | "isCourse"
  | "totalPence"
  | "amountDuePence"
  | "paidPence"
  | "refundedPence"
  | "paymentStatus"
  | "status"
  | "shippingPence"
  | "discountPence"
  | "deliveryOption"
>;
export const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100,
  );
export const londonDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

// Extra options supplement the main treatment catalogue. Prices are shared with the server.
export const EXTRA_ADDONS = [
  {
    id: "addon-eye-lip-rescue",
    title: "Collagen Eye & Lip Contour",
    duration: "15 mins",
    pricePence: 1200,
  },
  {
    id: "addon-high-frequency",
    title: "High-Frequency Blemish Buster",
    duration: "10 mins",
    pricePence: 1000,
  },
  {
    id: "addon-cold-hammer",
    title: "Cold Hammer Cryo Serums Lock",
    duration: "10 mins",
    pricePence: 1500,
  },
];
