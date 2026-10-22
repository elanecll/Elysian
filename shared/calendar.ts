export const BREAK_MINUTES = 30;
export const HOLD_HOURS = 24;
export const BOOKING_DAYS = 90;
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export interface OpeningDay {
  day: number;
  enabled: boolean;
  open: string;
  close: string;
}
export const DEFAULT_HOURS: OpeningDay[] = DAY_NAMES.map((_, day) => ({
  day,
  enabled: day !== 1,
  open: "09:00",
  close: [5, 6].includes(day) ? "14:00" : "20:00",
}));
export interface DiaryEntry {
  id: string;
  recordId?: string;
  date: string;
  time: string;
  durationMinutes: number;
  breakMinutes: number;
  endTime: string;
  availableAfter: string;
  kind: "request" | "payment" | "confirmed" | "manual" | "block";
  title: string;
  customerName: string;
  phone: string;
  notes: string;
  holdUntil?: number;
  cancelled: boolean;
}
export interface Availability {
  date: string;
  slots: string[];
  durationMinutes: number;
  breakMinutes: number;
  closed: boolean;
}
export interface DiaryFeed {
  entries: DiaryEntry[];
  hours: OpeningDay[];
}
export const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const clockTime = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
export const shiftDate = (date: string, days: number) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
