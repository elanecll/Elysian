import { createHash } from "node:crypto";
import { Resend } from "resend";
import type { Config } from "./config.js";
import type { Storage } from "./storage.js";
import { londonDate, money, type PaymentRecord } from "../shared/payments.js";
import type {
  BookingNotice,
  NotificationFeed,
  NotificationStatus,
  NotificationSummary,
} from "../shared/notifications.js";

export interface NotificationJob extends NotificationSummary {
  recordId: string;
  revision: number;
  to: string;
  subject: string;
  text: string;
  variables: Record<string, string>;
  emailVariables?: Record<string, string>;
  deliveryEventAt?: number;
  providerId?: string;
  attempts: number;
  nextAttemptAt: number;
}
export interface NotificationTransport {
  send(job: NotificationJob): Promise<string>;
  check?(job: NotificationJob): Promise<NotificationStatus | undefined>;
}
const templateFields = {
  request_received: ["CUSTOMER_NAME", "APPOINTMENT", "REFERENCE", "STATUS_URL"],
  deposit_ready: [
    "CUSTOMER_NAME",
    "APPOINTMENT",
    "REFERENCE",
    "TOTAL",
    "DEPOSIT_AMOUNT",
    "PAYMENT_DETAIL",
    "CHECKOUT_URL",
    "EXPIRES",
    "STATUS_URL",
  ],
  booking_confirmed: [
    "CUSTOMER_NAME",
    "APPOINTMENT",
    "REFERENCE",
    "PAID_AMOUNT",
    "BALANCE",
    "STATUS_URL",
  ],
  owner: [
    "UPDATE_TITLE",
    "CUSTOMER_NAME",
    "APPOINTMENT",
    "REFERENCE",
    "PAYMENT_DETAIL",
    "OWNER_CRM_URL",
  ],
};
class SendError extends Error {
  constructor(
    public uncertain: boolean,
    message: string,
  ) {
    super(message);
  }
}
const emailReady = (c: Config) =>
  !!(
    c.notifications?.enabled &&
    c.notifications.resendApiKey &&
    c.notifications.emailFrom
  );
const whatsappReady = (c: Config, audience: "owner" | "customer" = "owner") =>
  !!(
    c.notifications?.enabled &&
    c.notifications.twilioAccountSid &&
    c.notifications.twilioAuthToken &&
    c.notifications.whatsappFrom &&
    (audience === "owner"
      ? c.notifications.whatsappTemplateSid
      : c.notifications.whatsappCustomerTemplateSid)
  );
