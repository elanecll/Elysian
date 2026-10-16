import type { PoolClient } from "pg";
import type { PaymentRecord } from "../shared/payments";
import type { ClientReview, StoredReview, ReviewFeed } from "../shared/reviews";
import type { Attempt } from "./store";
function postgresSQL(sql: string) {
  let index = 0;
  const ignore = sql.includes("INSERT OR IGNORE");
  let result = sql
    .replace(/\?/g, () => `$${++index}`)
    .replace("INSERT OR IGNORE", "INSERT");
  result = result.replace(
    "ORDER BY rowid DESC",
    "ORDER BY (data::jsonb->>'createdAt') DESC",
  );
  result = result.replace(
    "json_extract(data, '$.rating')",
    "(data::jsonb->>'rating')::integer",
  );
  result = result.replace("AS ratingSum", 'AS "ratingSum"');
  const table = result.match(/^INSERT INTO (\w+)/)?.[1];
  if (table)
    result = result.replace("SET count=count+1", `SET count=${table}.count+1`);
  if (ignore) result += " ON CONFLICT DO NOTHING";
  return result;
}
export class PostgresDatabase {
  constructor(readonly client: PoolClient) {}
  prepare(sql: string) {
    const query = async (values: unknown[]) => {
      const result = await this.client.query(postgresSQL(sql), values);
      // node-postgres preserves BIGINT as text; our counters/timestamps are safe integers.
      for (const row of result.rows)
        for (const field of result.fields) {
          if (field.dataTypeID === 20 && row[field.name] !== null) {
            const value = Number(row[field.name]);
            if (!Number.isSafeInteger(value))
              throw new Error("Database integer out of range.");
            row[field.name] = value;
          }
        }
      return result;
    };
    return {
      get: async (...values: unknown[]) => (await query(values)).rows[0],
      all: async (...values: unknown[]) => (await query(values)).rows,
      run: async (...values: unknown[]) => ({
        changes: (await query(values)).rowCount ?? 0,
      }),
    };
  }
}
export class PostgresStore {
  readonly path = "postgres";
  readonly db: PostgresDatabase;
  private depth = 0;
  constructor(readonly client: PoolClient) {
    this.db = new PostgresDatabase(client);
  }
  async reviewBySubmission(key: string) {
    const row = (await this.db
      .prepare(
        "SELECT data, fingerprint, status FROM reviews WHERE submission_key=?",
      )
      .get(key)) as
      | {
          data: string;
          fingerprint: string;
          status: StoredReview["status"];
        }
      | undefined;
    return (
      row && {
        review: {
          ...JSON.parse(row.data),
          status: row.status,
        } as StoredReview,
        fingerprint: row.fingerprint,
      }
    );
  }
  async insertReview(review: ClientReview, key: string, fingerprint: string) {
    await this.db
      .prepare(
        "INSERT INTO reviews(id, submission_key, fingerprint, data) VALUES(?,?,?,?)",
      )
      .run(review.id, key, fingerprint, JSON.stringify(review));
  }
  async publicReviews(cursor?: number): Promise<ReviewFeed> {
    const rows = (await this.db
      .prepare(
        "SELECT sequence, data FROM reviews WHERE status='published' AND sequence < ? ORDER BY sequence DESC LIMIT 21",
      )
      .all(cursor ?? Number.MAX_SAFE_INTEGER)) as {
      sequence: number;
      data: string;
    }[];
    const page = rows.slice(0, 20);
    const stats = (await this.db
      .prepare(
        "SELECT COUNT(*) AS total, COALESCE(SUM(json_extract(data, '$.rating')),0) AS ratingSum FROM reviews WHERE status='published'",
      )
      .get()) as {
      total: number;
      ratingSum: number;
    };
    return {
      reviews: page.map((row) => JSON.parse(row.data)),
      nextCursor: rows.length > 20 ? page.at(-1)!.sequence : null,
      ...stats,
    };
  }
  async ownerReviews(): Promise<StoredReview[]> {
    return (
      (await this.db
        .prepare(
          "SELECT data, status FROM reviews ORDER BY (status='pending') DESC, sequence DESC",
        )
        .all()) as {
        data: string;
        status: StoredReview["status"];
      }[]
    ).map((row) => ({ ...JSON.parse(row.data), status: row.status }));
  }
  async setReviewStatus(id: string, status: "published" | "hidden") {
    return (
      (
        await this.db
          .prepare("UPDATE reviews SET status=? WHERE id=?")
          .run(status, id)
      ).changes > 0
    );
  }
  async consumeReviewLimit(key: string, now = Date.now()) {
    await this.db
      .prepare("DELETE FROM review_limits WHERE reset_at <= ?")
      .run(now);
    const row = (await this.db
      .prepare("SELECT count FROM review_limits WHERE key=?")
      .get(key)) as
      | {
          count: number;
        }
      | undefined;
    if ((row?.count ?? 0) >= 3) return false;
    await this.db
      .prepare(
        "INSERT INTO review_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
      )
      .run(key, now + 60 * 60 * 1000);
    return true;
  }
  async get(id: string): Promise<PaymentRecord | undefined> {
    const row = (await this.db
      .prepare("SELECT data FROM records WHERE id=?")
      .get(id)) as
      | {
          data: string;
        }
      | undefined;
    return row && JSON.parse(row.data);
  }
  async bySubmission(key: string) {
    const row = (await this.db
      .prepare("SELECT data, fingerprint FROM records WHERE submission_key=?")
      .get(key)) as
      | {
          data: string;
          fingerprint: string;
        }
      | undefined;
    return (
      row && {
        record: JSON.parse(row.data) as PaymentRecord,
        fingerprint: row.fingerprint,
      }
    );
  }
  async byReceipt(token: string): Promise<PaymentRecord | undefined> {
    const row = (await this.db
      .prepare("SELECT data FROM records WHERE receipt_token=?")
      .get(token)) as
      | {
          data: string;
        }
      | undefined;
    return row && JSON.parse(row.data);
  }
  async list(): Promise<PaymentRecord[]> {
    return (
      (await this.db
        .prepare("SELECT data FROM records ORDER BY rowid DESC")
        .all()) as {
        data: string;
      }[]
    ).map((r) => JSON.parse(r.data));
  }
  async insert(record: PaymentRecord, key: string, fingerprint: string) {
    await this.db
      .prepare("INSERT INTO records VALUES(?,?,?,?,?)")
      .run(
        record.id,
        key,
        fingerprint,
        record.receiptToken,
        JSON.stringify(record),
      );
  }
  async save(record: PaymentRecord) {
    await this.db
      .prepare("UPDATE records SET data=? WHERE id=?")
      .run(JSON.stringify(record), record.id);
  }
  async addAttempt(attempt: Attempt) {
    await this.db
      .prepare("INSERT OR IGNORE INTO attempts VALUES(?,?,?,?,?)")
      .run(
        attempt.key,
        attempt.recordId,
        attempt.expectedPence,
        attempt.sessionId,
        attempt.paymentIntent,
      );
  }
  async attachSession(key: string, id: string) {
    await this.db
      .prepare("UPDATE attempts SET session_id=? WHERE key=?")
      .run(id, key);
  }
  async attachIntent(sessionId: string, intent: string) {
    await this.db
      .prepare("UPDATE attempts SET payment_intent=? WHERE session_id=?")
      .run(intent, sessionId);
  }
  async attemptBySession(id: string): Promise<Attempt | undefined> {
    return await this.attempt("session_id", id);
  }
  async attemptByKey(id: string): Promise<Attempt | undefined> {
    return await this.attempt("key", id);
  }
  async attemptByIntent(id: string): Promise<Attempt | undefined> {
    return await this.attempt("payment_intent", id);
  }
  private async attempt(
    column: string,
    id: string,
  ): Promise<Attempt | undefined> {
    const row = (await this.db
      .prepare(`SELECT * FROM attempts WHERE ${column}=?`)
      .get(id)) as
      | {
          key: string;
          record_id: string;
          expected_pence: number;
          session_id: string | null;
          payment_intent: string | null;
        }
      | undefined;
    return (
      row && {
        key: row.key,
        recordId: row.record_id,
        expectedPence: row.expected_pence,
        sessionId: row.session_id,
        paymentIntent: row.payment_intent,
      }
    );
  }
  async hasEvent(id: string) {
    return !!(await this.db
      .prepare("SELECT id FROM events WHERE id=?")
      .get(id));
  }
  async addEvent(id: string) {
    await this.db.prepare("INSERT OR IGNORE INTO events VALUES(?)").run(id);
  }
  async transaction<T>(fn: () => T): Promise<Awaited<T>> {
    const depth = this.depth++;
    const point = `elysian_${depth}`;
    await this.client.query(depth ? `SAVEPOINT ${point}` : "BEGIN");
    try {
      const result = await fn();
      await this.client.query(depth ? `RELEASE SAVEPOINT ${point}` : "COMMIT");
      return result;
    } catch (error) {
      await this.client.query(
        depth ? `ROLLBACK TO SAVEPOINT ${point}` : "ROLLBACK",
      );
      throw error;
    } finally {
      this.depth--;
    }
  }
  close() {}
}
export const SCHEMA_SQL = `
CREATE SCHEMA IF NOT EXISTS elysian_spa;
SET search_path TO elysian_spa;
CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, submission_key TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, receipt_token TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS consultations (record_id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, record_id TEXT NOT NULL, expected_pence INTEGER NOT NULL, session_id TEXT UNIQUE, payment_intent TEXT UNIQUE);
CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS reviews (sequence BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, id TEXT UNIQUE NOT NULL, submission_key TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','hidden')), data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS reviews_moderation ON reviews(status, sequence);
CREATE TABLE IF NOT EXISTS diary (id TEXT PRIMARY KEY, date TEXT NOT NULL, start INTEGER NOT NULL, finish INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS diary_interval ON diary(date, start, finish);
CREATE TABLE IF NOT EXISTS calendar_settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS diary_submissions (key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, entry_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS booking_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS review_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS login_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at BIGINT NOT NULL);
`;
