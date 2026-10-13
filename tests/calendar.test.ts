import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Stripe from "stripe";
import { createApp } from "../server/app";
import { Store } from "../server/store";
import {
  availability,
  entry,
  entries,
  saveEntry,
  treatmentMinutes,
  londonInstant,
  checkoutDeadline,
  makeEntry,
} from "../server/calendar";
import { DEFAULT_HOURS, shiftDate } from "../shared/calendar";
import { londonDate, type BookingRequest } from "../shared/payments";
import { testConsultation } from "./consultation-fixture";

const origin = "http://localhost:3000";
const customer = {
  name: "Calendar Test Client",
  email: "calendar@example.com",
  phone: "07707328060",
  notes: "",
};
const futureTuesday = () => {
  let date = shiftDate(londonDate(), 7);
  while (new Date(`${date}T12:00:00Z`).getUTCDay() !== 2)
    date = shiftDate(date, 1);
  return date;
};
const booking = (time = "13:00", optionIndex = 1): BookingRequest => ({
  consultation: testConsultation(),
  customer,
  date: futureTuesday(),
  time,
  treatments: [{ serviceId: "hydrodemabrasion-facial", optionIndex }],
  customTreatments: [],
  isCourse: false,
});
const resources: Store[] = [];
const directories: string[] = [];
afterEach(() => {
  for (const s of resources.splice(0)) s.close();
  for (const d of directories.splice(0))
    rmSync(d, { recursive: true, force: true });
});
function setup(path = ":memory:") {
  const store = new Store(path);
  resources.push(store);
  const sessions = new Map<string, Stripe.Checkout.Session>();
  let offline = false;
  let lost = false;
  const config = {
    appUrl: origin,
    databasePath: path,
    stripeSecretKey: "sk_test_fixture",
    webhookSecret: "whsec_calendar",
    ownerUsername: "owner",
    ownerPassword: "a-long-test-password",
  };
  const sdk = new Stripe("sk_test_fixture");
  const byKey = new Map<string, Stripe.Checkout.Session>();
  const fake = {
    webhooks: sdk.webhooks,
    checkout: {
      sessions: {
        create: async (
          p: Stripe.Checkout.SessionCreateParams,
          options: Stripe.RequestOptions,
        ) => {
          if (byKey.has(options.idempotencyKey!))
            return byKey.get(options.idempotencyKey!)!;
          const s = {
            id: `cs_test_${sessions.size}`,
            url: "https://checkout.stripe.com/test/calendar",
            currency: "gbp",
            amount_total: p.line_items![0].price_data!.unit_amount,
            status: "open",
            payment_status: "unpaid",
            client_reference_id: p.client_reference_id,
            metadata: p.metadata,
            expires_at: p.expires_at,
            payment_intent: `pi_${sessions.size}`,
            livemode: false,
          } as Stripe.Checkout.Session;
          sessions.set(s.id, s);
          byKey.set(options.idempotencyKey!, s);
          if (lost) {
            lost = false;
            throw new Error("Lost response");
          }
          return s;
        },
        retrieve: async (id: string) => {
          if (offline) throw new Error("Offline");
          return sessions.get(id)!;
        },
        expire: async (id: string) => {
          const s = sessions.get(id)!;
          if (s.status !== "open") throw new Error("Already completed");
          s.status = "expired";
          return s;
        },
      },
    },
  } as unknown as Stripe;
  const app = createApp(config, store, fake);
  const post = (path: string) =>
    request(app).post(`/api${path}`).set("Origin", origin);
  const submit = (body = booking(), key = randomUUID()) =>
    post("/bookings").set("Idempotency-Key", key).send(body);
  const available = (body = booking()) =>
    post("/availability").send({
      date: body.date,
      treatments: body.treatments,
      customTreatments: body.customTreatments,
      isCourse: body.isCourse,
      courseSessions: body.courseSessions,
      courseRewardSelection: body.courseRewardSelection,
    });
  const login = async () =>
    (
      await post("/owner/login")
        .send({ username: "owner", password: config.ownerPassword })
        .expect(200)
    ).headers["set-cookie"][0].split(";")[0] as string;
  const approve = (id: string, cookie: string) => ({
    expect: async (status: number) => {
      await request(app)
        .patch(`/api/owner/records/${id}/consultation`)
        .set("Origin", origin)
        .set("Cookie", cookie)
        .send({
          status: "approved",
          notes: "Fixture consultation completed",
          protocolChecked: true,
          consultationCompleted: true,
        })
        .expect(200);
      return post(`/owner/records/${id}/approve`)
        .set("Cookie", cookie)
        .send({ customPrices: [] })
        .expect(status);
    },
  });
  const cancel = (id: string, cookie: string) =>
    post(`/owner/calendar/${id}/cancel`).set("Cookie", cookie).send({});
  const ownerAdd = (body: object, cookie: string, key = randomUUID()) =>
    post("/owner/calendar")
      .set("Cookie", cookie)
      .set("Idempotency-Key", key)
      .send(body);
  return {
    store,
    sessions,
    app,
    post,
    submit,
    available,
    login,
    approve,
    cancel,
    ownerAdd,
    offline: () => {
      offline = true;
    },
    lost: () => {
      lost = true;
    },
  };
}

