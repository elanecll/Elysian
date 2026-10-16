import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Stripe from "stripe";
import { createApp } from "../server/app";
import { Store } from "../server/store";
import { getConsultation } from "../server/consultation";
import { londonDate, type BookingRequest } from "../shared/payments";
import { shiftDate } from "../shared/calendar";
import { testConsultation } from "./consultation-fixture";
const origin = "http://localhost:3000";
const stores: Store[] = [];
const dirs: string[] = [];
afterEach(() => {
  stores.splice(0).forEach((s) => s.close());
  dirs.splice(0).forEach((p) => rmSync(p, { force: true, recursive: true }));
});
function futureTuesday() {
  let date = shiftDate(londonDate(), 7);
  while (new Date(`${date}T12:00:00Z`).getUTCDay() !== 2)
    date = shiftDate(date, 1);
  return date;
}
function body(ids = ["hydrodemabrasion-facial"]): BookingRequest {
  return {
    customer: {
      name: "Consultation Fixture",
      email: "consultation@example.com",
      phone: "07707328060",
      notes: "",
    },
    date: futureTuesday(),
    time: "13:00",
    treatments: ids.map((serviceId) => ({ serviceId, optionIndex: 0 })),
    customTreatments: [],
    isCourse: false,
    consultation: testConsultation(ids),
  };
}
function setup(path = ":memory:") {
  const store = new Store(path);
  stores.push(store);
  const sessions = new Map<string, Stripe.Checkout.Session>();
  const creates: Stripe.Checkout.SessionCreateParams[] = [];
  const sdk = new Stripe("sk_test_fixture");
  const gateway = {
    webhooks: sdk.webhooks,
    checkout: {
      sessions: {
        create: async (p: Stripe.Checkout.SessionCreateParams) => {
          creates.push(p);
          const s = {
            id: `cs_test_${creates.length}`,
            payment_intent: `pi_test_health_${creates.length}`,
            url: "https://checkout.stripe.com/test/consultation",
            status: "open",
            payment_status: "unpaid",
            livemode: false,
            currency: "gbp",
            amount_total: p.line_items![0].price_data!.unit_amount!,
            client_reference_id: p.client_reference_id,
            metadata: p.metadata,
            expires_at: p.expires_at,
          } as Stripe.Checkout.Session;
          sessions.set(s.id, s);
          return s;
        },
        retrieve: async (id: string) => sessions.get(id)!,
        expire: async (id: string) => {
          const s = sessions.get(id)!;
          s.status = "expired";
          return s;
        },
      },
    },
  } as unknown as Stripe;
  const app = createApp(
    {
      appUrl: origin,
      databasePath: path,
      ownerUsername: "owner",
      ownerPassword: "a-long-test-password",
      webhookSecret: "whsec_health",
      stripeSecretKey: "sk_test_fixture",
    },
    store,
    gateway,
  );
  const post = (p: string) =>
    request(app).post(`/api${p}`).set("Origin", origin);
  const submit = (input: object = body(), key = randomUUID()) =>
    post("/bookings").set("Idempotency-Key", key).send(input);
  const login = async () =>
    (
      await post("/owner/login")
        .send({ username: "owner", password: "a-long-test-password" })
        .expect(200)
    ).headers["set-cookie"][0].split(";")[0] as string;
  const review = (id: string, cookie: string, patch = {}) =>
    request(app)
      .patch(`/api/owner/records/${id}/consultation`)
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send({
        status: "approved",
        notes: "Consulted with fixture guest; relevant answers resolved.",
        protocolChecked: true,
        consultationCompleted: true,
        ...patch,
      });
  const approve = (id: string, cookie: string) =>
    post(`/owner/records/${id}/approve`)
      .set("Cookie", cookie)
      .send({ customPrices: [] });
  return {
    app,
    store,
    submit,
    login,
    post,
    review,
    approve,
    sessions,
    creates,
  };
}
test("health screening requires all answers, explicit consent, details and current version without holding a slot", async () => {
  const f = setup();
  for (const change of [
    (r: any) => {
      delete r.consultation;
    },
    (r: any) => {
      r.consultation.version = "outdated";
    },
    (r: any) => {
      r.consultation.participants[0].dataConsent = false;
    },
    (r: any) => {
      r.consultation.participants[0].accuracyConfirmed = false;
    },
    (r: any) => {
      delete r.consultation.participants[0].answers.allergies;
    },
    (r: any) => {
      r.consultation.participants[0].answers.allergies.answer = "";
    },
    (r: any) => {
      r.consultation.participants[0].answers.allergies = {
        answer: "yes",
        details: "",
      };
    },
    (r: any) => {
      r.consultation.participants[0].answers.allergies = {
        answer: "unsure",
        details: "",
      };
    },
    (r: any) => {
      r.consultation.status = "approved";
    },
  ]) {
    const value = body();
    change(value);
    await f.submit(value).expect(400);
  }
  assert.equal(f.store.list().length, 0);
  assert.equal(
    f.store.db.prepare("SELECT COUNT(*) AS count FROM diary").get()!.count,
    0,
  );
});
test("flagged answers remain unpaid and require authenticated consultation approval before Stripe", async () => {
  const f = setup();
  const value = body();
  value.consultation.participants[0].answers.allergies = {
    answer: "yes",
    details: "Fixture reaction needing discussion",
  };
  const created = (await f.submit(value).expect(201)).body;
  const id = created.receipt.id;
  const cookie = await f.login();
  assert.equal(f.store.get(id)!.consultationStatus, "awaiting_review");
  await f.approve(id, cookie).expect(409);
  await f.review(id, cookie, { protocolChecked: false }).expect(400);
  await f.review(id, cookie, { consultationCompleted: false }).expect(400);
  await f
    .review(id, cookie, {
      status: "information_needed",
      protocolChecked: false,
      consultationCompleted: false,
    })
    .expect(200);
  await f.approve(id, cookie).expect(409);
  await f.review(id, cookie, { status: "deferred" }).expect(200);
  await f.approve(id, cookie).expect(409);
  assert.equal(f.creates.length, 0);
  await f.review(id, cookie).expect(200);
  await f.approve(id, cookie).expect(200);
  assert.equal(f.creates.length, 1);
  assert.equal(f.store.get(id)!.status, "awaiting_payment");
  await f.review(id, cookie, { status: "deferred" }).expect(409);
  assert.equal((await getConsultation(f.store, id))!.status, "approved");
  await f
    .post(`/owner/calendar/${id}/cancel`)
    .set("Cookie", cookie)
    .send({})
    .expect(200);
  await f.review(id, cookie, { status: "deferred" }).expect(200);
});
test("microneedling reserves 45 minutes and quotes £80 with a £40 deposit only after consultation approval", async () => {
  const f = setup();
  const incomplete = body(["clinicare-microneedling"]);
  delete incomplete.consultation.participants[0].answers.scarring;
  await f.submit(incomplete).expect(400);
  assert.equal(f.store.list().length, 0);
  const created = (
    await f.submit(body(["clinicare-microneedling"])).expect(201)
  ).body;
  const id = created.receipt.id;
  const record = f.store.get(id)!;
  assert.equal(record.items[0].name, "Clinicare Microneedling");
  assert.equal(record.totalPence, 8000);
  assert.equal(record.amountDuePence, 4000);
  assert.equal(record.durationMinutes, 45);
  assert.equal(record.status, "requested");
  assert.equal(record.paymentStatus, "unpaid");
  const cookie = await f.login();
  await f.approve(id, cookie).expect(409);
  assert.equal(f.creates.length, 0);
  await f.review(id, cookie).expect(200);
  await f.approve(id, cookie).expect(200);
  assert.equal(f.creates.length, 1);
  assert.equal(f.creates[0].line_items![0].price_data!.unit_amount, 4000);
});
test("private answers stay encrypted and out of receipt, ledger, diary and Stripe payloads; endpoint is authenticated", async () => {
  const f = setup();
  const value = body();
  const marker = "PRIVATE-HEALTH-FIXTURE-ONLY";
  value.consultation.participants[0].answers.medication = {
    answer: "unsure",
    details: marker,
  };
  const created = (await f.submit(value).expect(201)).body;
  const id = created.receipt.id;
  await request(f.app).get(`/api/owner/records/${id}/consultation`).expect(401);
  await f.review(id, "elysian_session=fabricated").expect(401);
  const cookie = await f.login();
  const privateResult = await request(f.app)
    .get(`/api/owner/records/${id}/consultation`)
    .set("Cookie", cookie)
    .expect(200);
  assert.equal(privateResult.headers["cache-control"], "no-store");
  assert.equal(
    privateResult.body.consultation.input.participants[0].answers.medication
      .details,
    marker,
  );
  for (const url of [
    `/api/receipts/${created.receiptToken}`,
    "/api/owner/records",
    `/api/owner/calendar?from=${value.date}&to=${value.date}`,
  ]) {
    const response = await request(f.app)
      .get(url)
      .set("Cookie", cookie)
      .expect(200);
    assert.ok(!JSON.stringify(response.body).includes(marker));
    assert.ok(!JSON.stringify(response.body).includes("dataConsent"));
  }
  assert.ok(
    !JSON.stringify(
      f.store.db.prepare("SELECT * FROM consultations").all(),
    ).includes(marker),
  );
  assert.ok(
    !JSON.stringify(f.store.db.prepare("SELECT * FROM records").all()).includes(
      marker,
    ),
  );
  await f.review(id, cookie).expect(200);
  await f.approve(id, cookie).expect(200);
  assert.ok(!JSON.stringify(f.creates).includes(marker));
  assert.ok(!JSON.stringify(f.creates).includes('"answers"'));
});
test("health and booking records are atomic, persistent and idempotent, including separate consent for two guests", async () => {
  const directory = mkdtempSync(join(tmpdir(), "elysian-health-"));
  dirs.push(directory);
  const path = join(directory, "records.sqlite");
  const f = setup(path);
  const value = body(["bring-a-friend-package"]);
  const key = randomUUID();
  assert.equal(value.consultation.participants.length, 2);
  const incomplete = structuredClone(value);
  incomplete.consultation.participants.pop();
  await f.submit(incomplete).expect(400);
  const missingConsent = structuredClone(value);
  missingConsent.consultation.participants[1].dataConsent = false;
  await f.submit(missingConsent).expect(400);
  const first = (await f.submit(value, key).expect(201)).body;
  const retry = (await f.submit(value, key).expect(200)).body;
  assert.equal(first.receipt.id, retry.receipt.id);
  const altered = structuredClone(value);
  altered.consultation.participants[1].name = "Different Guest";
  await f.submit(altered, key).expect(409);
  await f.submit(value).expect(409); // Same interval: no extra private record.
  assert.equal(
    f.store.db.prepare("SELECT COUNT(*) AS count FROM consultations").get()!
      .count,
    1,
  );
  const original = (await getConsultation(f.store, first.receipt.id))!;
  const restored = setup(path);
  assert.deepEqual(
    await getConsultation(restored.store, first.receipt.id),
    original,
  );
  assert.equal(readFileSync(`${path}.health-key`).length, 32);
  const cookie = await restored.login();
  await request(restored.app)
    .get(`/api/owner/records/${first.receipt.id}/consultation`)
    .set("Cookie", cookie)
    .expect(200);
});
test("lost encryption keys fail closed rather than generating replacements over existing health records", async () => {
  const directory = mkdtempSync(join(tmpdir(), "elysian-health-key-"));
  dirs.push(directory);
  const path = join(directory, "records.sqlite");
  const f = setup(path);
  const id = (await f.submit().expect(201)).body.receipt.id;
  unlinkSync(`${path}.health-key`);
  const restarted = setup(path);
  const cookie = await restarted.login();
  await request(restarted.app)
    .get(`/api/owner/records/${id}/consultation`)
    .set("Cookie", cookie)
    .expect(500);
  assert.equal(
    restarted.store.db
      .prepare("SELECT COUNT(*) AS count FROM consultations")
      .get()!.count,
    1,
  );
});
test("legacy bookings need a documented private consultation; paid receipts never substitute for day-of consent", async () => {
  const f = setup();
  const id = (await f.submit().expect(201)).body.receipt.id;
  const cookie = await f.login();
  f.store.db.prepare("DELETE FROM consultations WHERE record_id=?").run(id);
  f.store.save({ ...f.store.get(id)!, consultationStatus: undefined });
  await f.approve(id, cookie).expect(409);
  await f.review(id, cookie).expect(400);
  await f.review(id, cookie, { offlineDataConsent: true }).expect(200);
  await f.approve(id, cookie).expect(200);
  const record = f.store.get(id)!;
  const session = f.sessions.get(record.stripeSessionId!)!;
  session.status = "complete";
  session.payment_status = "paid";
  await request(f.app).get(`/api/receipts/${record.receiptToken}`).expect(200);
  const check = (data: object) =>
    f
      .post(`/owner/records/${id}/consultation/day-of-check`)
      .set("Cookie", cookie)
      .send(data);
  await check({
    healthChangesReviewed: true,
    treatmentConsentObtained: false,
  }).expect(400);
  await check({
    healthChangesReviewed: true,
    treatmentConsentObtained: true,
  }).expect(409); // Future appointment.
  const complete = () =>
    request(f.app)
      .patch(`/api/owner/records/${id}`)
      .set("Origin", origin)
      .set("Cookie", cookie)
      .send({ status: "completed" });
  await complete().expect(409);
  f.store.save({ ...f.store.get(id)!, date: londonDate() });
  await check({
    healthChangesReviewed: true,
    treatmentConsentObtained: true,
  }).expect(200);
  await check({
    healthChangesReviewed: true,
    treatmentConsentObtained: true,
  }).expect(200);
  assert.equal((await getConsultation(f.store, id))!.dayOfChecks!.length, 1);
  await complete().expect(200);
});
