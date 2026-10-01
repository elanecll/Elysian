import { z } from "zod";
import { SPA_PRODUCTS } from "../src/data/shopData";
import { SPA_SERVICES } from "../src/data/spaData";
import { EXTRA_ADDONS, londonDate, type RecordItem } from "../shared/payments";

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
    customer,
    treatments: z
      .array(
        z
          .object({
            serviceId: z.string().max(100),
            optionIndex: z.number().int().min(0).max(20),
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
  })
  .strict()
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
export function bookingQuote(input: z.infer<typeof bookingSchema>) {
  if (
    new Set(input.treatments.map((t) => t.serviceId)).size !==
    input.treatments.length
  )
    throw new Error("Duplicate treatments are not allowed.");
  const primary = SPA_SERVICES.find(
    (s) => s.id === input.treatments[0].serviceId,
  );
  if (!primary || primary.isAddon)
    throw new Error("Select a primary treatment.");
  const items: RecordItem[] = input.treatments.map((t) => {
    const service = SPA_SERVICES.find((s) => s.id === t.serviceId);
    if (!service) {
      const addon = EXTRA_ADDONS.find((a) => a.id === t.serviceId);
      if (!addon || t.optionIndex !== 0) throw new Error("Unknown treatment.");
      return {
        id: addon.id,
        name: addon.title,
        quantity: input.isCourse ? 3 : 1,
        unitPricePence: addon.pricePence,
        duration: addon.duration,
      };
    }
    const option = service.priceOptions?.[t.optionIndex];
    if (!option) throw new Error("Unknown treatment duration.");
    const price = option.priceClinicare ?? option.priceSingle;
    if (typeof price !== "number")
      return {
        id: service.id,
        name: service.title,
        quantity: input.isCourse ? 3 : 1,
        unitPricePence: null,
        duration: option.duration,
        custom: true,
      };
    if (!Number.isFinite(price) || price <= 0)
      throw new Error("Invalid treatment price.");
    return {
      id: service.id,
      name: service.title,
      quantity: input.isCourse ? 3 : 1,
      unitPricePence: Math.round(price * 100),
      duration: option.duration,
    };
  });
  items.push(
    ...input.customTreatments.map((t, index) => ({
      id: `custom-${index}`,
      name: t.title,
      duration: `${t.durationMinutes} mins`,
      quantity: input.isCourse ? 3 : 1,
      unitPricePence: null,
      custom: true,
    })),
  );
  const totalPence = items.reduce(
    (sum, i) => sum + (i.unitPricePence ?? 0) * i.quantity,
    0,
  );
  return {
    items,
    subtotalPence: totalPence,
    totalPence,
    amountDuePence: Math.round(totalPence / 2),
    discountPence: 0,
    shippingPence: 0,
  };
}
