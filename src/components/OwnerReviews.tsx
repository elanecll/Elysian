import React, { useCallback, useEffect, useState } from "react";
import type { StoredReview } from "../../shared/reviews";
import { getOwnerReviews, moderateReview } from "../data/reviewApi";
import { ApiError } from "../data/paymentApi";
import { ErrorMessage } from "./PaymentUI";

export function OwnerReviews({ onAuthError }: { onAuthError: () => void }) {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fail = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) onAuthError();
      else setError((error as Error).message);
    },
    [onAuthError],
  );
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setReviews((await getOwnerReviews()).reviews);
      setError("");
    } catch (error) {
      fail(error);
    } finally {
      setLoading(false);
    }
  }, [fail]);
  useEffect(() => {
    void reload();
  }, [reload]);
  async function moderate(
    review: StoredReview,
    status: "published" | "hidden",
  ) {
    setBusy(review.id);
    setError("");
    setMessage("");
    try {
      await moderateReview(review.id, status);
      setMessage(
        status === "published"
          ? "Review approved and published on the website."
          : "Review kept unpublished. You can approve it here later.",
      );
      await reload();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="space-y-4" aria-label="Manage client reviews">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl">
          Client reviews ·{" "}
          {reviews.filter((review) => review.status === "pending").length}{" "}
          awaiting approval
        </h3>
        <button
          type="button"
          className="text-sm underline"
          disabled={loading || !!busy}
          onClick={() => void reload()}
        >
          Refresh reviews
        </button>
      </div>
      <p className="text-sm">
        New reviews stay private until you approve them. Read each submission,
        then choose Approve &amp; publish or Keep unpublished. Pending and
        hidden reviews do not count toward the public rating.
      </p>
      <ErrorMessage error={error} />
      {message && (
        <p role="status" className="text-sm text-green-800">
          {message}
        </p>
      )}
      {loading && (
        <p role="status" className="text-sm">
          Loading reviews…
        </p>
      )}
      {!loading && !reviews.length && !error && (
        <p className="text-sm">No client submissions yet.</p>
      )}
      {reviews.map((review) => (
        <article
          key={review.id}
          className="space-y-2 rounded-xl border border-[#E8BAC0]/50 bg-white p-4"
        >
          <div className="flex justify-between gap-3">
            <strong className="text-sm break-words">{review.author}</strong>
            <span
              className={`text-xs rounded-full px-3 py-1 ${review.status === "pending" ? "bg-amber-50 text-amber-900" : "bg-[#FFF0F2] text-[#87464D]"}`}
            >
              {review.status === "pending"
                ? "Awaiting approval"
                : review.status === "hidden"
                  ? "Unpublished"
                  : "Published"}{" "}
              · {review.rating}/5
            </span>
          </div>
          <p className="text-xs text-[#7A5852]">
            {review.service} ·{" "}
            {new Date(review.createdAt).toLocaleDateString("en-GB", {
              timeZone: "Europe/London",
            })}
          </p>
          <p className="text-sm whitespace-pre-wrap break-words">
            {review.comment}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {review.status !== "published" && (
              <button
                type="button"
                className="min-h-12 rounded-full bg-[#87464D] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                disabled={!!busy}
                onClick={() => void moderate(review, "published")}
              >
                {busy === review.id ? "Saving…" : "Approve & publish"}
              </button>
            )}
            {review.status !== "hidden" && (
              <button
                type="button"
                className="min-h-12 rounded-full border border-[#E8BAC0]/50 px-5 py-3 text-sm font-semibold disabled:opacity-50"
                disabled={!!busy}
                onClick={() => void moderate(review, "hidden")}
              >
                {busy === review.id
                  ? "Saving…"
                  : review.status === "published"
                    ? "Hide review"
                    : "Keep unpublished"}
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