test("1pm hour treatment reserves until 2:30 and rejects overlaps in either direction", async () => {
  const f = setup();
  const result = await f.submit().expect(201);
  const id = result.body.receipt.id;
  assert.equal(entry(f.store, id)!.endTime, "14:00");
  assert.equal(entry(f.store, id)!.availableAfter, "14:30");
  const slots = (await f.available().expect(200)).body.slots as string[];
  assert.ok(!slots.includes("12:00"));
  assert.ok(!slots.includes("13:00"));
  assert.ok(!slots.includes("14:00"));
  assert.ok(slots.includes("14:30"));
  assert.ok(slots.includes("11:30"));
  for (const time of ["12:00", "13:30", "14:15"])
    await f.submit(booking(time)).expect(409);
  await f.submit(booking("14:30")).expect(201);
  assert.equal(f.store.list().length, 2);
});
test("different concurrent submissions reserve once; identical retries return the same record", async () => {
  const f = setup();
  const results = await Promise.all([f.submit(), f.submit()]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(entries(f.store).length, 1);
  const retry = setup();
  const key = randomUUID();
  const responses = await Promise.all(
    Array.from({ length: 5 }, () => retry.submit(booking(), key)),
  );
  assert.equal(new Set(responses.map((r) => r.body.receipt.id)).size, 1);
  assert.ok(responses.every((r) => [200, 201].includes(r.status)));
  assert.equal(entries(retry.store).length, 1);
  await retry.submit(booking("16:00"), key).expect(409);
});
test("overlap prevention and reservations survive separate app processes and database restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "elysian-calendar-"));
  directories.push(dir);
  const path = join(dir, "diary.sqlite");
  const one = setup(path);
  const two = setup(path);
  const result = await Promise.all([one.submit(), two.submit()]);
  assert.deepEqual(result.map((r) => r.status).sort(), [201, 409]);
  one.store.close();
  two.store.close();
  resources.splice(0, 2);
  const restarted = setup(path);
  const cookie = await restarted.login();
  const diary = await request(restarted.app)
    .get(`/api/owner/calendar?from=${futureTuesday()}&to=${futureTuesday()}`)
    .set("Cookie", cookie)
    .expect(200);
  assert.equal(diary.body.entries.length, 1);
  assert.equal(diary.body.entries[0].customerName, customer.name);
  await restarted.submit().expect(409);
});
test("calendar validates dates, closing time, slot boundaries, quantities and server duration", async () => {
  const f = setup();
  for (const body of [
    booking("08:00"),
    booking("19:00"),
    booking("13:07"),
    { ...booking(), date: shiftDate(futureTuesday(), -1) },
    { ...booking(), durationMinutes: 1 },
    { ...booking(), date: "2099-02-31" },
    { ...booking(), date: shiftDate(londonDate(), 91) },
  ])
    await f.submit(body).expect(400);
  await f.submit(booking("18:30")).expect(201);
  const monday = { ...booking(), date: shiftDate(futureTuesday(), -1) };
  const closed = await f.available(monday).expect(200);
  assert.equal(closed.body.closed, true);
  assert.deepEqual(closed.body.slots, []);
  const peel = await f
    .available({
      ...booking(),
      treatments: [
        { serviceId: "cliniccare-chemical-peeling", optionIndex: 0 },
      ],
    })
    .expect(200);
  assert.equal(peel.body.durationMinutes, 45);
  const combined = await f
    .available({
      ...booking(),
      treatments: [
        ...booking().treatments,
        { serviceId: "hot-stone-back-massage", optionIndex: 0 },
      ],
    })
    .expect(200);
  assert.equal(combined.body.durationMinutes, 90);
  const course = await f
    .available({ ...booking(), isCourse: true })
    .expect(200);
  assert.equal(course.body.durationMinutes, 60);
  const six = await f
    .available({
      ...booking(),
      isCourse: true,
      courseSessions: 6,
      courseRewardSelection: {
        serviceId: "swedish-full-body-massage",
        optionIndex: 0,
      },
    })
    .expect(200);
  assert.equal(six.body.durationMinutes, 60);
  const twin = await f
    .available({
      ...booking(),
      treatments: [{ serviceId: "bring-a-friend-package", optionIndex: 0 }],
    })
    .expect(200);
  assert.equal(twin.body.durationMinutes, 150);
  assert.equal(
    treatmentMinutes([
      {
        id: "course",
        name: "Course",
        quantity: 1,
        unitPricePence: 1,
        duration: "3 x 45 mins",
      },
    ]),
    45,
  );
});
test("approval holds expire automatically; expired requests cannot take a newly reserved time", async () => {
  const f = setup();
  const first = await f.submit().expect(201);
  const id = first.body.receipt.id;
  saveEntry(f.store, { ...entry(f.store, id)!, holdUntil: Date.now() - 1 });
  assert.ok((await f.available().expect(200)).body.slots.includes("13:00"));
  assert.equal(f.store.get(id)!.status, "expired");
  await f.submit().expect(201);
  const cookie = await f.login();
  await f.approve(id, cookie).expect(409);
  const receipt = await request(f.app)
    .get(`/api/receipts/${first.body.receiptToken}`)
    .expect(200);
  assert.equal(receipt.body.receipt.status, "expired");
});
test("payment close to expiry retains reservation even without return page; expired unpaid checkout releases it", async () => {
  const f = setup();
  const created = await f.submit().expect(201);
  const id = created.body.receipt.id;
  const cookie = await f.login();
  await f.approve(id, cookie).expect(200);
  const r = f.store.get(id)!;
  f.store.save({ ...r, expiresAt: Date.now() - 1 });
  const session = f.sessions.get(r.stripeSessionId!)!;
  session.status = "complete";
  session.payment_status = "paid";
  const feed = await f.available().expect(200);
  assert.ok(!feed.body.slots.includes("13:00"));
  assert.equal(entry(f.store, id)!.kind, "confirmed");
  assert.equal(f.store.get(id)!.paidPence, 3250);
  const unpaid = setup();
  const other = await unpaid.submit().expect(201);
  const otherCookie = await unpaid.login();
  await unpaid.approve(other.body.receipt.id, otherCookie).expect(200);
  const before = unpaid.store.get(other.body.receipt.id)!;
  unpaid.store.save({ ...before, expiresAt: Date.now() - 1 });
  unpaid.sessions.get(before.stripeSessionId!)!.status = "expired";
  assert.ok(
    (await unpaid.available().expect(200)).body.slots.includes("13:00"),
  );
  assert.equal(entry(unpaid.store, before.id)!.cancelled, true);
});
test("Stripe failures and open sessions never release an approved reservation", async () => {
  const f = setup();
  const created = await f.submit().expect(201);
  const id = created.body.receipt.id;
  const cookie = await f.login();
  f.lost();
  await f.approve(id, cookie).expect(500);
  assert.equal(entry(f.store, id)!.kind, "payment");
  await f.submit().expect(409);
  await f.approve(id, cookie).expect(200);
  assert.equal(f.sessions.size, 1);
  const r = f.store.get(id)!;
  f.store.save({ ...r, expiresAt: Date.now() - 1 });
  assert.ok(!(await f.available().expect(200)).body.slots.includes("13:00"));
  f.offline();
  await f.available().expect(500);
  assert.equal(entry(f.store, id)!.cancelled, false);
});
test("owner diary protects manual bookings and holidays, requires authentication, is idempotent and releases cancelled time", async () => {
  const f = setup();
  const cookie = await f.login();
  await request(f.app)
    .get(`/api/owner/calendar?from=${futureTuesday()}&to=${futureTuesday()}`)
    .expect(401);
  const data = {
    date: futureTuesday(),
    time: "13:00",
    durationMinutes: 60,
    kind: "manual",
    title: "Phone booking",
    customerName: "Private Client",
    phone: "01234567",
    notes: "Private diary note",
  };
  const key = randomUUID();
  await f.ownerAdd(data, "").expect(401);
  const one = await f.ownerAdd(data, cookie, key).expect(201);
  const two = await f.ownerAdd(data, cookie, key).expect(200);
  assert.equal(one.body.entry.id, two.body.entry.id);
  await f.submit().expect(409);
  const publicFeed = await f.available().expect(200);
  assert.ok(!JSON.stringify(publicFeed.body).includes("Private"));
  await f.cancel(one.body.entry.id, cookie).expect(200);
  await f.cancel(one.body.entry.id, cookie).expect(200);
  assert.ok((await f.available().expect(200)).body.slots.includes("13:00"));
  const holiday = await f
    .ownerAdd(
      {
        ...data,
        kind: "block",
        time: "00:00",
        durationMinutes: 1440,
        title: "Holiday",
      },
      cookie,
    )
    .expect(201);
  assert.deepEqual((await f.available().expect(200)).body.slots, []);
  assert.equal(holiday.body.entry.breakMinutes, 0);
});
test("cancelling active checkout expires its link first; paid cancellation preserves verified receipt and repeated webhooks", async () => {
  const f = setup();
  const created = await f.submit().expect(201);
  const id = created.body.receipt.id;
  const cookie = await f.login();
  await f.approve(id, cookie).expect(200);
  const session = f.sessions.get(f.store.get(id)!.stripeSessionId!)!;
  await f.cancel(id, cookie).expect(200);
  assert.equal(session.status, "expired");
  assert.equal(f.store.get(id)!.status, "cancelled");
  const cancelledReceipt = await request(f.app)
    .get(`/api/receipts/${created.body.receiptToken}`)
    .expect(200);
  assert.equal(cancelledReceipt.body.receipt.status, "cancelled");
  await f.approve(id, cookie).expect(409);
  await f.submit().expect(201);
  const paid = setup();
  const other = await paid.submit().expect(201);
  const oid = other.body.receipt.id;
  const pc = await paid.login();
  await paid.approve(oid, pc).expect(200);
  const ps = paid.sessions.get(paid.store.get(oid)!.stripeSessionId!)!;
  ps.status = "complete";
  ps.payment_status = "paid";
  await paid.cancel(oid, pc).expect(409);
  assert.equal(entry(paid.store, oid)!.cancelled, false);
  await request(paid.app)
    .get(`/api/receipts/${other.body.receiptToken}`)
    .expect(200);
  await paid.cancel(oid, pc).expect(200);
  const final = await request(paid.app)
    .get(`/api/receipts/${other.body.receiptToken}`)
    .expect(200);
  assert.equal(final.body.receipt.status, "cancelled");
  assert.equal(final.body.receipt.paidPence, 3250);
  assert.equal(final.body.receipt.refundedPence, 0);
  const payload = JSON.stringify({
    id: "evt_calendar_repeat",
    type: "checkout.session.completed",
    livemode: false,
    data: { object: { id: ps.id } },
  });
  await request(paid.app)
    .post("/api/stripe/webhook")
    .set("Content-Type", "application/json")
    .set(
      "Stripe-Signature",
      new Stripe("sk_test_fixture").webhooks.generateTestHeaderString({
        payload,
        secret: "whsec_calendar",
      }),
    )
    .send(payload)
    .expect(200);
  assert.equal(paid.store.get(oid)!.status, "cancelled");
  assert.equal(entry(paid.store, oid)!.cancelled, true);
});
test("opening hours are owner controlled; changes retain existing reservations", async () => {
  const f = setup();
  const cookie = await f.login();
  const result = await f.submit().expect(201);
  const patch = (body: object) =>
    request(f.app)
      .patch("/api/owner/calendar/hours")
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send(body);
  await patch({ hours: [] }).expect(400);
  await patch({
    hours: DEFAULT_HOURS.map((d) => ({ ...d, open: "20:00", close: "10:00" })),
  }).expect(400);
  await patch({
    hours: DEFAULT_HOURS.map((d) => ({ ...d, enabled: false })),
  }).expect(200);
  assert.deepEqual((await f.available().expect(200)).body.slots, []);
  assert.equal(entry(f.store, result.body.receipt.id)!.cancelled, false);
  const response = await request(f.app).get("/api/calendar/hours").expect(200);
  assert.ok(response.body.hours.every((d: { enabled: boolean }) => !d.enabled));
});

