import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Share2, 
  Copy, 
  Trash2, 
  Plus, 
  Search, 
  ChevronRight,
  Filter,
  X
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

      const invStatus = inv.status || 'draft';
      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'partial') {
        matchesStatus = invStatus === 'partially_paid' || (parseFloat(inv.amount_paid || 0) > 0 && parseFloat(inv.balance_due || 0) > 0);
      } else {
        matchesStatus = invStatus === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
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

      {/* Material 3 Toolbar: Outlined Search & Material Filter Chips */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            className="form-input pl-9 pr-8 text-xs sm:text-sm" 
            placeholder="Search by invoice #, client, or period..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setSearchTerm('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Material Filter Chips */}
        <div className="material-filter-chips">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'draft', label: 'Draft' },
            { id: 'sent', label: 'Sent' },
            { id: 'partial', label: 'Partially Paid' },
            { id: 'paid', label: 'Paid' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`material-chip-btn ${statusFilter === item.id ? 'active' : ''}`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Content */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <FileText size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No Invoices Found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchTerm ? 'No invoices match your current search query.' : 'Create your first monthly invoice to get started.'}
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={onNewInvoice}>
            Create Invoice
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Material Data Table */}
          <div className="hidden md:block md-table-wrap">
            <table className="md-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Service Period</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Balance Due</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const status = inv.status || 'draft';
                  const balanceDue = inv.balance_due !== undefined && inv.balance_due !== null
                    ? parseFloat(inv.balance_due)
                    : (parseFloat(inv.total) - parseFloat(inv.amount_paid || 0));

                  return (
                    <tr 
                      key={inv.id} 
                      className="cursor-pointer"
                      onClick={() => onSelectInvoice(inv)}
                    >
                      <td className="font-mono font-semibold text-xs text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="font-medium text-slate-900 dark:text-white">
                        {inv.client?.companyName || 'Client'}
                      </td>
                      <td className="text-xs text-slate-500 dark:text-slate-400">
                        {inv.servicePeriod || '—'}
                      </td>
                      <td className="text-xs text-slate-500 dark:text-slate-400">
                        {inv.dueDate || '15th'}
                      </td>
                      <td>
                        <span className={`status-chip ${status === 'partially_paid' ? 'sent' : status}`}>
                          {status === 'partially_paid' ? 'Partial' : status}
                        </span>
                      </td>
                      <td className="text-right font-medium tabular-nums text-xs text-slate-500">
                        {formatMoney(inv.total)}
                      </td>
                      <td className="text-right font-semibold tabular-nums text-xs text-slate-900 dark:text-white">
                        {balanceDue <= 0.005 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">$0.00</span>
                        ) : (
                          <span className="font-mono">{formatMoney(balanceDue)}</span>
                        )}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => onShareInvoice(inv)}
                            title="Share invoice link"
                          >
                            <Share2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => onDuplicateInvoice(inv)}
                            title="Duplicate invoice"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-2.5">
            {filtered.map((inv) => {
              const status = inv.status || 'draft';
              return (
                <div 
                  key={inv.id}
                  className="card p-4 space-y-3 cursor-pointer"
                  onClick={() => onSelectInvoice(inv)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {inv.client?.companyName || 'Client'}
                        </span>
                        <span className={`status-chip ${status}`}>
                          {status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {inv.invoiceNumber}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                        {formatMoney(inv.total)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Due {inv.dueDate || '15th'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <span>{inv.servicePeriod || 'Monthly Consulting'}</span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        onClick={() => onShareInvoice(inv)}
                        title="Share link"
                      >
                        <Share2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        onClick={() => onDuplicateInvoice(inv)}
                        title="Duplicate"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => onDeleteInvoice(inv.id)}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
