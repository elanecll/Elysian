export interface CRMNotificationRecord {
  recipient: string;
  channel: 'whatsapp' | 'email';
  sent: boolean;
  sentAt?: string;
  url: string;
  previewText: string;
}

export interface CRMItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CRMRecord {
  id: string;
  type: 'booking' | 'sale';
  createdAt: string; // ISO string
  createdFormatted: string; // e.g. "08 Sep 2026, 14:30"
  customer: {
    name: string;
    phone: string;
    email: string;
    address?: string;
    notes?: string;
  };
  details: {
    // For Bookings
    serviceId?: string;
    serviceTitle?: string;
    skincareProduct?: 'tropic' | 'clinicare' | string;
    duration?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    isPackageCourse?: boolean;
    totalSessions?: number;
    savingsAmount?: number;
    // For Sales
    items?: CRMItem[];
    deliveryOption?: 'collection' | 'delivery';
    deliveryAddress?: string;
    shippingCost?: number;
    discountAmount?: number;
    promoCode?: string;
  };
  financials: {
    totalAmount: number;
    depositPaid: number;
    balanceDue: number;
    paymentStatus: '50%_deposit_paid' | 'paid_in_full' | 'pending';
    paymentMethod: string;
    authCode?: string;
  };
  notifications: {
    whatsAppOwner: CRMNotificationRecord;
    emailOwner: CRMNotificationRecord;
  };
  status: 'confirmed' | 'pending_arrival' | 'completed' | 'dispatched' | 'cancelled';
  ownerNotes?: string;
}

export const OWNER_CONFIG = {
  name: 'Elaine Chong',
  spaName: 'Elysian Spa & Wellness',
  whatsappRaw: '447707328060',
  whatsappDisplay: '+44 7707 328060',
  phoneDisplay: '7707 32 8060',
  email: 'elainecll@hotmail.com',
  address: 'Blackpool Courtyard Sanctuary, Lancashire, UK',
};

const CRM_STORAGE_KEY = 'elysian_crm_records_v2';

// Empty initial records for live site launch - ready for real customer bookings & orders
const INITIAL_SAMPLE_RECORDS: CRMRecord[] = [];

/**
 * Generate formatted WhatsApp notification link and text for site owner
 */
