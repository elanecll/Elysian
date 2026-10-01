import { config } from "dotenv";
import Stripe from "stripe";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

config({ quiet: true });
const failures = [];
const check = (label, valid) => {
  console.log(`${valid ? "PASS" : "BLOCKED"}: ${label}`);
  if (!valid) failures.push(label);
};
check("Node.js 24", process.versions.node.split(".")[0] === "24");
check(
  "Stripe sandbox secret key configured",
  !!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"),
);
check(
  "Webhook signing secret configured",
  !!process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"),
);
check("Owner username configured", !!process.env.OWNER_USERNAME);
check(
  "Owner password configured (at least 12 characters)",
  (process.env.OWNER_PASSWORD?.length ?? 0) >= 12,
);
let appUrl;
try {
  appUrl = new URL(process.env.APP_URL || "http://localhost:3000");
  check(
    "APP_URL uses a local HTTP origin",
    ["localhost", "127.0.0.1", "[::1]"].includes(appUrl.hostname) &&
      appUrl.protocol === "http:" &&
      appUrl.href === `${appUrl.origin}/`,
  );
} catch {
  check("APP_URL is valid", false);
}
const cli = spawnSync(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/@stripe/cli/bin/shim.js", import.meta.url),
    ),
    "--version",
  ],
  { encoding: "utf8", timeout: 10000 },
);
check("Stripe CLI installed", cli.status === 0);
if (failures.length) {
  console.log(
    "No payment attempted. Complete the local .env setup, then rerun pnpm check:stripe.",
  );
  process.exitCode = 2;
} else {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    timeout: 10000,
    maxNetworkRetries: 0,
  });
  const results = await Promise.allSettled([
    stripe.balance.retrieve(),
    fetch(`${appUrl.origin}/api/health`, {
      signal: AbortSignal.timeout(10000),
    }).then(async (response) => {
      if (!response.ok) throw new Error("Health request failed");
      return response.json();
    }),
  ]);
  const [balance, health] = results;
  check(
    "Stripe sandbox API reachable with this key",
    balance.status === "fulfilled" && balance.value.livemode === false,
  );
  check(
    "Frontend proxy and backend payment configuration ready",
    health.status === "fulfilled" &&
      health.value.ok === true &&
      health.value.mode === "test" &&
      health.value.paymentsConfigured === true &&
      health.value.ownerConfigured === true,
  );
  if (failures.length) {
    console.log(
      "No payment attempted. Check the sandbox key and restart pnpm dev after editing .env.",
    );
    process.exitCode = 2;
  } else {
    console.log(
      "Ready for sandbox Checkout tests. A real test checkout is still needed to verify payment and webhook delivery.",
    );
  }
}
