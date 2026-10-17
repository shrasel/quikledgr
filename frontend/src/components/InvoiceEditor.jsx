import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Share2, 
  Eye, 
  Download, 
  Printer, 
  CreditCard, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles,
  KeyRound,
  FileCheck2,
  Building2,
  UserCheck
} from 'lucide-react';
import { 
  CURRENCIES, 
  calculateInvoiceTotals, 
  formatMoney, 
  createBlukersInvoiceTemplate,
  createBlankInvoice,
  getPreviousMonthPeriod
} from '../utils/invoiceSchema';
import { generateRandomPin } from '../utils/cryptoUtils';
import { saveInvoice, getIssuerProfile, saveIssuerProfile } from '../utils/storage';
import { exportInvoiceToPdf, printInvoice } from '../utils/pdfExport';
import { InvoicePaper } from './InvoicePaper';

export function InvoiceEditor({ 
  invoice, 
  setInvoice, 
  onOpenShareModal, 
  onViewRecipientScreen, 
  onTriggerToast 
}) {
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const [isExporting, setIsExporting] = useState(false);

  // Recalculate totals helper
  const updateInvoice = (updater) => {
    setInvoice(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      const totals = calculateInvoiceTotals(next);
      return { ...next, ...totals };
    });
  };

  // Field change helpers
  const handleIssuerChange = (field, value) => {
    updateInvoice(prev => ({
      ...prev,
      issuer: { ...prev.issuer, [field]: value }
    }));
  };

  const handleClientChange = (field, value) => {
    updateInvoice(prev => ({
      ...prev,
      client: { ...prev.client, [field]: value }
    }));
  };

  const handleWireChange = (field, value) => {
    updateInvoice(prev => ({
      ...prev,
      wireDetails: { ...prev.wireDetails, [field]: value }
    }));
  };

  // Line item helpers
  const handleItemChange = (index, field, value) => {
    updateInvoice(prev => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const handleAddItem = (category = 'consulting') => {
    updateInvoice(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          id: 'item_' + Date.now(),
          description: '',
          category,
          quantity: 1,
          rate: 0,
          amount: 0,
        }
      ]
    }));
  };

  const handleDeleteItem = (index) => {
    updateInvoice(prev => {
      const items = (prev.items || []).filter((_, i) => i !== index);
      return { ...prev, items };
    });
  };

  // Additional charges helpers
  const handleAddCharge = () => {
    updateInvoice(prev => ({
      ...prev,
      additionalCharges: [
        ...(prev.additionalCharges || []),
        {
          id: 'chg_' + Date.now(),
          description: '',
          amount: 0,
        }
      ]
    }));
  };

  const handleChargeChange = (index, field, value) => {
    updateInvoice(prev => {
      const charges = [...(prev.additionalCharges || [])];
      charges[index] = { ...charges[index], [field]: value };
      return { ...prev, additionalCharges: charges };
    });
  };

  const handleDeleteCharge = (index) => {
    updateInvoice(prev => {
      const additionalCharges = (prev.additionalCharges || []).filter((_, i) => i !== index);
      return { ...prev, additionalCharges };
    });
  };

  // Presets
  const handleApplyBlukersPreset = () => {
    const saved = getIssuerProfile();
    const template = createBlukersInvoiceTemplate(saved);
    setInvoice(template);
    onTriggerToast('Applied Blukers Monthly Consulting template!');
  };

  const handleApplyBlankPreset = () => {
    const saved = getIssuerProfile();
    const blank = createBlankInvoice(saved);
    setInvoice(blank);
    onTriggerToast('Reset to blank invoice.');
  };

  // Date shortcut: 15th of next month
  const handleSetDue15th = () => {
    const dates = getPreviousMonthPeriod();
    updateInvoice({
      dueDate: dates.dueDate,
      paymentTerms: 'Payment due on or before the 15th of the month (Consulting Agreement)',
    });
    onTriggerToast('Due date set to 15th of the month.');
  };

  // Save as default profile
  const handleSaveDefaultProfile = () => {
    saveIssuerProfile(invoice.issuer, invoice.wireDetails);
    onTriggerToast('Saved your profile and wire details as default!');
  };

  // Load default profile
  const handleLoadDefaultProfile = () => {
    const saved = getIssuerProfile();
    if (saved?.profile || saved?.wireDetails || saved?.wageSettings) {
      updateInvoice(prev => {
        const wage = saved.wageSettings || {};
        const items = [...(prev.items || [])];
        if (wage.defaultHourlyRate && items.length > 0 && items[0].rate === 0) {
          const qty = parseFloat(wage.defaultMonthlyHours) || items[0].quantity || 0;
          const rate = parseFloat(wage.defaultHourlyRate) || 0;
          items[0] = {
            ...items[0],
            rate,
            quantity: qty,
            amount: qty * rate,
          };
        }
        return {
          ...prev,
          issuer: saved.profile ? { ...prev.issuer, ...saved.profile } : prev.issuer,
          wireDetails: saved.wireDetails ? { ...prev.wireDetails, ...saved.wireDetails } : prev.wireDetails,
          currency: wage.currency || prev.currency,
          items,
        };
      });
      onTriggerToast('Loaded saved consultant profile, wage & wire instructions!');
    } else {
      onTriggerToast('No saved profile found yet. Configure in Settings tab.');
    }
  };

  const handleSaveInvoice = () => {
    saveInvoice(invoice);
    onTriggerToast(`Invoice ${invoice.invoiceNumber || invoice.id} saved!`);
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    onTriggerToast('Generating PDF...');
    try {
      await exportInvoiceToPdf('invoice-printable-paper', invoice.invoiceNumber || invoice.id);
      onTriggerToast('PDF exported successfully!');
    } catch (e) {
      onTriggerToast('PDF export error. Try the Print button.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printInvoice();
  };

  const handleRegeneratePin = () => {
    const newPin = generateRandomPin();
    updateInvoice(prev => ({
      ...prev,
      security: { ...prev.security, accessPin: newPin }
    }));
    onTriggerToast(`Generated new PIN: ${newPin}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="card p-3 sm:p-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Mode switcher & Presets */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="material-filter-chips">
              <button 
                type="button"
                className={`material-chip-btn ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                Editor Form
              </button>
              <button 
                type="button"
                className={`material-chip-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Live Preview
              </button>
            </div>

            <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 h-5 mx-1" />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-medium text-slate-500 shrink-0">
                Preset:
              </span>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                onClick={handleApplyBlukersPreset}
                title="Pre-fills Blukers Accounting emails and agreement terms"
              >
                <Sparkles size={13} />
                <span>Blukers Consulting</span>
              </button>

              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleApplyBlankPreset}
              >
                <span>Blank</span>
              </button>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              type="button" 
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              onClick={handleSaveInvoice}
            >
              <Save size={14} />
              <span>Save</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm flex items-center gap-1.5"
              onClick={handleDownloadPdf}
              disabled={isExporting}
            >
              <Download size={14} />
              <span>{isExporting ? 'Exporting...' : 'PDF'}</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm hidden sm:flex items-center gap-1.5"
              onClick={handlePrint}
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm hidden md:flex items-center gap-1.5"
              onClick={onViewRecipientScreen}
              title="Test the passcode lock screen that the recipient will see"
            >
              <Eye size={14} />
              <span>Recipient View</span>
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={onOpenShareModal}
            >
              <Share2 size={14} />
              <span>Share Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form or Preview View */}
      {activeTab === 'preview' ? (
        <div>
          <InvoicePaper invoice={invoice} isUnlocked={true} onTriggerCopyToast={onTriggerToast} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card 1: Invoice Meta & Service Period */}
          <div className="card">
            <div className="card-header-clean">
              <div className="card-header-title-wrap">
                <div className="card-header-icon-box">
                  <FileCheck2 size={18} />
                </div>
                <div>
                  <h2 className="card-header-heading">Invoice Details & Service Period</h2>
                  <p className="card-header-subtext">Core billing identifiers and agreement terms.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select 
                  className="form-select text-xs w-auto py-1 h-8"
                  value={invoice.currency || 'USD'}
                  onChange={(e) => updateInvoice({ currency: e.target.value })}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
                  ))}
                </select>

                <select 
                  className="form-select text-xs w-auto py-1 h-8"
                  value={invoice.status || 'draft'}
                  onChange={(e) => updateInvoice({ status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent to Client</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="card-body-clean space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input 
                    type="text" 
                    className="form-input form-input-mono"
                    value={invoice.invoiceNumber || ''} 
                    onChange={(e) => updateInvoice({ invoiceNumber: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Invoice Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={invoice.invoiceDate || ''} 
                    onChange={(e) => updateInvoice({ invoiceDate: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label mb-0">Payment Due Date</label>
                    <button 
                      type="button" 
                      onClick={handleSetDue15th} 
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Set 15th
                    </button>
                  </div>
                  <input 
                    type="date" 
                    className="form-input"
                    value={invoice.dueDate || ''} 
                    onChange={(e) => updateInvoice({ dueDate: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Period</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. October 1 – October 31, 2026"
                    value={invoice.servicePeriod || ''} 
                    onChange={(e) => updateInvoice({ servicePeriod: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Payment Terms / Agreement Note</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Payment due on or before the 15th of the month"
                  value={invoice.paymentTerms || ''} 
                  onChange={(e) => updateInvoice({ paymentTerms: e.target.value })} 
                />
              </div>
            </div>
          </div>

          {/* Card 2 & 3: Issuer & Client Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FROM: Your Business / Consultant Info */}
            <div className="card">
              <div className="card-header-clean">
                <div className="card-header-title-wrap">
                  <div className="card-header-icon-box">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="card-header-heading">Your Business Info</h3>
                    <p className="card-header-subtext">Issuing party details</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={handleLoadDefaultProfile}
                  >
                    Load Saved
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={handleSaveDefaultProfile}
                  >
                    Save Default
                  </button>
                </div>
              </div>

              <div className="card-body-clean space-y-4">
                <div className="form-group">
                  <label className="form-label">Consultant Full Name</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. Sarah Jenkins"
                    value={invoice.issuer?.name || ''}
                    onChange={(e) => handleIssuerChange('name', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Registered Business Name</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. Jenkins Advisory LLC"
                    value={invoice.issuer?.businessName || ''}
                    onChange={(e) => handleIssuerChange('businessName', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input"
                      value={invoice.issuer?.email || ''}
                      onChange={(e) => handleIssuerChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={invoice.issuer?.phone || ''}
                      onChange={(e) => handleIssuerChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Street Address, Suite"
                    value={invoice.issuer?.address || ''}
                    onChange={(e) => handleIssuerChange('address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">City, State, Zip</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={invoice.issuer?.cityStateZip || ''}
                      onChange={(e) => handleIssuerChange('cityStateZip', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax ID / EIN</label>
                    <input 
                      type="text" 
                      className="form-input form-input-mono"
                      placeholder="e.g. 12-3456789"
                      value={invoice.issuer?.taxId || ''}
                      onChange={(e) => handleIssuerChange('taxId', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BILL TO: Client */}
            <div className="card">
              <div className="card-header-clean">
                <div className="card-header-title-wrap">
                  <div className="card-header-icon-box">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className="card-header-heading">Client ("Bill To")</h3>
                    <p className="card-header-subtext">Recipient billing organization</p>
                  </div>
                </div>

                <span className="status-chip paid text-[11px]">
                  Pre-configured
                </span>
              </div>

              <div className="card-body-clean space-y-4">
                <div className="form-group">
                  <label className="form-label">Client Company Name</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={invoice.client?.companyName || ''}
                    onChange={(e) => handleClientChange('companyName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attention / Contact Name</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={invoice.client?.contactName || ''}
                    onChange={(e) => handleClientChange('contactName', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Accounting Email</label>
                    <input 
                      type="email" 
                      className="form-input"
                      value={invoice.client?.email || ''}
                      onChange={(e) => handleClientChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CC Email (Rosa)</label>
                    <input 
                      type="email" 
                      className="form-input"
                      value={invoice.client?.ccEmail || ''}
                      onChange={(e) => handleClientChange('ccEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Client Billing Address</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={invoice.client?.address || ''}
                    onChange={(e) => handleClientChange('address', e.target.value)}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">City, State, Zip</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={invoice.client?.cityStateZip || ''}
                    onChange={(e) => handleClientChange('cityStateZip', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="card">
            <div className="card-header-clean">
              <div>
                <h3 className="card-header-heading">Description of Services Provided</h3>
                <p className="card-header-subtext">Itemized consulting hours, strategic milestones, or monthly retainer fees.</p>
              </div>

              <button 
                type="button" 
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                onClick={() => handleAddItem('consulting')}
              >
                <Plus size={14} />
                <span>Add Service Row</span>
              </button>
            </div>

            <div className="card-body-clean space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block md-table-wrap">
                <table className="md-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48%' }}>Description of Service</th>
                      <th style={{ width: '16%' }}>Hours / Qty</th>
                      <th style={{ width: '16%' }}>Rate ({invoice.currencySymbol || '$'})</th>
                      <th style={{ width: '15%' }}>Amount</th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.items || []).map((item, index) => {
                      const rowAmount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
                      return (
                        <tr key={item.id || index}>
                          <td>
                            <input 
                              type="text" 
                              className="form-input"
                              placeholder="e.g. Technical Consulting Services — Architecture, integrations, support"
                              value={item.description || ''}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input form-input-mono"
                              step="any"
                              value={item.quantity ?? 1}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              className="form-input form-input-mono"
                              step="any"
                              value={item.rate ?? 0}
                              onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            />
                          </td>
                          <td>
                            <div className="font-mono font-semibold text-slate-900 dark:text-white">
                              {formatMoney(rowAmount, invoice.currency)}
                            </div>
                          </td>
                          <td>
                            <button 
                              type="button" 
                              className="btn btn-danger btn-sm btn-icon-only"
                              onClick={() => handleDeleteItem(index)}
                              title="Delete row"
                              disabled={(invoice.items || []).length <= 1}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {(invoice.items || []).map((item, index) => {
                  const rowAmount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
                  return (
                    <div 
                      key={item.id || index}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Service Item #{index + 1}
                        </span>
                        <button 
                          type="button" 
                          className="text-red-500 hover:text-red-700 p-1 rounded-md"
                          onClick={() => handleDeleteItem(index)}
                          title="Delete item"
                          disabled={(invoice.items || []).length <= 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="form-group mb-0">
                        <label className="form-label text-xs">Description</label>
                        <textarea
                          rows={2}
                          className="form-input text-xs"
                          placeholder="e.g. Technical Consulting Services — Architecture, support"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="form-group mb-0">
                          <label className="form-label text-xs">Hours / Qty</label>
                          <input 
                            type="number" 
                            className="form-input form-input-mono text-xs"
                            step="any"
                            value={item.quantity ?? 1}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        </div>

                        <div className="form-group mb-0">
                          <label className="form-label text-xs">Rate ({invoice.currencySymbol || '$'})</label>
                          <input 
                            type="number" 
                            className="form-input form-input-mono text-xs"
                            step="any"
                            value={item.rate ?? 0}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-xs text-slate-500">Row Total:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {formatMoney(rowAmount, invoice.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pre-Approved Additional Charges */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Pre-Approved Additional Charges (Optional)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Reimbursable project expenses, software licenses, or cloud infrastructure pre-approved by client.
                    </p>
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm flex items-center gap-1 self-start sm:self-auto"
                    onClick={handleAddCharge}
                  >
                    <Plus size={14} />
                    <span>Add Expense Item</span>
                  </button>
                </div>

                {(invoice.additionalCharges || []).map((chg, idx) => (
                  <div key={chg.id || idx} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center mb-2.5">
                    <input 
                      type="text" 
                      className="form-input flex-1 text-xs sm:text-sm"
                      placeholder="Description of pre-approved charge"
                      value={chg.description || ''}
                      onChange={(e) => handleChargeChange(idx, 'description', e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        className="form-input form-input-mono w-full sm:w-44 text-xs sm:text-sm"
                        placeholder="Amount ($)"
                        step="any"
                        value={chg.amount ?? 0}
                        onChange={(e) => handleChargeChange(idx, 'amount', e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm btn-icon-only shrink-0"
                        onClick={() => handleDeleteCharge(idx)}
                        title="Remove charge"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 mt-4">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Subtotal Consulting Fees:</span>
                  <span className="font-mono font-medium">{formatMoney(invoice.subtotal, invoice.currency)}</span>
                </div>

                {invoice.additionalChargesTotal > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Pre-Approved Additional Charges:</span>
                    <span className="font-mono font-medium">{formatMoney(invoice.additionalChargesTotal, invoice.currency)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white">
                  <span>Total Amount Due:</span>
                  <span className="font-mono text-base">
                    {formatMoney(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Sensitive Wire Transfer Payment Details */}
          <div className="card">
            <div className="card-header-clean">
              <div className="card-header-title-wrap">
                <div className="card-header-icon-box">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="card-header-heading">Wire Transfer Payment Information</h3>
                  <p className="card-header-subtext">Direct banking instructions populated in recipient view.</p>
                </div>
              </div>

              <span className="security-pill">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Protected by Access PIN</span>
              </span>
            </div>

            <div className="card-body-clean space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Account Holder Name</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Exact name on bank account"
                    value={invoice.wireDetails?.accountHolderName || ''}
                    onChange={(e) => handleWireChange('accountHolderName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. JPMorgan Chase Bank, N.A."
                    value={invoice.wireDetails?.bankName || ''}
                    onChange={(e) => handleWireChange('bankName', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Account Number / IBAN</label>
                  <input 
                    type="text" 
                    className="form-input form-input-mono"
                    placeholder="Account Number or IBAN"
                    value={invoice.wireDetails?.accountNumberOrIban || ''}
                    onChange={(e) => handleWireChange('accountNumberOrIban', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SWIFT / BIC Code</label>
                  <input 
                    type="text" 
                    className="form-input form-input-mono"
                    placeholder="e.g. CHASUS33XXX"
                    value={invoice.wireDetails?.swiftBicCode || ''}
                    onChange={(e) => handleWireChange('swiftBicCode', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Routing Number (Fedwire / ABA)</label>
                  <input 
                    type="text" 
                    className="form-input form-input-mono"
                    placeholder="9-digit Fedwire routing number"
                    value={invoice.wireDetails?.routingAba || ''}
                    onChange={(e) => handleWireChange('routingAba', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ACH Routing Number (Direct Deposit)</label>
                  <input 
                    type="text" 
                    className="form-input form-input-mono"
                    placeholder="ACH routing number"
                    value={invoice.wireDetails?.achRouting || ''}
                    onChange={(e) => handleWireChange('achRouting', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Bank Branch Address</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="City, State, Country of bank branch"
                    value={invoice.wireDetails?.bankAddress || ''}
                    onChange={(e) => handleWireChange('bankAddress', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Wire Reference Memo</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. INV-BLK-2026-10 - Consultant Name"
                    value={invoice.wireDetails?.wireReference || ''}
                    onChange={(e) => handleWireChange('wireReference', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Special Payment Instructions</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Notes for accounting (e.g. include invoice number in wire description)"
                  value={invoice.wireDetails?.paymentInstructions || ''}
                  onChange={(e) => handleWireChange('paymentInstructions', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card 5: Security PIN Protection */}
          <div className="card">
            <div className="card-header-clean">
              <div className="card-header-title-wrap">
                <div className="card-header-icon-box">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="card-header-heading">Recipient Security PIN Protection</h3>
                  <p className="card-header-subtext">6-digit access code required to unlock wire instructions.</p>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleRegeneratePin}
              >
                <RefreshCw size={14} />
                <span>Generate Random PIN</span>
              </button>
            </div>

            <div className="card-body-clean">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label className="form-label">6-Digit Security PIN</label>
                  <input 
                    type="text" 
                    className="form-input form-input-mono text-base font-semibold tracking-wider"
                    maxLength={6}
                    value={invoice.security?.accessPin || '123456'}
                    onChange={(e) => updateInvoice(prev => ({
                      ...prev,
                      security: { ...prev.security, accessPin: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Recipient Hint (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. Check your WhatsApp or company Slack for the PIN"
                    value={invoice.security?.passcodeHint || ''}
                    onChange={(e) => updateInvoice(prev => ({
                      ...prev,
                      security: { ...prev.security, passcodeHint: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button 
              type="button" 
              className="btn btn-secondary w-full sm:w-auto"
              onClick={handleSaveInvoice}
            >
              <Save size={16} />
              <span>Save Progress</span>
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-lg w-full sm:w-auto"
              onClick={onOpenShareModal}
            >
              <Share2 size={16} />
              <span>Generate Link & Email to Blukers</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
