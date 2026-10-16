# Elysian Spa — storefront, payments and CRM

The React storefront now uses an Express API and a local SQLite database. Customer bookings start as requests; the owner approves availability and custom prices before sending a 50% deposit checkout link. Boutique orders charge the full server-calculated total. Stripe-hosted Checkout collects card details. There are no simulated payments or browser-only owner credentials.

## Start locally

Requirements: Node.js **24**, pnpm, and a Stripe sandbox account. Stripe's official CLI is included as a development dependency; use `pnpm exec stripe` to run it.

1. Run `pnpm install`.
2. Copy `.env.example` to `.env`. Set `OWNER_USERNAME` and a unique `OWNER_PASSWORD` of at least 12 characters. Set `STRIPE_SECRET_KEY` to the sandbox's `sk_test_` secret key. Keep all secrets in `.env`, which is ignored.
3. Run the project listener in another terminal:

   ```sh
   pnpm stripe:listen
   ```

   It authenticates to the same sandbox using `STRIPE_SECRET_KEY` through the CLI's environment, forwards the relevant payment events to the loopback backend, and saves the listener's signing secret privately in `.env`. Credentials are hidden from its output. No separate CLI login is needed. See [Stripe CLI API-key authentication](https://docs.stripe.com/cli/api_keys).

4. Keep the listener running. Its signing secret differs from a Dashboard webhook secret. Restart the listener if you change sandbox keys.
5. Run `pnpm dev`, then open **http://localhost:3000**. Keep Stripe CLI running. Restart the API after changing `.env`.
6. Run `pnpm check:stripe` to verify the local settings, CLI installation, Stripe sandbox API access, and backend configuration before attempting checkout. This check prints no credentials and never creates a payment. Follow the [sandbox test checklist](docs/STRIPE_SANDBOX_TESTS.md) for the end-to-end run.

The API listens only on loopback. `APP_URL` must match the browser origin; use localhost consistently. Without payment secrets, booking requests still work but checkout returns an explicit configuration error. Without owner credentials, the dashboard cannot sign in. Vite alone (`pnpm dev:web`) and `pnpm preview` do not start the payment API.

## Test the customer flows

- **Shop:** add products, enter a name, email and phone, choose delivery or collection, then continue to Stripe. `ELYSIAN10` and `TROPIC10` apply 10% discounts, rounded to the penny. Delivery is £3.95 below a £50 pre-discount subtotal, otherwise free. Prices are read from the server catalogue, never accepted from the browser.
- **Bookings:** submit a future appointment request. Open `#owner` in a separate browser profile and sign in. Select the record, enter any custom treatment prices in pounds, check that availability has been confirmed, and approve. Copy the resulting Stripe checkout link and open it as the customer. Links expire after up to 24 hours (earlier if the appointment starts sooner); the owner must approve expired booking quotes again.
- **Payment:** use Stripe's `4242 4242 4242 4242` test card, a future expiry date and any three-digit CVC. Only enter test card details on Stripe's page. Use `4000 0000 0000 0002` to test a decline and `4000 0025 0000 3155` for authentication. See [Stripe testing](https://docs.stripe.com/testing).
- **Return page:** shows checking, unpaid, expired, verified paid, or refunded states based on server records. A browser redirect does not authorize payment. Repeated Stripe events do not duplicate revenue. A customer who closes checkout after paying still gets a server record through the webhook. The receipt URL is private: anyone holding it can see the order summary, so share it only with the customer.
- **Refunds:** issue sandbox refunds in Stripe Dashboard. `charge.refunded` updates the ledger with the cumulative refunded amount. The owner can mark paid bookings completed or paid shop orders dispatched; the ledger keeps fulfillment and payment states separate.

The same local API/database serves every browser profile on this computer. Records and owner sessions survive API restarts in `data/elysian.sqlite`. Browser-local demo CRM records are not imported. Only the shopping basket and checkout/receipt-clearing markers use browser storage. A verified receipt clears purchased quantities only in the browser that started its checkout. The owner can filter/search server records, edit notes, add unpaid booking requests, and export CSV. Email/WhatsApp messages are manual; the app does not claim delivery.

## Checks

```sh
pnpm lint
pnpm test
pnpm build
```

Automated tests use the real Stripe SDK's webhook signature validation and an injected in-memory Stripe API fixture. They cover price tampering, validation, authentication, duplicate submissions/events, expiry, refunds, persistence, and payment confirmation without browser return. They do **not** move money or replace a sandbox end-to-end run with your credentials.

For the browser smoke test, keep `pnpm dev` running and run `pnpm test:browser`. Install its browser once with `pnpm exec playwright install chromium`, or set `CHROME_PATH` to your existing Chrome executable (on macOS, `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`). This test uses intercepted API fixtures to exercise checkout, return-page status, basket clearing, owner approval, mobile layouts and keyboard dismissal. Screenshots are saved under ignored `test-results/browser/`. It does not create database records or contact Stripe. Run `pnpm format` to format the payment implementation.

## Appointment calendar

Course offers now provide a free £30 Cinderella / Black Tie Facial with three paid sessions, or a free catalogue treatment priced at £60 with six paid sessions. Clients can select the £60 reward when booking or choose later with the owner. Every selected treatment and add-on is charged for the chosen three or six sessions; the complimentary reward is stored separately, adds no charge, and is arranged on a later visit. Booking receipts and owner records preserve the selected offer. Existing bookings under the previous four-for-three offer retain their original recorded terms.

Clients select treatments, an appointment date and an available UK time. Slots are offered every 15 minutes for the next 90 days. The server derives the full visit duration from catalogue options and custom minutes, then adds a fixed **30-minute rest / preparation break**. Variable 30–45-minute treatments reserve 45 minutes. Add-ons extend the same visit. Course pricing reserves only the first visit; arrange later visits separately. Twin treatments run consecutively for one therapist, with a break between the clients and after the appointment.

A submitted request reserves its interval for up to 24 hours while awaiting approval, ending sooner if its appointment starts. Approving a quote rechecks availability and replaces that hold with a protected Stripe payment reservation. Verified payment confirms the appointment. Deposit links expire within 24 hours and before the appointment starts; Stripe's minimum expiry window means approval requires the appointment to be at least 31 minutes away. Unapproved requests expire automatically. Checkout reservations are released only after Stripe verifies expiry, never from the local clock alone. If Stripe cannot be reached, uncertain payment reservations remain blocked. A cancelled checkout return or declined card does not release a still-active checkout; the client can retry payment.

Checking and inserting reservations happen in one SQLite write transaction. Conflicting requests receive HTTP 409 without creating an extra payment record. Identical submissions are idempotent. Six new booking requests per IP per day limit anonymous slot holding. The limit persists across restarts; production proxy configuration needs to identify client IPs correctly.

Open **Owner dashboard → Appointment diary** for day/week views, manual phone/WhatsApp appointments, holidays, blocked time and weekly opening hours. Manual appointments need no email or online payment and stay reserved until cancelled. They always receive a 30-minute break and cannot overlap, including when entered outside normal opening hours. Full-day holidays use `00:00` and `1440` minutes. The public Location page reads the same opening hours. Existing commitments survive schedule changes and migration; legacy overlaps are shown as an owner warning. UK daylight-saving gaps, repeated times and appointments spanning the clock change are rejected rather than guessed.

Use **Open booking / approve deposit** to approve a request or copy its checkout link. Cancelling a diary entry closes an open Stripe link before releasing its time. If a payment has just completed, refresh its record before cancelling. Cancellation is recorded separately from payment: no refund is automatically issued, and verified payments remain in the ledger. To reschedule, agree a new time with the client, cancel the old entry, then add the new appointment. External calendar sync and automated customer messages are not included.

### Calendar API

- `POST /api/availability` — accepts date, treatments, custom treatments and course flag; returns available times and server duration, with no client details.
- `GET /api/calendar/hours` — public weekly hours.
- `GET /api/owner/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` — authenticated diary, up to 31 days.
- `POST /api/owner/calendar` — authenticated manual appointment or blocked interval; requires an `Idempotency-Key`.
- `PATCH /api/owner/calendar/hours` — authenticated weekly hours.
- `POST /api/owner/calendar/:id/cancel` — authenticated cancellation and safe slot release; keeps historical records.

## Private health consultation

Booking requests require a versioned health questionnaire, with separate explicit health-data consent and an accuracy declaration. Each guest in a Bring a Friend booking completes their own section. All relevant questions require Yes / No / Unsure; Yes and Unsure require details. Questions change with the selected treatments and include broad disclosure prompts for packages/custom treatments. Changing treatments resets the declarations. These prompts are **not** a clinically complete contraindication checklist or an automated clearance system. The owner must check the actual manufacturer instructions, training and insurance requirements and discuss relevant answers with every guest.

Open a booking under **Owner dashboard → Bookings & orders → Open private health review**. Review outcomes are Awaiting health review, Further information needed, Approved following consultation and Deferred / unsuitable. Approval requires both product/device protocol review and a completed client consultation; the server blocks deposit creation until the private consultation is approved. Further-information/deferred requests retain only the existing temporary diary hold. Use diary cancellation to release it earlier. After checkout or payment, cancel the appointment before changing approval; refunds are separate. Older records require an offline consultation and recorded explicit health-data consent before private notes/approval. Manual diary appointments remain scheduling entries; maintain their consultation and treatment-consent documents separately.

On each visit, check health/medication changes and obtain actual treatment-specific consent covering risks and aftercare. The dashboard can record an owner attestation from the appointment date for confirmed bookings, once per day. This is an audit entry, **not** a generated or signed clinical consent document. Marking a booking completed requires a recorded day-of check. For courses, maintain checks and consent for every visit.

Health answers and consultation notes are stored in a separate SQLite table encrypted with AES-256-GCM and bound to the booking ID. The local server creates a 32-byte `DATABASE_PATH.health-key` sidecar with owner-only file permissions when the first consultation is saved. Keep this key out of Git and the frontend; losing it makes the health records unreadable. Back up the database and protect/back up the key separately, with access limited to authorised staff. This encryption does not protect against a compromised server with access to both the key and database. In-memory test stores use ephemeral keys. Missing keys for existing health rows fail closed.

Only the authenticated private-consultation endpoint returns health answers. Receipts, Stripe payloads, diary feeds and general ledger responses contain no questionnaire or private consultation notes. CSV exports use the general ledger. Keep health details out of general booking/owner/diary notes, which are not the encrypted health record. The browser does not save questionnaire answers in localStorage. Existing session expiry, origin validation, server body limits and no-store response headers also apply.

The form provides privacy information and a direct contact for access, correction, withdrawal and offline consultation. Before collecting real client data publicly, confirm/document the Article 6 lawful basis and Article 9 condition (the online intake is designed around explicit consent), review the need for a DPIA, agree a retention/deletion schedule with insurer/legal requirements, and set up access/withdrawal/deletion handling and backup retention. The local prototype does not automatically delete records or provide a self-service privacy portal. Follow [ICO special-category guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-are-the-rules-on-special-category-data/). It still needs the existing production HTTPS/backend/database work before use on the public Vercel site.

### Consultation API

- `POST /api/bookings` additionally requires `consultation` with the current version, participants, answers and separate consent/declaration booleans.
- `GET /api/owner/records/:id/consultation` — authenticated private health record; legacy requests return awaiting review.
- `PATCH /api/owner/records/:id/consultation` — authenticated owner decision, private notes, protocol/client-consultation attestations, and offline health-data consent for legacy records.
- `POST /api/owner/records/:id/consultation/day-of-check` — authenticated, date-stamped health-change and consent attestation; retries on the same UK day are idempotent.

## Client reviews

The Reviews page has a **Leave a review** button. Clients select a treatment, give 1–5 stars, enter a display name and 20–2,000 characters of feedback, then consent to public display after owner approval. Valid submissions are saved privately with a **pending** status in SQLite. Only an authenticated owner can authorise publication. No email, phone number or payment information is collected. These submissions are guest feedback; the site does not claim they are verified purchases.

The page refreshes approved submissions every 30 seconds while visible and loads older submissions with **Load more client reviews**. Review counts and average ratings include the existing catalogue reviews and published client submissions. In the owner dashboard's **Client reviews** tab, pending reviews appear first with **Approve & publish** and **Keep unpublished** controls. Published reviews can be hidden and later approved again. Pending and hidden reviews do not appear publicly or count toward ratings. Moderation survives server restarts. Existing client submissions from the previous automatic publication system move to pending on migration; previously hidden submissions stay hidden. Catalogue testimonials remain unchanged.

Submission identifiers prevent duplicate publication on retries. The server validates treatment IDs, rating, lengths and publishing consent, rejects markup and populated spam-trap fields, and allows three new reviews per client IP per hour. Limits persist across API restarts. Behind a production proxy, configure trusted proxy handling for accurate client IPs; do not broadly trust forwarded IP headers.

This works on the local full-stack preview. Deploying only Vite's `dist` folder to Vercel does not host the review API or SQLite database. Public client submissions use the deployed HTTPS API and Neon storage described below. Local development still uses SQLite.

### Review API

- `GET /api/reviews?cursor=…` — up to 20 visible reviews, next cursor and rating statistics.
- `POST /api/reviews` — save a pending review; requires an `Idempotency-Key`. Returns its moderation status and whether it is currently published. Retries preserve the existing moderation decision.
- `GET /api/owner/reviews` — authenticated owner list including pending and hidden reviews.
- `PATCH /api/owner/reviews/:id` — authenticated `{ "status": "published" | "hidden" }` moderation decision.

## Payment API

- `POST /api/bookings` — request an appointment; requires an `Idempotency-Key` header.
- `POST /api/shop/checkout` — create/reuse a hosted checkout; requires an `Idempotency-Key` header.
- `GET /api/receipts/:token` — get the private receipt and reconcile an unpaid Stripe session.
- `POST /api/owner/login`, `GET /api/owner/session`, `POST /api/owner/logout` — server-side owner sessions.
- `GET /api/owner/records`, `POST /api/owner/records/:id/approve`, `PATCH /api/owner/records/:id` — authenticated ledger, approval, notes and fulfillment.
- `POST /api/stripe/webhook` — signed raw-body Stripe notifications.
- `GET /api/health` — non-secret configuration readiness.

Browser mutations require an `Origin` matching `APP_URL`. Owner cookies are HttpOnly, SameSite=Strict and expire after four hours. The local HTTP cookie is not Secure; a production deployment must require HTTPS and Secure cookies. Secrets, database files and customer data are excluded from source control.

## Before going live

Live keys require explicit `STRIPE_MODE=live`, a public HTTPS origin, and a matching `sk_live_` key. Production account activation, backups, real receipts/notifications, inventory management and external calendar synchronisation still require owner configuration. The local booking calendar reserves appointment slots automatically; its API and durable database must be deployed before the public website can use it. PayPal and direct bank transfers are deferred. Existing catalogue prices are treated as final consumer prices; this milestone adds no separate tax calculation.


## Vercel + Neon deployment

The Vite storefront and `api/index.ts` deploy together. The API uses a dedicated Neon Postgres schema (`elysian_spa`); local development and the original test suite continue using SQLite. No local customer data, sessions, passwords, health keys or `.env` files are deployed with the source.

Connect a Neon database to the Vercel project. Set these **Production** environment variables before enabling real payments:

- `DATABASE_URL_UNPOOLED` (or `POSTGRES_URL_NON_POOLING`): the integration's direct SSL connection. The transaction pooler cannot be used because the API uses a session advisory lock.
- `APP_URL=https://elysianbeautyspa.co.uk`: exact canonical customer-facing origin.
- `NODEJS_HELPERS=0`: disable Vercel request helpers so Express receives the exact raw Stripe webhook bytes.
- `STRIPE_MODE=live` and `STRIPE_SECRET_KEY=sk_live_...`: matching live Stripe account credentials. Keep test credentials in local development.
- `STRIPE_WEBHOOK_SECRET=whsec_...`: signing secret for the **live** endpoint `https://elysianbeautyspa.co.uk/api/stripe/webhook`.
- `OWNER_USERNAME` and `OWNER_PASSWORD`: owner credentials; password minimum 12 characters. These are server-only, never `VITE_` variables.
- `HEALTH_DATA_KEY`: a permanent cryptographically random 32-byte value encoded as base64. Store it separately in a password manager/secure backup. Losing or replacing it makes existing private health records unreadable. PostgreSQL deployments never create a key on ephemeral disk.

Redeploy after changing environment variables. `GET /api/health` exposes configuration booleans without secrets. A browser visit to `/api/stripe/webhook` returns HTTP **405** with `Allow: POST`; unsigned requests are never acknowledged as payments. Incomplete Stripe settings return HTTP **503**, preventing checkout until the webhook signing secret is configured. Production previews are disabled from using the production payment/CRM API.

Register **Your account / Snapshot / API 2026-08-26.dahlia** with these six Stripe events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed`, `charge.refunded`.

Each API request leases a direct Postgres connection and a cross-instance advisory lock. This conservatively serializes access for this single-therapist application, including appointment overlap checks and payment reconciliation. Short database transactions preserve atomic booking/consultation changes; committed pending checkout attempts survive Stripe request failures. The lock is not a transaction held over external payment calls. Login rate limits, sessions, payment deduplication, reviews and calendar data persist in Neon. API responses are not cached. Configure provider backups and retention before collecting production client data.

Optional database integration verification: set `NEON_TEST_DATABASE_URL` privately and run `node --import tsx --test tests/postgres.test.ts`. The test creates a unique temporary schema, uses synthetic customer/Stripe fixtures, verifies persistence and encrypted consultation storage, and drops only that schema. It never calls Stripe or moves money.
