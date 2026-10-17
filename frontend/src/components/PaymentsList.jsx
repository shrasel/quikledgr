import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  Link as LinkIcon, 
  CheckCircle2, 
  Receipt, 
  Download, 
  Printer, 
  X, 
  ArrowUpRight, 
  Building2, 
  Calendar, 
  FileText,
  Percent,
  Check,
  Copy,
  ExternalLink
} from 'lucide-react';
import { paymentsApi, invoiceApi } from '../api/client';

export function PaymentsList({ onTriggerToast, onOpenInvoice }) {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  // Form states for Record Payment
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe_card');
  const [applySurcharge, setApplySurcharge] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Portal Link Generator state
  const [portalEmail, setPortalEmail] = useState('');
  const [portalName, setPortalName] = useState('');
  const [generatedPortalUrl, setGeneratedPortalUrl] = useState('');
  const [isGeneratingPortal, setIsGeneratingPortal] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);

  // Fetch payments & open invoices
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pmtRes, invRes] = await Promise.all([
        paymentsApi.getAll(),
        invoiceApi.getAll()
      ]);
      setPayments(pmtRes.data || pmtRes || []);
      setInvoices(invRes.data || invRes || []);
    } catch (err) {
      console.error('[PaymentsList] Failed to load payments data:', err);
      if (onTriggerToast) onTriggerToast('Failed to load payments ledger.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter open invoices with remaining balance > 0
  const openInvoices = invoices.filter(inv => {
    const bal = inv.balance_due !== undefined && inv.balance_due !== null 
      ? parseFloat(inv.balance_due) 
      : (parseFloat(inv.total) - parseFloat(inv.amount_paid || 0));
    return bal > 0.005;
  });

  const activeInvoice = invoices.find(i => i.id === selectedInvoiceId);
  const invoiceBalanceDue = activeInvoice 
    ? (activeInvoice.balance_due !== undefined && activeInvoice.balance_due !== null
        ? parseFloat(activeInvoice.balance_due) 
        : (parseFloat(activeInvoice.total) - parseFloat(activeInvoice.amount_paid || 0)))
    : 0;

  // Auto-populate payment amount when invoice selected
  const handleSelectInvoice = (id) => {
    setSelectedInvoiceId(id);
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      const bal = inv.balance_due !== undefined && inv.balance_due !== null 
        ? parseFloat(inv.balance_due) 
        : (parseFloat(inv.total) - parseFloat(inv.amount_paid || 0));
      setPaymentAmount(bal.toFixed(2));
    }
  };

  // Compute calculated surcharge
  const parsedAmount = parseFloat(paymentAmount) || 0;
  let calculatedSurcharge = 0;
  if (applySurcharge) {
    if (paymentMethod === 'stripe_card') {
      calculatedSurcharge = Math.round(((parsedAmount * 0.029) + 0.30) * 100) / 100;
    } else if (paymentMethod === 'stripe_ach') {
      calculatedSurcharge = Math.min(5.00, Math.round((parsedAmount * 0.008) * 100) / 100);
    }
  }
  const totalCharged = parsedAmount + calculatedSurcharge;
  const newBalance = Math.max(0, invoiceBalanceDue - parsedAmount);

  // Submit recorded payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      onTriggerToast?.('Please select an invoice to apply payment to.', 'error');
      return;
    }
    if (parsedAmount <= 0) {
      onTriggerToast?.('Payment amount must be greater than zero.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentsApi.recordPayment({
        invoiceId: selectedInvoiceId,
        amount: parsedAmount,
        surchargeFee: calculatedSurcharge,
        paymentMethod,
        paymentDate,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onTriggerToast?.(`Payment of $${parsedAmount.toFixed(2)} recorded successfully!`);
      setIsRecordModalOpen(false);
      // Reset form
      setSelectedInvoiceId('');
      setPaymentAmount('');
      setReferenceNumber('');
      setNotes('');
      setApplySurcharge(false);
      loadData();
    } catch (err) {
      console.error('Failed to record payment:', err);
      onTriggerToast?.(err.message || 'Error recording payment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Client Portal Token
  const handleGeneratePortal = async (e) => {
    e.preventDefault();
    if (!portalEmail) {
      onTriggerToast?.('Please enter client email.', 'error');
      return;
    }

    setIsGeneratingPortal(true);
    try {
      const res = await paymentsApi.generatePortalToken({
        clientEmail: portalEmail.trim(),
        clientName: portalName.trim() || undefined,
      });

      const tokenData = res.data || res;
      const fullUrl = `${window.location.origin}${window.location.pathname}#portal?token=${tokenData.magicToken}`;
      setGeneratedPortalUrl(fullUrl);
      onTriggerToast?.('Secure client portal link generated!');
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to generate portal link', 'error');
    } finally {
      setIsGeneratingPortal(false);
    }
  };

  const handleCopyPortalLink = () => {
    if (!generatedPortalUrl) return;
    navigator.clipboard.writeText(generatedPortalUrl);
    setCopiedPortalLink(true);
    onTriggerToast?.('Client portal link copied to clipboard!');
    setTimeout(() => setCopiedPortalLink(false), 2500);
  };

  // Calculate Metrics
  const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalSurcharges = payments.reduce((sum, p) => sum + parseFloat(p.surchargeFee || 0), 0);
  const count = payments.length;
  const avgPmt = count > 0 ? totalCollected / count : 0;

  // Filter payments
  const filteredPayments = payments.filter(pmt => {
    const matchesSearch = 
      (pmt.paymentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pmt.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pmt.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pmt.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod = methodFilter === 'all' || pmt.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const getMethodBadge = (method) => {
    switch (method) {
      case 'stripe_card':
        return <span className="status-badge" style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: 'none' }}>Stripe Card</span>;
      case 'stripe_ach':
        return <span className="status-badge" style={{ backgroundColor: '#ccfbf1', color: '#115e59', border: 'none' }}>Stripe ACH</span>;
      case 'bank_wire':
        return <span className="status-badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: 'none' }}>Wire Transfer</span>;
      case 'check':
        return <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#334155', border: 'none' }}>Paper Check</span>;
      case 'cash':
        return <span className="status-badge" style={{ backgroundColor: '#dcfce7', color: '#166534', border: 'none' }}>Cash</span>;
      default:
        return <span className="status-badge">{method}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payments Ledger & Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track card, ACH and wire transactions, manage fee surcharges, and generate zero-login client portals.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            onClick={() => setIsPortalModalOpen(true)}
          >
            <LinkIcon size={14} />
            <span>Generate Client Portal Link</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => setIsRecordModalOpen(true)}
          >
            <Plus size={14} />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Metric Cards - Clean Material Design 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Total Collected
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Net applied to AR balances
          </div>
        </div>

        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Surcharges Passed
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            ${totalSurcharges.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            Credited to Account 4900
          </div>
        </div>

        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Transactions
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {count}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            Successful settlement events
          </div>
        </div>

        <div className="card p-4 flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Average Payment
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            ${avgPmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            Per settlement transaction
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Material Filter Chips */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="form-input pl-9 pr-8 text-xs sm:text-sm"
            placeholder="Search payment #, invoice #, client, or ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setSearchTerm('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="material-filter-chips">
          {[
            { id: 'all', label: 'All Methods' },
            { id: 'stripe_card', label: 'Cards' },
            { id: 'stripe_ach', label: 'ACH' },
            { id: 'bank_wire', label: 'Wires' },
            { id: 'check', label: 'Checks' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethodFilter(m.id)}
              className={`material-chip-btn ${methodFilter === m.id ? 'active' : ''}`}
            >
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payments Data Table */}
      {isLoading ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          Loading payment transactions...
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <DollarSign size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No Payments Found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchTerm ? 'No payments match your current search query.' : 'Record offline payments or send client portal links to get paid.'}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsRecordModalOpen(true)}
          >
            Record First Payment
          </button>
        </div>
      ) : (
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Date</th>
                <th>Invoice # & Client</th>
                <th>Method</th>
                <th className="text-right">Net Amount</th>
                <th className="text-right">Surcharge</th>
                <th className="text-right">Total Charged</th>
                <th>Reference #</th>
                <th>Status</th>
                <th className="text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((pmt) => {
                const amount = parseFloat(pmt.amount || 0);
                const surcharge = parseFloat(pmt.surchargeFee || 0);
                const total = amount + surcharge;

                return (
                  <tr key={pmt.id}>
                    <td className="font-mono font-semibold text-xs text-slate-900 dark:text-white">
                      {pmt.paymentNumber}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {pmt.paymentDate}
                    </td>
                    <td>
                      <div className="font-medium text-slate-900 dark:text-white text-xs">
                        {pmt.clientName || 'Valued Client'}
                      </div>
                      <div 
                        className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline"
                        onClick={() => onOpenInvoice && onOpenInvoice(pmt.invoiceId)}
                      >
                        {pmt.invoiceNumber}
                      </div>
                    </td>
                    <td>
                      {getMethodBadge(pmt.paymentMethod)}
                    </td>
                    <td className="text-right font-mono font-semibold text-xs text-slate-900 dark:text-white">
                      ${amount.toFixed(2)}
                    </td>
                    <td className="text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                      {surcharge > 0 ? `+$${surcharge.toFixed(2)}` : '—'}
                    </td>
                    <td className="text-right font-mono font-semibold text-xs text-slate-900 dark:text-white">
                      ${total.toFixed(2)}
                    </td>
                    <td className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {pmt.referenceNumber || '—'}
                    </td>
                    <td>
                      <span className="status-badge status-paid text-[10px]">
                        Succeeded
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm px-2 py-1 text-xs"
                        onClick={() => setSelectedReceiptPayment(pmt)}
                        title="View printable payment receipt"
                      >
                        <Receipt size={13} className="text-slate-600 dark:text-slate-300" />
                        <span className="ml-1 hidden sm:inline">Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-slate-700 dark:text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Record Offline / Settled Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 space-y-4">
              {/* Select Invoice */}
              <div>
                <label className="form-label text-xs">Target Invoice</label>
                <select
                  className="form-input text-xs"
                  value={selectedInvoiceId}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  required
                >
                  <option value="">-- Choose open invoice --</option>
                  {openInvoices.map((inv) => {
                    const bal = inv.balance_due !== undefined && inv.balance_due !== null
                      ? parseFloat(inv.balance_due)
                      : (parseFloat(inv.total) - parseFloat(inv.amount_paid || 0));
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number || inv.invoiceNumber} • {inv.client_name || inv.client?.companyName} • Due: ${bal.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
                {activeInvoice && (
                  <div className="mt-1.5 p-2 rounded bg-slate-50 dark:bg-slate-800 text-[11px] flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Invoice Total: <strong>${parseFloat(activeInvoice.total || 0).toFixed(2)}</strong></span>
                    <span>Paid to date: <strong>${parseFloat(activeInvoice.amount_paid || 0).toFixed(2)}</strong></span>
                    <span>Current Balance: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">${invoiceBalanceDue.toFixed(2)}</strong></span>
                  </div>
                )}
              </div>

              {/* Payment Amount & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs">Payment Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input text-xs font-mono"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  {activeInvoice && invoiceBalanceDue > 0 && (
                    <button
                      type="button"
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block"
                      onClick={() => setPaymentAmount(invoiceBalanceDue.toFixed(2))}
                    >
                      Fill full balance (${invoiceBalanceDue.toFixed(2)})
                    </button>
                  )}
                </div>

                <div>
                  <label className="form-label text-xs">Payment Method</label>
                  <select
                    className="form-input text-xs"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="stripe_card">Stripe Credit Card</option>
                    <option value="stripe_ach">ACH Direct Debit</option>
                    <option value="bank_wire">Bank Wire Transfer</option>
                    <option value="check">Paper Check</option>
                    <option value="cash">Cash Settlement</option>
                  </select>
                </div>
              </div>

              {/* Surcharge Option for Card/ACH */}
              {(paymentMethod === 'stripe_card' || paymentMethod === 'stripe_ach') && (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={applySurcharge}
                      onChange={(e) => setApplySurcharge(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                    />
                    <span>Pass processing fee surcharge to client ({paymentMethod === 'stripe_card' ? '2.9% + $0.30' : '0.8% capped at $5'})</span>
                  </label>

                  {applySurcharge && (
                    <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between">
                        <span>Invoice Amount Credited:</span>
                        <span className="font-mono">${parsedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                        <span>Surcharge Fee (Revenue Acct 4900):</span>
                        <span className="font-mono">+${calculatedSurcharge.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1">
                        <span>Total Customer Charge:</span>
                        <span className="font-mono">${totalCharged.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Date & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-xs">Payment Date</label>
                  <input
                    type="date"
                    className="form-input text-xs"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label text-xs">Reference / Check #</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="e.g. CHK-1094 or Wire ID"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label text-xs">Internal Audit Notes</label>
                <input
                  type="text"
                  className="form-input text-xs"
                  placeholder="e.g. Received via Chase checking, verified by consultant"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Impact Summary */}
              {activeInvoice && parsedAmount > 0 && (
                <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Remaining Balance After Payment:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">${newBalance.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Resulting Status:</span>
                    <strong className="capitalize text-slate-900 dark:text-white">
                      {newBalance <= 0.005 ? 'Paid (Full)' : 'Partially Paid'}
                    </strong>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsRecordModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  disabled={isSubmitting}
                >
                  <Check size={14} />
                  <span>{isSubmitting ? 'Recording...' : 'Apply Payment to Ledger'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Zero-Login Client Portal Link Modal */}
      {isPortalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <LinkIcon size={18} className="text-slate-700 dark:text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Zero-Login Client Billing Portal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsPortalModalOpen(false); setGeneratedPortalUrl(''); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500">
                Generate a secure, 30-day crypto-random magic link that lets your client view their full statement of accounts, download receipts, and pay invoices online without registering an account.
              </p>

              <form onSubmit={handleGeneratePortal} className="space-y-3">
                <div>
                  <label className="form-label text-xs">Client Email Address</label>
                  <input
                    type="email"
                    className="form-input text-xs"
                    placeholder="e.g. accounting@clientcompany.com"
                    value={portalEmail}
                    onChange={(e) => setPortalEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label text-xs">Client Company / Name (Optional)</label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="e.g. Acme Corporation"
                    value={portalName}
                    onChange={(e) => setPortalName(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5"
                  disabled={isGeneratingPortal}
                >
                  <LinkIcon size={14} />
                  <span>{isGeneratingPortal ? 'Generating Link...' : 'Generate 30-Day Portal Link'}</span>
                </button>
              </form>

              {generatedPortalUrl && (
                <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-2 animate-in fade-in">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    <span>Portal Magic Link Ready</span>
                  </div>

                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all select-all">
                    {generatedPortalUrl}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-1.5"
                      onClick={handleCopyPortalLink}
                    >
                      {copiedPortalLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedPortalLink ? 'Copied!' : 'Copy Magic Link'}</span>
                    </button>

                    <a
                      href={generatedPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
                    >
                      <ExternalLink size={13} />
                      <span>Preview Portal</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Payment Receipt Modal */}
      {selectedReceiptPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Payment Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm px-2 py-1 text-xs flex items-center gap-1"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptPayment(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-slate-800 dark:text-slate-200" id="payment-receipt-print">
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="inline-flex p-2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Received</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedReceiptPayment.paymentNumber}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedReceiptPayment.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client Recipient:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedReceiptPayment.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Date:</span>
                  <span>{selectedReceiptPayment.paymentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="capitalize">{selectedReceiptPayment.paymentMethod.replace('_', ' ')}</span>
                </div>
                {selectedReceiptPayment.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference / Check #:</span>
                    <span className="font-mono">{selectedReceiptPayment.referenceNumber}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Amount Paid:</span>
                  <span className="font-mono font-semibold">${parseFloat(selectedReceiptPayment.amount).toFixed(2)}</span>
                </div>
                {parseFloat(selectedReceiptPayment.surchargeFee || 0) > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Convenience Fee:</span>
                    <span className="font-mono">+${parseFloat(selectedReceiptPayment.surchargeFee).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Settled:</span>
                  <span className="font-mono">${(parseFloat(selectedReceiptPayment.amount) + parseFloat(selectedReceiptPayment.surchargeFee || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[11px] text-center text-slate-400 pt-3">
                Thank you for your business. This document serves as official proof of payment.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
