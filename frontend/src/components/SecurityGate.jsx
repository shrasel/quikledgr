import React, { useState, useRef, useEffect } from 'react';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import { decryptSensitiveData } from '../utils/cryptoUtils';

export function SecurityGate({ invoiceSummary, encryptedWireData, rawAccessPin, onUnlockSuccess }) {
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    const cleanVal = value.slice(-1);
    const updated = [...pinDigits];
    updated[index] = cleanVal;
    setPinDigits(updated);
    setErrorMsg('');

    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

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
      const expectedPin = (rawAccessPin || '').trim();
      const userPin = enteredPin.trim();

      if (expectedPin && userPin === expectedPin) {
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
          // Decryption failed
        }
      }

      setErrorMsg('Incorrect security access code. Please check with the consultant and try again.');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md card p-6 sm:p-8 space-y-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
          <Lock size={22} />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Confidential Invoice Access
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            This document contains sensitive consulting fees and wire payment details. Enter your 6-digit access code to unlock.
          </p>
        </div>

        {invoiceSummary && (
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Document Summary</div>
            <div className="font-semibold text-slate-900 dark:text-white">
              Invoice #{invoiceSummary.invoiceNumber || invoiceSummary.id}
            </div>
            {invoiceSummary.issuerName && (
              <div className="text-slate-500">
                Issued by: <strong className="text-slate-800 dark:text-slate-200">{invoiceSummary.issuerName}</strong>
              </div>
            )}
            {invoiceSummary.clientName && (
              <div className="text-slate-500">
                Billed to: <strong className="text-slate-800 dark:text-slate-200">{invoiceSummary.clientName}</strong>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label text-center mb-3">Enter 6-digit access code</label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
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
                  className="w-10 h-12 text-center text-lg font-bold font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-lg w-full" 
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : (
              <>
                <span>Unlock Invoice</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-xs text-slate-400">
          Client-side protected with 256-bit encryption
        </div>
      </div>
    </div>
  );
}
