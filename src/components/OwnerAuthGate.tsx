import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import {
  getOwnerCredentials,
  saveOwnerCredentials,
  createAuthSession,
  generate2FACode,
  verify2FACode,
  OwnerCredentials,
} from '../data/ownerAuth';

interface OwnerAuthGateProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const OwnerAuthGate: React.FC<OwnerAuthGateProps> = ({ onSuccess, onClose }) => {
  const [credentials, setCredentials] = useState<OwnerCredentials>(() => getOwnerCredentials());
  const [authStep, setAuthStep] = useState<'credentials' | 'two_factor' | 'setup_new'>('credentials');

  // Step 1: Credentials
  const [usernameInput, setUsernameInput] = useState(credentials.username || 'elaine');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [credError, setCredError] = useState('');

  // Step 2: 2FA
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [activeDispatchCode, setActiveDispatchCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [simulatedNotificationVisible, setSimulatedNotificationVisible] = useState(false);

  // Setup / Customize credentials
  const [newUsername, setNewUsername] = useState(credentials.username || 'elaine');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPhone, setNewPhone] = useState(credentials.phoneNumber || '+44 7707 32 8060');
  const [setupSuccessMsg, setSetupSuccessMsg] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start 2FA dispatch when entering two_factor step
  const trigger2FADispatch = () => {
    const { code } = generate2FACode();
    setActiveDispatchCode(code);
    setOtpCode(['', '', '', '', '', '']);
    setOtpError('');
    setResendCooldown(30);
    setSimulatedNotificationVisible(true);
    // Focus first input after render
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  // Cooldown countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authStep === 'two_factor' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authStep, resendCooldown]);

  // Handle Step 1 Submit
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');

    const trimmedUser = usernameInput.trim().toLowerCase();
    const storedUser = credentials.username.toLowerCase();

    if (!trimmedUser || !passwordInput) {
      setCredError('Please enter both your owner username and password.');
      return;
    }

    if (trimmedUser !== storedUser || passwordInput !== credentials.passwordHash) {
      setCredError('Invalid owner credentials. Please check your username and password.');
      return;
    }

    // Credentials valid
    if (credentials.twoFactorEnabled) {
      setAuthStep('two_factor');
      trigger2FADispatch();
    } else {
      // Direct login if 2FA disabled
      createAuthSession(credentials.username, rememberMe);
      onSuccess();
    }
  };

  // Handle OTP box changes
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = digit;
    setOtpCode(newOtp);
    setOtpError('');

