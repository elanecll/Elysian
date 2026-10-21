import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import Stripe from "stripe";
import { createApp } from "../server/app";
import { Store } from "../server/store";
import { loadConfig } from "../server/config";
import {
  londonDate,
  courseOfferDescription,
  type BookingRequest,
  type Receipt,
} from "../shared/payments";
import {
  bookingQuote,
  bookingSchema,
  shopQuote,
  shopSchema,
} from "../server/catalogue";
import { SPA_SERVICES } from "../src/data/spaData";
import { SPA_PRODUCTS } from "../src/data/shopData";
import { FACIAL_BUNDLE_ID } from "../shared/facialBundle";
import { bookingTotals } from "../shared/bookingPricing";
import { treatmentMinutes } from "../server/calendar";
import { testConsultation } from "./consultation-fixture";
import { saveConsultation, getConsultation } from "../server/consultation";

const origin = "http://localhost:3000";
const secret = "whsec_automated_fixture";
const customer = {
  name: "Test Customer",
  email: "test@example.com",
  phone: "+44 7707 328060",
  notes: "",
};
const shop = {
  customer,
  items: [{ productId: "tropic-skincare-kit-1", quantity: 1 }],
  deliveryOption: "collection" as const,
  deliveryAddress: "",
  promoCode: "ELYSIAN10",
};
const bookingDate = () => {
  const date = new Date(Date.now() + 3 * 86400000);
  while (date.getUTCDay() !== 2) date.setUTCDate(date.getUTCDate() + 1);
  return londonDate(date);
};
const booking = (): BookingRequest => ({
  consultation: testConsultation(),
  customer,
  treatments: [{ serviceId: "hydrodemabrasion-facial", optionIndex: 0 }],
  customTreatments: [],
  date: bookingDate(),
  time: "11:00",
  isCourse: false,
});
const bundleBooking = (
  facialId = "radio-frequency-facial",
  facialOptionIndex = 0,
): BookingRequest => ({
  ...booking(),
  treatments: [
    {
      serviceId: FACIAL_BUNDLE_ID,
      optionIndex: SPA_SERVICES.find(
        (service) => service.id === FACIAL_BUNDLE_ID,
      )!.priceOptions!.findIndex(
        (option) =>
          option.facialServiceId === facialId &&
          option.facialOptionIndex === facialOptionIndex,
      ),
    },
  ],
  consultation: testConsultation([FACIAL_BUNDLE_ID]),
  bundleProducts: [{ productId: "tropic-skincare-kit-1", quantity: 2 }],
});
const resources: { store: Store; directory?: string }[] = [];
afterEach(() => {
  for (const resource of resources.splice(0)) {
    resource.store.close();
    if (resource.directory)
      rmSync(resource.directory, { recursive: true, force: true });
  }
});

function setup(path = ":memory:") {
  const store = new Store(path);
  resources.push({ store });
  const sdk = new Stripe("sk_test_fixture");
  const sessions = new Map<string, Stripe.Checkout.Session>();
  const charges = new Map<string, Stripe.Charge>();
  const intents = new Map<string, Stripe.PaymentIntent>();
  const creations: Stripe.Checkout.SessionCreateParams[] = [];
  const keys = new Map<
    string,
    { payload: string; session: Stripe.Checkout.Session }
  >();
  let failAfterCreate = false;
  const fake = {
    webhooks: sdk.webhooks,
    checkout: {
      sessions: {
        create: async (
          params: Stripe.Checkout.SessionCreateParams,
          options: Stripe.RequestOptions,
        ) => {
          const key = options.idempotencyKey!;
          const previous = keys.get(key);
          if (previous) {
            assert.equal(
              JSON.stringify(params),
              previous.payload,
              "Idempotent retries must preserve all Stripe parameters",
            );
            return previous.session;
          }
          creations.push(params);
          const id = `cs_test_${creations.length}`;
          const amount = params.line_items![0].price_data!.unit_amount!;
          const intentId = `pi_test_${creations.length}`;
          const session = {
            id,
            url: `https://checkout.stripe.com/test/${id}`,
            mode: "payment",
            currency: "gbp",
            amount_total: amount,
            payment_status: "unpaid",
            status: "open",
            livemode: false,
            payment_intent: intentId,
            client_reference_id: params.client_reference_id,
            metadata: params.metadata,
            expires_at: params.expires_at,
          } as Stripe.Checkout.Session;
          sessions.set(id, session);
          intents.set(intentId, {
            id: intentId,
            metadata: params.payment_intent_data?.metadata,
            amount,
            currency: "gbp",
            livemode: false,
            status: "requires_payment_method",
          } as Stripe.PaymentIntent);
          keys.set(key, { payload: JSON.stringify(params), session });
          if (failAfterCreate) {
            failAfterCreate = false;
            throw new Error(
              "Fixture transport disconnected after Stripe accepted the request",
            );
          }
          return session;
        },
        retrieve: async (id: string) => {
          const session = sessions.get(id);
          if (!session) throw new Error("No fixture session");
          return session;
        },
      },
    },
    charges: { retrieve: async (id: string) => charges.get(id)! },
    paymentIntents: { retrieve: async (id: string) => intents.get(id)! },
  } as unknown as Stripe;
  const config = {
    appUrl: origin,
    stripeSecretKey: "sk_test_fixture",
    webhookSecret: secret,
    ownerUsername: "owner",
    ownerPassword: "a-long-test-password",
    databasePath: path,
  };
  const app = createApp(config, store, fake);
  const post = (path: string) => request(app).post(path).set("Origin", origin);
  async function login() {
    const response = await post("/api/owner/login")
      .send({ username: "owner", password: config.ownerPassword })
      .expect(200);
    return response.headers["set-cookie"][0].split(";")[0] as string;
  }
  async function createShop(key = randomUUID(), data = shop) {
    return (
      await post("/api/shop/checkout")
        .set("Idempotency-Key", key)
        .send(data)
        .expect(200)
    ).body as { url: string; receiptToken: string };
  }
  async function createBooking(data = booking()) {
    const response = (
      await post("/api/bookings")
        .set("Idempotency-Key", randomUUID())
        .send({
          ...data,
          consultation: testConsultation(
            data.treatments.map((t) => t.serviceId),
            data.customTreatments.length > 0,
          ),
        })
        .expect(201)
    ).body as { receipt: Receipt; receiptToken: string };
    // Payment tests start after a completed consultation; intake/gating is exercised separately.
    await saveConsultation(store, response.receipt.id, {
      ...(await getConsultation(store, response.receipt.id))!,
      status: "approved",
      protocolChecked: true,
      consultationCompleted: true,
    });
    store.save({
      ...store.get(response.receipt.id)!,
      consultationStatus: "approved",
    });
    return response;
  }
  async function webhook(
    type: string,
    object: { id: string },
    id = `evt_${randomUUID()}`,
  ) {
    const payload = JSON.stringify({
      id,
      type,
      livemode: false,
      data: { object },
    });
    const signature = sdk.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    return request(app)
      .post("/api/stripe/webhook")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", signature)
      .send(payload);
  }
  function pay(sessionId: string) {
    const session = sessions.get(sessionId)!;
    session.payment_status = "paid";
    session.status = "complete";
    return session;
  }
  return {
    store,
    app,
    post,
    login,
    createShop,
    createBooking,
    webhook,
    pay,
    sessions,
    charges,
    intents,
    creations,
    fake,
    config,
    disconnectNextCreate: () => {
      failAfterCreate = true;
    },
  };
}

