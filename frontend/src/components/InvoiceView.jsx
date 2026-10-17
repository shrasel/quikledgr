import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  ShieldCheck, 
  ArrowLeft, 
  Mail, 
  CheckCircle, 
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
          <button 
            type="button" 
            className="btn btn-primary btn-sm flex-1 sm:flex-initial justify-center flex items-center gap-1.5"
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
    </div>
  );
}
