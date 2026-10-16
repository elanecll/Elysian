import { z } from "zod";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { Storage as Store } from "./storage";
import {
  CONSULTATION_VERSION,
  healthQuestions,
  guestCount,
  type PrivateConsultation,
} from "../shared/consultation";
export const consultationSchema = z
  .object({
    version: z.literal(CONSULTATION_VERSION),
    participants: z
      .array(
        z
          .object({
            name: z.string().trim().min(2).max(120),
            answers: z.record(
              z.string().max(40),
              z
                .object({
                  answer: z.enum(["yes", "no", "unsure"]),
                  details: z.string().trim().max(1000),
                })
                .strict(),
            ),
            dataConsent: z.literal(true),
            accuracyConfirmed: z.literal(true),
          })
          .strict(),
      )
      .min(1)
      .max(2),
  })
  .strict();
export function validateConsultation(
  input: z.infer<typeof consultationSchema>,
  ids: string[],
  custom: boolean,
) {
  const questions = healthQuestions(ids, custom);
  return (
    input.participants.length === guestCount(ids) &&
    input.participants.every(
      (p) =>
        Object.keys(p.answers).length === questions.length &&
        questions.every((q) => {
          const a = p.answers[q.id];
          return (
            a && (a.answer === "no" ? a.details === "" : a.details.length >= 2)
          );
        }),
    )
  );
}
const keys = new WeakMap<Store, Buffer>();
async function key(store: Store) {
  const previous = keys.get(store);
  if (previous) return previous;
  let value: Buffer;
  if (store.path === "postgres") {
    const encoded = process.env.HEALTH_DATA_KEY;
    if (!encoded || !/^[A-Za-z0-9+/]{43}=$/.test(encoded))
      throw new Error(
        "Set a permanent HEALTH_DATA_KEY for private consultations.",
      );
    value = Buffer.from(encoded, "base64");
    if (value.length !== 32) throw new Error("Invalid HEALTH_DATA_KEY.");
  } else if (store.path === ":memory:") value = randomBytes(32);
  else {
    const path = `${store.path}.health-key`;
    if (!existsSync(path)) {
      if (
        await store.db
          .prepare("SELECT record_id FROM consultations LIMIT 1")
          .get()
      )
        throw new Error(
          "The consultation encryption key is missing. Restore the original key.",
        );
      try {
        writeFileSync(path, randomBytes(32), { flag: "wx", mode: 0o600 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }
    value = readFileSync(path);
    if (value.length !== 32)
      throw new Error("Invalid consultation encryption key.");
  }
  keys.set(store, value);
  return value;
}
export async function saveConsultation(
  store: Store,
  id: string,
  value: PrivateConsultation,
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", await key(store), iv);
  cipher.setAAD(Buffer.from(id));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  const data = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64",
  );
  await store.db
    .prepare(
      "INSERT INTO consultations VALUES(?,?) ON CONFLICT(record_id) DO UPDATE SET data=excluded.data",
    )
    .run(id, data);
}
export async function getConsultation(
  store: Store,
  id: string,
): Promise<PrivateConsultation | undefined> {
  const row = (await store.db
    .prepare("SELECT data FROM consultations WHERE record_id=?")
    .get(id)) as
    | {
        data: string;
      }
    | undefined;
  if (!row) return;
  const data = Buffer.from(row.data, "base64");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    await key(store),
    data.subarray(0, 12),
  );
  decipher.setAAD(Buffer.from(id));
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(data.subarray(28)),
      decipher.final(),
    ]).toString("utf8"),
  ) as PrivateConsultation;
}
export const consultationReviewSchema = z
  .object({
    status: z.enum([
      "awaiting_review",
      "information_needed",
      "approved",
      "deferred",
    ]),
    notes: z.string().trim().max(4000),
    protocolChecked: z.boolean(),
    consultationCompleted: z.boolean(),
    offlineDataConsent: z.boolean().default(false),
  })
  .strict()
  .refine(
    (r) =>
      r.status !== "approved" || (r.protocolChecked && r.consultationCompleted),
    "Review the product/device protocol and complete the client consultation before approving.",
  );
