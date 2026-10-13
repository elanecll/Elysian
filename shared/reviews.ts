export interface ClientReview {
  id: string;
  author: string;
  serviceId: string;
  service: string;
  category: "facials" | "massage" | "packages";
  rating: number;
  comment: string;
  createdAt: string;
}
export type ReviewStatus = "pending" | "published" | "hidden";
export interface StoredReview extends ClientReview {
  status: ReviewStatus;
}
export interface ReviewRequest {
  author: string;
  serviceId: string;
  rating: number;
  comment: string;
  consent: boolean;
  website: string;
}
export interface ReviewFeed {
  reviews: ClientReview[];
  nextCursor: number | null;
  total: number;
  ratingSum: number;
}
