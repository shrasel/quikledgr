import { encodeInvoiceToUrlParam, decodeInvoiceFromUrlParam, encryptSensitiveData } from './cryptoUtils';
import { createBlukersInvoiceTemplate } from './invoiceSchema';

const STORAGE_KEY_INVOICES = 'quikledgr_invoices_v1';
const LEGACY_STORAGE_KEY_INVOICES = 'blukers_invoices_v1';

const STORAGE_KEY_PROFILE = 'quikledgr_issuer_profile_v1';
const LEGACY_STORAGE_KEY_PROFILE = 'blukers_issuer_profile_v1';

const STORAGE_KEY_CLIENTS = 'quikledgr_saved_clients_v1';
const LEGACY_STORAGE_KEY_CLIENTS = 'blukers_saved_clients_v1';

// Initialize storage and purge any legacy sample data
export function initStorage() {
  const existing = localStorage.getItem(STORAGE_KEY_INVOICES) || localStorage.getItem(LEGACY_STORAGE_KEY_INVOICES);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        // Purge hardcoded legacy sample invoices if found in browser storage
        const cleaned = parsed.filter(inv => {
          const id = inv.id || '';
          const isSampleId = id === 'BLK-2026-10-001' || id === 'BLK-2026-09-002' || id === 'BLK-2026-08-003' || id === 'BLK-2026-11-004';
          const isAlexIssuer = inv.issuer?.email === 'alex@wrightsolutions.io' || inv.issuer?.name === 'Alexander Wright';
          return !isSampleId && !isAlexIssuer;
        });

        if (cleaned.length !== parsed.length) {
          const serialized = JSON.stringify(cleaned);
          localStorage.setItem(STORAGE_KEY_INVOICES, serialized);
          localStorage.setItem(LEGACY_STORAGE_KEY_INVOICES, serialized);
        }
      }
    } catch (e) {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify([]));
      localStorage.setItem(LEGACY_STORAGE_KEY_INVOICES, JSON.stringify([]));
    }
  } else {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify([]));
    localStorage.setItem(LEGACY_STORAGE_KEY_INVOICES, JSON.stringify([]));
  }

  // Purge legacy sample consultant profile if found in localStorage
  const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE) || localStorage.getItem(LEGACY_STORAGE_KEY_PROFILE);
  if (savedProfile) {
    try {
      const parsed = JSON.parse(savedProfile);
      if (parsed?.profile?.email === 'alex@wrightsolutions.io' || parsed?.profile?.name === 'Alexander Wright') {
        localStorage.removeItem(STORAGE_KEY_PROFILE);
        localStorage.removeItem(LEGACY_STORAGE_KEY_PROFILE);
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
    }
  }
}

export function getInvoices() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_INVOICES) || localStorage.getItem(LEGACY_STORAGE_KEY_INVOICES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading invoices from localStorage', e);
    return [];
  }
}

export function getInvoiceById(id) {
  const list = getInvoices();
  return list.find(inv => inv.id === id) || null;
}

export function saveInvoice(invoice) {
  try {
    const list = getInvoices();
    const index = list.findIndex(inv => inv.id === invoice.id);
    let updated;
    if (index >= 0) {
      updated = [...list];
      updated[index] = { ...invoice, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...invoice, updatedAt: new Date().toISOString() }, ...list];
    }
    const serialized = JSON.stringify(updated);
    localStorage.setItem(STORAGE_KEY_INVOICES, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY_INVOICES, serialized);
    return invoice;
  } catch (e) {
    console.error('Error saving invoice', e);
    return invoice;
  }
}

export function deleteInvoice(id) {
  const list = getInvoices();
  const updated = list.filter(inv => inv.id !== id);
  const serialized = JSON.stringify(updated);
  localStorage.setItem(STORAGE_KEY_INVOICES, serialized);
  localStorage.setItem(LEGACY_STORAGE_KEY_INVOICES, serialized);
  return updated;
}

export function saveIssuerProfile(profile, wireDetails, wageSettings = null) {
  try {
    const existing = getIssuerProfile() || {};
    const payload = {
      profile: profile || existing.profile || null,
      wireDetails: wireDetails || existing.wireDetails || null,
      wageSettings: wageSettings !== null ? wageSettings : (existing.wageSettings || null),
    };
    const serialized = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY_PROFILE, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY_PROFILE, serialized);
  } catch (e) {
    console.error('Error saving profile', e);
  }
}

export function getIssuerProfile() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROFILE) || localStorage.getItem(LEGACY_STORAGE_KEY_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// Generate the self-contained secure share link
export async function generateShareUrl(invoice) {
  // We clone the invoice to bundle into URL
  const pin = invoice.security?.accessPin || '123456';
  
  // Encrypt the sensitive wire details with the PIN
  const encryptedWireJson = await encryptSensitiveData(
    JSON.stringify(invoice.wireDetails || {}),
    pin
  );

  const payloadForLink = {
    ...invoice,
    // Sensitive wire details replaced with encrypted payload
    encryptedWireData: encryptedWireJson,
    wireDetails: null, // Wipe plain wire details from payload
  };

  const encodedData = encodeInvoiceToUrlParam(payloadForLink);
  
  // Construct URL with hash-based route so static servers won't 404
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#/view?id=${encodeURIComponent(invoice.id)}&data=${encodedData}`;
}
