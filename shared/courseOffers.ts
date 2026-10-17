export const FIVE_SESSION_OFFER = "Course of 5 treatments — 10% off";
export const TEN_SESSION_OFFER = "Course of 10 treatments — 15% off";

export function coursePricing(subtotalPence: number, sessions?: number) {
  const percent = sessions === 5 ? 10 : sessions === 10 ? 15 : 0;
  const discountPence = Math.round((subtotalPence * percent) / 100);
  return { discountPence, totalPence: subtotalPence - discountPence };
}
