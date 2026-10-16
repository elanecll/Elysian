import type { ConsultationInput, ConsultationStatus } from "./consultation";
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
  consultation: ConsultationInput;
  customer: Customer;
  treatments: TreatmentSelection[];
  customTreatments: { title: string; durationMinutes: number }[];
  date: string;
  time: string;
  isCourse: boolean;
  courseSessions?: 3 | 6;
  courseRewardSelection?: TreatmentSelection;
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
  | "cancelled"
  | "requested"
  | "awaiting_payment"
  | "confirmed"
  | "completed"
  | "dispatched"
  | "expired";
export interface PaymentRecord {
  consultationStatus?: ConsultationStatus;
  id: string;
  type: "booking" | "sale";
  createdAt: string;
  customer: Customer;
  items: RecordItem[];
  date?: string;
  time?: string;
  isCourse?: boolean;
  courseSessions?: 3 | 6;
  courseReward?: {
    name: string;
    valuePence: number;
    serviceId?: string;
    optionIndex?: number;
  };
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
  holdUntil?: number;
  durationMinutes?: number;
  revision: number;
}
export type Receipt = Pick<
  PaymentRecord,
  | "holdUntil"
  | "durationMinutes"
  | "id"
  | "type"
  | "items"
  | "date"
  | "time"
  | "isCourse"
  | "courseSessions"
  | "courseReward"
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
export const courseOfferDescription = (
  record: Pick<PaymentRecord, "isCourse" | "courseSessions" | "courseReward">,
) =>
  record.courseSessions
    ? `${record.courseSessions} paid sessions + ${record.courseReward?.name || (record.courseSessions === 3 ? "free £30 Cinderella / Black Tie Facial" : "free treatment worth £60")}`
    : record.isCourse
      ? "Four sessions, pay for three (previous offer)"
      : "";
export const londonDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const isStandaloneTreatment = (serviceId: string) =>
  [
    "carboxytherapy-face-mask-treatment",
    "cliniccare-chemical-peeling",
  ].includes(serviceId);

// Extra options supplement the main treatment catalogue. Prices are shared with the server.
export const EXTRA_ADDONS = [
  {
    id: "addon-high-frequency",
    title: "High-Frequency Blemish Buster",
    duration: "10 mins",
    pricePence: 1000,
  },
];