test("UK summer/winter times and daylight-saving transitions are handled safely", () => {
  assert.equal(
    londonInstant("2026-10-13", "13:00"),
    Date.parse("2026-10-13T12:00:00Z"),
  );
  assert.equal(
    londonInstant("2026-12-13", "13:00"),
    Date.parse("2026-12-13T13:00:00Z"),
  );
  assert.throws(() => londonInstant("2026-10-25", "01:30"), /daylight-saving/);
  assert.throws(() => londonInstant("2027-03-28", "01:30"), /daylight-saving/);
  const details = {
    date: "2026-10-25",
    time: "00:30",
    durationMinutes: 180,
    kind: "manual" as const,
    title: "Test",
    customerName: "Test Client",
    phone: "",
    notes: "",
  };
  assert.throws(() => makeEntry(details), /daylight-saving/);
  assert.equal(
    makeEntry({
      ...details,
      kind: "block",
      time: "00:00",
      durationMinutes: 1440,
    }).availableAfter,
    "24:00",
  );
});
test("deposit and request deadlines cannot extend beyond appointment start", async () => {
  const f = setup();
  const tomorrow = shiftDate(londonDate(), 1);
  const record = (await f.submit().expect(201)).body.receipt;
  const appointment = {
    ...f.store.get(record.id)!,
    date: tomorrow,
    time: "10:00",
  };
  assert.equal(
    checkoutDeadline(appointment),
    Math.min(
      (Math.floor(Date.now() / 1000) + 86400) * 1000,
      londonInstant(tomorrow, "10:00"),
    ),
  );
  assert.throws(
    () =>
      checkoutDeadline({
        ...appointment,
        date: londonDate(),
        time: new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/London",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
      }),
    /31 minutes/,
  );
});
test("persistent booking rate limits roll back rejected reservations and permit identical retries", async () => {
  const f = setup();
  const key = randomUUID();
  await f.submit(booking("10:00"), key).expect(201);
  for (const time of ["11:30", "13:00", "14:30", "16:00", "17:30"])
    await f.submit(booking(time)).expect(201);
  await f
    .submit({ ...booking(), date: shiftDate(futureTuesday(), 7) })
    .expect(429);
  assert.equal(entries(f.store).length, 6);
  assert.equal(f.store.list().length, 6);
  await f.submit(booking("10:00"), key).expect(200);
});
