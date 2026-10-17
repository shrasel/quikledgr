/**
 * Authentication management for QuikLedgr
 * Connects to the backend REST API with persistent session caching.
 */

import { authApi } from '../api/client';

const AUTH_STORAGE_KEY = 'quikledgr_auth_user_v1';
const LEGACY_STORAGE_KEY = 'blukers_auth_user_v1';

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
    if (err.message && !err.message.includes('Failed to fetch')) {
      throw err;
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
      : credentialOrPayload;

    const res = await authApi.googleLogin(payload);
    if (res?.user) {
      saveUserSession(res.user);
      return res.user;
    }
  } catch (err) {
    console.warn('[Auth] Google OAuth error:', err.message);
    throw err;
  }

  throw new Error('Google sign-in could not be completed. Please try again.');
}
