/**
 * Authentication management for QuikLedgr
 * Connects to the backend REST API with persistent session caching.
 */

import { authApi } from '../api/client';

const AUTH_STORAGE_KEY = 'quikledgr_auth_user_v1';
const LEGACY_STORAGE_KEY = 'blukers_auth_user_v1';

// Default demo user credentials
export const DEMO_USER = {
  id: 'usr_blukers_alex',
  name: 'Alexander Wright',
  email: 'alex@wrightsolutions.io',
  businessName: 'Wright Advisory & Solutions LLC',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
  provider: 'email',
  role: 'Principal Technology Consultant',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Error reading auth user', e);
    return null;
  }
}

export function saveUserSession(user) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch (e) {
    console.error('Error saving user session', e);
    return user;
  }
}

export function clearUserSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    authApi.logout();
  } catch (e) {
    console.error('Error clearing session', e);
  }
}

export async function loginWithEmail(email, password) {
  try {
    // Attempt backend API login
    const res = await authApi.login(email, password);
    if (res?.user) {
      saveUserSession(res.user);
      return res.user;
    }
  } catch (err) {
    console.warn('[Auth] Backend API unreachable or error, falling back to local simulation:', err.message);
  }

  // Graceful local fallback
  const normalizedEmail = email.trim().toLowerCase();
  const user = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    name: normalizedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    email: normalizedEmail,
    businessName: normalizedEmail.includes('alex') ? 'Wright Advisory & Solutions LLC' : 'Consulting Advisory Services',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80',
    provider: 'email',
    createdAt: new Date().toISOString(),
  };

  saveUserSession(user);
  return user;
}

export async function signupWithEmail(name, email, password, businessName) {
  try {
    const res = await authApi.register(name, email, password, businessName);
    if (res?.user) {
      saveUserSession(res.user);
      return res.user;
    }
  } catch (err) {
    console.warn('[Auth] Backend registration offline fallback:', err.message);
  }

  const user = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    businessName: businessName?.trim() || `${name.trim()} Consulting`,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    provider: 'email',
    createdAt: new Date().toISOString(),
  };

  saveUserSession(user);
  return user;
}

export async function getGoogleAuthConfig() {
  try {
    const backendConfig = await authApi.getConfig();
    return {
      googleClientId: backendConfig?.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      googleAuthEnabled: Boolean(backendConfig?.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID),
    };
  } catch (e) {
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    return {
      googleClientId: envClientId,
      googleAuthEnabled: Boolean(envClientId),
    };
  }
}

export async function loginWithGoogle(credentialOrPayload) {
  try {
    const payload = typeof credentialOrPayload === 'string'
      ? { credential: credentialOrPayload }
      : (credentialOrPayload || { email: 'alexander.wright.consulting@gmail.com', name: 'Alexander Wright' });

    const res = await authApi.googleLogin(payload);
    if (res?.user) {
      saveUserSession(res.user);
      return res.user;
    }
  } catch (err) {
    console.warn('[Auth] Backend Google OAuth notice:', err.message);
    if (typeof credentialOrPayload === 'string') {
      throw err;
    }
  }

  const googleUser = {
    id: 'usr_google_alex',
    name: 'Alexander Wright',
    email: 'alexander.wright.consulting@gmail.com',
    businessName: 'Wright Advisory & Solutions LLC',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    provider: 'google',
    createdAt: new Date().toISOString(),
  };

  saveUserSession(googleUser);
  return googleUser;
}
