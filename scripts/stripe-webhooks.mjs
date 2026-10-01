import { config } from "dotenv";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { readFileSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

config({ quiet: true });
if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  console.error(
    "Configure STRIPE_SECRET_KEY with a sandbox sk_test_ key in .env first.",
  );
  process.exit(2);
}
const port = Number(process.env.API_PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("API_PORT must be a valid port number.");
  process.exit(2);
}
mkdirSync("data", { recursive: true });
const child = spawn(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/@stripe/cli/bin/shim.js", import.meta.url),
    ),
    "--config",
    "data/stripe-cli.toml",
    "--color",
    "off",
    "listen",
    "--events",
    "checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,payment_intent.payment_failed,charge.refunded",
    "--forward-to",
    `http://127.0.0.1:${port}/api/stripe/webhook`,
  ],
  {
    env: { ...process.env, STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let signingSecret;
function handleLine(line) {
  const found = line.match(/whsec_[A-Za-z0-9]+/)?.[0];
  if (found && found !== signingSecret) {
    let env = readFileSync(".env", "utf8");
    const setting = `STRIPE_WEBHOOK_SECRET=${found}`;
    env = /^[ \t]*STRIPE_WEBHOOK_SECRET[ \t]*=.*$/m.test(env)
      ? env.replace(/^[ \t]*STRIPE_WEBHOOK_SECRET[ \t]*=.*$/m, setting)
      : `${env.trimEnd()}\n${setting}\n`;
    writeFileSync(".env", env, { mode: 0o600 });
    chmodSync(".env", 0o600);
    signingSecret = found;
    console.log(
      "Webhook signing secret saved privately to .env. Restart the backend to load it; leave this listener running.",
    );
  }
  console.log(
    line.replace(
      /(?:whsec_|(?:sk|rk|pk)_(?:test|live)_)[A-Za-z0-9]+/g,
      "[secret hidden]",
    ),
  );
}
for (const stream of [child.stdout, child.stderr]) {
  createInterface({ input: stream }).on("line", (line) => {
    try {
      handleLine(line);
    } catch {
      console.error(
        "Unable to save webhook configuration. Check .env file permissions.",
      );
      child.kill("SIGTERM");
      process.exitCode = 1;
    }
  });
}
child.on("error", () => {
  console.error("Unable to start Stripe CLI. Run pnpm install first.");
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode ??= code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
