import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Storage as Store } from "./storage";
import { bookingSchema, bookingQuote } from "./catalogue";
import {
  londonDate,
  type PaymentRecord,
  type RecordItem,
} from "../shared/payments";
import {
  BREAK_MINUTES,
  BOOKING_DAYS,
  DEFAULT_HOURS,
  HOLD_HOURS,
  clockTime,
  minutes,
  shiftDate,
  type DiaryEntry,
  type OpeningDay,
} from "../shared/calendar";
export class CalendarError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((d) => {
    const value = new Date(`${d}T12:00:00Z`);
    return (
      Number.isFinite(value.getTime()) && value.toISOString().slice(0, 10) === d
    );
  }, "Choose a valid date.");
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const availabilitySchema = z
  .object({
    date: bookingSchema.shape.date,
    treatments: bookingSchema.shape.treatments,
    customTreatments: bookingSchema.shape.customTreatments,
    isCourse: bookingSchema.shape.isCourse,
    courseSessions: bookingSchema.shape.courseSessions,
    courseRewardSelection: bookingSchema.shape.courseRewardSelection,
  })
  .strict();
export const hoursSchema = z
  .object({
    hours: z
      .array(
        z
          .object({
            day: z.number().int().min(0).max(6),
            enabled: z.boolean(),
            open: timeSchema,
            close: timeSchema,
          })
          .strict(),
      )
      .length(7),
  })
  .strict()
  .refine(
    (r) =>
      new Set(r.hours.map((d) => d.day)).size === 7 &&
      r.hours.every((d) => !d.enabled || minutes(d.close) > minutes(d.open)),
    "Provide seven different days with closing times after opening.",
  );
export const manualSchema = z
  .object({
    date: dateSchema,
    time: timeSchema,
    durationMinutes: z.number().int().min(5).max(1440),
    kind: z.enum(["manual", "block"]),
    title: z.string().trim().min(2).max(150),
    customerName: z.string().trim().max(120).default(""),
    phone: z.string().trim().max(30).default(""),
    notes: z.string().trim().max(2000).default(""),
  })
  .strict()
  .refine(
    (r) =>
      r.kind !== "manual" ||
      (r.customerName.length >= 2 && r.durationMinutes <= 480),
    "Manual appointments need a client name and a duration up to eight hours.",
  );
