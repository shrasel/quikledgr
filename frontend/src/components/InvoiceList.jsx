import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Share2, 
  Eye, 
  Copy, 
  Trash2, 
  Plus, 
  Search, 
  ChevronRight,
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

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.client?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.servicePeriod || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || (inv.status || 'draft') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, duplicate, and share consulting agreements and recipient links.
          </p>
        </div>

        <button 
          type="button"
          className="btn btn-primary btn-sm self-start sm:self-auto flex items-center gap-1.5"
          onClick={onNewInvoice}
        >
          <Plus size={15} />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Filter & Search Toolbar (Apple Segmented Style) */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            className="form-input pl-9 text-xs sm:text-sm" 
            placeholder="Search invoice #, client, period..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          {['all', 'draft', 'sent', 'paid'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Content */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <FileText size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No Invoices Found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchTerm ? 'No invoices match your current search criteria.' : 'Create your first monthly invoice to get started.'}
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={onNewInvoice}>
            Create Invoice
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block apple-table-wrap">
            <table className="apple-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Service Period</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const status = inv.status || 'draft';
                  return (
                    <tr 
                      key={inv.id} 
                      className="cursor-pointer"
                      onClick={() => onSelectInvoice(inv)}
                    >
                      <td className="font-mono font-bold text-xs">
                        {inv.invoiceNumber}
                      </td>
                      <td className="font-medium">
                        {inv.client?.companyName || 'Blukers, Inc.'}
                      </td>
                      <td className="text-xs text-slate-500 dark:text-slate-400">
                        {inv.servicePeriod || '—'}
                      </td>
                      <td className="text-xs text-slate-500 dark:text-slate-400">
                        {inv.dueDate || '15th'}
                      </td>
                      <td>
                        <span className={`status-chip ${status}`}>
                          {status}
                        </span>
                      </td>
                      <td className="text-right font-bold tabular-nums text-sm">
                        {formatMoney(inv.total)}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => onShareInvoice(inv)}
                            title="Share invoice link"
                          >
                            <Share2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => onDuplicateInvoice(inv)}
                            title="Duplicate invoice"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => onDeleteInvoice(inv.id)}
                            title="Delete invoice"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Grouped Cards View */}
          <div className="md:hidden space-y-3">
            {filtered.map((inv) => {
              const status = inv.status || 'draft';
              return (
                <div
                  key={inv.id}
                  className="card p-4 space-y-3"
                  onClick={() => onSelectInvoice(inv)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {inv.client?.companyName || 'Client'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {inv.invoiceNumber}
                      </div>
                    </div>

                    <span className={`status-chip ${status}`}>
                      {status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">
                      Due: {inv.dueDate || '15th'}
                    </span>
                    <span className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                      {formatMoney(inv.total)}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm flex items-center gap-1 text-xs"
                      onClick={() => onShareInvoice(inv)}
                    >
                      <Share2 size={13} />
                      <span>Share</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm flex items-center gap-1 text-xs"
                      onClick={() => onDuplicateInvoice(inv)}
                    >
                      <Copy size={13} />
                      <span>Copy</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm text-xs p-1.5"
                      onClick={() => onDeleteInvoice(inv.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
