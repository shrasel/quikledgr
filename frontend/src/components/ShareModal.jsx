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
    <div className="apple-modal-overlay" onClick={onClose}>
      <div className="apple-modal-content p-6 space-y-4 max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Share Invoice Link
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          This secure link allows <strong>{toEmail}</strong> to view and download your invoice. Banking details remain encrypted behind the access PIN.
        </p>

        {/* Secure Link Field */}
        <div className="space-y-1">
          <label className="form-label">
            SECURE LINK URL
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Link size={14} className="text-slate-400 shrink-0 ml-1" />
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate flex-1">
              {shareUrl}
            </span>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm shrink-0"
              onClick={handleCopyLink}
            >
              {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Security Access Code / PIN */}
        <div className="space-y-1">
          <label className="form-label">
            SECURITY ACCESS PIN
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Key size={14} className="text-slate-400 shrink-0 ml-1" />
            <span className="font-mono font-bold text-base tracking-widest text-slate-900 dark:text-white flex-1">
              {pin}
            </span>
            <button 
              type="button" 
              className="btn btn-primary btn-sm shrink-0"
              onClick={handleCopyPin}
            >
              {copiedPin ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
            </button>
          </div>
        </div>

        {/* Email Draft Preview */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              Pre-Composed Recipient Email
            </span>
            <span className="text-[11px] text-slate-400">
              To: {toEmail}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
            {emailBody}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button 
              type="button"
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
              onClick={handleCopyEmailDraft}
            >
              {copiedEmailDraft ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedEmailDraft ? 'Copied' : 'Copy Email'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs"
                onClick={handleOpenRecipientView}
              >
                <ExternalLink size={13} />
                <span>Test View</span>
              </button>

              <button 
                type="button"
                className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
                onClick={handleOpenMailto}
              >
                <Mail size={13} />
                <span>Open in Mail</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
