import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  CreditCard,
  FileCheck2,
  Lock
} from 'lucide-react';
import { formatMoney } from '../utils/invoiceSchema';

export function InvoicePaper({ invoice, isUnlocked = true, onTriggerCopyToast }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!invoice) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    if (onTriggerCopyToast) {
      onTriggerCopyToast(`${fieldName} copied to clipboard!`);
    }
    setTimeout(() => setCopiedField(null), 2000);
  };

  const currency = invoice.currency || 'USD';

  return (
    <div className="invoice-paper-wrapper">
      <div id="invoice-printable-paper" className="invoice-paper">
        {/* Subtle decorative watermark */}
        <div className="invoice-watermark">
          {invoice.status === 'paid' ? 'PAID' : 'INVOICE'}
        </div>

        {/* Top Header */}
        <div className="inv-header">
          <div>
            <h1 className="inv-company-name">
              {invoice.issuer?.businessName || invoice.issuer?.name || 'Consulting Services'}
            </h1>
            {invoice.issuer?.businessName && invoice.issuer?.name && (
              <div className="inv-company-sub">
                Consultant: <strong>{invoice.issuer.name}</strong> {invoice.issuer.titleOrRole ? `— ${invoice.issuer.titleOrRole}` : ''}
              </div>
            )}
            <div className="inv-company-meta">
              {invoice.issuer?.address && <div>{invoice.issuer.address}</div>}
              {invoice.issuer?.cityStateZip && <div>{invoice.issuer.cityStateZip}, {invoice.issuer.country || 'USA'}</div>}
              {invoice.issuer?.email && <div>Email: {invoice.issuer.email}</div>}
              {invoice.issuer?.phone && <div>Phone: {invoice.issuer.phone}</div>}
              {invoice.issuer?.taxId && <div>Tax ID / EIN: {invoice.issuer.taxId}</div>}
            </div>
          </div>

          <div className="inv-meta-right">
            <div className="inv-badge-title">INVOICE</div>
            <div className="inv-number-tag">{invoice.invoiceNumber || invoice.id}</div>
            
            <div className="inv-date-row">
              <div className="inv-date-item">
                <span className="inv-date-label">Invoice Date</span>
                <span className="inv-date-val">{invoice.invoiceDate || '—'}</span>
              </div>
              <div className="inv-date-item">
                <span className="inv-date-label">Payment Due</span>
                <span className="inv-date-val" style={{ fontWeight: '700' }}>
                  {invoice.dueDate || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Period Highlight Box (Mandatory per Consulting Agreement) */}
        <div className="service-period-callout">
          <div>
            <div className="service-period-title">Service Period Rendered</div>
            <div className="service-period-value">
              {invoice.servicePeriod || `${invoice.serviceStartDate || ''} to ${invoice.serviceEndDate || ''}`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--apple-text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <FileCheck2 size={18} />
            <span>Consulting Agreement Service Verification</span>
          </div>
        </div>

        {/* Parties: Billed To (Client) and Terms */}
        <div className="inv-parties">
          <div>
            <div className="party-box-title">Bill To (Client)</div>
            <div className="party-name">{invoice.client?.companyName || 'Blukers, Inc.'}</div>
            <div className="party-meta">
              {invoice.client?.contactName && <div>Attn: {invoice.client.contactName}</div>}
              {invoice.client?.address && <div>{invoice.client.address}</div>}
              {invoice.client?.cityStateZip && <div>{invoice.client.cityStateZip}</div>}
              {invoice.client?.email && <div>Primary: <strong>{invoice.client.email}</strong></div>}
              {invoice.client?.ccEmail && <div>CC: <strong>{invoice.client.ccEmail}</strong></div>}
            </div>
          </div>

          <div>
            <div className="party-box-title">Payment Terms & Submission</div>
            <div className="party-meta">
              <div><strong>Terms:</strong> {invoice.paymentTerms || 'Payment due on or before the 15th of following month'}</div>
              <div style={{ marginTop: '0.35rem' }}>
                <strong>Submission Protocol:</strong> Invoices submitted to <em>accounting@blukers.com</em> with <em>rosa@blukers.com</em> copied.
              </div>
              <div style={{ marginTop: '0.35rem', color: 'var(--apple-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={14} />
                <span>Verified End-to-End Secure Channel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table (Services Provided) */}
        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ width: '55%' }}>Description of Services Provided</th>
              <th className="col-center" style={{ width: '15%' }}>Hours / Qty</th>
              <th className="col-center" style={{ width: '15%' }}>Rate</th>
              <th className="col-amount" style={{ width: '15%' }}>Amount ({currency})</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => (
              <tr key={item.id || index}>
                <td>
                  <div style={{ fontWeight: 600, color: 'inherit' }}>{item.description}</div>
                  {item.category && item.category !== 'consulting' && (
                    <span style={{ fontSize: '0.725rem', color: 'var(--apple-text-tertiary)', textTransform: 'capitalize' }}>
                      Category: {item.category}
                    </span>
                  )}
                </td>
                <td className="col-center font-mono">{item.quantity}</td>
                <td className="col-center font-mono">{formatMoney(item.rate, currency)}</td>
                <td className="col-amount font-mono font-bold">{formatMoney((item.quantity || 0) * (item.rate || 0), currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pre-Approved Additional Charges (if any) */}
        {invoice.additionalCharges && invoice.additionalCharges.length > 0 && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--apple-text-secondary)', marginBottom: '0.4rem' }}>
              Pre-Approved Additional Charges & Expenses
            </div>
            <table className="inv-table" style={{ marginTop: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '85%' }}>Approved Expense / Fee Item</th>
                  <th className="col-amount" style={{ width: '15%' }}>Amount ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {invoice.additionalCharges.map((chg, idx) => (
                  <tr key={chg.id || idx}>
                    <td>{chg.description}</td>
                    <td className="col-amount font-mono font-bold">{formatMoney(chg.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Summary */}
        <div className="inv-totals-container">
          <div className="inv-totals-box">
            <div className="inv-total-line">
              <span>Subtotal Consulting Fees:</span>
              <span className="font-mono">{formatMoney(invoice.subtotal, currency)}</span>
            </div>

            {invoice.additionalChargesTotal > 0 && (
              <div className="inv-total-line">
                <span>Pre-Approved Charges:</span>
                <span className="font-mono">{formatMoney(invoice.additionalChargesTotal, currency)}</span>
              </div>
            )}

            {invoice.discountAmount > 0 && (
              <div className="inv-total-line">
                <span>Discount:</span>
                <span className="font-mono">-{formatMoney(invoice.discountAmount, currency)}</span>
              </div>
            )}

            {invoice.taxAmount > 0 && (
              <div className="inv-total-line">
                <span>Tax:</span>
                <span className="font-mono">{formatMoney(invoice.taxAmount, currency)}</span>
              </div>
            )}

            <div className="inv-total-line final">
              <span>Total Balance Due:</span>
              <span className="font-mono font-bold" style={{ fontSize: '1.25rem' }}>
                {formatMoney(invoice.total, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Confidential Wire Transfer Details Section (Unlocked via Code) */}
        <div className="inv-wire-card">
          <div className="inv-wire-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <CreditCard size={18} />
              <span>Wire Transfer & Direct Deposit Payment Instructions</span>
            </div>
            <span className="security-pill">
              <ShieldCheck size={12} />
              Confidential Banking Data
            </span>
          </div>

          {isUnlocked ? (
            <div className="inv-wire-grid">
              <div className="inv-wire-field">
                <span className="inv-wire-label">Account Holder Name</span>
                <div className="inv-wire-value">
                  <span>{invoice.wireDetails?.accountHolderName || invoice.issuer?.businessName || invoice.issuer?.name || '—'}</span>
                  <button 
                    type="button" 
                    className="copy-mini-btn"
                    onClick={() => handleCopy(invoice.wireDetails?.accountHolderName || invoice.issuer?.businessName || invoice.issuer?.name, 'Account Holder Name')}
                  >
                    {copiedField === 'Account Holder Name' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'Account Holder Name' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="inv-wire-field">
                <span className="inv-wire-label">Bank Name</span>
                <div className="inv-wire-value">
                  <span>{invoice.wireDetails?.bankName || '—'}</span>
                  <button 
                    type="button" 
                    className="copy-mini-btn"
                    onClick={() => handleCopy(invoice.wireDetails?.bankName, 'Bank Name')}
                  >
                    {copiedField === 'Bank Name' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'Bank Name' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="inv-wire-field">
                <span className="inv-wire-label">Account Number / IBAN</span>
                <div className="inv-wire-value">
                  <span style={{ letterSpacing: '0.03em' }}>{invoice.wireDetails?.accountNumberOrIban || '—'}</span>
                  <button 
                    type="button" 
                    className="copy-mini-btn"
                    onClick={() => handleCopy(invoice.wireDetails?.accountNumberOrIban, 'Account Number / IBAN')}
                  >
                    {copiedField === 'Account Number / IBAN' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'Account Number / IBAN' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="inv-wire-field">
                <span className="inv-wire-label">SWIFT / BIC Code</span>
                <div className="inv-wire-value">
                  <span>{invoice.wireDetails?.swiftBicCode || '—'}</span>
                  <button 
                    type="button" 
                    className="copy-mini-btn"
                    onClick={() => handleCopy(invoice.wireDetails?.swiftBicCode, 'SWIFT / BIC Code')}
                  >
                    {copiedField === 'SWIFT / BIC Code' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'SWIFT / BIC Code' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="inv-wire-field">
                <span className="inv-wire-label">Wire Routing (Fedwire / ABA)</span>
                <div className="inv-wire-value">
                  <span>{invoice.wireDetails?.routingAba || '—'}</span>
                  <button 
                    type="button" 
                    className="copy-mini-btn"
                    onClick={() => handleCopy(invoice.wireDetails?.routingAba, 'Wire Routing')}
                  >
                    {copiedField === 'Wire Routing' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'Wire Routing' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="inv-wire-field">
                <span className="inv-wire-label">ACH Routing (Direct Deposit)</span>
                <div className="inv-wire-value">
                  <span>{invoice.wireDetails?.achRouting || '—'}</span>
                  <button 
                    type="button" 
                    className="copy-mini-btn"
                    onClick={() => handleCopy(invoice.wireDetails?.achRouting, 'ACH Routing')}
                  >
                    {copiedField === 'ACH Routing' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'ACH Routing' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {invoice.wireDetails?.bankAddress && (
                <div className="inv-wire-field" style={{ gridColumn: 'span 2' }}>
                  <span className="inv-wire-label">Bank Branch Address</span>
                  <div className="inv-wire-value" style={{ fontSize: '0.85rem' }}>
                    <span>{invoice.wireDetails.bankAddress}</span>
                  </div>
                </div>
              )}

              {invoice.wireDetails?.wireReference && (
                <div className="inv-wire-field" style={{ gridColumn: 'span 2' }}>
                  <span className="inv-wire-label">Wire Transfer Reference / Memo</span>
                  <div className="inv-wire-value">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{invoice.wireDetails.wireReference}</span>
                    <button 
                      type="button" 
                      className="copy-mini-btn"
                      onClick={() => handleCopy(invoice.wireDetails.wireReference, 'Wire Reference')}
                    >
                      {copiedField === 'Wire Reference' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedField === 'Wire Reference' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {invoice.wireDetails?.paymentInstructions && (
                <div style={{ gridColumn: 'span 2', marginTop: '0.4rem', fontSize: '0.825rem', color: 'var(--apple-text-secondary)', fontStyle: 'italic' }}>
                  <strong>Note:</strong> {invoice.wireDetails.paymentInstructions}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--apple-text-secondary)' }}>
              <Lock size={28} style={{ margin: '0 auto 0.5rem auto' }} />
              <div>Sensitive wire routing information is encrypted behind the access code.</div>
            </div>
          )}
        </div>

        {/* Notes & Agreement Certification Footer */}
        <div className="inv-footer">
          {invoice.notes && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Consultant Remarks:</strong> {invoice.notes}
            </div>
          )}
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {invoice.agreementComplianceNote || 'Please submit an invoice for each month of services no later than the 15th day of the following month, in accordance with your Consulting Agreement. All invoices must be emailed to accounting@blukers.com, with rosa@blukers.com copied.'}
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
            <span>QuikLedgr Secure Verification • Document ID: {invoice.id}</span>
            <span>Generated on {new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
