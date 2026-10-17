import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  ShieldCheck, 
  ArrowLeft, 
  Mail, 
  CheckCircle, 
  CheckCircle2,
  CreditCard,
  Building2,
  Check,
  X,
  FileText, 
  Lock 
} from 'lucide-react';
import { InvoicePaper } from './InvoicePaper';
import { SecurityGate } from './SecurityGate';
import { exportInvoiceToPdf, printInvoice } from '../utils/pdfExport';
import { decodeInvoiceFromUrlParam } from '../utils/cryptoUtils';
import { getInvoiceById } from '../utils/storage';
import { publicApi } from '../api/client';

export function InvoiceView({ invoiceId, encodedData, onBackToEditor, onTriggerToast }) {
  const [invoice, setInvoice] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Online Payment Checkout states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe_card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  useEffect(() => {
    async function loadInvoiceData() {
      // 1. Try public API first if invoiceId is provided
      if (invoiceId) {
        try {
          const remoteMeta = await publicApi.getMetadata(invoiceId);
          if (remoteMeta) {
            setInvoice(remoteMeta);
            return;
          }
        } catch (err) {
          console.log('[InvoiceView] Public API not reachable or offline, using link data/storage');
        }
      }

      // 2. Decode from URL parameter if present
      if (encodedData) {
        try {
          const decoded = decodeInvoiceFromUrlParam(encodedData);
          if (decoded) {
            setInvoice(decoded);
            if (!decoded.security?.requireCode) {
              setIsUnlocked(true);
            }
            return;
          }
        } catch (err) {
          console.error('Failed to decode invoice from URL', err);
        }
      }

      // 3. Fallback to local storage
      if (invoiceId) {
        const found = getInvoiceById(invoiceId);
        if (found) {
          setInvoice(found);
          if (!found.security?.requireCode) {
            setIsUnlocked(true);
          }
          return;
        }
      }

      setLoadError('Invoice document not found. The link may have expired or is incomplete.');
    }

    loadInvoiceData();
  }, [invoiceId, encodedData]);

  const handleUnlockSuccess = async (enteredPin, decryptedWireData) => {
    setIsUnlocked(true);
    // If backend unlocked payload provided
    if (decryptedWireData) {
      setInvoice(prev => ({
        ...prev,
        ...decryptedWireData,
        wireDetails: decryptedWireData.wireDetails || decryptedWireData,
        isUnlocked: true,
      }));
    } else {
      // Try backend unlock
      if (invoiceId) {
        try {
          const fullUnlocked = await publicApi.unlockWithPin(invoiceId, enteredPin);
          if (fullUnlocked) {
            setInvoice(fullUnlocked);
          }
        } catch (e) {
          console.warn('[InvoiceView] Backend unlock fallback');
        }
      }
    }
    if (onTriggerToast) {
      onTriggerToast('Invoice unlocked successfully!');
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setIsDownloading(true);
    if (onTriggerToast) {
      onTriggerToast('Generating high-resolution PDF...');
    }
    try {
      await exportInvoiceToPdf('invoice-printable-paper', invoice.invoiceNumber || invoice.id);
      if (onTriggerToast) {
        onTriggerToast('PDF downloaded successfully!');
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast('Failed to generate PDF. You can also use the Print button.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    printInvoice();
  };

  const handleSendConfirmation = () => {
    const issuerEmail = invoice?.issuer?.email;
    if (!issuerEmail) return;
    const subject = `Received & Processing: Invoice ${invoice.invoiceNumber || invoice.id}`;
    const body = `Hi ${invoice.issuer?.name || ''},\n\nThis is to confirm that Blukers Accounting has received your invoice ${invoice.invoiceNumber || invoice.id} for the service period: ${invoice.servicePeriod}.\n\nIt is currently being processed for payment in accordance with our Consulting Agreement.\n\nBest regards,\nAccounting Department`;
    window.open(`mailto:${encodeURIComponent(issuerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handlePayOnline = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      onTriggerToast?.('Please enter a valid payment amount.', 'error');
      return;
    }

    setIsPaying(true);
    try {
      const surcharge = paymentMethod === 'stripe_card' 
        ? Math.round(((amount * 0.029) + 0.30) * 100) / 100 
        : Math.min(5.00, Math.round((amount * 0.008) * 100) / 100);

      const targetId = invoice.id || invoiceId;
      const res = await publicApi.payPublic(targetId, {
        amount,
        surchargeFee: surcharge,
        paymentMethod,
        notes: `Online settlement authorized by ${cardHolder || 'Client'}`,
      });

      const data = res.data || res;
      setPaymentReceipt(data);
      setInvoice(prev => ({
        ...prev,
        amount_paid: data.newAmountPaid,
        balance_due: data.newBalanceDue,
        status: data.status,
      }));
      onTriggerToast?.(`Payment of $${amount.toFixed(2)} processed successfully!`);
    } catch (err) {
      onTriggerToast?.(err.message || 'Payment processing failed.', 'error');
    } finally {
      setIsPaying(false);
    }
  };

  if (loadError) {
    return (
      <div className="security-gate-wrapper">
        <div className="security-gate-card">
          <div style={{ color: 'var(--danger-text)', marginBottom: '1rem' }}>
            <Lock size={40} />
          </div>
          <h2>Document Unavailable</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>{loadError}</p>
          {onBackToEditor && (
            <button className="btn btn-primary" onClick={onBackToEditor}>
              Return to QuikLedgr App
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="security-gate-wrapper">
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading invoice document...
        </div>
      </div>
    );
  }

  // If locked, show security gate
  if (!isUnlocked && invoice.security?.requireCode) {
    return (
      <SecurityGate 
        invoiceSummary={{
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          issuerName: invoice.issuer?.businessName || invoice.issuer?.name,
          clientName: invoice.client?.companyName,
        }}
        encryptedWireData={invoice.encryptedWireData}
        rawAccessPin={invoice.security?.accessPin}
        onUnlockSuccess={handleUnlockSuccess}
      />
    );
  }

  return (
    <div className="main-content">
      {/* Recipient Action Toolbar */}
      <div className="recipient-toolbar no-print max-w-[860px] mx-auto mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 card">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          {onBackToEditor && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              onClick={onBackToEditor}
            >
              <ArrowLeft size={15} />
              <span>Editor</span>
            </button>
          )}

          <div className="security-pill">
            <ShieldCheck size={14} />
            <span>Authenticated Secure Invoice</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {invoice.status !== 'paid' && (
            <button 
              type="button" 
              className="btn btn-primary btn-sm flex-1 sm:flex-initial justify-center flex items-center gap-1.5"
              onClick={() => {
                const bal = invoice.balance_due !== undefined && invoice.balance_due !== null 
                  ? parseFloat(invoice.balance_due) 
                  : (parseFloat(invoice.total) - parseFloat(invoice.amount_paid || 0));
                setPaymentAmount(bal.toFixed(2));
                setCardHolder(invoice.client?.companyName || '');
                setShowPaymentModal(true);
              }}
            >
              <CreditCard size={15} />
              <span>Pay Online</span>
            </button>
          )}

          <button 
            type="button" 
            className="btn btn-secondary btn-sm flex-1 sm:flex-initial justify-center flex items-center gap-1.5"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            <Download size={15} />
            <span>{isDownloading ? 'Generating...' : 'PDF'}</span>
          </button>

          <button 
            type="button" 
            className="btn btn-secondary btn-sm flex-1 sm:flex-initial justify-center flex items-center gap-1.5"
            onClick={handlePrint}
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          {invoice.issuer?.email && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm flex-1 sm:flex-initial justify-center flex items-center gap-1.5"
              onClick={handleSendConfirmation}
              title="Send automated email confirmation to consultant"
            >
              <Mail size={15} />
              <span className="hidden sm:inline">Confirm Receipt</span>
              <span className="sm:hidden">Confirm</span>
            </button>
          )}
        </div>
      </div>

      {/* Pristine Invoice HTML Sheet */}
      <InvoicePaper 
        invoice={invoice} 
        isUnlocked={true} 
        onTriggerCopyToast={onTriggerToast} 
      />

      {/* Online Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-slate-700 dark:text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Pay Invoice {invoice.invoiceNumber || invoice.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowPaymentModal(false); setPaymentReceipt(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {paymentReceipt ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Received!</h2>
                <p className="text-xs text-slate-500">
                  Your payment of <strong>${(paymentReceipt.amount + (paymentReceipt.surchargeFee || 0)).toFixed(2)}</strong> has been processed successfully.
                </p>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 space-y-1 text-left">
                  <div className="flex justify-between">
                    <span>Receipt Code:</span>
                    <strong>{paymentReceipt.paymentNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Balance:</span>
                    <strong>${paymentReceipt.newBalanceDue !== undefined ? paymentReceipt.newBalanceDue.toFixed(2) : '0.00'}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => window.print()}
                  >
                    <Printer size={13} className="mr-1" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => { setShowPaymentModal(false); setPaymentReceipt(null); }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePayOnline} className="p-4 space-y-4">
                <div>
                  <label className="form-label text-xs">Payment Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    className="form-input text-xs font-mono"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`p-2 rounded-lg border flex items-center gap-1.5 text-xs ${
                      paymentMethod === 'stripe_card' 
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold text-indigo-900 dark:text-indigo-200' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => setPaymentMethod('stripe_card')}
                  >
                    <CreditCard size={14} />
                    <span>Card (2.9% + 30¢)</span>
                  </button>

                  <button
                    type="button"
                    className={`p-2 rounded-lg border flex items-center gap-1.5 text-xs ${
                      paymentMethod === 'stripe_ach' 
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold text-indigo-900 dark:text-indigo-200' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => setPaymentMethod('stripe_ach')}
                  >
                    <Building2 size={14} />
                    <span>ACH (0.8% max $5)</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="form-label text-[11px]">Cardholder / Account Name</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="Full Name"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label text-[11px]">{paymentMethod === 'stripe_card' ? 'Card Number' : 'Account Number'}</label>
                    <input
                      type="text"
                      className="form-input text-xs font-mono"
                      placeholder={paymentMethod === 'stripe_card' ? '•••• •••• •••• 4242' : '000123456789'}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                    />
                  </div>

                  {paymentMethod === 'stripe_card' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="form-label text-[11px]">Exp (MM/YY)</label>
                        <input
                          type="text"
                          className="form-input text-xs font-mono"
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label text-[11px]">CVC</label>
                        <input
                          type="text"
                          className="form-input text-xs font-mono"
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label text-[11px]">Zip Code</label>
                        <input
                          type="text"
                          className="form-input text-xs font-mono"
                          placeholder="10001"
                          value={cardZip}
                          onChange={(e) => setCardZip(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="form-label text-[11px]">Routing Number (9 Digits)</label>
                      <input
                        type="text"
                        className="form-input text-xs font-mono"
                        placeholder="111000025"
                        value={cardZip}
                        onChange={(e) => setCardZip(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Invoice Subtotal:</span>
                    <span className="font-mono">${(parseFloat(paymentAmount) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                    <span>Processing Surcharge:</span>
                    <span className="font-mono">
                      +${(paymentMethod === 'stripe_card' 
                        ? Math.round((((parseFloat(paymentAmount) || 0) * 0.029) + 0.30) * 100) / 100 
                        : Math.min(5.00, Math.round(((parseFloat(paymentAmount) || 0) * 0.008) * 100) / 100)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Total To Charge:</span>
                    <span className="font-mono">
                      ${((parseFloat(paymentAmount) || 0) + (paymentMethod === 'stripe_card' 
                        ? Math.round((((parseFloat(paymentAmount) || 0) * 0.029) + 0.30) * 100) / 100 
                        : Math.min(5.00, Math.round(((parseFloat(paymentAmount) || 0) * 0.008) * 100) / 100))).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={isPaying}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                    disabled={isPaying}
                  >
                    <Check size={14} />
                    <span>{isPaying ? 'Processing...' : 'Authorize & Settle'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

