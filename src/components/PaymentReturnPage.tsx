import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, RefreshCw } from "lucide-react";
import {
  money,
  courseOfferDescription,
  type Receipt,
} from "../../shared/payments";
import { getReceipt } from "../data/paymentApi";
import { buttonClass, ErrorMessage } from "./PaymentUI";
import type { PageTab } from "../types";

export function PaymentReturnPage({
  onPaid,
  onNavigate,
}: {
  onPaid: (receipt: Receipt) => void;
  onNavigate: (page: PageTab) => void;
}) {
  const token =
    new URLSearchParams(window.location.search).get("receipt") || "";
  const cancelled =
    new URLSearchParams(window.location.search).get("cancelled") === "1";
  const [record, setRecord] = useState<Receipt | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    async function poll() {
      try {
        const result = await getReceipt(token, controller.signal);
        if (controller.signal.aborted) return;
        setRecord(result.receipt);
        setCheckoutUrl(result.checkoutUrl);
        setError("");
        if (result.receipt.paidPence > 0) onPaid(result.receipt);
        const pending = result.receipt.paymentStatus === "unpaid";
        setChecking(
          pending && result.receipt.status !== "requested" && !cancelled,
        );
        if (pending && ++attempts < 24) timer = setTimeout(poll, 5000);
        else setChecking(false);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError((err as Error).message);
          setChecking(false);
        }
      }
    }
    setChecking(true);
    poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [token, refresh, cancelled, onPaid]);
  const paid = !!record && record.paidPence > 0;
  const refunded =
    record?.paymentStatus === "refunded" ||
    record?.paymentStatus === "partially_refunded";
  const title =
    record?.status === "cancelled"
      ? "Appointment cancelled"
      : refunded
        ? "Refund recorded"
        : paid
          ? record.type === "booking"
            ? "Deposit received — appointment confirmed"
            : "Payment received — order confirmed"
          : record?.status === "requested"
            ? "Awaiting owner approval"
            : record?.paymentStatus === "expired"
              ? record.type === "booking"
                ? "Appointment reservation expired"
                : "Checkout expired"
              : record?.paymentStatus === "failed"
                ? "Payment failed"
                : cancelled
                  ? "Checkout cancelled"
                  : checking
                    ? "Checking payment…"
                    : "Awaiting payment";
  return (
    <section className="mx-auto max-w-2xl space-y-6 px-5 py-16 text-center">
      {paid && record?.status !== "cancelled" ? (
        <CheckCircle2 className="mx-auto text-[#BE757C]" size={48} />
      ) : (
        <Clock className="mx-auto text-[#BE757C]" size={48} />
      )}
      <h1 className="font-display text-3xl" aria-live="polite">
        {title}
      </h1>
      {record?.status === "requested" && (
        <p className="text-sm">
          Your appointment time is temporarily held while the owner approves
          your health questionnaire and quote. Deposit payment confirms your
          appointment. Contact the spa if you need to update health information;
          keep it out of payment messages.
        </p>
      )}
      {record?.status === "requested" && record.holdUntil && (
        <p className="text-sm">
          Held until{" "}
          {new Date(record.holdUntil).toLocaleString("en-GB", {
            timeZone: "Europe/London",
          })}{" "}
          UK time. Unapproved requests expire automatically.
        </p>
      )}
      {record?.status === "cancelled" && (
        <p className="text-sm">
          This appointment has been cancelled and its time released. Any payment
          remains recorded; cancellation does not automatically issue a refund.
        </p>
      )}
      {!paid && record?.paymentStatus === "expired" && (
        <p className="text-sm">
          {record.type === "booking"
            ? "Ask the owner to check availability and approve a new deposit link."
            : "Return to your basket to start a new checkout."}
        </p>
      )}
      {!paid && record?.status === "awaiting_payment" && (
        <p className="text-sm">
          Your payment has not been confirmed. If you have already paid, refresh
          to check again. Keep this page link to view your status later.
        </p>
      )}
      <ErrorMessage error={error} />
      {record && (
        <div className="space-y-3 rounded-2xl border border-[#E8BAC0] bg-white p-5 text-left text-sm">
          <p className="break-all text-xs">Reference: {record.id}</p>
          {record.date && (
            <p>
              {record.date} at {record.time}
              {record.isCourse ? ` · ${courseOfferDescription(record)}` : ""}
            </p>
          )}
          {record.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span>
                {item.quantity}× {item.name}
              </span>
              {record.courseSessions !== 5 && record.courseSessions !== 10 && (
                <span>
                  {item.unitPricePence === null
                    ? "Quote pending"
                    : money(item.unitPricePence * item.quantity)}
                </span>
              )}
            </div>
          ))}
          <div className="border-t border-[#E8BAC0]/50 pt-3">
            <p>
              Total: {money(record.totalPence)}
              {record.items.some((i) => i.unitPricePence === null)
                ? " + quotation pending"
                : ""}
            </p>
            <p>Payment received: {money(record.paidPence)}</p>
            {refunded && <p>Refunded: {money(record.refundedPence)}</p>}
            {record.type === "booking" && paid && (
              <p>
                Remaining balance:{" "}
                {money(
                  record.totalPence - record.paidPence + record.refundedPence,
                )}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {checkoutUrl && !paid && (
          <a className={buttonClass} href={checkoutUrl}>
            Continue to Stripe checkout
          </a>
        )}
        <button
          className="flex items-center gap-2 rounded-full border border-[#BE757C] px-5 py-3 text-sm"
          onClick={() => setRefresh((r) => r + 1)}
        >
          <RefreshCw size={16} />
          Refresh status
        </button>
        <button
          className={buttonClass}
          onClick={() =>
            onNavigate(record?.type === "booking" ? "home" : "basket")
          }
        >
          {paid ? "Back to Elysian" : "Back to website"}
        </button>
      </div>
    </section>
  );
}
