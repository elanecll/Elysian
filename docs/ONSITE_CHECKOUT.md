# Website card and Apple Pay checkout

New Stripe Checkout Sessions can render on the Elysian receipt page using Stripe Elements. Card details stay inside Stripe's frames. Apple Pay uses Stripe's genuine Express Checkout button; it is never a renamed card or Link button.

Production settings:

- `STRIPE_PUBLISHABLE_KEY`: the public key for the same account and mode as the existing server secret key.
- `STRIPE_CUSTOM_CHECKOUT_ENABLED=true`: enables Elements for new payment attempts.
- Register `elysianbeautyspa.co.uk` under Stripe Payment method domains in live mode. Register any additional checkout hostname separately before using it. HTTPS is required for wallets.

The checkout shows Apple Pay when Stripe reports it available and a green **Pay by card** option. Unsupported wallets show an availability explanation. Link is hidden within these Elements; no account-wide payment settings are changed. The Back button returns to the website without cancelling the reservation or claiming payment success.

Payment amounts, including 50% treatment deposits and discounted bundle products paid in full, remain server-calculated. Receipt tokens scope checkout access. Session client secrets are returned only from the token-scoped checkout endpoint, never stored in the record, emails, owner listings or URLs. Paid/expired/cancelled/mismatched sessions cannot load a payable checkout. Existing webhook and server reconciliation checks remain authoritative.

Each attempt persists its UI mode before contacting Stripe. Existing hosted links and older attempts with lost Stripe responses retain the old parameters and idempotency keys. A new revision after expiry can use the new mode. Disabling the rollout flag affects new attempts; retain the publishable key until existing Elements sessions have completed or expired.

Verification includes sandbox card confirmation through the actual Stripe form, integer amount checks, lost-response retries across rollout changes, legacy recovery, token isolation, declined-payment retry, cancellation, and the existing webhook/payment regression suite. A real Apple Wallet confirmation still requires the customer's supported browser and wallet.
