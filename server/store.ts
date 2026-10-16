import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { PaymentRecord } from "../shared/payments";
import type { ClientReview, StoredReview, ReviewFeed } from "../shared/reviews";

export interface Attempt {
  key: string;
  recordId: string;
  expectedPence: number;
  sessionId: string | null;
  paymentIntent: string | null;
}
export class Store {
  db: DatabaseSync;
  constructor(public readonly path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, submission_key TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, receipt_token TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS consultations (record_id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, record_id TEXT NOT NULL, expected_pence INTEGER NOT NULL, session_id TEXT UNIQUE, payment_intent TEXT UNIQUE);
      CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS reviews (sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, submission_key TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','hidden')), data TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS reviews_visibility ON reviews(hidden, sequence);
      CREATE TABLE IF NOT EXISTS diary (id TEXT PRIMARY KEY, date TEXT NOT NULL, start INTEGER NOT NULL, finish INTEGER NOT NULL, data TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS diary_interval ON diary(date, start, finish);
      CREATE TABLE IF NOT EXISTS calendar_settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS diary_submissions (key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, entry_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS booking_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS review_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);`);
    this.transaction(() => {
      const columns = this.db.prepare("PRAGMA table_info(reviews)").all() as {
        name: string;
      }[];
      if (!columns.some((column) => column.name === "status")) {
        // Previously auto-published submissions need explicit owner approval too.
        this.db.exec(
          "ALTER TABLE reviews ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','hidden')); UPDATE reviews SET status='hidden' WHERE hidden=1;",
        );
      }
      this.db.exec(
        "CREATE INDEX IF NOT EXISTS reviews_moderation ON reviews(status, sequence)",
      );
    });
  }
  reviewBySubmission(key: string) {
    const row = this.db
      .prepare(
        "SELECT data, fingerprint, status FROM reviews WHERE submission_key=?",
      )
      .get(key) as
      | { data: string; fingerprint: string; status: StoredReview["status"] }
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
  insertReview(review: ClientReview, key: string, fingerprint: string) {
    this.db
      .prepare(
        "INSERT INTO reviews(id, submission_key, fingerprint, data) VALUES(?,?,?,?)",
      )
      .run(review.id, key, fingerprint, JSON.stringify(review));
  }
  publicReviews(cursor?: number): ReviewFeed {
    const rows = this.db
      .prepare(
        "SELECT sequence, data FROM reviews WHERE status='published' AND sequence < ? ORDER BY sequence DESC LIMIT 21",
      )
      .all(cursor ?? Number.MAX_SAFE_INTEGER) as {
      sequence: number;
      data: string;
    }[];
    const page = rows.slice(0, 20);
    const stats = this.db
      .prepare(
        "SELECT COUNT(*) AS total, COALESCE(SUM(json_extract(data, '$.rating')),0) AS ratingSum FROM reviews WHERE status='published'",
      )
      .get() as { total: number; ratingSum: number };
    return {
      reviews: page.map((row) => JSON.parse(row.data)),
      nextCursor: rows.length > 20 ? page.at(-1)!.sequence : null,
      ...stats,
    };
  }
  ownerReviews(): StoredReview[] {
    return (
      this.db
        .prepare(
          "SELECT data, status FROM reviews ORDER BY (status='pending') DESC, sequence DESC",
        )
        .all() as { data: string; status: StoredReview["status"] }[]
    ).map((row) => ({ ...JSON.parse(row.data), status: row.status }));
  }
  setReviewStatus(id: string, status: "published" | "hidden") {
    return (
      this.db.prepare("UPDATE reviews SET status=? WHERE id=?").run(status, id)
        .changes > 0
    );
  }
  consumeReviewLimit(key: string, now = Date.now()) {
    this.db.prepare("DELETE FROM review_limits WHERE reset_at <= ?").run(now);
    const row = this.db
      .prepare("SELECT count FROM review_limits WHERE key=?")
      .get(key) as { count: number } | undefined;
    if ((row?.count ?? 0) >= 3) return false;
    this.db
      .prepare(
        "INSERT INTO review_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
      )
      .run(key, now + 60 * 60 * 1000);
    return true;
  }
  get(id: string): PaymentRecord | undefined {
    const row = this.db
      .prepare("SELECT data FROM records WHERE id=?")
      .get(id) as { data: string } | undefined;
    return row && JSON.parse(row.data);
  }
  bySubmission(key: string) {
    const row = this.db
      .prepare("SELECT data, fingerprint FROM records WHERE submission_key=?")
      .get(key) as { data: string; fingerprint: string } | undefined;
    return (
      row && {
        record: JSON.parse(row.data) as PaymentRecord,
        fingerprint: row.fingerprint,
      }
    );
  }
  byReceipt(token: string): PaymentRecord | undefined {
    const row = this.db
      .prepare("SELECT data FROM records WHERE receipt_token=?")
      .get(token) as { data: string } | undefined;
    return row && JSON.parse(row.data);
  }
  list(): PaymentRecord[] {
    return (
      this.db.prepare("SELECT data FROM records ORDER BY rowid DESC").all() as {
        data: string;
      }[]
    ).map((r) => JSON.parse(r.data));
  }
  insert(record: PaymentRecord, key: string, fingerprint: string) {
    this.db
      .prepare("INSERT INTO records VALUES(?,?,?,?,?)")
      .run(
        record.id,
        key,
        fingerprint,
        record.receiptToken,
        JSON.stringify(record),
      );
  }
  save(record: PaymentRecord) {
    this.db
      .prepare("UPDATE records SET data=? WHERE id=?")
      .run(JSON.stringify(record), record.id);
  }
  addAttempt(attempt: Attempt) {
    this.db
      .prepare("INSERT OR IGNORE INTO attempts VALUES(?,?,?,?,?)")
      .run(
        attempt.key,
        attempt.recordId,
        attempt.expectedPence,
        attempt.sessionId,
        attempt.paymentIntent,
      );
  }
  attachSession(key: string, id: string) {
    this.db
      .prepare("UPDATE attempts SET session_id=? WHERE key=?")
      .run(id, key);
  }
  attachIntent(sessionId: string, intent: string) {
    this.db
      .prepare("UPDATE attempts SET payment_intent=? WHERE session_id=?")
      .run(intent, sessionId);
  }
  attemptBySession(id: string): Attempt | undefined {
    return this.attempt("session_id", id);
  }
  attemptByKey(id: string): Attempt | undefined {
    return this.attempt("key", id);
  }
  attemptByIntent(id: string): Attempt | undefined {
    return this.attempt("payment_intent", id);
  }
  private attempt(column: string, id: string): Attempt | undefined {
    const row = this.db
      .prepare(`SELECT * FROM attempts WHERE ${column}=?`)
      .get(id) as
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
  hasEvent(id: string) {
    return !!this.db.prepare("SELECT id FROM events WHERE id=?").get(id);
  }
  addEvent(id: string) {
    this.db.prepare("INSERT OR IGNORE INTO events VALUES(?)").run(id);
  }
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      if (
        result &&
        typeof (result as unknown as PromiseLike<unknown>).then === "function"
      ) {
        return Promise.resolve(result).then(
          (value) => {
            this.db.exec("COMMIT");
            return value;
          },
          (error) => {
            this.db.exec("ROLLBACK");
            throw error;
          },
        ) as T;
      }
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  close() {
    this.db.close();
  }
}
