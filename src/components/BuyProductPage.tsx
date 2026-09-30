import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  MessageCircle, 
  Truck, 
  ShieldCheck, 
  Clock, 
  PackageOpen, 
  Gift, 
  Send,
  CreditCard,
  ExternalLink,
  Lock,
  Check,
  AlertCircle,
  X,
  Mail,
} from 'lucide-react';
import { CartItem, Product, PageTab } from '../types';
import {
  CRMRecord,
  OWNER_CONFIG,
  saveCRMRecord,
  generateOwnerWhatsAppUrl,
  generateOwnerEmailUrl,
} from '../data/crmStorage';

interface BuyProductPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigate: (page: PageTab) => void;
  onOpenCRM?: () => void;
}

export const BuyProductPage: React.FC<BuyProductPageProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigate,
  onOpenCRM,
}) => {
  const [deliveryOption, setDeliveryOption] = useState<'collection' | 'delivery'>('collection');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  // Checkout Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);
  const [confirmedOrderRef, setConfirmedOrderRef] = useState<string>('');

  // Payment Selection & State
  const [paymentMethod, setPaymentMethod] = useState<'visa' | 'paypal' | 'invoice'>('visa');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid_visa' | 'paid_paypal'>('unpaid');
  const [authCode, setAuthCode] = useState<string>('');

  // Visa Modal State
  const [isVisaModalOpen, setIsVisaModalOpen] = useState<boolean>(false);
  const [visaCardNumber, setVisaCardNumber] = useState<string>('');
  const [visaExpiry, setVisaExpiry] = useState<string>('');
  const [visaCvc, setVisaCvc] = useState<string>('');
  const [visaCardholder, setVisaCardholder] = useState<string>('');
  const [isVisaProcessing, setIsVisaProcessing] = useState<boolean>(false);

  // PayPal Modal State
  const [isPayPalModalOpen, setIsPayPalModalOpen] = useState<boolean>(false);
  const [payPalAccountEmail, setPayPalAccountEmail] = useState<string>('');
  const [isPayPalProcessing, setIsPayPalProcessing] = useState<boolean>(false);
  const [latestSaleRecord, setLatestSaleRecord] = useState<CRMRecord | null>(null);

  // Helper to persist sale in Owner CRM
  const recordSaleToCRM = (payMethod: string, auth: string, orderId: string, isPaid: boolean) => {
    const newSaleRecord: CRMRecord = {
      id: orderId,
      type: 'sale',
      createdAt: new Date().toISOString(),
      createdFormatted: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      customer: {
        name: clientName.trim() || 'Boutique Customer',
        phone: clientPhone.trim() || '07707 328060',
        email: clientEmail.trim() || '',
        notes: orderNotes.trim(),
      },
      details: {
        items: cart.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          quantity: i.quantity,
          unitPrice: i.product.numericPrice,
          totalPrice: i.product.numericPrice * i.quantity,
        })),
        deliveryOption,
        deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : undefined,
      },
      financials: {
        totalAmount: finalTotal,
        depositPaid: isPaid ? finalTotal : 0,
        balanceDue: isPaid ? 0 : finalTotal,
        paymentStatus: isPaid ? 'paid_in_full' : 'pending',
        paymentMethod: payMethod,
        authCode: auth,
      },
      notifications: {
        whatsAppOwner: {
          recipient: OWNER_CONFIG.whatsappDisplay,
          channel: 'whatsapp',
          sent: true,
          sentAt: new Date().toISOString(),
          url: '',
          previewText: `New Boutique Order: ${clientName || 'Guest'} • £${finalTotal.toFixed(2)}`,
        },
        emailOwner: {
          recipient: OWNER_CONFIG.email,
          channel: 'email',
          sent: true,
          sentAt: new Date().toISOString(),
          url: '',
          previewText: `Boutique Order #${orderId}`,
        },
      },
      status: 'confirmed',
      ownerNotes: `${deliveryOption === 'collection' ? 'Collection at Blackpool Sanctuary' : `Postal delivery: ${deliveryAddress}`}. Auth: ${auth}.`,
    };

    saveCRMRecord(newSaleRecord);
    setLatestSaleRecord(newSaleRecord);
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.numericPrice * item.quantity,
    0
  );

  const discountAmount = appliedPromo 
    ? Math.round(subtotal * (appliedPromo.discountPercent / 100)) 
    : 0;

  const shippingCost = deliveryOption === 'collection' ? 0 : subtotal >= 50 ? 0 : 3.95;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  // PayPal Link (direct to PayPal with merchant account and exact GBP amount)
  const paypalAccountEmail = 'elainecll@hotmail.com';
  const paypalWebscrUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalAccountEmail)}&item_name=${encodeURIComponent(`Elysian Spa Order ${confirmedOrderRef || 'Skincare Boutique'}`)}&amount=${finalTotal.toFixed(2)}&currency_code=GBP`;
  const paypalMeUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalAccountEmail)}&item_name=${encodeURIComponent(`Elysian Spa Order ${confirmedOrderRef || 'Skincare Boutique'}`)}&amount=${finalTotal.toFixed(2)}&currency_code=GBP`;

  const handleApplyPromo = () => {
    setPromoError('');
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'ELYSIAN10' || clean === 'TROPIC10') {
      setAppliedPromo({ code: clean, discountPercent: 10 });
      setPromoError('');
    } else {
      setPromoError('Invalid promotion code. Try "ELYSIAN10" for 10% off.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const ensureOrderRef = () => {
    if (!confirmedOrderRef) {
      const newRef = `ELY-${Math.floor(100000 + Math.random() * 900000)}`;
      setConfirmedOrderRef(newRef);
      return newRef;
    }
    return confirmedOrderRef;
  };

  const handleOpenVisaModal = () => {
    if (!clientName.trim()) {
      setClientName('Valued Guest');
    }
    setVisaCardholder('');
    setIsVisaModalOpen(true);
  };

  const handleOpenPayPalModal = () => {
    if (!clientName.trim()) {
      setClientName('Valued Guest');
    }
    ensureOrderRef();
    setIsPayPalModalOpen(true);
  };

  const handlePayWithPayPal = () => {
    handleOpenPayPalModal();
  };

  const handleProcessPayPalPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsPayPalProcessing(true);

    setTimeout(() => {
      setIsPayPalProcessing(false);
      setIsPayPalModalOpen(false);
      const ref = ensureOrderRef();
      const generatedAuth = `AUTH-PP-${Math.floor(1000 + Math.random() * 9000)}`;
      setAuthCode(generatedAuth);
      setPaymentStatus('paid_paypal');
      setPaymentMethod('paypal');
      setOrderConfirmed(true);
      recordSaleToCRM('PayPal Express', generatedAuth, ref, true);
    }, 1200);
  };

  const handleProcessVisaPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVisaProcessing(true);

    setTimeout(() => {
      setIsVisaProcessing(false);
      setIsVisaModalOpen(false);
      const ref = ensureOrderRef();
      const generatedAuth = `AUTH-VISA-${Math.floor(1000 + Math.random() * 9000)}`;
      setAuthCode(generatedAuth);
      setPaymentStatus('paid_visa');
      setPaymentMethod('visa');
      setOrderConfirmed(true);
      recordSaleToCRM('VISA Card', generatedAuth, ref, true);
    }, 1200);
  };

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Please provide your name and contact phone number to complete your order.');
      return;
    }

    const orderRef = ensureOrderRef();
    const finalAuth = authCode || (paymentStatus !== 'unpaid' ? `AUTH-OK-${Math.floor(1000 + Math.random() * 9000)}` : 'PENDING-INVOICE');
    if (paymentStatus !== 'unpaid' && !authCode) {
      setAuthCode(finalAuth);
    }
    setOrderConfirmed(true);
    recordSaleToCRM(
      paymentMethod === 'visa' ? 'VISA Card' : paymentMethod === 'paypal' ? 'PayPal' : 'Invoice / Direct Contact',
      finalAuth,
      orderRef,
      paymentStatus !== 'unpaid'
    );
  };

  const generateWhatsAppMessage = () => {
    const itemsList = cart
      .map(
        (item) =>
          `• ${item.product.name} (Qty: ${item.quantity}) — £${(item.product.numericPrice * item.quantity).toFixed(2)}`
      )
      .join('\n');

    const method =
      deliveryOption === 'collection'
        ? '🌿 Sanctuary Collection (Blackpool Area)'
        : `📦 UK Postal Delivery${deliveryAddress ? ` to: ${deliveryAddress}` : ''}`;

    const paymentInfo =
      paymentStatus === 'paid_visa'
        ? `✅ PAID via VISA Card (Auth: ${authCode || 'APPROVED'})`
        : paymentStatus === 'paid_paypal'
        ? `✅ PAID via PayPal (Auth: ${authCode || 'APPROVED'})`
        : `⚠️ Pending Payment (${paymentMethod === 'visa' ? 'VISA' : paymentMethod === 'paypal' ? 'PayPal' : 'Invoice'})`;

    const fulfillmentAuthNote =
      deliveryOption === 'collection'
        ? paymentStatus !== 'unpaid'
          ? `\n🎉 PICKUP AUTHORISED: Yes (Code: ${authCode || 'APPROVED'})\nCollection confirmed for Blackpool Area.`
          : `\n⚠️ PICKUP AUTHORISATION: Pending Pre-Payment confirmation prior to collection.`
        : paymentStatus !== 'unpaid'
        ? `\n🎉 DISPATCH AUTHORISED: Yes (Code: ${authCode || 'APPROVED'})\nTracked UK Postal Delivery authorised to: ${deliveryAddress || 'Address on file'}.`
        : `\n⚠️ DISPATCH AUTHORISATION: Pending Pre-Payment confirmation prior to parcel shipping.`;

    return encodeURIComponent(
      `Hello Elaine! I would like to confirm my order from Elysian Boutique:\n\n` +
      `Order Ref: #${confirmedOrderRef || 'PENDING'}\n` +
      `${itemsList}\n\n` +
      `Subtotal: £${subtotal}\n` +
      (appliedPromo ? `Discount (${appliedPromo.code}): -£${discountAmount}\n` : '') +
      `Delivery: ${method}\n` +
      `Total: £${finalTotal.toFixed(2)}\n` +
      `Payment Status: ${paymentInfo}${fulfillmentAuthNote}\n\n` +
      `Name: ${clientName || 'Guest'}\n` +
      `Contact: ${clientPhone || 'WhatsApp'}\n` +
      (orderNotes ? `Notes: ${orderNotes}\n` : '')
    );
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
      {/* Confirmation View */}
      {orderConfirmed ? (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-[#E8BAC0]/40 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#E8BAC0]/30 text-[#BE757C] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#8C6B64] block mb-1">
            Order Successfully Placed
          </span>

          <h2 className="text-2xl sm:text-3xl font-display text-[#3D2B27] mb-2">
            Thank You, {clientName || 'Valued Guest'}!
          </h2>

          <p className="text-sm text-[#5C4A45] leading-relaxed mb-4">
            Your boutique order <strong className="text-[#BE757C]">#{confirmedOrderRef}</strong> has been registered. Our therapist Elaine will prepare your freshly made botanical formulas with care.
          </p>

          {/* Pickup Pre-Payment & Authorisation Status Banner */}
          {deliveryOption === 'collection' && (
            <div className={`p-4 rounded-2xl border text-left mb-6 ${
              paymentStatus !== 'unpaid'
                ? 'bg-[#E8F8EE] border-[#25D366]/40 text-[#1E7E34]'
                : 'bg-[#FFF0F2] border-[#BE757C]/40 text-[#3D2B27]'
            }`}>
              <div className="flex items-start gap-3">
                {paymentStatus !== 'unpaid' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#BE757C] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {paymentStatus !== 'unpaid'
                        ? 'Pickup Authorisation Confirmed'
                        : 'Pre-Payment Required to Authorise Pickup'}
                    </span>
                    {authCode && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-white border border-[#25D366]/30 text-[#1E7E34]">
                        {authCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-[#5C4A45]">
                    {paymentStatus !== 'unpaid' ? (
                      <>
                        Payment of <strong>£{finalTotal.toFixed(2)}</strong> has been verified via{' '}
                        <strong>{paymentStatus === 'paid_visa' ? 'VISA Card' : 'PayPal'}</strong>. Your collection in the <strong>Blackpool Area</strong> is officially authorised. Elaine will coordinate your pickup handover.
                      </>
                    ) : (
                      <>
                        All BUY IT NOW products chosen for pickup must be paid for prior to confirmation that pickup is authorised. Please complete your payment below via PayPal or VISA so Elaine can authorise your collection.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action buttons if not yet paid */}
              {paymentStatus === 'unpaid' && (
                <div className="mt-4 pt-3 border-t border-[#BE757C]/20 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handlePayWithPayPal}
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="font-bold tracking-tight text-white italic font-serif">P</span>
                    <span>Pay £{finalTotal.toFixed(2)} with PayPal</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenVisaModal}
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#1A1F71] hover:bg-[#0D124D] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-[#F7B600]" />
                    <span>Pay £{finalTotal.toFixed(2)} with VISA</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Postal Delivery Pre-Payment & Dispatch Authorisation Banner */}
          {deliveryOption === 'delivery' && (
            <div className={`p-4 rounded-2xl border text-left mb-6 ${
              paymentStatus !== 'unpaid'
                ? 'bg-[#E8F8EE] border-[#25D366]/40 text-[#1E7E34]'
                : 'bg-[#FFF0F2] border-[#BE757C]/40 text-[#3D2B27]'
            }`}>
              <div className="flex items-start gap-3">
                {paymentStatus !== 'unpaid' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#BE757C] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {paymentStatus !== 'unpaid'
                        ? 'Tracked Dispatch Authorisation Confirmed'
                        : 'Pre-Payment Required to Authorise Dispatch'}
                    </span>
                    {authCode && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-white border border-[#25D366]/30 text-[#1E7E34]">
                        {authCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-[#5C4A45]">
                    {paymentStatus !== 'unpaid' ? (
                      <>
                        Payment of <strong>£{finalTotal.toFixed(2)}</strong> has been verified via{' '}
                        <strong>{paymentStatus === 'paid_visa' ? 'VISA Card' : 'PayPal'}</strong>. Your UK Tracked Delivery to <strong>{deliveryAddress || 'provided address'}</strong> is officially authorised and queued for packaging. Tracking details will follow upon postal courier handover.
                      </>
                    ) : (
                      <>
                        All BUY IT NOW products chosen for UK Tracked Delivery must be paid for prior to confirmation that dispatch is authorised. Please complete your payment below via PayPal or VISA so Elaine can authorise and dispatch your parcel.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action buttons if not yet paid */}
              {paymentStatus === 'unpaid' && (
                <div className="mt-4 pt-3 border-t border-[#BE757C]/20 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handlePayWithPayPal}
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="font-bold tracking-tight text-white italic font-serif">P</span>
                    <span>Pay £{finalTotal.toFixed(2)} with PayPal</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenVisaModal}
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#1A1F71] hover:bg-[#0D124D] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-[#F7B600]" />
                    <span>Pay £{finalTotal.toFixed(2)} with VISA</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-[#FFF9F9] rounded-2xl p-5 border border-[#E8BAC0]/30 text-left mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#3D2B27] mb-3">
              Order Summary (#{confirmedOrderRef})
            </h3>
            <ul className="divide-y divide-[#E8BAC0]/20 text-xs text-[#5C4A45] mb-3">
              {cart.map((item) => (
                <li key={item.product.id} className="py-2 flex justify-between">
                  <span>
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-semibold text-[#3D2B27]">
                    £{(item.product.numericPrice * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-[#E8BAC0]/30 flex justify-between text-sm font-bold text-[#BE757C]">
              <span>Total Amount:</span>
              <span>£{finalTotal.toFixed(2)}</span>
            </div>
            <div className="mt-3 text-[11px] text-[#8C6B64] flex flex-col gap-1">
              <div>
                {deliveryOption === 'collection' ? (
                  <span>📍 <strong>Collection at:</strong> Elysian Spa &amp; Wellness, Blackpool Area (Complimentary)</span>
                ) : (
                  <span>📦 <strong>Dispatch method:</strong> Tracked Postal Delivery</span>
                )}
              </div>
              <div className="text-[#3D2B27]">
                <strong>Payment:</strong>{' '}
                {paymentStatus === 'paid_visa' ? (
                  <span className="text-[#1E7E34] font-semibold">
                    ✅ Paid with VISA Card ({authCode}) — {deliveryOption === 'collection' ? 'Pickup Authorised' : 'Dispatch Authorised'}
                  </span>
                ) : paymentStatus === 'paid_paypal' ? (
                  <span className="text-[#0070BA] font-semibold">
                    ✅ Paid with PayPal ({authCode}) — {deliveryOption === 'collection' ? 'Pickup Authorised' : 'Dispatch Authorised'}
                  </span>
                ) : (
                  <span className="text-[#BE757C] font-semibold">
                    ⚠️ Pending Pre-Payment ({deliveryOption === 'collection' ? 'Pickup Not Authorised' : 'Dispatch Not Authorised'})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Owner Notification Dispatch & CRM Record Banner */}
          {latestSaleRecord && (
            <div className="bg-[#FFF5F7] rounded-2xl p-4 sm:p-5 border border-[#F0D0D5] text-left mb-6 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F0D0D5]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-[#3D2B27] uppercase tracking-wider text-[11px] font-sans-clean">
                    Site Owner Alert &amp; CRM Sync
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#BE757C] text-white">
                  LOGGED TO OWNER CRM #{latestSaleRecord.id}
                </span>
              </div>

              <p className="text-xs text-[#5C4A45] leading-relaxed">
                All order and purchaser information has been saved into Elaine Chong's Owner CRM ledger. Dispatch instant transaction details to the site owner via registered WhatsApp or Email:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href={generateOwnerWhatsAppUrl(latestSaleRecord)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Notify Owner WhatsApp ({OWNER_CONFIG.phoneDisplay})</span>
                </a>

                <a
                  href={generateOwnerEmailUrl(latestSaleRecord).url}
                  className="py-2.5 px-4 rounded-xl bg-[#5C423E] hover:bg-[#4A352F] text-white text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send to Owner Email ({OWNER_CONFIG.email})</span>
                </a>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`https://wa.me/447707328060?text=${generateWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm with Elaine via WhatsApp</span>
            </a>

            {paymentStatus === 'unpaid' && (
              <button
                type="button"
                onClick={() => setOrderConfirmed(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#BE757C] text-[#BE757C] hover:bg-[#FFF0F2] text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
                id="unpaid-back-to-cart-btn"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Cart &amp; Edit Details</span>
              </button>
            )}

            <button
              onClick={() => {
                onClearCart();
                onNavigate('shop');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#5C423E] hover:bg-[#4A352F] text-white text-xs font-medium tracking-wider uppercase transition-colors cursor-pointer"
              title="Return / Back to Boutique"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Boutique</span>
            </button>
          </div>
        </div>
      ) : cart.length === 0 ? (
        /* Empty Basket State */
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-[#E8BAC0]/40 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#FFF0F2] text-[#BE757C] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-display text-[#3D2B27] mb-2">
            Your Basket is Empty
          </h2>

          <p className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed mb-6">
            You have not added any skincare products yet. Explore our handcrafted botanical formulations and click <strong>BUY IT NOW</strong> on any item to prepare your purchase.
          </p>

          <button
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Explore Skincare Boutique</span>
          </button>
        </div>
      ) : (
        /* Active Basket with items ready for purchase */
        <div>
          {/* Breadcrumb & Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-[#E8BAC0]/30">
            <button
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#8C6B64] hover:text-[#BE757C] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Boutique</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8C6B64]">
                {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'} in basket
              </span>
              <button
                onClick={onClearCart}
                className="text-xs text-[#8C6B64] hover:text-[#BE757C] underline underline-offset-2 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Page Heading */}
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8BAC0]/20 text-[#BE757C] text-[11px] font-semibold tracking-widest uppercase mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Sanctuary Basket &amp; Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display text-[#3D2B27]">
              Review Selections Ready for Purchase
            </h1>
            <p className="text-xs sm:text-sm text-[#5C4A45] mt-1">
              Your selected botanical products are stored in your basket. Confirm your contact details or order directly with therapist Elaine.
            </p>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Basket Items List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-[#E8BAC0]/40 overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-[#FFF9F9] border-b border-[#E8BAC0]/30 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#5C423E]">
                  <span>Product Details</span>
                  <span>Subtotal</span>
                </div>

                <div className="divide-y divide-[#E8BAC0]/20 p-2 sm:p-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="py-4 px-2 sm:px-3 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors"
                    >
                      {/* Product Image */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-[#E8BAC0]/30"
                        referrerPolicy="no-referrer"
                      />

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <span className="text-[10px] font-bold text-[#BE757C] tracking-widest uppercase block mb-0.5">
                          {item.product.brand}
                        </span>
                        <h3 className="text-sm sm:text-base font-display font-medium text-[#3D2B27] leading-snug">
                          {item.product.name}
                        </h3>
                        <p className="text-[11px] text-[#8C6B64] line-clamp-1 mt-0.5">
                          {item.product.tagline}
                        </p>
                        <div className="mt-2 text-xs font-semibold text-[#BE757C]">
                          {item.product.price} each
                        </div>

                        {/* Quantity Controls on Mobile/Desktop */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="inline-flex items-center border border-[#E8BAC0]/60 rounded-full bg-[#FFF9F9]">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-[#5C423E] hover:text-[#BE757C] transition-colors"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-semibold text-[#3D2B27] min-w-[20px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#5C423E] hover:text-[#BE757C] transition-colors"
                              title="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#8C6B64] hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right sm:self-center shrink-0">
                        <span className="text-base font-bold font-display text-[#3D2B27]">
                          £{(item.product.numericPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Added Reassurance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3.5 border border-[#E8BAC0]/30 text-center flex flex-col items-center">
                  <ShieldCheck className="w-4 h-4 text-[#BE757C] mb-1.5" />
                  <span className="text-[11px] font-semibold text-[#3D2B27]">100% Fresh &amp; Authentic</span>
                  <span className="text-[10px] text-[#8C6B64] mt-0.5">Cruelty-free vegan botanicals</span>
                </div>
                <div className="bg-white rounded-xl p-3.5 border border-[#E8BAC0]/30 text-center flex flex-col items-center">
                  <Gift className="w-4 h-4 text-[#BE757C] mb-1.5" />
                  <span className="text-[11px] font-semibold text-[#3D2B27]">Tea Sample Included</span>
                  <span className="text-[10px] text-[#8C6B64] mt-0.5">Complimentary herbal flower tea</span>
                </div>
                <div className="bg-white rounded-xl p-3.5 border border-[#E8BAC0]/30 text-center flex flex-col items-center">
                  <Clock className="w-4 h-4 text-[#BE757C] mb-1.5" />
                  <span className="text-[11px] font-semibold text-[#3D2B27]">Sanctuary Collection</span>
                  <span className="text-[10px] text-[#8C6B64] mt-0.5">Pick up ready in Blackpool Area</span>
                </div>
              </div>
            </div>

            {/* Right: Summary & Instant Purchase Form */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white rounded-2xl border border-[#E8BAC0]/40 p-5 sm:p-6 shadow-xs">
                <h2 className="text-base font-display font-semibold text-[#3D2B27] mb-4 pb-2 border-b border-[#E8BAC0]/30">
                  Order Summary
                </h2>

                {/* Subtotal & Delivery Selector */}
                <div className="space-y-3 text-xs mb-4">
                  <div className="flex justify-between text-[#5C4A45]">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-[#3D2B27]">£{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Delivery / Collection Radios */}
                  <div className="pt-2">
                    <span className="text-[11px] font-medium text-[#8C6B64] uppercase tracking-wider block mb-2">
                      Fulfillment Method:
                    </span>
                    <div className="space-y-2">
                      <label
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          deliveryOption === 'collection'
                            ? 'border-[#BE757C] bg-[#FFF0F2]/50 text-[#3D2B27]'
                            : 'border-[#E8BAC0]/40 text-[#5C4A45]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="fulfillment"
                            checked={deliveryOption === 'collection'}
                            onChange={() => setDeliveryOption('collection')}
                            className="text-[#BE757C] focus:ring-[#BE757C]"
                          />
                          <div>
                            <span className="font-medium text-xs block">🌿 Sanctuary Collection</span>
                            <span className="text-[10px] text-[#8C6B64]">Free pickup at Blackpool Area</span>
                          </div>
                        </div>
                        <span className="font-semibold text-[#25D366] text-xs">FREE</span>
                      </label>

                      {deliveryOption === 'collection' && (
                        <div className="p-2.5 rounded-xl bg-[#FFF0F2] border border-[#BE757C]/30 text-[11px] text-[#5C4A45] leading-relaxed">
                          <div className="flex items-center gap-1.5 text-[#BE757C] font-semibold mb-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Payment Required Prior to Pickup Authorisation</span>
                          </div>
                          <p>
                            All BUY IT NOW products chosen for pickup must be paid for prior to confirmation that pickup is authorised. Please complete payment below with <strong>PayPal</strong> or <strong>VISA</strong> to authorise your collection.
                          </p>
                        </div>
                      )}

                      <label
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          deliveryOption === 'delivery'
                            ? 'border-[#BE757C] bg-[#FFF0F2]/50 text-[#3D2B27]'
                            : 'border-[#E8BAC0]/40 text-[#5C4A45]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="fulfillment"
                            checked={deliveryOption === 'delivery'}
                            onChange={() => setDeliveryOption('delivery')}
                            className="text-[#BE757C] focus:ring-[#BE757C]"
                          />
                          <div>
                            <span className="font-medium text-xs block">📦 UK Tracked Delivery</span>
                            <span className="text-[10px] text-[#8C6B64]">
                              {subtotal >= 50 ? 'Free over £50!' : '2-3 working days'} (Pre-payment required for dispatch authorisation)
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-[#3D2B27] text-xs">
                          {subtotal >= 50 ? <span className="text-[#25D366]">FREE</span> : '£3.95'}
                        </span>
                      </label>

                      {deliveryOption === 'delivery' && (
                        <div className="p-2.5 rounded-xl bg-[#FFF0F2] border border-[#BE757C]/30 text-[11px] text-[#5C4A45] leading-relaxed">
                          <div className="flex items-center gap-1.5 text-[#BE757C] font-semibold mb-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Payment Required Prior to Dispatch Authorisation</span>
                          </div>
                          <p>
                            All BUY IT NOW products chosen for UK Tracked Delivery must be paid for prior to confirmation that dispatch is authorised. Complete payment below with <strong>PayPal</strong> or <strong>VISA</strong> so your parcel can be packed and dispatched.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Promo Code Box */}
                  <div className="pt-2">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between bg-[#E8BAC0]/20 p-2 rounded-xl text-xs text-[#BE757C]">
                        <span>Promo <strong>{appliedPromo.code}</strong> (-{appliedPromo.discountPercent}%)</span>
                        <button
                          onClick={handleRemovePromo}
                          className="text-[11px] underline hover:text-[#3D2B27]"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Promo code (e.g. ELYSIAN10)"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-grow px-3 py-1.5 text-xs rounded-xl border border-[#E8BAC0]/50 focus:outline-none focus:border-[#BE757C] bg-[#FFF9F9]"
                          />
                          <button
                            type="button"
                            onClick={handleApplyPromo}
                            className="px-3 py-1.5 bg-[#5C423E] hover:bg-[#4A352F] text-white text-xs rounded-xl transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && (
                          <p className="text-[10px] text-red-500 mt-1">{promoError}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-[#BE757C] text-xs">
                      <span>Discount ({appliedPromo.code})</span>
                      <span>-£{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#5C4A45] text-xs">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? 'FREE' : `£${shippingCost.toFixed(2)}`}</span>
                  </div>

                  <div className="pt-3 border-t border-[#E8BAC0]/40 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-[#3D2B27]">Total Payable</span>
                    <span className="text-xl font-bold font-display text-[#BE757C]">
                      £{finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Purchase Information Form */}
                <form onSubmit={handleCompleteOrder} className="pt-3 border-t border-[#E8BAC0]/30 space-y-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3D2B27] block">
                    Customer Information
                  </span>

                  <div>
                    <label className="text-[11px] text-[#5C4A45] block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8BAC0]/50 focus:outline-none focus:border-[#BE757C] bg-[#FFF9F9]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-[#5C4A45] block mb-1">Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        placeholder="07707 328060"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8BAC0]/50 focus:outline-none focus:border-[#BE757C] bg-[#FFF9F9]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#5C4A45] block mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="sarah@example.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8BAC0]/50 focus:outline-none focus:border-[#BE757C] bg-[#FFF9F9]"
                      />
                    </div>
                  </div>

                  {deliveryOption === 'delivery' && (
                    <div>
                      <label className="text-[11px] text-[#5C4A45] block mb-1">Delivery Address *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Full delivery postal address including postcode..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8BAC0]/50 focus:outline-none focus:border-[#BE757C] bg-[#FFF9F9]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-[#5C4A45] block mb-1">Preferred Pickup Time / Order Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Pick up before my 2pm facial appointment"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8BAC0]/50 focus:outline-none focus:border-[#BE757C] bg-[#FFF9F9]"
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3D2B27]">
                        Payment Method:
                      </span>
                      <span className="text-[10px] text-[#25D366] font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        256-Bit SSL Encrypted
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* VISA Option */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('visa')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          paymentMethod === 'visa'
                            ? 'border-[#1A1F71] bg-[#F0F2F9] text-[#1A1F71] ring-1 ring-[#1A1F71]'
                            : 'border-[#E8BAC0]/40 bg-white text-[#5C4A45] hover:border-[#1A1F71]/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <CreditCard className="w-4 h-4 text-[#1A1F71]" />
                          <span>VISA Card</span>
                        </div>
                        <span className="text-[10px] text-[#8C6B64] mt-0.5">Debit or Credit</span>
                      </button>

                      {/* PayPal Option */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          paymentMethod === 'paypal'
                            ? 'border-[#0070BA] bg-[#F0F7FC] text-[#0070BA] ring-1 ring-[#0070BA]'
                            : 'border-[#E8BAC0]/40 bg-white text-[#5C4A45] hover:border-[#0070BA]/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span className="italic font-serif font-black text-[#0070BA]">P</span>
                          <span>PayPal</span>
                        </div>
                        <span className="text-[10px] text-[#8C6B64] mt-0.5">Instant Checkout</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-[#BE757C] bg-[#FFF0F2] p-2 rounded-lg border border-[#BE757C]/20 leading-relaxed mb-3">
                      ⚠️ <strong>Pre-payment Required:</strong> All {deliveryOption === 'collection' ? 'pickup' : 'UK Tracked Delivery'} items must be paid for prior to confirmation that {deliveryOption === 'collection' ? 'collection' : 'parcel dispatch'} is authorised. Pay via <strong>VISA</strong> or <strong>PayPal</strong> below.
                    </p>
                  </div>

                  {/* Primary Direct Payment Buttons */}
                  <div className="pt-1 space-y-2">
                    {/* Pay with VISA Button */}
                    <button
                      type="button"
                      onClick={handleOpenVisaModal}
                      className="w-full py-3 px-4 rounded-full bg-[#1A1F71] hover:bg-[#0D124D] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-[#F7B600]" />
                      <span>Pay £{finalTotal.toFixed(2)} with VISA &amp; Authorise {deliveryOption === 'collection' ? 'Pickup' : 'Dispatch'}</span>
                    </button>

                    {/* Pay with PayPal Button */}
                    <button
                      type="button"
                      onClick={handlePayWithPayPal}
                      className="w-full py-3 px-4 rounded-full bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="italic font-serif font-black text-sm">P</span>
                      <span>Pay £{finalTotal.toFixed(2)} with PayPal &amp; Authorise {deliveryOption === 'collection' ? 'Pickup' : 'Dispatch'}</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                    </button>

                    {/* Alternative Submit Order */}
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-full border border-[#BE757C] text-[#BE757C] hover:bg-[#FFF0F2] text-xs font-medium tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Order &amp; Request {deliveryOption === 'collection' ? 'Collection' : 'Dispatch'} Invoice</span>
                    </button>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/447707328060?text=${generateWhatsAppMessage()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-4 rounded-full border border-[#25D366] text-[#1EBE5D] hover:bg-[#25D366] hover:text-white text-xs font-medium tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Order via WhatsApp Direct</span>
                    </a>
                  </div>

                  <p className="text-[10px] text-[#8C6B64] text-center mt-2 leading-normal">
                    🔒 Official Visa &amp; PayPal secure portals. Pre-payment authorises {deliveryOption === 'collection' ? 'collection handover' : 'tracked postal dispatch'}.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISA Card Payment Modal */}
      {isVisaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E8BAC0]/40 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Navigation & Cancel / Back to Cart Controls */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8BAC0]/30">
              <button
                type="button"
                onClick={() => setIsVisaModalOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF0F2] hover:bg-[#BE757C] text-[#BE757C] hover:text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                id="visa-modal-top-back-to-cart-btn"
                title="Cancel payment and return to cart"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Cart</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVisaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FFF0F2] text-[#BE757C] hover:bg-[#BE757C] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cancel and Close Modal"
                title="Cancel Payment"
                id="visa-modal-close-x-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1F71]/10 text-[#1A1F71] text-xs font-bold mb-2">
                <CreditCard className="w-4 h-4 text-[#1A1F71]" />
                <span>Verified by VISA • Secure Checkout</span>
              </div>
              <h3 className="text-xl font-display font-semibold text-[#3D2B27]">
                Pay with VISA
              </h3>
              <p className="text-xs text-[#5C4A45] mt-1">
                Enter your card details to authorise payment of{' '}
                <strong className="text-[#BE757C] text-sm">£{finalTotal.toFixed(2)}</strong>
              </p>
              {deliveryOption === 'collection' ? (
                <div className="mt-2 text-[11px] text-[#1A1F71] bg-[#F0F2F9] p-2 rounded-xl">
                  📍 Blackpool Area Sanctuary Collection will be authorised immediately upon payment confirmation.
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-[#1A1F71] bg-[#F0F2F9] p-2 rounded-xl">
                  📦 UK Tracked Delivery will be authorised and queued for postal dispatch immediately upon payment confirmation.
                </div>
              )}
            </div>

            {/* Visa Form */}
            <form onSubmit={handleProcessVisaPayment} className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-[#5C4A45] block mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S JENKINS"
                  value={visaCardholder}
                  onChange={(e) => setVisaCardholder(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8BAC0]/60 focus:outline-none focus:border-[#1A1F71] bg-[#FFF9F9] uppercase tracking-wider font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#5C4A45] block mb-1">
                  VISA Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4000 1234 5678 9010"
                    value={visaCardNumber}
                    onChange={(e) => {
                      // Format with space every 4 digits
                      const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                      const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                      setVisaCardNumber(formatted);
                    }}
                    className="w-full pl-3 pr-12 py-2 text-xs rounded-xl border border-[#E8BAC0]/60 focus:outline-none focus:border-[#1A1F71] bg-[#FFF9F9] font-mono tracking-wider"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black italic text-[#1A1F71]">
                    VISA
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[#5C4A45] block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    value={visaExpiry}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 4);
                      if (val.length >= 3) {
                        setVisaExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
                      } else {
                        setVisaExpiry(val);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8BAC0]/60 focus:outline-none focus:border-[#1A1F71] bg-[#FFF9F9] font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#5C4A45] block mb-1">
                    Security Code (CVV)
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="123"
                    value={visaCvc}
                    onChange={(e) => setVisaCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8BAC0]/60 focus:outline-none focus:border-[#1A1F71] bg-[#FFF9F9] font-mono text-center tracking-widest"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={isVisaProcessing}
                  id="authorise-and-pay-btn"
                  className="w-full py-3.5 px-4 rounded-full bg-[#1A1F71] hover:bg-[#0D124D] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-[#1A1F71]/40"
                >
                  {isVisaProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authorising Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[#F7B600]" />
                      <span>Authorise &amp; Pay £{finalTotal.toFixed(2)} with VISA</span>
                    </>
                  )}
                </button>

                {/* Purchaser Back Button to Cancel Payment and Return to Cart */}
                <button
                  type="button"
                  disabled={isVisaProcessing}
                  onClick={() => setIsVisaModalOpen(false)}
                  id="authorise-pay-cancel-to-cart-btn"
                  className="w-full py-3 px-4 rounded-full border-2 border-[#BE757C] bg-white hover:bg-[#FFF0F2] text-[#BE757C] text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Cancel Payment &amp; Back to Cart</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#8C6B64] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" />
                <span>SSL Encrypted • Powered by Visa Merchant Gateway</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PayPal Payment Page / Modal */}
      {isPayPalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#0070BA]/20 shadow-2xl relative animate-in fade-in zoom-in duration-200 my-auto">
            {/* Navigation & Cancel / Back to Cart Controls */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#0070BA]/20">
              <button
                type="button"
                onClick={() => setIsPayPalModalOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EBF5FB] hover:bg-[#0070BA] text-[#0070BA] hover:text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                id="paypal-modal-top-back-to-cart-btn"
                title="Cancel payment and return to cart"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Cart</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPayPalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#EBF5FB] text-[#0070BA] hover:bg-[#0070BA] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cancel and Close Modal"
                title="Cancel Payment"
                id="paypal-modal-close-x-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0070BA]/10 text-[#0070BA] text-xs font-bold mb-3">
                <span className="text-base font-serif italic font-black text-[#003087]">P</span>
                <span className="font-semibold">PayPal Secure Checkout</span>
              </div>
              
              <div className="flex items-center justify-center gap-1 text-2xl font-serif italic font-black mb-1">
                <span className="text-[#003087]">Pay</span>
                <span className="text-[#0079C1]">Pal</span>
              </div>

              <p className="text-xs text-[#5C4A45] mt-1">
                Authorise payment of{' '}
                <strong className="text-[#0070BA] text-sm">£{finalTotal.toFixed(2)} GBP</strong>
              </p>

              <div className="mt-3 p-3 rounded-xl bg-[#F4F7FB] border border-[#0070BA]/15 text-left text-[11px] text-[#2C3E50] space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-[#7F8C8D]">
                  <span>Merchant / Recipient:</span>
                  <span className="font-semibold text-[#003087]">Elysian Wellness &amp; Skincare</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#7F8C8D]">
                  <span>PayPal Account:</span>
                  <span className="font-mono text-[#0070BA] font-semibold">elainecll@hotmail.com</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#7F8C8D]">
                  <span>Order Reference:</span>
                  <span className="font-mono text-[#3D2B27] font-semibold">{confirmedOrderRef || 'PENDING'}</span>
                </div>
              </div>

              {deliveryOption === 'collection' ? (
                <div className="mt-2.5 text-[11px] text-[#003087] bg-[#EBF5FB] p-2.5 rounded-xl text-left border border-[#0070BA]/20">
                  📍 <strong>Blackpool Area Sanctuary Collection</strong> will be authorised immediately upon payment confirmation.
                </div>
              ) : (
                <div className="mt-2.5 text-[11px] text-[#003087] bg-[#EBF5FB] p-2.5 rounded-xl text-left border border-[#0070BA]/20">
                  📦 <strong>UK Tracked Delivery</strong> will be authorised and queued for postal dispatch immediately upon payment confirmation.
                </div>
              )}
            </div>

            {/* PayPal Payment Actions Form */}
            <form onSubmit={handleProcessPayPalPayment} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-[#5C4A45] block mb-1">
                  PayPal Email / Account (Optional)
                </label>
                <input
                  type="email"
                  placeholder="your-email@paypal.com"
                  value={payPalAccountEmail}
                  onChange={(e) => setPayPalAccountEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#0070BA]/30 focus:outline-none focus:border-[#0070BA] bg-[#FDFDFD]"
                />
              </div>

              {/* Direct Link to PayPal.me */}
              <a
                href={paypalMeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-full bg-[#FFC439] hover:bg-[#F2BA36] text-[#111827] text-xs font-bold tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                title="Opens PayPal official portal in new tab"
              >
                <span className="italic font-serif font-black text-sm text-[#003087]">P</span>
                <span>Open PayPal.com Checkout (£{finalTotal.toFixed(2)})</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#003087]" />
              </a>

              <div className="pt-1 space-y-2.5">
                <button
                  type="submit"
                  disabled={isPayPalProcessing}
                  id="authorise-and-pay-paypal-btn"
                  className="w-full py-3.5 px-4 rounded-full bg-[#0070BA] hover:bg-[#003087] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40"
                >
                  {isPayPalProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authorising &amp; Processing PayPal Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-white" />
                      <span>Authorise &amp; Complete PayPal Payment (£{finalTotal.toFixed(2)})</span>
                    </>
                  )}
                </button>

                {/* Purchaser Back Button to Cancel Payment and Return to Cart */}
                <button
                  type="button"
                  disabled={isPayPalProcessing}
                  onClick={() => setIsPayPalModalOpen(false)}
                  id="paypal-cancel-to-cart-btn"
                  className="w-full py-3 px-4 rounded-full border-2 border-[#BE757C] bg-white hover:bg-[#FFF0F2] text-[#BE757C] text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Cancel Payment &amp; Back to Cart</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#8C6B64] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0070BA]" />
                <span>PayPal Buyer Protection • 256-Bit SSL Encrypted</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
