import "dotenv/config";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { Store } from "./store";

const config = loadConfig();
const store = new Store(config.databasePath);
const app = createApp(config, store);
const port = Number(process.env.API_PORT || 3001);
const server = app.listen(port, "127.0.0.1", () => {
  console.log(
    `Elysian API ready at http://127.0.0.1:${port} (Stripe test mode).`,
  );
  if (!config.stripeSecretKey || !config.webhookSecret)
    console.log(
      "Checkout is unavailable until sandbox payment credentials are configured.",
    );
  if (!config.ownerUsername || !config.ownerPassword)
    console.log(
      "Owner login is unavailable until owner credentials are configured.",
    );
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      store.close();
      process.exit(0);
    }),
  );
