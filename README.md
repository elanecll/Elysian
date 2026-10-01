# Elysian Spa — local Stripe test payments

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
- **Bookings:** submit a future appointment request. Open `#owner` in a separate browser profile and sign in. Select the record, enter any custom treatment prices in pounds, check that availability has been confirmed, and approve. Copy the resulting Stripe checkout link and open it as the customer. Links expire after 24 hours; the owner must approve expired booking quotes again.
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

## Local API

- `POST /api/bookings` — request an appointment; requires an `Idempotency-Key` header.
- `POST /api/shop/checkout` — create/reuse a hosted checkout; requires an `Idempotency-Key` header.
- `GET /api/receipts/:token` — get the private receipt and reconcile an unpaid Stripe session.
- `POST /api/owner/login`, `GET /api/owner/session`, `POST /api/owner/logout` — server-side owner sessions.
- `GET /api/owner/records`, `POST /api/owner/records/:id/approve`, `PATCH /api/owner/records/:id` — authenticated ledger, approval, notes and fulfillment.
- `POST /api/stripe/webhook` — signed raw-body Stripe notifications.
- `GET /api/health` — non-secret configuration readiness.

Browser mutations require an `Origin` matching `APP_URL`. Owner cookies are HttpOnly, SameSite=Strict and expire after four hours. The local HTTP cookie is not Secure; a production deployment must require HTTPS and Secure cookies. Secrets, database files and customer data are excluded from source control.

## Before going live

Live keys are deliberately rejected. Production hosting, public HTTPS webhooks, a durable hosted database, backups, production authentication review, account activation, real receipts/notifications, inventory management and automated scheduling are separate work. This application does not automatically reserve appointment slots: the owner is responsible for checking availability before approving a request. PayPal and direct bank transfers are deferred. Existing catalogue prices are treated as final consumer prices; this milestone adds no separate tax calculation.
