import React, { useEffect, useRef, useState } from "react";
import { AvailableAppointments } from "./AvailableAppointments";
import { HealthScreening } from "./HealthScreening";
import { blankConsultation } from "../../shared/consultation";
import { Calendar, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { SPA_SERVICES } from "../data/spaData";
import {
  THREE_SESSION_OFFER,
  SIX_SESSION_OFFER,
  courseRewardOptions,
  courseReward,
} from "../../shared/courseOffers";
import {
  EXTRA_ADDONS,
  isStandaloneTreatment,
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
  const isStandalone = isStandaloneTreatment(serviceId);
  const [optionIndex, setOptionIndex] = useState(() =>
    Math.max(
      0,
      service.priceOptions?.findIndex((p) =>
        p.duration.includes(props.initialDuration || "30"),
      ) ?? 0,
    ),
  );
  const [paidSessions, setPaidSessions] = useState<1 | 3 | 6>(
    props.initialIsCourse ? 3 : 1,
  );
  const isCourse = paidSessions !== 1;
  const [rewardChoice, setRewardChoice] = useState("");
  const rewardOptions = courseRewardOptions();
  const selectedReward =
    paidSessions === 6
      ? rewardOptions.find(
          (reward) =>
            `${reward.serviceId}:${reward.optionIndex}` === rewardChoice,
        )
      : undefined;
  const courseRewardSelection = selectedReward
    ? {
        serviceId: selectedReward.serviceId,
        optionIndex: selectedReward.optionIndex,
      }
    : undefined;
  const reward = courseReward(paidSessions, courseRewardSelection);
  const [addons, setAddons] = useState<string[]>(
    initialService?.isAddon ? [initialService.id] : [],
  );
  const [customs, setCustoms] = useState<
    { title: string; durationMinutes: number }[]
  >([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customDuration, setCustomDuration] = useState(30);
  const [date, setDate] = useState(londonDate());
  const [time, setTime] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [consultation, setConsultation] = useState(blankConsultation);
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
          "cliniccare-cinderella-black-tie-facial",
          "swedish-back-massage",
          "hot-stone-back-massage",
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
  const priceItems = [
    {
      id: serviceId,
      title: service.title,
      duration: option?.duration || service.duration,
      unitPricePence:
        typeof unitPrice === "number" ? Math.round(unitPrice * 100) : null,
    },
    ...addons.flatMap((id) => {
      const addon = addonOptions.find((item) => item.id === id);
      return addon
        ? [
            {
              id: addon.id,
              title: addon.title,
              duration: addon.duration,
              unitPricePence: addon.pricePence,
            },
          ]
        : [];
    }),
    ...customs.map((custom, index) => ({
      id: `custom-${index}`,
      title: custom.title,
      duration: `${custom.durationMinutes} mins`,
      unitPricePence: null,
    })),
  ];
  const knownTotal = priceItems.reduce(
    (sum, item) => sum + (item.unitPricePence ?? 0) * paidSessions,
    0,
  );
  const hasUnquotedTreatments = priceItems.some(
    (item) => item.unitPricePence === null,
  );
  const depositPence = Math.round(knownTotal / 2);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !time) return;
    setBusy(true);
    setError("");
    const body: BookingRequest = {
      consultation,
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
      courseSessions: paidSessions === 1 ? undefined : paidSessions,
      courseRewardSelection,
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
          Your slot is temporarily reserved. The owner will review your health
          questionnaire and approve your quote before asking for a 50% deposit.
          Your appointment is confirmed after payment.
        </p>
        {submitted.receipt.courseReward && (
          <p className="rounded-xl bg-[#FAF0F2] p-3 text-sm">
            {submitted.receipt.courseSessions} paid sessions plus{" "}
            {submitted.receipt.courseReward.name}. Later course visits and your
            complimentary treatment are arranged separately with the owner.
          </p>
        )}
        {submitted.receipt.holdUntil && (
          <p className="text-sm">
            Awaiting approval until{" "}
            {new Date(submitted.receipt.holdUntil).toLocaleString("en-GB", {
              timeZone: "Europe/London",
            })}{" "}
            (UK time). If it expires, please request an available time again.
          </p>
        )}
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
        Choose an available appointment. No payment is taken today. After
        reviewing your health questionnaire and approving your request, the
        owner will send a Stripe checkout link for your 50% deposit.
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
                if (isStandaloneTreatment(e.target.value)) setCustoms([]);
              }}
            >
              {SPA_SERVICES.filter((s) => !s.isAddon).map((s) => (
                <option value={s.id} key={s.id}>
                  {s.title}
                  {isStandaloneTreatment(s.id) ? " — Standalone treatment" : ""}
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
        <p className="rounded-xl bg-[#FAF0F2] p-3 text-sm">
          Chemical peeling and carboxytherapy are standalone treatments. Please
          request each separately, without additional treatments or add-ons.
        </p>
        <fieldset className="space-y-2">
          <legend className="mb-2 font-semibold">Course offers</legend>
          {(
            [
              { sessions: 1, label: "Single session" },
              { sessions: 3, label: THREE_SESSION_OFFER },
              { sessions: 6, label: SIX_SESSION_OFFER },
            ] as const
          ).map((offer) => (
            <label
              key={offer.sessions}
              className="flex items-start gap-3 rounded-xl border border-[#E8BAC0]/50 p-3 text-sm"
            >
              <input
                type="radio"
                name="course-offer"
                className="mt-1"
                checked={paidSessions === offer.sessions}
                onChange={() => {
                  setPaidSessions(offer.sessions);
                  setRewardChoice("");
                }}
              />
              <span>{offer.label}</span>
            </label>
          ))}
          {paidSessions === 6 && (
            <Field label="Choose your free £60 treatment">
              <select
                className={inputClass}
                value={rewardChoice}
                onChange={(event) => setRewardChoice(event.target.value)}
              >
                <option value="">Choose later with the owner</option>
                {rewardOptions.map((choice) => (
                  <option
                    key={`${choice.serviceId}:${choice.optionIndex}`}
                    value={`${choice.serviceId}:${choice.optionIndex}`}
                  >
                    {choice.title} — {choice.duration}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {isCourse && (
            <p className="text-xs text-[#7A5852]">
              Pay for {paidSessions} sessions of each selected treatment and
              add-on. Your complimentary treatment is a separate visit arranged
              with the owner.
            </p>
          )}
        </fieldset>
        {!isStandalone && (
          <>
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
              <h3 className="font-display text-lg">
                Request a custom treatment
              </h3>
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
          </>
        )}
        <AvailableAppointments
          selection={{
            treatments: [
              { serviceId, optionIndex },
              ...addons
                .filter((id) => id !== serviceId)
                .map((id) => ({ serviceId: id, optionIndex: 0 })),
            ],
            customTreatments: customs,
            isCourse,
            courseSessions: paidSessions === 1 ? undefined : paidSessions,
            courseRewardSelection,
          }}
          date={date}
          time={time}
          onDate={setDate}
          onTime={setTime}
        />
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
          <Field label="Booking notes (optional — no health information)">
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
        <HealthScreening
          serviceIds={[serviceId, ...addons]}
          custom={customs.length > 0}
          value={consultation}
          onChange={setConsultation}
        />
      </fieldset>
      <section
        aria-labelledby="booking-price-breakdown"
        className="rounded-xl border border-[#E8BAC0]/50 bg-white p-4 sm:p-5 text-sm"
      >
        <h3
          id="booking-price-breakdown"
          className="font-display text-xl text-[#3D2B27] mb-3"
        >
          Price breakdown
        </h3>
        {isCourse && (
          <p className="rounded-lg bg-[#FAF0F2] p-3 mb-4 text-[#5C4A45] leading-relaxed">
            {paidSessions === 3 ? THREE_SESSION_OFFER : SIX_SESSION_OFFER}. Pay
            for {paidSessions} sessions of each selected treatment, including
            add-ons. {reward?.name} is included at no extra charge and arranged
            as a separate visit with the owner.
          </p>
        )}
        <ul
          className="divide-y divide-[#E8BAC0]/30"
          aria-label="Selected treatments and prices"
        >
          {priceItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap justify-between items-start gap-x-4 gap-y-2 py-3 first:pt-0"
            >
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-semibold text-[#3D2B27] break-words">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-[#7A5852]">
                  {item.duration} per session
                </p>
                <p className="mt-1 text-[#5C4A45]">
                  {item.unitPricePence === null
                    ? "Price awaiting owner quotation"
                    : `${money(item.unitPricePence)} × ${paidSessions} paid ${paidSessions === 1 ? "session" : "sessions"}`}
                </p>
              </div>
              <strong className="shrink-0 text-[#3D2B27]">
                {item.unitPricePence === null
                  ? "To be quoted"
                  : money(item.unitPricePence * paidSessions)}
              </strong>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-[#E8BAC0]/50 pt-4 mt-1 text-[#3D2B27]">
          <div className="flex justify-between gap-4 font-semibold">
            <dt>
              {hasUnquotedTreatments
                ? "Priced treatments subtotal"
                : "Catalogue total"}
            </dt>
            <dd>{money(knownTotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>
              {hasUnquotedTreatments
                ? "Estimated 50% deposit on priced treatments"
                : "50% deposit after approval"}
            </dt>
            <dd className="shrink-0">{money(depositPence)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>
              {hasUnquotedTreatments
                ? "Remaining balance on priced treatments"
                : "Remaining balance after deposit"}
            </dt>
            <dd className="shrink-0">{money(knownTotal - depositPence)}</dd>
          </div>
        </dl>
        {hasUnquotedTreatments && (
          <p className="mt-3 text-xs text-[#7A5852] leading-relaxed">
            Treatments awaiting quotation are excluded from these amounts. The
            owner will confirm your final total, deposit and remaining balance
            before payment.
          </p>
        )}
        <p className="mt-2 text-xs text-[#7A5852]">
          Once your treatment booking is confirmed, the 50% deposit is
          non-refundable, subject to your statutory cancellation and refund
          rights.
        </p>
      </section>
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
          disabled={busy || !time}
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
