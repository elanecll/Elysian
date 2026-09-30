import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Search,
  Calendar,
  ShoppingBag,
  DollarSign,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Download,
  Printer,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  FileText,
  Trash2,
  Edit3,
  ShieldCheck,
  CreditCard,
  User,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  Send,
  RefreshCw,
  RotateCcw,
  Copy,
  Check,
  Building2,
  Lock,
  KeyRound,
  ShieldAlert,
  Smartphone,
  LogOut,
  Key,
} from 'lucide-react';
import { OwnerAuthGate } from './OwnerAuthGate';
import {
  getActiveSession,
  clearAuthSession,
  getOwnerCredentials,
  saveOwnerCredentials,
  OwnerCredentials,
} from '../data/ownerAuth';
import {
  CRMRecord,
  OWNER_CONFIG,
  getCRMRecords,
  saveCRMRecord,
  updateCRMRecord,
  deleteCRMRecord,
  clearAllCRMRecords,
  exportCRMToCSV,
  generateOwnerWhatsAppUrl,
  generateOwnerEmailUrl,
} from '../data/crmStorage';
import {
  BankDetails,
  getStoredBankDetails,
  saveStoredBankDetails,
} from '../data/bankDetails';
import { SPA_SERVICES } from '../data/spaData';

interface OwnerCRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToBooking?: () => void;
}

