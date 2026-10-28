export interface Config {
  appUrl: string;
  stripeSecretKey?: string;
  webhookSecret?: string;
  stripePublishableKey?: string;
  customCheckoutEnabled?: boolean;
  ownerUsername?: string;
  ownerPassword?: string;
  databasePath: string;
  paymentMode?: "test" | "live";
  notifications?: {
    enabled: boolean;
    ownerEmail: string;
    ownerWhatsapp: string;
    resendApiKey?: string;
    resendWebhookSecret?: string;
    resendTemplates?: Partial<
      Record<
        "request_received" | "deposit_ready" | "booking_confirmed" | "owner",
        string
      >
    >;
    emailFrom?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    whatsappFrom?: string;
    whatsappTemplateSid?: string;
    retrySecret?: string;
  };
}
export function loadConfig(): Config {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const url = new URL(appUrl);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (local && url.protocol !== "http:") ||
    (!local && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "APP_URL must be a public HTTPS origin or local HTTP origin.",
    );
  const paymentMode = process.env.STRIPE_MODE || "test";
  if (paymentMode !== "test" && paymentMode !== "live")
    throw new Error("STRIPE_MODE must be test or live.");
  if (paymentMode === "live" && local)
    throw new Error("Live payments require a public HTTPS APP_URL.");
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (
    stripeSecretKey &&
    !stripeSecretKey.startsWith(
      paymentMode === "live" ? "sk_live_" : "sk_test_",
    )
  )
    throw new Error(
      paymentMode === "live"
        ? "Use a live Stripe key with STRIPE_MODE=live."
        : "Use a Stripe sandbox sk_test_ key. Live payments are disabled unless STRIPE_MODE=live.",
    );
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const customCheckoutEnabled =
    process.env.STRIPE_CUSTOM_CHECKOUT_ENABLED === "true";
  if (
    stripePublishableKey &&
    !stripePublishableKey.startsWith(
      paymentMode === "live" ? "pk_live_" : "pk_test_",
    )
  )
    throw new Error("STRIPE_PUBLISHABLE_KEY must match STRIPE_MODE.");
  if (customCheckoutEnabled && (!stripeSecretKey || !stripePublishableKey))
    throw new Error(
      "Custom checkout requires matching Stripe secret and publishable keys.",
    );
  if (process.env.OWNER_PASSWORD && process.env.OWNER_PASSWORD.length < 12)
    throw new Error("OWNER_PASSWORD must contain at least 12 characters.");
  return {
    appUrl: url.origin,
    stripeSecretKey,
    stripePublishableKey,
    customCheckoutEnabled,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    ownerUsername: process.env.OWNER_USERNAME,
    ownerPassword: process.env.OWNER_PASSWORD,
    databasePath: process.env.DATABASE_PATH || "./data/elysian.sqlite",
    paymentMode,
    notifications: {
      enabled: process.env.NOTIFICATIONS_ENABLED === "true",
      ownerEmail:
        process.env.NOTIFICATION_OWNER_EMAIL || "elainecll@hotmail.com",
      ownerWhatsapp: process.env.NOTIFICATION_OWNER_WHATSAPP || "+447707328060",
      resendApiKey: process.env.RESEND_API_KEY,
      resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET,
      resendTemplates: {
        request_received: process.env.RESEND_REQUEST_TEMPLATE_ID,
        deposit_ready: process.env.RESEND_DEPOSIT_TEMPLATE_ID,
        booking_confirmed: process.env.RESEND_CONFIRMATION_TEMPLATE_ID,
        owner: process.env.RESEND_OWNER_TEMPLATE_ID,
      },
      emailFrom: process.env.NOTIFICATION_EMAIL_FROM,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      whatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
      whatsappTemplateSid: process.env.TWILIO_WHATSAPP_TEMPLATE_SID,
      retrySecret: process.env.NOTIFICATION_RETRY_SECRET,
    },
  };
}
