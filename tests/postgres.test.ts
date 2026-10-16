import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import request from "supertest";
import Stripe from "stripe";
import { PostgresStore, SCHEMA_SQL } from "../server/postgres";
import { createApp } from "../server/app";
import { getConsultation } from "../server/consultation";
import { testConsultation } from "./consultation-fixture";
import { shiftDate } from "../shared/calendar";
import { londonDate } from "../shared/payments";
import { loadConfig } from "../server/config";

const database = process.env.NEON_TEST_DATABASE_URL;
test(
  "Neon: durable sessions, signed payments, refunds, calendar and encrypted consultation",
  { skip: !database },
  async () => {
    const url = new URL(database!);
    url.searchParams.set("sslmode", "verify-full");
    const pool = new Pool({ connectionString: url.toString(), max: 2 });
    const client = await pool.connect();
    const originalQuery = (client.query as any).bind(client);
    (client as any).query = async (...args: any[]) => {
      try {
        return await originalQuery(...args);
      } catch (error: any) {
        console.error(
          "Postgres test statement failed:",
          args[0],
          error.code,
          error.message,
        );
        throw error;
      }
    };
    const schema = "test_elysian_" + randomBytes(8).toString("hex");
    const priorKey = process.env.HEALTH_DATA_KEY;
    process.env.HEALTH_DATA_KEY = randomBytes(32).toString("base64");
    try {
      await client.query(SCHEMA_SQL.replaceAll("elysian_spa", schema));
      const store = new PostgresStore(client);
      const secret = "whsec_fixture";
      const origin = "https://spa.example";
      const sdk = new Stripe("sk_test_fixture");
      const sessions = new Map<string, any>();
      const charges = new Map<string, any>();
      let fixtureLive = false;
      const gateway = {
        charges: { retrieve: async (id: string) => charges.get(id) },
        webhooks: sdk.webhooks,
        checkout: {
          sessions: {
            create: async (params: any) => {
              const id = "cs_test_" + randomUUID();
              const result = {
                id,
                url: "https://checkout.stripe.com/test",
                livemode: fixtureLive,
                currency: "gbp",
                amount_total: params.line_items.reduce(
                  (s: number, i: any) =>
                    s + i.quantity * i.price_data.unit_amount,
                  0,
                ),
                payment_status: "unpaid",
                status: "open",
                payment_intent: "pi_" + id,
                metadata: params.metadata,
                client_reference_id: params.client_reference_id,
              };
              sessions.set(id, result);
              return result;
            },
            retrieve: async (id: string) => sessions.get(id),
          },
        },
      } as unknown as Stripe;
      const config = {
        appUrl: origin,
        databasePath: "postgres",
        stripeSecretKey: "sk_test_fixture",
        webhookSecret: secret,
        ownerUsername: "owner",
        ownerPassword: "a-strong-fixture-password",
      };
      const app = createApp(config, store, gateway);
      const post = (path: string) =>
        request(app).post(path).set("Origin", origin);
      const login = await post("/api/owner/login")
        .send({ username: "owner", password: config.ownerPassword })
        .expect(200);
      const cookie = login.headers["set-cookie"][0].split(";")[0];
      const created = await post("/api/shop/checkout")
        .set("Idempotency-Key", randomUUID())
        .send({
          customer: {
            name: "Fixture Customer",
            email: "fixture@example.com",
            phone: "07700900123",
          },
          items: [{ productId: "tropic-skincare-kit-1", quantity: 1 }],
          deliveryOption: "collection",
          deliveryAddress: "",
          promoCode: "",
        });
      assert.equal(created.status, 200, JSON.stringify(created.body));
      const order = await store.byReceipt(created.body.receiptToken);
      assert.ok(order);
      const session = sessions.get(order.stripeSessionId!);
      session.payment_status = "paid";
      session.status = "complete";
      const payload = JSON.stringify({
        id: "evt_" + randomUUID(),
        livemode: false,
        type: "checkout.session.completed",
        data: { object: { id: session.id } },
      });
      const signature = sdk.webhooks.generateTestHeaderString({
        payload,
        secret,
      });
      await request(app)
        .post("/api/stripe/webhook")
        .set("Content-Type", "application/json")
        .set("Stripe-Signature", signature)
        .send(payload)
        .expect(200);
      await request(app)
        .post("/api/stripe/webhook")
        .set("Content-Type", "application/json")
        .set("Stripe-Signature", signature)
        .send(payload)
        .expect(200);
      assert.equal((await store.get(order.id))!.paidPence, order.totalPence);
      assert.equal(
        Number(
          (await client.query("SELECT count(*) FROM events")).rows[0].count,
        ),
        1,
      );
      // A new app instance and DB client see the same owner session and ledger.
      const second = await pool.connect();
      try {
        await second.query(`SET search_path TO ${schema}`);
        const other = createApp(config, new PostgresStore(second), gateway);
        await request(other)
          .get("/api/owner/records")
          .set("Cookie", cookie)
          .expect(200);
      } finally {
        second.release();
      }
      let date = shiftDate(londonDate(), 7);
      while (new Date(date + "T12:00:00Z").getUTCDay() !== 2)
        date = shiftDate(date, 1);
      const booking = await post("/api/bookings")
        .set("Idempotency-Key", randomUUID())
        .send({
          customer: {
            name: "Fixture Customer",
            email: "fixture@example.com",
            phone: "07700900123",
          },
          date,
          time: "13:00",
          treatments: [
            { serviceId: "hydrodemabrasion-facial", optionIndex: 0 },
          ],
          customTreatments: [],
          isCourse: false,
          consultation: testConsultation(["hydrodemabrasion-facial"]),
        });
      assert.equal(booking.status, 201, JSON.stringify(booking.body));
      const id = booking.body.receipt.id;
      assert.equal(
        (await getConsultation(store, id))!.status,
        "awaiting_review",
      );
      const raw = (
        await client.query(
          "SELECT data FROM consultations WHERE record_id=$1",
          [id],
        )
      ).rows[0].data;
      assert.ok(!raw.includes("Fixture Customer"));
      const duplicate = await post("/api/bookings")
        .set("Idempotency-Key", randomUUID())
        .send({
          customer: {
            name: "Another Customer",
            email: "another@example.com",
            phone: "07700900124",
          },
          date,
          time: "13:15",
          treatments: [
            { serviceId: "hydrodemabrasion-facial", optionIndex: 0 },
          ],
          customTreatments: [],
          isCourse: false,
          consultation: testConsultation(["hydrodemabrasion-facial"]),
        });
      assert.equal(duplicate.status, 409);
      const diary = await request(app)
        .get(`/api/owner/calendar?from=${date}&to=${date}`)
        .set("Cookie", cookie)
        .expect(200);
      assert.equal(diary.body.entries.length, 1);
      assert.equal(diary.body.entries[0].recordId, id);
      const feed = await request(app).get("/api/reviews").expect(200);
      assert.equal(feed.body.total, 0);
      assert.equal(feed.body.ratingSum, 0);
      const refunded = {
        id: "ch_" + randomUUID(),
        payment_intent: session.payment_intent,
        livemode: false,
        currency: "gbp",
        amount: session.amount_total,
        amount_refunded: 100,
      };
      charges.set(refunded.id, refunded);
      const deliver = async (
        target: ReturnType<typeof createApp>,
        type: string,
        objectId: string,
        live = false,
      ) => {
        const raw = JSON.stringify({
          id: "evt_" + randomUUID(),
          type,
          livemode: live,
          data: { object: { id: objectId } },
        });
        return request(target)
          .post("/api/stripe/webhook")
          .set("Content-Type", "application/json")
          .set(
            "Stripe-Signature",
            sdk.webhooks.generateTestHeaderString({ payload: raw, secret }),
          )
          .send(raw);
      };
      assert.equal(
        (await deliver(app, "charge.refunded", refunded.id)).status,
        200,
      );
      assert.equal(
        (await store.get(order.id))!.paymentStatus,
        "partially_refunded",
      );
      refunded.amount_refunded = session.amount_total;
      assert.equal(
        (await deliver(app, "charge.refunded", refunded.id)).status,
        200,
      );
      assert.equal((await store.get(order.id))!.paymentStatus, "refunded");
      fixtureLive = true;
      const liveApp = createApp(
        { ...config, paymentMode: "live", stripeSecretKey: "sk_live_fixture" },
        store,
        gateway,
      );
      const liveOrder = await request(liveApp)
        .post("/api/shop/checkout")
        .set("Origin", origin)
        .set("Idempotency-Key", randomUUID())
        .send({
          customer: {
            name: "Live Mode Fixture",
            email: "fixture@example.com",
            phone: "07700900123",
          },
          items: [{ productId: "tropic-skincare-kit-1", quantity: 1 }],
          deliveryOption: "collection",
          deliveryAddress: "",
          promoCode: "",
        })
        .expect(200);
      const liveRecord = (await store.byReceipt(liveOrder.body.receiptToken))!;
      const liveSession = sessions.get(liveRecord.stripeSessionId!);
      liveSession.payment_status = "paid";
      liveSession.status = "complete";
      assert.equal(
        (
          await deliver(
            liveApp,
            "checkout.session.completed",
            liveSession.id,
            false,
          )
        ).status,
        400,
      );
      assert.equal((await store.get(liveRecord.id))!.paidPence, 0);
      assert.equal(
        (
          await deliver(
            liveApp,
            "checkout.session.completed",
            liveSession.id,
            true,
          )
        ).status,
        200,
      );
      assert.equal(
        (await store.get(liveRecord.id))!.paidPence,
        liveRecord.totalPence,
      );
      const missingOwner = createApp(
        { ...config, ownerUsername: undefined },
        store,
        gateway,
      );
      const countBefore = (await store.list()).length;
      await request(missingOwner)
        .post("/api/shop/checkout")
        .set("Origin", origin)
        .set("Idempotency-Key", randomUUID())
        .send({})
        .expect(503);
      assert.equal((await store.list()).length, countBefore);
      const configuredHealthKey = process.env.HEALTH_DATA_KEY;
      delete process.env.HEALTH_DATA_KEY;
      try {
        await request(liveApp)
          .post("/api/bookings")
          .set("Origin", origin)
          .set("Idempotency-Key", randomUUID())
          .send({})
          .expect(503);
      } finally {
        process.env.HEALTH_DATA_KEY = configuredHealthKey;
      }
      assert.equal((await store.list()).length, countBefore);
      await request(liveApp)
        .get("/api/stripe/webhook")
        .expect("Allow", "POST")
        .expect(405);
      await assert.rejects(
        store.transaction(async () => {
          await store.db
            .prepare("INSERT INTO events VALUES(?)")
            .run("rollback-event");
          throw new Error("rollback fixture");
        }),
      );
      assert.equal(await store.hasEvent("rollback-event"), false);
    } finally {
      if (priorKey === undefined) delete process.env.HEALTH_DATA_KEY;
      else process.env.HEALTH_DATA_KEY = priorKey;
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      client.release();
      await pool.end();
    }
  },
);

test("Live configuration requires explicit mode, HTTPS, and matching credentials", () => {
  const names = ["APP_URL", "STRIPE_MODE", "STRIPE_SECRET_KEY"];
  const previous = Object.fromEntries(names.map((n) => [n, process.env[n]]));
  try {
    process.env.APP_URL = "https://spa.example";
    process.env.STRIPE_MODE = "live";
    process.env.STRIPE_SECRET_KEY = "sk_live_fixture";
    assert.equal(loadConfig().paymentMode, "live");
    process.env.STRIPE_SECRET_KEY = "sk_test_fixture";
    assert.throws(loadConfig, /live Stripe key/);
    process.env.APP_URL = "http://localhost:3000";
    assert.throws(loadConfig, /HTTPS/);
  } finally {
    for (const n of names) {
      if (previous[n] === undefined) delete process.env[n];
      else process.env[n] = previous[n];
    }
  }
});
