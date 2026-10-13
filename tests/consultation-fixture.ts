import {
  CONSULTATION_VERSION,
  guestCount,
  healthQuestions,
  type ConsultationInput,
} from "../shared/consultation";
export function testConsultation(
  ids = ["hydrodemabrasion-facial"],
  custom = false,
): ConsultationInput {
  return {
    version: CONSULTATION_VERSION,
    participants: Array.from({ length: guestCount(ids) }, (_, i) => ({
      name: `Fixture Guest ${i + 1}`,
      dataConsent: true,
      accuracyConfirmed: true,
      answers: Object.fromEntries(
        healthQuestions(ids, custom).map((q) => [
          q.id,
          { answer: "no", details: "" },
        ]),
      ),
    })),
  };
}
