import { SPA_SERVICES } from "../src/data/spaData.js";
import type { TreatmentSelection } from "./payments.js";

export const THREE_SESSION_OFFER =
  "Buy 3 sessions, receive a free £30 Cinderella / Black Tie Facial";
export const SIX_SESSION_OFFER =
  "Buy 6 sessions, receive any treatment worth £60 free";

export function courseRewardOptions() {
  return SPA_SERVICES.filter((service) => !service.isAddon).flatMap((service) =>
    (service.priceOptions || []).flatMap((option, optionIndex) => {
      const price = option.priceClinicare ?? option.priceSingle;
      return typeof price === "number" && Math.round(price * 100) === 6000
        ? [
            {
              serviceId: service.id,
              optionIndex,
              title: service.title,
              duration: option.duration,
            },
          ]
        : [];
    }),
  );
}

export function courseReward(
  sessions: 1 | 3 | 6,
  selection?: TreatmentSelection,
) {
  if (selection && sessions !== 6)
    throw new Error("Choose a £60 reward only with the six-session course.");
  if (sessions === 1) return undefined;
  if (sessions === 3)
    return {
      name: "Free £30 Cinderella / Black Tie Facial",
      valuePence: 3000,
      serviceId: "cliniccare-cinderella-black-tie-facial",
      optionIndex: 0,
    };
  if (!selection)
    return {
      name: "Free treatment worth £60 (choose with the owner)",
      valuePence: 6000,
    };
  const reward = courseRewardOptions().find(
    (option) =>
      option.serviceId === selection.serviceId &&
      option.optionIndex === selection.optionIndex,
  );
  if (!reward)
    throw new Error(
      "Select a catalogue treatment priced at £60 for your free reward.",
    );
  return {
    name: `Free £60 ${reward.title} (${reward.duration})`,
    valuePence: 6000,
    serviceId: reward.serviceId,
    optionIndex: reward.optionIndex,
  };
}
