import { FIVE_SESSION_OFFER, TEN_SESSION_OFFER } from "./courseOffers.js";
import type { ConsultationInput, ConsultationStatus } from "./consultation.js";
export const PERSONALISE_TREATMENT = {
  title: "Elysian Personalise Treatment",
  duration: "45-60 mins",
  durationMinutes: 60,
} as const;

export interface Customer {
  name: string;
  email: string;
  phone: string;
  notes: string;
  whatsappUpdates?: boolean;
}

export interface TreatmentSelection {
  serviceId: string;
  optionIndex: number;
}
export interface BundleProductSelection {
  productId: string;
  quantity: number;
}
export interface BookingRequest {
  consultation: ConsultationInput;
  customer: Customer;
  treatments: TreatmentSelection[];
  customTreatments: { title: string; durationMinutes: number }[];
  date: string;
  time: string;
  isCourse: boolean;
  courseSessions?: 5 | 10;
  bundleProducts?: BundleProductSelection[];
  firstVisitConfirmed?: boolean;
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
  kind?: "product";
}
export interface BundlePricing {
  treatmentTotalPence: number;
  treatmentDepositPence: number;
  productsSubtotalPence: number;
  productsDiscountPence: number;
  productsTotalPence: number;
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
  promotion?: {
    id: string;
    startsOn: string;
    endsOn: string;
    firstVisitConfirmed: true;
  };
  bundlePricing?: BundlePricing;
  consultationStatus?: ConsultationStatus;
  id: string;
  type: "booking" | "sale";
  createdAt: string;
  customer: Customer;
  items: RecordItem[];
  date?: string;
  time?: string;
  isCourse?: boolean;
  courseSessions?: 3 | 6 | 5 | 10;
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
  // Persisted before the first Stripe request so retries retain identical parameters.
  checkoutMode?: "hosted" | "elements";
  expiresAt?: number;
  holdUntil?: number;
  durationMinutes?: number;
  revision: number;
}
export type Receipt = Pick<
  PaymentRecord,
  | "bundlePricing"
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
  record.courseSessions === 5
    ? FIVE_SESSION_OFFER
    : record.courseSessions === 10
      ? TEN_SESSION_OFFER
      : record.courseSessions
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
