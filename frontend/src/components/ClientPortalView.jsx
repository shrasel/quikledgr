import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  FileText, 
  Clock, 
  Lock, 
  Printer, 
  Download, 
  X, 
  Check, 
  DollarSign, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { portalApi } from '../api/client';
import { InvoicePaper } from './InvoicePaper';

export function ClientPortalView({ portalToken, onBackToLogin, onTriggerToast }) {
  const [portalData, setPortalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active payment checkout modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmountType, setPaymentAmountType] = useState('full'); // 'full' or 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethodType, setPaymentMethodType] = useState('card'); // 'card' or 'ach'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState(null);

  // Card & ACH form inputs
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('');

  const [bankRouting, setBankRouting] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountType, setAccountType] = useState('checking');

  // Preview invoice paper state
  const [previewingInvoice, setPreviewingInvoice] = useState(null);

  // Load client portal dataset
  const fetchPortal = async () => {
    if (!portalToken) {
      setError('No client portal access token provided.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await portalApi.getPortalData(portalToken);
      setPortalData(res.data || res);
    } catch (err) {
      setError(err.message || 'Invalid or expired client portal link.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortal();
  }, [portalToken]);

  // Handle open checkout
  const handleOpenCheckout = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmountType('full');
    setCustomAmount(invoice.balanceDue.toFixed(2));
    setPaymentSuccessReceipt(null);
    setCardHolder(portalData?.client?.name || '');
  };

  // Compute surcharge
  const currentInvoiceBalance = selectedInvoice ? selectedInvoice.balanceDue : 0;
  const payAmount = paymentAmountType === 'full' 
    ? currentInvoiceBalance 
    : (parseFloat(customAmount) || 0);

  const passFee = portalData?.organization?.passProcessingFee;
  let surchargeFee = 0;
  if (passFee && payAmount > 0) {
    if (paymentMethodType === 'card') {
      surchargeFee = Math.round(((payAmount * 0.029) + 0.30) * 100) / 100;
    } else {
      surchargeFee = Math.min(5.00, Math.round((payAmount * 0.008) * 100) / 100);
    }
  }
  const totalCharge = Math.round((payAmount + surchargeFee) * 100) / 100;

  // Process online payment
  const handlePayNow = async (e) => {
    e.preventDefault();
    if (payAmount <= 0) {
      onTriggerToast?.('Payment amount must be greater than zero.', 'error');
      return;
    }
    if (payAmount > currentInvoiceBalance + 0.005) {
      onTriggerToast?.('Payment amount cannot exceed invoice balance due.', 'error');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const refCode = paymentMethodType === 'card' 
        ? 'STRIPE-CHG-' + Math.random().toString(36).substring(2, 8).toUpperCase()
        : 'ACH-DEBIT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      const res = await portalApi.payInvoice(portalToken, {
        invoiceId: selectedInvoice.id,
        amount: payAmount,
        surchargeFee,
        paymentMethod: paymentMethodType === 'card' ? 'stripe_card' : 'stripe_ach',
        referenceNumber: refCode,
        notes: `Online portal settlement by ${cardHolder || portalData.client.name}`,
      });

      const receiptData = res.data || res;
      setPaymentSuccessReceipt(receiptData);
      onTriggerToast?.(`Payment of $${payAmount.toFixed(2)} processed successfully!`);
      // Refresh portal statement data
      fetchPortal();
    } catch (err) {
      console.error('Portal payment error:', err);
      onTriggerToast?.(err.message || 'Failed to process payment.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin text-slate-400">
            <Clock size={32} />
          </div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Verifying secure portal credentials...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 max-w-md w-full text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Portal Link Expired or Invalid</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <div className="pt-2">
            {onBackToLogin && (
              <button className="btn btn-secondary btn-sm" onClick={onBackToLogin}>
                Return to QuikLedgr Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { organization, client, summary, invoices, payments } = portalData;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Top Banner Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm">
              <Building2 size={16} />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{organization.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                  Client Portal
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {organization.legalName || 'Verified Business Entity'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck size={14} />
              <span>TLS 256-Bit Encrypted Session</span>
            </div>
            {onBackToLogin && (
              <button 
                type="button" 
                className="btn btn-secondary btn-sm text-xs" 
                onClick={onBackToLogin}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Welcome & Account Greeting */}
        <div className="card p-5 sm:p-6 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                Statement of Account
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                Hello, {client.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Account Email: <strong className="text-slate-700 dark:text-slate-300">{client.email}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Outstanding Balance
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-white">
                  ${summary.totalBalanceDue.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {organization.portalBannerText && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>{organization.portalBannerText}</span>
            </div>
          )}
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Total Invoiced
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              ${summary.totalInvoiced.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {summary.invoicesCount} billed invoices
            </div>
          </div>

          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Total Settled
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              ${summary.totalPaid.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Lifetime payments applied
            </div>
          </div>

          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Current Balance
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              ${summary.totalBalanceDue.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Amount awaiting payment
            </div>
          </div>

          <div className="card p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Open Invoices
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {summary.openInvoicesCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Actionable for payment
            </div>
          </div>
        </div>

        {/* Invoices List Section */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Invoices & Statements ({invoices.length})
              </h3>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No invoices currently on file for your account.
            </div>
          ) : (
            <div className="md-table-wrap">
              <table className="md-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Paid</th>
                    <th className="text-right">Balance Due</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const isFullyPaid = inv.balanceDue <= 0.005;
                    const isOverdue = inv.daysOverdue > 0 && !isFullyPaid;

                    return (
                      <tr key={inv.id}>
                        <td className="font-mono font-semibold text-xs text-slate-900 dark:text-white">
                          {inv.invoiceNumber}
                        </td>
                        <td className="text-xs text-slate-500">{inv.invoiceDate}</td>
                        <td className="text-xs">
                          <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-500'}>
                            {inv.dueDate}
                          </span>
                          {isOverdue && (
                            <span className="ml-1 text-[10px] text-rose-600 dark:text-rose-400">
                              ({inv.daysOverdue}d overdue)
                            </span>
                          )}
                        </td>
                        <td>
                          {isFullyPaid ? (
                            <span className="status-badge status-paid text-[10px]">Paid</span>
                          ) : inv.amountPaid > 0 ? (
                            <span className="status-badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: 'none' }}>
                              Partial
                            </span>
                          ) : isOverdue ? (
                            <span className="status-badge status-overdue text-[10px]">Overdue</span>
                          ) : (
                            <span className="status-badge status-sent text-[10px]">Due</span>
                          )}
                        </td>
                        <td className="text-right font-mono text-xs font-semibold text-slate-900 dark:text-white">
                          ${inv.total.toFixed(2)}
                        </td>
                        <td className="text-right font-mono text-xs text-slate-500">
                          ${inv.amountPaid.toFixed(2)}
                        </td>
                        <td className="text-right font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          ${inv.balanceDue.toFixed(2)}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm px-2 py-1 text-xs"
                              onClick={() => setPreviewingInvoice(inv)}
                              title="View invoice document"
                            >
                              <span>View</span>
                            </button>

                            {!isFullyPaid && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm px-2.5 py-1 text-xs flex items-center gap-1"
                                onClick={() => handleOpenCheckout(inv)}
                              >
                                <CreditCard size={12} />
                                <span>Pay Now</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment History Section */}
        {payments.length > 0 && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Payment History & Receipts ({payments.length})
                </h3>
              </div>
            </div>

            <div className="md-table-wrap">
              <table className="md-table">
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Date</th>
                    <th>Invoice</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {p.paymentNumber}
                      </td>
                      <td className="text-xs text-slate-500">{p.paymentDate}</td>
                      <td className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                        {p.invoiceNumber}
                      </td>
                      <td className="text-xs capitalize">{p.paymentMethod.replace('_', ' ')}</td>
                      <td className="font-mono text-[11px] text-slate-500">{p.referenceNumber || '—'}</td>
                      <td className="text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                        ${p.amount.toFixed(2)}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm px-2 py-0.5 text-xs"
                          onClick={() => setPaymentSuccessReceipt({
                            paymentNumber: p.paymentNumber,
                            invoiceNumber: p.invoiceNumber,
                            amount: p.amount,
                            surchargeFee: p.surchargeFee,
                            paymentMethod: p.paymentMethod,
                            paymentDate: p.paymentDate,
                            referenceNumber: p.referenceNumber,
                          })}
                        >
                          <Receipt size={12} className="mr-1" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Embedded Checkout Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-slate-700 dark:text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Secure Checkout: {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {paymentSuccessReceipt ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Successful!</h2>
                <p className="text-xs text-slate-500">
                  Your payment of <strong>${(paymentSuccessReceipt.amount + (paymentSuccessReceipt.surchargeFee || 0)).toFixed(2)}</strong> has been processed and credited to invoice <strong>{selectedInvoice.invoiceNumber}</strong>.
                </p>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 space-y-1 text-left">
                  <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <strong>{paymentSuccessReceipt.paymentNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Balance:</span>
                    <strong>${paymentSuccessReceipt.newBalanceDue !== undefined ? paymentSuccessReceipt.newBalanceDue.toFixed(2) : '0.00'}</strong>
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
                    onClick={() => setSelectedInvoice(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePayNow} className="p-4 space-y-4">
                {/* Payment Amount Choice: Full vs Custom Partial */}
                <div className="space-y-2">
                  <label className="form-label text-xs">Payment Option</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                        paymentAmountType === 'full' 
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold text-indigo-900 dark:text-indigo-200' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                      onClick={() => {
                        setPaymentAmountType('full');
                        setCustomAmount(selectedInvoice.balanceDue.toFixed(2));
                      }}
                    >
                      <div className="text-[10px] uppercase text-slate-500">Pay Full Balance</div>
                      <div className="font-mono text-sm font-bold mt-0.5">${selectedInvoice.balanceDue.toFixed(2)}</div>
                    </button>

                    <button
                      type="button"
                      className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                        paymentAmountType === 'custom' 
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold text-indigo-900 dark:text-indigo-200' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                      onClick={() => setPaymentAmountType('custom')}
                    >
                      <div className="text-[10px] uppercase text-slate-500">Custom Partial Amount</div>
                      <div className="font-mono text-sm font-bold mt-0.5">Flexible</div>
                    </button>
                  </div>

                  {paymentAmountType === 'custom' && (
                    <div className="pt-1">
                      <label className="form-label text-[11px]">Enter Custom Payment Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="1.00"
                        max={selectedInvoice.balanceDue}
                        className="form-input text-xs font-mono"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Method Selector: Credit Card vs ACH */}
                <div className="space-y-2">
                  <label className="form-label text-xs">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs transition-colors ${
                        paymentMethodType === 'card'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                      onClick={() => setPaymentMethodType('card')}
                    >
                      <CreditCard size={15} />
                      <span>Credit / Debit Card</span>
                    </button>

                    <button
                      type="button"
                      className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs transition-colors ${
                        paymentMethodType === 'ach'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                      onClick={() => setPaymentMethodType('ach')}
                    >
                      <Building2 size={15} />
                      <span>ACH Bank Debit</span>
                    </button>
                  </div>
                </div>

                {/* Card or ACH Inputs */}
                {paymentMethodType === 'card' ? (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="form-label text-[11px]">Cardholder Name</label>
                      <input
                        type="text"
                        className="form-input text-xs"
                        placeholder="Name as it appears on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label text-[11px]">Card Number</label>
                      <input
                        type="text"
                        className="form-input text-xs font-mono"
                        placeholder="•••• •••• •••• 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                      />
                    </div>

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
                        <label className="form-label text-[11px]">Postal Code</label>
                        <input
                          type="text"
                          className="form-input text-xs font-mono"
                          placeholder="90210"
                          value={cardZip}
                          onChange={(e) => setCardZip(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="form-label text-[11px]">Routing Number (9 Digits)</label>
                        <input
                          type="text"
                          className="form-input text-xs font-mono"
                          placeholder="111000025"
                          value={bankRouting}
                          onChange={(e) => setBankRouting(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label text-[11px]">Account Type</label>
                        <select
                          className="form-input text-xs"
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value)}
                        >
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="form-label text-[11px]">Account Number</label>
                      <input
                        type="text"
                        className="form-input text-xs font-mono"
                        placeholder="000123456789"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Fee & Total Summary Breakdown */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Applied to Invoice Balance:</span>
                    <span className="font-mono">${payAmount.toFixed(2)}</span>
                  </div>

                  {passFee && (
                    <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                      <span>Card / ACH Convenience Fee ({paymentMethodType === 'card' ? '2.9% + $0.30' : '0.8% capped at $5'}):</span>
                      <span className="font-mono">+${surchargeFee.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <span>Total Charged:</span>
                    <span className="font-mono">${totalCharge.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedInvoice(null)}
                    disabled={isProcessingPayment}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                    disabled={isProcessingPayment}
                  >
                    <Check size={14} />
                    <span>{isProcessingPayment ? 'Processing...' : `Authorize & Pay $${totalCharge.toFixed(2)}`}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Invoice Paper Modal Preview */}
      {previewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Invoice {previewingInvoice.invoiceNumber}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-2 py-1 text-xs"
                  onClick={() => window.print()}
                >
                  <Printer size={13} className="mr-1" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-1"
                  onClick={() => setPreviewingInvoice(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
              <div className="max-w-[800px] w-full">
                <InvoicePaper 
                  invoice={{
                    ...previewingInvoice,
                    issuer: {
                      businessName: organization.name,
                      legalName: organization.legalName,
                    },
                    client: {
                      companyName: client.name,
                      email: client.email,
                    },
                    items: previewingInvoice.items || [
                      {
                        description: `Professional Services - ${previewingInvoice.servicePeriod || 'Current Period'}`,
                        quantity: 1,
                        unitPrice: previewingInvoice.total,
                        amount: previewingInvoice.total,
                      }
                    ],
                  }} 
                  isUnlocked={true} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
