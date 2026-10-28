import { londonDate } from "./payments.js";

export const WEEKLY_SPECIAL = {
  id: "clinicare-first-time-glow-facial-special",
  title: "This Week's Special - Clinicare First-Time Glow Facial",
  shortTitle: "Clinicare First-Time Glow Facial",
  startsOn: "2026-11-01",
  endsOn: "2026-11-08",
  datesLabel: "1–8 November 2026",
  duration: "40-50 mins",
  pricePence: 5000,
  usualPricePence: 7000,
  image: "/images/treatments/clinicare-first-time-glow-special.png",
} as const;

export const isWeeklySpecial = (id: string) => id === WEEKLY_SPECIAL.id;
// Clients can reserve a November appointment in advance; expired offers disappear.
export const weeklySpecialVisible = (today = londonDate()) =>
  today <= WEEKLY_SPECIAL.endsOn;
export const weeklySpecialDateAllowed = (date: string, today = londonDate()) =>
  weeklySpecialVisible(today) &&
  date >= WEEKLY_SPECIAL.startsOn &&
  date <= WEEKLY_SPECIAL.endsOn;
