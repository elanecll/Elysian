import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import request from "supertest";
import { createApp } from "../server/app";
import { Store } from "../server/store";
import type { ClientReview } from "../shared/reviews";

const origin = "http://localhost:3000";
const config = {
  appUrl: origin,
  databasePath: ":memory:",
  ownerUsername: "review-owner",
  ownerPassword: "test-only-owner-password",
};
const stores = new Set<Store>();
const directories: string[] = [];
afterEach(() => {
  for (const store of stores) store.close();
  stores.clear();
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});
function setup(path = ":memory:") {
  const store = new Store(path);
  stores.add(store);
  return { store, app: createApp({ ...config, databasePath: path }, store) };
}
const input = () => ({
  author: "Review Test",
  serviceId: "cliniccare-chemical-peeling",
  rating: 4,
  comment:
    "The treatment was carefully explained and the visit was very relaxing.",
  consent: true,
  website: "",
});
const post = (
  app: ReturnType<typeof createApp>,
  body = input(),
  key = randomUUID(),
) =>
  request(app)
    .post("/api/reviews")
    .set("Origin", origin)
    .set("Idempotency-Key", key)
    .send(body);

async function loginOwner(app: ReturnType<typeof createApp>) {
  const owner = request.agent(app);
  await owner
    .post("/api/owner/login")
    .set("Origin", origin)
    .send({ username: config.ownerUsername, password: config.ownerPassword })
    .expect(200);
  return owner;
}

test("reviews stay private and out of rating statistics until the owner approves publication", async () => {
  const { app, store } = setup();
  const saved = await post(app).expect(201);
  assert.equal(saved.body.published, false);
  assert.equal(saved.body.status, "pending");
  const pendingFeed = (await request(app).get("/api/reviews").expect(200)).body;
  assert.deepEqual(pendingFeed, {
    reviews: [],
    nextCursor: null,
    total: 0,
    ratingSum: 0,
  });
  const owner = await loginOwner(app);
  const pending = (await owner.get("/api/owner/reviews").expect(200)).body
    .reviews[0];
  assert.equal(pending.status, "pending");
  assert.equal(pending.id, saved.body.id);
  await owner
    .patch(`/api/owner/reviews/${saved.body.id}`)
    .set("Origin", origin)
    .send({ status: "published" })
    .expect(200);
  const feed = (await request(app).get("/api/reviews").expect(200)).body;
  assert.equal(feed.total, 1);
  assert.equal(feed.ratingSum, 4);
  assert.equal(feed.reviews[0].id, saved.body.id);
  assert.equal(feed.reviews[0].service, "Clinicare Chemical Peeling");
  assert.equal(feed.reviews[0].category, "facials");
  assert.equal(feed.reviews[0].author, "Review Test");
  assert.ok(feed.reviews[0].createdAt);
  assert.equal(feed.reviews[0].hidden, undefined);
  assert.equal(feed.reviews[0].status, undefined);
  assert.equal(feed.reviews[0].consent, undefined);
  assert.equal(store.ownerReviews()[0].status, "published");
});

test("invalid content, missing consent, forged fields and cross-origin submissions never publish", async () => {
  const { app } = setup();
  const invalid = [
    { author: " " },
    { author: "A".repeat(61) },
    { serviceId: "unknown-treatment" },
    { rating: 0 },
    { rating: 6 },
    { rating: 2.5 },
    { comment: "Too short" },
    { comment: "a".repeat(2001) },
    { comment: "<script>alert(1)</script> A review with injected markup." },
    { consent: false },
    { website: "spam.example" },
    { hidden: false },
    { status: "published" },
    { approved: true },
    { service: "Forged title" },
  ];
  for (const change of invalid)
    await post(app, { ...input(), ...change }).expect(400);
  await request(app)
    .post("/api/reviews")
    .set("Origin", origin)
    .send(input())
    .expect(400);
  await request(app)
    .post("/api/reviews")
    .set("Origin", "https://untrusted.example")
    .set("Idempotency-Key", randomUUID())
    .send(input())
    .expect(403);
  assert.equal((await request(app).get("/api/reviews")).body.total, 0);
  // Rejections must not use up the valid-submission allowance.
  await post(app).expect(201);
});

test("simultaneous retries submit once without publication; conflicts and persistent rate limits are enforced", async () => {
  const { app, store } = setup();
  const key = randomUUID();
  const replies = await Promise.all(
    Array.from({ length: 8 }, () => post(app, input(), key)),
  );
  assert.ok(replies.every((reply) => [200, 201].includes(reply.status)));
  assert.equal(new Set(replies.map((reply) => reply.body.id)).size, 1);
  assert.ok(
    replies.every(
      (reply) => reply.body.status === "pending" && !reply.body.published,
    ),
  );
  await post(app, { ...input(), rating: 2 }, key).expect(409);
  await post(app).expect(201);
  await post(app).expect(201);
  const restarted = createApp(config, store);
  const blocked = await post(restarted).expect(429);
  assert.equal(blocked.headers["retry-after"], "3600");
  await post(restarted, input(), key).expect(200);
  assert.equal((await request(restarted).get("/api/reviews")).body.total, 0);
  assert.equal(store.ownerReviews().length, 3);
});

