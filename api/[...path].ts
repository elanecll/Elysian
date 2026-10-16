import type { IncomingMessage, ServerResponse } from "node:http";
import type { Request, Response } from "express";
import { Pool } from "pg";
import { createApp } from "../server/app";
import { loadConfig } from "../server/config";
import { PostgresStore, SCHEMA_SQL } from "../server/postgres";

let pool: Pool | undefined;
let initialized = false;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json");
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error: "This preview has no production payment or CRM access.",
      }),
    );
    return;
  }
  const url =
    process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;
  if (!url || !process.env.APP_URL) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error:
          "The payment server is awaiting database and website configuration.",
      }),
    );
    return;
  }
  // Session locks require the direct Neon URL, never the transaction pooler.
  if (new URL(url).hostname.includes("-pooler")) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error: "The payment server requires its direct database connection.",
      }),
    );
    return;
  }
  const connection = new URL(url);
  connection.searchParams.set("sslmode", "verify-full");
  pool ??= new Pool({
    connectionString: connection.toString(),
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });
  if (pool.listenerCount("error") === 0) pool.on("error", () => {});
  let client;
  try {
    client = await pool.connect();
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "The payment database is temporarily unavailable.",
      }),
    );
    return;
  }
  let locked = false;
  try {
    await client.query("SET statement_timeout = '20s'");
    // Serialize state changes across Vercel instances without holding a database
    // transaction over Stripe HTTP calls. Pending checkout attempts commit first.
    await client.query("SELECT pg_advisory_lock(154631, 1)");
    locked = true;
    if (!initialized) {
      await client.query(SCHEMA_SQL);
      initialized = true;
    } else await client.query("SET search_path TO elysian_spa");
    const config = loadConfig();
    const app = createApp(config, new PostgresStore(client));
    await new Promise<void>((resolve, reject) => {
      res.once("finish", resolve);
      app(req as Request, res as Response, reject);
    });
  } catch {
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "The payment server is temporarily unavailable. Please retry.",
        }),
      );
    }
  } finally {
    if (locked) {
      try {
        await client.query("SELECT pg_advisory_unlock(154631, 1)");
      } catch {
        client.release(true);
        return;
      }
    }
    client.release();
  }
}
