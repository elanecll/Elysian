import type {
  ReviewFeed,
  ReviewRequest,
  StoredReview,
  ReviewStatus,
} from "../../shared/reviews";
import { api, ApiError } from "./paymentApi";

async function reviewApi<T>(
  path: string,
  body?: unknown,
  options: Parameters<typeof api>[2] = {},
) {
  try {
    return await api<T>(path, body, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 0)
      throw new Error("Unable to reach Elysian. Please try again.");
    throw error;
  }
}
export const getReviews = (cursor?: number, signal?: AbortSignal) =>
  reviewApi<ReviewFeed>(
    `/reviews${cursor ? `?cursor=${cursor}` : ""}`,
    undefined,
    { signal },
  );
export const submitReview = (body: ReviewRequest, key: string) =>
  reviewApi<{ id: string; status: ReviewStatus; published: boolean }>(
    "/reviews",
    body,
    { key },
  );
export const getOwnerReviews = () =>
  reviewApi<{ reviews: StoredReview[] }>("/owner/reviews");
export const moderateReview = (id: string, status: "published" | "hidden") =>
  reviewApi<{ updated: boolean }>(
    `/owner/reviews/${encodeURIComponent(id)}`,
    { status },
    { method: "PATCH" },
  );
