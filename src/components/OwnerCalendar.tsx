import React, { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, submissionKey } from "../data/paymentApi";
import { londonDate } from "../../shared/payments";
import {
  DAY_NAMES,
  shiftDate,
  type DiaryFeed,
  type DiaryEntry,
} from "../../shared/calendar";
import { buttonClass, inputClass, Field, ErrorMessage } from "./PaymentUI";

type OwnerEntry = DiaryEntry & {
  paymentStatus?: string;
  recordStatus?: string;
  checkoutUrl?: string;
};
const labels = {
  request: "Awaiting approval",
  payment: "Awaiting deposit",
  confirmed: "Confirmed",
  manual: "Manual appointment",
  block: "Blocked time",
};
const colours = {
  request: "border-amber-300 bg-amber-50",
  payment: "border-blue-200 bg-blue-50",
  confirmed: "border-green-200 bg-green-50",
  manual: "border-[#E8BAC0] bg-[#FAF0F2]",
  block: "border-gray-300 bg-gray-100",
};
export function OwnerCalendar({
  onAuthError,
  onOpenRecord,
}: {
  onAuthError: () => void;
  onOpenRecord: (id: string) => void;
}) {
  const [date, setDate] = useState(londonDate());
  const [view, setView] = useState<"day" | "week">("week");
  const [feed, setFeed] = useState<
    (Omit<DiaryFeed, "entries"> & { entries: OwnerEntry[] }) | null
  >(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: londonDate(),
    time: "13:00",
    durationMinutes: 60,
    kind: "manual" as "manual" | "block",
    title: "",
    customerName: "",
    phone: "",
    notes: "",
  });
  const key = useRef<{ fingerprint: string; key: string } | null>(null);
  const days = view === "week" ? 7 : 1;
  const handleError = useCallback(
    (err: unknown) => {
      setError((err as Error).message);
      if (err instanceof ApiError && err.status === 401) onAuthError();
    },
    [onAuthError],
  );
  const load = useCallback(async () => {
    try {
      setFeed(
        await api(
          `/owner/calendar?from=${date}&to=${shiftDate(date, days - 1)}`,
        ),
      );
      setError("");
    } catch (err) {
      handleError(err);
    }
  }, [date, days, handleError]);
  useEffect(() => {
    if (!showHours) void load();
    const timer = setInterval(() => {
      if (!document.hidden && !showHours) void load();
    }, 15000);
    return () => clearInterval(timer);
  }, [load, showHours]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    key.current = submissionKey(key.current, form);
    try {
      await api("/owner/calendar", form, { key: key.current.key });
      setShowForm(false);
      setDate(form.date);
      setMessage(
        form.kind === "manual"
          ? "Appointment added with a 30-minute break. Complete the health consultation and consent in your private clinical records. Payment is recorded separately."
          : "Time blocked.",
      );
      key.current = null;
      setForm({ ...form, title: "", customerName: "", phone: "", notes: "" });
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }
  async function cancel(id: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/owner/calendar/${encodeURIComponent(id)}/cancel`, {});
      setConfirmCancel(null);
      setMessage(
        "Diary entry cancelled and time released. No refund has been issued.",
      );
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }
  async function saveHours(e: React.FormEvent) {
    e.preventDefault();
    if (!feed || busy) return;
    setBusy(true);
    try {
      await api(
        "/owner/calendar/hours",
        { hours: feed.hours },
        { method: "PATCH" },
      );
      setMessage("Opening hours saved. Existing reservations are retained.");
      setShowHours(false);
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }
  const visible =
    feed?.entries.filter((e) => showCancelled || !e.cancelled) || [];
  const conflicts = visible.filter(
    (e) =>
      !e.cancelled &&
      visible.some(
        (other) =>
          other.id !== e.id &&
          !other.cancelled &&
          e.date === other.date &&
          e.time < other.availableAfter &&
          e.availableAfter > other.time,
      ),
  );
  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl">Appointment diary</h3>
      <p className="text-sm">
        One client at a time · 30-minute break after every appointment · UK
        local time
      </p>
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          className="text-sm underline"
          onClick={() => setDate(shiftDate(date, -days))}
        >
          Previous
        </button>
        <input
          aria-label="Diary date"
          type="date"
          className={`${inputClass} sm:max-w-44`}
          value={date}
          onChange={(e) => {
            if (e.target.value) setDate(e.target.value);
          }}
        />
        <button
          type="button"
          className="text-sm underline"
          onClick={() => setDate(shiftDate(date, days))}
        >
          Next
        </button>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => setDate(londonDate())}
        >
          Today
        </button>
        <button
          type="button"
          className="text-sm underline"
          aria-pressed={view === "day"}
          onClick={() => setView("day")}
        >
          Day
        </button>
        <button
          type="button"
          className="text-sm underline"
          aria-pressed={view === "week"}
          onClick={() => setView("week")}
        >
          Week
        </button>
        <button type="button" className="text-sm underline" onClick={load}>
          Refresh diary
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            setForm({ ...form, date });
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Close entry form" : "Add appointment / blocked time"}
        </button>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => setShowHours(!showHours)}
        >
          Opening hours
        </button>
        <label className="flex gap-2 text-xs items-center">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
          />
          Show cancelled / expired
        </label>
      </div>
      <ErrorMessage error={error} />
      {message && (
        <p
          role="status"
          className="rounded-xl bg-green-50 p-3 text-sm text-green-800"
        >
          {message}
        </p>
      )}
      {!!conflicts.length && (
        <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm">
          Some existing appointments overlap. Review these legacy entries and
          arrange new times with the clients.
        </p>
      )}
      {showForm && (
        <form
          onSubmit={save}
          className="rounded-xl border border-[#E8BAC0] bg-white p-4 space-y-3"
        >
          <h4 className="font-display text-xl">Add to your diary</h4>
          <p className="text-xs">
            Enter phone and WhatsApp appointments here so online clients cannot
            take the same time. Manual appointments stay reserved until you
            cancel them; this does not create a paid receipt.
          </p>
          <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
            <Field label="Entry type">
              <select
                aria-label="Entry type"
                className={inputClass}
                value={form.kind}
                onChange={(e) =>
                  setForm({
                    ...form,
                    kind: e.target.value as "manual" | "block",
                  })
                }
              >
                <option value="manual">Client appointment</option>
                <option value="block">Break / holiday / unavailable</option>
              </select>
            </Field>
            <Field label="Treatment or reason">
              <input
                aria-label="Treatment or reason"
                className={inputClass}
                required
                minLength={2}
                maxLength={150}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Entry date">
              <input
                aria-label="Entry date"
                className={inputClass}
                required
                type="date"
                min={londonDate()}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="Start time (UK)">
              <input
                aria-label="Start time (UK)"
                className={inputClass}
                required
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </Field>
            <Field label="Duration in minutes">
              <input
                aria-label="Duration in minutes"
                className={inputClass}
                required
                type="number"
                min={5}
                max={form.kind === "manual" ? 480 : 1440}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({ ...form, durationMinutes: Number(e.target.value) })
                }
              />
            </Field>
            {form.kind === "manual" && (
              <>
                <Field label="Client name">
                  <input
                    aria-label="Client name"
                    className={inputClass}
                    required
                    minLength={2}
                    maxLength={120}
                    value={form.customerName}
                    onChange={(e) =>
                      setForm({ ...form, customerName: e.target.value })
                    }
                  />
                </Field>
                <Field label="Client phone (optional)">
                  <input
                    aria-label="Client phone (optional)"
                    className={inputClass}
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </Field>
              </>
            )}
            <Field label="Diary notes (no health information)">
              <textarea
                className={inputClass}
                maxLength={2000}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </fieldset>
          <p className="text-xs">
            {form.kind === "manual"
              ? "A 30-minute break is added automatically. You can enter appointments outside normal opening hours; overlaps are always blocked. Complete health screening and treatment consent in your private clinical records before treating the client."
              : "For a full day off, enter 00:00 and 1440 minutes. Add a separate entry for each holiday date."}
          </p>
          <button className={buttonClass} disabled={busy}>
            Save diary entry
          </button>
        </form>
      )}
      {showHours && feed && (
        <form
          onSubmit={saveHours}
          className="space-y-3 rounded-xl border border-[#E8BAC0] bg-white p-4"
        >
          <h4 className="font-display text-xl">Weekly opening hours</h4>
          <p className="text-xs">
            Clients can start every 15 minutes when the treatment and 30-minute
            break both fit before closing. Changing hours does not cancel
            existing appointments.
          </p>
          {feed.hours.map((day, index) => (
            <div key={day.day} className="grid grid-cols-3 gap-2 items-center">
              <label className="text-xs flex gap-2">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) =>
                    setFeed({
                      ...feed,
                      hours: feed.hours.map((d, i) =>
                        i === index ? { ...d, enabled: e.target.checked } : d,
                      ),
                    })
                  }
                />
                {DAY_NAMES[day.day]}
              </label>
              <input
                aria-label={`${DAY_NAMES[day.day]} opens`}
                type="time"
                required
                disabled={!day.enabled}
                className={inputClass}
                value={day.open}
                onChange={(e) =>
                  setFeed({
                    ...feed,
                    hours: feed.hours.map((d, i) =>
                      i === index ? { ...d, open: e.target.value } : d,
                    ),
                  })
                }
              />
              <input
                aria-label={`${DAY_NAMES[day.day]} closes`}
                type="time"
                required
                disabled={!day.enabled}
                className={inputClass}
                value={day.close}
                onChange={(e) =>
                  setFeed({
                    ...feed,
                    hours: feed.hours.map((d, i) =>
                      i === index ? { ...d, close: e.target.value } : d,
                    ),
                  })
                }
              />
            </div>
          ))}
          <button className={buttonClass} disabled={busy}>
            Save opening hours
          </button>
        </form>
      )}
      {!feed && !error && <p role="status">Loading diary…</p>}
      {feed && (
        <div className="space-y-4">
          {Array.from({ length: days }, (_, index) =>
            shiftDate(date, index),
          ).map((day) => {
            const dayEntries = visible.filter((e) => e.date === day);
            return (
              <section
                key={day}
                className="rounded-xl border border-[#E8BAC0]/50 bg-white p-3 space-y-2"
              >
                <h4 className="font-semibold text-sm">
                  {new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: "Europe/London",
                  })}
                </h4>
                {!dayEntries.length && (
                  <p className="text-xs text-[#7A5852]">
                    No appointments or blocked time.
                  </p>
                )}
                {dayEntries.map((e) => (
                  <div
                    key={e.id}
                    className={`rounded-xl border p-3 space-y-2 ${e.cancelled ? "bg-gray-50 border-gray-200 opacity-70" : colours[e.kind]}`}
                  >
                    <p className="text-sm font-semibold">
                      {e.time}–{e.endTime} · {e.customerName || e.title}
                    </p>
                    <p className="text-xs break-words">
                      {e.customerName && `${e.title} · `}
                      {e.cancelled ? "Cancelled / expired" : labels[e.kind]}
                      {e.paymentStatus
                        ? ` · Payment: ${e.paymentStatus.replaceAll("_", " ")}`
                        : ""}
                    </p>
                    {!!e.breakMinutes && (
                      <p className="text-xs">
                        Rest / preparation: {e.endTime}–{e.availableAfter}. Next
                        client from {e.availableAfter}.
                      </p>
                    )}
                    {e.holdUntil && !e.cancelled && (
                      <p className="text-xs">
                        Held until{" "}
                        {new Date(e.holdUntil).toLocaleString("en-GB", {
                          timeZone: "Europe/London",
                        })}{" "}
                        UK time.
                      </p>
                    )}
                    {e.phone && <p className="text-xs">{e.phone}</p>}
                    {e.notes && (
                      <p className="text-xs break-words">{e.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {e.recordId && (
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={() => onOpenRecord(e.recordId!)}
                        >
                          Open booking / approve deposit
                        </button>
                      )}
                      {e.checkoutUrl && !e.cancelled && (
                        <button
                          type="button"
                          className="text-xs underline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                e.checkoutUrl!,
                              );
                              setMessage(
                                "Deposit link copied. Share it with the client manually.",
                              );
                            } catch {
                              setError(
                                "Copy unavailable. Open the booking to copy the link.",
                              );
                            }
                          }}
                        >
                          Copy deposit link
                        </button>
                      )}
                      {!e.cancelled && (
                        <button
                          type="button"
                          className="text-xs underline"
                          disabled={busy}
                          onClick={() => setConfirmCancel(e.id)}
                        >
                          Cancel / release time
                        </button>
                      )}
                    </div>
                    {confirmCancel === e.id && (
                      <div className="text-xs space-y-2">
                        <p>
                          Cancel this entry and release its time? Any active
                          deposit link will be closed first. Payments and
                          refunds remain recorded separately.
                        </p>
                        <button
                          type="button"
                          className={`${buttonClass} mr-2`}
                          disabled={busy}
                          onClick={() => cancel(e.id)}
                        >
                          Confirm cancellation
                        </button>
                        <button
                          type="button"
                          className="underline"
                          onClick={() => setConfirmCancel(null)}
                        >
                          Keep appointment
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
