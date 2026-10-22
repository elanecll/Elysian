# Booking notification activation

The integration is implemented but sending stays **off** until the services below
are configured. A Hotmail address and a normal WhatsApp profile are recipients,
not automatic sending services. No provider account, subscription or paid sender
has been purchased by this change.

## What happens

| Booking event                                       | Client                                                          | Elaine                               |
| --------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------ |
| Request saved                                       | Email acknowledgement; booking still provisional                | WhatsApp alert and email copy        |
| Owner approves consultation, availability and quote | Email with the exact Stripe deposit link, amount due and expiry | Approval remains in CRM              |
| Stripe verifies the deposit                         | Email confirming appointment, amount paid and remaining balance | WhatsApp confirmation and email copy |

Clients receive email; this implementation does not send clients WhatsApp messages.
The approval email explicitly says payment is required before confirmation.
The server calculates the amount: for an ordinary £105 booking, the deposit is
£52.50. Facial/product bundles also collect the discounted products in full.
No health answers, consultation notes or owner notes are included in messages.

## 1. Email sender: Resend

1. Create/sign into [Resend](https://resend.com/signup).
2. Add and verify a sending domain/subdomain you control, such as
   `notifications.elysianbeautyspa.co.uk`, using Resend's displayed DNS records.
   Do not replace existing Hotmail forwarding, SPF or MX records blindly.
3. Use a sender on that verified domain, for example
   `Elysian Beauty Spa <bookings@notifications.elysianbeautyspa.co.uk>`.
   Hotmail cannot be used as the verified sending domain. Replies go to
   `elainecll@hotmail.com`.
4. Create a server API key. Enter it directly into Vercel's Production environment
   variables. Never paste it into chat, source files, GitHub or a `VITE_` variable.
   The key must permit sending and, for verified delivery reporting in CRM,
   retrieving sent emails.

Provider reference: [Send email](https://resend.com/docs/api-reference/emails/send-email),
[idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys).

## 2. Owner WhatsApp alerts: Twilio

1. Create/sign into [Twilio](https://www.twilio.com/try-twilio), then complete its
   WhatsApp Business sender registration. Twilio/Meta may charge for sending.
2. Register a dedicated business sender. Elaine's `+447707328060` is the receiving
   number; do not migrate/delete its existing WhatsApp account to make it a sender.
   A sandbox is only for joined test recipients, not production notifications.
3. Create and obtain WhatsApp approval for a **utility** content template named,
   for example, `elysian_owner_booking_update`, with this exact text:

   ```text
   Elysian booking update: {{1}}. Client: {{2}}. Appointment: {{3}}. Reference: {{4}}. Payment: {{5}}. Open your CRM: {{6}}.
   ```

   Use realistic sample values when submitting:

   | Variable | Example                                    |
   | -------- | ------------------------------------------ |
   | 1        | New appointment request                    |
   | 2        | Test Customer                              |
   | 3        | 23/10/2026 at 10:00 (UK time)              |
   | 4        | ELS-example-reference                      |
   | 5        | Awaiting your review. No payment received. |
   | 6        | https://elysianbeautyspa.co.uk/#crm        |

4. Save its approved `HX…` Content SID, your account SID/auth token and business
   sender directly in Vercel. The application uses `ContentSid`/`ContentVariables`,
   so alerts can be sent outside a user-initiated 24-hour conversation window.
   Elaine has requested these booking alerts to her number; follow Twilio's
   recipient opt-in process during onboarding.

Provider reference: [WhatsApp notification templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates).

## 3. Production configuration

Set these server-only Vercel Production variables and redeploy:

```text
NOTIFICATIONS_ENABLED=true
NOTIFICATION_OWNER_EMAIL=elainecll@hotmail.com
NOTIFICATION_OWNER_WHATSAPP=+447707328060
NOTIFICATION_EMAIL_FROM=<verified sender address>
RESEND_API_KEY=<secret>
TWILIO_ACCOUNT_SID=<account SID>
TWILIO_AUTH_TOKEN=<secret>
TWILIO_WHATSAPP_FROM=<dedicated approved sender in +countrycode format>
TWILIO_WHATSAPP_TEMPLATE_SID=<approved HX content SID>
NOTIFICATION_RETRY_SECRET=<random secret, at least 32 characters>
```

Email can be activated first while WhatsApp sender approval is pending. Missing
WhatsApp settings are shown as **Setup required** and never reported as sent.
`GET /api/health` exposes readiness booleans only, not credentials. These indicate
configuration presence; provider acceptance/delivery is checked per message.

For unattended recovery from definitive temporary rejections (for example HTTP
429), configure an external scheduler to call
`GET https://elysianbeautyspa.co.uk/api/notifications/retry` every minute with
`Authorization: Bearer <NOTIFICATION_RETRY_SECRET>`. Do not put the secret in the
URL. No paid Vercel cron plan is assumed or enabled. Three jobs are processed per
call; temporary rejections back off and stop after four send attempts. Opening a
booking's notification panel also retries due jobs for that booking.

## 4. Prove delivery before calling the integration active

1. Use a controlled test email/WhatsApp recipient and fixture/sandbox payment,
   with an explicitly configured test environment. Never send test requests to
   real clients or use real money solely for testing.
2. Submit a request: verify Elaine's email/WhatsApp and the client's acknowledgement.
3. Complete the actual consultation/availability review and approve the quote:
   verify the deposit email, amount, payment URL and expiry.
4. Complete a Stripe sandbox deposit: verify the client confirmation and Elaine's
   payment notification, matching the exact deposit and remaining balance.
5. In CRM open **Booking notifications**. **Accepted by service** means the provider
   accepted the API request; it is not proof of delivery. **Delivered** appears
   only when the provider reports delivery. Check the inbox and WhatsApp as well.

For an existing booking such as Amanda's, open that booking after activation and
click **Send pending messages**. It queues only the event matching the current
booking state. It does not approve a request or manufacture a payment. Do not
send a new deposit link if that booking has already been paid.

## Reliability and limitations

Jobs are stored atomically with the booking/payment transaction in SQLite and
Postgres. Stable identifiers and compare-and-set claims prevent repeated
submissions, webhook retries or concurrent workers from sending the same job
again. Resend also receives a provider idempotency key. Provider calls are awaited
before serverless completion. A failed send cannot undo a saved booking or payment.

Lost responses/interrupted sends are labelled **Check provider log**. They are
not automatically resent: Twilio may already have accepted them, so a blind retry
could create duplicates. A provider-reported bounce or failed delivery also needs
provider investigation rather than an automatic repeat. Old approval/payment
links are skipped after the booking moves on, expires or is cancelled.

Authenticated CRM endpoints:

- `GET /api/owner/records/:id/notifications`: statuses and due retry/delivery checks.
- `POST /api/owner/records/:id/notifications`: queue current booking update and send
  pending jobs. Requires owner authentication and the canonical browser Origin.

Automated tests use fake transports only; passing them does not prove delivery
through a real provider. Run `pnpm lint`, `pnpm test`, and `pnpm build` before deploy.