    // Auto advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit on all filled
    if (digit && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        verifyCodeSubmission(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const newOtp = [...otpCode];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtpCode(newOtp);
    if (pasteData.length === 6) {
      verifyCodeSubmission(pasteData);
    } else {
      inputRefs.current[pasteData.length]?.focus();
    }
  };

  // Autofill simulated code helper
  const handleQuickAutofill = () => {
    if (activeDispatchCode && activeDispatchCode.length === 6) {
      const digits = activeDispatchCode.split('');
      setOtpCode(digits);
      verifyCodeSubmission(activeDispatchCode);
    }
  };

  const verifyCodeSubmission = (codeToVerify: string) => {
    const result = verify2FACode(codeToVerify);
    if (result.success) {
      createAuthSession(credentials.username, rememberMe);
      onSuccess();
    } else {
      setOtpError(result.error || 'Invalid verification code. Please check and retry.');
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (useBackupCode) {
      if (!backupCodeInput.trim()) {
        setOtpError('Please enter a valid Emergency Backup Code (e.g. ELS-4921).');
        return;
      }
      const result = verify2FACode(backupCodeInput);
      if (result.success) {
        createAuthSession(credentials.username, rememberMe);
        onSuccess();
      } else {
        setOtpError('Invalid backup code. It may have already been consumed.');
      }
      return;
    }

    const fullCode = otpCode.join('');
    if (fullCode.length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }
    verifyCodeSubmission(fullCode);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setTimeout(() => {
      trigger2FADispatch();
      setIsResending(false);
    }, 400);
  };

  // Handle Save New Credentials (Customize)
  const handleSaveNewSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');
    if (!newUsername.trim()) {
      setCredError('Username cannot be blank.');
      return;
    }
    if (newPassword.length < 6) {
      setCredError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setCredError('Passwords do not match. Please re-enter.');
      return;
    }

    const updated: OwnerCredentials = {
      ...credentials,
      isConfigured: true,
      username: newUsername.trim(),
      passwordHash: newPassword,
      phoneNumber: newPhone.trim() || credentials.phoneNumber,
    };
    saveOwnerCredentials(updated);
    setCredentials(updated);
    setUsernameInput(updated.username);
    setPasswordInput(newPassword);
    setSetupSuccessMsg('Credentials saved successfully! Logging in...');

    setTimeout(() => {
      setSetupSuccessMsg('');
      setAuthStep('two_factor');
      trigger2FADispatch();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFF9F9] rounded-3xl border border-[#E8BAC0]/60 shadow-2xl overflow-hidden">
        {/* Subtle Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#BE757C] via-[#E8BAC0] to-[#BE757C]" />

        {/* Back Button */}
        <button
          type="button"
          onClick={authStep === 'credentials' ? onClose : () => setAuthStep('credentials')}
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF0F2] hover:bg-[#FCE8EB] text-[#8C3F48] text-xs font-semibold tracking-wider transition-all cursor-pointer z-10 border border-[#E8BAC0]/60 shadow-2xs"
          title={authStep === 'credentials' ? "Back to Sanctuary Website" : "Back to Password Login"}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#7A5852] hover:text-[#BE757C] hover:bg-[#FFF0F2] rounded-full transition-all cursor-pointer z-10"
          title="Exit Owner Vault"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 sm:p-7 text-center border-b border-[#F0D0D5]/60 bg-gradient-to-b from-[#FFF0F2] to-[#FFF9F9]">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#BE757C] to-[#8C3F48] text-white shadow-md mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-[#E8BAC0] text-[10px] tracking-[0.2em] font-bold text-[#8C3F48] uppercase shadow-2xs mb-2">
            <ShieldCheck className="w-3 h-3 text-[#BE757C]" />
            Restricted Management Area
          </div>
          <h2 className="text-xl sm:text-2xl font-display text-[#3D2B27]">
            {authStep === 'two_factor' ? 'Two-Step 2FA Verification' : authStep === 'setup_new' ? 'Customize Owner Account' : 'Owner CRM Portal Login'}
          </h2>
          <p className="text-xs text-[#7A5852] mt-1 max-w-xs mx-auto">
            {authStep === 'two_factor'
              ? 'Authorized management security verification required to access client and financial records.'
              : authStep === 'setup_new'
              ? 'Set your private username, password, and recovery phone number.'
              : 'Enter your owner credentials to unlock your client management and bookings hub.'}
          </p>
        </div>

        {/* ================= STEP 1: CREDENTIALS LOGIN ================= */}
        {authStep === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="p-6 sm:p-7 space-y-4">
            {credError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{credError}</span>
              </div>
            )}

            {/* Quick credentials hint for owner ease */}
            <div className="p-3 bg-[#FAF0F2] rounded-xl border border-[#F0D5D8] flex items-center justify-between text-[11px] text-[#7A5852]">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#BE757C]" />
                Default login: <strong className="text-[#3D2B27] font-mono">elaine</strong> / <strong className="text-[#3D2B27] font-mono">elysian2026</strong>
              </span>
              <button
                type="button"
                onClick={() => setAuthStep('setup_new')}
                className="text-[#BE757C] hover:text-[#8C3F48] font-semibold underline underline-offset-2 cursor-pointer"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1 font-sans-clean">
                Owner Username:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. elaine"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8BAC0] text-sm text-[#3D2B27] placeholder:text-[#A6888B] focus:outline-hidden focus:border-[#BE757C] focus:ring-1 focus:ring-[#BE757C]"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#4A352F] font-sans-clean">
                  Security Password:
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white border border-[#E8BAC0] text-sm text-[#3D2B27] placeholder:text-[#A6888B] focus:outline-hidden focus:border-[#BE757C] focus:ring-1 focus:ring-[#BE757C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A5852] hover:text-[#BE757C] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#5C4A45]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#BE757C] focus:ring-[#BE757C] accent-[#BE757C]"
                />
                <span>Remember this device (7 days)</span>
              </label>

              <button
                type="button"
                onClick={() => setAuthStep('setup_new')}
                className="text-[#BE757C] hover:text-[#8C3F48] font-medium hover:underline cursor-pointer"
              >
                Create / Reset
              </button>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl border border-[#E8BAC0] text-[#5C423E] hover:bg-[#FAF0F2] text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                title="Return to Sanctuary Website"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to 2FA Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: 2-FACTOR AUTHENTICATION ================= */}
        {authStep === 'two_factor' && (
          <form onSubmit={handle2FASubmit} className="p-6 sm:p-7 space-y-4">
            {/* Real-time Simulated Notification Pill */}
            {simulatedNotificationVisible && activeDispatchCode && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#FAF0F2] to-[#FFF5F7] border border-[#E8BAC0] text-xs text-[#3D2B27] shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-[#8C3F48]">
                    <Smartphone className="w-3.5 h-3.5 text-[#BE757C]" />
                    Simulated SMS to {credentials.phoneNumber}:
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-[#7A5852]">Just now</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#F0D0D5]">
                  <span className="font-mono text-sm tracking-widest font-bold text-[#BE757C]">
                    {activeDispatchCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickAutofill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#BE757C] text-white font-semibold text-[11px] shadow-2xs hover:bg-[#8C3F48] transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Autofill Code</span>
                  </button>
                </div>
              </div>
            )}

            {otpError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            {!useBackupCode ? (
              <div>
                <label className="block text-center text-xs font-semibold text-[#4A352F] mb-3">
                  Enter the 6-digit code sent to your phone:
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className="w-10 sm:w-12 h-12 text-center text-lg sm:text-xl font-bold font-mono rounded-xl bg-white border border-[#E8BAC0] text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C] focus:ring-2 focus:ring-[#BE757C]/30 shadow-2xs transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 text-xs text-[#7A5852]">
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(true)}
                    className="text-[#BE757C] hover:text-[#8C3F48] underline underline-offset-2 cursor-pointer"
                  >
                    Use Backup Code
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isResending}
                    className={`inline-flex items-center gap-1 font-semibold ${
                      resendCooldown > 0 || isResending
                        ? 'text-[#A6888B] cursor-not-allowed'
                        : 'text-[#BE757C] hover:text-[#8C3F48] cursor-pointer'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend Code'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1">
                  Enter Emergency Backup Code:
                </label>
                <input
                  type="text"
                  value={backupCodeInput}
                  onChange={(e) => setBackupCodeInput(e.target.value)}
                  placeholder="e.g. ELS-4921"
                  className="w-full px-4 py-2.5 font-mono text-center tracking-widest text-base rounded-xl bg-white border border-[#E8BAC0] text-[#3D2B27] placeholder:text-[#A6888B] focus:outline-hidden focus:border-[#BE757C]"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-[11px] text-[#7A5852]">
                    Sample valid code: <code className="font-bold text-[#8C3F48]">ELS-4921</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(false)}
                    className="text-[#BE757C] hover:text-[#8C3F48] underline underline-offset-2 cursor-pointer"
                  >
                    Back to 6-digit SMS
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAuthStep('credentials')}
                className="py-3 px-4 rounded-xl border border-[#E8BAC0] text-[#5C423E] hover:bg-[#FAF0F2] text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                title="Back to Password Login"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#BE757C] to-[#8C3F48] hover:from-[#A9636A] hover:to-[#76333B] text-white font-medium text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify &amp; Unlock</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: CUSTOMIZE / SETUP NEW CREDENTIALS ================= */}
        {authStep === 'setup_new' && (
          <form onSubmit={handleSaveNewSetup} className="p-6 sm:p-7 space-y-3.5">
            {credError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{credError}</span>
              </div>
            )}

            {setupSuccessMsg && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{setupSuccessMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1 font-sans-clean">
                New Username:
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Choose username (e.g. elaine)"
                className="w-full px-4 py-2 rounded-xl bg-white border border-[#E8BAC0] text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1 font-sans-clean">
                New Password:
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2 rounded-xl bg-white border border-[#E8BAC0] text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1 font-sans-clean">
                Confirm Password:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-2 rounded-xl bg-white border border-[#E8BAC0] text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A352F] mb-1 font-sans-clean">
                Owner Phone Number (for 2FA dispatch):
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+44 7707 32 8060"
                className="w-full px-4 py-2 rounded-xl bg-white border border-[#E8BAC0] text-sm text-[#3D2B27] focus:outline-hidden focus:border-[#BE757C]"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAuthStep('credentials')}
                className="flex-1 py-2.5 rounded-xl border border-[#E8BAC0] text-[#5C423E] hover:bg-[#FAF0F2] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                title="Back to Login"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#BE757C] hover:bg-[#8C3F48] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-sm cursor-pointer"
              >
                Save &amp; Proceed
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="px-6 py-4 bg-[#FCECEE]/50 border-t border-[#F0D0D5]/70 flex items-center justify-between text-[11px] text-[#7A5852]">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#BE757C]" />
            Encrypted Session
          </span>
          <span className="text-[10px] text-[#7A5852]/80">
            Elysian Vault v2.6 • 2FA Protected
          </span>
        </div>
      </div>
    </div>
  );
};