export const OwnerCRMModal: React.FC<OwnerCRMModalProps> = ({ isOpen, onClose }) => {
  const [records, setRecords] = useState<CRMRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'booking' | 'sale' | 'pending_balance'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'records' | 'add_manual' | 'bank_settings' | 'notifications_log' | 'security_settings'>('records');

  // Security & 2FA State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getActiveSession() !== null);
  const [ownerCreds, setOwnerCreds] = useState<OwnerCredentials>(() => getOwnerCredentials());
  const [editUsername, setEditUsername] = useState(ownerCreds.username);
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editPhone, setEditPhone] = useState(ownerCreds.phoneNumber);
  const [editTwoFactor, setEditTwoFactor] = useState(ownerCreds.twoFactorEnabled);
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');

  // Bank & Payment configuration state
  const [bankDetails, setBankDetails] = useState<BankDetails>(() => getStoredBankDetails());
  const [bankSavedMsg, setBankSavedMsg] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Manual entry form state
  const [manualType, setManualType] = useState<'booking' | 'sale'>('booking');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualServiceId, setManualServiceId] = useState(SPA_SERVICES[0].id);
  const [manualProduct, setManualProduct] = useState<'clinicare'>('clinicare');
  const [manualDuration, setManualDuration] = useState('60 mins Full Ritual');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('11:00 AM');
  const [manualFee, setManualFee] = useState<number>(65);
  const [manualPaymentMethod, setManualPaymentMethod] = useState('Card / Concierge Terminal');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');

  // Editing note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  // Refresh records from local storage
  const reloadRecords = () => {
    setRecords(getCRMRecords());
  };

  const handleSignOut = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const active = getActiveSession();
      setIsAuthenticated(active !== null);
      const creds = getOwnerCredentials();
      setOwnerCreds(creds);
      setEditUsername(creds.username);
      setEditPhone(creds.phoneNumber);
      setEditTwoFactor(creds.twoFactorEnabled);
      reloadRecords();
    }
  }, [isOpen]);

  // Listen for background updates
  useEffect(() => {
    const handleUpdate = () => {
      reloadRecords();
    };
    window.addEventListener('elysian_crm_updated', handleUpdate);
    return () => window.removeEventListener('elysian_crm_updated', handleUpdate);
  }, []);

  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!editUsername.trim()) {
      setSecurityError('Username cannot be empty.');
      return;
    }

    if (editPassword && editPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.');
      return;
    }

    if (editPassword && editPassword !== editConfirmPassword) {
      setSecurityError('Passwords do not match. Please re-enter.');
      return;
    }

    const updated: OwnerCredentials = {
      ...ownerCreds,
      username: editUsername.trim(),
      passwordHash: editPassword ? editPassword : ownerCreds.passwordHash,
      phoneNumber: editPhone.trim() || ownerCreds.phoneNumber,
      twoFactorEnabled: editTwoFactor,
    };

    saveOwnerCredentials(updated);
    setOwnerCreds(updated);
    setEditPassword('');
    setEditConfirmPassword('');
    setSecuritySuccess('Security settings and credentials updated successfully!');
    setTimeout(() => setSecuritySuccess(''), 4000);
  };

  const handleRegenerateBackupCodes = () => {
    const newCodes = Array.from({ length: 5 }, () => `ELS-${Math.floor(1000 + Math.random() * 9000)}`);
    const updated: OwnerCredentials = {
      ...ownerCreds,
      backupCodes: newCodes,
    };
    saveOwnerCredentials(updated);
    setOwnerCreds(updated);
    setSecuritySuccess('5 new emergency backup codes generated and saved!');
    setTimeout(() => setSecuritySuccess(''), 4000);
  };

  // Filtered & Searched records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Type filter
      if (filterType === 'booking' && r.type !== 'booking') return false;
      if (filterType === 'sale' && r.type !== 'sale') return false;
      if (filterType === 'pending_balance' && r.financials.balanceDue <= 0) return false;

      // Status filter
      if (selectedStatusFilter !== 'all' && r.status !== selectedStatusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.customer.name.toLowerCase().includes(q);
        const matchPhone = r.customer.phone.toLowerCase().includes(q);
        const matchEmail = (r.customer.email || '').toLowerCase().includes(q);
        const matchId = r.id.toLowerCase().includes(q);
        const matchService = (r.details.serviceTitle || '').toLowerCase().includes(q);
        const matchItems = (r.details.items || []).some(i => i.name.toLowerCase().includes(q));
        return matchName || matchPhone || matchEmail || matchId || matchService || matchItems;
      }

      return true;
    });
  }, [records, filterType, selectedStatusFilter, searchQuery]);

  // Metric computations
  const metrics = useMemo(() => {
    let totalGross = 0;
    let totalDeposits = 0;
    let totalPendingBalance = 0;
    let bookingsCount = 0;
    let salesCount = 0;

    records.forEach((r) => {
      totalGross += r.financials.totalAmount;
      totalDeposits += r.financials.depositPaid;
      totalPendingBalance += r.financials.balanceDue;
      if (r.type === 'booking') bookingsCount++;
      if (r.type === 'sale') salesCount++;
    });

    return {
      totalGross,
      totalDeposits,
      totalPendingBalance,
      bookingsCount,
      salesCount,
      totalRecords: records.length,
    };
  }, [records]);

  // Status badge style helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'dispatched':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'pending_arrival':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  const handleStatusChange = (id: string, newStatus: CRMRecord['status']) => {
    updateCRMRecord(id, { status: newStatus });
  };

  const handleSaveNote = (id: string) => {
    updateCRMRecord(id, { ownerNotes: tempNoteText });
    setEditingNoteId(null);
    setTempNoteText('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`Are you sure you want to delete record #${id} from the CRM?`)) {
      deleteCRMRecord(id);
    }
  };

  const handleResetForLaunch = () => {
    if (
      window.confirm(
        'Are you sure you want to reset the CRM for live launch?\n\nThis will clear all test records and reset the system to 0 bookings and orders so you can start completely fresh.'
      )
    ) {
      clearAllCRMRecords();
      setRecords([]);
      setSearchQuery('');
    }
  };

  // Submit manual booking / phone sale
  const handleCreateManualRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualPhone) return;

    const isBooking = manualType === 'booking';
    const total = Number(manualFee) || 50;
    const deposit = isBooking ? Math.round(total * 0.5 * 100) / 100 : total;
    const balance = isBooking ? Math.round((total - deposit) * 100) / 100 : 0;

    const chosenService = SPA_SERVICES.find(s => s.id === manualServiceId) || SPA_SERVICES[0];
    const generatedId = isBooking
      ? `ELS-BK-MAN-${Math.floor(1000 + Math.random() * 9000)}`
      : `ELS-ORD-MAN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: CRMRecord = {
      id: generatedId,
      type: manualType,
      createdAt: new Date().toISOString(),
      createdFormatted: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      customer: {
        name: manualName,
        phone: manualPhone,
        email: manualEmail || '',
        notes: manualNotes,
      },
      details: isBooking
        ? {
            serviceId: manualServiceId,
            serviceTitle: chosenService.title,
            skincareProduct: manualProduct,
            duration: manualDuration,
            scheduledDate: manualDate,
            scheduledTime: manualTime,
          }
        : {
            items: [
              {
                id: 'manual-item',
                name: 'Telephone Boutique Order (Custom Formulation)',
                quantity: 1,
                unitPrice: total,
                totalPrice: total,
              },
            ],
            deliveryOption: 'collection',
          },
      financials: {
        totalAmount: total,
        depositPaid: deposit,
        balanceDue: balance,
        paymentStatus: isBooking ? '50%_deposit_paid' : 'paid_in_full',
        paymentMethod: manualPaymentMethod,
        authCode: `MANUAL-${Date.now().toString().slice(-5)}`,
      },
      notifications: {
        whatsAppOwner: {
          recipient: OWNER_CONFIG.whatsappDisplay,
          channel: 'whatsapp',
          sent: false,
          url: '',
          previewText: `Manual Entry: ${manualName} - £${total}`,
        },
        emailOwner: {
          recipient: OWNER_CONFIG.email,
          channel: 'email',
          sent: false,
          url: '',
          previewText: `Manual Entry #${generatedId}`,
        },
      },
      status: 'confirmed',
      ownerNotes: 'Manually logged by Elaine via Owner CRM Portal.',
    };

    saveCRMRecord(newRecord);
    setManualSuccessMsg(`Record #${generatedId} successfully saved to Owner CRM!`);
    setManualName('');
    setManualPhone('');
    setManualEmail('');
    setManualNotes('');

    setTimeout(() => {
      setManualSuccessMsg('');
      setActiveTab('records');
    }, 1500);
  };

  // Bank details handlers
  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredBankDetails(bankDetails);
    setBankSavedMsg(true);
    setTimeout(() => setBankSavedMsg(false), 3500);
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getFullBankShareText = () => {
    return `🏛️ *ELYSIAN SPA & WELLNESS - UK BANK TRANSFER DETAILS*\n` +
      `👤 *Account Name:* ${bankDetails.accountName}\n` +
      `🏦 *Bank:* ${bankDetails.bankName}\n` +
      `🔢 *Sort Code:* ${bankDetails.sortCode}\n` +
      `💳 *Account Number:* ${bankDetails.accountNumber}\n` +
      `📝 *Reference:* ${bankDetails.referenceInstructions}\n` +
      `📞 *Concierge Hotline:* ${OWNER_CONFIG.phoneDisplay}`;
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <OwnerAuthGate
        onSuccess={() => {
          setIsAuthenticated(true);
          const creds = getOwnerCredentials();
          setOwnerCreds(creds);
          setEditUsername(creds.username);
          setEditPhone(creds.phoneNumber);
          setEditTwoFactor(creds.twoFactorEnabled);
          reloadRecords();
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-6xl bg-[#FFFDFD] rounded-3xl shadow-2xl border border-[#E8BAC0]/70 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="bg-[#422F2B] text-[#FFF0F2] px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#BE757C]/30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFF0F2] hover:text-white text-xs font-semibold tracking-wider transition-all cursor-pointer border border-white/20 mr-1"
              title="Return to Sanctuary Website"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#E8BAC0]" />
              <span>Back to Website</span>
            </button>
            <div className="w-11 h-11 rounded-2xl bg-[#BE757C] text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-display font-semibold tracking-wide text-white">
                  Owner CRM &amp; Sales Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                  Authenticated ({ownerCreds.username})
                </span>
              </div>
              <p className="text-xs text-[#E8BAC0] font-sans-clean mt-0.5">
                Site Owner: <strong className="text-white">{OWNER_CONFIG.name}</strong> • Registered WhatsApp: <strong className="text-white">{OWNER_CONFIG.whatsappDisplay}</strong> • 2FA: <strong className="text-white">{ownerCreds.twoFactorEnabled ? 'Active' : 'Disabled'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 text-[#FFE8EC] hover:text-white text-xs font-semibold tracking-wider transition-all cursor-pointer border border-rose-300/40"
              title="Lock CRM and sign out of 2FA session"
            >
              <Lock className="w-3.5 h-3.5 text-[#E8BAC0]" />
              <span className="hidden md:inline">Lock / Sign Out</span>
            </button>

            <button
              onClick={handleResetForLaunch}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-500/25 text-[#FFF0F2] hover:text-white text-xs font-semibold tracking-wider transition-all cursor-pointer border border-white/20 hover:border-rose-300/40"
              title="Reset all test records to 0 for live launch"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#E8BAC0]" />
              <span className="hidden sm:inline">Reset for Launch</span>
            </button>

            <button
              onClick={() => exportCRMToCSV(records)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider transition-all cursor-pointer border border-white/20"
              title="Download full CSV spreadsheet of all sales and bookings"
            >
              <Download className="w-3.5 h-3.5 text-[#E8BAC0]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wider transition-all cursor-pointer border border-white/20"
              title="Print Today's CRM Agenda"
            >
              <Printer className="w-3.5 h-3.5 text-[#E8BAC0]" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold tracking-wider transition-all cursor-pointer border border-white/20"
              title="Close CRM and Return to Website"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#E8BAC0]" />
              <span className="hidden sm:inline">Back</span>
              <X className="w-4 h-4 ml-0.5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Live Metrics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 sm:p-6 bg-[#FAF3F4] border-b border-[#F0D5D8] shrink-0">
          <div className="bg-white p-3.5 rounded-2xl border border-[#E8BAC0]/60 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5852] block mb-1">
              Total Gross Booked &amp; Sold
            </span>
            <div className="text-xl sm:text-2xl font-bold font-display text-[#3D2B27]">
              £{metrics.totalGross.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#BE757C] font-semibold mt-0.5 block">
              {metrics.totalRecords} total transactions
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              💳 50% Deposits &amp; Paid Cash
            </span>
            <div className="text-xl sm:text-2xl font-bold font-display text-emerald-800">
              £{metrics.totalDeposits.toFixed(2)}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
              Directly secured online
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#BE757C]/40 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C3F48] block mb-1">
              🏛️ Due On Arrival (Balance)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-display text-[#BE757C]">
              £{metrics.totalPendingBalance.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#7A5852] font-medium mt-0.5 block">
              Collect at concierge
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E8BAC0]/60 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5852] block mb-1">
              💆‍♀️ Treatment Bookings
            </span>
            <div className="text-xl sm:text-2xl font-bold font-display text-[#3D2B27]">
              {metrics.bookingsCount}
            </div>
            <span className="text-[10px] text-[#7A5852] font-medium mt-0.5 block">
              Active spa reservations
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E8BAC0]/60 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5852] block mb-1">
              🛍️ Boutique Orders
            </span>
            <div className="text-xl sm:text-2xl font-bold font-display text-[#3D2B27]">
              {metrics.salesCount}
            </div>
            <span className="text-[10px] text-[#7A5852] font-medium mt-0.5 block">
              Botanical skincare sales
            </span>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#F0D5D8] bg-white shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {activeTab !== 'records' && (
              <button
                type="button"
                onClick={() => setActiveTab('records')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF0F2] text-[#8C3F48] hover:bg-[#F2D6DC] text-xs font-semibold tracking-wider transition-all cursor-pointer border border-[#E8BAC0] mr-1"
                title="Return to All Client Records"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Records</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-[#5C423E] text-white shadow-xs'
                  : 'bg-[#FFF0F2] text-[#5C423E] hover:bg-[#FADDE2]'
              }`}
            >
              All Client Records ({records.length})
            </button>

            <button
              onClick={() => setActiveTab('add_manual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'add_manual'
                  ? 'bg-[#BE757C] text-white shadow-xs'
                  : 'bg-[#FFF0F2] text-[#BE757C] hover:bg-[#FADDE2]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Phone / Walk-in</span>
            </button>

            <button
              onClick={() => setActiveTab('bank_settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bank_settings'
                  ? 'bg-[#BE757C] text-white shadow-xs'
                  : 'bg-[#FFF0F2] text-[#5C423E] hover:bg-[#FADDE2]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Bank &amp; Payment Details</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications_log')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'notifications_log'
                  ? 'bg-[#3D2B27] text-white shadow-xs'
                  : 'bg-[#FFF0F2] text-[#5C423E] hover:bg-[#FADDE2]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Owner Dispatch Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab('security_settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'security_settings'
                  ? 'bg-[#8C3F48] text-white shadow-xs'
                  : 'bg-[#FFF0F2] text-[#8C3F48] hover:bg-[#FADDE2]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Security &amp; 2FA</span>
            </button>
          </div>

          <div className="text-xs text-[#7A5852] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto-synced with localStorage &amp; instant notifications</span>
          </div>
        </div>

        {/* TAB 1: ALL CLIENT RECORDS */}
        {activeTab === 'records' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFF5F7] p-3.5 rounded-2xl border border-[#F0D0D5]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#7A5852] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by client name, telephone, email, ref # or service..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-white rounded-xl border border-[#E8BAC0] text-[#3D2B27] placeholder-[#A98882] focus:outline-hidden focus:border-[#BE757C]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7A5852] hover:text-black"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-[#BE757C] text-white shadow-2xs'
                      : 'bg-white text-[#5C4A45] hover:bg-[#FAF0F2] border border-[#E8BAC0]'
                  }`}
                >
                  All ({records.length})
                </button>
                <button
                  onClick={() => setFilterType('booking')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterType === 'booking'
                      ? 'bg-[#BE757C] text-white shadow-2xs'
                      : 'bg-white text-[#5C4A45] hover:bg-[#FAF0F2] border border-[#E8BAC0]'
                  }`}
                >
                  💆‍♀️ Bookings ({metrics.bookingsCount})
                </button>
                <button
                  onClick={() => setFilterType('sale')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterType === 'sale'
                      ? 'bg-[#BE757C] text-white shadow-2xs'
                      : 'bg-white text-[#5C4A45] hover:bg-[#FAF0F2] border border-[#E8BAC0]'
                  }`}
                >
                  🛍️ Boutique Sales ({metrics.salesCount})
                </button>
                <button
                  onClick={() => setFilterType('pending_balance')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterType === 'pending_balance'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-300'
                  }`}
                >
                  Due Balances
                </button>
              </div>

              {/* Status Selector */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white rounded-xl border border-[#E8BAC0] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
              >
                <option value="all">All Operational Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending_arrival">Pending Arrival</option>
                <option value="completed">Completed</option>
                <option value="dispatched">Dispatched</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Records List View */}
            {records.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#E8BAC0]/60 text-center space-y-4 max-w-xl mx-auto my-6 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-semibold font-display text-[#3D2B27]">
                    CRM Ready for Live Launch
                  </h3>
                  <p className="text-xs sm:text-sm text-[#7A5852] max-w-md mx-auto leading-relaxed">
                    All test and sample contents have been reset. When clients schedule sanctuary treatments or purchase from the Tropic Skincare boutique, their booking records, 50% deposit receipts, fulfillment notes, and WhatsApp dispatch alerts will arrive here in real time.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual_entry')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#BE757C] hover:bg-[#A86168] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Walk-in / Phone Client</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bank_settings')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFF0F2] hover:bg-[#FCE6E9] text-[#5C423E] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border border-[#E8BAC0]"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#BE757C]" />
                    <span>Verify Bank Details</span>
                  </button>
                </div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-[#E8BAC0]/60 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#FFF0F2] text-[#BE757C] flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#3D2B27]">No CRM records found</h3>
                <p className="text-xs text-[#7A5852] max-w-sm mx-auto">
                  No records matched your search parameters. Clear your filters or log a new walk-in client.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setSelectedStatusFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#BE757C] text-white text-xs font-semibold uppercase tracking-wider"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => {
                  const isBooking = record.type === 'booking';
                  const whatsAppUrl = generateOwnerWhatsAppUrl(record);
                  const emailData = generateOwnerEmailUrl(record);

                  return (
                    <div
                      key={record.id}
                      className="bg-white rounded-2xl border border-[#E8BAC0]/70 p-4 sm:p-5 shadow-xs hover:border-[#BE757C] transition-all space-y-4"
                    >
                      {/* Record Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F0D5D8]">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                              isBooking
                                ? 'bg-[#FFF0F2] text-[#BE757C] border-[#F0D0D5]'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            {isBooking ? '💆‍♀️ Spa Booking' : '🛍️ Boutique Sale'}
                          </span>

                          <span className="font-mono text-xs font-bold text-[#3D2B27]">
                            #{record.id}
                          </span>

                          <span className="text-[11px] text-[#7A5852]">
                            • {record.createdFormatted}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Operational Status Dropdown */}
                          <select
                            value={record.status}
                            onChange={(e) =>
                              handleStatusChange(record.id, e.target.value as CRMRecord['status'])
                            }
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-hidden ${getStatusBadge(
                              record.status
                            )}`}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="pending_arrival">Pending Arrival</option>
                            <option value="completed">Completed</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1.5 rounded-lg text-[#7A5852] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete record from CRM"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Main Grid: Booker Details, Treatment/Items, Financials */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Column 1: Client / Booker Info */}
                        <div className="bg-[#FAF3F4]/70 p-3.5 rounded-xl border border-[#F0D5D8] space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5852] block">
                            👤 Booker Information
                          </span>

                          <div className="font-bold text-sm text-[#3D2B27]">
                            {record.customer.name}
                          </div>

                          <div className="space-y-1 text-[11px] text-[#5C4A45]">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#BE757C] shrink-0" />
                              <a
                                href={`tel:${record.customer.phone}`}
                                className="hover:text-[#BE757C] font-medium"
                              >
                                {record.customer.phone}
                              </a>
                              <a
                                href={`https://wa.me/${record.customer.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-[10px] text-[#25D366] hover:underline flex items-center gap-0.5"
                                title="WhatsApp Customer directly"
                              >
                                <MessageCircle className="w-3 h-3" /> WA
                              </a>
                            </div>

                            {record.customer.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-[#BE757C] shrink-0" />
                                <a
                                  href={`mailto:${record.customer.email}`}
                                  className="hover:text-[#BE757C] truncate"
                                >
                                  {record.customer.email}
                                </a>
                              </div>
                            )}

                            {record.details.deliveryAddress && (
                              <div className="flex items-start gap-1.5 pt-1">
                                <MapPin className="w-3.5 h-3.5 text-[#BE757C] shrink-0 mt-0.5" />
                                <span className="leading-tight">{record.details.deliveryAddress}</span>
                              </div>
                            )}
                          </div>

                          {record.customer.notes && (
                            <div className="pt-1.5 border-t border-[#E8BAC0]/40 text-[11px] italic text-[#7A5852]">
                              "{record.customer.notes}"
                            </div>
                          )}
                        </div>

                        {/* Column 2: Ritual / Items Details */}
                        <div className="bg-[#FAF3F4]/70 p-3.5 rounded-xl border border-[#F0D5D8] space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5852] block">
                            {isBooking ? '💆‍♀️ Treatment Ritual' : '📦 Items Purchased'}
                          </span>

                          {isBooking ? (
                            <div className="space-y-1.5">
                              <div className="font-bold text-[#3D2B27] text-xs leading-snug">
                                {record.details.serviceTitle}
                              </div>

                              {record.details.skincareProduct && (
                                <div className="text-[11px] font-semibold text-emerald-800">
                                  {record.details.skincareProduct === 'tropic'
                                    ? '🌿 Product Line: Tropic (Fresh Botanicals)'
                                    : '🔬 Product Line: Clinicare (Active Cosmeceuticals)'}
                                </div>
                              )}

                              <div className="text-[11px] text-[#5C4A45]">
                                ⏱️ Duration: <strong>{record.details.duration}</strong>
                              </div>

                              <div className="pt-1 text-xs font-bold text-[#BE757C] flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{record.details.scheduledDate} at {record.details.scheduledTime}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <ul className="divide-y divide-[#E8BAC0]/30 text-[11px] text-[#5C4A45]">
                                {(record.details.items || []).map((item, idx) => (
                                  <li key={idx} className="py-1 flex justify-between">
                                    <span>
                                      {item.quantity}x {item.name}
                                    </span>
                                    <span className="font-bold text-[#3D2B27]">
                                      £{item.totalPrice.toFixed(2)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <div className="text-[10px] text-[#7A5852] pt-1">
                                {record.details.deliveryOption === 'collection'
                                  ? '📍 Collection at Blackpool Sanctuary'
                                  : '📦 UK Tracked Postal Dispatch'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Column 3: Financials & 50% Deposit Accounting */}
                        <div className="bg-[#FAF3F4]/70 p-3.5 rounded-xl border border-[#F0D5D8] space-y-2 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5852] block mb-1">
                              💰 Financial Breakdown
                            </span>

                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between text-[#5C4A45]">
                                <span>Total Service Fee:</span>
                                <span className="font-bold text-[#3D2B27]">
                                  £{record.financials.totalAmount.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded">
                                <span>
                                  {isBooking ? '💳 50% Deposit Paid:' : '✅ Amount Paid:'}
                                </span>
                                <span>£{record.financials.depositPaid.toFixed(2)}</span>
                              </div>

                              {isBooking && (
                                <div className="flex justify-between text-[#BE757C] font-bold pt-1">
                                  <span>Due on Arrival:</span>
                                  <span>£{record.financials.balanceDue.toFixed(2)}</span>
                                </div>
                              )}
                            </div>

                            <div className="text-[10px] text-[#7A5852] mt-1.5">
                              Paid via <strong>{record.financials.paymentMethod}</strong>
                              {record.financials.authCode && ` (${record.financials.authCode})`}
                            </div>
                          </div>

                          {/* Quick Notification Dispatch buttons for Owner */}
                          <div className="pt-2 border-t border-[#E8BAC0]/40 flex flex-wrap gap-1.5">
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-bold transition-all"
                              title={`Send formatted notification to registered WhatsApp (+44 7707 328060)`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp Owner</span>
                            </a>

                            <a
                              href={emailData.url}
                              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#5C423E] hover:bg-[#4A352F] text-white text-[11px] font-bold transition-all"
                              title={`Send formatted notification to ${OWNER_CONFIG.email}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email Owner</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Owner Private Notes Footer */}
                      <div className="pt-2 border-t border-[#F0D5D8] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5852] shrink-0">
                            🔒 Private Owner Notes:
                          </span>
                          {editingNoteId === record.id ? (
                            <div className="flex-1 flex items-center gap-1.5">
                              <input
                                type="text"
                                value={tempNoteText}
                                onChange={(e) => setTempNoteText(e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[#BE757C] bg-[#FFF9F9] focus:outline-hidden"
                                placeholder="Add client skin notes, preferences, or courier tracking..."
                              />
                              <button
                                onClick={() => handleSaveNote(record.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#BE757C] text-white font-bold text-xs cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingNoteId(null)}
                                className="px-2 py-1 text-xs text-[#7A5852] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-[#5C4A45] italic truncate">
                                {record.ownerNotes || 'No notes yet. Click edit to record preferences.'}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingNoteId(record.id);
                                  setTempNoteText(record.ownerNotes || '');
                                }}
                                className="text-[#BE757C] hover:underline flex items-center gap-1 text-[11px] font-medium shrink-0 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" /> Edit Note
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LOG PHONE / WALK-IN RESERVATION */}
        {activeTab === 'add_manual' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-[#E8BAC0]/70 p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-display font-bold text-[#3D2B27]">
                  Log Telephone or Walk-in Client
                </h3>
                <p className="text-xs text-[#7A5852] mt-0.5">
                  Register in-person appointments or phone orders directly into the Elysian CRM ledger with automatic 50% deposit calculations.
                </p>
              </div>

              {manualSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{manualSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateManualRecord} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setManualType('booking')}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      manualType === 'booking'
                        ? 'bg-[#BE757C] text-white border-[#A9636A]'
                        : 'bg-[#FFF9F9] text-[#5C4A45] border-[#E8BAC0]'
                    }`}
                  >
                    💆‍♀️ Spa Treatment Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('sale')}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      manualType === 'sale'
                        ? 'bg-[#BE757C] text-white border-[#A9636A]'
                        : 'bg-[#FFF9F9] text-[#5C4A45] border-[#E8BAC0]'
                    }`}
                  >
                    🛍️ Boutique Product Sale
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                      Guest Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mrs. Olivia Turner"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 07700 900123"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="olivia@example.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                  />
                </div>

                {manualType === 'booking' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                          Select Treatment
                        </label>
                        <select
                          value={manualServiceId}
                          onChange={(e) => setManualServiceId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        >
                          {SPA_SERVICES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                          Product Formulation
                        </label>
                        <div className="py-2 px-3 rounded-xl border border-[#BE757C]/40 bg-[#FFF4F6] text-xs font-semibold text-[#8C3F48] flex items-center gap-2">
                          <span>🔬</span> Clinicare Cosmeceuticals
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                          Duration
                        </label>
                        <select
                          value={manualDuration}
                          onChange={(e) => setManualDuration(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        >
                          <option value="30 mins Express">30 mins Express</option>
                          <option value="60 mins Full Ritual">60 mins Full Ritual</option>
                          <option value="90 mins Deluxe">90 mins Deluxe</option>
                          <option value="Series (4 Sessions)">Series (4 Sessions)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                          Time Slot
                        </label>
                        <select
                          value={manualTime}
                          onChange={(e) => setManualTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                        >
                          <option value="09:30 AM">09:30 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="01:00 PM">01:00 PM</option>
                          <option value="02:30 PM">02:30 PM</option>
                          <option value="04:00 PM">04:00 PM</option>
                          <option value="05:30 PM">05:30 PM</option>
                          <option value="07:00 PM">07:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                      Total Fee (£)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={manualFee}
                      onChange={(e) => setManualFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] font-bold focus:outline-hidden focus:border-[#BE757C]"
                    />
                    {manualType === 'booking' && (
                      <span className="text-[10px] text-[#BE757C] mt-1 block">
                        50% Deposit: £{(manualFee * 0.5).toFixed(2)} • Arrival Balance: £{(manualFee * 0.5).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                      Payment Method
                    </label>
                    <select
                      value={manualPaymentMethod}
                      onChange={(e) => setManualPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                    >
                      <option value="Card (Concierge Terminal)">Card (Concierge Terminal)</option>
                      <option value="Cash on Arrival">Cash on Arrival</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="PayPal / Online Invoice">PayPal / Online Invoice</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5C4A45] mb-1">
                    Client Preferences &amp; Private Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Sensitive skin on neck; prefers firm back pressure; requested chamomile infusion."
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('records')}
                    className="px-4 py-2.5 rounded-xl border border-[#E8BAC0] text-[#5C4A45] hover:bg-[#FAF0F2] font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#BE757C] hover:bg-[#A9636A] text-white font-bold tracking-wider uppercase shadow-xs transition-all"
                  >
                    Save to Owner CRM
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: OWNER DISPATCH ALERTS & CONTACT CHANNELS */}
        {activeTab === 'notifications_log' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-5">
            <div className="bg-white rounded-2xl border border-[#E8BAC0]/70 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#F0D5D8]">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#3D2B27]">
                    WhatsApp Owner Dispatch Gateway
                  </h3>
                  <p className="text-xs text-[#7A5852]">
                    Registered WhatsApp: <strong>{OWNER_CONFIG.whatsappDisplay}</strong> (Elaine Chong)
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#5C4A45] leading-relaxed">
                Every booking and sale automatically compiles a full WhatsApp alert containing all booker contact details, treatment duration, formulation, and 50% deposit accounting. You can trigger or resend this notification with one click from any record.
              </p>

              <div className="bg-[#FAF3F4] p-4 rounded-xl border border-[#E8BAC0]/50 text-xs font-mono text-[#5C423E] space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#BE757C] font-sans">
                  Sample Automated WhatsApp Message Format:
                </div>
                <div>🔔 *NEW BOOKING ALERT - ELYSIAN SPA &amp; WELLNESS*</div>
                <div>👤 *Guest:* Eleanor Vance (07890 123456)</div>
                <div>💆‍♀️ *Treatment:* CLINICARE Cosmeceutical Facial (60 mins)</div>
                <div>📅 *Date:* 10 Sep 2026 at 11:00 AM</div>
                <div>💰 *Fee:* £65.00 • *50% Deposit Paid:* £32.50 ✅</div>
                <div>🏛️ *Remaining Balance on Arrival:* £32.50</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8BAC0]/70 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#F0D5D8]">
                <div className="w-10 h-10 rounded-xl bg-[#BE757C]/20 text-[#BE757C] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#3D2B27]">
                    Email Notification Gateway
                  </h3>
                  <p className="text-xs text-[#7A5852]">
                    Registered Owner Email: <strong>{OWNER_CONFIG.email}</strong>
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#5C4A45] leading-relaxed">
                Immediate transaction reports are dispatched to <strong className="text-[#BE757C]">{OWNER_CONFIG.email}</strong> including complete customer addresses, payment authorization codes, and therapist preparation instructions.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: BANK & PAYMENT DETAILS CONFIGURATION */}
        {activeTab === 'bank_settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Header info banner */}
            <div className="bg-gradient-to-r from-[#FAF0F2] via-white to-[#FAF0F2] p-5 sm:p-6 rounded-2xl border border-[#E8BAC0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#5C423E] text-[#E8BAC0] flex items-center justify-center shrink-0 shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-display font-bold text-[#3D2B27]">
                      UK Bank Details &amp; Payment Settings
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[#7A5852] mt-0.5">
                    Configure your business bank account for receiving 50% reservation deposits and boutique skincare payments via UK Faster Payments (BACS).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyText(getFullBankShareText(), 'all_bank')}
                className="px-4 py-2 rounded-xl bg-white border border-[#BE757C]/40 hover:border-[#BE757C] text-[#5C423E] hover:text-[#BE757C] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                title="Copy ready-to-send bank details for WhatsApp or SMS"
              >
                {copiedField === 'all_bank' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied Full Details!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#BE757C]" />
                    <span>Copy Info for Client</span>
                  </>
                )}
              </button>
            </div>

            {/* Success Notification */}
            {bankSavedMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Bank details successfully saved!</strong> Clients booking appointments or buying boutique items will now see these updated transfer details on the payment step.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column */}
              <form onSubmit={handleSaveBankDetails} className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-[#E8BAC0]/70 shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2B27] pb-2 border-b border-[#F0D5D8] font-sans-clean flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#BE757C]" />
                  <span>Your Account Credentials</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-[#5C4A45] mb-1">
                    Account Name / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankDetails.accountName}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                    placeholder="e.g. Elaine Chong (Elysian Beauty Spa)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#BE757C]"
                  />
                  <span className="text-[10px] text-[#7A5852] mt-0.5 block">
                    The name registered on your UK business or personal bank account.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#5C4A45] mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      placeholder="e.g. Barclays Bank UK"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#BE757C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5C4A45] mb-1">
                      UK Sort Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.sortCode}
                      onChange={(e) => setBankDetails({ ...bankDetails, sortCode: e.target.value })}
                      placeholder="e.g. 20-09-72"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] text-xs sm:text-sm font-mono font-bold focus:outline-hidden focus:border-[#BE757C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#5C4A45] mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                      placeholder="e.g. 83920145"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] text-xs sm:text-sm font-mono font-bold focus:outline-hidden focus:border-[#BE757C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5C4A45] mb-1">
                      PayPal Account / Email
                    </label>
                    <input
                      type="email"
                      value={bankDetails.paypalEmail}
                      onChange={(e) => setBankDetails({ ...bankDetails, paypalEmail: e.target.value })}
                      placeholder="e.g. elainecll@hotmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#BE757C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C4A45] mb-1">
                    Client Payment Reference Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={bankDetails.referenceInstructions}
                    onChange={(e) => setBankDetails({ ...bankDetails, referenceInstructions: e.target.value })}
                    placeholder="e.g. Please use your Booking ID (e.g. ELS-...) or Surname as the transfer reference"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8BAC0] bg-[#FFF9F9] text-[#3D2B27] text-xs focus:outline-hidden focus:border-[#BE757C]"
                  />
                </div>

                {/* Optional International details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A5852] mb-1">
                      IBAN (Optional International)
                    </label>
                    <input
                      type="text"
                      value={bankDetails.iban || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                      placeholder="e.g. GB29BARC20097283920145"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0]/70 bg-[#FFFDFD] text-[#3D2B27] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A5852] mb-1">
                      BIC / SWIFT (Optional)
                    </label>
                    <input
                      type="text"
                      value={bankDetails.bic || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, bic: e.target.value })}
                      placeholder="e.g. BARCGB22"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8BAC0]/70 bg-[#FFFDFD] text-[#3D2B27] text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="pt-2 border-t border-[#F0D5D8] space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bankDetails.enabledForBookings}
                      onChange={(e) => setBankDetails({ ...bankDetails, enabledForBookings: e.target.checked })}
                      className="w-4 h-4 accent-[#BE757C] rounded cursor-pointer"
                    />
                    <span className="text-xs text-[#3D2B27] font-medium">
                      Enable Direct Bank Transfer on 50% Deposit Booking Checkout
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bankDetails.enabledForBoutique}
                      onChange={(e) => setBankDetails({ ...bankDetails, enabledForBoutique: e.target.checked })}
                      className="w-4 h-4 accent-[#BE757C] rounded cursor-pointer"
                    />
                    <span className="text-xs text-[#3D2B27] font-medium">
                      Enable Direct Bank Transfer on Boutique Skincare Order Checkout
                    </span>
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#BE757C] hover:bg-[#A9636A] text-white text-xs font-bold tracking-wider uppercase shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Bank Details</span>
                  </button>
                </div>
              </form>

              {/* Preview Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#FAF0F2] rounded-2xl p-5 border border-[#E8BAC0] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8BAC0]/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#BE757C] font-sans-clean flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Client Checkout Preview
                    </span>
                    <span className="text-[10px] text-[#7A5852] font-semibold">
                      UK Faster Payments
                    </span>
                  </div>

                  <p className="text-[11px] text-[#5C4A45] leading-relaxed">
                    This is the exact payment card your guests will see when choosing Bank Transfer for their 50% deposit or boutique orders:
                  </p>

                  <div className="bg-white rounded-xl p-4 border border-[#E8BAC0] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#7A5852]">Bank</span>
                      <span className="text-xs font-bold text-[#3D2B27]">{bankDetails.bankName || 'Barclays'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#7A5852]">Account Name</span>
                      <span className="text-xs font-semibold text-[#3D2B27]">{bankDetails.accountName || 'Elaine Chong'}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-t border-b border-[#FAF0F2]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#7A5852] block">Sort Code</span>
                        <span className="text-sm font-mono font-bold text-[#BE757C]">
                          {bankDetails.sortCode || '20-09-72'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(bankDetails.sortCode, 'sortCode')}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF0F2] hover:bg-[#F5E0E4] text-[#BE757C] text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'sortCode' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'sortCode' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#FAF0F2]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#7A5852] block">Account Number</span>
                        <span className="text-sm font-mono font-bold text-[#BE757C]">
                          {bankDetails.accountNumber || '83920145'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(bankDetails.accountNumber, 'accountNumber')}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF0F2] hover:bg-[#F5E0E4] text-[#BE757C] text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'accountNumber' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'accountNumber' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#7A5852] block mb-0.5">Reference Note</span>
                      <p className="text-[11px] text-[#5C423E] font-medium bg-[#FAF3F4] p-2 rounded-lg border border-[#E8BAC0]/50">
                        {bankDetails.referenceInstructions}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#7A5852] space-y-1">
                    <p className="flex items-center gap-1 text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Instant 0% transaction fee via UK Faster Payments</span>
                    </p>
                    <p>Funds clear directly into your bank account with zero third-party merchant deductions.</p>
                  </div>
                </div>

                {/* Direct Concierge Help */}
                <div className="bg-white p-4 rounded-xl border border-[#E8BAC0]/70 text-xs text-[#5C4A45] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D2B27] block">
                    Owner Concierge WhatsApp
                  </span>
                  <p>
                    Need to verify an incoming deposit with a guest? You can WhatsApp them directly from their CRM record anytime.
                  </p>
                  <a
                    href={`https://wa.me/${OWNER_CONFIG.whatsappRaw}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#25D366] font-bold hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Elaine ({OWNER_CONFIG.phoneDisplay})</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY & 2FA SETTINGS */}
        {activeTab === 'security_settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-[#FFF0F2] via-[#FAF0F2] to-[#FFF5F7] rounded-3xl p-5 sm:p-6 border border-[#E8BAC0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BE757C] to-[#8C3F48] text-white flex items-center justify-center shadow-md shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-display font-bold text-[#3D2B27]">
                      Owner Authentication &amp; 2FA Security Center
                    </h3>
                    <p className="text-xs text-[#7A5852] mt-0.5">
                      Logged in as <strong className="text-[#3D2B27]">{ownerCreds.username}</strong> • 2FA Status: <span className="font-bold text-emerald-700">{ownerCreds.twoFactorEnabled ? 'Enabled (Active)' : 'Disabled'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl bg-[#5C423E] hover:bg-[#3D2B27] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock &amp; Sign Out</span>
                </button>
              </div>

              {securitySuccess && (
                <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{securitySuccess}</span>
                </div>
              )}

              {securityError && (
                <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{securityError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Account & Password Credentials */}
                <form
                  onSubmit={handleSaveSecuritySettings}
                  className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#E8BAC0]/70 shadow-xs space-y-4"
                >
                  <div className="border-b border-[#F0D5D8] pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#3D2B27] flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#BE757C]" />
                        <span>Update Owner Credentials</span>
                      </h4>
                      <p className="text-[11px] text-[#7A5852] mt-0.5">
                        Customize your username and password for future logins.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1">
                      Owner Username:
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="e.g. elaine"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FFF9F9] border border-[#E8BAC0] text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1">
                        New Password (optional):
                      </label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Leave blank to keep"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#FFF9F9] border border-[#E8BAC0] text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1">
                        Confirm New Password:
                      </label>
                      <input
                        type="password"
                        value={editConfirmPassword}
                        onChange={(e) => setEditConfirmPassword(e.target.value)}
                        placeholder="Re-type password"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#FFF9F9] border border-[#E8BAC0] text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1">
                      Registered 2FA Phone Number:
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+44 7707 32 8060"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FFF9F9] border border-[#E8BAC0] text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                    />
                    <p className="text-[10px] text-[#7A5852] mt-1">
                      Used to dispatch your 6-digit one-time verification passcode.
                    </p>
                  </div>

                  {/* 2FA Toggle */}
                  <div className="pt-2 border-t border-[#F0D5D8] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#3D2B27] block">
                        Require Two-Step Verification (2FA)
                      </span>
                      <span className="text-[11px] text-[#7A5852]">
                        Demands a 6-digit SMS / Push verification code after entering password.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editTwoFactor}
                        onChange={(e) => setEditTwoFactor(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BE757C]"></div>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#BE757C] hover:bg-[#8C3F48] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Security Settings</span>
                    </button>
                  </div>
                </form>

                {/* Right Column: Emergency Backup Codes & Quick Access Info */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Backup Codes Card */}
                  <div className="bg-[#FAF0F2] rounded-3xl p-5 border border-[#E8BAC0] shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8BAC0]/60">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8C3F48] flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-[#BE757C]" />
                        Emergency Backup Codes
                      </span>
                      <span className="text-[10px] text-[#7A5852] font-semibold">
                        {ownerCreds.backupCodes.length} remaining
                      </span>
                    </div>

                    <p className="text-[11px] text-[#5C4A45] leading-relaxed">
                      Use these one-time codes if your phone is unavailable. Each code can be entered into the 2FA login gate:
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {ownerCreds.backupCodes.map((code, idx) => (
                        <div
                          key={idx}
                          className="bg-white px-3 py-2 rounded-xl border border-[#E8BAC0] text-center font-mono text-xs font-bold text-[#8C3F48] shadow-2xs flex items-center justify-between"
                        >
                          <span>{code}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(code);
                              setSecuritySuccess(`Copied backup code ${code}`);
                              setTimeout(() => setSecuritySuccess(''), 2000);
                            }}
                            title="Copy code"
                            className="text-[#A6888B] hover:text-[#BE757C] transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleRegenerateBackupCodes}
                        className="w-full py-2 rounded-xl bg-white hover:bg-[#FFF0F2] border border-[#BE757C]/40 text-[#BE757C] hover:text-[#8C3F48] text-xs font-bold tracking-wider uppercase transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate 5 New Codes</span>
                      </button>
                    </div>
                  </div>

                  {/* Private Access Instructions */}
                  <div className="bg-white rounded-3xl p-5 border border-[#E8BAC0]/70 text-xs text-[#5C4A45] space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#3D2B27] block">
                      🔒 How to Access Your Hidden CRM:
                    </span>
                    <ul className="space-y-1.5 text-[11px]">
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#BE757C] font-bold">•</span>
                        <span>
                          <strong>Keyboard Shortcut:</strong> Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono text-[10px] text-gray-800">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono text-[10px] text-gray-800">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono text-[10px] text-gray-800">A</kbd> anywhere on the site.
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#BE757C] font-bold">•</span>
                        <span>
                          <strong>Footer Link:</strong> Click the discreet <code className="text-[#BE757C] font-semibold">Staff Access</code> link in the footer copyright line.
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#BE757C] font-bold">•</span>
                        <span>
                          <strong>URL Direct:</strong> Append <code className="text-[#BE757C] font-semibold">#admin</code> or <code className="text-[#BE757C] font-semibold">#crm</code> to the website address.
                        </span>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-[#FAF3F4] px-5 sm:px-8 py-3.5 border-t border-[#F0D5D8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7A5852] shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#BE757C]" />
            <span>Secure owner records • Data persisted across all browser sessions</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#5C423E] hover:bg-[#4A352F] text-white font-bold tracking-wider uppercase transition-all cursor-pointer"
          >
            Close CRM Hub
          </button>
        </div>

      </div>
    </div>
  );
};
