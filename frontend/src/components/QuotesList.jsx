import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  X, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  PenTool, 
  Calendar, 
  DollarSign, 
  Clock, 
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import { quotesApi } from '../api/client';
import { formatMoney } from '../utils/invoiceSchema';

export function QuotesList({ onTriggerToast, onOpenInvoice }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [convertingId, setConvertingId] = useState(null);

  // Form State for New Quote
  const [newQuoteData, setNewQuoteData] = useState({
    quoteNumber: `QTE-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })(),
    currency: 'USD',
    taxRate: 0,
    discountAmount: 0,
    notes: 'Thank you for the opportunity. We look forward to working with you.',
    terms: 'Proposal valid for 30 days. Payment terms: 50% deposit upon acceptance.',
    items: [
      { description: 'Phase 1 Architecture & Implementation', quantity: 1, rate: 2500 }
    ]
  });

  // e-Signature Canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const res = await quotesApi.getAll({ status: statusFilter, search: searchTerm });
      setQuotes(res.quotes || []);
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to load quotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    loadQuotes();
  };

  const handleAddItem = () => {
    setNewQuoteData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    setNewQuoteData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setNewQuoteData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const calculateTotals = (items, taxRate, discountAmount) => {
    let subtotal = 0;
    for (const it of items) {
      subtotal += (parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0);
    }
    const discount = parseFloat(discountAmount) || 0;
    const taxable = Math.max(0, subtotal - discount);
    const tax = (taxable * (parseFloat(taxRate) || 0)) / 100;
    const total = taxable + tax;
    return { subtotal, tax, total };
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!newQuoteData.clientName) {
      onTriggerToast?.('Please enter client name.', 'error');
      return;
    }

    try {
      await quotesApi.create(newQuoteData);
      onTriggerToast?.('Quote & estimate generated successfully.');
      setIsCreateModalOpen(false);
      loadQuotes();
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to create quote', 'error');
    }
  };

  const handleConvertToInvoice = async (quote) => {
    if (quote.status === 'converted') {
      onTriggerToast?.('Quote is already converted to an invoice.', 'warning');
      return;
    }

    setConvertingId(quote.id);
    try {
      const result = await quotesApi.convertToInvoice(quote.id);
      onTriggerToast?.(result.message || `Converted to Invoice ${result.invoiceNumber}!`);
      loadQuotes();
      if (onOpenInvoice && result.invoiceId) {
        onOpenInvoice(result.invoiceId);
      }
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to convert quote', 'error');
    } finally {
      setConvertingId(null);
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote proposal?')) return;
    try {
      await quotesApi.delete(quoteId);
      onTriggerToast?.('Quote deleted.');
      loadQuotes();
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to delete quote', 'error');
    }
  };

  // e-Signature Canvas Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveSignature = async () => {
    if (!signerName.trim()) {
      onTriggerToast?.('Please enter the signer full name.', 'error');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL('image/png');

    try {
      await quotesApi.sign(selectedQuote.id, signatureDataUrl, signerName);
      onTriggerToast?.(`Proposal ${selectedQuote.quoteNumber} signed and approved!`);
      setIsSignModalOpen(false);
      loadQuotes();
    } catch (err) {
      onTriggerToast?.(err.message || 'Failed to submit e-signature', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge status-paid flex items-center gap-1"><CheckCircle2 size={11} /> Approved</span>;
      case 'converted':
        return <span className="status-badge bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 flex items-center gap-1"><ArrowRight size={11} /> Invoiced</span>;
      case 'sent':
        return <span className="status-badge status-sent flex items-center gap-1"><Clock size={11} /> Sent</span>;
      case 'declined':
        return <span className="status-badge status-overdue flex items-center gap-1"><X size={11} /> Declined</span>;
      default:
        return <span className="status-badge status-draft flex items-center gap-1">Draft</span>;
    }
  };

  const formTotals = calculateTotals(newQuoteData.items, newQuoteData.taxRate, newQuoteData.discountAmount);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Quotes & Proposals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Client estimates, digital e-signatures, and instant 1-click invoice conversion.
          </p>
        </div>

        <button 
          type="button"
          className="btn btn-primary btn-sm self-start sm:self-auto flex items-center gap-1.5"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={15} />
          <span>New Quote</span>
        </button>
      </div>

      {/* Toolbar: Search and Material 3 Filter Chips */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            className="form-input pl-9 pr-8 text-xs sm:text-sm" 
            placeholder="Search quotes by #, client name, email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => { setSearchTerm(''); loadQuotes(); }}
            >
              <X size={14} />
            </button>
          )}
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'draft', 'sent', 'approved', 'converted'].map(status => (
            <button
              key={status}
              type="button"
              className={`material-chip-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All Quotes' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-sm p-1.5 ml-1 text-slate-500"
            onClick={loadQuotes}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="card overflow-hidden">
        <div className="md-table-wrap">
          <table className="md-table">
            <thead>
              <tr>
                <th>Quote Number</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Expires</th>
                <th>Items</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400 text-xs">
                    Loading quotes...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <FileText size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No quotes found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {statusFilter !== 'all' ? 'Try changing the status filter or create a new quote.' : 'Create your first proposal to send to your client.'}
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm mt-3"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus size={14} />
                      <span>Create Proposal</span>
                    </button>
                  </td>
                </tr>
              ) : (
                quotes.map(q => (
                  <tr key={q.id}>
                    <td>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileText size={14} className="text-slate-400" />
                        {q.quoteNumber}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{q.clientName}</div>
                      {q.clientEmail && <div className="text-[11px] text-slate-400">{q.clientEmail}</div>}
                    </td>
                    <td className="text-slate-600 dark:text-slate-400">{q.issueDate}</td>
                    <td className="text-slate-600 dark:text-slate-400">
                      {q.expiryDate ? q.expiryDate : <span className="text-slate-400 italic">No expiry</span>}
                    </td>
                    <td className="text-slate-500">{q.items?.length || 1} line item(s)</td>
                    <td className="text-right font-semibold text-slate-900 dark:text-white">
                      {formatMoney(q.total, q.currency)}
                    </td>
                    <td>
                      {getStatusBadge(q.status)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Proposal */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm p-1.5 text-slate-600 dark:text-slate-300"
                          title="View Details"
                          onClick={() => { setSelectedQuote(q); setIsViewModalOpen(true); }}
                        >
                          <Eye size={13} />
                        </button>

                        {/* Sign Action */}
                        {q.status !== 'converted' && !q.signatureDataUrl && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm px-2 py-1 text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1"
                            title="Sign Proposal"
                            onClick={() => {
                              setSelectedQuote(q);
                              setSignerName(q.clientName || '');
                              setIsSignModalOpen(true);
                            }}
                          >
                            <PenTool size={12} />
                            <span className="hidden sm:inline">Sign</span>
                          </button>
                        )}

                        {/* Convert to Invoice Action */}
                        {q.status !== 'converted' ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm px-2.5 py-1 text-xs flex items-center gap-1"
                            title="Convert to Invoice"
                            disabled={convertingId === q.id}
                            onClick={() => handleConvertToInvoice(q)}
                          >
                            <ArrowRight size={12} />
                            <span>{convertingId === q.id ? 'Converting...' : 'Invoice'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5">
                            Converted
                          </span>
                        )}

                        {/* Delete Quote */}
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
                          title="Delete Quote"
                          onClick={() => handleDeleteQuote(q.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Quote Proposal */}
      {isCreateModalOpen && (
        <div className="md-dialog-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="md-dialog-card max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Quote & Proposal</h2>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Quote Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newQuoteData.quoteNumber}
                    onChange={e => setNewQuoteData({ ...newQuoteData, quoteNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Currency</label>
                  <select
                    className="form-input"
                    value={newQuoteData.currency}
                    onChange={e => setNewQuoteData({ ...newQuoteData, currency: e.target.value })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Client Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Acme Corporation"
                    value={newQuoteData.clientName}
                    onChange={e => setNewQuoteData({ ...newQuoteData, clientName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Client Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="billing@acme.com"
                    value={newQuoteData.clientEmail}
                    onChange={e => setNewQuoteData({ ...newQuoteData, clientEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Proposal Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newQuoteData.issueDate}
                    onChange={e => setNewQuoteData({ ...newQuoteData, issueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Expiration Date (30 Days)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newQuoteData.expiryDate}
                    onChange={e => setNewQuoteData({ ...newQuoteData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scope Line Items</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm py-1 px-2 text-xs flex items-center gap-1"
                    onClick={handleAddItem}
                  >
                    <Plus size={12} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newQuoteData.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="form-input flex-1 text-xs"
                        placeholder="Service description"
                        value={it.description}
                        onChange={e => handleItemChange(idx, 'description', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        className="form-input w-20 text-xs"
                        placeholder="Qty"
                        min="0.1"
                        step="any"
                        value={it.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                      <input
                        type="number"
                        className="form-input w-24 text-xs"
                        placeholder="Rate"
                        min="0"
                        step="any"
                        value={it.rate}
                        onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                      />
                      <div className="w-24 text-right text-xs font-semibold text-slate-800 dark:text-slate-200">
                        ${((parseFloat(it.quantity) || 0) * (parseFloat(it.rate) || 0)).toFixed(2)}
                      </div>
                      {newQuoteData.items.length > 1 && (
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-500 p-1"
                          onClick={() => handleRemoveItem(idx)}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>${formTotals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Tax Rate (%)</span>
                  <input
                    type="number"
                    className="form-input w-20 py-0.5 text-xs text-right"
                    value={newQuoteData.taxRate}
                    onChange={e => setNewQuoteData({ ...newQuoteData, taxRate: e.target.value })}
                  />
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Discount ($)</span>
                  <input
                    type="number"
                    className="form-input w-20 py-0.5 text-xs text-right"
                    value={newQuoteData.discountAmount}
                    onChange={e => setNewQuoteData({ ...newQuoteData, discountAmount: e.target.value })}
                  />
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Proposal Value</span>
                  <span>${formTotals.total.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="form-label">Payment Terms & Acceptance Conditions</label>
                <textarea
                  className="form-input text-xs"
                  rows="2"
                  value={newQuoteData.terms}
                  onChange={e => setNewQuoteData({ ...newQuoteData, terms: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  Generate Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Digital e-Signature Canvas */}
      {isSignModalOpen && selectedQuote && (
        <div className="md-dialog-overlay" onClick={() => setIsSignModalOpen(false)}>
          <div className="md-dialog-card max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PenTool size={16} className="text-slate-700 dark:text-slate-200" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Digital e-Signature</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setIsSignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                Sign below to approve and accept proposal <strong>{selectedQuote.quoteNumber}</strong> for <strong>{formatMoney(selectedQuote.total, selectedQuote.currency)}</strong>.
              </p>

              <div>
                <label className="form-label">Signer Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter authorized signatory name"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label mb-0">Signature Canvas (Touch / Mouse)</label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] text-slate-500 hover:text-rose-500 underline"
                  >
                    Clear Canvas
                  </button>
                </div>
                <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={160}
                    className="w-full h-40 cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsSignModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  onClick={handleSaveSignature}
                >
                  <CheckCircle2 size={14} />
                  <span>Accept & Sign Proposal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Quote Proposal Details */}
      {isViewModalOpen && selectedQuote && (
        <div className="md-dialog-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="md-dialog-card max-w-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Proposal {selectedQuote.quoteNumber}</h2>
                <div className="text-xs text-slate-500">Issued: {selectedQuote.issueDate} • Expires: {selectedQuote.expiryDate || 'N/A'}</div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Prepared For</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedQuote.clientName}</div>
                {selectedQuote.clientEmail && <div className="text-slate-500">{selectedQuote.clientEmail}</div>}
                {selectedQuote.clientAddress && <div className="text-slate-500 whitespace-pre-line mt-1">{selectedQuote.clientAddress}</div>}
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Scope of Work</div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedQuote.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-slate-800 dark:text-slate-200">{it.description}</td>
                          <td className="p-2 text-right text-slate-500">{it.quantity}</td>
                          <td className="p-2 text-right text-slate-500">${it.rate.toFixed(2)}</td>
                          <td className="p-2 text-right font-medium text-slate-800 dark:text-slate-200">${it.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-56 space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>${selectedQuote.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedQuote.discountAmount > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Discount:</span>
                      <span>-${selectedQuote.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedQuote.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Tax:</span>
                      <span>+${selectedQuote.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Total Proposal:</span>
                    <span>${selectedQuote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedQuote.signatureDataUrl && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Digitally Signed & Approved
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">
                    Signed by: <strong>{selectedQuote.signedByName}</strong> on {selectedQuote.signedAt ? new Date(selectedQuote.signedAt).toLocaleDateString() : 'N/A'}
                  </div>
                  <img 
                    src={selectedQuote.signatureDataUrl} 
                    alt="Authorized Signature" 
                    className="h-16 mt-2 border border-slate-300 dark:border-slate-700 rounded bg-white p-1" 
                  />
                </div>
              )}

              {selectedQuote.convertedInvoiceId && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                  <span className="text-blue-800 dark:text-blue-300 font-medium">
                    Converted to Invoice #{selectedQuote.convertedInvoiceId}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm py-1 px-2 text-xs"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      onOpenInvoice?.(selectedQuote.convertedInvoiceId);
                    }}
                  >
                    View Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
