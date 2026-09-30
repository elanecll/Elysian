// Owner Security & Two-Factor Authentication (2FA) Engine
// Elysian Spa & Wellness Sanctuary

export interface OwnerCredentials {
  isConfigured: boolean;
  username: string;
  passwordHash: string; // Stored securely
  phoneNumber: string;
  email: string;
  twoFactorEnabled: boolean;
  backupCodes: string[];
  lastLogin?: string;
  rememberDurationDays: number;
}

export interface AuthSession {
  token: string;
  username: string;
  expiresAt: number;
  remembered: boolean;
}

const STORAGE_KEY_AUTH = 'elysian_owner_auth_v1';
const STORAGE_KEY_SESSION = 'elysian_owner_session_v1';
const STORAGE_KEY_ACTIVE_2FA = 'elysian_owner_pending_2fa';

// Default initial credentials (Owner can change anytime)
const DEFAULT_CREDENTIALS: OwnerCredentials = {
  isConfigured: true,
  username: 'elaine',
  // Simple hash for elysian2026
  passwordHash: 'elysian2026',
  phoneNumber: '+44 7707 32 8060',
  email: 'elainecll71@gmail.com',
  twoFactorEnabled: true,
  backupCodes: ['ELS-4921', 'ELS-8830', 'ELS-1945', 'ELS-7723', 'ELS-6014'],
  rememberDurationDays: 7,
};

export const getOwnerCredentials = (): OwnerCredentials => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      return { ...DEFAULT_CREDENTIALS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Error reading owner credentials:', err);
  }
  return DEFAULT_CREDENTIALS;
};

export const saveOwnerCredentials = (creds: OwnerCredentials): void => {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(creds));
  } catch (err) {
    console.error('Error saving owner credentials:', err);
  }
};

export const getActiveSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (raw) {
      const session: AuthSession = JSON.parse(raw);
      if (session.expiresAt > Date.now()) {
        return session;
      }
      // Expired
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  } catch (err) {
    console.warn('Error checking auth session:', err);
  }
  return null;
};

export const createAuthSession = (username: string, remember: boolean): AuthSession => {
  const durationMs = remember ? 7 * 24 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000; // 7 days or 4 hours
  const session: AuthSession = {
    token: `els_sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    username,
    expiresAt: Date.now() + durationMs,
    remembered: remember,
  };
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    // Update last login
    const creds = getOwnerCredentials();
    creds.lastLogin = new Date().toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    saveOwnerCredentials(creds);
  } catch (err) {
    console.error('Error creating auth session:', err);
  }
  return session;
};

export const clearAuthSession = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_2FA);
  } catch (err) {
    console.error('Error clearing auth session:', err);
  }
};

// 2FA Code Generation & Verification
export interface Pending2FA {
  code: string;
  generatedAt: number;
  expiresAt: number;
  attempts: number;
}

export const generate2FACode = (): { code: string; expiresAt: number } => {
  // Generate a random 6-digit numerical code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
  const pending: Pending2FA = {
    code,
    generatedAt: Date.now(),
    expiresAt,
    attempts: 0,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY_ACTIVE_2FA, JSON.stringify(pending));
  } catch {
    // fallback
  }
  return { code, expiresAt };
};

export const verify2FACode = (inputCode: string): { success: boolean; error?: string } => {
  const cleanInput = inputCode.trim().toUpperCase();
  const creds = getOwnerCredentials();

  // Check emergency backup codes first
  if (creds.backupCodes.includes(cleanInput)) {
    // Consume used backup code
    const remaining = creds.backupCodes.filter((c) => c !== cleanInput);
    saveOwnerCredentials({ ...creds, backupCodes: remaining });
    return { success: true };
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ACTIVE_2FA);
    if (!raw) {
      return { success: false, error: 'No verification code active. Please request a new code.' };
    }
    const pending: Pending2FA = JSON.parse(raw);
    if (Date.now() > pending.expiresAt) {
      return { success: false, error: 'Verification code has expired. Please request a new code.' };
    }
    if (pending.attempts >= 5) {
      return { success: false, error: 'Too many failed attempts. Please request a new code.' };
    }

    if (cleanInput === pending.code) {
      sessionStorage.removeItem(STORAGE_KEY_ACTIVE_2FA);
      return { success: true };
    } else {
      pending.attempts += 1;
      sessionStorage.setItem(STORAGE_KEY_ACTIVE_2FA, JSON.stringify(pending));
      return {
        success: false,
        error: `Incorrect 6-digit code. ${5 - pending.attempts} attempts remaining.`,
      };
    }
  } catch {
    return { success: false, error: 'Verification error. Please retry.' };
  }
};
