import React, { useState } from 'react';
import { SPA_SERVICES } from '../data/spaData';
import {
  X,
  Calendar,
  Clock,
  User,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  CreditCard,
  Lock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Receipt,
  Smartphone,
  Printer,
  Check,
  MessageCircle,
  ExternalLink,
  Send,
  Building2,
  Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CRMRecord,
  OWNER_CONFIG,
  saveCRMRecord,
  generateOwnerWhatsAppUrl,
  generateOwnerEmailUrl,
} from '../data/crmStorage';
import {
  BankDetails,
  getStoredBankDetails,
} from '../data/bankDetails';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string;
  initialProduct?: 'tropic' | 'clinicare';
  initialDuration?: '30' | '60';
  onOpenCRM?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedServiceId,
  initialProduct,
  initialDuration,
  onOpenCRM,
}) => {
  const [step, setStep] = useState<'details' | 'payment' | 'confirmed'>('details');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preselectedServiceId || SPA_SERVICES[0].id
  );
  const [selectedProduct, setSelectedProduct] = useState<'tropic' | 'clinicare'>(
    initialProduct || 'clinicare'
  );
  const [selectedDuration, setSelectedDuration] = useState<'30' | '60'>(
    initialDuration || '30'
  );
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-02');
  const [selectedTime, setSelectedTime] = useState<string>('11:00 AM');
  
  // Guest details
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'bank_transfer'>('card');
  const [bankDetails, setBankDetails] = useState<BankDetails>(() => getStoredBankDetails());
  const [copiedBankKey, setCopiedBankKey] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4532 8920 1829 4812',
    expiry: '08/28',
    cvc: '742',
    cardholderName: '',
    postalCode: 'FY1 2AB',
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [paidSummary, setPaidSummary] = useState<{
    total: number;
    deposit: number;
    balance: number;
    cardLast4: string;
  }>({ total: 0, deposit: 0, balance: 0, cardLast4: '4812' });
  const [latestCrmRecord, setLatestCrmRecord] = useState<CRMRecord | null>(null);

  // Listen for real-time bank details update from Owner CRM
  React.useEffect(() => {
    const handleBankUpdate = () => {
      setBankDetails(getStoredBankDetails());
    };
    window.addEventListener('elysian_bank_details_updated', handleBankUpdate);
    return () => window.removeEventListener('elysian_bank_details_updated', handleBankUpdate);
  }, []);

  // Sync if preselectedServiceId or initial options change
  React.useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
    if (initialProduct) {
      setSelectedProduct(initialProduct);
    }
    if (initialDuration) {
      setSelectedDuration(initialDuration);
    }
  }, [preselectedServiceId, initialProduct, initialDuration, isOpen]);

  // Keep cardholder name in sync with guest name if not customized
  React.useEffect(() => {
    if (formData.name && !cardDetails.cardholderName) {
      setCardDetails(prev => ({ ...prev, cardholderName: formData.name }));
    }
  }, [formData.name]);

  if (!isOpen) return null;

  const currentService = SPA_SERVICES.find(s => s.id === selectedServiceId) || SPA_SERVICES[0];

  const opt30 = currentService.priceOptions?.find((o) =>
    o.duration.toLowerCase().includes('30')
  );
  const opt60 = currentService.priceOptions?.find((o) =>
    o.duration.toLowerCase().includes('60')
  );
  const hasDualProducts = !!(opt30 && (opt30.priceTropic !== undefined || opt30.priceClinicare !== undefined));

  // Compute active price accurately
  const getActivePrice = (): number => {
    if (hasDualProducts) {
      const activeOpt = selectedDuration === '30' ? opt30 : opt60 || opt30;
      if (activeOpt) {
        const price = selectedProduct === 'tropic' ? activeOpt.priceTropic : activeOpt.priceClinicare;
        if (typeof price === 'number') return price;
      }
    }

    if (currentService.priceOptions && currentService.priceOptions.length > 0) {
      const activeOpt = selectedDuration === '30' ? opt30 : opt60 || currentService.priceOptions[0];
      if (activeOpt) {
        if (typeof activeOpt.priceSingle === 'number') return activeOpt.priceSingle;
        if (typeof activeOpt.priceSingle === 'string') {
          const parsed = parseFloat(activeOpt.priceSingle.replace(/[^0-9.]/g, ''));
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
        if (selectedProduct === 'tropic' && typeof activeOpt.priceTropic === 'number') return activeOpt.priceTropic;
        if (selectedProduct === 'clinicare' && typeof activeOpt.priceClinicare === 'number') return activeOpt.priceClinicare;
      }
    }

    // Try parsing from priceDisplay
    const match = currentService.priceDisplay.match(/£([0-9]+(?:\.[0-9]{2})?)/);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val > 0) return val;
    }

    return 50; // fallback
  };

  const totalFee = getActivePrice();
  // 50% downpayment calculation
  const downpaymentAmount = Math.round((totalFee * 0.5) * 100) / 100;
  const remainingBalance = Math.round((totalFee - downpaymentAmount) * 100) / 100;

  const timeSlots = [
    '09:30 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'
  ];

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setStep('payment');
  };

  const handlePayDownpayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    const generatedCode = `ELS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const last4 = cardDetails.cardNumber.replace(/\s/g, '').slice(-4) || '4812';

    setTimeout(() => {
      const paymentDesc =
        paymentMethod === 'bank_transfer'
          ? `UK Bank Transfer (${bankDetails.bankName} • Sort Code ${bankDetails.sortCode})`
          : paymentMethod === 'wallet'
          ? 'Apple Pay'
          : `Card ending in ${last4}`;
      const authRef =
        paymentMethod === 'bank_transfer'
          ? `BACS-${Math.floor(10000 + Math.random() * 90000)}`
          : `AUTH-${Math.floor(10000 + Math.random() * 90000)}`;

      setPaidSummary({
        total: totalFee,
        deposit: downpaymentAmount,
        balance: remainingBalance,
        cardLast4: paymentDesc,
      });
      setConfirmationCode(generatedCode);

      // Create and persist CRM record for site owner Elaine
      const newCrmRecord: CRMRecord = {
        id: generatedCode,
        type: 'booking',
        createdAt: new Date().toISOString(),
        createdFormatted: new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          notes: formData.notes,
        },
        details: {
          serviceId: currentService.id,
          serviceTitle: currentService.title,
          skincareProduct: hasDualProducts ? selectedProduct : undefined,
          duration: hasDualProducts
            ? (selectedDuration === '30' ? '30 mins Express' : '60 mins Full Ritual')
            : currentService.duration,
          scheduledDate: selectedDate,
          scheduledTime: selectedTime,
        },
        financials: {
          totalAmount: totalFee,
          depositPaid: downpaymentAmount,
          balanceDue: remainingBalance,
          paymentStatus: '50%_deposit_paid',
          paymentMethod: paymentDesc,
          authCode: authRef,
        },
        notifications: {
          whatsAppOwner: {
            recipient: OWNER_CONFIG.whatsappDisplay,
            channel: 'whatsapp',
            sent: true,
            sentAt: new Date().toISOString(),
            url: '',
            previewText: `New Booking: ${formData.name} • 50% Deposit £${downpaymentAmount.toFixed(2)} Paid`,
          },
          emailOwner: {
            recipient: OWNER_CONFIG.email,
            channel: 'email',
            sent: true,
            sentAt: new Date().toISOString(),
            url: '',
            previewText: `Booking #${generatedCode}`,
          },
        },
        status: 'confirmed',
        ownerNotes: `Online booking via website. 50% deposit £${downpaymentAmount.toFixed(2)} received online. Balance £${remainingBalance.toFixed(2)} due on arrival.`,
      };

      saveCRMRecord(newCrmRecord);
      setLatestCrmRecord(newCrmRecord);

      setIsProcessingPayment(false);
      setStep('confirmed');
    }, 1200);
  };

  const resetForm = () => {
    setStep('details');
    onClose();
  };

  const formatCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    const parts = clean.match(/[\s\S]{1,4}/g) || [];
    return parts.join(' ');
  };

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length > 2) {
      return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-2xl bg-[#FFF9F9] rounded-2xl shadow-2xl border border-[#E8BAC0]/60 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-[#5C423E] text-white p-6 sm:p-7 flex items-center justify-between relative">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#E8BAC0] font-semibold font-sans-clean">
                RESERVATION SANCTUARY
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#BE757C] text-white">
                50% Deposit Policy
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display mt-1">
              Book Your Wellness Ritual
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="bg-[#FAF0F2] border-b border-[#F0D0D5] px-6 py-2.5 flex items-center justify-between text-xs text-[#5C4A45]">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 'details' ? 'bg-[#BE757C] text-white' : 'bg-emerald-700 text-white'
            }`}>
              {step === 'details' ? '1' : '✓'}
            </span>
            <span className={step === 'details' ? 'font-bold text-[#3D2B27]' : 'font-medium'}>
              Appointment Details
            </span>
          </div>

          <div className="w-8 h-[1px] bg-[#E8BAC0]" />

          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 'payment'
                ? 'bg-[#BE757C] text-white'
                : step === 'confirmed'
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-[#E8BAC0] text-[#7A5852]'
            }`}>
              {step === 'confirmed' ? '✓' : '2'}
            </span>
            <span className={step === 'payment' ? 'font-bold text-[#3D2B27]' : 'font-medium'}>
              50% Downpayment
            </span>
          </div>

          <div className="w-8 h-[1px] bg-[#E8BAC0]" />

          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 'confirmed' ? 'bg-[#BE757C] text-white' : 'bg-white border border-[#E8BAC0] text-[#7A5852]'
            }`}>
              3
            </span>
            <span className={step === 'confirmed' ? 'font-bold text-[#3D2B27]' : 'font-medium'}>
              Confirmation
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: APPOINTMENT DETAILS */}
            {step === 'details' && (
              <motion.form
                key="step-details"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleDetailsSubmit}
                className="space-y-6"
              >
                {/* 1. Choose Service */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B27] mb-2 font-sans-clean">
                    1. Select Treatment Ritual
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8BAC0] text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C] focus:ring-1 focus:ring-[#BE757C]"
                  >
                    {SPA_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} — {s.priceDisplay} ({s.duration})
                      </option>
                    ))}
                  </select>
                  
                  {/* Dual Product Formulation & Duration Selector if applicable */}
                  {hasDualProducts && (
                    <div className="mt-3 p-3.5 bg-[#FFF5F7] rounded-xl border border-[#F0D0D5] space-y-3">
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-[#3D2B27] mb-1.5 font-sans-clean">
                          Skincare Product Line:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProduct('tropic')}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                              selectedProduct === 'tropic'
                                ? 'bg-emerald-800 text-white border-emerald-700 shadow-2xs'
                                : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            <span>🌿</span> Product Tropic
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedProduct('clinicare')}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                              selectedProduct === 'clinicare'
                                ? 'bg-[#BE757C] text-white border-[#A9636A] shadow-2xs'
                                : 'bg-white text-[#8C3F48] border-[#F0D0D5] hover:bg-[#FFF0F2]'
                            }`}
                          >
                            <span>🔬</span> Product Clinicare
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-[#3D2B27] mb-1.5 font-sans-clean">
                          {currentService.category === 'packages' ? 'Select Series Course:' : 'Treatment Duration:'}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDuration('30')}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                              selectedDuration === '30'
                                ? 'bg-[#5C423E] text-white border-[#4A352F] shadow-2xs'
                                : 'bg-white text-[#5C4A45] border-[#E8BAC0] hover:bg-[#FAF0F2]'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />{' '}
                            {currentService.category === 'packages' ? '30 Mins (4 Sessions)' : '30 Mins Express'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDuration('60')}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                              selectedDuration === '60'
                                ? 'bg-[#5C423E] text-white border-[#4A352F] shadow-2xs'
                                : 'bg-white text-[#5C4A45] border-[#E8BAC0] hover:bg-[#FAF0F2]'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />{' '}
                            {currentService.category === 'packages' ? '60 Mins (4 Sessions)' : '60 Mins Full Ritual'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 50% Downpayment Calculation Callout Card */}
                  <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-[#FFF5F7] to-[#FAF0F2] border border-[#F0D0D5] space-y-2">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0D0D5]">
                      <span className="text-[#5C4A45] font-serif-luxury italic">
                        {currentService.title} ({hasDualProducts ? `${selectedDuration} min • ${selectedProduct === 'tropic' ? '🌿 Tropic' : '🔬 Clinicare'}` : currentService.duration})
                      </span>
                      <span className="font-semibold text-[#5C4A45]">
                        Total Fee: <span className="font-bold text-[#3D2B27]">£{totalFee.toFixed(2)}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-white border border-[#E8BAC0] shadow-2xs">
                        <span className="block text-[10px] uppercase font-bold tracking-wider text-[#BE757C]">
                          💳 50% Downpayment Today:
                        </span>
                        <span className="text-lg font-bold font-display text-[#BE757C]">
                          £{downpaymentAmount.toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-[#7A5852] mt-0.5">
                          Charged at booking to confirm slot
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-[#E8BAC0] shadow-2xs">
                        <span className="block text-[10px] uppercase font-bold tracking-wider text-[#5C4A45]">
                          🏛️ Remaining Balance on Arrival:
                        </span>
                        <span className="text-lg font-bold font-display text-[#3D2B27]">
                          £{remainingBalance.toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-[#7A5852] mt-0.5">
                          Payable upon arrival at concierge
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#7A5852] italic text-center pt-1">
                      ✨ A 50% downpayment is required for every booking to reserve your dedicated room and therapist. Fully refundable if cancelled 24+ hours in advance.
                    </p>
                  </div>
                </div>

                {/* 2. Choose Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B27] mb-2 font-sans-clean">
                      2. Preferred Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8BAC0] text-xs sm:text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B27] mb-2 font-sans-clean">
                      3. Preferred Time
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8BAC0] text-xs sm:text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Guest Details */}
                <div className="space-y-3 pt-3 border-t border-[#F0D5D8]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B27] font-sans-clean">
                    4. Guest Information
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8BAC0] text-xs sm:text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8BAC0] text-xs sm:text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email Address (for instant deposit receipt)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8BAC0] text-xs sm:text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                  />

                  <textarea
                    placeholder="Special requests (e.g. skin sensitivities, pressure preferences, allergies, or celebratory occasions)"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8BAC0] text-xs sm:text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                  />
                </div>

                {/* Submission CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to 50% Downpayment (£{downpaymentAmount.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-center text-[#5C4A45]/75 mt-2 flex items-center justify-center gap-1.5">
                    <Lock className="w-3 h-3 text-[#BE757C]" />
                    <span>Secure checkout. 50% deposit taken today, remaining balance at sanctuary.</span>
                  </p>
                </div>
              </motion.form>
            )}

            {/* STEP 2: 50% DOWNPAYMENT PAYMENT */}
            {step === 'payment' && (
              <motion.form
                key="step-payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handlePayDownpayment}
                className="space-y-5"
              >
                {/* Back to details button */}
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#BE757C] hover:text-[#A9636A] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Appointment Details</span>
                </button>

                {/* Appointment & Financial Summary Card */}
                <div className="bg-white rounded-xl p-4 border border-[#E8BAC0] shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F5E6E8]">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#BE757C] font-sans-clean">
                        RESERVATION SUMMARY
                      </span>
                      <h4 className="text-base font-display font-semibold text-[#3D2B27]">
                        {currentService.title}
                      </h4>
                      <p className="text-xs text-[#5C4A45] mt-0.5">
                        {hasDualProducts ? (selectedProduct === 'tropic' ? '🌿 Product Tropic' : '🔬 Product Clinicare') : ''} • {selectedDuration} mins • {selectedDate} at {selectedTime}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase text-[#7A5852] block">Total Fee</span>
                      <span className="text-base font-bold text-[#3D2B27]">£{totalFee.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* 50% Downpayment Highlights */}
                  <div className="bg-[#FAF0F2] rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#BE757C] flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        50% Downpayment Due Today:
                      </span>
                      <span className="text-[11px] text-[#7A5852]">
                        Remaining £{remainingBalance.toFixed(2)} due at sanctuary arrival
                      </span>
                    </div>
                    <span className="text-xl font-display font-bold text-[#BE757C]">
                      £{downpaymentAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3D2B27] mb-2 font-sans-clean">
                    Select Downpayment Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-[#5C423E] text-white border-[#4A352F] shadow-xs'
                          : 'bg-white text-[#5C4A45] border-[#E8BAC0] hover:bg-[#FAF0F2]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Credit / Debit Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'bank_transfer'
                          ? 'bg-[#BE757C] text-white border-[#A9636A] shadow-xs'
                          : 'bg-white text-[#5C4A45] border-[#E8BAC0] hover:bg-[#FAF0F2]'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>UK Bank Transfer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'wallet'
                          ? 'bg-[#5C423E] text-white border-[#4A352F] shadow-xs'
                          : 'bg-white text-[#5C4A45] border-[#E8BAC0] hover:bg-[#FAF0F2]'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Apple Pay / G Pay</span>
                    </button>
                  </div>
                </div>

                {/* Card Fields if paymentMethod === 'card' */}
                {paymentMethod === 'card' && (
                  <div className="bg-white rounded-xl p-4 border border-[#E8BAC0] space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#3D2B27]">Cardholder Details</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">VISA</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">MC</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">AMEX</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C4A45] mb-1">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        required
                        value={cardDetails.cardholderName}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                        placeholder="Cardholder Name"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F9] border border-[#E8BAC0] text-xs text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#5C4A45] mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardDetails.cardNumber}
                          onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(e.target.value) })}
                          placeholder="4532 •••• •••• 4812"
                          maxLength={19}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F9] border border-[#E8BAC0] text-xs font-mono text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        />
                        <CreditCard className="w-4 h-4 text-[#BE757C] absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C4A45] mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          required
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#FFF9F9] border border-[#E8BAC0] text-xs font-mono text-center text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C4A45] mb-1">
                          CVC / CVV
                        </label>
                        <input
                          type="password"
                          required
                          value={cardDetails.cvc}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.slice(0, 4) })}
                          placeholder="742"
                          maxLength={4}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#FFF9F9] border border-[#E8BAC0] text-xs font-mono text-center text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#5C4A45] mb-1">
                          Postcode
                        </label>
                        <input
                          type="text"
                          required
                          value={cardDetails.postalCode}
                          onChange={(e) => setCardDetails({ ...cardDetails, postalCode: e.target.value.toUpperCase() })}
                          placeholder="FY1 2AB"
                          maxLength={8}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#FFF9F9] border border-[#E8BAC0] text-xs font-mono text-center text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UK Bank Transfer Details if paymentMethod === 'bank_transfer' */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="bg-[#FAF0F2] rounded-xl p-4 sm:p-5 border border-[#E8BAC0] space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8BAC0]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#BE757C]" />
                        <span className="text-xs font-bold text-[#3D2B27]">Direct UK Bank Transfer (Faster Payments)</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        0% Fee
                      </span>
                    </div>

                    <p className="text-xs text-[#5C4A45] leading-relaxed">
                      Please open your mobile banking app and transfer the <strong>50% deposit (£{downpaymentAmount.toFixed(2)})</strong> using the details below:
                    </p>

                    <div className="bg-white rounded-xl p-3.5 border border-[#E8BAC0] space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#7A5852] font-semibold">Account Name:</span>
                        <span className="font-bold text-[#3D2B27]">{bankDetails.accountName}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#7A5852] font-semibold">Bank Name:</span>
                        <span className="font-bold text-[#3D2B27]">{bankDetails.bankName}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#FAF0F2]">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#7A5852] block">Sort Code</span>
                          <span className="text-sm font-mono font-bold text-[#BE757C]">{bankDetails.sortCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bankDetails.sortCode);
                            setCopiedBankKey('sortCode');
                            setTimeout(() => setCopiedBankKey(null), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF0F2] hover:bg-[#F5E0E4] text-[#BE757C] text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {copiedBankKey === 'sortCode' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBankKey === 'sortCode' ? 'Copied' : 'Copy Sort Code'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#FAF0F2]">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#7A5852] block">Account Number</span>
                          <span className="text-sm font-mono font-bold text-[#BE757C]">{bankDetails.accountNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bankDetails.accountNumber);
                            setCopiedBankKey('accountNumber');
                            setTimeout(() => setCopiedBankKey(null), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF0F2] hover:bg-[#F5E0E4] text-[#BE757C] text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {copiedBankKey === 'accountNumber' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBankKey === 'accountNumber' ? 'Copied' : 'Copy Account No.'}</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-[#FAF0F2]">
                        <span className="text-[10px] uppercase font-bold text-[#7A5852] block mb-0.5">Reference to Use:</span>
                        <div className="flex items-center justify-between bg-[#FAF3F4] px-2.5 py-1.5 rounded-lg border border-[#E8BAC0]/60">
                          <span className="text-xs font-mono font-bold text-[#5C423E]">
                            {(formData.name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 8) || 'GUEST') + '-DEP'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const refStr = (formData.name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 8) || 'GUEST') + '-DEP';
                              navigator.clipboard.writeText(refStr);
                              setCopiedBankKey('reference');
                              setTimeout(() => setCopiedBankKey(null), 2000);
                            }}
                            className="text-[10px] font-bold text-[#BE757C] hover:underline cursor-pointer"
                          >
                            {copiedBankKey === 'reference' ? 'Copied!' : 'Copy Ref'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Owner link */}
                    {onOpenCRM && (
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={onOpenCRM}
                          className="text-[11px] text-[#BE757C] hover:text-[#A9636A] hover:underline cursor-pointer font-medium"
                        >
                          Owner: Need to update these bank details? Open Bank Settings in CRM
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Wallet Details if paymentMethod === 'wallet' */}
                {paymentMethod === 'wallet' && (
                  <div className="bg-white rounded-xl p-5 border border-[#E8BAC0] text-center space-y-3">
                    <Smartphone className="w-8 h-8 text-[#BE757C] mx-auto" />
                    <div>
                      <h5 className="text-sm font-semibold text-[#3D2B27]">One-Touch Digital Downpayment</h5>
                      <p className="text-xs text-[#7A5852] mt-0.5">
                        Authorize £{downpaymentAmount.toFixed(2)} instantly via Apple Pay or Google Pay with Touch ID / Face ID.
                      </p>
                    </div>
                  </div>
                )}

                {/* Security & Cancellation Policy Notice */}
                <div className="p-3 rounded-lg bg-[#FFF5F7] border border-[#F0D0D5] flex items-start gap-2.5 text-xs text-[#5C4A45]">
                  <ShieldCheck className="w-4 h-4 text-[#BE757C] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#3D2B27]">
                      Bank-Grade 256-Bit SSL Encryption &amp; Flexible Cancellation
                    </p>
                    <p className="text-[11px] text-[#7A5852] leading-tight">
                      Your 50% deposit (£{downpaymentAmount.toFixed(2)}) is securely held. Cancellations made 24+ hours prior receive a 100% full refund immediately.
                    </p>
                  </div>
                </div>

                {/* Submit Payment CTA */}
                <div>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full py-3.5 px-6 rounded-full bg-[#BE757C] hover:bg-[#A9636A] disabled:opacity-75 text-white font-medium text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessingPayment ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>
                          {paymentMethod === 'bank_transfer'
                            ? 'Verifying Bank Deposit & Logging to CRM...'
                            : `Authorizing £${downpaymentAmount.toFixed(2)} Downpayment...`}
                        </span>
                      </span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>
                          {paymentMethod === 'bank_transfer'
                            ? `Confirm £${downpaymentAmount.toFixed(2)} Bank Transfer & Book`
                            : `Pay £${downpaymentAmount.toFixed(2)} Downpayment & Confirm Booking`}
                        </span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-[#7A5852] mt-2">
                    Remaining £{remainingBalance.toFixed(2)} is settled at the concierge upon arrival.
                  </p>
                </div>
              </motion.form>
            )}

            {/* STEP 3: BOOKING CONFIRMED & DEPOSIT RECEIPT */}
            {step === 'confirmed' && (
              <motion.div
                key="step-confirmed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>50% Downpayment Paid (£{paidSummary.deposit.toFixed(2)})</span>
                  </div>
                  <h4 className="text-2xl font-display text-[#3D2B27]">
                    Ritual Reserved &amp; Secured
                  </h4>
                  <p className="text-xs tracking-widest text-[#BE757C] uppercase font-sans-clean font-semibold mt-1">
                    CONFIRMATION &amp; RECEIPT #{confirmationCode}
                  </p>
                </div>

                {/* Digital Deposit Receipt Card */}
                <div className="bg-white rounded-xl p-5 border border-[#E8BAC0] max-w-lg mx-auto text-left text-xs space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#F5E6E8]">
                    <span className="font-bold text-[#3D2B27] flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[#BE757C]" />
                      Downpayment Receipt
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      PAID (50%)
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#5C4A45]">Guest Name:</span>
                      <span className="font-bold text-[#3D2B27]">{formData.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#5C4A45]">Treatment Ritual:</span>
                      <span className="font-bold text-[#3D2B27] text-right">{currentService.title}</span>
                    </div>

                    {hasDualProducts && (
                      <div className="flex justify-between">
                        <span className="text-[#5C4A45]">Skincare Line:</span>
                        <span className="font-bold text-emerald-800">
                          {selectedProduct === 'tropic' ? '🌿 Tropic (Fresh Botanicals)' : '🔬 Clinicare (Active Cosmeceuticals)'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-[#5C4A45]">Scheduled Date &amp; Time:</span>
                      <span className="font-bold text-[#BE757C]">{selectedDate} at {selectedTime}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#5C4A45]">Payment Method:</span>
                      <span className="font-medium text-[#3D2B27]">{paidSummary.cardLast4}</span>
                    </div>
                  </div>

                  {/* Financial Breakdown in Receipt */}
                  <div className="pt-2.5 border-t border-[#F5E6E8] space-y-1.5 bg-[#FAF0F2] -mx-5 -mb-5 p-4 rounded-b-xl">
                    <div className="flex justify-between text-[#5C4A45]">
                      <span>Total Treatment Fee:</span>
                      <span className="font-medium">£{paidSummary.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        50% Downpayment Paid Today:
                      </span>
                      <span>£{paidSummary.deposit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#BE757C] font-bold pt-1 border-t border-[#E8BAC0]">
                      <span>Remaining Balance Due on Arrival:</span>
                      <span>£{paidSummary.balance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Owner Notification Dispatch & CRM Record Banner */}
                {latestCrmRecord && (
                  <div className="bg-[#FFF5F7] rounded-2xl p-4 sm:p-5 border border-[#F0D0D5] max-w-lg mx-auto text-left text-xs space-y-3 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F0D0D5]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-[#3D2B27] uppercase tracking-wider text-[11px] font-sans-clean">
                          Owner Alerts &amp; CRM Sync
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#BE757C] text-white">
                        RECORDED TO OWNER CRM
                      </span>
                    </div>

                    <p className="text-[11px] text-[#5C4A45] leading-relaxed">
                      All guest information and 50% deposit records have been logged to the site owner CRM ledger. Direct dispatch to Elaine Chong via registered WhatsApp and Email:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <a
                        href={generateOwnerWhatsAppUrl(latestCrmRecord)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Notify Owner WhatsApp</span>
                      </a>

                      <a
                        href={generateOwnerEmailUrl(latestCrmRecord).url}
                        className="py-2.5 px-3 rounded-xl bg-[#5C423E] hover:bg-[#4A352F] text-white text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Send to Owner Email</span>
                      </a>
                    </div>

                    {onOpenCRM && (
                      <div className="pt-1 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenCRM();
                          }}
                          className="text-[11px] font-bold text-[#BE757C] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Owner CRM &amp; Sales Dashboard</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-[#5C4A45] max-w-md mx-auto leading-relaxed">
                  A booking confirmation and downpayment tax receipt have been sent to <strong>{formData.email || formData.phone}</strong>. Please arrive 10 minutes early to enjoy our complimentary Botanical Flowers Tea.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-[#BE757C] text-[#BE757C] hover:bg-[#FFF0F2] text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Deposit Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-7 py-2.5 rounded-full bg-[#5C423E] hover:bg-[#4A352F] text-white text-xs tracking-widest uppercase font-medium transition-all cursor-pointer shadow-xs"
                  >
                    Return to Sanctuary
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

