import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import Stripe from "stripe";
import { z } from "zod";
import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import {
  approvalSchema,
  bookingSchema,
  bookingQuote,
  shopSchema,
  shopQuote,
} from "./catalogue.js";
import type { Storage as Store } from "./storage.js";
import {
  CalendarError,
  checkoutDeadline,
  availabilitySchema,
  hoursSchema,
  manualSchema,
  dateSchema,
  availability,
  durationForSelection,
  treatmentMinutes,
  forBooking,
  reserve,
  entries,
  entry,
  saveEntry,
  active,
  makeEntry,
  readHours,
  expireRequests,
  updateBookingEntry,
  migrateDiary,
} from "./calendar.js";
import { shiftDate } from "../shared/calendar.js";
import { reviewSchema, reviewTreatment } from "./reviews.js";
import type { ClientReview } from "../shared/reviews.js";
import { exclusive } from "./storage.js";
import type { Config } from "./config.js";
import {
  consultationReviewSchema,
  getConsultation,
  saveConsultation,
  validateConsultation,
} from "./consultation.js";
import {
  londonDate,
  type PaymentRecord,
  type Receipt,
} from "../shared/payments.js";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const route =
  (fn: (req: Request, res: Response) => Promise<unknown> | unknown) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);
const receipt = (r: PaymentRecord): Receipt => ({
  id: r.id,
  type: r.type,
  items: r.items,
  date: r.date,
  time: r.time,
  isCourse: r.isCourse,
  courseSessions: r.courseSessions,
  courseReward: r.courseReward,
  totalPence: r.totalPence,
  amountDuePence: r.amountDuePence,
  paidPence: r.paidPence,
  refundedPence: r.refundedPence,
  paymentStatus: r.paymentStatus,
  status: r.status,
  shippingPence: r.shippingPence,
  discountPence: r.discountPence,
  deliveryOption: r.deliveryOption,
  holdUntil: r.holdUntil,
  durationMinutes: r.durationMinutes,
});
export function createApp(config: Config, store: Store, gateway?: Stripe) {
  const ready = exclusive(store, async () => {
    await migrateDiary(store);
  });
  const app = express();
  app.disable("x-powered-by");
  if (process.env.VERCEL === "1")
    app.use((req, _res, next) => {
      const forwarded = req.get("x-vercel-forwarded-for");
      if (forwarded)
        Object.defineProperty(req, "ip", {
          value: forwarded.split(",")[0].trim(),
        });
      next();
    });
  // Serialize a local SQLite connection across awaited operations. Production also
  // takes a cross-instance advisory lock on its dedicated Postgres connection.
  void ready.catch(() => undefined);
  app.use((_req, res, next) => {
    void exclusive(store, async () => {
      await ready;
      await new Promise<void>((resolve) => {
        res.once("finish", resolve);
        next();
      });
    }).catch(next);
  });
  const stripe =
    gateway ??
    (config.stripeSecretKey
      ? new Stripe(config.stripeSecretKey, {
          timeout: 15000,
          maxNetworkRetries: 1,
        })
      : undefined);
  const locks = new Map<string, Promise<unknown>>();
  async function locked<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const previous = locks.get(id) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(fn);
    locks.set(id, current);
    try {
      return await current;
    } finally {
      if (locks.get(id) === current) locks.delete(id);
    }
  }
  function paymentGateway() {
    if (
      store.path === "postgres" &&
      (!config.ownerUsername || !config.ownerPassword)
    ) {
      throw new HttpError(
        503,
        "Payments are awaiting owner dashboard configuration.",
      );
    }
    if (!stripe || !config.webhookSecret)
      throw new HttpError(
        503,
        "Payments are not configured. Set Stripe and webhook credentials on the server.",
      );
    return stripe;
  }
  async function reconcile(sessionId: string) {
    const session =
      await paymentGateway().checkout.sessions.retrieve(sessionId);
    if (session.livemode !== (config.paymentMode === "live"))
      throw new HttpError(
        400,
        "The Stripe payment mode does not match this server.",
      );
    const attempt =
      (await store.attemptBySession(sessionId)) ??
      (session.metadata?.attemptKey
        ? await store.attemptByKey(session.metadata.attemptKey)
        : undefined);
    if (
      !attempt ||
      session.metadata?.recordId !== attempt.recordId ||
      session.client_reference_id !== attempt.recordId ||
      (attempt.sessionId && attempt.sessionId !== session.id)
    )
      throw new HttpError(400, "Checkout session does not match an order.");
    if (
      session.currency !== "gbp" ||
      session.amount_total !== attempt.expectedPence
    )
      throw new HttpError(
        400,
        "Checkout amount does not match the approved amount.",
      );
    return locked(attempt.recordId, async () => {
      const record = await store.get(attempt.recordId);
      if (!record) throw new HttpError(404, "Record not found.");
      const intent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      await store.transaction(async () => {
        await store.attachSession(attempt.key, session.id);
        if (session.payment_status === "paid") {
          if (!intent)
            throw new HttpError(400, "Paid session has no payment reference.");
          // Paid amounts are assigned, never accumulated, so retries cannot double-count revenue.
          if (record.paidPence === 0) {
            record.paidPence = attempt.expectedPence;
            record.paymentStatus = "paid";
            if (record.status !== "cancelled") record.status = "confirmed";
            record.checkoutUrl = undefined;
            await store.save(record);
            if (record.type === "booking")
              await updateBookingEntry(store, record);
          }
          await store.attachIntent(session.id, intent);
        } else if (
          session.status === "expired" &&
          record.status !== "cancelled" &&
          (!record.stripeSessionId || record.stripeSessionId === session.id) &&
          record.paidPence === 0
        ) {
          record.paymentStatus = "expired";
          record.status = "expired";
          record.checkoutUrl = undefined;
          await store.save(record);
          if (record.type === "booking")
            await updateBookingEntry(store, record);
        }
      });
      return (await store.get(record.id))!;
    });
  }
  async function refreshCalendar() {
    await expireRequests(store);
    for (const record of await store.list()) {
      if (
        record.type === "booking" &&
        !record.paidPence &&
        record.status === "awaiting_payment" &&
        (record.expiresAt ?? Infinity) <= Date.now()
      ) {
        if (record.stripeSessionId) await reconcile(record.stripeSessionId);
        else if (await store.attemptByKey(`${record.id}:${record.revision}`)) {
          // Recover a lost Stripe create response before checking expiry.
          await checkout(record);
          const recovered = (await store.get(record.id))!;
          if (recovered.stripeSessionId)
            await reconcile(recovered.stripeSessionId);
        }
      }
    }
  }
  async function checkout(record: PaymentRecord) {
    const gateway = paymentGateway();
    if (record.status === "cancelled")
      throw new HttpError(409, "This booking was cancelled.");
    if (record.paidPence > 0)
      return { receiptToken: record.receiptToken, recordId: record.id };
    if (record.checkoutUrl && (record.expiresAt ?? 0) > Date.now())
      return {
        url: record.checkoutUrl,
        receiptToken: record.receiptToken,
        recordId: record.id,
      };
    const key = `${record.id}:${record.revision}`;
    const existingAttempt = await store.attemptByKey(key);
    if (
      existingAttempt &&
      existingAttempt.expectedPence !== record.amountDuePence
    )
      throw new HttpError(
        409,
        "Retry the existing quote before changing its price.",
      );
    // Persist expiry before calling Stripe: all parameters must stay identical on a retry.
    if (!record.expiresAt) {
      record.expiresAt =
        record.type === "booking"
          ? checkoutDeadline(record)
          : (Math.floor(Date.now() / 1000) + 24 * 60 * 60) * 1000;
      await store.save(record);
    }
    await store.addAttempt({
      key,
      recordId: record.id,
      expectedPence: record.amountDuePence,
      sessionId: null,
      paymentIntent: null,
    });
    const session = await gateway.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        currency: "gbp",
        customer_email: record.customer.email,
        client_reference_id: record.id,
        metadata: { recordId: record.id, attemptKey: key },
        payment_intent_data: {
          metadata: { recordId: record.id, attemptKey: key },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: record.amountDuePence,
              product_data: {
                name:
                  record.type === "booking"
                    ? `50% appointment deposit — ${record.id}`
                    : `Elysian boutique order — ${record.id}`,
              },
            },
          },
        ],
        expires_at: Math.floor(record.expiresAt / 1000),
        success_url: `${config.appUrl}/?receipt=${record.receiptToken}#payment`,
        cancel_url: `${config.appUrl}/?receipt=${record.receiptToken}&cancelled=1#payment`,
      },
      { idempotencyKey: key },
    );
    if (!session.url)
      throw new HttpError(502, "Stripe did not return a checkout link.");
    const current = (await store.get(record.id))!;
    await store.transaction(async () => {
      await store.attachSession(key, session.id);
      await store.save({
        ...current,
        stripeSessionId: session.id,
        checkoutUrl:
          current.paidPence || current.status === "cancelled"
            ? undefined
            : session.url!,
        expiresAt: session.expires_at * 1000,
      });
      if (current.type === "booking")
        await updateBookingEntry(store, (await store.get(current.id))!);
    });
    return {
      url:
        current.paidPence || current.status === "cancelled"
          ? undefined
          : session.url,
      receiptToken: current.receiptToken,
      recordId: current.id,
    };
  }
  async function refund(chargeId: string) {
    const charge = await paymentGateway().charges.retrieve(chargeId);
    const intent =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
    const attempt = intent && (await store.attemptByIntent(intent));
    if (
      !attempt ||
      charge.livemode !== (config.paymentMode === "live") ||
      charge.currency !== "gbp" ||
      charge.amount !== attempt.expectedPence
    )
      throw new HttpError(400, "Refund does not match a verified payment.");
    await locked(attempt.recordId, async () => {
      const record = (await store.get(attempt.recordId))!;
      if (!record.paidPence)
        throw new HttpError(
          409,
          "Payment must be confirmed before its refund.",
        );
      record.refundedPence = Math.max(
        record.refundedPence,
        charge.amount_refunded,
      );
      record.paymentStatus =
        record.refundedPence >= record.paidPence
          ? "refunded"
          : record.refundedPence > 0
            ? "partially_refunded"
            : "paid";
      await store.save(record);
    });
  }
  async function failedPayment(intentId: string) {
    const intent = await paymentGateway().paymentIntents.retrieve(intentId);
    const attempt =
      intent.metadata.attemptKey &&
      (await store.attemptByKey(intent.metadata.attemptKey));
    if (
      !attempt ||
      intent.livemode !== (config.paymentMode === "live") ||
      intent.metadata.recordId !== attempt.recordId ||
      intent.currency !== "gbp" ||
      intent.amount !== attempt.expectedPence
    )
      throw new HttpError(
        400,
        "Failed payment does not match a checkout attempt.",
      );
    await locked(attempt.recordId, async () => {
      const record = (await store.get(attempt.recordId))!;
      if (
        intent.status === "requires_payment_method" &&
        !record.paidPence &&
        record.stripeSessionId === attempt.sessionId
      ) {
        record.paymentStatus = "failed";
        await store.save(record);
      }
    });
  }
  app.use("/api", (_req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    });
    next();
  });
  // Must precede express.json(): Stripe signs the exact raw bytes.
  app.get("/api/stripe/webhook", (_req, res) =>
    res
      .set("Allow", "POST")
      .status(405)
      .json({ error: "Stripe sends signed POST requests to this endpoint." }),
  );
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json", limit: "100kb" }),
    route(async (req, res) => {
      const signature = req.get("stripe-signature");
      if (!signature) throw new HttpError(400, "Missing webhook signature.");
      const gateway = paymentGateway();
      let event: Stripe.Event;
      try {
        event = gateway.webhooks.constructEvent(
          req.body,
          signature,
          config.webhookSecret!,
        );
      } catch {
        throw new HttpError(400, "Invalid webhook signature.");
      }
      if (event.livemode !== (config.paymentMode === "live"))
        throw new HttpError(
          400,
          "The Stripe payment mode does not match this server.",
        );
      if (!(await store.hasEvent(event.id))) {
        if (
          [
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded",
            "checkout.session.expired",
          ].includes(event.type)
        ) {
          await reconcile((event.data.object as Stripe.Checkout.Session).id);
        } else if (event.type === "checkout.session.async_payment_failed") {
          const session = event.data.object as Stripe.Checkout.Session;
          await reconcile(session.id);
          const attempt = await store.attemptBySession(session.id);
          if (attempt)
            await locked(attempt.recordId, async () => {
              const r = (await store.get(attempt.recordId))!;
              if (!r.paidPence && r.stripeSessionId === session.id) {
                r.paymentStatus = "failed";
                await store.save(r);
              }
            });
        } else if (event.type === "payment_intent.payment_failed")
          await failedPayment((event.data.object as Stripe.PaymentIntent).id);
        else if (event.type === "charge.refunded")
          await refund((event.data.object as Stripe.Charge).id);
        await store.addEvent(event.id);
      }
      res.json({ received: true });
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  // All browser mutations require the configured origin; webhooks are handled above.
  app.use("/api", (req, _res, next) => {
    if (
      ["POST", "PATCH", "DELETE"].includes(req.method) &&
      req.get("origin") !== config.appUrl
    )
      return next(new HttpError(403, "Request origin is not allowed."));
    next();
  });
  const loginAttempts = new Map<
    string,
    {
      count: number;
      reset: number;
    }
  >();
  const passwordSalt = randomBytes(16);
  const passwordHash = config.ownerPassword
    ? scryptSync(config.ownerPassword, passwordSalt, 64)
    : null;
  async function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
  ) {
    try {
      const token = req.headers.cookie
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("elysian_session="))
        ?.slice("elysian_session=".length);
      const row =
        token &&
        ((await store.db
          .prepare("SELECT expires_at FROM sessions WHERE token_hash=?")
          .get(hash(token))) as
          | {
              expires_at: number;
            }
          | undefined);
      if (!row || row.expires_at <= Date.now())
        return next(new HttpError(401, "Sign in to the owner dashboard."));
      next();
    } catch (error) {
      next(error);
    }
  }
  app.get(
    "/api/reviews",
    route(async (req, res) => {
      const cursor =
        req.query.cursor === undefined
          ? undefined
          : z.coerce
              .number()
              .int()
              .positive()
              .max(Number.MAX_SAFE_INTEGER)
              .parse(req.query.cursor);
      res.json(await store.publicReviews(cursor));
    }),
  );
  app.post(
    "/api/reviews",
    route(async (req, res) => {
      const input = reviewSchema.parse(req.body);
      const key = req.get("idempotency-key");
      if (!key || !/^[a-zA-Z0-9-]{20,100}$/.test(key))
        throw new HttpError(400, "A valid submission identifier is required.");
      const fingerprint = hash(JSON.stringify(input));
      const result = await store.transaction(async () => {
        const existing = await store.reviewBySubmission(key);
        if (existing) {
          if (existing.fingerprint !== fingerprint)
            throw new HttpError(
              409,
              "This submission identifier has already been used for different review details.",
            );
          return {
            id: existing.review.id,
            status: existing.review.status,
            published: existing.review.status === "published",
            created: false,
          };
        }
        if (!(await store.consumeReviewLimit(hash(req.ip || "local")))) {
          res.set("Retry-After", "3600");
          throw new HttpError(
            429,
            "Too many reviews submitted. Please try again in one hour.",
          );
        }
        const review: ClientReview = {
          id: `REV-${randomUUID()}`,
          author: input.author,
          serviceId: input.serviceId,
          ...reviewTreatment(input.serviceId),
          rating: input.rating,
          comment: input.comment,
          createdAt: new Date().toISOString(),
        };
        await store.insertReview(review, key, fingerprint);
        return {
          id: review.id,
          status: "pending" as const,
          published: false,
          created: true,
        };
      });
      res.status(result.created ? 201 : 200).json({
        id: result.id,
        status: result.status,
        published: result.published,
      });
    }),
  );
  app.get(
    "/api/owner/reviews",
    authenticate,
    route(async (_req, res) =>
      res.json({ reviews: await store.ownerReviews() }),
    ),
  );
  app.patch(
    "/api/owner/reviews/:id",
    authenticate,
    route(async (req, res) => {
      const input = z
        .object({ status: z.enum(["published", "hidden"]) })
        .strict()
        .parse(req.body);
      if (!(await store.setReviewStatus(req.params.id, input.status)))
        throw new HttpError(404, "Review not found.");
      res.json({ updated: true });
    }),
  );
  app.get("/api/health", (_req, res) =>
    res.json({
      ok: true,
      mode: config.paymentMode ?? "test",
      database: store.path === "postgres" ? "postgres" : "sqlite",
      consultationsConfigured:
        store.path !== "postgres" || !!process.env.HEALTH_DATA_KEY,
      paymentsConfigured: !!stripe && !!config.webhookSecret,
      ownerConfigured: !!passwordHash && !!config.ownerUsername,
    }),
  );
  app.post(
    "/api/owner/login",
    route(async (req, res) => {
      if (!passwordHash || !config.ownerUsername)
        throw new HttpError(
          503,
          "Set OWNER_USERNAME and OWNER_PASSWORD on the server.",
        );
      const ip = req.ip || "local";
      if (store.path === "postgres") {
        const key = hash(ip);
        await store.db
          .prepare("DELETE FROM login_limits WHERE reset_at <= ?")
          .run(Date.now());
        const bucket = (await store.db
          .prepare("SELECT count FROM login_limits WHERE key=?")
          .get(key)) as { count: number } | undefined;
        if ((bucket?.count ?? 0) >= 5)
          throw new HttpError(
            429,
            "Too many sign-in attempts. Try again in 15 minutes.",
          );
        await store.db
          .prepare(
            "INSERT INTO login_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=login_limits.count+1",
          )
          .run(key, Date.now() + 15 * 60000);
      }
      const now = Date.now();
      // Remove old buckets to keep this local process bounded.
      for (const [key, value] of loginAttempts)
        if (value.reset <= now) loginAttempts.delete(key);
      const attempts = loginAttempts.get(ip) ?? {
        count: 0,
        reset: now + 15 * 60 * 1000,
      };
      if (attempts.count >= 5)
        throw new HttpError(
          429,
          "Too many sign-in attempts. Try again in 15 minutes.",
        );
      attempts.count++;
      loginAttempts.set(ip, attempts);
      const input = z
        .object({
          username: z.string().max(100),
          password: z.string().max(1024),
        })
        .strict()
        .parse(req.body);
      const valid = timingSafeEqual(
        scryptSync(input.password, passwordSalt, 64),
        passwordHash,
      );
      if (!valid || input.username !== config.ownerUsername)
        throw new HttpError(401, "Invalid owner credentials.");
      loginAttempts.delete(ip);
      if (store.path === "postgres")
        await store.db
          .prepare("DELETE FROM login_limits WHERE key=?")
          .run(hash(ip));
      const token = randomBytes(32).toString("hex");
      await store.db
        .prepare("DELETE FROM sessions WHERE expires_at <= ?")
        .run(now);
      await store.db
        .prepare("INSERT INTO sessions VALUES(?,?)")
        .run(hash(token), now + 4 * 60 * 60 * 1000);
      res.cookie("elysian_session", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: config.appUrl.startsWith("https:"),
        maxAge: 4 * 60 * 60 * 1000,
        path: "/api",
      });
      res.json({ authenticated: true });
    }),
  );
  app.get("/api/owner/session", authenticate, (_req, res) =>
    res.json({ authenticated: true }),
  );
  app.post(
    "/api/owner/logout",
    route(async (req, res) => {
      const token = req.headers.cookie
        ?.split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("elysian_session="))
        ?.slice("elysian_session=".length);
      if (token)
        await store.db
          .prepare("DELETE FROM sessions WHERE token_hash=?")
          .run(hash(token));
      res.clearCookie("elysian_session", {
        path: "/api",
        httpOnly: true,
        sameSite: "strict",
      });
      res.json({ authenticated: false });
    }),
  );
  async function submission(req: Request, type: string, data: unknown) {
    const key = req.get("idempotency-key");
    if (!key || !/^[a-zA-Z0-9-]{20,100}$/.test(key))
      throw new HttpError(400, "A valid submission identifier is required.");
    const submissionKey = `${type}:${key}`;
    const fingerprint = hash(JSON.stringify(data));
    const existing = await store.bySubmission(submissionKey);
    if (existing && existing.fingerprint !== fingerprint)
      throw new HttpError(
        409,
        "This submission identifier has already been used for different details.",
      );
    return { submissionKey, fingerprint, existing: existing?.record };
  }
  function newRecord(
    type: PaymentRecord["type"],
    customer: PaymentRecord["customer"],
  ): PaymentRecord {
    return {
      id: `ELS-${randomUUID()}`,
      type,
      customer,
      createdAt: new Date().toISOString(),
      items: [],
      subtotalPence: 0,
      totalPence: 0,
      amountDuePence: 0,
      shippingPence: 0,
      discountPence: 0,
      paidPence: 0,
      refundedPence: 0,
      paymentStatus: "unpaid",
      status: type === "booking" ? "requested" : "awaiting_payment",
      ownerNotes: "",
      receiptToken: randomBytes(32).toString("hex"),
      revision: 1,
    };
  }
  app.post(
    "/api/availability",
    route(async (req, res) => {
      const input = availabilitySchema.parse(req.body);
      let duration;
      try {
        duration = durationForSelection(input);
      } catch (error) {
        throw new HttpError(400, (error as Error).message);
      }
      await refreshCalendar();
      res.json(await availability(store, input.date, duration));
    }),
  );
  app.get(
    "/api/calendar/hours",
    route(async (_req, res) => res.json({ hours: await readHours(store) })),
  );
  app.get(
    "/api/owner/calendar",
    authenticate,
    route(async (req, res) => {
      const from = dateSchema.parse(req.query.from);
      const to = dateSchema.parse(req.query.to);
      if (to < from || to > shiftDate(from, 31))
        throw new HttpError(400, "Select a diary range of up to 31 days.");
      await refreshCalendar();
      const diary = await Promise.all(
        (await entries(store))
          .filter((e) => e.date >= from && e.date <= to)
          .map(async (e) => {
            const r = e.recordId && (await store.get(e.recordId));
            return {
              ...e,
              ...(r
                ? {
                    paymentStatus: r.paymentStatus,
                    recordStatus: r.status,
                    checkoutUrl: r.checkoutUrl,
                  }
                : {}),
            };
          }),
      );
      res.json({ entries: diary, hours: await readHours(store) });
    }),
  );
  app.patch(
    "/api/owner/calendar/hours",
    authenticate,
    route(async (req, res) => {
      const input = hoursSchema.parse(req.body);
      await store.db
        .prepare(
          "INSERT INTO calendar_settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
        )
        .run(JSON.stringify(input.hours));
      res.json({ hours: await readHours(store) });
    }),
  );
  app.post(
    "/api/owner/calendar",
    authenticate,
    route(async (req, res) => {
      const input = manualSchema.parse(req.body);
      const key = req.get("idempotency-key");
      if (!key || !/^[a-zA-Z0-9-]{20,100}$/.test(key))
        throw new HttpError(400, "A valid submission identifier is required.");
      await refreshCalendar();
      const fingerprint = hash(JSON.stringify(input));
      const result = await store.transaction(async () => {
        const previous = (await store.db
          .prepare("SELECT * FROM diary_submissions WHERE key=?")
          .get(key)) as
          | {
              fingerprint: string;
              entry_id: string;
            }
          | undefined;
        if (previous) {
          if (previous.fingerprint !== fingerprint)
            throw new HttpError(
              409,
              "This identifier was used for different details.",
            );
          return {
            entry: await entry(store, previous.entry_id),
            created: false,
          };
        }
        const value = makeEntry(input);
        await reserve(store, value, false);
        await store.db
          .prepare("INSERT INTO diary_submissions VALUES(?,?,?)")
          .run(key, fingerprint, value.id);
        return { entry: value, created: true };
      });
      res.status(result.created ? 201 : 200).json(result);
    }),
  );
  app.post(
    "/api/owner/calendar/:id/cancel",
    authenticate,
    route(async (req, res) => {
      z.object({}).strict().parse(req.body);
      // Serialize with approval; never release a slot while its checkout can still take payment.
      await locked(req.params.id, async () => {
        let e = await entry(store, req.params.id);
        if (!e) throw new HttpError(404, "Diary entry not found.");
        if (e.cancelled) return;
        let r = e.recordId ? await store.get(e.recordId) : undefined;
        if (r && !r.paidPence && r.status === "awaiting_payment") {
          if (
            !r.stripeSessionId &&
            (await store.attemptByKey(`${r.id}:${r.revision}`))
          )
            await checkout(r);
          r = (await store.get(r.id))!;
          if (r.stripeSessionId) {
            const gateway = paymentGateway();
            let session = await gateway.checkout.sessions.retrieve(
              r.stripeSessionId,
            );
            if (session.status === "open") {
              try {
                session = await gateway.checkout.sessions.expire(session.id);
              } catch {
                throw new HttpError(
                  409,
                  "Checkout may have completed. Refresh the record before cancelling.",
                );
              }
            }
            if (
              session.payment_status === "paid" ||
              session.status !== "expired"
            )
              throw new HttpError(
                409,
                "Payment may have completed. Refresh the record before cancelling.",
              );
            // An unverified session must not be trusted to release this record.
            if (
              session.client_reference_id !== r.id ||
              session.metadata?.recordId !== r.id ||
              session.amount_total !== r.amountDuePence ||
              session.currency !== "gbp" ||
              session.livemode !== (config.paymentMode === "live")
            )
              throw new HttpError(
                409,
                "Checkout could not be safely cancelled.",
              );
          }
        }
        await store.transaction(async () => {
          if (r && JSON.stringify(await store.get(r.id)) !== JSON.stringify(r))
            throw new HttpError(
              409,
              "This booking changed while cancellation was being checked. Refresh and try again.",
            );
          e = (await entry(store, req.params.id))!;
          e.cancelled = true;
          await saveEntry(store, e);
          if (r) {
            r = (await store.get(r.id))!;
            r.status = "cancelled";
            r.checkoutUrl = undefined;
            await store.save(r);
          }
        });
      });
      res.json({ cancelled: true });
    }),
  );
  app.post(
    "/api/bookings",
    route(async (req, res) => {
      if (
        store.path === "postgres" &&
        (!config.ownerUsername ||
          !config.ownerPassword ||
          !process.env.HEALTH_DATA_KEY)
      ) {
        throw new HttpError(
          503,
          "Online bookings are being set up. Please contact the spa to arrange your appointment.",
        );
      }
      const data = bookingSchema.parse(req.body);
      if (
        !validateConsultation(
          data.consultation,
          data.treatments.map((t) => t.serviceId),
          data.customTreatments.length > 0,
        )
      )
        throw new HttpError(
          400,
          "Complete the current health questions for every guest, including details for Yes or Unsure answers.",
        );
      const sub = await submission(req, "booking", data);
      if (sub.existing)
        return res.json({
          receipt: receipt(sub.existing),
          receiptToken: sub.existing.receiptToken,
        });
      let quote;
      try {
        quote = bookingQuote(data);
      } catch (error) {
        throw new HttpError(400, (error as Error).message);
      }
      await refreshCalendar();
      const result = await store.transaction(async () => {
        const retry = await store.bySubmission(sub.submissionKey);
        if (retry) return { record: retry.record, created: false };
        const record: PaymentRecord = {
          ...newRecord("booking", data.customer),
          ...quote,
          date: data.date,
          time: data.time,
          isCourse: data.isCourse,
          consultationStatus: "awaiting_review",
        };
        const reservation = forBooking(record);
        record.holdUntil = reservation.holdUntil;
        record.durationMinutes = reservation.durationMinutes;
        await reserve(store, reservation);
        const ip = hash(req.ip || "local");
        await store.db
          .prepare("DELETE FROM booking_limits WHERE reset_at <= ?")
          .run(Date.now());
        const bucket = (await store.db
          .prepare("SELECT count FROM booking_limits WHERE key=?")
          .get(ip)) as
          | {
              count: number;
            }
          | undefined;
        if ((bucket?.count ?? 0) >= 6)
          throw new HttpError(
            429,
            "Too many appointment requests. Contact the spa to book.",
          );
        await store.db
          .prepare(
            "INSERT INTO booking_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
          )
          .run(ip, Date.now() + 86400000);
        await store.insert(record, sub.submissionKey, sub.fingerprint);
        await saveConsultation(store, record.id, {
          input: data.consultation,
          submittedAt: new Date().toISOString(),
          status: "awaiting_review",
          notes: "",
        });
        return { record, created: true };
      });
      res.status(result.created ? 201 : 200).json({
        receipt: receipt(result.record),
        receiptToken: result.record.receiptToken,
      });
    }),
  );
  app.post(
    "/api/shop/checkout",
    route(async (req, res) => {
      paymentGateway();
      const data = shopSchema.parse(req.body);
      const sub = await submission(req, "sale", data);
      const result = await locked(sub.submissionKey, async () => {
        // Re-read after acquiring the lock to handle simultaneous duplicate requests.
        const existing = await store.bySubmission(sub.submissionKey);
        if (existing && existing.fingerprint !== sub.fingerprint)
          throw new HttpError(
            409,
            "This submission identifier has already been used for different details.",
          );
        let record = existing?.record;
        if (!record) {
          let quote;
          try {
            quote = shopQuote(data);
          } catch (error) {
            throw new HttpError(400, (error as Error).message);
          }
          record = {
            ...newRecord("sale", data.customer),
            ...quote,
            amountDuePence: quote.totalPence,
            deliveryOption: data.deliveryOption,
            deliveryAddress: data.deliveryAddress,
            promoCode: data.promoCode,
          };
          await store.insert(record, sub.submissionKey, sub.fingerprint);
        }
        if (
          record.stripeSessionId &&
          !record.paidPence &&
          (record.expiresAt ?? Infinity) <= Date.now()
        )
          record = await reconcile(record.stripeSessionId);
        if (record.paymentStatus === "expired")
          throw new HttpError(
            409,
            "Checkout has expired. Start a new checkout.",
          );
        return checkout(record);
      });
      res.json(result);
    }),
  );
  app.get(
    "/api/receipts/:token",
    route(async (req, res) => {
      if (!/^[a-f0-9]{64}$/.test(req.params.token))
        throw new HttpError(404, "Receipt not found.");
      await expireRequests(store);
      let record = await store.byReceipt(req.params.token);
      if (!record) throw new HttpError(404, "Receipt not found.");
      // Server retrieval also confirms payment when the webhook is delayed; the URL alone never does.
      if (record.stripeSessionId && record.paidPence === 0)
        record = await reconcile(record.stripeSessionId);
      res.json({
        receipt: receipt(record),
        checkoutUrl: record.paidPence ? undefined : record.checkoutUrl,
      });
    }),
  );
  app.get(
    "/api/owner/records",
    authenticate,
    route(async (_req, res) => {
      await refreshCalendar();
      for (const record of await store.list())
        if (
          record.stripeSessionId &&
          record.paidPence === 0 &&
          (record.expiresAt ?? Infinity) <= Date.now()
        )
          await reconcile(record.stripeSessionId);
      res.json({ records: await store.list() });
    }),
  );
  app.post(
    "/api/owner/records/:id/approve",
    authenticate,
    route(async (req, res) => {
      const input = approvalSchema.parse(req.body);
      await refreshCalendar();
      const id = req.params.id;
      // Reconcile an expired attempt before permitting a new payment attempt.
      const before = await store.get(id);
      if (
        before?.stripeSessionId &&
        before.paidPence === 0 &&
        (before.expiresAt ?? 0) <= Date.now()
      )
        await reconcile(before.stripeSessionId);
      const result = await locked(id, async () => {
        let record = await store.get(id);
        if (!record || record.type !== "booking")
          throw new HttpError(404, "Booking request not found.");
        const consultation = await getConsultation(store, record.id);
        if (
          consultation?.status !== "approved" ||
          !consultation.protocolChecked ||
          !consultation.consultationCompleted
        )
          throw new HttpError(
            409,
            "Complete and approve the private health consultation before creating a deposit link.",
          );
        if (record.status === "cancelled")
          throw new HttpError(
            409,
            "This appointment was cancelled. Submit a new request.",
          );
        if (record.paidPence)
          throw new HttpError(
            409,
            "This booking already has a verified payment.",
          );
        if (record.date! < londonDate())
          throw new HttpError(
            400,
            "The requested date has passed. Ask the customer to submit a new request.",
          );
        if (record.checkoutUrl && (record.expiresAt ?? 0) > Date.now()) {
          if (
            input.customPrices.length &&
            input.customPrices.some(
              (p) =>
                record.items.find((i) => i.id === p.id)?.unitPricePence !==
                p.pricePence,
            )
          )
            throw new HttpError(
              409,
              "An approved quote cannot change while checkout is active.",
            );
          return { ...(await checkout(record)), record };
        }
        const approvalSnapshot = JSON.stringify(record);
        const customs = record.items.filter((i) => i.custom);
        if (
          input.customPrices.length !== customs.length ||
          new Set(input.customPrices.map((p) => p.id)).size !==
            customs.length ||
          input.customPrices.some((p) => !customs.some((i) => i.id === p.id))
        )
          throw new HttpError(
            400,
            "Provide an approved price for every custom treatment.",
          );
        if (
          record.paymentStatus !== "expired" &&
          (await store.attemptByKey(`${record.id}:${record.revision}`)) &&
          input.customPrices.some(
            (p) =>
              record.items.find((i) => i.id === p.id)?.unitPricePence !==
              p.pricePence,
          )
        )
          throw new HttpError(
            409,
            "Retry the existing quote before changing its price.",
          );
        record.items = record.items.map((item) =>
          item.custom
            ? {
                ...item,
                unitPricePence: input.customPrices.find(
                  (p) => p.id === item.id,
                )!.pricePence,
              }
            : item,
        );
        record.totalPence = record.items.reduce(
          (sum, item) => sum + item.unitPricePence! * item.quantity,
          0,
        );
        record.subtotalPence = record.totalPence;
        record.amountDuePence = Math.round(record.totalPence / 2);
        if (record.paymentStatus === "expired") {
          record.revision++;
          record.stripeSessionId = undefined;
          record.checkoutUrl = undefined;
          record.expiresAt = undefined;
        }
        if (!record.expiresAt) record.expiresAt = checkoutDeadline(record);
        record.status = "awaiting_payment";
        record.paymentStatus = "unpaid";
        await store.transaction(async () => {
          if (JSON.stringify(await store.get(record.id)) !== approvalSnapshot)
            throw new HttpError(
              409,
              "This booking changed during approval. Refresh and try again.",
            );
          const reservation = forBooking(record, "payment");
          await reserve(store, reservation);
          record.holdUntil = undefined;
          record.durationMinutes = reservation.durationMinutes;
          await store.save(record);
        });
        await checkout(record);
        return { record: (await store.get(id))! };
      });
      res.json(result);
    }),
  );
  app.patch(
    "/api/owner/records/:id",
    authenticate,
    route(async (req, res) => {
      const input = z
        .object({
          ownerNotes: z.string().trim().max(2000).optional(),
          status: z.enum(["completed", "dispatched"]).optional(),
        })
        .strict()
        .parse(req.body);
      await locked(req.params.id, async () => {
        const record = await store.get(req.params.id);
        if (!record) throw new HttpError(404, "Record not found.");
        if (
          input.status &&
          (record.status === "cancelled" ||
            record.paymentStatus !== "paid" ||
            (input.status === "dispatched" && record.type !== "sale") ||
            (input.status === "completed" && record.type !== "booking"))
        )
          throw new HttpError(409, "Only verified payments can be fulfilled.");
        if (
          input.status === "completed" &&
          !(await getConsultation(store, record.id))?.dayOfChecks?.length
        )
          throw new HttpError(
            409,
            "Record the day-of-treatment health check and treatment consent first.",
          );
        await store.save({ ...record, ...input });
      });
      res.json({ record: await store.get(req.params.id) });
    }),
  );
  app.get(
    "/api/owner/records/:id/consultation",
    authenticate,
    route(async (req, res) => {
      const record = await store.get(req.params.id);
      if (!record || record.type !== "booking")
        throw new HttpError(404, "Booking request not found.");
      res.json({
        consultation: (await getConsultation(store, record.id)) ?? {
          status: "awaiting_review",
          notes: "",
        },
      });
    }),
  );
  app.patch(
    "/api/owner/records/:id/consultation",
    authenticate,
    route(async (req, res) => {
      const input = consultationReviewSchema.parse(req.body);
      await locked(
        req.params.id,
        async () =>
          await store.transaction(async () => {
            const record = await store.get(req.params.id);
            if (!record || record.type !== "booking")
              throw new HttpError(404, "Booking request not found.");
            if (
              (record.checkoutUrl || record.paidPence) &&
              record.status !== "cancelled" &&
              input.status !== "approved"
            )
              throw new HttpError(
                409,
                "Cancel the appointment before changing an approved consultation while checkout or a payment exists. Cancellation does not automatically refund payment.",
              );
            const previous = await getConsultation(store, record.id);
            if (
              !previous?.input &&
              (input.status === "approved" || input.notes) &&
              !input.offlineDataConsent
            )
              throw new HttpError(
                400,
                "Obtain and record the client's explicit health-data consent for this older booking before storing health notes or approving.",
              );
            await saveConsultation(store, record.id, {
              ...previous,
              ...input,
              reviewedAt: new Date().toISOString(),
              reviewedBy: config.ownerUsername,
            });
            await store.save({ ...record, consultationStatus: input.status });
          }),
      );
      res.json({ saved: true });
    }),
  );
  app.post(
    "/api/owner/records/:id/consultation/day-of-check",
    authenticate,
    route(async (req, res) => {
      z.object({
        healthChangesReviewed: z.literal(true),
        treatmentConsentObtained: z.literal(true),
      })
        .strict()
        .parse(req.body);
      await locked(
        req.params.id,
        async () =>
          await store.transaction(async () => {
            const record = await store.get(req.params.id);
            if (!record || record.type !== "booking")
              throw new HttpError(404, "Booking request not found.");
            if (
              !record.paidPence ||
              !["confirmed", "completed"].includes(record.status) ||
              record.date! > londonDate()
            )
              throw new HttpError(
                409,
                "Day-of checks can be recorded from the appointment date for confirmed bookings.",
              );
            const consultation = await getConsultation(store, record.id);
            if (consultation?.status !== "approved")
              throw new HttpError(
                409,
                "Complete the private consultation first.",
              );
            const date = londonDate();
            if (!consultation.dayOfChecks?.some((c) => c.date === date)) {
              consultation.dayOfChecks = [
                ...(consultation.dayOfChecks ?? []),
                {
                  date,
                  checkedAt: new Date().toISOString(),
                  checkedBy: config.ownerUsername!,
                  healthChangesReviewed: true,
                  treatmentConsentObtained: true,
                },
              ];
              await saveConsultation(store, record.id, consultation);
            }
          }),
      );
      res.json({ saved: true });
    }),
  );
  app.use("/api", (_req, _res, next) =>
    next(new HttpError(404, "API endpoint not found.")),
  );
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof z.ZodError)
        return res.status(400).json({
          error: error.issues
            .map((i) => `${i.path.join(".") || "Request"}: ${i.message}`)
            .join("; "),
        });
      if (error instanceof HttpError || error instanceof CalendarError)
        return res.status(error.status).json({ error: error.message });
      if (error instanceof SyntaxError)
        return res.status(400).json({ error: "Invalid request body." });
      // Never print Stripe requests, secrets, or customer data.
      console.error(
        "API request failed:",
        error instanceof Error ? error.name : "Unknown error",
      );
      res.status(500).json({
        error:
          "The request could not be completed. Retry using the same submission.",
      });
    },
  );
  return app;
}
