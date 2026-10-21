import { coursePricing } from "./courseOffers.js";
import type { RecordItem } from "./payments.js";

export function itemTotal(item: RecordItem) {
  const subtotal = (item.unitPricePence ?? 0) * item.quantity;
  return item.kind === "product"
    ? subtotal - Math.round(subtotal * 0.1)
    : subtotal;
}

export function bookingTotals(items: RecordItem[], sessions?: number) {
  const treatments = items.filter((item) => item.kind !== "product");
  const products = items.filter((item) => item.kind === "product");
  const treatmentSubtotal = treatments.reduce(
    (sum, item) => sum + (item.unitPricePence ?? 0) * item.quantity,
    0,
  );
  const productsSubtotalPence = products.reduce(
    (sum, item) => sum + (item.unitPricePence ?? 0) * item.quantity,
    0,
  );
  const productsTotalPence = products.reduce(
    (sum, item) => sum + itemTotal(item),
    0,
  );
  const productsDiscountPence = productsSubtotalPence - productsTotalPence;
  const treatment = coursePricing(treatmentSubtotal, sessions);
  const treatmentDepositPence = Math.round(treatment.totalPence / 2);
  return {
    subtotalPence: treatmentSubtotal + productsSubtotalPence,
    discountPence: treatment.discountPence + productsDiscountPence,
    totalPence: treatment.totalPence + productsTotalPence,
    amountDuePence: treatmentDepositPence + productsTotalPence,
    shippingPence: 0,
    bundlePricing: products.length
      ? {
          treatmentTotalPence: treatment.totalPence,
          treatmentDepositPence,
          productsSubtotalPence,
          productsDiscountPence,
          productsTotalPence,
        }
      : undefined,
  };
}
