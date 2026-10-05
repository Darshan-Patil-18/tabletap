// Crypto utilities
export async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// LocalStorage helpers
export const LS = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  remove: (key) => { try { localStorage.removeItem(key); } catch {} },
};

// Users store
export const USERS_KEY = 'tt_users';
export const SESSION_KEY = 'tt_session';

export function getUsers() { return LS.get(USERS_KEY, {}); }
export function saveUsers(u) { LS.set(USERS_KEY, u); }
export function getSession() { return LS.get(SESSION_KEY, null); }
export function setSession(email) { LS.set(SESSION_KEY, email); }
export function clearSession() { LS.remove(SESSION_KEY); }

// Per-account data keys
export const dataKey = (email, suffix) => `tt_data_${email}_${suffix}`;

export function getMenu(email) { return LS.get(dataKey(email, 'menu'), []); }
export function saveMenu(email, menu) { LS.set(dataKey(email, 'menu'), menu); }
export function getBills(email) { return LS.get(dataKey(email, 'bills'), []); }
export function saveBills(email, bills) { LS.set(dataKey(email, 'bills'), bills); }
export function getProfile(email) { return LS.get(dataKey(email, 'profile'), {}); }
export function saveProfile(email, p) { LS.set(dataKey(email, 'profile'), p); }

// Validation
export function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
export function validatePassword(p) { return p && p.length >= 6; }

// Bill number
export function nextBillNumber(bills) {
  if (!bills.length) return 'B0001';
  const nums = bills.map(b => parseInt(b.billNumber?.replace(/\D/g, '') || '0', 10));
  return 'B' + String(Math.max(...nums) + 1).padStart(4, '0');
}

// Date utils
export function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
export function formatDateTime(ts) { return `${formatDate(ts)}, ${formatTime(ts)}`; }

// Currency
export function inr(n) { return '₹' + Number(n || 0).toFixed(2); }

// Toast context
import { createContext, useContext } from 'react';
export const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);
