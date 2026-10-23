import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../server/store";
import type { Config } from "../server/config";
import {
  dispatchNotifications,
  notificationFeed,
  notificationTransport,
  queueBookingNotice,
  recordEmailDelivery,
  type NotificationJob,
} from "../server/notifications";
import type { PaymentRecord } from "../shared/payments";

const config: Config = {
  appUrl: "https://spa.example",
  databasePath: ":memory:",
  paymentMode: "test",
  notifications: {
    enabled: true,
    ownerEmail: "owner@example.com",
    ownerWhatsapp: "+447700900123",
    resendApiKey: "re_fixture",
    emailFrom: "Elysian <bookings@spa.example>",
    twilioAccountSid: "ACfixture",
    twilioAuthToken: "fixture",
    whatsappFrom: "+447700900124",
    whatsappTemplateSid: "HXfixture",
  },
};
function record(): PaymentRecord {
  return {
    id: "ELS-fixture",
    type: "booking",
    createdAt: new Date().toISOString(),
    customer: {
      name: "Amanda",
      email: "amanda@example.com",
      phone: "+447700900125",
      notes: "PRIVATE HEALTH TEXT",
    },
    items: [],
    date: "2099-10-23",
    time: "10:00",
    subtotalPence: 10500,
    discountPence: 0,
    shippingPence: 0,
    totalPence: 10500,
    amountDuePence: 5250,
    paidPence: 0,
    refundedPence: 0,
    paymentStatus: "unpaid",
    status: "requested",
    ownerNotes: "PRIVATE OWNER NOTES",
    receiptToken: "private-receipt",
    holdUntil: Date.now() + 3600000,
    revision: 0,
  };
}
function setup() {
  const store = new Store(":memory:");
  const booking = record();
  store.insert(booking, "submission", "fingerprint");
  return { store, booking };
}
test("notification outbox is durable, concurrent sends are claimed once and intake contains no private notes", async () => {
  const { store, booking } = setup();
  try {
    await queueBookingNotice(store, config, booking, "request_received");
    await queueBookingNotice(store, config, booking, "request_received");
    const sent: NotificationJob[] = [];
    const transport = {
      send: async (job: NotificationJob) => {
        sent.push(job);
        return `provider-${job.id}`;
      },
    };
    await Promise.all([
      dispatchNotifications(store, config, transport),
      dispatchNotifications(store, config, transport),
    ]);
    assert.equal(sent.length, 3);
    assert.equal(sent.filter((j) => j.channel === "whatsapp").length, 1);
    assert.equal(
      sent.filter((j) => j.audience === "customer")[0].to,
      "amanda@example.com",
    );
    assert.ok(sent.every((j) => !JSON.stringify(j).includes("PRIVATE")));
    await dispatchNotifications(store, config, transport);
    assert.equal(sent.length, 3);
    const feed = await notificationFeed(store, config, transport, booking.id);
    assert.ok(feed.notifications.every((j) => j.status === "accepted"));
    assert.ok(!JSON.stringify(feed).includes("private-receipt"));
    assert.ok(!JSON.stringify(feed).includes("re_fixture"));
  } finally {
    store.close();
  }
});
test("approval sends the real deposit; paid confirmation goes to owner and customer; stale links are skipped", async () => {
  const { store, booking } = setup();
  try {
    booking.status = "awaiting_payment";
    booking.checkoutUrl = "https://checkout.stripe.com/c/pay/cs_fixture";
    booking.expiresAt = Date.now() + 3600000;
    store.save(booking);
    await queueBookingNotice(store, config, booking, "deposit_ready");
    const sent: NotificationJob[] = [];
    const transport = {
      send: async (job: NotificationJob) => {
        sent.push(job);
        return job.id;
      },
    };
    booking.paidPence = 5250;
    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.checkoutUrl = undefined;
    store.save(booking);
    await queueBookingNotice(store, config, booking, "booking_confirmed");
    await dispatchNotifications(store, config, transport);
    await dispatchNotifications(store, config, transport);
    assert.equal(sent.length, 3);
    assert.ok(sent.every((j) => j.event === "booking_confirmed"));
    assert.match(
      sent.find((j) => j.audience === "customer")!.text,
      /Payment received: £52\.50\. Remaining balance: £52\.50/,
    );
    const feed = await notificationFeed(store, config, transport, booking.id);
    assert.equal(
      feed.notifications.find((j) => j.event === "deposit_ready")?.status,
      "skipped",
    );
  } finally {
    store.close();
  }
});
test("an unconfigured service never sends and a lost response never causes an automatic duplicate", async () => {
  const { store, booking } = setup();
  try {
    await queueBookingNotice(store, config, booking, "request_received");
    let sends = 0;
    const transport = {
      send: async () => {
        sends++;
        throw new Error("Connection lost after send");
      },
    };
    const disabled = {
      ...config,
      notifications: { ...config.notifications!, enabled: false },
    };
    await dispatchNotifications(store, disabled, transport);
    assert.equal(sends, 0);
    await dispatchNotifications(store, config, transport);
    assert.equal(sends, 3);
    await dispatchNotifications(
      store,
      config,
      transport,
      undefined,
      Date.now() + 300000,
    );
    assert.equal(sends, 3);
    const feed = await notificationFeed(store, config, transport, booking.id);
    assert.ok(feed.notifications.every((j) => j.status === "unknown"));
  } finally {
    store.close();
  }
});
test("Resend and Twilio payloads use correct APIs, template variables and no customer WhatsApp", async (t) => {
  const { store, booking } = setup();
  try {
    booking.status = "awaiting_payment";
    booking.checkoutUrl = "https://checkout.stripe.com/c/pay/cs_fixture";
    booking.expiresAt = Date.now() + 3600000;
    store.save(booking);
    await queueBookingNotice(store, config, booking, "deposit_ready");
    const calls: { url: string; init: RequestInit }[] = [];
    const fetcher = (async (url: string | URL | Request, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify({ id: "email-fixture", sid: "SMfixture" }),
        { status: 200 },
      );
    }) as typeof fetch;
    t.mock.method(globalThis, "fetch", fetcher);
    await dispatchNotifications(
      store,
      config,
      notificationTransport(config, fetcher),
    );
    const payload = JSON.parse(calls[0].init.body as string);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    assert.equal(payload.reply_to, "owner@example.com");
    assert.match(payload.text, /Payment due now: £52\.50\. Total: £105\.00/);
    assert.match(payload.text, /confirmed only after payment/);
    assert.equal(
      new Headers(calls[0].init.headers).get("Idempotency-Key")?.length,
      64,
    );
    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.paidPence = 5250;
    store.save(booking);
    await queueBookingNotice(store, config, booking, "booking_confirmed");
    await dispatchNotifications(
      store,
      config,
      notificationTransport(config, fetcher),
    );
    const whatsapp = calls.find((call) => call.url.includes("api.twilio.com"))!;
    const form = new URLSearchParams(whatsapp.init.body as string);
    assert.equal(form.get("To"), "whatsapp:+447700900123");
    assert.equal(form.get("ContentSid"), "HXfixture");
    assert.equal(JSON.parse(form.get("ContentVariables")!)["4"], booking.id);
    assert.equal(form.has("Body"), false);
  } finally {
    store.close();
  }
});
test("published email templates receive only their registered variables through the sending-only SDK", async (t) => {
  const { store, booking } = setup();
  const configured: Config = {
    ...config,
    notifications: {
      ...config.notifications!,
      resendTemplates: {
        request_received: "template-request",
        deposit_ready: "template-deposit",
        booking_confirmed: "template-confirmed",
        owner: "template-owner",
      },
    },
  };
  const payloads: Record<string, any>[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init: RequestInit) => {
      payloads.push(JSON.parse(init.body as string));
      return new Response(JSON.stringify({ id: `email-${payloads.length}` }), {
        status: 200,
      });
    },
  );
  try {
    const transport = notificationTransport(configured);
    await queueBookingNotice(store, configured, booking, "request_received");
    await dispatchNotifications(store, configured, transport);
    const request = payloads.find(
      (p) => p.template?.id === "template-request",
    )!;
    assert.deepEqual(Object.keys(request.template.variables).sort(), [
      "APPOINTMENT",
      "CUSTOMER_NAME",
      "REFERENCE",
      "STATUS_URL",
    ]);
    assert.equal(request.template.variables.CUSTOMER_NAME, "Amanda");
    assert.equal(request.text, undefined);
    assert.equal(request.html, undefined);
    const owner = payloads.find((p) => p.template?.id === "template-owner")!;
    assert.equal(
      owner.template.variables.OWNER_CRM_URL,
      "https://spa.example/#crm",
    );
    booking.status = "awaiting_payment";
    booking.checkoutUrl = "https://checkout.stripe.com/c/pay/cs_fixture";
    booking.expiresAt = Date.now() + 3600000;
    store.save(booking);
    await queueBookingNotice(store, configured, booking, "deposit_ready");
    await dispatchNotifications(store, configured, transport);
    const deposit = payloads.find(
      (p) => p.template?.id === "template-deposit",
    )!;
    assert.equal(deposit.template.variables.DEPOSIT_AMOUNT, "£52.50");
    assert.equal(deposit.template.variables.CHECKOUT_URL, booking.checkoutUrl);
    assert.match(deposit.template.variables.PAYMENT_DETAIL, /50%/);
    assert.equal(Object.keys(deposit.template.variables).length, 9);
    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.paidPence = 5250;
    store.save(booking);
    await queueBookingNotice(store, configured, booking, "booking_confirmed");
    await dispatchNotifications(store, configured, transport);
    const confirmation = payloads.find(
      (p) => p.template?.id === "template-confirmed",
    )!;
    assert.equal(confirmation.template.variables.PAID_AMOUNT, "£52.50");
    assert.equal(confirmation.template.variables.BALANCE, "£52.50");
    assert.equal(Object.keys(confirmation.template.variables).length, 6);
    assert.ok(!JSON.stringify(payloads).includes("PRIVATE"));
  } finally {
    store.close();
  }
});
test("provider-reported delivery is distinguished from acceptance; definite rejection can retry", async (t) => {
  const { store, booking } = setup();
  try {
    await queueBookingNotice(store, config, booking, "request_received");
    let rejected = true;
    const fetcher = (async (
      _url: string | URL | Request,
      init: RequestInit,
    ) => {
      if (init.method === "POST")
        return rejected
          ? new Response(
              JSON.stringify({
                statusCode: 429,
                name: "rate_limit_exceeded",
                message: "Fixture rate limit",
              }),
              { status: 429 },
            )
          : new Response(
              JSON.stringify({ id: "email-fixture", sid: "SMfixture" }),
              { status: 200 },
            );
      return new Response(
        JSON.stringify({ last_event: "delivered", status: "delivered" }),
        { status: 200 },
      );
    }) as typeof fetch;
    t.mock.method(globalThis, "fetch", fetcher);
    const transport = notificationTransport(config, fetcher);
    await dispatchNotifications(store, config, transport);
    assert.ok(
      (
        await notificationFeed(store, config, transport, booking.id)
      ).notifications.every((j) => j.status === "failed"),
    );
    rejected = false;
    await dispatchNotifications(
      store,
      config,
      transport,
      undefined,
      Date.now() + 300000,
    );
    await recordEmailDelivery(store, "delivery-fixture", {
      type: "email.delivered",
      created_at: new Date().toISOString(),
      data: { email_id: "email-fixture" },
    });
    assert.ok(
      (
        await notificationFeed(store, config, transport, booking.id)
      ).notifications.every((j) => j.status === "delivered"),
    );
  } finally {
    store.close();
  }
});
test("cancelled, expired and unverified payments do not produce confirmations", async () => {
  const { store, booking } = setup();
  try {
    for (const status of ["requested", "cancelled", "expired"] as const) {
      booking.status = status;
      await queueBookingNotice(store, config, booking, "booking_confirmed");
    }
    assert.equal(
      (
        await notificationFeed(
          store,
          config,
          { send: async () => "unused" },
          booking.id,
        )
      ).notifications.length,
      0,
    );
  } finally {
    store.close();
  }
});

test("notification jobs roll back with booking changes and accepted sends survive a restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "elysian-notifications-"));
  const path = join(directory, "store.sqlite");
  let store = new Store(path);
  try {
    const booking = record();
    store.insert(booking, "submission", "fingerprint");
    await assert.rejects(
      store.transaction(async () => {
        await queueBookingNotice(store, config, booking, "request_received");
        throw new Error("Booking transaction rolled back");
      }),
    );
    let sent = 0;
    const transport = { send: async () => `provider-${++sent}` };
    assert.equal(
      (await notificationFeed(store, config, transport, booking.id))
        .notifications.length,
      0,
    );
    await store.transaction(async () => {
      await queueBookingNotice(store, config, booking, "request_received");
    });
    store.close();
    store = new Store(path);
    await dispatchNotifications(store, config, transport);
    assert.equal(sent, 3);
    store.close();
    store = new Store(path);
    await dispatchNotifications(store, config, transport);
    assert.equal(sent, 3);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
