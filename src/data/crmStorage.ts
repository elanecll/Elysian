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

const CRM_STORAGE_KEY = 'elysian_crm_records_v1';

// Initial sample records showcasing both bookings and boutique sales
const INITIAL_SAMPLE_RECORDS: CRMRecord[] = [
  {
    id: 'ELS-BK-2026-8192',
    type: 'booking',
    createdAt: '2026-09-08T10:15:00Z',
    createdFormatted: '08 Sep 2026, 11:15 AM',
    customer: {
      name: 'Eleanor Vance',
      phone: '+44 7890 123456',
      email: 'eleanor.vance@example.co.uk',
      notes: 'Prefers gentle aromatic pressure; allergic to synthetic perfumes. Requested lavender tea.',
    },
    details: {
      serviceId: 'tropic-custom-facial',
      serviceTitle: '🌿 Tropic Botanical Custom Facial',
      skincareProduct: 'tropic',
      duration: '60 mins Full Ritual',
      scheduledDate: '2026-09-10',
      scheduledTime: '11:00 AM',
    },
    financials: {
      totalAmount: 65,
      depositPaid: 32.5,
      balanceDue: 32.5,
      paymentStatus: '50%_deposit_paid',
      paymentMethod: 'Card ending in 4812',
      authCode: 'AUTH-61842',
    },
    notifications: {
      whatsAppOwner: {
        recipient: OWNER_CONFIG.whatsappDisplay,
        channel: 'whatsapp',
        sent: true,
        sentAt: '2026-09-08T10:15:05Z',
        url: '',
        previewText: 'New Booking: Eleanor Vance • Tropic Facial (60m) on 10 Sep at 11:00 AM. 50% Deposit £32.50 Paid.',
      },
      emailOwner: {
        recipient: OWNER_CONFIG.email,
        channel: 'email',
        sent: true,
        sentAt: '2026-09-08T10:15:08Z',
        url: '',
        previewText: 'Booking Notification: Eleanor Vance - 10 Sep 2026',
      },
    },
    status: 'confirmed',
    ownerNotes: 'VIP return guest from Lytham St Annes. Ensure Room 1 (Botanical Suite) is set up with warm basalt stones.',
  },
  {
    id: 'ELS-ORD-2026-4029',
    type: 'sale',
    createdAt: '2026-09-07T16:45:00Z',
    createdFormatted: '07 Sep 2026, 05:45 PM',
    customer: {
      name: 'Charlotte Davies',
      phone: '+44 7711 987654',
      email: 'c.davies@lancaster.ac.uk',
      address: '14 Queen Street, Lytham St Annes, FY8 5JE',
      notes: 'Please leave in porch if no answer.',
    },
    details: {
      items: [
        {
          id: 'smoothing-cleanser',
          name: 'Smoothing Cleanser Complexion Purifier (200ml)',
          quantity: 1,
          unitPrice: 28,
          totalPrice: 28,
        },
        {
          id: 'skin-feast',
          name: 'Skin Feast Nourishing Moisturiser (50ml)',
          quantity: 1,
          unitPrice: 32,
          totalPrice: 32,
        },
        {
          id: 'elixir',
          name: 'Super Greens Nutrient Boost Oil (30ml)',
          quantity: 1,
          unitPrice: 46,
          totalPrice: 46,
        },
      ],
      deliveryOption: 'delivery',
      deliveryAddress: '14 Queen Street, Lytham St Annes, FY8 5JE',
      shippingCost: 0,
      discountAmount: 10.6,
      promoCode: 'ELYSIAN10',
    },
    financials: {
      totalAmount: 95.4,
      depositPaid: 95.4,
      balanceDue: 0,
      paymentStatus: 'paid_in_full',
      paymentMethod: 'VISA Card (ending 8831)',
      authCode: 'VISA-994102',
    },
    notifications: {
      whatsAppOwner: {
        recipient: OWNER_CONFIG.whatsappDisplay,
        channel: 'whatsapp',
        sent: true,
        sentAt: '2026-09-07T16:45:10Z',
        url: '',
        previewText: 'Boutique Sale: Charlotte Davies • 3 items • Total £95.40 Paid via VISA. Tracked Delivery.',
      },
      emailOwner: {
        recipient: OWNER_CONFIG.email,
        channel: 'email',
        sent: true,
        sentAt: '2026-09-07T16:45:12Z',
        url: '',
        previewText: 'Sales Notification: Order #ELS-ORD-2026-4029',
      },
    },
    status: 'dispatched',
    ownerNotes: 'Dispatched via Royal Mail Tracked 24. Tracking code: GB294817293RM.',
  },
  {
    id: 'ELS-BK-2026-7734',
    type: 'booking',
    createdAt: '2026-09-07T11:20:00Z',
    createdFormatted: '07 Sep 2026, 12:20 PM',
    customer: {
      name: 'Marcus & Jessica Bell',
      phone: '+44 7922 445566',
      email: 'marcus.bell@prestondesign.com',
      notes: 'Celebrating 10th wedding anniversary. Requested couple twin experience room.',
    },
    details: {
      serviceId: 'twin-package',
      serviceTitle: 'Twin Sanctuary Ritual (Couples Experience)',
      skincareProduct: 'tropic',
      duration: '60 mins each',
      scheduledDate: '2026-09-12',
      scheduledTime: '02:30 PM',
    },
    financials: {
      totalAmount: 102,
      depositPaid: 51,
      balanceDue: 51,
      paymentStatus: '50%_deposit_paid',
      paymentMethod: 'Apple Pay',
      authCode: 'APAY-44102',
    },
    notifications: {
      whatsAppOwner: {
        recipient: OWNER_CONFIG.whatsappDisplay,
        channel: 'whatsapp',
        sent: true,
        sentAt: '2026-09-07T11:20:05Z',
        url: '',
        previewText: 'New Booking: Marcus & Jessica Bell • Twin Sanctuary Ritual • 12 Sep at 02:30 PM. 50% Deposit £51.00 Paid.',
      },
      emailOwner: {
        recipient: OWNER_CONFIG.email,
        channel: 'email',
        sent: true,
        sentAt: '2026-09-07T11:20:07Z',
        url: '',
        previewText: 'Booking Notification: Marcus & Jessica Bell - 12 Sep 2026',
      },
    },
    status: 'confirmed',
    ownerNotes: 'Prepare celebratory hibiscus botanical flower tea and complimentary organic bath salts bag.',
  },
];

