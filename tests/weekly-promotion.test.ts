import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";
import {
  WEEKLY_SPECIAL,
  weeklySpecialVisible,
  weeklySpecialDateAllowed,
} from "../shared/weeklyPromotion";
import { bookingQuote } from "../server/catalogue";
import { treatmentMinutes } from "../server/calendar";
import { SPA_SERVICES } from "../src/data/spaData";
import { facialBundleOptions } from "../shared/facialBundle";
import { friendPackageOptions } from "../shared/friendPackage";
import { createApp } from "../server/app";
import { Store } from "../server/store";
import { testConsultation } from "./consultation-fixture";
import type { BookingRequest } from "../shared/payments";

const now = new Date("2026-10-28T12:00:00Z");
const origin = "http://localhost:3000";
const booking = (): BookingRequest => ({
  consultation: testConsultation([WEEKLY_SPECIAL.id]),
  customer: {
    name: "Promotion Test",
    email: "promotion@example.com",
    phone: "07700000000",
    notes: "",
  },
  treatments: [{ serviceId: WEEKLY_SPECIAL.id, optionIndex: 0 }],
  customTreatments: [],
  date: "2026-11-01",
  time: "10:00",
  isCourse: false,
  firstVisitConfirmed: true,
});

test("weekly promotion supports advance booking, inclusive offer dates, and expiry", () => {
  assert.equal(weeklySpecialVisible("2026-10-28"), true);
  assert.equal(weeklySpecialDateAllowed("2026-11-01", "2026-10-28"), true);
  assert.equal(weeklySpecialDateAllowed("2026-11-08", "2026-11-08"), true);
  assert.equal(weeklySpecialDateAllowed("2026-10-31", "2026-10-28"), false);
  assert.equal(weeklySpecialDateAllowed("2026-11-09", "2026-10-28"), false);
  assert.equal(weeklySpecialVisible("2026-11-09"), false);
  assert.equal(weeklySpecialDateAllowed("2026-11-08", "2026-11-09"), false);
});

test("weekly promotion quotes £50 with a £25 deposit and reserves the full 50 minutes", () => {
  const quote = bookingQuote(booking(), { now });
  assert.equal(quote.totalPence, 5000);
  assert.equal(quote.amountDuePence, 2500);
  assert.equal(quote.items[0].duration, "40-50 mins");
  assert.equal(treatmentMinutes(quote.items), 50);
  assert.equal(quote.promotion?.firstVisitConfirmed, true);
  const withExtra = bookingQuote(
    {
      ...booking(),
      treatments: [
        ...booking().treatments,
        {
          serviceId: "elysian-glow-8-in-1-pdt-led-light-therapy",
          optionIndex: 0,
        },
      ],
    },
    { now },
  );
  assert.equal(withExtra.totalPence, 7000);
  assert.equal(withExtra.amountDuePence, 3500);
  assert.equal(treatmentMinutes(withExtra.items), 70);
});

test("server rejects expired dates, missing eligibility, discount stacking and promotion add-ons", () => {
  for (const date of ["2026-10-31", "2026-11-09"]) {
    assert.throws(
      () => bookingQuote({ ...booking(), date }, { now }),
      /only available/,
    );
  }
  assert.throws(
    () => bookingQuote(booking(), { now: new Date("2026-11-09T00:00:00Z") }),
    /only available/,
  );
  assert.throws(
    () => bookingQuote({ ...booking(), firstVisitConfirmed: false }, { now }),
    /first treatment visit/,
  );
  assert.throws(
    () =>
      bookingQuote({ ...booking(), firstVisitConfirmed: undefined }, { now }),
    /first treatment visit/,
  );
  assert.throws(
    () =>
      bookingQuote(
        { ...booking(), isCourse: true, courseSessions: 5 },
        { now },
      ),
    /cannot be combined/,
  );
  assert.throws(
    () =>
      bookingQuote(
        {
          ...booking(),
          treatments: [
            { serviceId: "swedish-back-massage", optionIndex: 0 },
            ...booking().treatments,
          ],
        },
        { now },
      ),
    /primary treatment/,
  );
  assert.equal(
    facialBundleOptions(SPA_SERVICES).some(
      (p) => p.facialServiceId === WEEKLY_SPECIAL.id,
    ),
    false,
  );
  assert.equal(
    friendPackageOptions(SPA_SERVICES).some(
      (p) => p.pairedServiceId === WEEKLY_SPECIAL.id,
    ),
    false,
  );
});

test("booking API enforces offer terms while availability works before confirming first visit", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: now.getTime() });
  const store = new Store(":memory:");
  try {
    const app = createApp(
      {
        appUrl: origin,
        databasePath: ":memory:",
        ownerUsername: "owner",
        ownerPassword: "long-fixture-password",
      },
      store,
    );
    const availabilityBody = {
      date: "2026-11-01",
      treatments: booking().treatments,
      customTreatments: [],
      isCourse: false,
    };
    const available = await request(app)
      .post("/api/availability")
      .set("Origin", origin)
      .send(availabilityBody)
      .expect(200);
    assert.equal(available.body.durationMinutes, 50);
    assert.equal(available.body.breakMinutes, 30);
    assert.ok(available.body.slots.includes("10:00"));
    await request(app)
      .post("/api/availability")
      .set("Origin", origin)
      .send({ ...availabilityBody, date: "2026-11-09" })
      .expect(400);
    await request(app)
      .post("/api/bookings")
      .set("Origin", origin)
      .set("Idempotency-Key", randomUUID())
      .send({ ...booking(), firstVisitConfirmed: false })
      .expect(400);
    const created = await request(app)
      .post("/api/bookings")
      .set("Origin", origin)
      .set("Idempotency-Key", randomUUID())
      .send(booking())
      .expect(201);
    assert.equal(created.body.receipt.totalPence, 5000);
    assert.equal(created.body.receipt.amountDuePence, 2500);
    assert.equal(created.body.receipt.durationMinutes, 50);
    assert.equal(
      store.get(created.body.receipt.id)?.promotion?.firstVisitConfirmed,
      true,
    );
  } finally {
    store.close();
  }
});