test("catalogue quotes use integer pennies including discount and postage", () => {
  const quote = shopQuote(
    shopSchema.parse({
      ...shop,
      deliveryOption: "delivery",
      deliveryAddress: "12 Test Road, London, SW1A 1AA",
    }),
  );
  assert.equal(quote.subtotalPence, 3400);
  assert.equal(quote.discountPence, 340);
  assert.equal(quote.shippingPence, 395);
  assert.equal(quote.totalPence, 3455);
  assert.equal(
    shopQuote(
      shopSchema.parse({
        ...shop,
        items: [{ productId: shop.items[0].productId, quantity: 2 }],
        deliveryOption: "delivery",
        deliveryAddress: "12 Test Road, London",
      }),
    ).shippingPence,
    0,
  );
});
test("shop payment is unpaid until verified and paid on signed webhook without browser return", async () => {
  const f = setup();
  const result = await f.createShop();
  const record = f.store.byReceipt(result.receiptToken)!;
  assert.equal(record.paidPence, 0);
  assert.equal(record.status, "awaiting_payment");
  assert.equal(f.creations[0].line_items![0].price_data!.unit_amount, 3060);
  f.pay(record.stripeSessionId!);
  await f
    .webhook("checkout.session.completed", { id: record.stripeSessionId! })
    .then((r) => assert.equal(r.status, 200));
  const paid = f.store.get(record.id)!;
  assert.equal(paid.paymentStatus, "paid");
  assert.equal(paid.paidPence, 3060);
  assert.equal(paid.status, "confirmed");
});
test("signed events are not trusted if Stripe still reports unpaid", async () => {
  const f = setup();
  const result = await f.createShop();
  const record = f.store.byReceipt(result.receiptToken)!;
  await f.webhook("checkout.session.completed", {
    id: record.stripeSessionId!,
  });
  assert.equal(f.store.get(record.id)!.paidPence, 0);
});
test("repeat events and simultaneous duplicate submissions do not duplicate sales or revenue", async () => {
  const f = setup();
  const key = randomUUID();
  const [one, two] = await Promise.all([f.createShop(key), f.createShop(key)]);
  assert.equal(one.receiptToken, two.receiptToken);
  assert.equal(f.store.list().length, 1);
  assert.equal(f.creations.length, 1);
  const record = f.store.byReceipt(one.receiptToken)!;
  f.pay(record.stripeSessionId!);
  const responses = await Promise.all([
    f.webhook(
      "checkout.session.completed",
      { id: record.stripeSessionId! },
      "evt_repeat",
    ),
    f.webhook(
      "checkout.session.completed",
      { id: record.stripeSessionId! },
      "evt_repeat",
    ),
  ]);
  assert.ok(responses.every((r) => r.status === 200));
  assert.equal(f.store.get(record.id)!.paidPence, 3060);
  await f.webhook("checkout.session.completed", {
    id: record.stripeSessionId!,
  });
  assert.equal(f.store.get(record.id)!.paidPence, 3060);
});
test("request retries after a lost Stripe response reuse identical persisted parameters", async () => {
  const f = setup();
  const key = randomUUID();
  f.disconnectNextCreate();
  await f
    .post("/api/shop/checkout")
    .set("Idempotency-Key", key)
    .send(shop)
    .expect(500);
  await f.createShop(key);
  assert.equal(f.creations.length, 1);
  assert.equal(f.store.list().length, 1);
});
test("price tampering, bad quantities, unknown products and missing delivery addresses are rejected", async () => {
  const f = setup();
  for (const body of [
    { ...shop, totalPence: 1 },
    { ...shop, items: [{ productId: shop.items[0].productId, quantity: 0 }] },
    { ...shop, items: [{ productId: shop.items[0].productId, quantity: 1.5 }] },
    { ...shop, items: [{ productId: "not-a-product", quantity: 1 }] },
    { ...shop, deliveryOption: "delivery" },
    { ...shop, items: [{ ...shop.items[0], unitPrice: 0.01 }] },
    { ...shop, promoCode: "FAKE" },
    { ...shop, customer: { ...customer, name: "", phone: "" } },
  ]) {
    await f
      .post("/api/shop/checkout")
      .set("Idempotency-Key", randomUUID())
      .send(body)
      .expect(400);
  }
  assert.equal(f.store.list().length, 0);
  assert.equal(f.creations.length, 0);
});
test("a submission key cannot be reused for different details", async () => {
  const f = setup();
  const key = randomUUID();
  await f.createShop(key);
  await f
    .post("/api/shop/checkout")
    .set("Idempotency-Key", key)
    .send({ ...shop, promoCode: "" })
    .expect(409);
});
test("booking requests stay unpaid until owner approval and verified deposit", async () => {
  const f = setup();
  const result = await f.createBooking();
  assert.equal(f.creations.length, 0);
  assert.equal(f.store.get(result.receipt.id)!.status, "requested");
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .send({ customPrices: [] })
    .expect(401);
  const cookie = await f.login();
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [] })
    .expect(200);
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [] })
    .expect(200);
  assert.equal(f.creations.length, 1);
  const record = f.store.get(result.receipt.id)!;
  assert.equal(record.amountDuePence, 3250);
  assert.equal(record.status, "awaiting_payment");
  assert.ok(record.expiresAt! - Date.now() <= 86400000);
  f.pay(record.stripeSessionId!);
  await f.webhook("checkout.session.completed", {
    id: record.stripeSessionId!,
  });
  const paid = f.store.get(record.id)!;
  assert.equal(paid.totalPence, 6500);
  assert.equal(paid.paidPence, 3250);
  assert.equal(paid.totalPence - paid.paidPence, 3250);
});
test("standalone treatments can be requested individually but reject combined bookings", async () => {
  const f = setup();
  for (const [serviceId, totalPence] of [
    ["carboxytherapy-face-mask-treatment", 5000],
    ["cliniccare-chemical-peeling", 6000],
  ] as const) {
    const standalone = { serviceId, optionIndex: 0 };
    const result = await f.createBooking({
      ...booking(),
      treatments: [standalone],
      time: serviceId === "cliniccare-chemical-peeling" ? "12:30" : "11:00",
    });
    assert.equal(f.store.get(result.receipt.id)!.totalPence, totalPence);
    for (const treatments of [
      [standalone, { serviceId: "indian-head-massage-addon", optionIndex: 0 }],
      [...booking().treatments, standalone],
    ]) {
      await f
        .post("/api/bookings")
        .set("Idempotency-Key", randomUUID())
        .send({ ...booking(), treatments })
        .expect(400);
    }
    await f
      .post("/api/bookings")
      .set("Idempotency-Key", randomUUID())
      .send({
        ...booking(),
        treatments: [standalone],
        customTreatments: [{ title: "Custom massage", durationMinutes: 30 }],
      })
      .expect(400);
  }
  assert.equal(f.store.list().length, 2);
});
test("removed add-ons cannot be requested through the booking API", async () => {
  const f = setup();
  for (const serviceId of ["addon-eye-lip-rescue", "addon-cold-hammer"]) {
    await f
      .post("/api/bookings")
      .set("Idempotency-Key", randomUUID())
      .send({
        ...booking(),
        treatments: [...booking().treatments, { serviceId, optionIndex: 0 }],
      })
      .expect(400);
  }
  assert.equal(f.store.list().length, 0);
});
test("back massage additions are included in the server quote and deposit", async () => {
  const f = setup();
  const result = await f.createBooking({
    ...booking(),
    treatments: [
      ...booking().treatments,
      { serviceId: "swedish-back-massage", optionIndex: 0 },
      { serviceId: "hot-stone-back-massage", optionIndex: 0 },
    ],
  });
  const record = f.store.get(result.receipt.id)!;
  assert.equal(record.items.length, 3);
  assert.equal(record.totalPence, 13500);
  assert.equal(record.amountDuePence, 6750);
});
test("custom treatment quotes require explicit owner prices and preserve course pricing", async () => {
  const f = setup();
  const data = {
    ...booking(),
    isCourse: true,
    customTreatments: [{ title: "Custom massage", durationMinutes: 30 }],
  };
  const result = await f.createBooking(data);
  const cookie = await f.login();
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [] })
    .expect(400);
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [{ id: "custom-0", pricePence: 2502 }] })
    .expect(200);
  const record = f.store.get(result.receipt.id)!;
  assert.equal(record.subtotalPence, 45010);
  assert.equal(record.discountPence, 4501);
  assert.equal(record.totalPence, 40509);
  assert.equal(record.amountDuePence, 20255);
  await f
    .post(`/api/owner/records/${record.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [{ id: "custom-0", pricePence: 2600 }] })
    .expect(409);
});
test("new courses apply the discount to booking, receipt, owner approval and Stripe deposit", async () => {
  for (const [sessions, subtotal, discount, total, deposit] of [
    [5, 30000, 3000, 27000, 13500],
    [10, 60000, 9000, 51000, 25500],
  ] as const) {
    const f = setup();
    const result = await f.createBooking({
      ...booking(),
      isCourse: true,
      courseSessions: sessions,
      treatments: [{ serviceId: "swedish-full-body-massage", optionIndex: 0 }],
    });
    const record = f.store.get(result.receipt.id)!;
    assert.equal(record.items[0].quantity, sessions);
    assert.equal(record.courseSessions, sessions);
    assert.equal(record.subtotalPence, subtotal);
    assert.equal(record.discountPence, discount);
    assert.equal(record.totalPence, total);
    assert.equal(record.amountDuePence, deposit);
    assert.equal(record.courseReward, undefined);
    assert.equal(record.durationMinutes, 60);
    assert.equal(result.receipt.courseSessions, sessions);
    assert.equal(result.receipt.totalPence, total);
    const receipt = await request(f.app)
      .get(`/api/receipts/${result.receiptToken}`)
      .expect(200);
    assert.equal(receipt.body.receipt.totalPence, total);
    const cookie = await f.login();
    await f
      .post(`/api/owner/records/${record.id}/approve`)
      .set("Cookie", cookie)
      .send({ customPrices: [] })
      .expect(200);
    const approved = f.store.get(record.id)!;
    assert.equal(approved.totalPence, total);
    assert.equal(approved.discountPence, discount);
    assert.equal(approved.amountDuePence, deposit);
    assert.equal(
      f.sessions.get(approved.stripeSessionId!)!.amount_total,
      deposit,
    );
    const owner = await request(f.app)
      .get("/api/owner/records")
      .set("Cookie", cookie)
      .expect(200);
    assert.equal(owner.body.records[0].courseSessions, sessions);
    assert.equal(owner.body.records[0].totalPence, total);
  }
});
test("course discounts include selected add-ons", () => {
  const quote = bookingQuote({
    ...booking(),
    isCourse: true,
    courseSessions: 10,
    treatments: [
      ...booking().treatments,
      { serviceId: "swedish-back-massage", optionIndex: 0 },
    ],
  });
  assert.equal(quote.subtotalPence, 95000);
  assert.equal(quote.discountPence, 14250);
  assert.equal(quote.totalPence, 80750);
  assert.equal(quote.amountDuePence, 40375);
});
test("retired offers and client-supplied discounts or free rewards cannot create new bookings", () => {
  for (const extra of [
    { courseSessions: 3 },
    { courseSessions: 6 },
    { courseSessions: 12 },
    { courseSessions: 5, discountPence: 10000 },
    {
      courseSessions: 10,
      courseRewardSelection: {
        serviceId: "swedish-full-body-massage",
        optionIndex: 0,
      },
    },
  ])
    assert.equal(
      bookingSchema.safeParse({ ...booking(), isCourse: true, ...extra })
        .success,
      false,
    );
  assert.throws(
    () => bookingQuote({ ...booking(), isCourse: false, courseSessions: 5 }),
    /Select a course/,
  );
  const single = bookingQuote(booking());
  assert.equal(single.items[0].quantity, 1);
  assert.equal(single.discountPence, 0);
  assert.equal(single.totalPence, 6500);
});
test("existing complimentary course records retain their recorded terms after approval", async () => {
  for (const sessions of [3, 6] as const) {
    const f = setup();
    const result = await f.createBooking();
    const record = f.store.get(result.receipt.id)!;
    record.isCourse = true;
    record.courseSessions = sessions;
    record.items.forEach((item) => {
      item.quantity = sessions;
    });
    record.courseReward = {
      name:
        sessions === 3
          ? "Free £30 Cinderella / Black Tie Facial"
          : "Free treatment worth £60",
      valuePence: sessions === 3 ? 3000 : 6000,
    };
    record.subtotalPence = record.totalPence = 6500 * sessions;
    record.amountDuePence = Math.round(record.totalPence / 2);
    f.store.save(record);
    const cookie = await f.login();
    await f
      .post(`/api/owner/records/${record.id}/approve`)
      .set("Cookie", cookie)
      .send({ customPrices: [] })
      .expect(200);
    const approved = f.store.get(record.id)!;
    assert.equal(approved.totalPence, 6500 * sessions);
    assert.equal(approved.discountPence, 0);
    assert.deepEqual(approved.courseReward, record.courseReward);
    assert.match(courseOfferDescription(approved), /free|Free/);
  }
});
test("past and impossible dates, price tampering and invalid treatment options are rejected", async () => {
  const f = setup();
  for (const body of [
    { ...booking(), date: "2000-01-01" },
    { ...booking(), date: "2099-02-31" },
    { ...booking(), totalPence: 100 },
    {
      ...booking(),
      treatments: [{ serviceId: "hydrodemabrasion-facial", optionIndex: 9 }],
    },
    {
      ...booking(),
      customTreatments: [
        { title: "Custom", durationMinutes: 30, pricePence: 1 },
      ],
    },
  ])
    await f
      .post("/api/bookings")
      .set("Idempotency-Key", randomUUID())
      .send(body)
      .expect(400);
  assert.equal(f.store.list().length, 0);
});
test("owner authentication is server-side, rate limited, private and revocable", async () => {
  const f = setup();
  await request(f.app).get("/api/owner/records").expect(401);
  await request(f.app)
    .get("/api/owner/records")
    .set("Cookie", "elysian_session=fabricated")
    .expect(401);
  const cookie = await f.login();
  const response = await request(f.app)
    .get("/api/owner/records")
    .set("Cookie", cookie)
    .expect(200);
  assert.deepEqual(response.body.records, []);
  await f.post("/api/owner/logout").set("Cookie", cookie).send({}).expect(200);
  await request(f.app)
    .get("/api/owner/session")
    .set("Cookie", cookie)
    .expect(401);
  for (let i = 0; i < 5; i++)
    await f
      .post("/api/owner/login")
      .send({ username: "owner", password: "incorrect" })
      .expect(401);
  await f
    .post("/api/owner/login")
    .send({ username: "owner", password: "a-long-test-password" })
    .expect(429);
});
test("owner cookies are HttpOnly and SameSite strict and expired sessions are rejected", async () => {
  const f = setup();
  const response = await f
    .post("/api/owner/login")
    .send({ username: "owner", password: "a-long-test-password" })
    .expect(200);
  const cookie = response.headers["set-cookie"][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Max-Age=14400/);
  f.store.db.prepare("UPDATE sessions SET expires_at=?").run(Date.now() - 1);
  await request(f.app)
    .get("/api/owner/session")
    .set("Cookie", cookie.split(";")[0])
    .expect(401);
});
test("cross-origin browser mutations and missing signatures are rejected", async () => {
  const f = setup();
  await request(f.app)
    .post("/api/bookings")
    .set("Origin", "https://attacker.example")
    .send(booking())
    .expect(403);
  await request(f.app)
    .post("/api/owner/login")
    .send({ username: "owner", password: "a-long-test-password" })
    .expect(403);
  await request(f.app)
    .post("/api/stripe/webhook")
    .set("Content-Type", "application/json")
    .send("{}")
    .expect(400);
  await request(f.app)
    .post("/api/stripe/webhook")
    .set("Stripe-Signature", "invalid")
    .set("Content-Type", "application/json")
    .send("{}")
    .expect(400);
});
test("webhook signatures validate exact raw bytes and amount/currency/reference mismatches reject payment", async () => {
  const f = setup();
  const created = await f.createShop();
  const record = f.store.byReceipt(created.receiptToken)!;
  const session = f.pay(record.stripeSessionId!);
  for (const change of [
    { currency: "usd" },
    { amount_total: 1 },
    { client_reference_id: "different-order" },
    { livemode: true },
  ]) {
    const original = { ...session };
    Object.assign(session, change);
    const response = await f.webhook("checkout.session.completed", {
      id: session.id,
    });
    assert.equal(response.status, 400);
    Object.assign(session, original);
    assert.equal(f.store.get(record.id)!.paidPence, 0);
  }
  const payload = JSON.stringify(
    {
      id: "evt_bytes",
      type: "checkout.session.completed",
      livemode: false,
      data: { object: { id: session.id } },
    },
    null,
    2,
  );
  const sdk = new Stripe("sk_test_fixture");
  await request(f.app)
    .post("/api/stripe/webhook")
    .set("Content-Type", "application/json")
    .set(
      "Stripe-Signature",
      sdk.webhooks.generateTestHeaderString({ payload, secret }),
    )
    .send(payload)
    .expect(200);
  assert.equal(f.store.get(record.id)!.paymentStatus, "paid");
});
test("return status verifies via Stripe API and exposes no customer contact details", async () => {
  const f = setup();
  const result = await f.createShop();
  const record = f.store.byReceipt(result.receiptToken)!;
  const unpaid = await request(f.app)
    .get(`/api/receipts/${result.receiptToken}`)
    .expect(200);
  assert.equal(unpaid.body.receipt.paymentStatus, "unpaid");
  assert.equal(unpaid.body.receipt.customer, undefined);
  f.pay(record.stripeSessionId!);
  const paid = await request(f.app)
    .get(`/api/receipts/${result.receiptToken}`)
    .expect(200);
  assert.equal(paid.body.receipt.paidPence, 3060);
  assert.equal(paid.body.checkoutUrl, undefined);
  await request(f.app).get("/api/receipts/not-a-token").expect(404);
  await request(f.app)
    .get(`/api/receipts/${"a".repeat(64)}`)
    .expect(404);
});
test("expired booking checkout requires reapproval and creates a new attempt", async () => {
  const f = setup();
  const result = await f.createBooking();
  const cookie = await f.login();
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [] })
    .expect(200);
  const old = f.store.get(result.receipt.id)!;
  f.sessions.get(old.stripeSessionId!)!.status = "expired";
  await f.webhook("checkout.session.expired", { id: old.stripeSessionId! });
  assert.equal(f.store.get(old.id)!.paymentStatus, "expired");
  await f
    .post(`/api/owner/records/${old.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [] })
    .expect(200);
  const next = f.store.get(old.id)!;
  assert.equal(next.revision, 2);
  assert.notEqual(next.stripeSessionId, old.stripeSessionId);
  assert.equal(next.paymentStatus, "unpaid");
  // A delayed event from the old attempt cannot expire the new one.
  await f.webhook("checkout.session.expired", { id: old.stripeSessionId! });
  assert.equal(f.store.get(old.id)!.status, "awaiting_payment");
});
test("decline is distinct from unpaid and can recover to paid without duplicate amounts", async () => {
  const f = setup();
  const created = await f.createShop();
  const record = f.store.byReceipt(created.receiptToken)!;
  const intent = f.sessions.get(record.stripeSessionId!)!
    .payment_intent as string;
  await f.webhook("payment_intent.payment_failed", { id: intent });
  assert.equal(f.store.get(record.id)!.paymentStatus, "failed");
  assert.equal(f.store.get(record.id)!.paidPence, 0);
  f.pay(record.stripeSessionId!);
  await f.webhook("checkout.session.completed", {
    id: record.stripeSessionId!,
  });
  assert.equal(f.store.get(record.id)!.paymentStatus, "paid");
  await f.webhook("payment_intent.payment_failed", { id: intent });
  assert.equal(f.store.get(record.id)!.paymentStatus, "paid");
});
test("refunds are cumulative, monotonic and do not get reset by duplicate paid events", async () => {
  const f = setup();
  const created = await f.createShop();
  const record = f.store.byReceipt(created.receiptToken)!;
  const session = f.pay(record.stripeSessionId!);
  await f.webhook("checkout.session.completed", { id: session.id });
  const charge = {
    id: "ch_test",
    payment_intent: session.payment_intent,
    livemode: false,
    currency: "gbp",
    amount: 3060,
    amount_refunded: 1000,
  } as Stripe.Charge;
  f.charges.set(charge.id, charge);
  await f.webhook("charge.refunded", { id: charge.id });
  assert.equal(f.store.get(record.id)!.paymentStatus, "partially_refunded");
  charge.amount_refunded = 3060;
  await f.webhook("charge.refunded", { id: charge.id });
  assert.equal(f.store.get(record.id)!.paymentStatus, "refunded");
  await f.webhook("checkout.session.completed", { id: session.id });
  assert.equal(f.store.get(record.id)!.refundedPence, 3060);
  assert.equal(f.store.get(record.id)!.paymentStatus, "refunded");
});
test("owner cannot mark unpaid records fulfilled or forge payment totals", async () => {
  const f = setup();
  const created = await f.createShop();
  const record = f.store.byReceipt(created.receiptToken)!;
  const cookie = await f.login();
  await request(f.app)
    .patch(`/api/owner/records/${record.id}`)
    .set("Origin", origin)
    .set("Cookie", cookie)
    .send({ status: "dispatched" })
    .expect(409);
  await request(f.app)
    .patch(`/api/owner/records/${record.id}`)
    .set("Origin", origin)
    .set("Cookie", cookie)
    .send({ paidPence: 3060 })
    .expect(400);
  f.pay(record.stripeSessionId!);
  await f.webhook("checkout.session.completed", {
    id: record.stripeSessionId!,
  });
  await request(f.app)
    .patch(`/api/owner/records/${record.id}`)
    .set("Origin", origin)
    .set("Cookie", cookie)
    .send({ status: "dispatched", ownerNotes: "Posted" })
    .expect(200);
  assert.equal(f.store.get(record.id)!.status, "dispatched");
});
test("database survives server restarts and is visible to a separate authenticated browser", async () => {
  const directory = mkdtempSync(join(tmpdir(), "elysian-payments-"));
  const path = join(directory, "records.sqlite");
  const f = setup(path);
  const result = await f.createBooking();
  f.store.close();
  resources.splice(
    resources.findIndex((r) => r.store === f.store),
    1,
  );
  const restarted = setup(path);
  resources.find((r) => r.store === restarted.store)!.directory = directory;
  const separateCookie = await restarted.login();
  const response = await request(restarted.app)
    .get("/api/owner/records")
    .set("Cookie", separateCookie)
    .expect(200);
  assert.equal(response.body.records[0].id, result.receipt.id);
  assert.equal(restarted.store.list().length, 1);
});
test("missing credentials disable checkout and authentication without inventing success", async () => {
  const store = new Store(":memory:");
  resources.push({ store });
  const app = createApp({ appUrl: origin, databasePath: ":memory:" }, store);
  await request(app)
    .post("/api/shop/checkout")
    .set("Origin", origin)
    .set("Idempotency-Key", randomUUID())
    .send(shop)
    .expect(503);
  await request(app)
    .post("/api/owner/login")
    .set("Origin", origin)
    .send({ username: "owner", password: "password" })
    .expect(503);
  assert.equal(store.list().length, 0);
});
test("configuration refuses live keys", () => {
  const previous = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "sk_live_not_allowed";
  try {
    assert.throws(loadConfig, /Live payments are disabled/);
  } finally {
    if (previous === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous;
  }
});

test("Bring a Friend quotes apply 10% off both guests and calculate the deposit", () => {
  const pair = SPA_SERVICES.find(
    (service) => service.id === "bring-a-friend-package",
  )!;
  assert.match(pair.title, /10% OFF/);
  const options = [
    { pairIndex: 1, serviceId: "swedish-back-massage", singleIndex: 0 },
    { pairIndex: 2, serviceId: "swedish-full-body-massage", singleIndex: 0 },
    {
      pairIndex: 3,
      serviceId: "elysian-glow-8-in-1-pdt-led-light-therapy",
      singleIndex: 0,
    },
  ];
  for (const option of options) {
    const service = SPA_SERVICES.find(
      (value) => value.id === option.serviceId,
    )!;
    const price = service.priceOptions![option.singleIndex];
    const singlePence = Math.round(
      Number(price.priceClinicare ?? price.priceSingle) * 100,
    );
    const expectedPence = Math.round(singlePence * 2 * 0.9);
    const quote = bookingQuote({
      ...booking(),
      treatments: [{ serviceId: pair.id, optionIndex: option.pairIndex }],
    });
    assert.equal(quote.totalPence, expectedPence);
    assert.equal(quote.amountDuePence, Math.round(expectedPence / 2));
    assert.equal(quote.items[0].name, pair.title);
  }
  const facialPrices = SPA_SERVICES.filter(
    (service) => service.category === "facial",
  )
    .flatMap(
      (service) =>
        service.priceOptions?.map((price) =>
          Number(price.priceClinicare ?? price.priceSingle),
        ) || [],
    )
    .filter(Number.isFinite);
  const startingPrice =
    Math.round(Math.min(...facialPrices) * 100 * 2 * 0.9) / 100;
  assert.equal(
    pair.priceOptions![0].priceSingle,
    `From £${startingPrice.toFixed(2)}`,
  );
});

test("catalogue treatments with variable prices require an owner quote", async () => {
  const f = setup();
  const result = await f.createBooking({
    ...booking(),
    treatments: [{ serviceId: "bring-a-friend-package", optionIndex: 0 }],
  });
  const cookie = await f.login();
  assert.equal(f.store.get(result.receipt.id)!.items[0].unitPricePence, null);
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [] })
    .expect(400);
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({
      customPrices: [{ id: "bring-a-friend-package", pricePence: 7600 }],
    })
    .expect(200);
  assert.equal(f.store.get(result.receipt.id)!.amountDuePence, 3800);
});

