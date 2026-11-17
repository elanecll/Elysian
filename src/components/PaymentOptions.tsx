import React from "react";
import { CreditCard, Smartphone } from "lucide-react";

export function PaymentOptions() {
  return (
    <section
      aria-label="Payment options"
      className="rounded-xl border border-[#D6C3A3]/50 bg-[#FAF7F1] p-4 text-sm text-[#71604E]"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-semibold text-[#493A2D]">
        <span className="inline-flex items-center gap-2">
          <CreditCard size={18} aria-hidden="true" />
          Debit / credit card
        </span>
        <span className="inline-flex items-center gap-2">
          <Smartphone size={18} aria-hidden="true" />
          Apple Pay (where available)
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed">
        Choose your payment option at secure Stripe checkout. Apple Pay appears
        on compatible devices and browsers with Apple Pay set up.
      </p>
    </section>
  );
}
