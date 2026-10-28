import React from "react";
import {
  isWeeklySpecial,
  weeklySpecialVisible,
} from "../../shared/weeklyPromotion";
import { useLondonDate } from "../data/useLondonDate";
import { SPA_SERVICES } from "../data/spaData";
import type { Treatment } from "../types";
import { FACIAL_BUNDLE_ID } from "../../shared/facialBundle";
import { FRIEND_PACKAGE_ID } from "../../shared/friendPackage";
import { isStandaloneTreatment, money } from "../../shared/payments";

const groups = ["Facial Treatments", "Massage Treatments", "Packages"] as const;
type TreatmentGroup = (typeof groups)[number];

function groupFor(service?: Treatment): TreatmentGroup {
  if (service?.category === "facial") return "Facial Treatments";
  if (["body-massage", "hot-stone", "addons"].includes(service?.category ?? ""))
    return "Massage Treatments";
  return "Packages";
}

function alphabetical(a: string, b: string) {
  return a.localeCompare(b, "en-GB", { sensitivity: "base", numeric: true });
}

export function PrimaryTreatmentOptions({
  includePromotion = true,
}: { includePromotion?: boolean } = {}) {
  const today = useLondonDate();
  const services = SPA_SERVICES.filter(
    (s) =>
      !s.isAddon &&
      !s.comingSoon &&
      (!isWeeklySpecial(s.id) ||
        (includePromotion && weeklySpecialVisible(today))),
  );
  return (
    <>
      {groups.map((group) => (
        <optgroup label={group} key={group}>
          {services
            .filter((service) => groupFor(service) === group)
            .sort((a, b) => alphabetical(a.title, b.title))
            .map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
                {isStandaloneTreatment(service.id)
                  ? " — Standalone treatment"
                  : ""}
              </option>
            ))}
        </optgroup>
      ))}
    </>
  );
}

export function TreatmentDurationOptions({ service }: { service: Treatment }) {
  const isFriend = service.id === FRIEND_PACKAGE_ID;
  const isBundle = service.id === FACIAL_BUNDLE_ID;
  // Sort display entries only: request indices must still address the original
  // catalogue options, including options saved in older bookings.
  const options = (service.priceOptions ?? []).flatMap((option, index) => {
    if (
      option.comingSoon ||
      (isFriend && typeof option.priceSingle !== "number")
    )
      return [];
    const source = SPA_SERVICES.find(
      (s) => s.id === (option.facialServiceId ?? option.pairedServiceId),
    );
    const label = isBundle
      ? (option.label ?? option.duration)
      : isFriend
        ? `${option.label} — ${option.duration}`
        : option.duration;
    const price = option.priceClinicare ?? option.priceSingle;
    return [
      {
        index,
        group: groupFor(source),
        label,
        text: `${label} — ${typeof price === "number" ? money(price * 100) : "Owner quotation"}${isFriend ? " total for 2" : ""}`,
      },
    ];
  });
  if (!isFriend && !isBundle)
    return (
      <>
        {options.map((option) => (
          <option key={option.index} value={option.index}>
            {option.text}
          </option>
        ))}
      </>
    );
  return (
    <>
      <option value="" disabled>
        Choose a treatment
      </option>
      {groups.map((group) => {
        const entries = options.filter((option) => option.group === group);
        if (!entries.length) return null;
        return (
          <optgroup label={group} key={group}>
            {entries
              .sort((a, b) => alphabetical(a.label, b.label))
              .map((option) => (
                <option key={option.index} value={option.index}>
                  {option.text}
                </option>
              ))}
          </optgroup>
        );
      })}
    </>
  );
}
