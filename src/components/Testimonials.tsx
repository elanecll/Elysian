import React, { useCallback, useEffect, useRef, useState } from "react";
import { SPA_REVIEWS, SPA_SERVICES } from "../data/spaData";
import { Star, Quote, Sparkles, CheckCircle, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ErrorMessage, Modal } from "./PaymentUI";
import { LeaveReview } from "./LeaveReview";
import { getReviews } from "../data/reviewApi";
import type { ClientReview } from "../../shared/reviews";
import type { Review } from "../types";

const treatmentComparisons = [
  ...[1, 2, 3, 4].map((number) => ({
    id: `clinicare-microneedling-${number}`,
    title: `Clinicare Microneedling — Comparison ${number}`,
    image: `/images/reviews/clinicare-microneedling-${number}.jpeg`,
  })),
  ...SPA_SERVICES.flatMap((service) =>
    service.beforeAfterImage
      ? [
          {
            id: service.id,
            title: service.title,
            image: service.beforeAfterImage,
          },
        ]
      : [],
  ),
  {
    id: "clinicare-chemical-peeling-eye-area",
    title: "Clinicare Chemical Peeling — Eye Area",
    image: "/images/reviews/clinicare-chemical-peeling-eye-area.jpeg",
  },
  {
    id: "clinicare-chemical-peeling-cheek-area",
    title: "Clinicare Chemical Peeling — Cheek Area",
    image: "/images/reviews/clinicare-chemical-peeling-cheek-area.jpeg",
  },
  ...[1, 2, 3, 4].map((number) => ({
    id: `clinicare-carboxytherapy-${number}`,
    title: `Clinicare Carboxytherapy — Comparison ${number}`,
    image: `/images/reviews/clinicare-carboxytherapy-${number}.jpeg`,
  })),
  ...[1, 2, 3].map((number) => ({
    id: `clinicare-cinderella-black-tie-${number}`,
    title: `Clinicare Cinderella & Black Tie Facial — Comparison ${number}`,
    image: `/images/reviews/clinicare-cinderella-black-tie-${number}.jpeg`,
  })),
];

const reviewCardClass = "rounded-2xl border border-[#E8BAC0]/40 bg-white p-6 shadow-xs";

