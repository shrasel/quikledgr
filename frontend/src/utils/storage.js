import { encodeInvoiceToUrlParam, decodeInvoiceFromUrlParam, encryptSensitiveData } from './cryptoUtils';
import { createBlukersInvoiceTemplate } from './invoiceSchema';

const STORAGE_KEY_INVOICES = 'quikledgr_invoices_v1';
const LEGACY_STORAGE_KEY_INVOICES = 'blukers_invoices_v1';

const STORAGE_KEY_PROFILE = 'quikledgr_issuer_profile_v1';
const LEGACY_STORAGE_KEY_PROFILE = 'blukers_issuer_profile_v1';

const STORAGE_KEY_CLIENTS = 'quikledgr_saved_clients_v1';
const LEGACY_STORAGE_KEY_CLIENTS = 'blukers_saved_clients_v1';

// Initialize default sample data if empty
export function initStorage() {
  const existing = localStorage.getItem(STORAGE_KEY_INVOICES) || localStorage.getItem(LEGACY_STORAGE_KEY_INVOICES);
  if (!existing) {
    const inv1 = createBlukersInvoiceTemplate();
    inv1.id = 'BLK-2026-10-001';
    inv1.invoiceNumber = 'BLK-2026-10-001';
    inv1.status = 'sent';
    inv1.servicePeriod = 'September 1 – September 30, 2026';
    inv1.invoiceDate = '2026-10-01';
    inv1.dueDate = '2026-10-15';

    const inv2 = createBlukersInvoiceTemplate();
    inv2.id = 'BLK-2026-09-002';
    inv2.invoiceNumber = 'BLK-2026-09-002';
    inv2.status = 'paid';
    inv2.servicePeriod = 'August 1 – August 31, 2026';
    inv2.invoiceDate = '2026-09-01';
    inv2.dueDate = '2026-09-15';
    inv2.total = 15200;
    inv2.subtotal = 15200;
    inv2.additionalChargesTotal = 0;
    inv2.additionalCharges = [];

    const inv3 = createBlukersInvoiceTemplate();
    inv3.id = 'BLK-2026-08-003';
    inv3.invoiceNumber = 'BLK-2026-08-003';
    inv3.status = 'paid';
    inv3.servicePeriod = 'July 1 – July 31, 2026';
    inv3.invoiceDate = '2026-08-01';
    inv3.dueDate = '2026-08-15';
    inv3.total = 14800;
    inv3.subtotal = 14800;
    inv3.additionalChargesTotal = 0;
    inv3.additionalCharges = [];

    const inv4 = createBlukersInvoiceTemplate();
    inv4.id = 'BLK-2026-11-004';
    inv4.invoiceNumber = 'BLK-2026-11-004';
    inv4.status = 'draft';
    inv4.servicePeriod = 'October 1 – October 31, 2026';
    inv4.invoiceDate = '2026-10-16';
    inv4.dueDate = '2026-11-15';

    const initialData = JSON.stringify([inv4, inv1, inv2, inv3]);
    localStorage.setItem(STORAGE_KEY_INVOICES, initialData);
    localStorage.setItem(LEGACY_STORAGE_KEY_INVOICES, initialData);
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

export function saveIssuerProfile(profile, wireDetails) {
  try {
    const serialized = JSON.stringify({ profile, wireDetails });
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