test("a completed payment near link expiry cannot create another deposit charge", async () => {
  const f = setup();
  const result = await f.createBooking();
  const cookie = await f.login();
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [] })
    .expect(200);
  const record = f.store.get(result.receipt.id)!;
  f.pay(record.stripeSessionId!);
  f.store.save({ ...record, expiresAt: Date.now() - 1 });
  await f
    .post(`/api/owner/records/${record.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [] })
    .expect(409);
  assert.equal(f.creations.length, 1);
  assert.equal(f.store.get(record.id)!.paidPence, 3250);
});

test("a lost approval response freezes its quote until an identical retry succeeds", async () => {
  const f = setup();
  const result = await f.createBooking({
    ...booking(),
    customTreatments: [{ title: "Custom ritual", durationMinutes: 30 }],
  });
  const cookie = await f.login();
  const approval = { customPrices: [{ id: "custom-0", pricePence: 2500 }] };
  f.disconnectNextCreate();
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send(approval)
    .expect(500);
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [{ id: "custom-0", pricePence: 2600 }] })
    .expect(409);
  assert.equal(f.store.get(result.receipt.id)!.totalPence, 9000);
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send(approval)
    .expect(200);
  assert.equal(f.creations.length, 1);
});

test("Dermaplane can be booked alone or added with its price and appointment time", () => {
  const selection = { serviceId: "clinicare-dermaplane", optionIndex: 0 };
  const single = bookingQuote({ ...booking(), treatments: [selection] });
  assert.equal(single.totalPence, 4000);
  assert.equal(single.amountDuePence, 2000);
  assert.equal(treatmentMinutes(single.items), 45);

  const combined = bookingQuote({
    ...booking(),
    treatments: [
      { serviceId: "swedish-full-body-massage", optionIndex: 0 },
      selection,
    ],
  });
  assert.equal(combined.totalPence, 10000);
  assert.equal(combined.amountDuePence, 5000);
  assert.equal(treatmentMinutes(combined.items), 105);
  assert.throws(
    () => bookingQuote({ ...booking(), treatments: [selection, selection] }),
    /Duplicate treatments/,
  );
});

test("facial bundle choices keep every qualifying facial price and duration in sync", () => {
  const bundle = SPA_SERVICES.find(
    (service) => service.id === FACIAL_BUNDLE_ID,
  )!;
  const choices = bundle.priceOptions!;
  assert.ok(choices.length > 10);
  for (const [optionIndex, option] of choices.entries()) {
    const facial = SPA_SERVICES.find(
      (service) => service.id === option.facialServiceId,
    )!;
    assert.equal(facial.category, "facial");
    const source = facial.priceOptions![option.facialOptionIndex!];
    const price = Math.round(
      Number(source.priceClinicare ?? source.priceSingle) * 100,
    );
    const quote = bookingQuote({
      ...bundleBooking(),
      treatments: [{ serviceId: FACIAL_BUNDLE_ID, optionIndex }],
    });
    assert.equal(quote.items[0].unitPricePence, price);
    assert.equal(quote.items[0].duration, source.duration);
    assert.ok(quote.items[0].name.includes(facial.title));
    assert.equal(quote.totalPence, price + 6120);
    assert.equal(quote.amountDuePence, Math.round(price / 2) + 6120);
    assert.equal(
      treatmentMinutes(quote.items),
      Math.max(...source.duration.match(/\d+/g)!.map(Number)),
    );
  }
});

test("bundle products receive only 10% off while course prices apply only to facial visits", () => {
  for (const [sessions, treatmentTotal] of [
    [5, 27000],
    [10, 51000],
  ] as const) {
    const quote = bookingQuote({
      ...bundleBooking(),
      isCourse: true,
      courseSessions: sessions,
    });
    assert.equal(quote.items[0].quantity, sessions);
    assert.equal(quote.items[1].quantity, 2);
    assert.equal(quote.bundlePricing!.productsTotalPence, 6120);
    assert.equal(quote.bundlePricing!.productsDiscountPence, 680);
    assert.equal(quote.totalPence, treatmentTotal + 6120);
    assert.equal(quote.amountDuePence, treatmentTotal / 2 + 6120);
    assert.equal(treatmentMinutes(quote.items), 60);
  }
  const clinicare = SPA_PRODUCTS.find(
    (product) => product.brandType === "clinicare",
  )!;
  const quote = bookingQuote({
    ...bundleBooking(),
    bundleProducts: [{ productId: clinicare.id, quantity: 3 }],
  });
  const subtotal = Math.round(clinicare.numericPrice * 100) * 3;
  assert.equal(
    quote.bundlePricing!.productsTotalPence,
    subtotal - Math.round(subtotal * 0.1),
  );
  const rounded = bookingTotals([
    {
      id: "p",
      name: "Product",
      kind: "product",
      unitPricePence: 105,
      quantity: 3,
    },
  ]);
  assert.equal(rounded.bundlePricing!.productsDiscountPence, 32);
  assert.equal(rounded.totalPence, 283);
});

test("bundle facial deposit and full product payment survive approval, receipt and verified Stripe payment", async () => {
  const f = setup();
  const result = await f.createBooking(bundleBooking());
  assert.equal(f.creations.length, 0);
  assert.equal(result.receipt.totalPence, 12120);
  assert.equal(result.receipt.amountDuePence, 9120);
  assert.equal(result.receipt.bundlePricing!.productsDiscountPence, 680);
  assert.equal(result.receipt.durationMinutes, 60);
  const cookie = await f.login();
  await f
    .post(`/api/owner/records/${result.receipt.id}/approve`)
    .set("Cookie", cookie)
    .send({ customPrices: [] })
    .expect(200);
  const record = f.store.get(result.receipt.id)!;
  assert.equal(record.totalPence, 12120);
  assert.equal(record.amountDuePence, 9120);
  assert.equal(f.creations[0].line_items![0].price_data!.unit_amount, 9120);
  assert.match(
    f.creations[0].line_items![0].price_data!.product_data!.name,
    /Facial deposit \+ discounted skincare/,
  );
  f.pay(record.stripeSessionId!);
  assert.equal(
    (
      await f.webhook("checkout.session.completed", {
        id: record.stripeSessionId!,
      })
    ).status,
    200,
  );
  const receipt = (
    await request(f.app).get(`/api/receipts/${result.receiptToken}`).expect(200)
  ).body.receipt;
  assert.equal(receipt.paidPence, 9120);
  assert.equal(receipt.totalPence - receipt.paidPence, 3000);
  assert.equal(receipt.status, "confirmed");
  assert.equal(receipt.bundlePricing.productsTotalPence, 6120);
});

test("bundle price validation rejects missing products, invalid quantities, forged prices and non-bundle discounts", async () => {
  const f = setup();
  const body = bundleBooking();
  for (const invalid of [
    { ...body, bundleProducts: [] },
    { ...body, bundleProducts: undefined },
    { ...body, bundleProducts: [{ productId: "not-a-product", quantity: 1 }] },
    {
      ...body,
      bundleProducts: [{ productId: "tropic-skincare-kit-1", quantity: 0 }],
    },
    {
      ...body,
      bundleProducts: [{ productId: "tropic-skincare-kit-1", quantity: 1.5 }],
    },
    {
      ...body,
      bundleProducts: [{ productId: "tropic-skincare-kit-1", quantity: 21 }],
    },
    {
      ...body,
      bundleProducts: [...body.bundleProducts!, ...body.bundleProducts!],
    },
    {
      ...body,
      bundleProducts: [
        { productId: "tropic-skincare-kit-1", quantity: 1, unitPricePence: 1 },
      ],
    },
    { ...booking(), bundleProducts: body.bundleProducts },
    { ...body, treatments: [{ serviceId: FACIAL_BUNDLE_ID, optionIndex: 20 }] },
  ])
    await f
      .post("/api/bookings")
      .set("Idempotency-Key", randomUUID())
      .send(invalid)
      .expect(400);
  assert.equal(f.store.list().length, 0);
  assert.equal(f.creations.length, 0);
});

test("bundle uses standalone facial restrictions and rejects duplicate selected facial add-ons", () => {
  for (const id of [
    "cliniccare-chemical-peeling",
    "carboxytherapy-face-mask-treatment",
  ]) {
    const body = bundleBooking(id);
    assert.ok(bookingQuote(body).bundlePricing);
    assert.throws(
      () =>
        bookingQuote({
          ...body,
          treatments: [
            ...body.treatments,
            { serviceId: "leg-massage", optionIndex: 0 },
          ],
        }),
      /standalone/,
    );
    assert.throws(
      () =>
        bookingQuote({
          ...body,
          customTreatments: [{ title: "Extra massage", durationMinutes: 30 }],
        }),
      /standalone/,
    );
  }
  const body = bundleBooking("cliniccare-cinderella-black-tie-facial");
  assert.throws(
    () =>
      bookingQuote({
        ...body,
        treatments: [
          ...body.treatments,
          {
            serviceId: "cliniccare-cinderella-black-tie-facial",
            optionIndex: 0,
          },
        ],
      }),
    /Duplicate treatments/,
  );
});

test("bundle availability follows the selected facial and products do not reserve extra time", async () => {
  const f = setup();
  for (const [facial, option, minutes] of [
    ["microdermabrasion", 0, 30],
    ["microdermabrasion", 1, 60],
    ["cliniccare-chemical-peeling", 0, 45],
  ] as const) {
    const body = bundleBooking(facial, option);
    const available = await f
      .post("/api/availability")
      .send({
        date: body.date,
        treatments: body.treatments,
        customTreatments: [],
        isCourse: false,
        bundleProducts: body.bundleProducts,
      })
      .expect(200);
    assert.equal(available.body.durationMinutes, minutes);
  }
});

test("expired shop checkout stays unpaid and requires a new submission", async () => {
  const f = setup();
  const key = randomUUID();
  const created = await f.createShop(key);
  const record = f.store.byReceipt(created.receiptToken)!;
  f.sessions.get(record.stripeSessionId!)!.status = "expired";
  await f.webhook("checkout.session.expired", { id: record.stripeSessionId! });
  await f
    .post("/api/shop/checkout")
    .set("Idempotency-Key", key)
    .send(shop)
    .expect(409);
  const returned = await request(f.app)
    .get(`/api/receipts/${created.receiptToken}?cancelled=1`)
    .expect(200);
  assert.equal(returned.body.receipt.paidPence, 0);
  assert.equal(returned.body.checkoutUrl, undefined);
  const renewed = await f.createShop();
  assert.notEqual(renewed.receiptToken, created.receiptToken);
});
