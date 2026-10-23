import React, { useEffect, useState } from "react";
import {
  CONSULTATION_LABELS,
  healthQuestions,
  type ConsultationStatus,
  type PrivateConsultation,
} from "../../shared/consultation";
import { londonDate, type PaymentRecord } from "../../shared/payments";
import { api, ApiError } from "../data/paymentApi";
import { buttonClass, ErrorMessage, Field, inputClass } from "./PaymentUI";

export function OwnerConsultation({
  record,
  onUpdated,
  onAuthError,
}: {
  record: PaymentRecord;
  onUpdated: () => void;
  onAuthError: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [consultation, setConsultation] = useState<PrivateConsultation | null>(
    null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [dayHealth, setDayHealth] = useState(false);
  const [dayConsent, setDayConsent] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    setConsultation(null);
    setDayHealth(false);
    setDayConsent(false);
    setError("");
    if (!open) return;
    const controller = new AbortController();
    api<{ consultation: PrivateConsultation }>(
      `/owner/records/${record.id}/consultation`,
      undefined,
      { signal: controller.signal },
    )
      .then((r) => {
        if (!controller.signal.aborted) setConsultation(r.consultation);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          if (e instanceof ApiError && e.status === 401) onAuthError();
        }
      });
    return () => controller.abort();
  }, [record.id, open, reload]);
  async function save(day = false) {
    if (busy || !consultation) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(
        `/owner/records/${record.id}/consultation${day ? "/day-of-check" : ""}`,
        day
          ? {
              healthChangesReviewed: dayHealth,
              treatmentConsentObtained: dayConsent,
            }
          : {
              status: consultation.status,
              notes: consultation.notes,
              protocolChecked: !!consultation.protocolChecked,
              consultationCompleted: !!consultation.consultationCompleted,
              offlineDataConsent: !!consultation.offlineDataConsent,
            },
        { method: day ? "POST" : "PATCH" },
      );
      setMessage(
        day
          ? "Today's health check and consent recorded."
          : "Private consultation saved.",
      );
      setReload((r) => r + 1);
      onUpdated();
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError && e.status === 401) onAuthError();
    } finally {
      setBusy(false);
    }
  }
  const labels = new Map(
    healthQuestions(
      record.items.map((i) => i.id),
      record.items.some((i) => i.custom),
    ).map((q) => [q.id, q.label]),
  );
  return (
    <section className="space-y-3 rounded-xl border border-[#E8BAC0] bg-[#FAF0F2]/60 p-4">
      <p className="font-medium">
        Health consultation:{" "}
        {CONSULTATION_LABELS[record.consultationStatus ?? "awaiting_review"]}
      </p>
      <button
        type="button"
        className="text-sm underline"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setMessage("");
        }}
      >
        {open ? "Close private health review" : "Open private health review"}
      </button>
      {open && !consultation && !error && (
        <p role="status" className="text-sm">
          Loading private consultation…
        </p>
      )}
      {open && consultation && (
        <fieldset disabled={busy} className="space-y-4">
          <p className="text-xs">
            Review the exact product/device instructions, training and insurer
            requirements. Resolve flagged answers with the client; obtain
            medical advice where indicated. The questionnaire does not provide
            medical clearance. For courses, repeat the health-change check and
            obtain consent at each visit.
          </p>
          {!consultation.input && (
            <p className="text-sm font-medium">
              This older booking has no online health questionnaire. Complete
              and document a private consultation with the client before
              approval.
            </p>
          )}
          {consultation.input?.participants.map((p, index) => (
            <div key={index} className="space-y-2 rounded-xl bg-white p-3">
              <h4 className="font-medium">{p.name}</h4>
              <p className="text-sm">
                Age 18 or older:{" "}
                <strong>
                  {p.ageConfirmed === true
                    ? "Confirmed by client"
                    : "Not recorded in this questionnaire"}
                </strong>
              </p>
              {Object.entries(p.answers).map(([id, a]) => (
                <div
                  className={`rounded-lg p-2 text-sm ${a.answer === "no" ? "" : "bg-amber-50"}`}
                  key={id}
                >
                  <p>
                    {labels.get(id) ?? id}:{" "}
                    <strong>
                      {a.answer === "yes"
                        ? "Yes — discuss"
                        : a.answer === "unsure"
                          ? "Unsure — discuss"
                          : "No"}
                    </strong>
                  </p>
                  {a.details && (
                    <p className="mt-1 whitespace-pre-wrap break-words">
                      {a.details}
                    </p>
                  )}
                </div>
              ))}
              <p className="text-xs">
                Explicit health-data consent and accuracy confirmation recorded
                at submission:{" "}
                {new Date(consultation.submittedAt!).toLocaleString("en-GB")}.
              </p>
            </div>
          ))}
          <Field label="Consultation decision">
            <select
              className={inputClass}
              value={consultation.status}
              onChange={(e) =>
                setConsultation({
                  ...consultation,
                  status: e.target.value as ConsultationStatus,
                })
              }
            >
              {Object.entries(CONSULTATION_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Private consultation notes">
            <textarea
              className={inputClass}
              maxLength={4000}
              value={consultation.notes}
              onChange={(e) =>
                setConsultation({ ...consultation, notes: e.target.value })
              }
              placeholder="Record discussion, assessment, modifications or reason to defer. Keep health details here."
            />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!consultation.protocolChecked}
              onChange={(e) =>
                setConsultation({
                  ...consultation,
                  protocolChecked: e.target.checked,
                })
              }
            />
            I have checked the selected treatments against the exact
            product/device protocol, my training and insurance requirements.
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!consultation.consultationCompleted}
              onChange={(e) =>
                setConsultation({
                  ...consultation,
                  consultationCompleted: e.target.checked,
                })
              }
            />
            I have completed the client consultation and resolved relevant
            health questions for every guest.
          </label>
          {!consultation.input && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!consultation.offlineDataConsent}
                onChange={(e) =>
                  setConsultation({
                    ...consultation,
                    offlineDataConsent: e.target.checked,
                  })
                }
              />
              I have obtained and recorded each guest's explicit consent to
              processing their health information for this private consultation.
            </label>
          )}
          <button
            className={buttonClass}
            type="button"
            onClick={() => save()}
            disabled={
              busy ||
              (consultation.status === "approved" &&
                (!consultation.protocolChecked ||
                  !consultation.consultationCompleted)) ||
              (!consultation.input &&
                !!(consultation.notes || consultation.status === "approved") &&
                !consultation.offlineDataConsent)
            }
          >
            Save private consultation
          </button>
          <p className="text-xs">
            Deferring keeps the temporary request hold until expiry. To release
            it sooner, cancel the appointment in the diary. After checkout or
            payment, cancel before changing approval; refunds remain separate.
          </p>
          {consultation.reviewedAt && (
            <p className="text-xs">
              Last reviewed by {consultation.reviewedBy}:{" "}
              {new Date(consultation.reviewedAt).toLocaleString("en-GB")}.
            </p>
          )}
          <div className="space-y-3 border-t border-[#E8BAC0] pt-4">
            <h4 className="font-medium">Day-of-treatment check</h4>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={dayHealth}
                onChange={(e) => setDayHealth(e.target.checked)}
              />
              I have checked health and medication changes with every guest
              today and assessed whether treatment can proceed.
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={dayConsent}
                onChange={(e) => setDayConsent(e.target.checked)}
              />
              I have explained the treatment, risks and aftercare, and obtained
              and recorded each guest's treatment-specific consent.
            </label>
            <button
              className={buttonClass}
              type="button"
              onClick={() => save(true)}
              disabled={
                busy ||
                !dayHealth ||
                !dayConsent ||
                !record.paidPence ||
                record.date! > londonDate() ||
                !["confirmed", "completed"].includes(record.status)
              }
            >
              Record today's check & consent
            </button>
            <p className="text-xs">
              Available from the appointment date for confirmed bookings.
              Maintain the actual treatment consent document with your clinical
              records.
            </p>
            {consultation.dayOfChecks?.map((c) => (
              <p key={c.date} className="text-xs">
                {c.date}: health changes and consent checked by {c.checkedBy} at{" "}
                {new Date(c.checkedAt).toLocaleTimeString("en-GB")}.
              </p>
            ))}
          </div>
        </fieldset>
      )}
      <ErrorMessage error={error} />
      {message && (
        <p role="status" className="text-sm text-green-800">
          {message}
        </p>
      )}
    </section>
  );
}
