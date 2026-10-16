import React, { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw, LogOut, Copy } from "lucide-react";
import {
  money,
  londonDate,
  courseOfferDescription,
  type PaymentRecord,
  type BookingRequest,
} from "../../shared/payments";
import {
  api,
  ApiError,
  getOwnerRecords,
  submissionKey,
  submitBooking,
} from "../data/paymentApi";
import { SPA_SERVICES } from "../data/spaData";
import {
  buttonClass,
  ErrorMessage,
  Field,
  inputClass,
  Modal,
} from "./PaymentUI";
import { OwnerAuthGate } from "./OwnerAuthGate";
import { OwnerCalendar } from "./OwnerCalendar";
import { AvailableAppointments } from "./AvailableAppointments";
import { OwnerReviews } from "./OwnerReviews";
import { HealthScreening } from "./HealthScreening";
import { OwnerConsultation } from "./OwnerConsultation";
import {
  blankConsultation,
  CONSULTATION_LABELS,
} from "../../shared/consultation";

function exportRecords(records: PaymentRecord[]) {
  // Neutralize spreadsheet formula prefixes as well as escaping CSV quotes.
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    return `"${(/^[\s]*[=+@-]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`;
  };
  const rows = [
    [
      "Reference",
      "Type",
      "Created",
      "Customer",
      "Email",
      "Phone",
      "Treatments / products",
      "Date",
      "Time",
      "Total GBP",
      "Paid GBP",
      "Refunded GBP",
      "Payment status",
      "Status",
      "Owner notes",
    ],
    ...records.map((r) => [
      r.id,
      r.type,
      r.createdAt,
      r.customer.name,
      r.customer.email,
      r.customer.phone,
      r.items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
      r.date,
      r.time,
      (r.totalPence / 100).toFixed(2),
      (r.paidPence / 100).toFixed(2),
      (r.refundedPence / 100).toFixed(2),
      r.paymentStatus,
      r.status,
      r.ownerNotes,
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `Elysian-records-${londonDate()}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function ManualBooking({ onSaved }: { onSaved: () => void }) {
  const [consultation, setConsultation] = useState(blankConsultation);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [serviceId, setServiceId] = useState(SPA_SERVICES[0].id);
  const [optionIndex, setOptionIndex] = useState(0);
  const [date, setDate] = useState(londonDate());
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef<{ fingerprint: string; key: string } | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !time) return;
    setBusy(true);
    setError("");
    const body: BookingRequest = {
      consultation,
      customer,
      treatments: [{ serviceId, optionIndex }],
      customTreatments: [],
      date,
      time,
      isCourse: false,
    };
    key.current = submissionKey(key.current, body);
    try {
      await submitBooking(body, key.current.key);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="space-y-4" onSubmit={submit}>
      <h3 className="font-display text-xl">Add a booking request</h3>
      <p className="text-xs">
        Complete the health questionnaire with the client and obtain their
        explicit consent. Manual requests need private consultation approval
        before a deposit link can be issued.
      </p>
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
        <Field label="Customer name">
          <input
            className={inputClass}
            required
            minLength={2}
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            required
            value={customer.email}
            onChange={(e) =>
              setCustomer({ ...customer, email: e.target.value })
            }
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputClass}
            required
            minLength={7}
            value={customer.phone}
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
          />
        </Field>
        <Field label="Treatment">
          <select
            className={inputClass}
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setOptionIndex(0);
            }}
          >
            {SPA_SERVICES.filter((s) => !s.isAddon).map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duration">
          <select
            className={inputClass}
            value={optionIndex}
            onChange={(e) => setOptionIndex(Number(e.target.value))}
          >
            {SPA_SERVICES.find((s) => s.id === serviceId)?.priceOptions?.map(
              (p, index) => (
                <option key={index} value={index}>
                  {p.duration}
                </option>
              ),
            )}
          </select>
        </Field>
      </fieldset>
      <AvailableAppointments
        selection={{
          treatments: [{ serviceId, optionIndex }],
          customTreatments: [],
          isCourse: false,
        }}
        date={date}
        time={time}
        onDate={setDate}
        onTime={setTime}
      />
      <fieldset disabled={busy}>
        <HealthScreening
          serviceIds={[serviceId]}
          value={consultation}
          onChange={setConsultation}
        />
      </fieldset>
      <ErrorMessage error={error} />
      <button className={buttonClass} disabled={busy || !time}>
        Save unpaid request
      </button>
    </form>
  );
}
function RecordDetails({
  record,
  onUpdated,
  onAuthError,
}: {
  record: PaymentRecord;
  onUpdated: () => void;
  onAuthError: () => void;
}) {
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      record.items
        .filter((i) => i.custom)
        .map((i) => [
          i.id,
          i.unitPricePence ? String(i.unitPricePence / 100) : "",
        ]),
    ),
  );
  const [notes, setNotes] = useState(record.ownerNotes);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const customs = record.items.filter((i) => i.custom);
  async function action(path: string, body: unknown, method = "POST") {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(path, body, { method });
      setMessage("Saved.");
      onUpdated();
    } catch (err) {
      setError((err as Error).message);
      if (err instanceof ApiError && err.status === 401) onAuthError();
    } finally {
      setBusy(false);
    }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(record.checkoutUrl!);
      setMessage("Checkout link copied. Send it to the customer manually.");
    } catch {
      setError("Copy was unavailable. Select and copy the link below.");
    }
  }
  const netPaid = record.paidPence - record.refundedPence;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8BAC0] bg-white p-4 sm:p-6">
      <h3 className="font-display text-xl">{record.customer.name}</h3>
      <p className="break-all text-xs">{record.id}</p>
      <p className="text-sm">
        {record.customer.email} · {record.customer.phone}
      </p>
      {record.date && (
        <p className="text-sm">
          Requested appointment: {record.date} at {record.time}
          {record.isCourse ? ` · ${courseOfferDescription(record)}` : ""}
        </p>
      )}
      {record.deliveryOption && (
        <p className="text-sm">
          {record.deliveryOption === "collection"
            ? "Sanctuary collection"
            : `Delivery: ${record.deliveryAddress}`}
        </p>
      )}
      {record.items.map((item) => (
        <div key={item.id} className="flex justify-between gap-4 text-sm">
          <span>
            {item.quantity}× {item.name} {item.duration && `(${item.duration})`}
          </span>
          <span>
            {item.unitPricePence === null
              ? "Quote required"
              : money(item.quantity * item.unitPricePence)}
          </span>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FAF0F2] p-3 text-sm">
        <span>Total: {money(record.totalPence)}</span>
        <span>Payment: {record.paymentStatus.replaceAll("_", " ")}</span>
        <span>Received: {money(record.paidPence)}</span>
        <span>Refunded: {money(record.refundedPence)}</span>
        <span>Balance: {money(Math.max(0, record.totalPence - netPaid))}</span>
        <span>Status: {record.status.replaceAll("_", " ")}</span>
      </div>
      {record.customer.notes && (
        <p className="text-sm">Customer notes: {record.customer.notes}</p>
      )}
      {record.type === "booking" && (
        <OwnerConsultation
          record={record}
          onUpdated={onUpdated}
          onAuthError={onAuthError}
        />
      )}
      {record.type === "booking" &&
        record.status !== "cancelled" &&
        !record.paidPence &&
        !record.checkoutUrl && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action(`/owner/records/${record.id}/approve`, {
                customPrices: customs.map((item) => ({
                  id: item.id,
                  pricePence: Math.round(Number(prices[item.id]) * 100),
                })),
              });
            }}
            className="space-y-3"
          >
            {customs.map((item) => (
              <Field
                key={item.id}
                label={`Approve unit price (£) — ${item.name}`}
              >
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="1000"
                  required
                  className={inputClass}
                  value={prices[item.id] || ""}
                  onChange={(e) =>
                    setPrices({ ...prices, [item.id]: e.target.value })
                  }
                />
              </Field>
            ))}
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                required
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              I have checked appointment availability and approved this quote.
            </label>
            <button
              className={buttonClass}
              disabled={
                busy || !checked || record.consultationStatus !== "approved"
              }
            >
              Approve and create 50% deposit link
            </button>
            {record.consultationStatus !== "approved" && (
              <p className="text-sm">
                Approve the private health consultation above before creating a
                deposit link.
              </p>
            )}
          </form>
        )}
      {record.checkoutUrl && !record.paidPence && (
        <div className="space-y-2 rounded-xl bg-[#FAF0F2] p-3">
          <p className="text-xs">
            Send this checkout link manually. It expires{" "}
            {new Date(record.expiresAt!).toLocaleString("en-GB")}.
          </p>
          <input
            aria-label="Customer checkout link"
            readOnly
            className={inputClass}
            value={record.checkoutUrl}
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            className="flex items-center gap-2 text-sm underline"
            onClick={copyLink}
          >
            <Copy size={15} />
            Copy checkout link
          </button>
        </div>
      )}
      <Field label="Owner notes">
        <textarea
          className={inputClass}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      {record.type === "booking" && (
        <p className="text-xs">
          Keep health information in Private consultation notes above. General
          owner notes appear in routine CSV exports.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={buttonClass}
          disabled={busy}
          onClick={() =>
            action(
              `/owner/records/${record.id}`,
              { ownerNotes: notes },
              "PATCH",
            )
          }
        >
          Save notes
        </button>
        {record.paymentStatus === "paid" && record.status === "confirmed" && (
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={() =>
              action(
                `/owner/records/${record.id}`,
                {
                  status:
                    record.type === "booking" ? "completed" : "dispatched",
                },
                "PATCH",
              )
            }
          >
            Mark {record.type === "booking" ? "completed" : "dispatched"}
          </button>
        )}
      </div>
      <p className="text-xs text-[#7A5852]">
        Customer messages are sent manually. Refunds are initiated in the Stripe
        dashboard and synced when its refund event arrives.
      </p>
      <ErrorMessage error={error} />
      {message && (
        <p role="status" className="text-sm text-green-800">
          {message}
        </p>
      )}
    </div>
  );
}
function Dashboard() {
  const [auth, setAuth] = useState<"checking" | "signed_out" | "signed_in">(
    "checking",
  );
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [manual, setManual] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [calendarMode, setCalendarMode] = useState(false);
  const signOutState = useCallback(() => {
    setAuth("signed_out");
    setRecords([]);
    setSelected(null);
  }, []);
  const reload = useCallback(async () => {
    try {
      const result = await getOwnerRecords();
      setRecords(result.records);
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) signOutState();
      else setError((err as Error).message);
    }
  }, [signOutState]);
  useEffect(() => {
    let active = true;
    api("/owner/session")
      .then(() => {
        if (active) setAuth("signed_in");
      })
      .catch((err) => {
        if (active) {
          setAuth("signed_out");
          if (!(err instanceof ApiError && err.status === 401))
            setError(err.message);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (auth !== "signed_in") return;
    reload();
    const interval = setInterval(reload, 15000);
    return () => clearInterval(interval);
  }, [auth, reload]);
  async function logout() {
    try {
      await api("/owner/logout", {});
      signOutState();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  if (auth === "checking") return <p role="status">Checking owner session…</p>;
  if (auth === "signed_out")
    return (
      <>
        <ErrorMessage error={error} />
        <OwnerAuthGate
          onSuccess={() => {
            setError("");
            setAuth("signed_in");
          }}
        />
      </>
    );
  const filtered = records.filter(
    (r) =>
      (filter === "all" || r.type === filter) &&
      (status === "all" || r.paymentStatus === status) &&
      `${r.id} ${r.customer.name} ${r.customer.email} ${r.customer.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const active = records.find((r) => r.id === selected);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {!reviewMode && !calendarMode && (
          <>
            <button
              type="button"
              className="flex items-center gap-2 text-sm underline"
              onClick={reload}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              type="button"
              className="flex items-center gap-2 text-sm underline"
              onClick={() => exportRecords(filtered)}
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => setManual(!manual)}
            >
              {manual ? "View records" : "Add booking request"}
            </button>
          </>
        )}
        <button
          type="button"
          className="ml-auto flex items-center gap-2 text-sm underline"
          onClick={logout}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
      <div className="flex flex-wrap gap-3 border-b border-[#E8BAC0]/40 pb-3">
        <button
          type="button"
          className="text-sm underline"
          aria-pressed={!reviewMode && !calendarMode}
          onClick={() => {
            setReviewMode(false);
            setCalendarMode(false);
          }}
        >
          Bookings & orders
        </button>
        <button
          type="button"
          className="text-sm underline"
          aria-pressed={reviewMode && !calendarMode}
          onClick={() => {
            setReviewMode(true);
            setCalendarMode(false);
          }}
        >
          Client reviews
        </button>
        <button
          type="button"
          className="text-sm underline"
          aria-pressed={calendarMode}
          onClick={() => {
            setCalendarMode(true);
            setReviewMode(false);
          }}
        >
          Appointment diary
        </button>
      </div>
      <ErrorMessage error={error} />
      {calendarMode ? (
        <OwnerCalendar
          onAuthError={signOutState}
          onOpenRecord={(id) => {
            setSelected(id);
            setCalendarMode(false);
            setReviewMode(false);
            setManual(false);
            setFilter("all");
            setStatus("all");
            setQuery("");
            void reload();
          }}
        />
      ) : reviewMode ? (
        <OwnerReviews onAuthError={signOutState} />
      ) : manual ? (
        <ManualBooking
          onSaved={() => {
            setManual(false);
            reload();
          }}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              aria-label="Search records"
              placeholder="Search customer or reference"
              className={inputClass}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Record type"
              className={inputClass}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All records</option>
              <option value="booking">Bookings</option>
              <option value="sale">Shop orders</option>
            </select>
            <select
              aria-label="Payment status"
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {[
                "all",
                "unpaid",
                "paid",
                "expired",
                "failed",
                "partially_refunded",
                "refunded",
              ].map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm">
            {filtered.length} records · Net received:{" "}
            {money(
              records.reduce(
                (sum, r) => sum + r.paidPence - r.refundedPence,
                0,
              ),
            )}
          </p>
          <div className="space-y-2">
            {filtered.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-left ${selected === r.id ? "border-[#BE757C] bg-[#FAF0F2]" : "border-[#E8BAC0]/50 bg-white"}`}
              >
                <span>
                  <strong className="text-sm">{r.customer.name}</strong>
                  <span className="ml-2 text-xs">
                    {r.type === "booking"
                      ? `${r.date} ${r.time}`
                      : "Shop order"}
                  </span>
                  {r.type === "booking" && (
                    <span className="block mt-1 text-xs text-[#7A5852]">
                      {
                        CONSULTATION_LABELS[
                          r.consultationStatus ?? "awaiting_review"
                        ]
                      }
                    </span>
                  )}
                </span>
                <span className="text-xs">
                  {money(r.totalPence)} · {r.status.replaceAll("_", " ")} ·{" "}
                  {r.paymentStatus.replaceAll("_", " ")}
                </span>
              </button>
            ))}
            {!filtered.length && (
              <p className="py-6 text-center text-sm">No records yet.</p>
            )}
          </div>
          {active && (
            <RecordDetails
              key={`${active.id}:${active.revision}:${active.paymentStatus}:${active.checkoutUrl || ""}`}
              record={active}
              onUpdated={reload}
              onAuthError={signOutState}
            />
          )}
        </>
      )}
    </div>
  );
}
export function OwnerCRMModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return isOpen ? (
    <Modal title="Owner dashboard" onClose={onClose}>
      <Dashboard />
    </Modal>
  ) : null;
}
