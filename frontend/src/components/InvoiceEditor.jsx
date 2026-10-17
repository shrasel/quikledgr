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
  Calendar, 
  Sparkles,
  HelpCircle,
  KeyRound,
  FileCheck2,
  Copy,
  Info
} from 'lucide-react';
import { 
  CURRENCIES, 
  calculateInvoiceTotals, 
  formatMoney, 
  createBlukersInvoiceTemplate,
  createBlankInvoice,
  getPreviousMonthPeriod,
  getCurrentMonthPeriod
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
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'live-preview'
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
    const template = createBlukersInvoiceTemplate();
    // Keep user's saved profile if available
    const saved = getIssuerProfile();
    if (saved?.profile) {
      template.issuer = { ...template.issuer, ...saved.profile };
    }
    if (saved?.wireDetails) {
      template.wireDetails = { ...template.wireDetails, ...saved.wireDetails };
    }
    setInvoice(template);
    onTriggerToast('Applied Blukers Monthly Consulting template!');
  };

  const handleApplyBlankPreset = () => {
    const blank = createBlankInvoice();
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
    if (saved?.profile || saved?.wireDetails) {
      updateInvoice(prev => ({
        ...prev,
        issuer: saved.profile ? { ...prev.issuer, ...saved.profile } : prev.issuer,
        wireDetails: saved.wireDetails ? { ...prev.wireDetails, ...saved.wireDetails } : prev.wireDetails,
      }));
      onTriggerToast('Loaded saved consultant profile & wire instructions!');
    } else {
      onTriggerToast('No saved profile found yet. Fill in your details and click Save as Default.');
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
    <div className="editor-layout-wrap">
      {/* Top Toolbar */}
      <div className="card no-print" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              PRESET TEMPLATE:
            </span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleApplyBlukersPreset}
              title="Pre-fills Blukers Accounting emails, consulting agreement rules, and wire checklist"
            >
              <Sparkles size={14} color="#059669" />
              <span>Blukers Monthly Consulting</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleApplyBlankPreset}
            >
              <span>Blank Template</span>
            </button>

            <div style={{ borderLeft: '1px solid var(--border-color)', height: '24px', margin: '0 0.25rem' }} />

            <div className="nav-tabs" style={{ padding: '0.2rem' }}>
              <button 
                type="button"
                className={`nav-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Editor Form
              </button>
              <button 
                type="button"
                className={`nav-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Live Preview
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleSaveInvoice}
            >
              <Save size={15} />
              <span>Save</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadPdf}
              disabled={isExporting}
            >
              <Download size={15} />
              <span>{isExporting ? 'Exporting...' : 'PDF'}</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
            >
              <Printer size={15} />
              <span>Print</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={onViewRecipientScreen}
              title="Test the lock screen that Rosa and Blukers accounting will see"
            >
              <Eye size={15} />
              <span>Test Recipient Lock</span>
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={onOpenShareModal}
            >
              <Share2 size={15} />
              <span>Share Secure Link</span>
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
        <div className="editor-layout">
          {/* Header & Metadata Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck2 size={20} color="var(--primary-600)" />
                <span>Invoice Details & Service Period</span>
              </h2>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>Currency:</label>
                <select 
                  className="form-select"
                  style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                  value={invoice.currency || 'USD'}
                  onChange={(e) => updateInvoice({ currency: e.target.value })}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>

                <select 
                  className="form-select"
                  style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                  value={invoice.status || 'draft'}
                  onChange={(e) => updateInvoice({ status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent to Client</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="grid-4">
              <div className="form-group">
                <label className="form-label">INVOICE NUMBER</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono"
                  value={invoice.invoiceNumber || ''} 
                  onChange={(e) => updateInvoice({ invoiceNumber: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">INVOICE DATE</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={invoice.invoiceDate || ''} 
                  onChange={(e) => updateInvoice({ invoiceDate: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">PAYMENT DUE DATE</label>
                  <button 
                    type="button" 
                    onClick={handleSetDue15th} 
                    style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
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
                <label className="form-label">SERVICE PERIOD LABEL</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. October 1 – October 31, 2026"
                  value={invoice.servicePeriod || ''} 
                  onChange={(e) => updateInvoice({ servicePeriod: e.target.value })} 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">PAYMENT TERMS / AGREEMENT NOTE</label>
              <input 
                type="text" 
                className="form-input"
                value={invoice.paymentTerms || ''} 
                onChange={(e) => updateInvoice({ paymentTerms: e.target.value })} 
              />
            </div>
          </div>

          {/* Issuer & Client Grid */}
          <div className="grid-2">
            {/* FROM: Consultant / Business Details */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Your Business / Consultant Info</h3>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={handleLoadDefaultProfile}
                  >
                    Load Saved
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={handleSaveDefaultProfile}
                  >
                    Save Default
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">YOUR FULL NAME</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Jane Doe"
                  value={invoice.issuer?.name || ''}
                  onChange={(e) => handleIssuerChange('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">REGISTERED BUSINESS NAME (IF APPLICABLE)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Acme Advisory LLC"
                  value={invoice.issuer?.businessName || ''}
                  onChange={(e) => handleIssuerChange('businessName', e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">EMAIL</label>
                  <input 
                    type="email" 
                    className="form-input"
                    value={invoice.issuer?.email || ''}
                    onChange={(e) => handleIssuerChange('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PHONE</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={invoice.issuer?.phone || ''}
                    onChange={(e) => handleIssuerChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">STREET ADDRESS</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Street Address, Suite"
                  value={invoice.issuer?.address || ''}
                  onChange={(e) => handleIssuerChange('address', e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">CITY, STATE, ZIP</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={invoice.issuer?.cityStateZip || ''}
                    onChange={(e) => handleIssuerChange('cityStateZip', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">TAX ID / EIN (OPTIONAL)</label>
                  <input 
                    type="text" 
                    className="form-input form-input-mono"
                    value={invoice.issuer?.taxId || ''}
                    onChange={(e) => handleIssuerChange('taxId', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* BILL TO: Client (Blukers Protocol) */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>Client ("Bill To")</h3>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                  Pre-configured for Blukers
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">CLIENT COMPANY NAME</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={invoice.client?.companyName || ''}
                  onChange={(e) => handleClientChange('companyName', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ATTENTION / CONTACT NAME</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={invoice.client?.contactName || ''}
                  onChange={(e) => handleClientChange('contactName', e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">PRIMARY EMAIL (ACCOUNTING)</label>
                  <input 
                    type="email" 
                    className="form-input"
                    value={invoice.client?.email || ''}
                    onChange={(e) => handleClientChange('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">COPIED EMAIL (ROSA)</label>
                  <input 
                    type="email" 
                    className="form-input"
                    value={invoice.client?.ccEmail || ''}
                    onChange={(e) => handleClientChange('ccEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">CLIENT BILLING ADDRESS</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={invoice.client?.address || ''}
                  onChange={(e) => handleClientChange('address', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">CITY, STATE, ZIP</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={invoice.client?.cityStateZip || ''}
                  onChange={(e) => handleClientChange('cityStateZip', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Line Items Table (QuickBooks Style) */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Description of Services Provided</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Enter itemized consulting hours, strategic milestones, or monthly retainer fees.
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => handleAddItem('consulting')}
              >
                <Plus size={14} />
                <span>Add Service Row</span>
              </button>
            </div>

            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>Description of Service</th>
                    <th style={{ width: '15%' }}>Hours / Qty</th>
                    <th style={{ width: '15%' }}>Rate ({invoice.currencySymbol || '$'})</th>
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
                          <div className="font-mono" style={{ fontWeight: 600 }}>
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

            {/* Pre-Approved Additional Charges Section */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    Pre-Approved Additional Charges (Optional)
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Reimbursable project expenses, software licenses, or cloud infrastructure pre-approved by Blukers.
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddCharge}
                >
                  <Plus size={14} />
                  <span>Add Expense Item</span>
                </button>
              </div>

              {(invoice.additionalCharges || []).map((chg, idx) => (
                <div key={chg.id || idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Description of pre-approved charge"
                    value={chg.description || ''}
                    onChange={(e) => handleChargeChange(idx, 'description', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <div style={{ width: '180px' }}>
                    <input 
                      type="number" 
                      className="form-input form-input-mono"
                      placeholder="Amount ($)"
                      step="any"
                      value={chg.amount ?? 0}
                      onChange={(e) => handleChargeChange(idx, 'amount', e.target.value)}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm btn-icon-only"
                    onClick={() => handleDeleteCharge(idx)}
                    title="Remove charge"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="totals-summary-card">
              <div className="totals-row">
                <span>Subtotal Consulting Fees:</span>
                <span className="font-mono">{formatMoney(invoice.subtotal, invoice.currency)}</span>
              </div>

              {invoice.additionalChargesTotal > 0 && (
                <div className="totals-row">
                  <span>Pre-Approved Additional Charges:</span>
                  <span className="font-mono">{formatMoney(invoice.additionalChargesTotal, invoice.currency)}</span>
                </div>
              )}

              <div className="totals-row grand-total">
                <span>TOTAL AMOUNT DUE:</span>
                <span className="grand-total-amount">
                  {formatMoney(invoice.total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Sensitive Wire Transfer Payment Details Card */}
          <div className="wire-transfer-section">
            <div className="wire-header">
              <div className="wire-header-title">
                <CreditCard size={20} />
                <span>Wire Transfer Payment Information</span>
              </div>
              <span className="security-pill">
                <ShieldCheck size={14} />
                Encrypted with Access Code
              </span>
            </div>

            <p style={{ fontSize: '0.825rem', color: '#475569', marginBottom: '1.25rem' }}>
              In accordance with security standards, this sensitive banking data is encrypted when generating the shareable link and will only unlock when the recipient inputs your designated access code.
            </p>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">ACCOUNT HOLDER NAME</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Exact name on bank account"
                  value={invoice.wireDetails?.accountHolderName || ''}
                  onChange={(e) => handleWireChange('accountHolderName', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">BANK NAME</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. JPMorgan Chase Bank, N.A."
                  value={invoice.wireDetails?.bankName || ''}
                  onChange={(e) => handleWireChange('bankName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">ACCOUNT NUMBER OR IBAN</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono"
                  placeholder="Account Number or International IBAN"
                  value={invoice.wireDetails?.accountNumberOrIban || ''}
                  onChange={(e) => handleWireChange('accountNumberOrIban', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SWIFT / BIC CODE</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono"
                  placeholder="e.g. CHASUS33XXX"
                  value={invoice.wireDetails?.swiftBicCode || ''}
                  onChange={(e) => handleWireChange('swiftBicCode', e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">ROUTING NUMBER (FEDWIRE / ABA)</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono"
                  placeholder="9-digit Fedwire routing number"
                  value={invoice.wireDetails?.routingAba || ''}
                  onChange={(e) => handleWireChange('routingAba', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">ACH ROUTING NUMBER (DIRECT DEPOSIT)</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono"
                  placeholder="ACH routing number"
                  value={invoice.wireDetails?.achRouting || ''}
                  onChange={(e) => handleWireChange('achRouting', e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">BANK ADDRESS / BRANCH LOCATION</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="City, State, Country of bank branch"
                  value={invoice.wireDetails?.bankAddress || ''}
                  onChange={(e) => handleWireChange('bankAddress', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">WIRE REFERENCE / MEMO</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. INV-BLK-2026-10 - Consultant Name"
                  value={invoice.wireDetails?.wireReference || ''}
                  onChange={(e) => handleWireChange('wireReference', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">SPECIAL PAYMENT INSTRUCTIONS</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Notes for accounting (e.g. include invoice number in wire description)"
                value={invoice.wireDetails?.paymentInstructions || ''}
                onChange={(e) => handleWireChange('paymentInstructions', e.target.value)}
              />
            </div>
          </div>

          {/* Security & Access Code Settings Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <KeyRound size={20} color="#059669" />
                  <span>Secure Access Code (PIN Protection)</span>
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  The recipient must enter this 6-digit passcode to unlock the invoice and view your banking details.
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

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">6-DIGIT SECURITY ACCESS PIN</label>
                <input 
                  type="text" 
                  className="form-input form-input-mono"
                  maxLength={6}
                  style={{ fontSize: '1.2rem', letterSpacing: '0.15em', fontWeight: '700', color: '#059669' }}
                  value={invoice.security?.accessPin || '123456'}
                  onChange={(e) => updateInvoice(prev => ({
                    ...prev,
                    security: { ...prev.security, accessPin: e.target.value }
                  }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">RECIPIENT HINT</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={invoice.security?.passcodeHint || ''}
                  onChange={(e) => updateInvoice(prev => ({
                    ...prev,
                    security: { ...prev.security, passcodeHint: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Final Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleSaveInvoice}
            >
              <Save size={16} />
              <span>Save Progress</span>
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-lg"
              onClick={onOpenShareModal}
            >
              <Share2 size={18} />
              <span>Generate Link & Email to Blukers</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
