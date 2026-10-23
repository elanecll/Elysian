export const CONSULTATION_VERSION = "2026-10-v2";
export type HealthAnswer = "yes" | "no" | "unsure";
export type ConsultationStatus =
  "awaiting_review" | "information_needed" | "approved" | "deferred";
export const CONSULTATION_LABELS: Record<ConsultationStatus, string> = {
  awaiting_review: "Awaiting health review",
  information_needed: "Further information needed",
  approved: "Approved following consultation",
  deferred: "Deferred / unsuitable for selected treatment",
};
export interface HealthQuestion {
  id: string;
  label: string;
}
const general: HealthQuestion[] = [
  {
    id: "allergies",
    label:
      "Do you have allergies or have you reacted to skincare products, oils or previous treatments?",
  },
  {
    id: "medication",
    label:
      "Are you taking medication, supplements or using prescription skincare?",
  },
  {
    id: "medical",
    label:
      "Do you have a medical condition or ongoing medical treatment that may affect this appointment?",
  },
  {
    id: "pregnancy",
    label: "Are you pregnant, possibly pregnant or breastfeeding?",
  },
  {
    id: "skin",
    label:
      "Do you currently have irritated or broken skin, wounds, an infection or a skin condition in the treatment area?",
  },
  {
    id: "recent",
    label:
      "Have you had recent surgery, cosmetic procedures, an injury or a reaction to a treatment?",
  },
];
const skin: HealthQuestion[] = [
  {
    id: "isotretinoin",
    label:
      "Do you take, or have you previously taken, isotretinoin (such as Roaccutane)?",
  },
  { id: "cold_sores", label: "Have you ever had cold sores?" },
  {
    id: "scarring",
    label:
      "Does your skin scar easily, or have you had unusual pigmentation after a skin treatment?",
  },
];
const device: HealthQuestion[] = [
  {
    id: "implants",
    label:
      "Do you have a pacemaker, another implanted electronic device or an implant in the treatment area?",
  },
  {
    id: "light",
    label:
      "Do you have sensitivity to light, a seizure condition or medication that increases light sensitivity?",
  },
  {
    id: "sensation",
    label:
      "Do you have reduced skin sensation or difficulty sensing heat or cold?",
  },
];
const massage: HealthQuestion[] = [
  {
    id: "circulation",
    label:
      "Do you have a history of blood clots, a circulation condition or unexplained swelling?",
  },
  {
    id: "movement",
    label:
      "Do you have pain, an injury, a bone or joint condition, or an area that should not be massaged?",
  },
  {
    id: "sensation",
    label:
      "Do you have reduced skin sensation or difficulty sensing heat or cold?",
  },
];
// These are disclosure prompts, not a clinical contraindication algorithm.
// Packages/custom treatments need broader disclosure and an individual consultation.
export function healthQuestions(
  ids: string[],
  custom = false,
): HealthQuestion[] {
  const broad = custom || ids.some((id) => id.endsWith("-package"));
  const isMassage = ids.some((id) => id.includes("massage"));
  const isSkin = ids.some(
    (id) => !id.includes("massage") && !id.includes("head-massage"),
  );
  const isDevice = ids.some((id) =>
    [
      "hydrodemabrasion-facial",
      "radio-frequency-facial",
      "ultrasonic-facial",
      "microdermabrasion",
      "elysian-glow-8-in-1-pdt-led-light-therapy",
      "elysian-personalise-facial-treatment",
      "high-frequency-facial-treatment",
      "addon-high-frequency",
    ].includes(id),
  );
  return [
    ...new Map(
      [
        ...general,
        ...(isSkin || broad ? skin : []),
        ...(isDevice || broad ? device : []),
        ...(isMassage || broad ? massage : []),
      ].map((q) => [q.id, q]),
    ).values(),
  ];
}
export function guestCount(ids: string[]) {
  return ids.includes("bring-a-friend-package") ? 2 : 1;
}
export interface HealthParticipant {
  name: string;
  answers: Record<string, { answer: HealthAnswer | ""; details: string }>;
  ageConfirmed: boolean;
  dataConsent: boolean;
  accuracyConfirmed: boolean;
}
export interface ConsultationInput {
  version: string;
  participants: HealthParticipant[];
}
export interface PrivateConsultation {
  input?: ConsultationInput;
  submittedAt?: string;
  status: ConsultationStatus;
  notes: string;
  reviewedAt?: string;
  reviewedBy?: string;
  protocolChecked?: boolean;
  consultationCompleted?: boolean;
  offlineDataConsent?: boolean;
  dayOfChecks?: {
    date: string;
    checkedAt: string;
    checkedBy: string;
    healthChangesReviewed: true;
    treatmentConsentObtained: true;
  }[];
}
export const blankParticipant = (): HealthParticipant => ({
  name: "",
  answers: {},
  ageConfirmed: false,
  dataConsent: false,
  accuracyConfirmed: false,
});
export const blankConsultation = (): ConsultationInput => ({
  version: CONSULTATION_VERSION,
  participants: [blankParticipant()],
});
export const HEALTH_PRIVACY_TEXT =
  "Elysian (Elaine Chong) uses the health information you choose to provide to assess treatment suitability and keep a private consultation record. Access is restricted to the authorised owner; it is not included in payment receipts, Stripe, public reviews or routine CSV exports. You may request access, correction or withdrawal of consent by calling 07707 328060. Withdrawal may mean we cannot assess or provide a treatment. Records needed for legal or insurance purposes may still need to be retained where a lawful basis applies. If you prefer not to submit health details online, contact us for a private consultation before requesting treatment.";
