/**
 * Security, Access Control & Hospital Backoffice Protection
 * For Thai Traditional Medicine Clinic - Phra Nakhon Si Ayutthaya Hospital
 */

export interface SecurityConfig {
  adminPassword: string;
  staffPassword: string;
  clinicSecurityPin: string; // 6-digit hospital clinic authorization passcode
  requireClinicPin: boolean;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  username: string;
  role: 'admin' | 'staff' | 'unknown';
  success: boolean;
  note: string;
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  adminPassword: 'admin1234',
  staffPassword: 'clinic2026',
  clinicSecurityPin: '254099',
  requireClinicPin: false, // ปิดการบังคับ PIN เริ่มต้น เพื่อให้เข้าใช้งานง่าย ไม่ซับซ้อน
  maxFailedAttempts: 10,
  lockoutDurationMinutes: 5,
  sessionTimeoutMinutes: 0, // 0 = ปิดการตัดเซสชันอัตโนมัติ เพื่อไม่ให้รบกวนการทำงานระหว่างนวดคนไข้
};

const SECURITY_CONFIG_KEY = 'panthai_ayhos_security_config_v3';
const LOCKOUT_KEY = 'panthai_ayhos_security_lockout_v3';
const AUDIT_LOG_KEY = 'panthai_ayhos_security_audit_v3';

// 1. Config Management
export function getSecurityConfig(): SecurityConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_SECURITY_CONFIG;
  }
  try {
    const raw = window.localStorage.getItem(SECURITY_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SECURITY_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Error reading security config:', e);
  }
  return DEFAULT_SECURITY_CONFIG;
}

export function saveSecurityConfig(config: Partial<SecurityConfig>): SecurityConfig {
  const current = getSecurityConfig();
  const updated: SecurityConfig = { ...current, ...config };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(SECURITY_CONFIG_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving security config:', e);
    }
  }
  return updated;
}

// 2. Lockout & Brute-Force Rate Limiting
interface LockoutState {
  failedAttempts: number;
  lockoutUntil: number | null; // timestamp ms
}

export function getLockoutStatus(): {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsRemaining: number;
  failedAttempts: number;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsRemaining: DEFAULT_SECURITY_CONFIG.maxFailedAttempts,
      failedAttempts: 0,
    };
  }

  const config = getSecurityConfig();
  try {
    const raw = window.localStorage.getItem(LOCKOUT_KEY);
    if (!raw) {
      return {
        isLocked: false,
        remainingSeconds: 0,
        attemptsRemaining: config.maxFailedAttempts,
        failedAttempts: 0,
      };
    }
    const state: LockoutState = JSON.parse(raw);
    const now = Date.now();

    if (state.lockoutUntil && state.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((state.lockoutUntil - now) / 1000);
      return {
        isLocked: true,
        remainingSeconds,
        attemptsRemaining: 0,
        failedAttempts: state.failedAttempts || config.maxFailedAttempts,
      };
    }

    // Expired lockout
    if (state.lockoutUntil && state.lockoutUntil <= now) {
      resetLockout();
      return {
        isLocked: false,
        remainingSeconds: 0,
        attemptsRemaining: config.maxFailedAttempts,
        failedAttempts: 0,
      };
    }

    const failedAttempts = state.failedAttempts || 0;
    const attemptsRemaining = Math.max(0, config.maxFailedAttempts - failedAttempts);
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsRemaining,
      failedAttempts,
    };
  } catch {
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsRemaining: config.maxFailedAttempts,
      failedAttempts: 0,
    };
  }
}

export function recordFailedAttempt(username: string, role: 'admin' | 'staff' | 'unknown', reason: string): { isLocked: boolean; remainingSeconds: number } {
  const config = getSecurityConfig();
  let state: LockoutState = { failedAttempts: 0, lockoutUntil: null };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCKOUT_KEY);
      if (raw) {
        state = JSON.parse(raw);
      }
    } catch {
      // fallback
    }

    state.failedAttempts += 1;

    let isLocked = false;
    let remainingSeconds = 0;

    if (state.failedAttempts >= config.maxFailedAttempts) {
      const lockDurationMs = config.lockoutDurationMinutes * 60 * 1000;
      state.lockoutUntil = Date.now() + lockDurationMs;
      isLocked = true;
      remainingSeconds = config.lockoutDurationMinutes * 60;
    }

    try {
      window.localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
    } catch {
      // fallback
    }

    // Record audit
    addAuditEntry({
      username,
      role,
      success: false,
      note: isLocked
        ? `ระงับสิทธิ์ชั่วคราว ${config.lockoutDurationMinutes} นาที (ใส่รหัสผิดครบ ${config.maxFailedAttempts} ครั้ง)`
        : `ใส่รหัสผิดครั้งที่ ${state.failedAttempts}/${config.maxFailedAttempts} (${reason})`,
    });

    return { isLocked, remainingSeconds };
  }

  return { isLocked: false, remainingSeconds: 0 };
}

export function resetLockout(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LOCKOUT_KEY);
    } catch {
      // fallback
    }
  }
}

// 3. Audit Log
export function getAuditLogs(): SecurityAuditEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(AUDIT_LOG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return [];
}

export function addAuditEntry(entry: Omit<SecurityAuditEntry, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const logs = getAuditLogs();
    const newEntry: SecurityAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    // Keep last 30 entries
    const updated = [newEntry, ...logs].slice(0, 30);
    window.localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving audit entry:', e);
  }
}

export function clearAuditLogs(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(AUDIT_LOG_KEY);
    } catch {
      // fallback
    }
  }
}
