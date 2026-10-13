import React, { useEffect } from "react";
import {
  blankParticipant,
  CONSULTATION_VERSION,
  guestCount,
  healthQuestions,
  HEALTH_PRIVACY_TEXT,
  type ConsultationInput,
  type HealthAnswer,
} from "../../shared/consultation";
import { Field, inputClass } from "./PaymentUI";

export function HealthScreening({
  serviceIds,
  custom = false,
  value,
  onChange,
}: {
  serviceIds: string[];
  custom?: boolean;
  value: ConsultationInput;
  onChange: (value: ConsultationInput) => void;
}) {
  const signature = JSON.stringify([serviceIds, custom]);
  const questions = healthQuestions(serviceIds, custom);
  const count = guestCount(serviceIds);
  useEffect(() => {
    onChange({
      version: CONSULTATION_VERSION,
      participants: Array.from({ length: count }, (_, i) => {
        const p = value.participants[i] ?? blankParticipant();
        return {
          ...p,
          accuracyConfirmed: false,
          dataConsent: false,
          answers: Object.fromEntries(
            questions.map((q) => [
              q.id,
              p.answers[q.id] ?? { answer: "", details: "" },
            ]),
          ),
        };
      }),
    });
  }, [signature]);
  const update = (
    i: number,
    patch: Partial<ConsultationInput["participants"][number]>,
  ) =>
    onChange({
      ...value,
      participants: value.participants.map((p, index) =>
        index === i ? { ...p, ...patch } : p,
      ),
    });
  return (
    <section
      className="space-y-4 rounded-2xl border border-[#E8BAC0] bg-white p-4 sm:p-5"
      aria-label="Pre-treatment health screening"
    >
      <h3 className="font-display text-xl">
        Pre-treatment consultation & health screening
      </h3>
      <p className="text-sm">
        Please complete these confidential questions before requesting your
        appointment. Your therapist will review suitability with you before a
        deposit link is issued. Yes or Unsure answers need discussion; they do
        not automatically exclude you.
      </p>
      <p className="text-xs text-[#7A5852]">
        This questionnaire supports a consultation. Tell us if your health or
        medication changes before each visit. Do not stop prescribed medication
        to receive a treatment.
      </p>
      <details className="rounded-xl bg-[#FAF0F2] p-3 text-sm">
        <summary className="cursor-pointer font-medium">
          How we use your health information
        </summary>
        <p className="mt-2 leading-relaxed">
          {HEALTH_PRIVACY_TEXT} We keep information only for as long as
          necessary for consultation and applicable legal or insurance
          requirements; contact us for retention information.
        </p>
      </details>
      {count === 2 && (
        <p className="text-sm font-medium">
          Each guest must complete and consent to their own section.
        </p>
      )}
      {Array.from({ length: count }, (_, index) => {
        const p = value.participants[index] ?? blankParticipant();
        return (
          <fieldset
            key={index}
            className="space-y-4 border-t border-[#E8BAC0]/40 pt-4"
          >
            <legend className="font-medium">
              {count === 2
                ? `Guest ${index + 1} health questionnaire`
                : "Your health questionnaire"}
            </legend>
            <Field
              label={
                count === 2
                  ? `Guest ${index + 1} full name for health consent`
                  : "Full name for health consent"
              }
            >
              <input
                className={inputClass}
                required
                minLength={2}
                maxLength={120}
                autoComplete="off"
                value={p.name}
                onChange={(e) => update(index, { name: e.target.value })}
              />
            </Field>
            {questions.map((q) => {
              const a = p.answers[q.id] ?? { answer: "" as const, details: "" };
              return (
                <div key={q.id} className="space-y-2">
                  <Field
                    label={`${count === 2 ? `Guest ${index + 1}: ` : ""}${q.label}`}
                  >
                    <select
                      className={inputClass}
                      required
                      value={a.answer}
                      onChange={(e) =>
                        update(index, {
                          answers: {
                            ...p.answers,
                            [q.id]: {
                              answer: e.target.value as HealthAnswer,
                              details: e.target.value === "no" ? "" : a.details,
                            },
                          },
                        })
                      }
                    >
                      <option value="">Please select</option>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                      <option value="unsure">Unsure</option>
                    </select>
                  </Field>
                  {a.answer && a.answer !== "no" && (
                    <Field
                      label={`Private details — ${q.id.replaceAll("_", " ")}${count === 2 ? ` (guest ${index + 1})` : ""}`}
                    >
                      <textarea
                        className={inputClass}
                        required
                        minLength={2}
                        maxLength={1000}
                        autoComplete="off"
                        value={a.details}
                        placeholder="Please give relevant details, or explain what you are unsure about."
                        onChange={(e) =>
                          update(index, {
                            answers: {
                              ...p.answers,
                              [q.id]: { ...a, details: e.target.value },
                            },
                          })
                        }
                      />
                    </Field>
                  )}
                </div>
              );
            })}
            <label className="flex items-start gap-3 text-sm">
              <input
                className="mt-1 shrink-0"
                type="checkbox"
                required
                checked={p.dataConsent}
                onChange={(e) =>
                  update(index, { dataConsent: e.target.checked })
                }
              />
              I explicitly consent to Elysian collecting and using my health
              information for treatment suitability assessment and a private
              consultation record, as explained above.
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                className="mt-1 shrink-0"
                type="checkbox"
                required
                checked={p.accuracyConfirmed}
                onChange={(e) =>
                  update(index, { accuracyConfirmed: e.target.checked })
                }
              />
              These answers are accurate to the best of my knowledge. I will
              report changes before treatment. Treatment consent will be
              discussed separately.
            </label>
          </fieldset>
        );
      })}
      <p className="text-xs">
        Prefer to discuss this privately first?{" "}
        <a className="underline" href="tel:+447707328060">
          Call Elaine on 07707 328060
        </a>
        . Please keep health details out of general booking notes.
      </p>
    </section>
  );
}
