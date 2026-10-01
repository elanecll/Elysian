export interface Config {
  appUrl: string;
  stripeSecretKey?: string;
  webhookSecret?: string;
  ownerUsername?: string;
  ownerPassword?: string;
  databasePath: string;
}
export function loadConfig(): Config {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const url = new URL(appUrl);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.protocol !== "http:"
  )
    throw new Error(
      "This milestone only supports local HTTP testing. Set APP_URL to http://localhost:3000.",
    );
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey && !stripeSecretKey.startsWith("sk_test_"))
    throw new Error(
      "Use a Stripe sandbox sk_test_ key. Live payments are disabled.",
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
  };
}
