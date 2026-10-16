import React, { useEffect, useState } from "react";
import type { BookingRequest } from "../../shared/payments";
import { londonDate } from "../../shared/payments";
import {
  BOOKING_DAYS,
  shiftDate,
  clockTime,
  minutes,
  type Availability,
} from "../../shared/calendar";
import { api } from "../data/paymentApi";
import { Field, inputClass, ErrorMessage } from "./PaymentUI";

export function AvailableAppointments({
  selection,
  date,
  time,
  onDate,
  onTime,
}: {
  selection: Pick<
    BookingRequest,
    | "treatments"
    | "customTreatments"
    | "isCourse"
    | "courseSessions"
    | "courseRewardSelection"
  >;
  date: string;
  time: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
}) {
  const [feed, setFeed] = useState<Availability | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const fingerprint = JSON.stringify({ ...selection, date });
  useEffect(() => {
    const controller = new AbortController();
    setFeed(null);
    setLoading(true);
    setError("");
    async function load() {
      try {
        const result = await api<Availability>(
          "/availability",
          JSON.parse(fingerprint),
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setFeed(result);
        setError("");
      } catch (err) {
        if (!controller.signal.aborted) {
          setFeed(null);
          setError((err as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 30000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [fingerprint, refresh]);
  useEffect(() => {
    if (!feed || !feed.slots.includes(time)) onTime("");
  }, [feed, time, onTime]);
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Appointment date">
          <input
            aria-label="Appointment date"
            className={inputClass}
            type="date"
            required
            min={londonDate()}
            max={shiftDate(londonDate(), BOOKING_DAYS)}
            value={date}
            onChange={(e) => {
              onTime("");
              onDate(e.target.value);
            }}
          />
        </Field>
        <Field label="Available time (UK)">
          <select
            aria-label="Available time (UK)"
            className={inputClass}
            required
            value={feed?.slots.includes(time) ? time : ""}
            disabled={loading || !feed?.slots.length}
            onChange={(e) => onTime(e.target.value)}
          >
            <option value="">
              {loading ? "Checking availability…" : "Choose a time"}
            </option>
            {feed?.slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {feed && (
        <p className="text-xs text-[#7A5852]" role="status">
          {feed.closed
            ? "The spa is closed on this day. Please choose another date."
            : !feed.slots.length
              ? "No available times for these treatments. Please choose another date."
              : `${feed.durationMinutes} minutes reserved for your treatments, plus a 30-minute rest and preparation break.`}
        </p>
      )}
      {feed && time && (
        <p className="text-xs">
          Treatment ends at {clockTime(minutes(time) + feed.durationMinutes)}.
          The next client can start at{" "}
          {clockTime(minutes(time) + feed.durationMinutes + feed.breakMinutes)}.
        </p>
      )}
      {selection.isCourse && (
        <p className="text-xs">
          This date reserves your first visit. Later course visits are arranged
          separately with the owner, including your complimentary treatment.
        </p>
      )}
      <p className="text-xs text-[#7A5852]">
        Times are in UK local time. Requests hold your slot for up to 24 hours
        while awaiting owner approval. Deposit payment confirms your
        appointment.
      </p>
      <button
        type="button"
        className="text-xs underline"
        onClick={() => setRefresh((r) => r + 1)}
      >
        Refresh available times
      </button>
      <ErrorMessage error={error} />
    </div>
  );
}
