import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send, 
  FileEdit, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Calendar,
  Layers,
  Share2
} from 'lucide-react';
import { formatMoney } from '../utils/invoiceSchema';

export function Dashboard({ 
  user, 
  invoices, 
  onNavigateToTab, 
  onSelectInvoice, 
  onNewInvoice, 
  onShareInvoice 
}) {
  // Aggregate metrics
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Paid
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const paidCount = paidInvoices.length;
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Pending (any invoice not yet marked paid, e.g. sent or draft with due date)
  const pendingInvoices = invoices.filter(inv => inv.status !== 'paid');
  const pendingCount = pendingInvoices.length;
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Sent to client
  const sentInvoices = invoices.filter(inv => inv.status === 'sent');
  const sentCount = sentInvoices.length;
  const sentAmount = sentInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Not Sent / Drafts
  const notSentInvoices = invoices.filter(inv => !inv.status || inv.status === 'draft');
  const notSentCount = notSentInvoices.length;
  const notSentAmount = notSentInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Proportional percentages for the visual pipeline bar
  const paidPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const sentPercent = totalAmount > 0 ? (sentAmount / totalAmount) * 100 : 0;
  const notSentPercent = totalAmount > 0 ? (notSentAmount / totalAmount) * 100 : 0;

  return (
    <div className="dashboard-wrapper">
      {/* Welcome Banner */}
      <div className="dashboard-hero-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-7">
        <div className="dashboard-hero-left">
          <div className="dashboard-hero-badge">
            <ShieldCheck size={14} color="#059669" />
            <span>Consulting Agreement Invoicing Portal</span>
          </div>
          <h1 className="dashboard-hero-title text-xl sm:text-2xl md:text-3xl">
            Welcome back, {user?.name || 'Consultant'}
          </h1>
          <p className="dashboard-hero-subtitle text-xs sm:text-sm">
            Track and manage your monthly consulting invoices, payment statuses, and secure wire transfer links.
          </p>
        </div>

        <div className="dashboard-hero-actions w-full sm:w-auto mt-2 sm:mt-0">
          <button 
            type="button" 
            className="btn btn-primary btn-lg w-full sm:w-auto justify-center"
            onClick={onNewInvoice}
          >
            <Plus size={18} />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Invoice Status Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Live status metrics across all submitted and draft consulting agreements.
          </p>
        </div>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm self-start sm:self-auto flex items-center gap-1.5"
          onClick={() => onNavigateToTab('list')}
        >
          <Layers size={14} />
          <span>View All Invoices</span>
        </button>
      </div>

      {/* Main 5 Status Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* 1. TOTAL INVOICES */}
        <div 
          className="metric-card metric-total col-span-2 sm:col-span-1"
          onClick={() => onNavigateToTab('list')}
          title="Click to view all invoices"
        >
          <div className="metric-header">
            <span className="metric-label">TOTAL INVOICES</span>
            <div className="metric-icon-wrap icon-total">
              <FileText size={18} />
            </div>
          </div>
          <div className="metric-number-row">
            <span className="metric-count">{totalCount}</span>
            <span className="metric-count-unit">Invoices</span>
          </div>
          <div className="metric-amount font-mono">
            {formatMoney(totalAmount)}
          </div>
          <div className="metric-footer">
            <span className="truncate">All generated invoices</span>
            <ArrowRight size={14} className="shrink-0" />
          </div>
        </div>

        {/* 2. PAID INVOICES */}
        <div 
          className="metric-card metric-paid"
          onClick={() => onNavigateToTab('list')}
          title="Click to view paid invoices"
        >
          <div className="metric-header">
            <span className="metric-label">PAID</span>
            <div className="metric-icon-wrap icon-paid">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="metric-number-row">
            <span className="metric-count text-emerald-600 dark:text-emerald-400">{paidCount}</span>
            <span className="metric-count-unit">Invoices</span>
          </div>
          <div className="metric-amount font-mono text-emerald-600 dark:text-emerald-400">
            {formatMoney(paidAmount)}
          </div>
          <div className="metric-footer">
            <span className="status-pill status-paid text-xs">Wire Received</span>
            <ArrowRight size={14} className="shrink-0" />
          </div>
        </div>

        {/* 3. PENDING INVOICES */}
        <div 
          className="metric-card metric-pending"
          onClick={() => onNavigateToTab('list')}
          title="Click to view pending invoices"
        >
          <div className="metric-header">
            <span className="metric-label">PENDING / DUE</span>
            <div className="metric-icon-wrap icon-pending">
              <Clock size={18} />
            </div>
          </div>
          <div className="metric-number-row">
            <span className="metric-count text-amber-600 dark:text-amber-400">{pendingCount}</span>
            <span className="metric-count-unit">Invoices</span>
          </div>
          <div className="metric-amount font-mono text-amber-600 dark:text-amber-400">
            {formatMoney(pendingAmount)}
          </div>
          <div className="metric-footer">
            <span className="status-pill status-pending text-xs">Awaiting Payment</span>
            <ArrowRight size={14} className="shrink-0" />
          </div>
        </div>

        {/* 4. SENT INVOICES */}
        <div 
          className="metric-card metric-sent"
          onClick={() => onNavigateToTab('list')}
          title="Click to view sent invoices"
        >
          <div className="metric-header">
            <span className="metric-label">SENT</span>
            <div className="metric-icon-wrap icon-sent">
              <Send size={18} />
            </div>
          </div>
          <div className="metric-number-row">
            <span className="metric-count text-blue-600 dark:text-blue-400">{sentCount}</span>
            <span className="metric-count-unit">Invoices</span>
          </div>
          <div className="metric-amount font-mono text-blue-600 dark:text-blue-400">
            {formatMoney(sentAmount)}
          </div>
          <div className="metric-footer">
            <span className="status-pill status-sent text-xs">Delivered via Link</span>
            <ArrowRight size={14} className="shrink-0" />
          </div>
        </div>

        {/* 5. NOT SENT / DRAFT INVOICES */}
        <div 
          className="metric-card metric-draft"
          onClick={() => onNavigateToTab('list')}
          title="Click to view drafts"
        >
          <div className="metric-header">
            <span className="metric-label">DRAFTS</span>
            <div className="metric-icon-wrap icon-draft">
              <FileEdit size={18} />
            </div>
          </div>
          <div className="metric-number-row">
            <span className="metric-count text-slate-500 dark:text-slate-400">{notSentCount}</span>
            <span className="metric-count-unit">Invoices</span>
          </div>
          <div className="metric-amount font-mono text-slate-500 dark:text-slate-400">
            {formatMoney(notSentAmount)}
          </div>
          <div className="metric-footer">
            <span className="status-pill status-draft text-xs">Ready to Send</span>
            <ArrowRight size={14} className="shrink-0" />
          </div>
        </div>
      </div>

      {/* Visual Revenue Pipeline Progress Bar */}
      <div className="card mt-4 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            Invoice Value Distribution
          </div>
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Total Pipeline: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatMoney(totalAmount)}</strong>
          </div>
        </div>

        <div className="pipeline-bar-track">
          <div 
            className="pipeline-segment segment-paid" 
            style={{ width: `${paidPercent}%` }} 
            title={`Paid: ${formatMoney(paidAmount)} (${paidPercent.toFixed(1)}%)`}
          />
          <div 
            className="pipeline-segment segment-sent" 
            style={{ width: `${sentPercent}%` }} 
            title={`Sent: ${formatMoney(sentAmount)} (${sentPercent.toFixed(1)}%)`}
          />
          <div 
            className="pipeline-segment segment-draft" 
            style={{ width: `${notSentPercent}%` }} 
            title={`Drafts (Not Sent): ${formatMoney(notSentAmount)} (${notSentPercent.toFixed(1)}%)`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="legend-dot dot-paid shrink-0" />
            <span>Paid ({paidCount}) • {formatMoney(paidAmount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="legend-dot dot-sent shrink-0" />
            <span>Sent ({sentCount}) • {formatMoney(sentAmount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="legend-dot dot-draft shrink-0" />
            <span>Not Sent ({notSentCount}) • {formatMoney(notSentAmount)}</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Quick-Access Section */}
      <div className="card mt-4 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Recent Invoices</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quickly preview, edit, or copy secure links for your latest invoices.
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm flex items-center gap-1"
            onClick={() => onNavigateToTab('list')}
          >
            <span>View All ({totalCount})</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Desktop View: Table (Visible on md:768px and up) */}
        <div className="hidden md:block items-table-wrapper" style={{ margin: 0 }}>
          <table className="items-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Service Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Access PIN</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 4).map(inv => (
                <tr key={inv.id}>
                  <td>
                    <span 
                      style={{ fontWeight: 700, color: 'var(--qb-blue)', cursor: 'pointer' }}
                      onClick={() => onSelectInvoice(inv)}
                    >
                      {inv.invoiceNumber || inv.id}
                    </span>
                  </td>
                  <td>{inv.client?.companyName || 'Blukers, Inc.'}</td>
                  <td>{inv.servicePeriod || '—'}</td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>
                    {formatMoney(inv.total, inv.currency)}
                  </td>
                  <td>
                    <span className={`status-pill status-${inv.status || 'draft'}`}>
                      {inv.status === 'paid' ? 'Paid' : inv.status === 'sent' ? 'Sent' : 'Draft / Not Sent'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-800)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}>
                      {inv.security?.accessPin || '—'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectInvoice(inv)}
                      >
                        Edit
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm"
                        onClick={() => onShareInvoice(inv)}
                      >
                        <Share2 size={13} />
                        <span>Share</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Interactive Cards (Visible on mobile screens < 768px) */}
        <div className="md:hidden space-y-3">
          {invoices.slice(0, 4).map(inv => (
            <div 
              key={inv.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="font-bold text-sm text-blue-600 dark:text-blue-400 cursor-pointer"
                  onClick={() => onSelectInvoice(inv)}
                >
                  {inv.invoiceNumber || inv.id}
                </span>
                <span className={`status-pill status-${inv.status || 'draft'} text-xs`}>
                  {inv.status === 'paid' ? 'Paid' : inv.status === 'sent' ? 'Sent' : 'Draft'}
                </span>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1">
                {inv.client?.companyName || 'Blukers, Inc.'}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                Period: {inv.servicePeriod || '—'}
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {formatMoney(inv.total, inv.currency)}
                  </span>
                  {inv.security?.accessPin && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold" title="Access PIN">
                      PIN: {inv.security.accessPin}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm py-1 px-2.5 text-xs"
                    onClick={() => onSelectInvoice(inv)}
                  >
                    Edit
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm py-1 px-2.5 text-xs flex items-center gap-1"
                    onClick={() => onShareInvoice(inv)}
                  >
                    <Share2 size={12} />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