test("only an authenticated owner can approve or hide reviews; submission retries preserve moderation", async () => {
  const { app } = setup();
  const key = randomUUID();
  const review = await post(app, { ...input(), rating: 1 }, key).expect(201);
  const path = `/api/owner/reviews/${review.body.id}`;
  await request(app).get("/api/owner/reviews").expect(401);
  await request(app)
    .patch(path)
    .set("Origin", origin)
    .send({ status: "published" })
    .expect(401);
  const owner = await loginOwner(app);
  await owner
    .patch(path)
    .set("Origin", "https://untrusted.example")
    .send({ status: "published" })
    .expect(403);
  assert.equal((await request(app).get("/api/reviews")).body.total, 0);
  await owner
    .patch(path)
    .set("Origin", origin)
    .send({ status: "published" })
    .expect(200);
  await owner
    .patch(path)
    .set("Origin", origin)
    .send({ status: "published" })
    .expect(200);
  assert.equal((await request(app).get("/api/reviews")).body.total, 1);
  assert.equal(
    (await post(app, { ...input(), rating: 1 }, key).expect(200)).body.status,
    "published",
  );
  await owner
    .patch(path)
    .set("Origin", origin)
    .send({ status: "hidden" })
    .expect(200);
  assert.equal((await request(app).get("/api/reviews")).body.total, 0);
  assert.equal(
    (await post(app, { ...input(), rating: 1 }, key).expect(200)).body
      .published,
    false,
  );
  assert.equal(
    (await owner.get("/api/owner/reviews")).body.reviews[0].status,
    "hidden",
  );
  await owner
    .patch(path)
    .set("Origin", origin)
    .send({ status: "published" })
    .expect(200);
  const feed = (await request(app).get("/api/reviews")).body;
  assert.equal(feed.total, 1);
  assert.equal(feed.ratingSum, 1);
  await owner
    .patch("/api/owner/reviews/missing")
    .set("Origin", origin)
    .send({ status: "hidden" })
    .expect(404);
});

test("reviews and moderation survive database close and reopening", async () => {
  const directory = mkdtempSync(join(tmpdir(), "elysian-reviews-"));
  directories.push(directory);
  const path = join(directory, "reviews.sqlite");
  const first = setup(path);
  const saved = await post(first.app).expect(201);
  first.store.close();
  stores.delete(first.store);
  const second = setup(path);
  assert.equal((await request(second.app).get("/api/reviews")).body.total, 0);
  assert.equal(second.store.ownerReviews()[0].status, "pending");
  second.store.setReviewStatus(saved.body.id, "published");
  second.store.close();
  stores.delete(second.store);
  const third = setup(path);
  assert.equal(third.store.ownerReviews()[0].status, "published");
  assert.equal(
    (await request(third.app).get("/api/reviews")).body.reviews[0].id,
    saved.body.id,
  );
  third.store.setReviewStatus(saved.body.id, "hidden");
  third.store.close();
  stores.delete(third.store);
  const fourth = setup(path);
  assert.equal(fourth.store.ownerReviews()[0].status, "hidden");
  assert.equal((await request(fourth.app).get("/api/reviews")).body.total, 0);
  await post(fourth.app).expect(201);
  await post(fourth.app).expect(201);
  await post(fourth.app).expect(429);
});

test("paginated public results exclude pending and hidden reviews and do not repeat entries", async () => {
  const { app, store } = setup();
  for (let index = 0; index < 26; index++) {
    const review: ClientReview = {
      id: `fixture-${index}`,
      author: `Guest ${index}`,
      serviceId: "cliniccare-chemical-peeling",
      service: "Clinicare Chemical Peeling",
      category: "facials",
      rating: 3,
      comment: "A relaxed visit with clear explanations of the treatment.",
      createdAt: new Date().toISOString(),
    };
    store.insertReview(review, randomUUID(), "fixture");
    store.setReviewStatus(review.id, "published");
  }
  store.setReviewStatus("fixture-25", "hidden");
  await post(app).expect(201);
  const page = (await request(app).get("/api/reviews")).body;
  assert.equal(page.reviews.length, 20);
  assert.equal(page.total, 25);
  assert.equal(page.ratingSum, 75);
  const next = (
    await request(app).get(`/api/reviews?cursor=${page.nextCursor}`)
  ).body;
  assert.equal(next.reviews.length, 5);
  assert.equal(next.nextCursor, null);
  assert.equal(
    new Set([...page.reviews, ...next.reviews].map((review) => review.id)).size,
    25,
  );
  await request(app).get("/api/reviews?cursor=invalid").expect(400);
});

test("legacy auto-published reviews migrate to pending without losing content or resetting subsequent approvals", () => {
  const directory = mkdtempSync(join(tmpdir(), "elysian-legacy-reviews-"));
  directories.push(directory);
  const path = join(directory, "reviews.sqlite");
  const legacy = new DatabaseSync(path);
  legacy.exec(
    "CREATE TABLE reviews (sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, submission_key TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL)",
  );
  for (const hidden of [0, 1]) {
    const review: ClientReview = {
      id: `legacy-${hidden}`,
      author: "Existing guest",
      serviceId: input().serviceId,
      service: "Clinicare Chemical Peeling",
      category: "facials",
      rating: 4,
      comment: input().comment,
      createdAt: new Date().toISOString(),
    };
    legacy
      .prepare(
        "INSERT INTO reviews(id, submission_key, fingerprint, hidden, data) VALUES(?,?,?,?,?)",
      )
      .run(review.id, randomUUID(), "legacy", hidden, JSON.stringify(review));
  }
  legacy.close();
  const first = setup(path);
  assert.equal(first.store.publicReviews().total, 0);
  assert.equal(
    first.store.ownerReviews().find((review) => review.id === "legacy-0")
      ?.status,
    "pending",
  );
  assert.equal(
    first.store.ownerReviews().find((review) => review.id === "legacy-1")
      ?.status,
    "hidden",
  );
  assert.equal(first.store.ownerReviews()[0].comment, input().comment);
  first.store.setReviewStatus("legacy-0", "published");
  first.store.close();
  stores.delete(first.store);
  const second = setup(path);
  assert.equal(second.store.publicReviews().total, 1);
  assert.equal(second.store.publicReviews().ratingSum, 4);
});