// Course quantities are prices for separate visits, not consecutive treatments.
// One therapist treats twin clients consecutively, including an internal break.
export function treatmentMinutes(items: RecordItem[]) {
  return items.reduce((sum, item) => {
    const label = (item.duration || "").replace(/^\d+\s*x\s*/i, "");
    const values = label.match(/\d+/g)?.map(Number) || [];
    if (!values.length)
      throw new CalendarError(
        400,
        "This treatment needs an appointment duration.",
      );
    const duration = Math.max(...values);
    return (
      sum + (label.includes("each") ? duration * 2 + BREAK_MINUTES : duration)
    );
  }, 0);
}
export async function readHours(store: Store): Promise<OpeningDay[]> {
  const row = (await store.db
    .prepare("SELECT data FROM calendar_settings WHERE id=1")
    .get()) as
    | {
        data: string;
      }
    | undefined;
  return row ? JSON.parse(row.data) : DEFAULT_HOURS;
}
export async function entry(
  store: Store,
  id: string,
): Promise<DiaryEntry | undefined> {
  const row = (await store.db
    .prepare("SELECT data FROM diary WHERE id=?")
    .get(id)) as
    | {
        data: string;
      }
    | undefined;
  return row && JSON.parse(row.data);
}
export async function entries(store: Store): Promise<DiaryEntry[]> {
  return (
    (await store.db
      .prepare("SELECT data FROM diary ORDER BY date, start")
      .all()) as {
      data: string;
    }[]
  ).map((r) => JSON.parse(r.data));
}
export async function saveEntry(store: Store, e: DiaryEntry) {
  await store.db
    .prepare(
      "INSERT INTO diary(id, date, start, finish, data) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET date=excluded.date, start=excluded.start, finish=excluded.finish, data=excluded.data",
    )
    .run(
      e.id,
      e.date,
      minutes(e.time),
      minutes(e.availableAfter),
      JSON.stringify(e),
    );
}
export function active(e: DiaryEntry, now = Date.now()) {
  return !e.cancelled && (e.kind !== "request" || (e.holdUntil ?? 0) > now);
}
async function overlaps(store: Store, e: DiaryEntry) {
  return (
    (await store.db
      .prepare(
        "SELECT data FROM diary WHERE date=? AND id<>? AND start<? AND finish>?",
      )
      .all(e.date, e.id, minutes(e.availableAfter), minutes(e.time))) as {
      data: string;
    }[]
  ).some((r) => active(JSON.parse(r.data)));
}
// Resolve UK wall time without relying on the server machine's timezone.
export function londonInstant(date: string, time: string): number {
  if (time === "24:00") return londonInstant(shiftDate(date, 1), "00:00");
  const utc = Date.parse(`${date}T${time}:00Z`);
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const candidates = [utc, utc - 3600000].filter((value) => {
    const parts = Object.fromEntries(
      format.formatToParts(new Date(value)).map((p) => [p.type, p.value]),
    );
    return (
      `${parts.year}-${parts.month}-${parts.day}` === date &&
      `${parts.hour}:${parts.minute}` === time
    );
  });
  if (candidates.length !== 1)
    throw new CalendarError(
      400,
      "Choose a time outside the UK daylight-saving clock change.",
    );
  return candidates[0];
}
export function checkoutDeadline(record: PaymentRecord) {
  const start = londonInstant(record.date!, record.time!);
  // Stripe Checkout requires at least thirty minutes before session expiry.
  if (start - Date.now() < 31 * 60000)
    throw new CalendarError(
      400,
      "Online deposits need an appointment at least 31 minutes away. Arrange a later time with the client.",
    );
  return Math.min((Math.floor(Date.now() / 1000) + 24 * 3600) * 1000, start);
}
export function assertFuture(date: string, time: string, horizon = true) {
  const today = londonDate();
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  if (date < today || (date === today && time <= now))
    throw new CalendarError(400, "Choose a future appointment time.");
  if (horizon && date > shiftDate(today, BOOKING_DAYS))
    throw new CalendarError(400, `Book within the next ${BOOKING_DAYS} days.`);
}
export function makeEntry(
  input: {
    date: string;
    time: string;
    durationMinutes: number;
    kind: DiaryEntry["kind"];
    title: string;
    customerName: string;
    phone: string;
    notes: string;
  },
  id: string = randomUUID(),
): DiaryEntry {
  const breakMinutes = input.kind === "block" ? 0 : BREAK_MINUTES;
  const end = minutes(input.time) + input.durationMinutes;
  if (end + breakMinutes > 1440)
    throw new CalendarError(
      400,
      "The appointment and break must fit within one day.",
    );
  if (input.kind !== "block") {
    const startInstant = londonInstant(input.date, input.time);
    const finishInstant = londonInstant(
      input.date,
      clockTime(end + breakMinutes),
    );
    if (
      finishInstant - startInstant !==
      (input.durationMinutes + breakMinutes) * 60000
    )
      throw new CalendarError(
        400,
        "Appointments cannot span the UK daylight-saving clock change. Choose a later time.",
      );
  }
  return {
    ...input,
    id,
    breakMinutes,
    endTime: clockTime(end),
    availableAfter: clockTime(end + breakMinutes),
    cancelled: false,
  };
}
export async function reserve(
  store: Store,
  e: DiaryEntry,
  enforceHours = true,
) {
  assertFuture(e.date, e.time, enforceHours);
  if (enforceHours) {
    const day = (await readHours(store)).find(
      (d) => d.day === new Date(`${e.date}T12:00:00Z`).getUTCDay(),
    )!;
    if (
      !day.enabled ||
      minutes(e.time) < minutes(day.open) ||
      minutes(e.availableAfter) > minutes(day.close) ||
      minutes(e.time) % 15 !== 0
    )
      throw new CalendarError(
        400,
        "Choose an available time within opening hours, including the 30-minute break.",
      );
  }
  if (await overlaps(store, e))
    throw new CalendarError(
      409,
      "That time has just been reserved. Please choose another available time.",
    );
  await saveEntry(store, e);
}
export function forBooking(
  record: PaymentRecord,
  kind: DiaryEntry["kind"] = "request",
): DiaryEntry {
  return {
    ...makeEntry(
      {
        date: record.date!,
        time: record.time!,
        durationMinutes: treatmentMinutes(record.items),
        kind,
        title: record.items.map((i) => i.name).join(" + "),
        customerName: record.customer.name,
        phone: record.customer.phone,
        notes: record.customer.notes,
      },
      record.id,
    ),
    recordId: record.id,
    ...(kind === "request"
      ? {
          holdUntil: Math.min(
            Date.now() + HOLD_HOURS * 3600000,
            londonInstant(record.date!, record.time!),
          ),
        }
      : {}),
  };
}
export async function updateBookingEntry(store: Store, record: PaymentRecord) {
  const e = await entry(store, record.id);
  if (!e) return;
  if (record.status === "cancelled" || record.status === "expired")
    e.cancelled = true;
  else if (record.paidPence > 0) {
    e.kind = "confirmed";
    e.holdUntil = undefined;
  } else if (record.status === "awaiting_payment") {
    e.kind = "payment";
    e.holdUntil = record.expiresAt;
  }
  await saveEntry(store, e);
}
export async function expireRequests(store: Store) {
  await store.transaction(async () => {
    for (const e of await entries(store)) {
      if (
        e.kind !== "request" ||
        e.cancelled ||
        (e.holdUntil ?? 0) > Date.now()
      )
        continue;
      const r = await store.get(e.recordId!);
      if (r?.status === "requested") {
        r.status = "expired";
        r.paymentStatus = "expired";
        await store.save(r);
      }
      e.cancelled = true;
      await saveEntry(store, e);
    }
  });
}
export async function availability(
  store: Store,
  date: string,
  durationMinutes: number,
) {
  if (date > shiftDate(londonDate(), BOOKING_DAYS))
    throw new CalendarError(400, `Book within the next ${BOOKING_DAYS} days.`);
  const day = (await readHours(store)).find(
    (d) => d.day === new Date(`${date}T12:00:00Z`).getUTCDay(),
  )!;
  const slots: string[] = [];
  if (day.enabled)
    for (
      let start = Math.ceil(minutes(day.open) / 15) * 15;
      start + durationMinutes + BREAK_MINUTES <= minutes(day.close);
      start += 15
    ) {
      try {
        const e = makeEntry(
          {
            date,
            time: clockTime(start),
            durationMinutes,
            kind: "request",
            title: "",
            customerName: "",
            phone: "",
            notes: "",
          },
          "availability",
        );
        assertFuture(date, e.time);
        if (!(await overlaps(store, e))) slots.push(e.time);
      } catch {
        continue;
      }
    }
  return {
    date,
    slots,
    durationMinutes,
    breakMinutes: BREAK_MINUTES,
    closed: !day.enabled,
  };
}
export function durationForSelection(
  input: z.infer<typeof availabilitySchema>,
) {
  return treatmentMinutes(
    bookingQuote({
      ...input,
      time: "12:00",
      customer: {
        name: "Availability",
        email: "availability@example.com",
        phone: "00000000",
        notes: "",
      },
    }).items,
  );
}
export async function migrateDiary(store: Store) {
  // Preserve all existing commitments, even if legacy records overlap or sit outside hours.
  await store.transaction(async () => {
    for (const r of await store.list()) {
      if (
        r.type !== "booking" ||
        !r.date ||
        !r.time ||
        (await entry(store, r.id))
      )
        continue;
      const e = forBooking(
        r,
        r.paidPence
          ? "confirmed"
          : r.status === "awaiting_payment"
            ? "payment"
            : "request",
      );
      e.holdUntil =
        e.kind === "request"
          ? Date.parse(r.createdAt) + HOLD_HOURS * 3600000
          : r.expiresAt;
      e.cancelled = r.status === "expired" || r.status === "cancelled";
      await saveEntry(store, e);
    }
  });
}
