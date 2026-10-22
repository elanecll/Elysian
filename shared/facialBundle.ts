import type { Treatment, TreatmentPriceOption } from "../src/types.js";

export const FACIAL_BUNDLE_ID = "facial-product-bundle-package";

// Bundle choices follow the facial catalogue so prices/durations cannot drift.
export function facialBundleOptions(
  services: Treatment[],
): TreatmentPriceOption[] {
  return services
    .filter((service) => service.category === "facial" && !service.isAddon)
    .flatMap((service) =>
      (service.priceOptions ?? []).flatMap((option, optionIndex) => {
        const price = option.priceClinicare ?? option.priceSingle;
        return typeof price === "number" && Number.isFinite(price) && price > 0
          ? [
              {
                label: `${service.title} — ${option.duration}`,
                duration: option.duration,
                priceSingle: price,
                facialServiceId: service.id,
                facialOptionIndex: optionIndex,
                comingSoon: service.comingSoon,
              },
            ]
          : [];
      }),
    );
}
