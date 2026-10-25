import React, { useEffect, useRef, useState } from "react";
import { AvailableAppointments } from "./AvailableAppointments";
import { HealthScreening } from "./HealthScreening";
import { blankConsultation } from "../../shared/consultation";
import { Calendar, CheckCircle2 } from "lucide-react";
import { SPA_SERVICES } from "../data/spaData";
import { SPA_PRODUCTS } from "../data/shopData";
import { FACIAL_BUNDLE_ID } from "../../shared/facialBundle";
import { FRIEND_PACKAGE_ID } from "../../shared/friendPackage";
import {
  PrimaryTreatmentOptions,
  TreatmentDurationOptions,
} from "./TreatmentSelectOptions";
import { bookingTotals, itemTotal } from "../../shared/bookingPricing";
import { FacialBundleProducts } from "./FacialBundleProducts";
import {
  FIVE_SESSION_OFFER,
  TEN_SESSION_OFFER,
} from "../../shared/courseOffers";
import {
  isStandaloneTreatment,
  londonDate,
  money,
  courseOfferDescription,
  type BookingRequest,
  type Receipt,
  type RecordItem,
  type BundleProductSelection,
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
  const defaultService = SPA_SERVICES.find((s) => !s.isAddon && !s.comingSoon)!;
  const initialService = SPA_SERVICES.find(
    (s) => s.id === props.preselectedServiceId,
  );
  const [serviceId, setServiceId] = useState(
    initialService && !initialService.isAddon && !initialService.comingSoon
      ? initialService.id
      : defaultService.id,
  );
  const service =
    SPA_SERVICES.find((s) => s.id === serviceId) || defaultService;
  const [optionIndex, setOptionIndex] = useState(() => {
    if ([FACIAL_BUNDLE_ID, FRIEND_PACKAGE_ID].includes(service.id)) return -1;
    const preferred =
      service.priceOptions?.findIndex(
        (p) =>
          !p.comingSoon && p.duration.includes(props.initialDuration || "30"),
      ) ?? -1;
    return preferred >= 0
      ? preferred
      : Math.max(0, service.priceOptions?.findIndex((p) => !p.comingSoon) ?? 0);
  });
  const [paidSessions, setPaidSessions] = useState<1 | 5 | 10>(
    props.initialIsCourse ? 5 : 1,
  );
  const isCourse = paidSessions !== 1;
  const [addons, setAddons] = useState<string[]>(
    initialService?.isAddon && !initialService.comingSoon
      ? [initialService.id]
      : [],
  );
  const [bundleProducts, setBundleProducts] = useState<
    BundleProductSelection[]
  >([]);
  const isBundle = serviceId === FACIAL_BUNDLE_ID;
  const isFriend = serviceId === FRIEND_PACKAGE_ID;
  const option = service.priceOptions?.[optionIndex];
  const selectedTreatmentId =
    option?.facialServiceId ?? option?.pairedServiceId;
  const selectedTreatment = selectedTreatmentId
    ? SPA_SERVICES.find((treatment) => treatment.id === selectedTreatmentId)
    : undefined;
  const isStandalone = isStandaloneTreatment(
    selectedTreatment?.id ?? serviceId,
  );
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
  const addonOptions = SPA_SERVICES.filter(
    (s) =>
      !s.comingSoon &&
      (s.isAddon ||
        s.canBeAddon ||
        [
          "cliniccare-cinderella-black-tie-facial",
          "swedish-back-massage",
          "hot-stone-back-massage",
        ].includes(s.id)),
  )
    .map((s) => ({
      id: s.id,
      title: s.title,
      duration: s.duration,
      pricePence: Math.round(
        Number(
          s.priceOptions?.[0].priceClinicare ?? s.priceOptions?.[0].priceSingle,
        ) * 100,
      ),
    }))
    .filter((a) => a.id !== serviceId && a.id !== selectedTreatment?.id);
  const unitPrice = option?.priceClinicare ?? option?.priceSingle;
  const priceItems: RecordItem[] = [
    {
      id: serviceId,
      name: selectedTreatment
        ? `${service.title} — ${selectedTreatment.title}`
        : service.title,
      quantity: paidSessions,
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
              name: addon.title,
              quantity: paidSessions,
              duration: addon.duration,
              unitPricePence: addon.pricePence,
            },
          ]
        : [];
    }),
    ...(isBundle
      ? bundleProducts.flatMap((selection) => {
          const product = SPA_PRODUCTS.find(
            (product) => product.id === selection.productId,
          );
          return product
            ? [
                {
                  id: product.id,
                  name: product.name,
                  kind: "product" as const,
                  quantity: selection.quantity,
                  unitPricePence: Math.round(product.numericPrice * 100),
                },
              ]
            : [];
        })
      : []),
  ];
  const totals = bookingTotals(priceItems, paidSessions);
  const knownTotal = totals.totalPence;
  const hasUnquotedTreatments = priceItems.some(
    (item) => item.unitPricePence === null,
  );
  const depositPence = totals.amountDuePence;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !time || !option) return;
    if (isBundle && !bundleProducts.length) {
      setError("Choose at least one skincare product for your bundle.");
      return;
    }
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
      customTreatments: [],
      date,
      time,
      isCourse,
      courseSessions: paidSessions === 1 ? undefined : paidSessions,
      ...(isBundle ? { bundleProducts } : {}),
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
          questionnaire and approve your quote before asking for your facial
          deposit{isBundle ? " and discounted product payment" : ""}. Your
          appointment is confirmed after payment.
        </p>
        {submitted.receipt.isCourse && (
          <p className="rounded-xl bg-[#FAF0F2] p-3 text-sm">
            {courseOfferDescription(submitted.receipt)}. Later course visits are
            arranged separately with the owner.
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
        owner will send a Stripe checkout link for your 50%{" "}
        {isBundle
          ? "facial deposit plus the full discounted product price"
          : "deposit"}
        .
      </p>
      <fieldset disabled={busy} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary treatment">
            <select
              className={inputClass}
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setOptionIndex(
                  [FACIAL_BUNDLE_ID, FRIEND_PACKAGE_ID].includes(e.target.value)
                    ? -1
                    : Math.max(
                        0,
                        SPA_SERVICES.find(
                          (s) => s.id === e.target.value,
                        )?.priceOptions?.findIndex((p) => !p.comingSoon) ?? 0,
                      ),
                );
                setTime("");
                setAddons([]);
                setBundleProducts([]);
              }}
            >
              <PrimaryTreatmentOptions />
            </select>
          </Field>
          <Field
            label={
              isBundle
                ? "Choose your facial treatment"
                : isFriend
                  ? "Choose a treatment for both guests"
                  : "Duration"
            }
          >
            <select
              aria-label={
                isBundle
                  ? "Choose your facial treatment"
                  : isFriend
                    ? "Choose a treatment for both guests"
                    : "Duration"
              }
              className={inputClass}
              required
              value={optionIndex < 0 ? "" : optionIndex}
              onChange={(e) => {
                setOptionIndex(Number(e.target.value));
                setTime("");
                setAddons([]);
              }}
            >
              <TreatmentDurationOptions service={service} />
            </select>
          </Field>
        </div>
        {isFriend && (
          <p className="rounded-xl bg-[#FAF0F2] p-3 text-sm">
            Choose the treatment both guests would like. Each price is the total
            for two people, with 10% off already included. Treatments take place
            one after the other.
          </p>
        )}
        {isBundle && (
          <p className="rounded-xl bg-[#FAF0F2] p-3 text-sm">
            First choose your facial treatment above, then choose your skincare
            products below. The facial keeps its normal price; your selected
            products receive 10% off.
          </p>
        )}
        {isBundle && option && (
          <FacialBundleProducts
            value={bundleProducts}
            onChange={setBundleProducts}
          />
        )}
        {isStandalone && (
          <p className="rounded-xl bg-[#FAF0F2] p-3 text-sm">
            Chemical peeling and carboxytherapy are standalone treatments.
            Please request each separately, without additional treatments or
            add-ons.
          </p>
        )}
        <fieldset className="space-y-2">
          <legend className="mb-2 font-semibold">Course offers</legend>
          {(
            [
              { sessions: 1, label: "Single session" },
              { sessions: 5, label: FIVE_SESSION_OFFER },
              { sessions: 10, label: TEN_SESSION_OFFER },
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
                }}
              />
              <span>{offer.label}</span>
            </label>
          ))}
          {isCourse && (
            <p className="text-xs text-[#7A5852]">
              Your course discount is included in the total. Later visits are
              arranged separately with the owner.
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
          </>
        )}
        {option ? (
          <AvailableAppointments
            selection={{
              treatments: [
                { serviceId, optionIndex },
                ...addons
                  .filter((id) => id !== serviceId)
                  .map((id) => ({ serviceId: id, optionIndex: 0 })),
              ],
              customTreatments: [],
              isCourse,
              courseSessions: paidSessions === 1 ? undefined : paidSessions,
              ...(isBundle ? { bundleProducts } : {}),
            }}
            date={date}
            time={time}
            onDate={setDate}
            onTime={setTime}
          />
        ) : (
          <p className="text-sm text-[#7A5852]">
            Choose a treatment above to see available appointment dates and
            times.
          </p>
        )}
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
          serviceIds={[
            serviceId,
            ...(selectedTreatmentId ? [selectedTreatmentId] : []),
            ...addons,
          ]}
          value={consultation}
          onChange={setConsultation}
        />
      </fieldset>
      {option && (
        <section
          aria-labelledby="booking-price-breakdown"
          className="rounded-xl border border-[#E8BAC0]/50 bg-white p-4 sm:p-5 text-sm"
        >
          <h3
            id="booking-price-breakdown"
            className="font-display text-xl text-[#3D2B27] mb-3"
          >
            Booking summary
          </h3>
          {isCourse && (
            <p className="rounded-lg bg-[#FAF0F2] p-3 mb-4 text-[#5C4A45] leading-relaxed">
              {paidSessions === 5 ? FIVE_SESSION_OFFER : TEN_SESSION_OFFER}.
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
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-[#7A5852]">
                    {item.kind === "product"
                      ? `${item.quantity} × product · 10% off`
                      : `${item.duration} per session`}
                  </p>
                  {item.unitPricePence === null && (
                    <p className="mt-1 text-[#5C4A45]">
                      Price awaiting owner quotation
                    </p>
                  )}
                </div>
                {(!isCourse || item.kind === "product") &&
                  item.unitPricePence !== null && (
                    <strong className="shrink-0 text-[#3D2B27]">
                      {money(itemTotal(item))}
                    </strong>
                  )}
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-[#E8BAC0]/50 pt-4 mt-1 text-[#3D2B27]">
            {totals.bundlePricing && (
              <>
                <div className="flex justify-between gap-4">
                  <dt>Facial and treatments</dt>
                  <dd>{money(totals.bundlePricing.treatmentTotalPence)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Skincare products after 10% off</dt>
                  <dd>{money(totals.bundlePricing.productsTotalPence)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Product saving</dt>
                  <dd>{money(totals.bundlePricing.productsDiscountPence)}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between gap-4 font-semibold">
              <dt>
                {hasUnquotedTreatments
                  ? "Priced treatments subtotal"
                  : isCourse
                    ? "Course total"
                    : "Total"}
              </dt>
              <dd>{money(knownTotal)}</dd>
            </div>
            {totals.bundlePricing && (
              <>
                <div className="flex justify-between gap-4">
                  <dt>Facial deposit (50%)</dt>
                  <dd>{money(totals.bundlePricing.treatmentDepositPence)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Products paid now in full (after 10% off)</dt>
                  <dd>{money(totals.bundlePricing.productsTotalPence)}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between gap-4">
              <dt>
                {isBundle
                  ? "Total due after approval"
                  : hasUnquotedTreatments
                    ? "Estimated 50% deposit on priced treatments"
                    : "50% deposit after approval"}
              </dt>
              <dd className="shrink-0">{money(depositPence)}</dd>
            </div>
          </dl>
          {totals.bundlePricing && (
            <p className="mt-3 text-sm">
              Remaining treatment balance at your appointment:{" "}
              {money(knownTotal - depositPence)}. Products are paid in full and
              collected at the spa.
            </p>
          )}
          {hasUnquotedTreatments && (
            <p className="mt-3 text-xs text-[#7A5852] leading-relaxed">
              Treatments awaiting quotation are excluded from these amounts. The
              owner will confirm your final total, deposit and remaining balance
              before payment.
            </p>
          )}
          <p className="mt-2 text-xs text-[#7A5852]">
            Once your treatment booking is confirmed, the 50% treatment deposit
            is non-refundable, subject to your statutory cancellation and refund
            rights.
          </p>
        </section>
      )}
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
          disabled={
            busy || !option || !time || (isBundle && !bundleProducts.length)
          }
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
