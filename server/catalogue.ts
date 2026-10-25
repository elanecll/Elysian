import { z } from "zod";
import { consultationSchema } from "./consultation.js";
import { SPA_PRODUCTS } from "../src/data/shopData.js";
import { SPA_SERVICES } from "../src/data/spaData.js";
import { bookingTotals } from "../shared/bookingPricing.js";
import { FACIAL_BUNDLE_ID } from "../shared/facialBundle.js";
import { FRIEND_PACKAGE_ID } from "../shared/friendPackage.js";
import {
  PERSONALISE_TREATMENT,
  isStandaloneTreatment,
  londonDate,
  type RecordItem,
} from "../shared/payments.js";

const customer = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(30)
      .regex(/^[+\d\s().-]+$/),
    notes: z.string().trim().max(2000).default(""),
  })
  .strict();
export const shopSchema = z
  .object({
    customer,
    items: z
      .array(
        z
          .object({
            productId: z.string().max(100),
            quantity: z.number().int().min(1).max(20),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    deliveryOption: z.enum(["collection", "delivery"]),
    deliveryAddress: z.string().trim().max(1000).default(""),
    promoCode: z.string().trim().toUpperCase().max(40).default(""),
  })
  .strict()
  .refine(
    (r) => r.deliveryOption !== "delivery" || r.deliveryAddress.length >= 10,
    "A complete delivery address is required.",
  );
export const bookingSchema = z
  .object({
    consultation: consultationSchema,
    customer,
    treatments: z
      .array(
        z
          .object({
            serviceId: z.string().max(100),
            optionIndex: z.number().int().min(0).max(100),
          })
          .strict(),
      )
      .min(1)
      .max(10),
    customTreatments: z
      .array(
        z
          .object({
            title: z.string().trim().min(2).max(150),
            durationMinutes: z.number().int().min(5).max(240),
          })
          .strict(),
      )
      .max(5)
      .default([]),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((d) => {
        const date = new Date(`${d}T12:00:00Z`);
        return (
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === d &&
          d >= londonDate()
        );
      }, "Select a valid date today or later."),
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    isCourse: z.boolean().default(false),
    courseSessions: z.union([z.literal(5), z.literal(10)]).optional(),
    bundleProducts: z
      .array(
        z
          .object({
            productId: z.string().max(100),
            quantity: z.number().int().min(1).max(20),
          })
          .strict(),
      )
      .max(50)
      .optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.treatments[0]?.serviceId !== FACIAL_BUNDLE_ID ||
      !!input.bundleProducts?.length,
    "Choose at least one skincare product for your Facial + Product Bundle.",
  )
  .refine((r) => {
    if (r.date !== londonDate()) return true;
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    return r.time > time;
  }, "Select a future appointment time.");
export const approvalSchema = z
  .object({
    customPrices: z
      .array(
        z
          .object({
            id: z.string(),
            pricePence: z.number().int().min(100).max(100000),
          })
          .strict(),
      )
      .max(5)
      .default([]),
  })
  .strict();

export function shopQuote(input: z.infer<typeof shopSchema>) {
  if (new Set(input.items.map((i) => i.productId)).size !== input.items.length)
    throw new Error("Duplicate products are not allowed.");
  const items: RecordItem[] = input.items.map((i) => {
    const product = SPA_PRODUCTS.find((p) => p.id === i.productId);
    if (!product) throw new Error("Unknown product.");
    return {
      id: product.id,
      name: product.name,
      quantity: i.quantity,
      unitPricePence: Math.round(product.numericPrice * 100),
    };
  });
  const subtotalPence = items.reduce(
    (sum, i) => sum + i.unitPricePence! * i.quantity,
    0,
  );
  if (input.promoCode && !["ELYSIAN10", "TROPIC10"].includes(input.promoCode))
    throw new Error("Invalid promotion code.");
  const discountPence = input.promoCode ? Math.round(subtotalPence * 0.1) : 0;
  const shippingPence =
    input.deliveryOption === "delivery" && subtotalPence < 5000 ? 395 : 0;
  return {
    items,
    subtotalPence,
    discountPence,
    shippingPence,
    totalPence: subtotalPence - discountPence + shippingPence,
  };
}
export function bookingQuote(
  input: Omit<z.infer<typeof bookingSchema>, "consultation">,
) {
  if (!input.isCourse && input.courseSessions)
    throw new Error("Select a course before choosing course offers.");
  const paidSessions = input.courseSessions ?? (input.isCourse ? 5 : 1);
  if (![1, 5, 10].includes(paidSessions))
    throw new Error("Choose a course of 5 or 10 treatments.");
  const isBundle = input.treatments[0]?.serviceId === FACIAL_BUNDLE_ID;
  if (
    (!isBundle && input.bundleProducts?.length) ||
    input.treatments.slice(1).some((t) => t.serviceId === FACIAL_BUNDLE_ID)
  )
    throw new Error(
      "Select Facial + Product Bundle as your primary treatment to add discounted products.",
    );
  const effectiveServiceIds = input.treatments.map((t) => {
    const choice = SPA_SERVICES.find((s) => s.id === t.serviceId)
      ?.priceOptions?.[t.optionIndex];
    return choice?.facialServiceId ?? choice?.pairedServiceId ?? t.serviceId;
  });
  if (
    effectiveServiceIds.some(isStandaloneTreatment) &&
    (input.treatments.length !== 1 || input.customTreatments.length > 0)
  )
    throw new Error(
      "Chemical peeling and carboxytherapy are standalone treatments. Request each separately without additional treatments or add-ons.",
    );
  if (new Set(effectiveServiceIds).size !== input.treatments.length)
    throw new Error("Duplicate treatments are not allowed.");
  const primary = SPA_SERVICES.find(
    (s) => s.id === input.treatments[0].serviceId,
  );
  if (!primary || primary.isAddon)
    throw new Error("Select a primary treatment.");
  const items: RecordItem[] = input.treatments.map((t, index) => {
    const service = SPA_SERVICES.find((s) => s.id === t.serviceId);
    if (!service) throw new Error("Unknown treatment.");
    if (service.comingSoon)
      throw new Error(
        `${service.title} is coming soon and is not yet available to book.`,
      );
    const option = service.priceOptions?.[t.optionIndex];
    if (!option) throw new Error("Unknown treatment duration.");
    const selectedId = option.facialServiceId ?? option.pairedServiceId;
    const selectedTreatment = selectedId
      ? SPA_SERVICES.find((s) => s.id === selectedId && !s.isAddon)
      : undefined;
    if (
      service.id === FACIAL_BUNDLE_ID &&
      selectedTreatment?.category !== "facial"
    )
      throw new Error("Choose a qualifying CLINICARE facial.");
    if (
      service.id === FRIEND_PACKAGE_ID &&
      t.optionIndex > 0 &&
      (!selectedTreatment || isStandaloneTreatment(selectedTreatment.id))
    )
      throw new Error("Choose a qualifying treatment for both guests.");
    if (option.comingSoon || selectedTreatment?.comingSoon)
      throw new Error(
        `${selectedTreatment?.title ?? service.title} is coming soon and is not yet available to book.`,
      );
    const isDiscountedAddon =
      index > 0 && service.canBeAddon && service.addonPrice !== undefined;
    const price = isDiscountedAddon
      ? service.addonPrice
      : (option.priceClinicare ?? option.priceSingle);
    if (typeof price !== "number")
      return {
        id: service.id,
        name: service.title,
        quantity: paidSessions,
        unitPricePence: null,
        duration: option.duration,
        custom: true,
      };
    if (!Number.isFinite(price) || price <= 0)
      throw new Error("Invalid treatment price.");
    return {
      id: service.id,
      name: selectedTreatment
        ? `${service.title} — ${selectedTreatment.title}`
        : isDiscountedAddon
          ? `${service.title} (Add-on)`
          : service.title,
      quantity: paidSessions,
      unitPricePence: Math.round(price * 100),
      duration: option.duration,
    };
  });
  items.push(
    ...input.customTreatments.map((t, index) => {
      const personalised = t.title === PERSONALISE_TREATMENT.title;
      if (
        personalised &&
        t.durationMinutes !== PERSONALISE_TREATMENT.durationMinutes
      )
        throw new Error(
          "Elysian Personalise Treatment requires a 60-minute appointment slot.",
        );
      return {
        id: `custom-${index}`,
        name: t.title,
        duration: personalised
          ? PERSONALISE_TREATMENT.duration
          : `${t.durationMinutes} mins`,
        quantity: paidSessions,
        unitPricePence: null,
        custom: true,
      };
    }),
  );
  const products = input.bundleProducts ?? [];
  if (new Set(products.map((p) => p.productId)).size !== products.length)
    throw new Error("Duplicate products are not allowed.");
  for (const selection of products) {
    const product = SPA_PRODUCTS.find((p) => p.id === selection.productId);
    if (
      !product ||
      !Number.isInteger(selection.quantity) ||
      selection.quantity < 1 ||
      selection.quantity > 20
    )
      throw new Error("Choose a valid skincare product and quantity.");
    items.push({
      id: product.id,
      name: product.name,
      kind: "product",
      quantity: selection.quantity,
      unitPricePence: Math.round(product.numericPrice * 100),
    });
  }
  return {
    items,
    courseSessions: paidSessions === 1 ? undefined : paidSessions,
    ...bookingTotals(items, paidSessions),
  };
}