/**
 * Generate formatted WhatsApp notification link and text for site owner
 */
export function generateOwnerWhatsAppUrl(record: CRMRecord): string {
  const isBooking = record.type === 'booking';
  let message = '';

  if (isBooking) {
    message = `🔔 *NEW BOOKING ALERT - ELYSIAN SPA & WELLNESS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Guest:* ${record.customer.name}\n` +
      `📞 *Phone / WA:* ${record.customer.phone}\n` +
      `✉️ *Email:* ${record.customer.email || 'Not provided'}\n\n` +
      `💆‍♀️ *Treatment Ritual:* ${record.details.serviceTitle || 'Bespoke Ritual'}\n` +
      (record.details.skincareProduct ? `🌿 *Product Line:* ${record.details.skincareProduct === 'tropic' ? '🌿 Tropic Botanicals' : '🔬 Clinicare Cosmeceuticals'}\n` : '') +
      `⏱️ *Duration:* ${record.details.duration || '60 mins'}\n` +
      `📅 *Date:* ${record.details.scheduledDate}\n` +
      `⏰ *Time Slot:* ${record.details.scheduledTime}\n\n` +
      `💰 *FINANCIAL BREAKDOWN:*\n` +
      `• Total Fee: £${record.financials.totalAmount.toFixed(2)}\n` +
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
    subject = `[Elysian Spa Booking] ${record.customer.name} - ${record.details.scheduledDate} at ${record.details.scheduledTime} (Deposit £${record.financials.depositPaid.toFixed(2)} Paid)`;
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
      `Skincare Formulation: ${record.details.skincareProduct ? (record.details.skincareProduct === 'tropic' ? 'Tropic Botanicals' : 'Clinicare Cosmeceuticals') : 'Standard'}\n` +
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
 * Retrieve all CRM records from localStorage (seeded with initial samples if empty)
 */
export function getCRMRecords(): CRMRecord[] {
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_RECORDS));
      return INITIAL_SAMPLE_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_RECORDS;
  } catch (err) {
    console.error('Failed to parse CRM records:', err);
    return INITIAL_SAMPLE_RECORDS;
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
