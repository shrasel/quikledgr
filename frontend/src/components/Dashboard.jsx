import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send, 
  Plus, 
  Layers,
  ChevronRight,
  TrendingUp,
  Share2,
  ArrowUpRight
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

  // Percentages for Material linear progress indicator
  const paidPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const pendingPercent = totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Welcome back, {user?.name || 'Consultant'}. Financial summary and recent activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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

      {/* Material 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invoiced */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Billed</span>
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <FileText size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatMoney(totalAmount)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Across {totalCount} total agreement records
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Total Invoices</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span>
          </div>
        </div>

        {/* Card 2: Settled / Paid */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Settled & Collected</span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatMoney(paidAmount)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {paidCount} paid and cleared
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Settlement Rate</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{paidPercent.toFixed(0)}%</span>
          </div>
        </div>

        {/* Card 3: Outstanding A/R */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Outstanding A/R</span>
            <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatMoney(pendingAmount)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {pendingCount} open receivables
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Sent to Client</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{sentCount}</span>
          </div>
        </div>

        {/* Card 4: Drafts */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Unissued Drafts</span>
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Send size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {formatMoney(draftAmount)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {draftCount} ready to finalize
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Quick Action</span>
            <button 
              type="button"
              onClick={() => onNavigateToTab('editor')}
              className="text-xs font-medium text-slate-900 dark:text-white hover:underline flex items-center gap-0.5"
            >
              <span>Edit Draft</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Material Progress Pipeline */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-2.5">
          <span>Settlement Progress</span>
          <span className="tabular-nums font-semibold text-slate-900 dark:text-white">
            {paidPercent.toFixed(0)}% Collected
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div 
            style={{ width: `${paidPercent}%` }} 
            className="h-full bg-slate-800 dark:bg-slate-200 transition-all duration-500" 
            title={`Paid: ${paidPercent.toFixed(1)}%`}
          />
          <div 
            style={{ width: `${pendingPercent}%` }} 
            className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-500" 
            title={`Pending: ${pendingPercent.toFixed(1)}%`}
          />
        </div>
        <div className="flex items-center gap-5 mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-200" />
            <span>Paid: {formatMoney(paidAmount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Outstanding: {formatMoney(pendingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Recent Invoices
          </h2>
          <button 
            type="button" 
            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
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
          <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {invoices.slice(0, 6).map((inv) => {
              const status = inv.status || 'draft';
              return (
                <div 
                  key={inv.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => onSelectInvoice(inv)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                      {(inv.client?.companyName || 'C')[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                          {inv.client?.companyName || 'Client'}
                        </span>
                        <span className={`status-chip ${status}`}>
                          {status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                        <span className="font-mono">{inv.invoiceNumber}</span>
                        {inv.servicePeriod && <span>• {inv.servicePeriod}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white tabular-nums">
                        {formatMoney(inv.total)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Due {inv.dueDate || '15th'}
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
