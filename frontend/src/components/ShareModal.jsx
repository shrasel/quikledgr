import React, { useState } from 'react';
import { 
  X, 
  Link, 
  Copy, 
  Check, 
  Mail, 
  Key, 
  ShieldCheck, 
  ExternalLink,
  Send
} from 'lucide-react';

export function ShareModal({ invoice, shareUrl, onClose, onTriggerToast }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedEmailDraft, setCopiedEmailDraft] = useState(false);

  if (!invoice) return null;

  const pin = invoice.security?.accessPin || '123456';
  const consultantName = invoice.issuer?.name || invoice.issuer?.businessName || 'Consultant';
  const servicePeriod = invoice.servicePeriod || `${invoice.serviceStartDate || ''} – ${invoice.serviceEndDate || ''}`;
  const invoiceNumber = invoice.invoiceNumber || invoice.id;
  const toEmail = invoice.client?.email || 'accounting@blukers.com';
  const ccEmail = invoice.client?.ccEmail || 'rosa@blukers.com';

  const emailSubject = `Monthly Consulting Invoice ${invoiceNumber} – ${consultantName} – ${servicePeriod}`;

  const emailBody = `Dear Blukers Accounting Team,

Please find the secure link to my monthly consulting invoice for services rendered during: ${servicePeriod}.

Invoice Summary:
• Invoice Number: ${invoiceNumber}
• Consultant / Issuer: ${consultantName}
• Service Period: ${servicePeriod}
• Total Balance Due: ${invoice.currency || 'USD'} ${invoice.total}
• Payment Due: ${invoice.dueDate || '15th of the month'}

Secure Access Link:
${shareUrl}

Security Access PIN:
${pin}

For security purposes, sensitive wire transfer routing and banking instructions are encrypted behind this access code in accordance with security protocols.

Please confirm receipt. Thank you!

Best regards,
${consultantName}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    onTriggerToast('Secure link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    onTriggerToast('Access PIN copied to clipboard!');
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleCopyEmailDraft = () => {
    navigator.clipboard.writeText(emailBody);
    setCopiedEmailDraft(true);
    onTriggerToast('Complete email draft copied to clipboard!');
    setTimeout(() => setCopiedEmailDraft(false), 2000);
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?cc=${encodeURIComponent(ccEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleOpenRecipientView = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <div style={{
            background: 'var(--primary-100)',
            color: 'var(--primary-700)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} />
          </div>
          <h2 style={{ fontSize: '1.35rem' }}>Share Secure Invoice Link</h2>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          This link allows <strong>{toEmail}</strong> and <strong>{ccEmail}</strong> to view and download your invoice.
          Sensitive wire transfer details remain encrypted until they enter the access PIN.
        </p>

        {/* Secure Link Field */}
        <div className="form-group">
          <label className="form-label">SECURE INVOICE URL</label>
          <div className="copy-input-box">
            <Link size={16} color="var(--text-muted)" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span className="copy-input-text">{shareUrl}</span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleCopyLink}
              style={{ marginLeft: '0.5rem', flexShrink: 0 }}
            >
              {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Security Access Code / PIN */}
        <div className="form-group">
          <label className="form-label">REQUIRED SECURITY ACCESS PIN</label>
          <div className="copy-input-box" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            <Key size={16} color="#059669" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <span className="copy-input-text" style={{ fontWeight: '700', fontSize: '1.1rem', color: '#065f46', letterSpacing: '0.15em' }}>
              {pin}
            </span>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={handleCopyPin}
              style={{ marginLeft: '0.5rem', flexShrink: 0 }}
            >
              {copiedPin ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Provide this PIN to the recipient in your email so they can unlock the invoice.
          </div>
        </div>

        {/* Blukers Email Composition Section */}
        <div style={{
          marginTop: '1.25rem',
          padding: '1rem',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--slate-50)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Pre-Composed Blukers Email
            </span>
            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
              To: {toEmail} • CC: {ccEmail}
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.8rem',
            lineHeight: '1.5',
            color: 'var(--text-main)',
            maxHeight: '130px',
            overflowY: 'auto',
            background: 'var(--bg-card)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            whiteSpace: 'pre-wrap'
          }}>
            {emailBody}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <button 
              type="button" 
              className="btn btn-qb btn-sm flex-1 justify-center flex items-center gap-1.5"
              onClick={handleOpenMailto}
            >
              <Send size={14} />
              <span>Send via Email Client</span>
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm flex-1 justify-center flex items-center gap-1.5"
              onClick={handleCopyEmailDraft}
            >
              {copiedEmailDraft ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedEmailDraft ? 'Copied' : 'Copy Email Text'}</span>
            </button>
          </div>
        </div>

        {/* Test Recipient View Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-2.5 mt-5">
          <button 
            type="button" 
            className="btn btn-secondary w-full sm:w-auto justify-center flex items-center gap-2"
            onClick={handleOpenRecipientView}
          >
            <ExternalLink size={16} />
            <span>Open & Test Recipient View</span>
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary w-full sm:w-auto justify-center"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