export const Testimonials: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "facials" | "massage" | "packages"
  >("all");
  const [selectedComparison, setSelectedComparison] = useState<
    (typeof treatmentComparisons)[number] | null
  >(null);
  const [clientReviews, setClientReviews] = useState<ClientReview[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, ratingSum: 0 });
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const expanded = useRef(false);
  const requestVersion = useRef(0);
  const loadLatest = useCallback(async (signal?: AbortSignal) => {
    const version = ++requestVersion.current;
    try {
      const feed = await getReviews(undefined, signal);
      if (version !== requestVersion.current) return;
      setClientReviews(feed.reviews);
      setReviewStats({ total: feed.total, ratingSum: feed.ratingSum });
      setNextCursor(feed.nextCursor);
      setReviewError("");
      expanded.current = false;
    } catch (error) {
      if (!signal?.aborted && version === requestVersion.current)
        setReviewError((error as Error).message);
    } finally {
      if (version === requestVersion.current) setReviewLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void loadLatest(controller.signal);
    const refresh = () => {
      if (!document.hidden && !expanded.current)
        void loadLatest(controller.signal);
    };
    const interval = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [loadLatest]);
  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    expanded.current = true;
    const version = ++requestVersion.current;
    setLoadingMore(true);
    try {
      const feed = await getReviews(nextCursor);
      if (version !== requestVersion.current) return;
      setClientReviews((previous) => [
        ...previous,
        ...feed.reviews.filter(
          (review) => !previous.some((old) => old.id === review.id),
        ),
      ]);
      setNextCursor(feed.nextCursor);
      setReviewStats({ total: feed.total, ratingSum: feed.ratingSum });
      setReviewError("");
    } catch (error) {
      if (version === requestVersion.current)
        setReviewError((error as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }
  const allReviews: (Review & { category?: ClientReview["category"] })[] = [
    ...clientReviews.map((review) => ({
      ...review,
      date: new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "Europe/London",
      }).format(new Date(review.createdAt)),
      avatarText: review.author
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    })),
    ...SPA_REVIEWS,
  ];
  const reviewCount = SPA_REVIEWS.length + reviewStats.total;
  const averageRating = reviewCount
    ? (SPA_REVIEWS.reduce((sum, review) => sum + review.rating, 0) +
        reviewStats.ratingSum) /
      reviewCount
    : 0;

  const filteredReviews = allReviews.filter((review) => {
    if (activeCategory === "all") return true;
    if (review.category) return review.category === activeCategory;
    const serviceLower = review.service.toLowerCase();
    if (activeCategory === "facials") {
      return ["facial", "glow", "mask", "carboxy", "peeling"].some(
        (treatment) => serviceLower.includes(treatment),
      );
    }
    if (activeCategory === "massage") {
      return (
        serviceLower.includes("massage") ||
        serviceLower.includes("stone") ||
        serviceLower.includes("head")
      );
    }
    if (activeCategory === "packages") {
      return (
        serviceLower.includes("twin") ||
        serviceLower.includes("ritual") ||
        serviceLower.includes("package") ||
        serviceLower.includes("polish")
      );
    }
    return true;
  });

  return (
    <section
      id="reviews"
      aria-label="Guest reviews and treatment comparisons"
      className="pt-10 sm:pt-12 pb-20 lg:pb-28 bg-[#FAF2F3] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {treatmentComparisons.length > 0 && (
          <section
            aria-labelledby="review-comparisons-heading"
            className="mb-14"
          >
            <div className="text-center mb-6">
              <h3
                id="review-comparisons-heading"
                className="text-2xl sm:text-3xl font-display text-[#3D2B27]"
              >
                Before &amp; After
              </h3>
              <p className="mt-2 text-sm text-[#5C4A45]">
                Explore comparison images for our CLINICARE facial treatments.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
              {treatmentComparisons.map((comparison) => (
                <figure
                  key={comparison.id}
                  className="overflow-hidden rounded-2xl border border-[#E8BAC0]/50 bg-white shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedComparison(comparison)}
                    aria-label={`Enlarge before and after comparison for ${comparison.title}`}
                    className="block w-full aspect-[4/3] bg-[#FFF9F9] p-3 sm:p-4 cursor-pointer hover:bg-[#FFF0F2] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#BE757C]"
                  >
                    <img
                      src={comparison.image}
                      alt={`Before and after comparison for ${comparison.title}`}
                      className="block h-full w-full object-contain rounded-lg"
                      loading="lazy"
                    />
                  </button>
                  <figcaption className="border-t border-[#E8BAC0]/30 px-5 py-4">
                    <h4 className="font-display text-lg text-[#3D2B27]">
                      {comparison.title}
                    </h4>
                    <p className="mt-1 text-xs text-[#7A5852]">
                      Select the image to view it larger.
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Category Filters */}
        <div className="flex justify-center items-center gap-2 sm:gap-3 flex-wrap mb-10">
          {[
            { id: "all", label: "All Reviews" },
            { id: "facials", label: "Facial Aesthetics" },
            { id: "massage", label: "Bodywork & Massage" },
            { id: "packages", label: "Packages & Rituals" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? "bg-[#BE757C] text-white shadow-xs"
                  : "bg-white text-[#5C4A45] hover:bg-[#FFF0F2] border border-[#E8BAC0]/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section
          aria-labelledby="leave-review-heading"
          className={`${reviewCardClass} mb-6`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-[#FFF0F2] text-[#BE757C] flex items-center justify-center" aria-hidden="true">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 id="leave-review-heading" className="font-display text-2xl text-[#3D2B27] mb-2">
                Leave a review
              </h2>
              <p className="text-sm text-[#5C4A45] leading-relaxed">
                Visited Elysian? Share your treatment experience and help others plan their visit.
              </p>
              <p className="mt-2 text-xs text-[#5C4A45]">
                All reviews require owner approval before appearing on this page.
              </p>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <LeaveReview
                onPublished={() => {
                  setActiveCategory("all");
                  void loadLatest();
                }}
              />
            </div>
          </div>
        </section>

        {/* Rating Summary Bar */}
        <div className={`${reviewCardClass} mb-6 flex flex-wrap items-center justify-around gap-4 text-center`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-display text-[#BE757C]">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-[#BE757C]">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.round(averageRating) ? "fill-current" : ""}`}
                  />
                ))}
              </div>
              <p className="text-[11px] font-bold text-[#3D2B27] uppercase tracking-wider">
                Overall Guest Rating · {reviewCount} reviews
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-[#E8BAC0]/40 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#BE757C]" />
            <span className="text-xs font-semibold text-[#5C4A45]">
              Guest Feedback
            </span>
          </div>
          <div className="h-8 w-px bg-[#E8BAC0]/40 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#BE757C]" />
            <span className="text-xs font-semibold text-[#5C4A45]">
              CLINICARE Certified Aesthetics
            </span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="max-w-2xl mx-auto mb-5 space-y-3">
          {reviewLoading && (
            <p role="status" className="text-center text-sm text-[#5C4A45]">
              Loading client reviews…
            </p>
          )}
          <ErrorMessage error={reviewError} />
          {reviewError && (
            <button
              type="button"
              className="block mx-auto text-sm underline text-[#5C4A45]"
              onClick={() => void loadLatest()}
            >
              Retry loading reviews
            </button>
          )}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredReviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`${reviewCardClass} flex flex-col justify-between hover:border-[#BE757C]/60 hover:shadow-md transition-all`}
              >
                <div>
                  {/* Rating stars & quote mark */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-[#BE757C]">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <Quote className="w-5 h-5 text-[#E8BAC0]/60" />
                  </div>

                  {/* Treatment badge */}
                  <span className="inline-block text-[10px] font-semibold tracking-wider text-[#BE757C] uppercase bg-[#FFF0F2] px-2.5 py-1 rounded-md mb-3">
                    {review.service}
                  </span>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-[#4A352F] leading-relaxed italic font-serif-luxury mb-6 whitespace-pre-wrap break-words">
                    "{review.comment}"
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#F5E6E8]">
                  <div className="w-8 h-8 rounded-full bg-[#BE757C] text-white flex items-center justify-center text-xs font-bold font-sans-clean">
                    {review.avatarText}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3D2B27] break-words">
                      {review.author}
                    </h4>
                    <p className="text-[10px] text-[#5C4A45]/70">
                      {review.date}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
        {nextCursor && (
          <div className="mt-8 text-center">
            <button
              type="button"
              className="rounded-full border border-[#BE757C] px-6 py-3 text-sm text-[#5C4A45] disabled:opacity-50"
              disabled={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore ? "Loading…" : "Load more client reviews"}
            </button>
          </div>
        )}
      </div>
      {selectedComparison && (
        <Modal
          title={`Before & After: ${selectedComparison.title}`}
          onClose={() => setSelectedComparison(null)}
        >
          <img
            src={selectedComparison.image}
            alt={`Before and after comparison for ${selectedComparison.title}`}
            className="block w-full max-h-[65vh] object-contain rounded-xl"
          />
        </Modal>
      )}
    </section>
  );
};
