import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { PaymentRecord } from "../shared/payments";

export interface Attempt {
  key: string;
  recordId: string;
  expectedPence: number;
  sessionId: string | null;
  paymentIntent: string | null;
}
export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, submission_key TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, receipt_token TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, record_id TEXT NOT NULL, expected_pence INTEGER NOT NULL, session_id TEXT UNIQUE, payment_intent TEXT UNIQUE);
      CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);`);
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
