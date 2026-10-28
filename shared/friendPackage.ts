import type { Treatment, TreatmentPriceOption } from "../src/types.js";
import { isWeeklySpecial } from "./weeklyPromotion.js";
import { isStandaloneTreatment } from "./payments.js";

export const FRIEND_PACKAGE_ID = "bring-a-friend-package";

// Keep the original four indices for older requests; new clients choose a
// specific catalogue treatment rather than the legacy quotation-only option.
export function friendPackageOptions(
  services: Treatment[],
): TreatmentPriceOption[] {
  const choices = services
    .filter(
      (service) =>
        ["facial", "body-massage", "hot-stone"].includes(service.category) &&
        !service.isAddon &&
        !isWeeklySpecial(service.id) &&
        !service.comingSoon &&
        !isStandaloneTreatment(service.id),
    )
    .flatMap((service) =>
      (service.priceOptions ?? []).flatMap((option, optionIndex) => {
        const price = option.priceClinicare ?? option.priceSingle;
        return typeof price === "number" &&
          Number.isFinite(price) &&
          price > 0 &&
          !option.comingSoon
          ? [
              {
                label: service.title,
                duration: `${option.duration} each`,
                priceSingle:
                  Math.round(Math.round(price * 100) * 2 * 0.9) / 100,
                pairedServiceId: service.id,
                pairedOptionIndex: optionIndex,
              },
            ]
          : [];
      }),
    );
  const legacyIds = [
    "swedish-back-massage",
    "swedish-full-body-massage",
    "elysian-glow-8-in-1-pdt-led-light-therapy",
  ];
  const preferred = legacyIds.map((id) =>
    choices.find(
      (option) =>
        option.pairedServiceId === id && option.pairedOptionIndex === 0,
    )!,
  );
  const facialPrices = choices
    .filter(
      (option) =>
        services.find((service) => service.id === option.pairedServiceId)
          ?.category === "facial",
    )
    .map((option) => Number(option.priceSingle));
  return [
    {
      label: "Twin Facial Ritual (Both save 10%)",
      duration: "30 - 60 mins each",
      priceSingle: `From £${Math.min(...facialPrices).toFixed(2)}`,
    },
    ...preferred,
    ...choices.filter((option) => !preferred.includes(option)),
  ];
}
