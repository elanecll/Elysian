import React, { useCallback, useEffect, useState } from "react";
import type {
  NotificationFeed,
  NotificationStatus,
  BookingNotice,
} from "../../shared/notifications";
import { api, ApiError } from "../data/paymentApi";
import { buttonClass, ErrorMessage } from "./PaymentUI";

const eventNames: Record<BookingNotice, string> = {
  request_received: "Request received",
  deposit_ready: "Approval and payment link",
  booking_confirmed: "Payment and booking confirmation",
};
const statusNames: Record<NotificationStatus, string> = {
  pending: "Waiting to send",
  not_configured: "Setup required",
  sending: "Sending",
  accepted: "Accepted by service",
  delivered: "Delivered",
  failed: "Needs attention",
  unknown: "Check provider log",
  skipped: "No longer needed",
};
export function BookingNotifications({
  recordId,
  onAuthError,
}: {
  recordId: string;
  onAuthError: () => void;
}) {
  const [feed, setFeed] = useState<NotificationFeed | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const result = await api<NotificationFeed>(
          `/owner/records/${recordId}/notifications`,
          undefined,
          { signal },
        );
        setFeed(result);
        setError("");
      } catch (err) {
        if (signal?.aborted) return;
        setError((err as Error).message);
        if (err instanceof ApiError && err.status === 401) onAuthError();
      }
    },
    [recordId, onAuthError],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = setInterval(() => {
      if (!document.hidden) void load(controller.signal);
    }, 30000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [load]);
  async function sendPending() {
    setBusy(true);
    setError("");
    try {
      setFeed(
        await api<NotificationFeed>(
          `/owner/records/${recordId}/notifications`,
          {},
        ),
      );
    } catch (err) {
      setError((err as Error).message);
      if (err instanceof ApiError && err.status === 401) onAuthError();
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="space-y-3 rounded-xl border border-[#E8BAC0] bg-[#FAF0F2] p-4"
      aria-label="Booking notifications"
    >
      <h4 className="font-semibold">Booking notifications</h4>
      {feed && (
        <>
          <p className="text-sm">
            Client email:{" "}
            {feed.emailConfigured ? "Connected" : "Setup required"} · Your
            WhatsApp alerts:{" "}
            {feed.whatsappConfigured ? "Connected" : "Setup required"}
          </p>
          {(!feed.emailConfigured || !feed.whatsappConfigured) && (
            <p className="text-sm">
              Automatic sending needs an email service and a WhatsApp Business
              sender. Your contact address and WhatsApp app alone do not
              activate it. Until connected, send the checkout link manually.
            </p>
          )}
          {feed.notifications.length ? (
            <ul className="space-y-2 text-sm">
              {feed.notifications.map((notice) => (
                <li key={notice.id}>
                  <span className="font-medium">
                    {eventNames[notice.event]}
                  </span>{" "}
                  · {notice.audience === "owner" ? "You" : "Client"} ·{" "}
                  {notice.channel === "email" ? "Email" : "WhatsApp"}:{" "}
                  <strong>{statusNames[notice.status]}</strong>
                  {notice.detail && <p className="text-xs">{notice.detail}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">
              No automatic messages have been recorded for this booking.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClass}
              disabled={
                busy || !(feed.emailConfigured || feed.whatsappConfigured)
              }
              onClick={sendPending}
            >
              {busy ? "Checking messages…" : "Send pending messages"}
            </button>
            <button
              type="button"
              className="text-sm underline"
              disabled={busy}
              onClick={() => void load()}
            >
              Refresh message status
            </button>
          </div>
          <p className="text-xs">
            Accepted means the service has the message. Delivered appears only
            after the service confirms delivery. Existing messages are not sent
            twice.
          </p>
        </>
      )}
      <ErrorMessage error={error} />
    </section>
  );
}
