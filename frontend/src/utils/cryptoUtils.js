/**
 * Security & Encryption Utilities
 * Uses Web Crypto API (AES-GCM + PBKDF2) for true end-to-end encryption of sensitive banking data,
 * with graceful fallback for legacy environments.
 */

// Generate a random 6-digit numeric PIN
export function generateRandomPin() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

// Generate a random alphanumeric passcode
export function generateRandomPasscode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Hash a PIN / Passcode for verification (SHA-256)
export async function hashPasscode(passcode, salt = 'blukers_secure_invoice_2026') {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(passcode + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    // Synchronous fallback hash
    let hash = 0;
    const str = passcode + salt;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }
}

// Encrypt sensitive payload using passcode (AES-GCM with PBKDF2 derivation)
export async function encryptSensitiveData(plainText, passcode) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passcode),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const combined = {
      salt: Array.from(salt),
      iv: Array.from(iv),
      cipher: Array.from(new Uint8Array(encryptedBuffer))
    };

    return btoa(JSON.stringify(combined));
  } catch (e) {
    // Simple XOR fallback if subtle is unavailable
    return xorEncrypt(plainText, passcode);
  }
}

// Decrypt sensitive payload using passcode
export async function decryptSensitiveData(encryptedBase64, passcode) {
  try {
    const decodedStr = atob(encryptedBase64);
    if (decodedStr.startsWith('XOR:')) {
      return xorDecrypt(encryptedBase64, passcode);
    }

    const { salt, iv, cipher } = JSON.parse(decodedStr);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passcode),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(cipher)
    );

    return decoder.decode(decryptedBuffer);
  } catch (e) {
    return xorDecrypt(encryptedBase64, passcode);
  }
}

// Fallback XOR cipher
function xorEncrypt(text, key) {
  let output = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    output += String.fromCharCode(charCode);
  }
  return btoa('XOR:' + output);
}

function xorDecrypt(base64, key) {
  try {
    const text = atob(base64);
    if (!text.startsWith('XOR:')) return null;
    const cipher = text.slice(4);
    let output = '';
    for (let i = 0; i < cipher.length; i++) {
      const charCode = cipher.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      output += String.fromCharCode(charCode);
    }
    return output;
  } catch {
    return null;
  }
}

// Compress and encode invoice object into a safe URL string
export function encodeInvoiceToUrlParam(invoiceObject) {
  try {
    const json = JSON.stringify(invoiceObject);
    // Standard URL-safe Base64
    const utf8Bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to encode invoice', err);
    return '';
  }
}

// Decode invoice object from safe URL string
export function decodeInvoiceFromUrlParam(param) {
  try {
    let base64 = param.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (err) {
    console.error('Failed to decode invoice', err);
    return null;
  }
}
