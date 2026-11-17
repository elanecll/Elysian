import React from "react";
import { ArrowRight, CalendarDays, Clock3, Sparkles } from "lucide-react";
import {
  WEEKLY_SPECIAL,
  weeklySpecialVisible,
} from "../../shared/weeklyPromotion";
import { money } from "../../shared/payments";
import { useLondonDate } from "../data/useLondonDate";

export function WeeklySpecial({ onBook }: { onBook: (id: string) => void }) {
  const today = useLondonDate();
  if (!weeklySpecialVisible(today)) return null;
  return (
    <section
      id="weekly-special"
      aria-labelledby="weekly-special-title"
      className="bg-[#FAF7F1] px-4 py-12 sm:px-6 lg:px-12 lg:py-20"
    >
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-3xl border border-[#D6C3A3]/50 bg-white shadow-sm lg:grid-cols-2">
        <div className="flex items-center bg-[#F4EFE5]">
          <img
            src={WEEKLY_SPECIAL.image}
            alt="Elysian First-Time Glow Facial promotion: £50, usually £70, 1–8 November"
            className="h-auto w-full object-contain"
            loading="lazy"
            width="1169"
            height="819"
          />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#70502E]">
            <Sparkles size={16} aria-hidden="true" />
            This Week’s Special
          </p>
          <h2
            id="weekly-special-title"
            className="font-display text-3xl text-[#493A2D] sm:text-4xl"
          >
            {WEEKLY_SPECIAL.shortTitle}
          </h2>
          <p className="mt-5 leading-relaxed text-[#71604E]">
            Your first visit, with a little extra glow. Enjoy a complete facial
            experience using Clinicare professional skincare, tailored following
            a consultation to leave your skin feeling refreshed and cared for.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#71604E]">
            <span className="flex items-center gap-2">
              <Clock3 size={17} aria-hidden="true" />
              40–50 minutes
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays size={17} aria-hidden="true" />
              {WEEKLY_SPECIAL.datesLabel}
            </span>
          </div>
          <div className="mt-7 flex flex-wrap items-baseline gap-3">
            <strong className="font-display text-4xl text-[#70502E]">
              £50
            </strong>
            <span className="text-[#7C674D]">
              Usually <s>£70</s>
            </span>
            <span className="rounded-full bg-[#F4EFE5] px-3 py-1 text-sm font-semibold text-[#70502E]">
              Save £20
            </span>
          </div>
          <p className="mt-4 text-sm text-[#71604E]">
            First-time clients only · One promotional visit per client · Cannot
            be combined with other offers.
          </p>
          <p className="mt-3 text-sm text-[#71604E]">
            For appointments on 1–8 November, subject to availability and
            consultation. {money(WEEKLY_SPECIAL.pricePence / 2)} deposit after
            approval; {money(WEEKLY_SPECIAL.pricePence / 2)} remaining.
          </p>
          <button
            onClick={() => onBook(WEEKLY_SPECIAL.id)}
            className="mt-7 flex w-fit items-center gap-3 rounded-full bg-[#70502E] px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-[#5D4024] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#70502E]"
          >
            Book this offer
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
