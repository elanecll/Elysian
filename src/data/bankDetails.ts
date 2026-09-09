export interface BankDetails {
  bankName: string;
  accountName: string;
  sortCode: string;
  accountNumber: string;
  referenceInstructions: string;
  paypalEmail: string;
  iban?: string;
  bic?: string;
  enabledForBookings: boolean;
  enabledForBoutique: boolean;
}

const STORAGE_KEY = 'elysian_owner_bank_details_v1';

export const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: 'Barclays Bank UK',
  accountName: 'Elaine Chong (Elysian Beauty Spa)',
  sortCode: '20-09-72',
  accountNumber: '83920145',
  referenceInstructions: 'Please use your Booking ID (e.g. ELS-...) or Surname as the payment reference',
  paypalEmail: 'elainecll@hotmail.com',
  iban: '',
  bic: '',
  enabledForBookings: true,
  enabledForBoutique: true,
};

export function getStoredBankDetails(): BankDetails {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BANK_DETAILS;
    return { ...DEFAULT_BANK_DETAILS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse bank details from localStorage:', e);
    return DEFAULT_BANK_DETAILS;
  }
}

export function saveStoredBankDetails(details: BankDetails): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    // Dispatch custom event to notify open modals and components
    window.dispatchEvent(new CustomEvent('elysian_bank_details_updated', { detail: details }));
  } catch (e) {
    console.error('Failed to save bank details to localStorage:', e);
  }
}
