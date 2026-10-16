import { z } from "zod";
import { SPA_SERVICES } from "../src/data/spaData.js";

export const reviewSchema = z
  .object({
    author: z
      .string()
      .trim()
      .min(2)
      .max(60)
      .refine(
        (value) => !/[<>\u0000-\u001f]/.test(value),
        "Enter a display name without markup.",
      ),
    serviceId: z
      .string()
      .max(100)
      .refine(
        (id) =>
          SPA_SERVICES.some((service) => service.id === id && !service.isAddon),
        "Select a treatment from the list.",
      ),
    rating: z.number().int().min(1).max(5),
    comment: z
      .string()
      .trim()
      .min(20)
      .max(2000)
      .refine(
        (value) => !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value),
        "Write your review as plain text.",
      ),
    consent: z.literal(true, { error: "Please agree to publish your review." }),
    website: z.string().max(0).default(""),
  })
  .strict();

export function reviewTreatment(id: string) {
  const service = SPA_SERVICES.find((service) => service.id === id)!;
  return {
    service: service.title,
    category:
      service.category === "packages"
        ? ("packages" as const)
        : ["body-massage", "hot-stone"].includes(service.category)
          ? ("massage" as const)
          : ("facials" as const),
  };
}
