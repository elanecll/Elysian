import type { Store } from "./store.js";

export interface StorageDatabase {
  prepare(sql: string): {
    get(...values: any[]): unknown | Promise<unknown>;
    all(...values: any[]): unknown[] | Promise<unknown[]>;
    run(
      ...values: any[]
    ): { changes: number | bigint } | Promise<{ changes: number | bigint }>;
  };
}

// Local SQLite remains available for development; production methods await Postgres.
export type Storage = {
  [K in Exclude<keyof Store, "db" | "transaction">]: Store[K] extends (
    ...args: infer A
  ) => infer R
    ? (...args: A) => R | Promise<R>
    : Store[K];
} & {
  db: StorageDatabase;
  transaction<T>(fn: () => T): T | Promise<Awaited<T>>;
};

const queues = new Map<string | Storage, Promise<unknown>>();
export async function exclusive<T>(
  store: Storage,
  fn: () => Promise<T>,
): Promise<T> {
  const key = store.path === ":memory:" ? store : store.path;
  const previous = queues.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(fn);
  queues.set(key, current);
  try {
    return await current;
  } finally {
    if (queues.get(key) === current) queues.delete(key);
  }
}
