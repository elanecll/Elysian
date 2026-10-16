import React, { useRef, useState } from "react";
import { SPA_SERVICES } from "../data/spaData";
import { submitReview } from "../data/reviewApi";
import { submissionKey } from "../data/paymentApi";
import type { ReviewRequest, ReviewStatus } from "../../shared/reviews";
import { PenLine, ArrowRight } from "lucide-react";
import {
  buttonClass,
  ErrorMessage,
  Field,
  inputClass,
  Modal,
} from "./PaymentUI";

export function LeaveReview({ onPublished }: { onPublished: () => void }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [submittedStatus, setSubmittedStatus] =
    useState<ReviewStatus>("pending");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState<ReviewRequest>({
    author: "",
    serviceId: "",
    rating: 5,
    comment: "",
    consent: false,
    website: "",
  });
  const key = useRef<{ fingerprint: string; key: string } | null>(null);
  const submitting = useRef(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    key.current = submissionKey(key.current, input);
    try {
      const result = await submitReview(input, key.current.key);
      setSubmittedStatus(result.status);
      setSent(true);
      if (result.published) onPublished();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="inline-flex w-full sm:w-auto min-h-12 items-center justify-center gap-2 rounded-full bg-[#87464D] hover:bg-[#71383F] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:shadow-md transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87464D]"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <PenLine className="w-5 h-5" aria-hidden="true" />
        <span>Leave a review</span>
        <ArrowRight className="w-5 h-5" aria-hidden="true" />
      </button>
      {open && (
        <Modal
          title="Leave a review"
          onClose={() => {
            if (!busy) setOpen(false);
          }}
        >
          {sent ? (
            <div className="space-y-4 text-center">
              <h3
                className="font-display text-2xl text-[#3D2B27]"
                role="status"
              >
                {submittedStatus === "published"
                  ? "Thank you! Your review is published."
                  : "Thank you! Your review has been submitted."}
              </h3>
              <p className="text-sm text-[#5C4A45]">
                {submittedStatus === "published"
                  ? "You can find it in All Reviews and its treatment category."
                  : submittedStatus === "pending"
                    ? "Your review is awaiting owner approval. It will appear on the website only after the owner approves it."
                    : "Your review has been received and is currently unpublished. Only the owner can authorise publication."}
              </p>
              <button
                type="button"
                className={buttonClass}
                onClick={() => setOpen(false)}
              >
                View reviews
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5 max-w-2xl mx-auto">
              <p className="text-sm text-[#5C4A45]">
                Share your experience at Elysian. Your display name, treatment,
                star rating and review will appear publicly only after owner
                approval.
              </p>
              <fieldset disabled={busy} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display name">
                    <input
                      className={inputClass}
                      autoComplete="nickname"
                      required
                      minLength={2}
                      maxLength={60}
                      value={input.author}
                      onChange={(e) =>
                        setInput({ ...input, author: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Treatment">
                    <select
                      aria-label="Treatment"
                      className={inputClass}
                      required
                      value={input.serviceId}
                      onChange={(e) =>
                        setInput({ ...input, serviceId: e.target.value })
                      }
                    >
                      <option value="">Choose your treatment</option>
                      {SPA_SERVICES.filter((service) => !service.isAddon).map(
                        (service) => (
                          <option key={service.id} value={service.id}>
                            {service.title}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                </div>
                <Field label="Star rating">
                  <select
                    aria-label="Star rating"
                    className={inputClass}
                    value={input.rating}
                    onChange={(e) =>
                      setInput({ ...input, rating: Number(e.target.value) })
                    }
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} {rating === 1 ? "star" : "stars"}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Your review">
                  <textarea
                    className={inputClass}
                    required
                    minLength={20}
                    maxLength={2000}
                    rows={5}
                    value={input.comment}
                    onChange={(e) =>
                      setInput({ ...input, comment: e.target.value })
                    }
                    placeholder="Tell us about your treatment and experience…"
                  />
                </Field>
                <p className="text-xs text-[#7A5852]">
                  20–2,000 characters. Please leave out phone numbers, email
                  addresses and private health details.
                </p>
                <div hidden aria-hidden="true">
                  <label>
                    Website
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={input.website}
                      onChange={(e) =>
                        setInput({ ...input, website: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="flex items-start gap-3 text-sm text-[#5C4A45]">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[#BE757C]"
                    required
                    checked={input.consent}
                    onChange={(e) =>
                      setInput({ ...input, consent: e.target.checked })
                    }
                  />
                  I agree to publish my display name and review on the Elysian
                  website after owner approval.
                </label>
              </fieldset>
              <ErrorMessage error={error} />
              <button className={buttonClass} disabled={busy}>
                {busy ? "Submitting…" : "Submit for approval"}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