export function notificationReadiness(config: Config) {
  return {
    emailConfigured: emailReady(config),
    whatsappConfigured: whatsappReady(config),
    customerWhatsappConfigured: whatsappReady(config, "customer"),
  };
}
function recipientPhone(phone: string) {
  const digits = phone.replace(/[\s().-]/g, "").replace(/^whatsapp:/, "");
  if (!/^\+[1-9]\d{7,14}$/.test(digits))
    throw new SendError(
      false,
      "Set the WhatsApp number in international format.",
    );
  return `whatsapp:${digits}`;
}
export function notificationTransport(
  config: Config,
  fetcher: typeof fetch = fetch,
): NotificationTransport {
  const settings = config.notifications;
  const resend = settings?.resendApiKey
    ? new Resend(settings.resendApiKey)
    : undefined;
  const twilioUrl = () =>
    `https://api.twilio.com/2010-04-01/Accounts/${settings!.twilioAccountSid}/Messages`;
  const twilioAuth = () =>
    `Basic ${Buffer.from(`${settings!.twilioAccountSid}:${settings!.twilioAuthToken}`).toString("base64")}`;
  return {
    async send(job) {
      if (job.channel === "email") {
        if (!resend)
          throw new SendError(false, "Email sending is not configured.");
        // Product orders must never use an appointment/deposit template.
        const templateKind =
          job.event === "order_confirmed"
            ? undefined
            : job.audience === "owner"
              ? "owner"
              : job.event;
        const templateId = templateKind
          ? settings?.resendTemplates?.[templateKind]
          : undefined;
        const fields = templateKind ? templateFields[templateKind] : [];
        const content =
          templateId && job.emailVariables
            ? {
                template: {
                  id: templateId,
                  variables: Object.fromEntries(
                    fields.map((key) => [key, job.emailVariables![key]]),
                  ),
                },
              }
            : { text: job.text };
        const { data, error } = await resend.emails.send(
          {
            from: settings!.emailFrom!,
            to: [job.to],
            replyTo: settings!.ownerEmail,
            subject: job.subject,
            ...content,
          },
          { idempotencyKey: job.id, signal: AbortSignal.timeout(6000) },
        );
        if (error)
          throw new SendError(
            !error.statusCode ||
              error.statusCode >= 500 ||
              error.statusCode === 408,
            error.statusCode
              ? `The email provider returned HTTP ${error.statusCode}. Check provider settings or limits.`
              : "The email provider response was lost. Check its message log before sending again.",
          );
        if (!data?.id)
          throw new SendError(
            true,
            "The email provider returned no message reference. Check its message log.",
          );
        return data.id;
      }
      let url: string;
      let init: RequestInit;
      url = `${twilioUrl()}.json`;
      init = {
        method: "POST",
        headers: {
          Authorization: twilioAuth(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: recipientPhone(settings!.whatsappFrom!),
          To: recipientPhone(job.to),
          ContentSid: (job.audience === "customer"
            ? settings!.whatsappCustomerTemplateSid
            : settings!.whatsappTemplateSid)!,
          ContentVariables: JSON.stringify(job.variables),
        }).toString(),
      };
      let response: Response;
      try {
        response = await fetcher(url, {
          ...init,
          signal: AbortSignal.timeout(6000),
          redirect: "error",
        });
      } catch {
        throw new SendError(
          true,
          "The provider response was lost. Check its message log before sending again.",
        );
      }
      // A server error may follow an accepted send; do not blindly repeat it.
      if (!response.ok)
        throw new SendError(
          response.status >= 500 || response.status === 408,
          `The ${job.channel} provider returned HTTP ${response.status}. Check provider settings or limits.`,
        );
      const data = (await response.json().catch(() => ({}))) as {
        id?: string;
        sid?: string;
      };
      const id = data.sid;
      if (!id)
        throw new SendError(
          true,
          "The provider returned no message reference. Check its message log.",
        );
      return id;
    },
    async check(job) {
      if (!job.providerId) return;
      // A sending-only Resend key cannot read email history. Its delivery state
      // comes from a signature-verified webhook instead of broader API access.
      if (job.channel === "email") return;
      const url = `${twilioUrl()}/${encodeURIComponent(job.providerId)}.json`;
      const response = await fetcher(url, {
        headers: {
          Authorization: twilioAuth(),
        },
        signal: AbortSignal.timeout(4000),
        redirect: "error",
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        last_event?: string;
        status?: string;
      };
      const state = data.status;
      if (["delivered", "read", "opened", "clicked"].includes(state ?? ""))
        return "delivered";
      if (
        [
          "failed",
          "undelivered",
          "bounced",
          "complained",
          "suppressed",
          "canceled",
        ].includes(state ?? "")
      )
        return "failed";
      return "accepted";
    },
  };
}
const noticeNames: Record<BookingNotice, string> = {
  request_received: "New appointment request",
  deposit_ready: "Appointment approved — deposit required",
  booking_confirmed: "Deposit received — appointment confirmed",
  order_confirmed: "Payment received — product order confirmed",
};
function validEvent(record: PaymentRecord, event: BookingNotice, now: number) {
  if (event === "order_confirmed")
    return (
      record.type === "sale" &&
      ["confirmed", "dispatched"].includes(record.status) &&
      record.paymentStatus === "paid" &&
      record.paidPence > 0 &&
      record.paidPence === record.amountDuePence &&
      !record.refundedPence
    );
  if (
    record.type !== "booking" ||
    ["cancelled", "expired"].includes(record.status) ||
    !record.date ||
    record.date < londonDate(new Date(now))
  )
    return false;
  if (event === "request_received")
    return record.status === "requested" && (record.holdUntil ?? 0) > now;
  if (event === "deposit_ready")
    return (
      record.status === "awaiting_payment" &&
      !record.paidPence &&
      !!record.checkoutUrl &&
      (record.expiresAt ?? 0) > now
    );
  return (
    record.status === "confirmed" &&
    record.paymentStatus === "paid" &&
    record.paidPence > 0 &&
    !record.refundedPence
  );
}
// Call inside the same database transaction as the corresponding booking change.
// Recording a job does not contact any external service.
export async function queueBookingNotice(
  store: Storage,
  config: Config,
  record: PaymentRecord,
  event: Exclude<BookingNotice, "order_confirmed">,
) {
  if (!validEvent(record, event, Date.now())) return;
  const settings = config.notifications;
  const ownerEmail = settings?.ownerEmail || "elainecll@hotmail.com";
  const ownerWhatsapp = settings?.ownerWhatsapp || "+447707328060";
  const appointment = `${record.date!.split("-").reverse().join("/")} at ${record.time} (UK time)`;
  const balance = money(
    Math.max(0, record.totalPence - record.paidPence + record.refundedPence),
  );
  const statusLink = `${config.appUrl}/?receipt=${encodeURIComponent(record.receiptToken)}#payment`;
  const ownerLink = `${config.appUrl}/#crm`;
  const detail =
    event === "request_received"
      ? "Awaiting your review. No payment received."
      : event === "deposit_ready"
        ? `Payment due now: ${money(record.amountDuePence)}. Total: ${money(record.totalPence)}. The appointment is confirmed only after payment.`
        : `Payment received: ${money(record.paidPence)}. Remaining balance: ${balance}.`;
  const customerText =
    event === "request_received"
      ? "We have received your appointment request. Your slot is temporarily held while we review it. This is not yet a confirmed booking. We will email your payment link after approval."
      : event === "deposit_ready"
        ? `Your appointment request has been approved. ${detail}\n${record.bundlePricing ? "The amount due includes your facial deposit and skincare products paid in full." : "The amount due is your 50% appointment deposit."}\nPay securely: ${record.checkoutUrl}\nPayment link expires: ${new Date(record.expiresAt!).toLocaleString("en-GB", { timeZone: "Europe/London" })} (UK time).`
        : `Your appointment is confirmed. Thank you. ${detail}`;
  const recipients: {
    audience: "owner" | "customer";
    channel: "email" | "whatsapp";
    to: string;
  }[] = [{ audience: "customer", channel: "email", to: record.customer.email }];
  if (event !== "deposit_ready")
    recipients.push(
      { audience: "owner", channel: "email", to: ownerEmail },
      { audience: "owner", channel: "whatsapp", to: ownerWhatsapp },
    );
  if (record.customer.whatsappUpdates === true)
    recipients.push({
      audience: "customer",
      channel: "whatsapp",
      to: record.customer.phone,
    });
  for (const target of recipients) {
    const id = createHash("sha256")
      .update(
        `${record.id}:${record.revision}:${event}:${target.audience}:${target.channel}`,
      )
      .digest("hex");
    const text =
      target.audience === "customer"
        ? `Hello ${record.customer.name},\n\n${customerText}\n\nAppointment: ${appointment}\nReference: ${record.id}\nView your request: ${statusLink}\n\nElysian Beauty Spa\nReply to this email or contact ${ownerWhatsapp}.`
        : `${noticeNames[event]}\nClient: ${record.customer.name}\nAppointment: ${appointment}\nReference: ${record.id}\n${detail}\nOpen CRM: ${ownerLink}`;
    const job: NotificationJob = {
      ...target,
      id,
      recordId: record.id,
      revision: record.revision,
      event,
      status: "pending",
      subject: `Elysian — ${noticeNames[event]}`,
      text,
      variables: {
        "1": noticeNames[event],
        "2": record.customer.name.replace(/[\r\n\t]+/g, " ").slice(0, 100),
        "3": appointment,
        "4": record.id,
        "5": detail,
        "6":
          target.audience === "customer"
            ? event === "deposit_ready"
              ? record.checkoutUrl!
              : statusLink
            : ownerLink,
      },
      emailVariables: {
        CUSTOMER_NAME: record.customer.name,
        APPOINTMENT: appointment,
        REFERENCE: record.id,
        TOTAL: money(record.totalPence),
        DEPOSIT_AMOUNT: money(record.amountDuePence),
        PAID_AMOUNT: money(record.paidPence),
        BALANCE: balance,
        CHECKOUT_URL: record.checkoutUrl || statusLink,
        EXPIRES: record.expiresAt
          ? new Date(record.expiresAt).toLocaleString("en-GB", {
              timeZone: "Europe/London",
            }) + " (UK time)"
          : "",
        STATUS_URL: statusLink,
        OWNER_CRM_URL: ownerLink,
        UPDATE_TITLE: noticeNames[event],
        PAYMENT_DETAIL:
          detail +
          (event === "deposit_ready"
            ? record.bundlePricing
              ? " This includes your 50% facial deposit and discounted skincare products paid in full."
              : " This is your 50% appointment deposit."
            : ""),
      },
      attempts: 0,
      nextAttemptAt: 0,
      updatedAt: Date.now(),
    };
    await store.db
      .prepare(
        "INSERT OR IGNORE INTO notifications(id, record_id, data) VALUES(?,?,?)",
      )
      .run(id, record.id, JSON.stringify(job));
  }
}
// Product confirmations use the same durable outbox as bookings. Call only
// after verified payment; unpaid, refunded and cancelled orders cannot send.
export async function queueOrderNotice(
  store: Storage,
  config: Config,
  record: PaymentRecord,
) {
  if (!validEvent(record, "order_confirmed", Date.now())) return;
  const settings = config.notifications;
  const ownerEmail = settings?.ownerEmail || "elainecll@hotmail.com";
  const ownerWhatsapp = settings?.ownerWhatsapp || "+447707328060";
  const statusLink = `${config.appUrl}/?receipt=${encodeURIComponent(record.receiptToken)}#payment`;
  const ownerLink = `${config.appUrl}/#crm`;
  const delivery =
    record.deliveryOption === "delivery"
      ? "Delivery selected. We will contact you about dispatch."
      : "Collection at Elysian Beauty Spa. Please contact us to arrange collection.";
  const items = record.items
    .map(
      (item) =>
        `${item.quantity}× ${item.name} — ${money((item.unitPricePence ?? 0) * item.quantity)}`,
    )
    .join("\n");
  const summary = `${items}\n${record.discountPence ? `Discount: -${money(record.discountPence)}\n` : ""}${record.shippingPence ? `Delivery: ${money(record.shippingPence)}\n` : ""}Total: ${money(record.totalPence)}\nPayment received: ${money(record.paidPence)}`;
  const recipients: {
    audience: "owner" | "customer";
    channel: "email" | "whatsapp";
    to: string;
  }[] = [
    { audience: "customer", channel: "email", to: record.customer.email },
    { audience: "owner", channel: "email", to: ownerEmail },
    { audience: "owner", channel: "whatsapp", to: ownerWhatsapp },
  ];
  if (record.customer.whatsappUpdates === true)
    recipients.push({
      audience: "customer",
      channel: "whatsapp",
      to: record.customer.phone,
    });
  for (const target of recipients) {
    const id = createHash("sha256")
      .update(
        `${record.id}:${record.revision}:order_confirmed:${target.audience}:${target.channel}`,
      )
      .digest("hex");
    const text =
      target.audience === "customer"
        ? `Hello ${record.customer.name},\n\nThank you. Your product order is confirmed and payment has been received.\n\n${summary}\n\n${delivery}\nReference: ${record.id}\nView your order: ${statusLink}\n\nElysian Beauty Spa\nReply to this email or contact ${ownerWhatsapp}.`
        : `Product payment received\nCustomer: ${record.customer.name}\nReference: ${record.id}\n${summary}\n${delivery}\nOpen CRM: ${ownerLink}`;
    const job: NotificationJob = {
      ...target,
      id,
      recordId: record.id,
      revision: record.revision,
      event: "order_confirmed",
      status: "pending",
      subject: "Elysian — Payment received — product order confirmed",
      text,
      variables: {
        "1": "Product order confirmed",
        "2": record.customer.name.replace(/[\r\n\t]+/g, " ").slice(0, 100),
        "3":
          record.deliveryOption === "delivery"
            ? "Product order — delivery"
            : "Product order — collection",
        "4": record.id,
        "5": `Payment received: ${money(record.paidPence)}.`,
        "6": target.audience === "customer" ? statusLink : ownerLink,
      },
      attempts: 0,
      nextAttemptAt: 0,
      updatedAt: Date.now(),
    };
    await store.db
      .prepare(
        "INSERT OR IGNORE INTO notifications(id, record_id, data) VALUES(?,?,?)",
      )
      .run(id, record.id, JSON.stringify(job));
  }
}
async function jobs(store: Storage, recordId?: string) {
  const rows = (await (recordId
    ? store.db
        .prepare("SELECT data FROM notifications WHERE record_id=?")
        .all(recordId)
    : store.db.prepare("SELECT data FROM notifications").all())) as {
    data: string;
  }[];
  return rows.map((row) => JSON.parse(row.data) as NotificationJob);
}
async function saveJob(store: Storage, job: NotificationJob) {
  await store.db
    .prepare("UPDATE notifications SET data=? WHERE id=?")
    .run(JSON.stringify(job), job.id);
}
export function verifyResendWebhook(
  config: Config,
  payload: string,
  headers: { id: string; timestamp: string; signature: string },
) {
  const secret = config.notifications?.resendWebhookSecret;
  if (!secret) throw new Error("Resend delivery webhook is not configured.");
  // Verification uses the signing secret locally; it needs no account API access.
  return new Resend("webhook-verification-only").webhooks.verify({
    payload,
    headers,
    webhookSecret: secret,
  });
}
export async function recordEmailDelivery(
  store: Storage,
  eventId: string,
  event: { type: string; created_at: string; data: { email_id: string } },
) {
  const eventAt = Date.parse(event.created_at);
  if (!Number.isFinite(eventAt))
    throw new Error("Invalid delivery event timestamp.");
  const state = ["email.delivered", "email.opened", "email.clicked"].includes(
    event.type,
  )
    ? "delivered"
    : [
          "email.bounced",
          "email.complained",
          "email.failed",
          "email.suppressed",
        ].includes(event.type)
      ? "failed"
      : undefined;
  if (!state) return;
  await store.transaction(async () => {
    const key = `resend:${eventId}`;
    if (await store.hasEvent(key)) return;
    for (const job of await jobs(store)) {
      if (
        job.channel !== "email" ||
        job.providerId !== event.data.email_id ||
        eventAt < (job.deliveryEventAt ?? 0)
      )
        continue;
      job.status = state;
      job.deliveryEventAt = eventAt;
      job.updatedAt = Date.now();
      job.detail =
        state === "delivered"
          ? "Delivery confirmed by Resend's signed webhook."
          : "Resend reports a bounce, complaint or delivery failure. Check its delivery log.";
      await saveJob(store, job);
    }
    await store.addEvent(key);
  });
}
export async function dispatchNotifications(
  store: Storage,
  config: Config,
  transport: NotificationTransport,
  recordId?: string,
  now = Date.now(),
) {
  const candidates = (await jobs(store, recordId)).filter(
    (job) =>
      job.status === "pending" ||
      (job.status === "not_configured" &&
        (job.channel === "email"
          ? emailReady(config)
          : whatsappReady(config, job.audience))) ||
      (job.status === "sending" && job.updatedAt < now - 120000) ||
      (job.status === "failed" &&
        !job.providerId &&
        job.attempts < 4 &&
        job.nextAttemptAt <= now),
  );
  // Current payment confirmations take priority over an older request notice.
  const priority = {
    request_received: 0,
    deposit_ready: 1,
    booking_confirmed: 2,
    order_confirmed: 2,
  };
  candidates.sort(
    (a, b) =>
      priority[b.event] - priority[a.event] || b.updatedAt - a.updatedAt,
  );
  // At most four bounded HTTP calls per request, awaited before serverless completion.
  await Promise.all(
    candidates.slice(0, 4).map(async (job) => {
      if (job.status === "sending") {
        if (job.updatedAt < now - 120000) {
          job.status = "unknown";
          job.detail =
            "Sending was interrupted. Check provider logs before sending again.";
          await saveJob(store, job);
        }
        return;
      }
      const record = await store.get(job.recordId);
      if (
        !record ||
        record.revision !== job.revision ||
        !validEvent(record, job.event, now)
      ) {
        job.status = "skipped";
        job.detail =
          "This record has changed; this message is no longer current.";
        job.updatedAt = now;
        await saveJob(store, job);
        return;
      }
      if (
        !(job.channel === "email"
          ? emailReady(config)
          : whatsappReady(config, job.audience))
      ) {
        job.status = "not_configured";
        job.detail = `${job.channel === "email" ? "Email" : "WhatsApp"} sending is not activated.`;
        job.updatedAt = now;
        await saveJob(store, job);
        return;
      }
      const previous = JSON.stringify(job);
      const claimed = {
        ...job,
        status: "sending" as const,
        attempts: job.attempts + 1,
        updatedAt: now,
        detail: undefined,
      };
      const changed = await store.db
        .prepare("UPDATE notifications SET data=? WHERE id=? AND data=?")
        .run(JSON.stringify(claimed), job.id, previous);
      if (!Number(changed.changes)) return;
      Object.assign(job, claimed);
      try {
        job.providerId = await transport.send(job);
        job.status = "accepted";
        job.detail =
          "Accepted by the messaging service; delivery has not yet been verified.";
      } catch (error) {
        job.status =
          error instanceof SendError && !error.uncertain ? "failed" : "unknown";
        job.detail =
          error instanceof SendError
            ? error.message
            : "Sending could not be verified. Check the provider log before sending again.";
        job.nextAttemptAt = now + 60000 * 2 ** job.attempts;
      }
      job.updatedAt = now;
      await saveJob(store, job);
    }),
  );
}
export async function notificationFeed(
  store: Storage,
  config: Config,
  transport: NotificationTransport,
  recordId: string,
): Promise<NotificationFeed> {
  const list = await jobs(store, recordId);
  // Provider status is verified on the authenticated CRM screen, never assumed.
  await Promise.all(
    list
      .filter(
        (job) =>
          job.status === "accepted" &&
          job.providerId &&
          (job.channel === "email"
            ? emailReady(config)
            : whatsappReady(config, job.audience)),
      )
      .slice(0, 3)
      .map(async (job) => {
        try {
          const state = await transport.check?.(job);
          if (state && state !== job.status) {
            job.status = state;
            job.updatedAt = Date.now();
            job.detail =
              state === "delivered"
                ? "Delivery confirmed by the messaging service."
                : state === "failed"
                  ? "The messaging service reports delivery failed. Check its delivery log."
                  : job.detail;
            await saveJob(store, job);
          }
        } catch {
          /* Keep the last verified status during provider outages. */
        }
      }),
  );
  return {
    ...notificationReadiness(config),
    notifications: list.map(
      ({ id, event, channel, audience, status, detail, updatedAt }) => ({
        id,
        event,
        channel,
        audience,
        status,
        detail,
        updatedAt,
      }),
    ),
  };
}
