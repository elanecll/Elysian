import React from "react";
import { CreditCard, Smartphone } from "lucide-react";

export function PaymentOptions() {
  return (
    <section
      aria-label="Payment options"
      className="rounded-xl border border-[#E8BAC0]/50 bg-[#FFF9F9] p-4 text-sm text-[#5C4A45]"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-semibold text-[#3D2B27]">
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
