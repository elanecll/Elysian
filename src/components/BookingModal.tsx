import React, { useEffect, useRef, useState } from "react";
import { Calendar, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { SPA_SERVICES } from "../data/spaData";
import {
  EXTRA_ADDONS,
  londonDate,
  money,
  type BookingRequest,
  type Receipt,
} from "../../shared/payments";
import { submissionKey, submitBooking } from "../data/paymentApi";
import {
  buttonClass,
  ErrorMessage,
  Field,
  inputClass,
  Modal,
} from "./PaymentUI";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string;
  initialProduct?: "tropic" | "clinicare";
  initialDuration?: "30" | "60";
  initialIsCourse?: boolean;
  onOpenCRM?: () => void;
  onOpenTerms?: () => void;
}
function BookingForm(props: BookingModalProps) {
  const initialService = SPA_SERVICES.find(
    (s) => s.id === props.preselectedServiceId,
  );
  const [serviceId, setServiceId] = useState(
    initialService && !initialService.isAddon
      ? initialService.id
      : SPA_SERVICES[0].id,
  );
  const service =
    SPA_SERVICES.find((s) => s.id === serviceId) || SPA_SERVICES[0];
  const [optionIndex, setOptionIndex] = useState(() =>
    Math.max(
      0,
      service.priceOptions?.findIndex((p) =>
        p.duration.includes(props.initialDuration || "30"),
      ) ?? 0,
    ),
  );
  const [isCourse, setIsCourse] = useState(!!props.initialIsCourse);
  const [addons, setAddons] = useState<string[]>(
    initialService?.isAddon ? [initialService.id] : [],
  );
  const [customs, setCustoms] = useState<
    { title: string; durationMinutes: number }[]
  >([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customDuration, setCustomDuration] = useState(30);
  const [date, setDate] = useState(londonDate());
  const [time, setTime] = useState("11:00");
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{
    receipt: Receipt;
    receiptToken: string;
  } | null>(null);
  const key = useRef<{ fingerprint: string; key: string } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const addonOptions = [
    ...SPA_SERVICES.filter(
      (s) =>
        s.isAddon ||
        [
          "carboxytherapy-face-mask-treatment",
          "cliniccare-chemical-peeling",
          "cliniccare-cinderella-black-tie-facial",
        ].includes(s.id),
    ).map((s) => ({
      id: s.id,
      title: s.title,
      duration: s.duration,
      pricePence: Math.round(
        Number(
          s.priceOptions?.[0].priceClinicare ?? s.priceOptions?.[0].priceSingle,
        ) * 100,
      ),
    })),
    ...EXTRA_ADDONS,
  ].filter((a) => a.id !== serviceId);
  const option = service.priceOptions?.[optionIndex];
  const unitPrice = option?.priceClinicare ?? option?.priceSingle;
  const knownTotal =
    ((typeof unitPrice === "number" ? Math.round(unitPrice * 100) : 0) +
      addons.reduce(
        (sum, id) =>
          sum + (addonOptions.find((a) => a.id === id)?.pricePence || 0),
        0,
      )) *
    (isCourse ? 3 : 1);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const body: BookingRequest = {
      customer,
      treatments: [
        { serviceId, optionIndex },
        ...addons
          .filter((id) => id !== serviceId)
          .map((id) => ({ serviceId: id, optionIndex: 0 })),
      ],
      customTreatments: customs,
      date,
      time,
      isCourse,
    };
    key.current = submissionKey(key.current, body);
    try {
      const result = await submitBooking(body, key.current.key);
      if (alive.current) setSubmitted(result);
    } catch (err) {
      if (alive.current) setError((err as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  if (submitted)
    return (
      <div className="space-y-5 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#BE757C]" />
        <h3 className="font-display text-2xl">Appointment request received</h3>
        <p className="text-sm">
          The owner will check availability and approve your quote before asking
          for a 50% deposit. Your appointment is confirmed after payment.
        </p>
        <p className="break-all text-xs">Reference: {submitted.receipt.id}</p>
        <a
          className={`${buttonClass} inline-block`}
          href={`/?receipt=${submitted.receiptToken}#payment`}
        >
          View request status
        </a>
      </div>
    );
  return (
    <form onSubmit={submit} className="space-y-6">
      <p className="rounded-xl bg-[#FAF0F2] p-4 text-sm">
        Request your preferred appointment. No payment is taken today. After
        checking availability, the owner will send a Stripe checkout link for
        your 50% deposit.
      </p>
      <fieldset disabled={busy} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary treatment">
            <select
              className={inputClass}
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setOptionIndex(0);
                setAddons([]);
              }}
            >
              {SPA_SERVICES.filter((s) => !s.isAddon).map((s) => (
                <option value={s.id} key={s.id}>
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
              {service.priceOptions?.map((p, i) => (
                <option key={i} value={i}>
                  {p.duration} —{" "}
                  {typeof (p.priceClinicare ?? p.priceSingle) === "number"
                    ? money(Number(p.priceClinicare ?? p.priceSingle) * 100)
                    : "Owner quotation"}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isCourse}
            onChange={(e) => setIsCourse(e.target.checked)}
          />{" "}
          Buy 3 sessions, get the 4th free
        </label>
        <div>
          <h3 className="mb-3 font-display text-xl">Add to your ritual</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {addonOptions.map((addon) => (
              <label
                key={addon.id}
                className="flex items-start gap-2 rounded-xl border border-[#E8BAC0]/50 p-3 text-xs"
              >
                <input
                  className="mt-0.5"
                  type="checkbox"
                  checked={addons.includes(addon.id)}
                  onChange={(e) =>
                    setAddons((previous) =>
                      e.target.checked
                        ? [...previous, addon.id]
                        : previous.filter((id) => id !== addon.id),
                    )
                  }
                />
                <span>
                  {addon.title}
                  <br />
                  {addon.duration} · {money(addon.pricePence)}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-xl border border-[#E8BAC0]/60 p-4">
          <h3 className="font-display text-lg">Request a custom treatment</h3>
          <p className="text-xs">
            The owner will quote each custom treatment before you pay.
          </p>
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_130px_auto]">
            <Field label="Treatment name">
              <input
                className={inputClass}
                maxLength={150}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </Field>
            <Field label="Minutes">
              <input
                className={inputClass}
                type="number"
                min={5}
                max={240}
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
              />
            </Field>
            <button
              type="button"
              className={buttonClass}
              disabled={
                customTitle.trim().length < 2 ||
                !Number.isInteger(customDuration) ||
                customDuration < 5 ||
                customDuration > 240 ||
                customs.length >= 5
              }
              onClick={() => {
                setCustoms([
                  ...customs,
                  {
                    title: customTitle.trim(),
                    durationMinutes: customDuration,
                  },
                ]);
                setCustomTitle("");
              }}
            >
              <Plus size={16} aria-label="Add custom treatment" />
            </button>
          </div>
          {customs.map((c, i) => (
            <div className="flex justify-between text-sm" key={i}>
              <span>
                {c.title} · {c.durationMinutes} mins · Price to be approved
              </span>
              <button
                type="button"
                aria-label={`Remove ${c.title}`}
                onClick={() =>
                  setCustoms(customs.filter((_, index) => index !== i))
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preferred date">
            <input
              className={inputClass}
              type="date"
              required
              min={londonDate()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Preferred time">
            <input
              className={inputClass}
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>
        <p className="text-xs text-[#7A5852]">
          Preferred times are requests; the owner checks opening hours and
          appointment availability.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className={inputClass}
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              autoComplete="email"
              type="email"
              required
              maxLength={254}
              value={customer.email}
              onChange={(e) =>
                setCustomer({ ...customer, email: e.target.value })
              }
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              autoComplete="tel"
              type="tel"
              required
              minLength={7}
              maxLength={30}
              value={customer.phone}
              onChange={(e) =>
                setCustomer({ ...customer, phone: e.target.value })
              }
            />
          </Field>
          <Field label="Notes (optional)">
            <textarea
              className={inputClass}
              maxLength={2000}
              value={customer.notes}
              onChange={(e) =>
                setCustomer({ ...customer, notes: e.target.value })
              }
            />
          </Field>
        </div>
      </fieldset>
      <div className="rounded-xl bg-white p-4 text-sm">
        <p>
          Catalogue total: <strong>{money(knownTotal)}</strong>
          {customs.length || typeof unitPrice !== "number"
            ? " + treatments awaiting quotation"
            : ""}
        </p>
        <p>
          50% deposit after approval: {money(Math.round(knownTotal / 2))}
          {customs.length || typeof unitPrice !== "number"
            ? " + approved custom deposit"
            : ""}
        </p>
      </div>
      <ErrorMessage error={error} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {props.onOpenTerms && (
          <button
            type="button"
            className="text-xs underline"
            onClick={props.onOpenTerms}
          >
            Read booking terms
          </button>
        )}
        <button
          type="submit"
          className={`${buttonClass} flex items-center gap-2`}
          disabled={busy}
        >
          <Calendar size={16} />
          {busy ? "Submitting request…" : "Request appointment"}
        </button>
      </div>
    </form>
  );
}
export function BookingModal(props: BookingModalProps) {
  return props.isOpen ? (
    <Modal title="Request an appointment" onClose={props.onClose}>
      <BookingForm {...props} />
    </Modal>
  ) : null;
}