export function generateOwnerWhatsAppUrl(record: CRMRecord): string {
  const isBooking = record.type === 'booking';
  let message = '';

  if (isBooking) {
    const isCourse = !!record.details.isPackageCourse;
    message = `🔔 *NEW BOOKING ALERT - ELYSIAN SPA & WELLNESS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Guest:* ${record.customer.name}\n` +
      `📞 *Phone / WA:* ${record.customer.phone}\n` +
      `✉️ *Email:* ${record.customer.email || 'Not provided'}\n\n` +
      `💆‍♀️ *Treatment Ritual:* ${record.details.serviceTitle || 'Bespoke Ritual'}\n` +
      (isCourse ? `✨ *Option:* 4-Session Treatment Course (Buy 3, Get 1 FREE — 4th Session Complimentary!)\n📦 *Sessions Total:* 4 Sessions (1st session confirmed today, 3 remaining sessions booked flexibly)\n` : '') +
      `🔬 *Product Line:* 🔬 CLINICARE Cosmeceuticals\n` +
      `⏱️ *Duration:* ${record.details.duration || '60 mins'}\n` +
      `📅 *Date:* ${record.details.scheduledDate}\n` +
      `⏰ *Time Slot:* ${record.details.scheduledTime}\n\n` +
      `💰 *FINANCIAL BREAKDOWN:*\n` +
      `• Total Fee: £${record.financials.totalAmount.toFixed(2)}${isCourse ? ` (Course of 4 - saved £${(record.details.savingsAmount || 0).toFixed(2)})` : ''}\n` +
      `• *50% Deposit Paid:* £${record.financials.depositPaid.toFixed(2)} ✅ (${record.financials.paymentMethod})\n` +
      `• *Remaining Balance on Arrival:* £${record.financials.balanceDue.toFixed(2)}\n\n` +
      (record.customer.notes ? `📝 *Guest Notes:* "${record.customer.notes}"\n\n` : '') +
      `🔖 *Ref:* #${record.id}\n` +
      `🕒 *Booked At:* ${record.createdFormatted}\n` +
      `🏛️ *Sanctuary:* Blackpool Courtyard Sanctuary`;
  } else {
    // Product Sale
    const itemsList = (record.details.items || [])
      .map(it => `• ${it.quantity}x ${it.name} - £${it.totalPrice.toFixed(2)}`)
      .join('\n');

    message = `🛍️ *NEW BOUTIQUE SALE ALERT - ELYSIAN SPA*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Customer:* ${record.customer.name}\n` +
      `📞 *Phone:* ${record.customer.phone}\n` +
      `✉️ *Email:* ${record.customer.email || 'Not provided'}\n\n` +
      `📦 *ORDER ITEMS:*\n${itemsList}\n\n` +
      `🚚 *Fulfillment:* ${record.details.deliveryOption === 'collection' ? '📍 Sanctuary Collection (Blackpool)' : '📦 UK Tracked Postal Delivery'}\n` +
      (record.details.deliveryAddress ? `📫 *Delivery Address:* ${record.details.deliveryAddress}\n` : '') +
      (record.details.shippingCost !== undefined ? `📮 *Shipping:* £${record.details.shippingCost.toFixed(2)}\n` : '') +
      (record.details.discountAmount ? `🏷️ *Discount Applied:* -£${record.details.discountAmount.toFixed(2)} (${record.details.promoCode || 'Promo'})\n` : '') +
      `\n💰 *FINANCIAL SUMMARY:*\n` +
      `• *Total Paid in Full:* £${record.financials.totalAmount.toFixed(2)} ✅\n` +
      `• *Payment Method:* ${record.financials.paymentMethod}\n` +
      (record.financials.authCode ? `• *Auth Ref:* ${record.financials.authCode}\n` : '') +
      (record.customer.notes ? `\n📝 *Order Notes:* "${record.customer.notes}"\n` : '') +
      `\n🔖 *Order Ref:* #${record.id}\n` +
      `🕒 *Order Time:* ${record.createdFormatted}`;
  }

  return `https://wa.me/${OWNER_CONFIG.whatsappRaw}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate formatted Email notification link and body for site owner
 */
export function generateOwnerEmailUrl(record: CRMRecord): { url: string; subject: string; body: string } {
  const isBooking = record.type === 'booking';
  let subject = '';
  let body = '';

  if (isBooking) {
    const isCourse = !!record.details.isPackageCourse;
    subject = `[Elysian Spa Booking] ${record.customer.name} - ${record.details.scheduledDate} at ${record.details.scheduledTime} (Deposit £${record.financials.depositPaid.toFixed(2)} Paid)${isCourse ? ' [BUY 3 GET 1 FREE COURSE]' : ''}`;
    body = `Dear Elaine,\n\nA new client booking has just been confirmed on the Elysian Spa & Wellness website!\n\n` +
      `==================================================\n` +
      `CLIENT & BOOKING INFORMATION\n` +
      `==================================================\n` +
      `Booking Reference: #${record.id}\n` +
      `Client Name: ${record.customer.name}\n` +
      `Client Phone: ${record.customer.phone}\n` +
      `Client Email: ${record.customer.email}\n` +
      `Client Notes / Requests: ${record.customer.notes || 'None provided'}\n\n` +
      `==================================================\n` +
      `TREATMENT DETAILS\n` +
      `==================================================\n` +
      `Treatment: ${record.details.serviceTitle}\n` +
      (isCourse ? `Booking Type: 4-Session Treatment Course (Buy 3, Get 1 FREE — 4th Session Complimentary!)\nTotal Sessions: 4 Sessions (1st session confirmed for ${record.details.scheduledDate}, 3 remaining sessions scheduled flexibly)\nSavings: £${(record.details.savingsAmount || 0).toFixed(2)} saved\n` : `Booking Type: Single Session\n`) +
      `Skincare Formulation: 🔬 CLINICARE Swedish Cosmeceuticals\n` +
      `Duration: ${record.details.duration || '60 mins'}\n` +
      `Scheduled Date: ${record.details.scheduledDate}\n` +
      `Scheduled Time: ${record.details.scheduledTime}\n` +
      `Location: Blackpool Courtyard Sanctuary\n\n` +
      `==================================================\n` +
      `FINANCIAL ACCOUNTING (50% DEPOSIT POLICY)\n` +
      `==================================================\n` +
      `Total Treatment Fee: £${record.financials.totalAmount.toFixed(2)}\n` +
      `50% Deposit Paid Online: £${record.financials.depositPaid.toFixed(2)} [PAID]\n` +
      `Payment Method: ${record.financials.paymentMethod}\n` +
      `Payment Auth Code: ${record.financials.authCode || 'N/A'}\n` +
      `Remaining Balance to Collect on Arrival: £${record.financials.balanceDue.toFixed(2)}\n\n` +
      `Recorded in Elysian Owner CRM at: ${record.createdFormatted}\n\n` +
      `Best regards,\n` +
      `Elysian Spa Automated Reservation Concierge`;
  } else {
    subject = `[Elysian Boutique Sale] New Order #${record.id} from ${record.customer.name} (£${record.financials.totalAmount.toFixed(2)} Paid)`;
    const itemsList = (record.details.items || [])
      .map(it => `• ${it.quantity}x ${it.name} - £${it.totalPrice.toFixed(2)}`)
      .join('\n');

    body = `Dear Elaine,\n\nA new product purchase has been completed on the Elysian Spa Boutique!\n\n` +
      `==================================================\n` +
      `CUSTOMER & ORDER INFORMATION\n` +
      `==================================================\n` +
      `Order Reference: #${record.id}\n` +
      `Customer Name: ${record.customer.name}\n` +
      `Customer Phone: ${record.customer.phone}\n` +
      `Customer Email: ${record.customer.email}\n` +
      `Fulfillment: ${record.details.deliveryOption === 'collection' ? 'Collection at Blackpool Sanctuary' : 'Tracked Postal Delivery'}\n` +
      (record.details.deliveryAddress ? `Delivery Address: ${record.details.deliveryAddress}\n` : '') +
      `Order Notes: ${record.customer.notes || 'None'}\n\n` +
      `==================================================\n` +
      `ITEMS PURCHASED\n` +
      `==================================================\n` +
      `${itemsList}\n\n` +
      `==================================================\n` +
      `FINANCIAL BREAKDOWN\n` +
      `==================================================\n` +
      `Shipping Fee: £${(record.details.shippingCost || 0).toFixed(2)}\n` +
      `Discount: -£${(record.details.discountAmount || 0).toFixed(2)}\n` +
      `Total Amount Paid in Full: £${record.financials.totalAmount.toFixed(2)} [PAID]\n` +
      `Payment Method: ${record.financials.paymentMethod}\n` +
      `Payment Auth Code: ${record.financials.authCode || 'N/A'}\n\n` +
      `Recorded in Elysian Owner CRM at: ${record.createdFormatted}\n\n` +
      `Best regards,\n` +
      `Elysian Spa Automated Boutique Store`;
  }

  const mailtoUrl = `mailto:${OWNER_CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { url: mailtoUrl, subject, body };
}

/**
 * Retrieve all CRM records from localStorage (clean empty state for live launch)
 */
export function getCRMRecords(): CRMRecord[] {
  try {
    // Clear old v1 demo storage if present from earlier preview sessions
    if (typeof window !== 'undefined' && localStorage.getItem('elysian_crm_records_v1')) {
      localStorage.removeItem('elysian_crm_records_v1');
    }
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CRM_STORAGE_KEY) : null;
    if (!raw) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify([]));
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to parse CRM records:', err);
    return [];
  }
}

/**
 * Completely reset and clear all CRM records to empty for production launch
 */
export function clearAllCRMRecords(): CRMRecord[] {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('elysian_crm_records_v1');
      localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('elysian_crm_updated', { detail: { all: [] } }));
    }
    return [];
  } catch (err) {
    console.error('Failed to clear CRM records:', err);
    return [];
  }
}

/**
 * Save or prepend a new CRM record and broadcast change
 */
export function saveCRMRecord(record: CRMRecord): CRMRecord[] {
  try {
    const current = getCRMRecords();
    // Prepend new record so latest appears first
    const updated = [record, ...current.filter(r => r.id !== record.id)];
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(updated));
    // Dispatch reactive event
    window.dispatchEvent(new CustomEvent('elysian_crm_updated', { detail: { record, all: updated } }));
    return updated;
  } catch (err) {
    console.error('Failed to save CRM record:', err);
    return [];
  }
}

/**
 * Update status or owner notes of an existing CRM record
 */
export function updateCRMRecord(
  id: string,
  updates: Partial<Pick<CRMRecord, 'status' | 'ownerNotes'>>
): CRMRecord[] {
  try {
    const current = getCRMRecords();
    const updated = current.map(rec => {
      if (rec.id === id) {
        return {
          ...rec,
          ...updates,
        };
      }
      return rec;
    });
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elysian_crm_updated', { detail: { all: updated } }));
    return updated;
  } catch (err) {
    console.error('Failed to update CRM record:', err);
    return [];
  }
}

/**
 * Delete a CRM record
 */
export function deleteCRMRecord(id: string): CRMRecord[] {
  try {
    const current = getCRMRecords();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('elysian_crm_updated', { detail: { all: updated } }));
    return updated;
  } catch (err) {
    console.error('Failed to delete CRM record:', err);
    return [];
  }
}

/**
 * Export CRM records as CSV for spreadsheets (Excel, Google Sheets)
 */
export function exportCRMToCSV(records: CRMRecord[]): void {
  const headers = [
    'Record ID',
    'Type',
    'Created At',
    'Customer Name',
    'Phone',
    'Email',
    'Service or Items',
    'Scheduled Date & Time / Address',
    'Total Amount (£)',
    'Deposit Paid (£)',
    'Balance Due (£)',
    'Payment Status',
    'Payment Method',
    'Status',
    'Owner Notes',
  ];

  const rows = records.map(r => {
    const itemsOrService = r.type === 'booking'
      ? `${r.details.serviceTitle || ''} (${r.details.duration || ''})`
      : (r.details.items || []).map(i => `${i.quantity}x ${i.name}`).join('; ');

    const dateOrAddress = r.type === 'booking'
      ? `${r.details.scheduledDate} ${r.details.scheduledTime}`
      : `${r.details.deliveryOption === 'collection' ? 'Sanctuary Collection' : r.details.deliveryAddress || 'Postal'}`;

    return [
      `"${r.id}"`,
      `"${r.type.toUpperCase()}"`,
      `"${r.createdFormatted}"`,
      `"${r.customer.name.replace(/"/g, '""')}"`,
      `"${r.customer.phone.replace(/"/g, '""')}"`,
      `"${r.customer.email.replace(/"/g, '""')}"`,
      `"${itemsOrService.replace(/"/g, '""')}"`,
      `"${dateOrAddress.replace(/"/g, '""')}"`,
      r.financials.totalAmount.toFixed(2),
      r.financials.depositPaid.toFixed(2),
      r.financials.balanceDue.toFixed(2),
      `"${r.financials.paymentStatus}"`,
      `"${r.financials.paymentMethod}"`,
      `"${r.status}"`,
      `"${(r.ownerNotes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Elysian_Spa_CRM_Records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
