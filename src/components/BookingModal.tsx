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
  Plus,
  Trash2,
  Calculator,
  Tag,
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

export interface BookedTreatmentItem {
  id: string;
  serviceId?: string;
  title: string;
  duration: string;
  price: number;
  category?: string;
  isCustom?: boolean;
  isAddon?: boolean;
}

export const COMPLEMENTARY_ADDONS = [
  { id: 'indian-head-massage-addon', title: 'Indian Head Massage', duration: '15 mins', price: 15, tag: 'Scalp & Temple Acupressure' },
  { id: 'body-scrub-addon', title: 'Organic Botanical Body Scrub', duration: '20 mins', price: 25, tag: 'Cellular Polish' },
  { id: 'carboxytherapy-face-mask-treatment', title: 'Clinicare Carboxy Face Mask', duration: '30 mins', price: 45, tag: 'CO2 Bohr Oxygenation' },
  { id: 'cliniccare-chemical-peeling', title: 'Clinicare Superficial Peel', duration: '30-45 mins', price: 60, tag: 'Medical Radiance Peel' },
  { id: 'cliniccare-cinderella-black-tie-facial', title: 'Clinicare Cinderella / Black Tie Ritual', duration: '30 mins', price: 30, tag: 'Red-Carpet Glow & EGF Mask' },
  { id: 'addon-eye-lip-rescue', title: 'Collagen Eye & Lip Contour', duration: '15 mins', price: 12, tag: 'Hydra-Plumping' },
  { id: 'addon-high-frequency', title: 'High-Frequency Blemish Buster', duration: '10 mins', price: 10, tag: 'Anti-Bacterial Pore Clear' },
  { id: 'addon-cold-hammer', title: 'Cold Hammer Cryo Serums Lock', duration: '10 mins', price: 15, tag: 'Cryo-Soothing' },
];

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string;
  initialProduct?: 'tropic' | 'clinicare';
  initialDuration?: '30' | '60';
  initialIsCourse?: boolean;
  onOpenCRM?: () => void;
  onOpenTerms?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preselectedServiceId,
  initialProduct,
  initialDuration,
  initialIsCourse,
  onOpenCRM,
  onOpenTerms,
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
  const [isCoursePackage, setIsCoursePackage] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-02');
  const [selectedTime, setSelectedTime] = useState<string>('11:00 AM');

  // Additional treatments & custom treatments filled up by client
  const [additionalTreatments, setAdditionalTreatments] = useState<BookedTreatmentItem[]>([]);
  const [customName, setCustomName] = useState('');
  const [customDuration, setCustomDuration] = useState('30 mins');
  const [customPrice, setCustomPrice] = useState<number>(25);
  
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
    isCourse?: boolean;
    savings?: number;
    treatments?: BookedTreatmentItem[];
  }>({ total: 0, deposit: 0, balance: 0, cardLast4: '4812', treatments: [] });
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
    if (initialIsCourse !== undefined) {
      setIsCoursePackage(initialIsCourse);
    }
  }, [preselectedServiceId, initialProduct, initialDuration, initialIsCourse, isOpen]);

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
  const hasMultipleDurations = !!(opt30 && opt60);

  // Compute active single session price accurately for the primary service
  const getActivePrice = (): number => {
    if (hasMultipleDurations) {
      const activeOpt = selectedDuration === '30' ? opt30 : opt60 || opt30;
      if (activeOpt) {
        const price = activeOpt.priceClinicare ?? activeOpt.priceSingle;
        if (typeof price === 'number') return price;
      }
    }

    if (currentService.priceOptions && currentService.priceOptions.length > 0) {
      const activeOpt = selectedDuration === '30' ? (opt30 || currentService.priceOptions[0]) : (opt60 || currentService.priceOptions[0]);
      if (activeOpt) {
        if (typeof activeOpt.priceClinicare === 'number') return activeOpt.priceClinicare;
        if (typeof activeOpt.priceSingle === 'number') return activeOpt.priceSingle;
        if (typeof activeOpt.priceSingle === 'string') {
          const parsed = parseFloat(activeOpt.priceSingle.replace(/[^0-9.]/g, ''));
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
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

  const primarySessionPrice = getActivePrice();

  // Create primary item
  const primaryTreatmentItem: BookedTreatmentItem = {
    id: `primary-${currentService.id}`,
    serviceId: currentService.id,
    title: currentService.title,
    duration: hasMultipleDurations
      ? (selectedDuration === '30' ? '30 mins Express' : '60 mins Full Ritual')
      : currentService.duration,
    price: primarySessionPrice,
    category: currentService.category,
  };

  // Full itemized list of all treatments client wants to do
  const allBookedTreatments: BookedTreatmentItem[] = [
    primaryTreatmentItem,
    ...additionalTreatments,
  ];

  // Subtotal for all chosen treatments (single session price)
  const treatmentsSubtotal = allBookedTreatments.reduce((sum, item) => sum + item.price, 0);

  // Buy 3 Get 1 FREE Course deal (clients pay for 3 treatments, 4th session 100% FREE)
  const totalFee = isCoursePackage ? treatmentsSubtotal * 3 : treatmentsSubtotal;
  const savingsAmount = isCoursePackage ? treatmentsSubtotal : 0;

  // 50% downpayment calculation
  const downpaymentAmount = Math.round((totalFee * 0.5) * 100) / 100;
  const remainingBalance = Math.round((totalFee - downpaymentAmount) * 100) / 100;

  // Handlers for adding/removing treatments
  const handleToggleAddon = (addon: typeof COMPLEMENTARY_ADDONS[0]) => {
    setAdditionalTreatments(prev => {
      const exists = prev.some(item => item.id === addon.id);
      if (exists) {
        return prev.filter(item => item.id !== addon.id);
      } else {
        return [
          ...prev,
          {
            id: addon.id,
            serviceId: addon.id,
            title: addon.title,
            duration: addon.duration,
            price: addon.price,
            category: 'addon',
            isAddon: true,
          },
        ];
      }
    });
  };

  const handleAddCustomTreatment = () => {
    if (!customName.trim()) return;
    const newItem: BookedTreatmentItem = {
      id: `custom-${Date.now()}`,
      title: customName.trim(),
      duration: customDuration,
      price: Number(customPrice) > 0 ? Number(customPrice) : 25,
      category: 'custom',
      isCustom: true,
    };
    setAdditionalTreatments(prev => [...prev, newItem]);
    setCustomName('');
  };

  const handleRemoveAdditionalTreatment = (id: string) => {
    setAdditionalTreatments(prev => prev.filter(item => item.id !== id));
  };

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
        isCourse: isCoursePackage,
        savings: savingsAmount,
        treatments: allBookedTreatments,
      });
      setConfirmationCode(generatedCode);

      const treatmentsFormatted = allBookedTreatments
        .map((t, idx) => `${idx + 1}. ${t.title} (${t.duration} • £${t.price.toFixed(2)})`)
        .join(' + ');

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
          serviceTitle: treatmentsFormatted,
          skincareProduct: 'clinicare',
          duration: `${allBookedTreatments.length} treatment(s) • Total ~${allBookedTreatments.reduce((acc, curr) => {
            const mins = parseInt(curr.duration) || 30;
            return acc + mins;
          }, 0)} mins`,
          scheduledDate: selectedDate,
          scheduledTime: selectedTime,
          isPackageCourse: isCoursePackage,
          savingsAmount: savingsAmount,
          totalSessions: isCoursePackage ? 4 : 1,
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
            previewText: isCoursePackage
              ? `New Booking: ${formData.name} • Treatments: ${treatmentsFormatted} • 4-Course (Buy 3, Get 1 FREE) • 50% Deposit £${downpaymentAmount.toFixed(2)} Paid`
              : `New Booking: ${formData.name} • Treatments: ${treatmentsFormatted} • 50% Deposit £${downpaymentAmount.toFixed(2)} Paid`,
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
        ownerNotes: isCoursePackage
          ? `4-Session Course (Buy 3, Get 1 FREE). Client chosen treatments: ${treatmentsFormatted}. Total fee: £${totalFee.toFixed(2)} (Saved £${savingsAmount.toFixed(2)}). 50% deposit £${downpaymentAmount.toFixed(2)} received online. Remaining balance £${remainingBalance.toFixed(2)} due on arrival. 1st session: ${selectedDate} at ${selectedTime}.`
          : `Online booking via website. Client chosen treatments: ${treatmentsFormatted}. Total fee: £${totalFee.toFixed(2)}. 50% deposit £${downpaymentAmount.toFixed(2)} received online. Balance £${remainingBalance.toFixed(2)} due on arrival.`,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl lg:max-w-5xl bg-[#FFF9F9] rounded-2xl shadow-2xl border border-[#E8BAC0]/60 overflow-hidden my-4 sm:my-6 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-[#5C423E] text-white p-4 sm:p-6 flex items-center justify-between relative gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={step === 'payment' ? () => setStep('details') : step === 'confirmed' ? resetForm : onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold tracking-wider transition-all cursor-pointer border border-white/20"
              title={step === 'payment' ? "Back to Step 1 Details" : "Back to Website"}
              aria-label="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#E8BAC0]" />
              <span>Back</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#E8BAC0] font-semibold font-sans-clean">
                  RESERVATION SANCTUARY
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#BE757C] text-white">
                  50% Deposit Policy
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-display mt-0.5">
                Book Your Wellness Ritual &amp; Custom Treatments
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="bg-[#FAF0F2] border-b border-[#F0D0D5] px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-[#5C4A45] shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === 'details' ? 'bg-[#BE757C] text-white' : 'bg-emerald-700 text-white'
            }`}>
              {step === 'details' ? '1' : '✓'}
            </span>
            <span className={step === 'details' ? 'font-bold text-[#3D2B27]' : 'font-medium'}>
              Treatment Selection &amp; Calculation
            </span>
          </div>

          <div className="w-6 sm:w-12 h-[1px] bg-[#E8BAC0]" />

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

          <div className="w-6 sm:w-12 h-[1px] bg-[#E8BAC0]" />

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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: APPOINTMENT DETAILS & TREATMENT CALCULATION */}
            {step === 'details' && (
              <motion.form
                key="step-details"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleDetailsSubmit}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* COLUMN 1: WHAT KIND OF TREATMENTS CLIENTS WANT TO DO */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="pb-1 border-b border-[#F0D5D8]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2B27] font-sans-clean flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#BE757C]" />
                        <span>1. What Kind of Treatments Would You Like to Do?</span>
                      </h4>
                      <p className="text-[11px] text-[#7A5852] mt-0.5">
                        Select your ritual, choose enhancements, or fill up custom treatment requests below to dynamically calculate your total.
                      </p>
                    </div>

                    {/* Primary Treatment Selection Card */}
                    <div className="bg-white p-4 rounded-2xl border border-[#E8BAC0] shadow-xs space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C4A45] mb-1.5 font-sans-clean">
                          Select Primary Ritual:
                        </label>
                        <select
                          value={selectedServiceId}
                          onChange={(e) => setSelectedServiceId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF9F9] border border-[#E8BAC0] text-xs sm:text-sm text-[#3D2B27] font-medium focus:outline-hidden focus:border-[#BE757C]"
                        >
                          <optgroup label="🔬 Facial Cosmeceuticals & Peels">
                            {SPA_SERVICES.filter(s => s.category === 'facial').map(s => (
                              <option key={s.id} value={s.id}>{s.title} — {s.priceDisplay}</option>
                            ))}
                          </optgroup>
                          <optgroup label="💆‍♀️ Body & Hot Stone Massages">
                            {SPA_SERVICES.filter(s => s.category === 'body-massage' || s.category === 'hot-stone').map(s => (
                              <option key={s.id} value={s.id}>{s.title} — {s.priceDisplay}</option>
                            ))}
                          </optgroup>
                          <optgroup label="💎 Curated Packages & Courses">
                            {SPA_SERVICES.filter(s => s.category === 'packages' || s.category === 'addons').map(s => (
                              <option key={s.id} value={s.id}>{s.title} — {s.priceDisplay}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Duration choice if service supports 30 / 60 mins */}
                      {hasMultipleDurations && (
                        <div className="pt-2 border-t border-[#F5E6E8] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#5C4A45] uppercase">
                              Ritual Duration:
                            </span>
                            <span className="text-[10px] font-semibold text-[#8C3F48] bg-[#FFF0F2] px-2 py-0.5 rounded border border-[#F0D0D5]">
                              🔬 CLINICARE Swedish Cosmeceuticals
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDuration('30')}
                              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                                selectedDuration === '30'
                                  ? 'bg-[#BE757C] text-white border-[#A9636A] shadow-2xs'
                                  : 'bg-[#FFF9F9] text-[#5C4A45] border-[#E8BAC0] hover:bg-[#FAF0F2]'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>30m Express (£{opt30?.priceClinicare ?? opt30?.priceSingle ?? 35})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedDuration('60')}
                              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                                selectedDuration === '60'
                                  ? 'bg-[#BE757C] text-white border-[#A9636A] shadow-2xs'
                                  : 'bg-[#FFF9F9] text-[#5C4A45] border-[#E8BAC0] hover:bg-[#FAF0F2]'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>60m Full Ritual (£{opt60?.priceClinicare ?? opt60?.priceSingle ?? 65})</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Add Enhancements / Complementary Treatments */}
                    <div className="bg-white p-4 rounded-2xl border border-[#E8BAC0] shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#5C4A45] font-sans-clean flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-[#BE757C]" />
                          <span>Add Complementary Treatments / Enhancements:</span>
                        </label>
                        <span className="text-[10px] text-[#7A5852]">Click to add</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {COMPLEMENTARY_ADDONS.map((addon) => {
                          const isAdded = additionalTreatments.some(item => item.id === addon.id);
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => handleToggleAddon(addon)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isAdded
                                  ? 'bg-[#FFF0F2] border-[#BE757C] text-[#8C3F48] shadow-2xs ring-1 ring-[#BE757C]/40'
                                  : 'bg-[#FFF9F9] border-[#E8BAC0] text-[#5C4A45] hover:border-[#BE757C]/60 hover:bg-white'
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="block text-xs font-bold truncate text-[#3D2B27]">{addon.title}</span>
                                <span className="text-[10px] text-[#7A5852]">{addon.duration} • {addon.tag}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="block text-xs font-bold text-[#BE757C]">£{addon.price}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isAdded ? 'bg-[#BE757C] text-white' : 'bg-white border border-[#E8BAC0] text-[#5C4A45]'
                                }`}>
                                  {isAdded ? '✓ Added' : '+ Add'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dedicated Column Section: Fill Up Custom / Bespoke Treatments */}
                    <div className="bg-gradient-to-br from-[#FFF5F7] to-[#FAF0F2] p-4 rounded-2xl border border-[#F0D0D5] shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#8C3F48] font-sans-clean flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#BE757C]" />
                          <span>Fill Up Custom Treatment Column:</span>
                        </label>
                        <span className="text-[10px] text-[#8C3F48] font-semibold bg-white px-2 py-0.5 rounded-full border border-[#F0D0D5]">
                          Bespoke Request
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C4A45] leading-relaxed">
                        Want a bespoke treatment or target area (e.g. Neck &amp; Décolleté peel, Back extractions, Rose Quartz Gua Sha)? Type it below to calculate the price into your total:
                      </p>

                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g. Neck &amp; Décolleté Firming Treatment, Extra Pore Extraction..."
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8BAC0] text-xs sm:text-sm text-[#3D2B27] placeholder:text-[#5C4A45]/50 focus:outline-hidden focus:border-[#BE757C]"
                        />

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#5C4A45] mb-1">
                              Duration:
                            </label>
                            <select
                              value={customDuration}
                              onChange={(e) => setCustomDuration(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E8BAC0] text-xs text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                            >
                              <option value="15 mins">15 mins Express</option>
                              <option value="30 mins">30 mins Targeted</option>
                              <option value="45 mins">45 mins Intensive</option>
                              <option value="60 mins">60 mins Full Ritual</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase text-[#5C4A45] mb-1">
                              Price (£):
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A5852]">£</span>
                              <input
                                type="number"
                                min="5"
                                step="1"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-white border border-[#E8BAC0] text-xs font-bold text-[#BE757C] focus:outline-hidden focus:border-[#BE757C]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quick Price Suggestions */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-[#7A5852] font-medium">Quick Suggestions:</span>
                          {[15, 20, 25, 35, 45, 60].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setCustomPrice(p)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all border ${
                                customPrice === p
                                  ? 'bg-[#BE757C] text-white border-[#A9636A]'
                                  : 'bg-white text-[#5C4A45] border-[#E8BAC0] hover:bg-[#FAF0F2]'
                              }`}
                            >
                              £{p}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={!customName.trim()}
                          onClick={handleAddCustomTreatment}
                          className="w-full py-2 px-3 rounded-xl bg-[#BE757C] hover:bg-[#A9636A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Treatment to Calculation Column</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: PRICE CALCULATION & APPOINTMENT DETAILS */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="pb-1 border-b border-[#F0D5D8]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2B27] font-sans-clean flex items-center gap-2">
                        <Calculator className="w-3.5 h-3.5 text-[#BE757C]" />
                        <span>2. Price Calculation &amp; Details</span>
                      </h4>
                      <p className="text-[11px] text-[#7A5852] mt-0.5">
                        Live itemized breakdown and dynamic 50% deposit calculation.
                      </p>
                    </div>

                    {/* Itemized Treatments Calculation Box */}
                    <div className="bg-white rounded-2xl p-4 border border-[#E8BAC0] shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#F5E6E8]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C4A45] font-sans-clean">
                          Treatments to Do ({allBookedTreatments.length})
                        </span>
                        <span className="text-[10px] text-[#7A5852]">
                          Est: ~{allBookedTreatments.reduce((acc, curr) => acc + (parseInt(curr.duration) || 30), 0)} mins
                        </span>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {allBookedTreatments.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FFF9F9] border border-[#F0D0D5]/70 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-[#3D2B27] truncate">{item.title}</span>
                                {item.isCustom && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FBE8EB] text-[#8C3F48] font-bold">
                                    Bespoke
                                  </span>
                                )}
                                {item.isAddon && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#EBF6FF] text-[#1E40AF] font-bold">
                                    Add-on
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#7A5852] block">{item.duration}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-[#BE757C]">£{item.price.toFixed(2)}</span>
                              {item.id !== `primary-${currentService.id}` && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdditionalTreatment(item.id)}
                                  className="p-1 rounded text-[#7A5852] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Remove treatment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Financial Calculation Breakdown */}
                      <div className="pt-2.5 border-t border-[#F5E6E8] space-y-1.5 text-xs">
                        <div className="flex justify-between text-[#5C4A45]">
                          <span>Treatments Subtotal:</span>
                          <span className="font-medium">£{treatmentsSubtotal.toFixed(2)}</span>
                        </div>

                        {isCoursePackage && (
                          <div className="flex justify-between text-emerald-700 font-semibold text-[11px]">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-600" /> 4th Session FREE Course:
                            </span>
                            <span>-£{savingsAmount.toFixed(2)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-baseline pt-1.5 border-t border-[#F0D0D5] text-[#3D2B27] font-bold text-sm">
                          <span>{isCoursePackage ? 'Course Total (Pay 3):' : 'Total Session Fee:'}</span>
                          <span className="text-base text-[#BE757C] font-display">£{totalFee.toFixed(2)}</span>
                        </div>

                        {/* 50% Deposit Callout */}
                        <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-br from-[#FFF5F7] to-[#FAF0F2] border border-[#BE757C]/40 flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-[#BE757C]">
                              💳 50% Deposit Due Today:
                            </span>
                            <span className="text-[10px] text-[#7A5852]">
                              Remaining £{remainingBalance.toFixed(2)} on arrival
                            </span>
                          </div>
                          <span className="text-xl font-bold font-display text-[#BE757C]">
                            £{downpaymentAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Date & Time Picker */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#5C4A45] mb-1">
                          Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E8BAC0] text-xs text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#5C4A45] mb-1">
                          Time Slot *
                        </label>
                        <select
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E8BAC0] text-xs text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        >
                          {timeSlots.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Guest Information */}
                    <div className="space-y-2 pt-2 border-t border-[#F0D5D8]">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3D2B27]">
                        Guest Information:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Full Name *"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E8BAC0] text-xs text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Phone Number *"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E8BAC0] text-xs text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        />
                      </div>
                      <input
                        type="email"
                        placeholder="Email (for instant confirmation &amp; receipt)"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E8BAC0] text-xs text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                      />
                      <input
                        type="text"
                        placeholder="Special requests or skin sensitivities (optional)"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E8BAC0] text-xs text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                      />
                    </div>

                    {/* Proceed & Back Buttons */}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2.5 rounded-full border border-[#BE757C] text-[#BE757C] hover:bg-[#FAF0F2] font-semibold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          title="Back to Treatments Menu"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 px-4 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Proceed to 50% Deposit (£{downpaymentAmount.toFixed(2)})</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-[#5C4A45]/75 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3 text-[#BE757C]" />
                        <span>Secure checkout. 50% deposit taken today, remaining balance at sanctuary.</span>
                      </p>
                    </div>
                  </div>

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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#BE757C] font-sans-clean">
                          RESERVATION SUMMARY
                        </span>
                        {isCoursePackage && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                            Buy 3, Get 1 FREE Course
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-display font-semibold text-[#3D2B27]">
                        {allBookedTreatments.length === 1
                          ? `${currentService.title} ${isCoursePackage ? '(Course of 4 Sessions)' : ''}`
                          : `${allBookedTreatments.length} Treatments Selected ${isCoursePackage ? '(Course of 4 Sessions)' : ''}`}
                      </h4>
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                        {allBookedTreatments.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-[#5C4A45] bg-[#FAF0F2] px-2 py-1 rounded">
                            <span className="truncate mr-2 font-medium text-[#3D2B27]">
                              {idx + 1}. {t.title} <span className="text-[#7A5852] text-[10px]">({t.duration})</span>
                            </span>
                            <span className="font-bold text-[#BE757C] shrink-0">£{t.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-[#5C4A45] mt-1.5 pt-1.5 border-t border-[#F5E6E8]">
                        {isCoursePackage ? '4 Sessions Total (Pay for 3, 4th FREE) • ' : ''}
                        {selectedDate} at {selectedTime}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase text-[#7A5852] block">
                        {isCoursePackage ? 'Course Total (Pay 3)' : 'Total Fee'}
                      </span>
                      <span className="text-base font-bold text-[#3D2B27]">£{totalFee.toFixed(2)}</span>
                      {isCoursePackage && (
                        <span className="block text-[10px] text-emerald-700 font-semibold">
                          Saved £{savingsAmount.toFixed(2)}
                        </span>
                      )}
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
                        {isCoursePackage
                          ? `Remaining £${remainingBalance.toFixed(2)} due on arrival for Session 1`
                          : `Remaining £${remainingBalance.toFixed(2)} due at sanctuary arrival`}
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

                {/* Security & 50% Deposit Policy Notice */}
                <div className="p-3.5 rounded-xl bg-[#FFF5F7] border border-[#F0D0D5] flex items-start gap-2.5 text-xs text-[#5C4A45]">
                  <ShieldCheck className="w-4 h-4 text-[#BE757C] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-[#3D2B27] flex items-center justify-between flex-wrap gap-1">
                      <span>50% Deposit Policy &amp; Cancellation Rights</span>
                      {onOpenTerms && (
                        <button
                          type="button"
                          onClick={onOpenTerms}
                          className="text-[#BE757C] hover:underline font-bold text-[11px] cursor-pointer inline-flex items-center gap-0.5"
                        >
                          View Full Terms &rarr;
                        </button>
                      )}
                    </p>
                    <p className="text-[11px] text-[#7A5852] leading-relaxed">
                      A 50% deposit (£{downpaymentAmount.toFixed(2)}) is required to confirm your booking. The remaining 50% is due upon arrival. Cancellations made 24+ hours prior receive a 100% full refund. Deposits are not automatically non-refundable under UK consumer fairness rules.
                    </p>
                  </div>
                </div>

                {/* Submit Payment CTA */}
                <div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      disabled={isProcessingPayment}
                      className="w-full sm:w-auto px-5 py-3.5 rounded-full border border-[#BE757C] text-[#BE757C] hover:bg-[#FAF0F2] font-semibold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                      title="Back to Appointment Details"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Details</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingPayment}
                      className="w-full sm:flex-1 py-3.5 px-6 rounded-full bg-[#BE757C] hover:bg-[#A9636A] disabled:opacity-75 text-white font-medium text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
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
                  </div>
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

                    <div className="space-y-1 py-1">
                      <div className="flex justify-between text-[#5C4A45]">
                        <span>Treatment Ritual(s):</span>
                        <span className="font-semibold text-[#3D2B27]">{paidSummary.isCourse ? '4-Session Course (Buy 3, Get 1 FREE)' : 'Standard Booking'}</span>
                      </div>
                      <div className="bg-[#FAF0F2] rounded-lg p-2 space-y-1">
                        {(paidSummary.treatments && paidSummary.treatments.length > 0
                          ? paidSummary.treatments
                          : allBookedTreatments
                        ).map((t, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="font-medium text-[#3D2B27] truncate mr-2">
                              {idx + 1}. {t.title} <span className="text-[#7A5852] text-[10px]">({t.duration})</span>
                            </span>
                            <span className="font-bold text-[#BE757C] shrink-0">£{t.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {paidSummary.isCourse && (
                      <div className="flex justify-between bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Course Promotion:
                        </span>
                        <span className="font-bold text-emerald-800 text-right">
                          Buy 3, Get 1 FREE (Saved £{paidSummary.savings?.toFixed(2)})
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-[#5C4A45]">Skincare Formulation:</span>
                      <span className="font-bold text-[#BE757C]">
                        🔬 CLINICARE (Medical Cosmeceuticals)
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#5C4A45]">{paidSummary.isCourse ? '1st Session Date & Time:' : 'Scheduled Date & Time:'}</span>
                      <span className="font-bold text-[#BE757C]">{selectedDate} at {selectedTime}</span>
                    </div>

                    {paidSummary.isCourse && (
                      <div className="flex justify-between text-[11px] text-[#7A5852] italic">
                        <span>Remaining Sessions:</span>
                        <span className="text-right">3 sessions scheduled flexibly with therapist</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-[#5C4A45]">Payment Method:</span>
                      <span className="font-medium text-[#3D2B27]">{paidSummary.cardLast4}</span>
                    </div>
                  </div>

                  {/* Financial Breakdown in Receipt */}
                  <div className="pt-2.5 border-t border-[#F5E6E8] space-y-1.5 bg-[#FAF0F2] -mx-5 -mb-5 p-4 rounded-b-xl">
                    <div className="flex justify-between text-[#5C4A45]">
                      <span>{paidSummary.isCourse ? 'Course Total Fee (Paid for 3):' : 'Total Treatment Fee:'}</span>
                      <span className="font-medium">£{paidSummary.total.toFixed(2)}</span>
                    </div>
                    {paidSummary.isCourse && (
                      <div className="flex justify-between text-emerald-700 text-[11px] font-semibold">
                        <span>Complimentary 4th Session:</span>
                        <span>FREE (-£{paidSummary.savings?.toFixed(2)})</span>
                      </div>
                    )}
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
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#5C423E] hover:bg-[#4A352F] text-white text-xs tracking-widest uppercase font-medium transition-all cursor-pointer shadow-xs"
                    title="Return / Back to Sanctuary"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Website</span>
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

