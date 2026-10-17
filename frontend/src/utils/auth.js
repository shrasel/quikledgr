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
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const res = await authApi.login(normalizedEmail, password);
    if (res?.user) {
      saveUserSession(res.user);
      return res.user;
    }
  } catch (err) {
    // If backend returned a clear rejection (e.g. 401 or 400), throw to display message
    if (err.message && !err.message.includes('Failed to fetch')) {
      throw err;
    }

    // Offline demo fallback only for the preset demo consultant
    if (normalizedEmail === 'alex@wrightsolutions.io' && password === 'demoPassword123') {
      saveUserSession(DEMO_USER);
      return DEMO_USER;
    }

    throw new Error(err.message || 'Unable to connect to authentication server. Please try again.');
  }

  throw new Error('Authentication failed. Please verify your credentials.');
}

export async function signupWithEmail(name, email, password, businessName) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await authApi.register(name.trim(), normalizedEmail, password, businessName?.trim());
    if (res?.user) {
      saveUserSession(res.user);
      return res.user;
    }
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch')) {
      throw err;
    }

    throw new Error(err.message || 'Unable to connect to authentication server. Please try again.');
  }

  throw new Error('Registration failed. Please try again.');
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
