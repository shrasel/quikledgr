import React from 'react';
import { 
  FileText, 
  Check, 
  Clock, 
  Send, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Layers,
  ChevronRight,
  TrendingUp,
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

  // Pending
  const pendingInvoices = invoices.filter(inv => inv.status !== 'paid');
  const pendingCount = pendingInvoices.length;
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Sent to client
  const sentInvoices = invoices.filter(inv => inv.status === 'sent');
  const sentCount = sentInvoices.length;
  const sentAmount = sentInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Drafts
  const draftInvoices = invoices.filter(inv => !inv.status || inv.status === 'draft');
  const draftCount = draftInvoices.length;
  const draftAmount = draftInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Percentages for subtle Apple progress bar
  const paidPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const pendingPercent = totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Apple Minimalist Hero Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Welcome back, {user?.name || 'Consultant'}. Monthly consulting summary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateToTab('list')}
          >
            <Layers size={14} />
            <span>All Invoices</span>
          </button>

          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={onNewInvoice}
          >
            <Plus size={14} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Apple Bento-Grid: 4 Understated Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Volume */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Volume</span>
            <FileText size={16} />
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatMoney(totalAmount)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Across {totalCount} total agreement {totalCount === 1 ? 'record' : 'records'}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Historical Invoices</span>
            <span className="font-semibold">{totalCount}</span>
          </div>
        </div>

        {/* Card 2: Paid & Cleared */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled & Paid</span>
            <Check size={16} className="text-slate-900 dark:text-white" />
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatMoney(paidAmount)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {paidCount} {paidCount === 1 ? 'payment' : 'payments'} deposited
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Settlement Rate</span>
            <span className="font-semibold tabular-nums">{paidPercent.toFixed(0)}%</span>
          </div>
        </div>

        {/* Card 3: Pending A/R */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding A/R</span>
            <Clock size={16} />
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatMoney(pendingAmount)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {pendingCount} open {pendingCount === 1 ? 'invoice' : 'invoices'}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Sent to Client</span>
            <span className="font-semibold">{sentCount}</span>
          </div>
        </div>

        {/* Card 4: Drafts & In-Progress */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Unissued Drafts</span>
            <Send size={16} />
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatMoney(draftAmount)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {draftCount} ready to issue
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Quick Action</span>
            <button 
              type="button"
              onClick={() => onNavigateToTab('editor')}
              className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-0.5"
            >
              <span>Edit Draft</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Apple Progress Pipeline */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
          <span>Settlement Allocation</span>
          <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">
            {paidPercent.toFixed(0)}% Collected
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div 
            style={{ width: `${paidPercent}%` }} 
            className="h-full bg-slate-900 dark:bg-white transition-all duration-500" 
            title={`Paid: ${paidPercent.toFixed(1)}%`}
          />
          <div 
            style={{ width: `${pendingPercent}%` }} 
            className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-500" 
            title={`Pending: ${pendingPercent.toFixed(1)}%`}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
            <span>Paid ({formatMoney(paidAmount)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Pending ({formatMoney(pendingAmount)})</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices: Apple Grouped Inset Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Recent Invoices
          </h2>
          <button 
            type="button" 
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
            onClick={() => onNavigateToTab('list')}
          >
            <span>View All</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {invoices.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">
            <FileText size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Invoices Yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Create your first monthly consulting agreement invoice to begin tracking.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={onNewInvoice}>
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
            {invoices.slice(0, 6).map((inv) => {
              const status = inv.status || 'draft';
              return (
                <div 
                  key={inv.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => onSelectInvoice(inv)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                      {(inv.client?.companyName || 'B')[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {inv.client?.companyName || 'Client'}
                        </span>
                        <span className={`status-chip ${status}`}>
                          {status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                        <span className="font-mono">{inv.invoiceNumber}</span>
                        {inv.servicePeriod && <span>• {inv.servicePeriod}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                        {formatMoney(inv.total)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Due {inv.dueDate || '15th'}
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareInvoice(inv);
                      }}
                      title="Share link"
                    >
                      <Share2 size={15} />
                    </button>

                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
