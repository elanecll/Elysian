export interface Config {
  appUrl: string;
  stripeSecretKey?: string;
  webhookSecret?: string;
  ownerUsername?: string;
  ownerPassword?: string;
  databasePath: string;
  paymentMode?: "test" | "live";
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
  if (process.env.OWNER_PASSWORD && process.env.OWNER_PASSWORD.length < 12)
    throw new Error("OWNER_PASSWORD must contain at least 12 characters.");
  return {
    appUrl: url.origin,
    stripeSecretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    ownerUsername: process.env.OWNER_USERNAME,
    ownerPassword: process.env.OWNER_PASSWORD,
    databasePath: process.env.DATABASE_PATH || "./data/elysian.sqlite",
    paymentMode,
  };
}
