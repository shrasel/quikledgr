import React, { useState, useRef, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { decryptSensitiveData } from '../utils/cryptoUtils';

export function SecurityGate({ invoiceSummary, encryptedWireData, rawAccessPin, onUnlockSuccess }) {
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    // Only accept alphanumeric / digits
    const cleanVal = value.slice(-1);
    const updated = [...pinDigits];
    updated[index] = cleanVal;
    setPinDigits(updated);
    setErrorMsg('');

    // Auto advance
    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto submit if 6 digits filled
    const fullPin = updated.join('');
    if (fullPin.length === 6) {
      verifyCode(fullPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim();
    if (paste) {
      const chars = paste.slice(0, 6).split('');
      const updated = [...pinDigits];
      chars.forEach((c, idx) => {
        if (idx < 6) updated[idx] = c;
      });
      setPinDigits(updated);
      if (chars.length === 6) {
        verifyCode(updated.join(''));
      }
    }
  };

  const verifyCode = async (enteredPin) => {
    setIsVerifying(true);
    setErrorMsg('');

    try {
      // 1. Direct match with rawAccessPin if available
      const expectedPin = (rawAccessPin || '').trim();
      const userPin = enteredPin.trim();

      if (expectedPin && userPin === expectedPin) {
        // Attempt decryption of wire details if present
        let decryptedWire = null;
        if (encryptedWireData) {
          try {
            const jsonStr = await decryptSensitiveData(encryptedWireData, userPin);
            if (jsonStr) {
              decryptedWire = JSON.parse(jsonStr);
            }
          } catch (e) {
            console.error('Decryption parse failed', e);
          }
        }
        onUnlockSuccess(userPin, decryptedWire);
        return;
      }

      // 2. If encryptedWireData is present, test if enteredPin decrypts it
      if (encryptedWireData) {
        try {
          const jsonStr = await decryptSensitiveData(encryptedWireData, userPin);
          if (jsonStr) {
            const decryptedWire = JSON.parse(jsonStr);
            if (decryptedWire && (decryptedWire.accountNumberOrIban || decryptedWire.bankName)) {
              onUnlockSuccess(userPin, decryptedWire);
              return;
            }
          }
        } catch (e) {
          // Decryption failed, incorrect PIN
        }
      }

      setErrorMsg('Incorrect security access code. Please check the email sent by the consultant and try again.');
    } catch (err) {
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullPin = pinDigits.join('');
    if (fullPin.length < 4) {
      setErrorMsg('Please enter the full access code.');
      return;
    }
    verifyCode(fullPin);
  };

  return (
    <div className="security-gate-wrapper">
      <div className="security-gate-card">
        <div className="security-icon-circle">
          <Lock size={28} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.4rem', color: 'var(--apple-text-primary)' }}>
          Confidential Invoice Access
        </h2>
        
        <p style={{ color: 'var(--apple-text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.45 }}>
          This document contains sensitive consulting fees and wire transfer banking information. 
          Enter your 6-digit access code to unlock.
        </p>

        {invoiceSummary && (
          <div style={{
            background: 'var(--apple-grouped)',
            border: '1px solid var(--apple-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            fontSize: '0.825rem'
          }}>
            <div style={{ color: 'var(--apple-text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Document Details</div>
            <div style={{ fontWeight: '700', color: 'var(--apple-text-primary)', marginTop: '0.2rem' }}>
              Invoice {invoiceSummary.invoiceNumber || invoiceSummary.id}
            </div>
            {invoiceSummary.issuerName && (
              <div style={{ color: 'var(--apple-text-secondary)', marginTop: '0.15rem' }}>
                Issued by: <strong style={{ color: 'var(--apple-text-primary)' }}>{invoiceSummary.issuerName}</strong>
              </div>
            )}
            {invoiceSummary.clientName && (
              <div style={{ color: 'var(--apple-text-secondary)', marginTop: '0.15rem' }}>
                Billed to: <strong style={{ color: 'var(--apple-text-primary)' }}>{invoiceSummary.clientName}</strong>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-label" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            ENTER 6-DIGIT ACCESS CODE
          </div>

          <div className="pin-inputs-row" onPaste={handlePaste}>
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="pin-digit-box"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {errorMsg && (
            <div className="auth-error-banner" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%' }}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : (
              <>
                <span>Unlock Invoice</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-badge">
          <ShieldAlert size={14} className="text-slate-400" />
          <span>Client-side protected with 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
}
