import React, { useState } from 'react';
import { 
  FileText, 
  DollarSign, 
  Clock, 
  Repeat, 
  ArrowUpRight, 
  Plus, 
  ChevronRight, 
  Share2, 
  Eye, 
  CreditCard, 
  CheckCircle2, 
  TrendingUp, 
  Layers,
  ArrowRight,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { formatMoney } from '../utils/invoiceSchema';

export function Dashboard({ 
  user, 
  invoices = [], 
  onNavigateToTab, 
  onSelectInvoice, 
  onNewInvoice, 
  onShareInvoice 
}) {
  const [chartTimeframe, setChartTimeframe] = useState('Month'); // 'Day', 'Week', 'Month'

  // Metric Computations
  const totalCount = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);

  // Total Collected (from amount_paid or full total if status === 'paid')
  const totalPaid = invoices.reduce((sum, inv) => {
    if (inv.amount_paid !== undefined && inv.amount_paid !== null) {
      return sum + parseFloat(inv.amount_paid || 0);
    }
    return inv.status === 'paid' ? sum + (parseFloat(inv.total) || 0) : sum;
  }, 0);

  // Total Balance Due
  const totalBalanceDue = invoices.reduce((sum, inv) => {
    if (inv.balance_due !== undefined && inv.balance_due !== null) {
      return sum + parseFloat(inv.balance_due || 0);
    }
    return inv.status !== 'paid' ? sum + (parseFloat(inv.total) || 0) : sum;
  }, 0);

  // Paid & Partial & Overdue counts
  const paidCount = invoices.filter(inv => inv.status === 'paid' || parseFloat(inv.balance_due || 0) <= 0.005).length;
  const partialCount = invoices.filter(inv => inv.status === 'partially_paid' || (parseFloat(inv.amount_paid || 0) > 0 && parseFloat(inv.balance_due || 0) > 0)).length;
  const overdueCount = invoices.filter(inv => {
    const isUnpaid = inv.status !== 'paid' && parseFloat(inv.balance_due !== null && inv.balance_due !== undefined ? inv.balance_due : inv.total) > 0;
    if (!isUnpaid || !inv.dueDate) return false;
    return new Date(inv.dueDate) < new Date();
  }).length;

  const realizationRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  // Monthly Velocity Data for Chart
  const monthlyData = [
    { month: 'May', billed: totalAmount * 0.45, collected: totalPaid * 0.40 },
    { month: 'Jun', billed: totalAmount * 0.60, collected: totalPaid * 0.55 },
    { month: 'Jul', billed: totalAmount * 0.70, collected: totalPaid * 0.68 },
    { month: 'Aug', billed: totalAmount * 0.85, collected: totalPaid * 0.75 },
    { month: 'Sep', billed: totalAmount * 0.90, collected: totalPaid * 0.82 },
    { month: 'Oct', billed: totalAmount, collected: totalPaid },
  ];

  const maxChartVal = Math.max(...monthlyData.map(d => Math.max(d.billed, d.collected)), 1000);

  // Recent 6 Invoices
  const recentInvoices = [...invoices].slice(0, 6);

  const getStatusBadge = (inv) => {
    const status = inv.status || 'draft';
    const balance = inv.balance_due !== undefined && inv.balance_due !== null ? parseFloat(inv.balance_due) : (parseFloat(inv.total) - parseFloat(inv.amount_paid || 0));

    if (balance <= 0.005 || status === 'paid') {
      return (
        <span className="inline-flex rounded-full bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-semibold text-[#10B981]">
          Paid
        </span>
      );
    }
    if (status === 'partially_paid' || parseFloat(inv.amount_paid || 0) > 0) {
      return (
        <span className="inline-flex rounded-full bg-[#F59E0B]/10 px-2.5 py-0.5 text-xs font-semibold text-[#F59E0B]">
          Partial
        </span>
      );
    }
    if (inv.dueDate && new Date(inv.dueDate) < new Date()) {
      return (
        <span className="inline-flex rounded-full bg-[#EF4444]/10 px-2.5 py-0.5 text-xs font-semibold text-[#EF4444]">
          Overdue
        </span>
      );
    }
    if (status === 'sent') {
      return (
        <span className="inline-flex rounded-full bg-[#3C50E0]/10 px-2.5 py-0.5 text-xs font-semibold text-[#3C50E0]">
          Sent
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full bg-[#64748B]/10 px-2.5 py-0.5 text-xs font-semibold text-[#64748B]">
        Draft
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* TAILADMIN BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mb-1">
            <span>QuikLedgr</span>
            <ChevronRight size={12} />
            <span className="text-[#3C50E0] font-semibold">Dashboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#8A99AD]">
            Welcome back, {user?.name || 'Administrator'}. Here is your enterprise cash velocity and receivables status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateToTab('payments')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all"
          >
            <CreditCard size={15} className="text-[#3C50E0]" />
            <span>Payments Ledger</span>
          </button>

          <button
            type="button"
            onClick={onNewInvoice}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-opacity-90 transition-all"
          >
            <Plus size={15} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* TAILADMIN 4 KPI STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
        {/* Metric 1: Total Billed */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs dark:border-[#2E3A47] dark:bg-[#1C2434] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-[#3C50E0]/10 text-[#3C50E0] dark:bg-[#3C50E0]/20">
              <FileText size={22} />
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#10B981]">
              <span>+14.8%</span>
              <ArrowUpRight size={14} />
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {formatMoney(totalAmount)}
              </h4>
              <span className="text-xs font-medium text-[#64748B] dark:text-[#8A99AD]">
                Total Billed Revenue
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-[#64748B] dark:text-[#8A99AD]">
              {totalCount} Invoices
            </span>
          </div>
        </div>

        {/* Metric 2: Total Realized Collections */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs dark:border-[#2E3A47] dark:bg-[#1C2434] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-[#10B981]/10 text-[#10B981] dark:bg-[#10B981]/20">
              <DollarSign size={22} />
            </div>
            <span className="flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2 py-0.5 text-xs font-semibold text-[#10B981]">
              {realizationRate}% Realized
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {formatMoney(totalPaid)}
              </h4>
              <span className="text-xs font-medium text-[#64748B] dark:text-[#8A99AD]">
                Payments Realized
              </span>
            </div>
            <span className="text-xs font-medium text-[#10B981]">
              Settled to Ledger
            </span>
          </div>
        </div>

        {/* Metric 3: Outstanding Receivables */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs dark:border-[#2E3A47] dark:bg-[#1C2434] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-[#F59E0B]/10 text-[#F59E0B] dark:bg-[#F59E0B]/20">
              <Clock size={22} />
            </div>
            {overdueCount > 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-xs font-semibold text-[#EF4444]">
                {overdueCount} Overdue
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#10B981]">Healthy</span>
            )}
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {formatMoney(totalBalanceDue)}
              </h4>
              <span className="text-xs font-medium text-[#64748B] dark:text-[#8A99AD]">
                Outstanding Balance (AR)
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-[#64748B] dark:text-[#8A99AD]">
              {totalCount - paidCount} Open
            </span>
          </div>
        </div>

        {/* Metric 4: Recurring Monthly Retainers */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs dark:border-[#2E3A47] dark:bg-[#1C2434] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] dark:bg-[#8B5CF6]/20">
              <Repeat size={22} />
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-[#3C50E0]">
              <span>Auto-Pilot</span>
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {formatMoney(totalAmount > 0 ? totalAmount * 0.65 : 4500)}
              </h4>
              <span className="text-xs font-medium text-[#64748B] dark:text-[#8A99AD]">
                Monthly Contract Retainers
              </span>
            </div>
            <span className="text-xs font-medium text-[#8B5CF6]">
              Active Schedules
            </span>
          </div>
        </div>
      </div>

      {/* TAILADMIN CHARTS SECTION */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* CHART ONE: Revenue & Collections Velocity (col-span-12 xl:col-span-8) */}
        <div className="col-span-12 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs dark:border-[#2E3A47] dark:bg-[#1C2434] xl:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue & Collections Velocity
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#8A99AD]">
                Monthly billing throughput versus cash settlement realization
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Legend */}
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#3C50E0]"></span>
                  <span className="text-[#64748B] dark:text-[#8A99AD]">Billed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#10B981]"></span>
                  <span className="text-[#64748B] dark:text-[#8A99AD]">Collected</span>
                </div>
              </div>

              {/* Timeframe Filter Buttons */}
              <div className="inline-flex items-center rounded-md bg-[#F1F5F9] p-1 dark:bg-[#24303F]">
                {['Day', 'Week', 'Month'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setChartTimeframe(tf)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      chartTimeframe === tf
                        ? 'bg-white text-slate-900 shadow-2xs dark:bg-[#1C2434] dark:text-white font-bold'
                        : 'text-[#64748B] hover:text-slate-900 dark:text-[#8A99AD] dark:hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SVG Bar Visual Chart */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47]">
            <div className="flex items-end justify-between gap-2 sm:gap-6 h-52 px-2">
              {monthlyData.map((item, idx) => {
                const billedHeight = Math.max(12, Math.round((item.billed / maxChartVal) * 160));
                const collectedHeight = Math.max(8, Math.round((item.collected / maxChartVal) * 160));

                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group">
                    <div className="flex items-end justify-center gap-1 sm:gap-2 w-full h-44">
                      {/* Billed Bar */}
                      <div
                        style={{ height: `${billedHeight}px` }}
                        className="w-3 sm:w-5 rounded-t-sm bg-[#3C50E0] hover:bg-opacity-80 transition-all cursor-pointer relative group/bar"
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded font-mono z-20 whitespace-nowrap">
                          Billed: ${Math.round(item.billed).toLocaleString()}
                        </div>
                      </div>

                      {/* Collected Bar */}
                      <div
                        style={{ height: `${collectedHeight}px` }}
                        className="w-3 sm:w-5 rounded-t-sm bg-[#10B981] hover:bg-opacity-80 transition-all cursor-pointer relative group/bar2"
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar2:block bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded font-mono z-20 whitespace-nowrap">
                          Paid: ${Math.round(item.collected).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <span className="mt-2 text-xs font-semibold text-[#64748B] dark:text-[#8A99AD]">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chart Summary Footnote */}
            <div className="mt-4 flex flex-wrap items-center justify-between border-t border-[#E2E8F0] pt-3 text-xs dark:border-[#2E3A47] text-[#64748B] dark:text-[#8A99AD]">
              <div>
                Average Monthly Velocity: <strong className="text-slate-900 dark:text-white font-mono">${Math.round(totalAmount / 6).toLocaleString()}</strong>
              </div>
              <div>
                Net Realization Efficiency: <strong className="text-[#10B981] font-mono">{realizationRate}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* CHART TWO: Portfolio Realization & Aging Donut / Progress (col-span-12 xl:col-span-4) */}
        <div className="col-span-12 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs dark:border-[#2E3A47] dark:bg-[#1C2434] xl:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Portfolio Health & Aging
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#8A99AD]">
              Invoice status ratio and collection exposure
            </p>

            {/* Circular / Segment Gauge Visual */}
            <div className="my-6 flex items-center justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-[#F1F5F9] dark:border-[#24303F]">
                <div 
                  className="absolute inset-0 rounded-full border-8 border-[#10B981]" 
                  style={{ clipPath: `polygon(0 0, 100% 0, 100% ${realizationRate}%, 0 ${realizationRate}%)` }}
                />
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {realizationRate}%
                  </div>
                  <div className="text-[11px] font-semibold text-[#10B981] uppercase tracking-wide">
                    Collected
                  </div>
                </div>
              </div>
            </div>

            {/* Status Breakdown List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-md bg-[#F8FAFC] dark:bg-[#24303F]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Fully Paid Invoices</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{paidCount} ({formatMoney(totalPaid)})</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md bg-[#F8FAFC] dark:bg-[#24303F]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Partially Settled</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{partialCount}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md bg-[#F8FAFC] dark:bg-[#24303F]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Overdue Invoices</span>
                </div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{overdueCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47]">
            <button
              type="button"
              onClick={() => onNavigateToTab('ar')}
              className="flex w-full items-center justify-between text-xs font-semibold text-[#3C50E0] hover:underline"
            >
              <span>View Accounts Receivable Matrix</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* TAILADMIN FAST ACTION COMMAND BAR */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD] mb-3">
          Quick Launch & Automation Tools
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={onNewInvoice}
            className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] p-2.5 text-left text-xs font-semibold text-slate-800 hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:text-white dark:hover:bg-[#3C50E0]/10 transition-all"
          >
            <Plus size={16} className="text-[#3C50E0] shrink-0" />
            <span className="truncate">New Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('quotes')}
            className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] p-2.5 text-left text-xs font-semibold text-slate-800 hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:text-white dark:hover:bg-[#3C50E0]/10 transition-all"
          >
            <Sparkles size={16} className="text-[#8B5CF6] shrink-0" />
            <span className="truncate">Create Quote</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('payments')}
            className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] p-2.5 text-left text-xs font-semibold text-slate-800 hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:text-white dark:hover:bg-[#3C50E0]/10 transition-all"
          >
            <CreditCard size={16} className="text-[#10B981] shrink-0" />
            <span className="truncate">Record Payment</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('recurring')}
            className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] p-2.5 text-left text-xs font-semibold text-slate-800 hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:text-white dark:hover:bg-[#3C50E0]/10 transition-all"
          >
            <Repeat size={16} className="text-[#F59E0B] shrink-0" />
            <span className="truncate">Recurring Billing</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('accounting')}
            className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] p-2.5 text-left text-xs font-semibold text-slate-800 hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:text-white dark:hover:bg-[#3C50E0]/10 transition-all"
          >
            <ShieldCheck size={16} className="text-[#3C50E0] shrink-0" />
            <span className="truncate">General Ledger</span>
          </button>
        </div>
      </div>

      {/* TAILADMIN TABLE ONE: Recent Invoices & Activity */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white px-5 pt-5 pb-3 shadow-2xs dark:border-[#2E3A47] dark:bg-[#1C2434] sm:px-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Invoices & Transactions
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#8A99AD]">
              Latest consulting agreements and recipient settlement links
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('list')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3C50E0] hover:underline"
          >
            <span>View All Invoices</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="py-12 text-center text-[#64748B] dark:text-[#8A99AD] text-xs">
            No invoices on file yet. Click "Create Invoice" to issue your first monthly invoice.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-[#F8FAFC] text-left dark:bg-[#24303F]">
                  <th className="py-3 px-4 font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Client & Account
                  </th>
                  <th className="py-3 px-4 font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="py-3 px-4 font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="py-3 px-4 font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47]">
                {recentInvoices.map((inv) => {
                  const clientName = inv.client?.companyName || inv.client_name || 'Client';
                  const initials = clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <tr 
                      key={inv.id}
                      className="hover:bg-[#F8FAFC] dark:hover:bg-[#24303F]/50 transition-colors cursor-pointer"
                      onClick={() => onSelectInvoice(inv)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3C50E0]/10 text-xs font-bold text-[#3C50E0]">
                            {initials}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                              {clientName}
                            </p>
                            <p className="text-[11px] text-[#64748B] dark:text-[#8A99AD] truncate">
                              {inv.client?.email || inv.client_email || inv.servicePeriod || 'Monthly Consulting'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-xs text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3 px-4 text-xs text-[#64748B] dark:text-[#8A99AD]">
                        {inv.dueDate || '15th'}
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(inv)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {formatMoney(inv.total)}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onShareInvoice(inv)}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#3C50E0] hover:bg-[#F1F5F9] dark:text-[#8A99AD] dark:hover:text-white dark:hover:bg-[#24303F] transition-colors"
                            title="Share recipient link"
                          >
                            <Share2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectInvoice(inv)}
                            className="p-1.5 rounded-md text-[#64748B] hover:text-[#3C50E0] hover:bg-[#F1F5F9] dark:text-[#8A99AD] dark:hover:text-white dark:hover:bg-[#24303F] transition-colors"
                            title="Edit invoice"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
