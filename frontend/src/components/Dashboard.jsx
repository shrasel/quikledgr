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
      <div className="dashboard-hero-card">
        <div className="dashboard-hero-left">
          <div className="dashboard-hero-badge">
            <ShieldCheck size={14} color="#059669" />
            <span>Consulting Agreement Invoicing Portal</span>
          </div>
          <h1 className="dashboard-hero-title">
            Welcome back, {user?.name || 'Consultant'}
          </h1>
          <p className="dashboard-hero-subtitle">
            Track and manage your monthly consulting invoices, payment statuses, and secure wire transfer links.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-lg"
            onClick={onNewInvoice}
          >
            <Plus size={18} />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Invoice Status Overview</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Live status metrics across all submitted and draft consulting agreements.
          </p>
        </div>
        <button 
          type="button" 
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigateToTab('list')}
        >
          <Layers size={14} />
          <span>View All Invoices</span>
        </button>
      </div>

      {/* Main 5 Status Cards Grid */}
      <div className="metrics-grid-5">
        {/* 1. TOTAL INVOICES */}
        <div 
          className="metric-card metric-total"
          onClick={() => onNavigateToTab('list')}
          title="Click to view all invoices"
        >
          <div className="metric-header">
            <span className="metric-label">TOTAL INVOICES</span>
            <div className="metric-icon-wrap icon-total">
              <FileText size={20} />
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
            <span>All generated invoices</span>
            <ArrowRight size={14} />
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
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-number-row">
            <span className="metric-count" style={{ color: '#059669' }}>{paidCount}</span>
            <span className="metric-count-unit">Invoices</span>
          </div>
          <div className="metric-amount font-mono" style={{ color: '#059669' }}>
            {formatMoney(paidAmount)}
          </div>
          <div className="metric-footer">
            <span className="status-pill status-paid">Wire Received</span>
            <ArrowRight size={14} />
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
              <Clock size={20} />
            </div>
          </div>
          <div className="metric-number-row">
            <span className="metric-count" style={{ color: '#d97706' }}>{pendingCount}</span>
            <span className="metric-count-unit">Invoices</span>
          </div>
          <div className="metric-amount font-mono" style={{ color: '#d97706' }}>
            {formatMoney(pendingAmount)}
          </div>
          <div className="metric-footer">
            <span className="status-pill status-pending">Awaiting Payment</span>
            <ArrowRight size={14} />
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
              <Send size={20} />
            </div>
          </div>
          <div className="metric-number-row">
            <span className="metric-count" style={{ color: '#2563eb' }}>{sentCount}</span>
            <span className="metric-count-unit">Invoices</span>
          </div>
          <div className="metric-amount font-mono" style={{ color: '#2563eb' }}>
            {formatMoney(sentAmount)}
          </div>
          <div className="metric-footer">
            <span className="status-pill status-sent">Delivered via Link</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* 5. NOT SENT / DRAFT INVOICES */}
        <div 
          className="metric-card metric-draft"
          onClick={() => onNavigateToTab('list')}
          title="Click to view drafts"
        >
          <div className="metric-header">
            <span className="metric-label">NOT SENT (DRAFTS)</span>
            <div className="metric-icon-wrap icon-draft">
              <FileEdit size={20} />
            </div>
          </div>
          <div className="metric-number-row">
            <span className="metric-count" style={{ color: '#64748b' }}>{notSentCount}</span>
            <span className="metric-count-unit">Invoices</span>
          </div>
          <div className="metric-amount font-mono" style={{ color: '#64748b' }}>
            {formatMoney(notSentAmount)}
          </div>
          <div className="metric-footer">
            <span className="status-pill status-draft">Ready to Send</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Visual Revenue Pipeline Progress Bar */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Invoice Value Distribution
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total Pipeline: <strong className="font-mono">{formatMoney(totalAmount)}</strong>
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

        <div className="pipeline-legend">
          <div className="legend-item">
            <span className="legend-dot dot-paid" />
            <span>Paid ({paidCount}) • {formatMoney(paidAmount)}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-sent" />
            <span>Sent ({sentCount}) • {formatMoney(sentAmount)}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-draft" />
            <span>Not Sent ({notSentCount}) • {formatMoney(notSentAmount)}</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Quick-Access Table */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Invoices</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Quickly preview, edit, or copy secure links for your latest invoices.
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateToTab('list')}
          >
            <span>View All ({totalCount})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="items-table-wrapper" style={{ margin: 0 }}>
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
      </div>
    </div>
  );
}
