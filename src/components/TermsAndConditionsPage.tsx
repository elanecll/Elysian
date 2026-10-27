import React from 'react';
import { PageBanner } from './PageBanner';
import { SpaHeartDivider } from './SpaIcons';
import { 
  ShieldCheck, 
  CreditCard, 
  Clock, 
  HelpCircle, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  Calendar,
  Sparkles,
  Printer
} from 'lucide-react';
import { PageTab } from '../types';
import { infoCardClass, infoInsetClass, infoButtonClass } from './infoStyles';

interface TermsAndConditionsPageProps {
  onNavigate: (page: PageTab) => void;
  onOpenBooking: () => void;
  embedded?: boolean;
}

export const TermsAndConditionsPage: React.FC<TermsAndConditionsPageProps> = ({
  onNavigate,
  onOpenBooking,
  embedded = false,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`bg-[#FFF9F9] pb-20 ${embedded ? '' : 'min-h-screen'}`}>
      {/* Top Banner with Breadcrumb */}
      {!embedded && <PageBanner
        currentPageName="Terms & Conditions"
        title="Terms & Conditions & Booking Policy"
        subtitle="Transparent, fair consumer policies for our sanctuary treatments, 50% deposit guidelines, and guest care standards."
        tagline="SANCTUARY POLICIES & GUEST RIGHTS"
        onNavigateHome={() => onNavigate('home')}
      />}

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 ${embedded ? '' : 'mt-10'}`}>
        
        {/* Quick Summary Notice Banner */}
        <div className={`${infoCardClass} mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#BE757C] border border-[#BE757C]/30 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#BE757C]">
                UK Consumer Rights Compliant
              </span>
              <h2 className="text-xl sm:text-2xl font-display text-[#3D2B27] mt-0.5">
                Fair &amp; Transparent Booking Guarantee
              </h2>
              <p className="text-xs sm:text-sm text-[#5C4A45] font-serif-luxury italic mt-1 leading-relaxed">
                Operating under the Consumer Rights Act 2015. We guarantee honest deposit handling, reasonable cancellation protections, and clear written confirmations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-stretch sm:self-auto">
            <button
              onClick={handlePrint}
              className={`${infoButtonClass} border border-[#E8BAC0]/40 hover:border-[#BE757C] text-[#5C4A45] bg-white`}
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Terms</span>
            </button>
            <button
              onClick={onOpenBooking}
              className={`${infoButtonClass} bg-[#87464D] hover:bg-[#71383F] text-white shadow-xs`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Ritual</span>
            </button>
          </div>
        </div>

        {/* PRIMARY HIGHLIGHTED SECTION: 50% Deposit Policy */}
        <section 
          id="deposit-policy" 
          className={`${infoCardClass} scroll-mt-44 mb-6 relative overflow-hidden`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-[#BE757C] text-white text-[11px] font-bold uppercase tracking-wider">
              Core Booking Policy
            </span>
            <span className="text-xs text-[#7A5852] font-semibold">
              Effective Date: {new Date().getFullYear()}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display text-[#3D2B27] mb-4">
            50% Deposit Policy
          </h2>

          <div className="w-24 mb-6">
            <SpaHeartDivider className="justify-start" />
          </div>

          {/* Exact required text nicely formatted for optimal readability */}
          <div className="space-y-4 text-sm sm:text-base text-[#4A352F] leading-relaxed">
            <div className={`${infoInsetClass} p-4 sm:p-5`}>
              <p className="font-medium text-[#3D2B27]">
                A deposit of <strong>50% of the total price</strong> is required to confirm your booking. The remaining <strong>50%</strong> is due upon arrival on the day of your appointment (or before the start of your treatment session). We will confirm your booking and payment dates in writing.
              </p>
            </div>

            <div className={`${infoInsetClass} p-4 sm:p-5`}>
              <p className="font-medium text-[#3D2B27]">
                Once your treatment booking is confirmed, the <strong>50% deposit is non-refundable</strong>, subject to your statutory cancellation and refund rights. If you need to cancel, please tell us as soon as possible. We will refund any amount paid above the reasonable costs and losses caused by your cancellation, taking account of any costs we save or any replacement booking we secure.
              </p>
            </div>

            <div className={`${infoInsetClass} p-4 sm:p-5`}>
              <p className="font-medium text-[#3D2B27]">
                If we cancel and cannot offer you an alternative you accept, we will refund all payments for services we have not provided.
              </p>
            </div>

            <div className={`${infoInsetClass} p-4 sm:p-5`}>
              <p className="font-medium text-[#3D2B27]">
                Any statutory cancellation and refund rights you have still apply. Please contact{' '}
                <a 
                  href="mailto:elianecll@hotmail.com" 
                  className="text-[#BE757C] hover:underline font-bold underline-offset-2"
                >
                  elianecll@hotmail.com
                </a>{' '}
                (or WhatsApp / call{' '}
                <a 
                  href="tel:+447707328060" 
                  className="text-[#BE757C] hover:underline font-bold"
                >
                  +44 7707 32 8060
                </a>
                ) to cancel or discuss a change to your booking.
              </p>
            </div>

            <div className={`${infoInsetClass} p-4 sm:p-5 text-[#5C4A45]`}>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#BE757C] shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  <strong>UK Consumer Fairness Principle:</strong> For UK consumer bookings, keeping the whole 50% automatically could be unfair; cancellation charges should reflect genuine losses.
                </p>
              </div>
            </div>
          </div>

          {/* Practical Breakdown of Policy Steps */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#E8BAC0]">
            <div className={`${infoInsetClass} p-4`}>
              <div className="w-8 h-8 rounded-full bg-[#FFF0F2] text-[#BE757C] text-sm font-bold flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="text-sm sm:text-base font-bold uppercase tracking-wide text-[#3D2B27] mb-2">
                After Owner Approval
              </h4>
              <p className="text-sm text-[#5C4A45] leading-relaxed">
                Request an appointment first. Once the owner approves availability and your quote, pay the 50% deposit using the Stripe checkout link.
              </p>
            </div>

            <div className={`${infoInsetClass} p-4`}>
              <div className="w-8 h-8 rounded-full bg-[#FFF0F2] text-[#BE757C] text-sm font-bold flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="text-sm sm:text-base font-bold uppercase tracking-wide text-[#3D2B27] mb-2">
                Written Confirmation
              </h4>
              <p className="text-sm text-[#5C4A45] leading-relaxed">
                View your appointment, reference, deposit received, and outstanding balance on the payment status page after verification.
              </p>
            </div>

            <div className={`${infoInsetClass} p-4`}>
              <div className="w-8 h-8 rounded-full bg-[#FFF0F2] text-[#BE757C] text-sm font-bold flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="text-sm sm:text-base font-bold uppercase tracking-wide text-[#3D2B27] mb-2">
                Day of Appointment
              </h4>
              <p className="text-sm text-[#5C4A45] leading-relaxed">
                Remaining 50% balance payable at our sanctuary reception prior to or upon completion of treatment.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Sanctuary Terms & Conditions Accordions / Cards */}
        <div className="space-y-6">

          {/* Section 1: Bookings & Confirmations */}
          <div className={infoCardClass}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF0F2] text-[#BE757C] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-display text-[#3D2B27]">
                1. Booking Confirmation &amp; Payment Schedules
              </h3>
            </div>
            <div className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed space-y-2.5 pl-11">
              <p>
                1.1. Appointment requests are reviewed by the owner before a deposit link is issued. An appointment becomes confirmed after its 50% deposit is verified through Stripe Checkout.
              </p>
              <p>
                1.2. After payment verification, your payment status page shows the approved appointment, service details, deposit received, and outstanding balance. Customer messages are sent manually.
              </p>
              <p>
                1.3. Online deposits can be paid by debit or credit card through secure Stripe Checkout. Apple Pay is offered where available on compatible devices and browsers with Apple Pay set up. Arrange payment of the remaining balance with the owner. PayPal and direct bank transfer are not available in this checkout.
              </p>
            </div>
          </div>

          {/* Section 2: Cancellation & Rescheduling Details */}
          <div className={infoCardClass}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF0F2] text-[#BE757C] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-display text-[#3D2B27]">
                2. Notice Periods &amp; Cancellation Calculations
              </h3>
            </div>
            <div className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed space-y-2.5 pl-11">
              <p>
                2.1. <strong>24 hours or more notice:</strong> If you notify us 24 hours or more before your scheduled appointment, you may reschedule at no charge, subject to availability. Once the treatment booking is confirmed, the 50% deposit is non-refundable, subject to your statutory cancellation and refund rights. Giving notice does not automatically entitle you to a full deposit refund.
              </p>
              <p>
                2.2. <strong>Under 24 hours notice:</strong> We will make every genuine commercial effort to re-fill your reserved suite with another client from our standby list. If a replacement booking is secured, your deposit will be refunded in full minus any unavoidable direct admin cost.
              </p>
              <p>
                2.3. <strong>Genuine loss assessment:</strong> In accordance with UK consumer guidance, we will never retain funds as a penalty. Retentions are strictly limited to the actual net costs and losses incurred where the suite cannot reasonably be re-allocated.
              </p>
            </div>
          </div>

          {/* Section 3: Curated Treatment Packages & Bundles */}
          <div className={infoCardClass}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF0F2] text-[#BE757C] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-display text-[#3D2B27]">
                3. Curated Treatment Packages &amp; Bundles
              </h3>
            </div>
            <div className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed space-y-2.5 pl-11">
              <p>
                3.1. When booking any treatment package or combination ritual, you receive dedicated customized care with designated therapist consultation and skin preparation.
              </p>
              <p>
                3.2. All package sessions must be scheduled within 12 months from the date of initial booking, allowing optimum intervals for skin cell regeneration and collagen induction.
              </p>
              <p>
                3.3. Treatment packages are linked to the individual client named upon booking to maintain protocol continuity with your designated therapist.
              </p>
            </div>
          </div>

          {/* Section 4: Arrival, Health & Medical Consultation */}
          <div className={infoCardClass}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF0F2] text-[#BE757C] flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-display text-[#3D2B27]">
                4. Arrival Etiquette &amp; Medical Consultations
              </h3>
            </div>
            <div className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed space-y-2.5 pl-11">
              <p>
                4.1. Complete the confidential health questionnaire when requesting your appointment. The owner reviews treatment suitability with you before issuing a deposit link. Please arrive 10 minutes prior to your scheduled time for a check of any health or medication changes and separate treatment consent.
              </p>
              <p>
                4.2. Suitability depends on the selected treatment, exact product/device instructions and your individual circumstances. A questionnaire or deposit does not provide medical clearance. Tell the therapist about relevant conditions, medication, allergies and recent procedures, and report changes before every visit. Further consultation or medical advice may be needed; never stop prescribed medication to receive a treatment.
              </p>
              <p>
                4.3. If you arrive late, we will make every effort to deliver as much of your treatment as possible within the remaining time; however, the session may need to conclude at the scheduled finish time to avoid delaying subsequent guests.
              </p>
            </div>
          </div>

          {/* Section 5: Boutique Skincare Products & Vouchers */}
          <div className={infoCardClass}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF0F2] text-[#BE757C] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-display text-[#3D2B27]">
                5. Boutique Skincare (CLINICARE &amp; Tropic) &amp; Gift Vouchers
              </h3>
            </div>
            <div className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed space-y-2.5 pl-11">
              <p>
                5.1. Unopened skincare cosmetics in original tamper-evident seals may be returned within 14 days of receipt in accordance with distance selling regulations.
              </p>
              <p>
                5.2. Gift vouchers are valid for 12 months from the date of issue and are redeemable across all facial therapies, bodywork rituals, and boutique products.
              </p>
            </div>
          </div>

          {/* Section 6: Contact & Inquiries */}
          <div className={infoCardClass}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFF0F2] text-[#BE757C] flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-display text-[#3D2B27]">
                6. Contacting Us for Rescheduling or Enquiries
              </h3>
            </div>
            <div className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed space-y-2.5 pl-11">
              <p>
                To discuss any modifications, cancellations, or questions regarding your booking, please reach out directly:
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a 
                  href="mailto:elianecll@hotmail.com" 
                  className={`${infoInsetClass} p-4 hover:bg-[#FFF0F2] transition-colors flex flex-wrap items-center gap-3`}
                >
                  <Mail className="w-4 h-4 text-[#BE757C] shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#7A5852] block">Email Us</span>
                    <span className="text-xs font-semibold text-[#3D2B27]">elianecll@hotmail.com</span>
                  </div>
                </a>

                <a 
                  href="tel:+447707328060" 
                  className={`${infoInsetClass} p-4 hover:bg-[#FFF0F2] transition-colors flex flex-wrap items-center gap-3`}
                >
                  <Phone className="w-4 h-4 text-[#BE757C] shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#7A5852] block">Direct / WhatsApp</span>
                    <span className="text-xs font-semibold text-[#3D2B27]">+44 7707 32 8060 (Elaine Chong)</span>
                  </div>
                </a>
              </div>
              <p className="text-[11px] text-[#7A5852] pt-2">
                Sanctuary Address: 5, St Michael's Close, FY3 7GX, Blackpool, United Kingdom.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Navigation CTA */}
        <div className={`${infoCardClass} mt-6 text-center`}>
          <h3 className="text-xl sm:text-2xl font-display text-[#3D2B27] mb-2">
            Ready to Reserve Your Sanctuary Appointment?
          </h3>
          <p className="text-xs sm:text-sm font-serif-luxury italic text-[#5C4A45] max-w-lg mx-auto mb-6">
            Experience therapeutic relaxation with our bespoke facial aesthetics and hot stone bodywork.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('treatments')}
              className={`${infoButtonClass} border border-[#E8BAC0]/40 hover:border-[#BE757C] text-[#5C4A45] bg-white`}
            >
              View Treatments &amp; Packages
            </button>
            <button
              onClick={onOpenBooking}
              className={`${infoButtonClass} bg-[#87464D] hover:bg-[#71383F] text-white shadow-xs`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment (50% Deposit)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
