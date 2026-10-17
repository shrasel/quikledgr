import React, { useState } from 'react';
import { 
  FileText, 
  Share2, 
  Eye, 
  Copy, 
  Trash2, 
  Edit, 
  Plus, 
  Key, 
  CheckCircle,
  Clock,
  Search,
  ExternalLink
} from 'lucide-react';
import { formatMoney } from '../utils/invoiceSchema';

export function InvoiceList({ 
  invoices, 
  onSelectInvoice, 
  onShareInvoice, 
  onDeleteInvoice, 
  onDuplicateInvoice,
  onNewInvoice,
  onTriggerToast 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = invoices.filter(inv => {
    const matchesSearch = 
      (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.client?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.servicePeriod || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Invoices Management
          </h2>
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track and manage your submitted consulting invoices and access codes.
          </div>
        </div>

        <button 
          className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto" 
          onClick={onNewInvoice}
        >
          <Plus size={16} />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            className="form-input pl-9 text-xs sm:text-sm" 
            placeholder="Search by invoice #, client, or service period..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-48">
          <select 
            className="form-select text-xs sm:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent to Client</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <FileText size={40} style={{ margin: '0 auto 0.75rem auto', color: 'var(--slate-400)' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>No invoices found</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {searchTerm ? 'Try adjusting your search criteria.' : 'Create your first monthly invoice to get started.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={onNewInvoice}>
            Create Monthly Invoice
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile < 768px) */}
          <div className="hidden md:block items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Invoice # & Client</th>
                  <th>Service Period</th>
                  <th>Due Date</th>
                  <th>Total Amount</th>
                  <th>Security PIN</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <div 
                        style={{ fontWeight: 700, color: 'var(--qb-blue)', cursor: 'pointer' }}
                        onClick={() => onSelectInvoice(inv)}
                      >
                        {inv.invoiceNumber || inv.id}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {inv.client?.companyName || 'Blukers, Inc.'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{inv.servicePeriod || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                        {inv.dueDate || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {formatMoney(inv.total, inv.currency)}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--primary-100)',
                        color: 'var(--primary-800)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        letterSpacing: '0.08em'
                      }}>
                        {inv.security?.accessPin || 'None'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: inv.status === 'paid' ? '#dcfce7' : inv.status === 'sent' ? '#e0e7ff' : '#f1f5f9',
                        color: inv.status === 'paid' ? '#166534' : inv.status === 'sent' ? '#3730a3' : '#475569'
                      }}>
                        {inv.status || 'draft'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm btn-icon-only"
                          onClick={() => onSelectInvoice(inv)}
                          title="Edit Invoice"
                        >
                          <Edit size={14} />
                        </button>

                        <button 
                          type="button"
                          className="btn btn-primary btn-sm btn-icon-only"
                          onClick={() => onShareInvoice(inv)}
                          title="Share Secure Link"
                        >
                          <Share2 size={14} />
                        </button>

                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm btn-icon-only"
                          onClick={() => onDuplicateInvoice(inv)}
                          title="Duplicate for Next Month"
                        >
                          <Copy size={14} />
                        </button>

                        <button 
                          type="button"
                          className="btn btn-danger btn-sm btn-icon-only"
                          onClick={() => onDeleteInvoice(inv.id)}
                          title="Delete Invoice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (Visible on mobile < 768px) */}
          <div className="md:hidden space-y-3">
            {filtered.map(inv => (
              <div 
                key={inv.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span 
                    className="font-bold text-sm text-blue-600 dark:text-blue-400 cursor-pointer"
                    onClick={() => onSelectInvoice(inv)}
                  >
                    {inv.invoiceNumber || inv.id}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: inv.status === 'paid' ? '#dcfce7' : inv.status === 'sent' ? '#e0e7ff' : '#f1f5f9',
                    color: inv.status === 'paid' ? '#166534' : inv.status === 'sent' ? '#3730a3' : '#475569'
                  }}>
                    {inv.status || 'draft'}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {inv.client?.companyName || 'Blukers, Inc.'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Period: {inv.servicePeriod || '—'} {inv.dueDate ? `• Due ${inv.dueDate}` : ''}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {formatMoney(inv.total, inv.currency)}
                    </span>
                    {inv.security?.accessPin && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold" title="Security PIN">
                        PIN: {inv.security.accessPin}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      type="button" 
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      onClick={() => onSelectInvoice(inv)}
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      type="button" 
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => onShareInvoice(inv)}
                      title="Share"
                    >
                      <Share2 size={14} />
                    </button>
                    <button 
                      type="button" 
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      onClick={() => onDuplicateInvoice(inv)}
                      title="Duplicate"
                    >
                      <Copy size={14} />
                    </button>
                    <button 
                      type="button" 
                      className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600"
                      onClick={() => onDeleteInvoice(inv.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
