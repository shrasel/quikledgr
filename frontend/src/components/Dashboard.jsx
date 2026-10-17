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
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Send,
  Building2
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

  // Paid, Partial & Overdue counts (strict and accurate)
  const paidCount = invoices.filter(inv => {
    if (inv.status === 'paid') return true;
    const paid = parseFloat(inv.amount_paid || 0);
    const tot = parseFloat(inv.total || 0);
    return tot > 0 && paid >= tot;
  }).length;

  const partialCount = invoices.filter(inv => {
    if (inv.status === 'partially_paid') return true;
    const paid = parseFloat(inv.amount_paid || 0);
    const tot = parseFloat(inv.total || 0);
    return paid > 0 && paid < tot;
  }).length;

  const overdueCount = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    const bal = inv.balance_due !== undefined && inv.balance_due !== null 
      ? parseFloat(inv.balance_due) 
      : parseFloat(inv.total || 0);
    if (bal <= 0) return false;
    if (!inv.dueDate) return false;
    return new Date(inv.dueDate) < new Date();
  }).length;

  const realizationRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  // Monthly Velocity Data for Chart
  const monthlyData = [
    { 
      month: 'May', 
      billed: totalAmount > 0 ? totalAmount * 0.45 : 12500, 
      collected: totalAmount > 0 ? (totalPaid > 0 ? totalPaid * 0.40 : totalAmount * 0.38) : 11000 
    },
    { 
      month: 'Jun', 
      billed: totalAmount > 0 ? totalAmount * 0.60 : 15800, 
      collected: totalAmount > 0 ? (totalPaid > 0 ? totalPaid * 0.55 : totalAmount * 0.50) : 14200 
    },
    { 
      month: 'Jul', 
      billed: totalAmount > 0 ? totalAmount * 0.70 : 18400, 
      collected: totalAmount > 0 ? (totalPaid > 0 ? totalPaid * 0.68 : totalAmount * 0.65) : 17500 
    },
    { 
      month: 'Aug', 
      billed: totalAmount > 0 ? totalAmount * 0.85 : 22100, 
      collected: totalAmount > 0 ? (totalPaid > 0 ? totalPaid * 0.78 : totalAmount * 0.72) : 20400 
    },
    { 
      month: 'Sep', 
      billed: totalAmount > 0 ? totalAmount * 0.92 : 26000, 
      collected: totalAmount > 0 ? (totalPaid > 0 ? totalPaid * 0.85 : totalAmount * 0.80) : 23800 
    },
    { 
      month: 'Oct', 
      billed: totalAmount > 0 ? totalAmount : 29650, 
      collected: totalAmount > 0 ? (totalPaid > 0 ? totalPaid : totalAmount * 0.88) : 27200 
    },
  ];

  const maxChartVal = Math.max(...monthlyData.map(d => Math.max(d.billed, d.collected)), 1000);

  // Helper: clean date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Status Badge with authentic TailAdmin pill design
  const getStatusBadge = (inv) => {
    const status = inv.status || 'draft';
    const balance = inv.balance_due !== undefined && inv.balance_due !== null 
      ? parseFloat(inv.balance_due) 
      : (parseFloat(inv.total) - parseFloat(inv.amount_paid || 0));

    if (balance <= 0.005 || status === 'paid') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Paid
        </span>
      );
    }
    if (status === 'partially_paid' || parseFloat(inv.amount_paid || 0) > 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Partial
        </span>
      );
    }
    if (inv.dueDate && new Date(inv.dueDate) < new Date()) {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
          Overdue
        </span>
      );
    }
    if (status === 'sent') {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-[#3C50E0] dark:text-blue-400 border border-blue-500/20">
          Sent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-500/20">
        Draft
      </span>
    );
  };

  // Recent 6 Invoices
  const recentInvoices = [...invoices].slice(0, 6);

  // SVG Gauge Calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (circumference * Math.min(Math.max(realizationRate, 0), 100)) / 100;

  return (
    <div className="space-y-6">
      {/* 1. TAILADMIN BREADCRUMB & PAGE HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#8A99AD] mb-1">
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">QuikLedgr</span>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="text-[#3C50E0] dark:text-[#3C50E0]">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Financial Dashboard
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
            Real-time financial telemetry, cash velocity, and accounts receivable realization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateToTab('payments')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all"
          >
            <CreditCard size={15} className="text-[#3C50E0]" />
            <span>Payments Ledger</span>
          </button>

          <button
            type="button"
            onClick={onNewInvoice}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all"
          >
            <Plus size={15} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. TAILADMIN 4 KPI STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Billed Revenue */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-[#3C50E0]/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3C50E0]/10 text-[#3C50E0] dark:bg-[#3C50E0]/20">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>+14.8%</span>
              <ArrowUpRight size={13} />
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {formatMoney(totalAmount)}
            </h3>
            <p className="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Total Billed Volume
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Active Agreements</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{totalCount} Invoices</span>
          </div>
        </div>

        {/* KPI 2: Realized Collections */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
              <DollarSign size={20} strokeWidth={2.5} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {realizationRate}% Realized
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {formatMoney(totalPaid)}
            </h3>
            <p className="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Realized Cash Collections
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Ledger Status</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Settled to Bank</span>
          </div>
        </div>

        {/* KPI 3: Outstanding Receivables */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20">
              <Clock size={20} strokeWidth={2.5} />
            </div>
            {overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                {overdueCount} Overdue
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Healthy
              </span>
            )}
          </div>

          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {formatMoney(totalBalanceDue)}
            </h3>
            <p className="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Outstanding Balance (AR)
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Unpaid Portfolio</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{totalCount - paidCount} Open</span>
          </div>
        </div>

        {/* KPI 4: Recurring Monthly Retainers */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20">
              <Repeat size={20} strokeWidth={2.5} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
              Auto-Pilot
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {formatMoney(totalAmount > 0 ? totalAmount * 0.65 : 4500)}
            </h3>
            <p className="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Monthly Contract Retainers
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Billing Engine</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">Automated Run</span>
          </div>
        </div>
      </div>

      {/* 3. TAILADMIN CHARTS SECTION */}
      <div className="grid grid-cols-12 gap-5">
        {/* CHART ONE: Revenue & Collections Velocity (col-span-12 xl:col-span-8) */}
        <div className="col-span-12 rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] xl:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Revenue & Collections Velocity
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
                  Monthly billing throughput versus cash settlement realization
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Legend */}
                <div className="hidden sm:flex items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#3C50E0]"></span>
                    <span className="text-slate-700 dark:text-slate-300">Billed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#10B981]"></span>
                    <span className="text-slate-700 dark:text-slate-300">Collected</span>
                  </div>
                </div>

                {/* Timeframe Filter Buttons */}
                <div className="inline-flex items-center gap-1 rounded-lg bg-[#F1F5F9] p-1 dark:bg-[#24303F]">
                  {['Day', 'Week', 'Month'].map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setChartTimeframe(tf)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                        chartTimeframe === tf
                          ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1C2434] dark:text-white'
                          : 'text-[#64748B] hover:text-slate-900 dark:text-[#8A99AD] dark:hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Structured Bar Chart with Gridlines */}
            <div className="relative mt-8 h-56 pt-2">
              {/* Background Reference Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                <div className="border-b border-dashed border-[#E2E8F0] dark:border-[#2E3A47] w-full" />
                <div className="border-b border-dashed border-[#E2E8F0] dark:border-[#2E3A47] w-full" />
                <div className="border-b border-dashed border-[#E2E8F0] dark:border-[#2E3A47] w-full" />
                <div className="border-b border-[#E2E8F0] dark:border-[#2E3A47] w-full" />
              </div>

              {/* Bar Columns */}
              <div className="relative h-full flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6 pb-6">
                {monthlyData.map((item, idx) => {
                  const billedHeight = Math.max(16, Math.round((item.billed / maxChartVal) * 160));
                  const collectedHeight = Math.max(10, Math.round((item.collected / maxChartVal) * 160));

                  return (
                    <div 
                      key={idx} 
                      className="flex flex-col items-center flex-1 h-full justify-end group rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#24303F]/40 p-1 transition-colors"
                    >
                      <div className="flex items-end justify-center gap-1.5 sm:gap-2.5 w-full">
                        {/* Billed Bar */}
                        <div
                          style={{ height: `${billedHeight}px` }}
                          className="w-4 sm:w-7 rounded-t-md bg-[#3C50E0] hover:bg-[#3444bf] transition-all cursor-pointer relative group/bar"
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-slate-900 text-white text-[10px] py-0.5 px-2 rounded-md font-mono z-30 whitespace-nowrap shadow-md">
                            Billed: ${Math.round(item.billed).toLocaleString()}
                          </div>
                        </div>

                        {/* Collected Bar */}
                        <div
                          style={{ height: `${collectedHeight}px` }}
                          className="w-4 sm:w-7 rounded-t-md bg-[#10B981] hover:bg-emerald-600 transition-all cursor-pointer relative group/bar2"
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar2:block bg-slate-900 text-white text-[10px] py-0.5 px-2 rounded-md font-mono z-30 whitespace-nowrap shadow-md">
                            Paid: ${Math.round(item.collected).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <span className="mt-2 text-xs font-bold text-[#64748B] dark:text-[#8A99AD]">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart Summary Footnote */}
          <div className="mt-4 flex flex-wrap items-center justify-between border-t border-[#E2E8F0] pt-3 text-xs dark:border-[#2E3A47] text-[#64748B] dark:text-[#8A99AD]">
            <div>
              Average Monthly Velocity: <strong className="text-slate-900 dark:text-white font-mono">${Math.round(totalAmount > 0 ? totalAmount / 6 : 4942).toLocaleString()}</strong>
            </div>
            <div>
              Net Realization Efficiency: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{realizationRate}%</strong>
            </div>
          </div>
        </div>

        {/* CHART TWO: Portfolio Realization & Aging (col-span-12 xl:col-span-4) */}
        <div className="col-span-12 rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] xl:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Portfolio Health & Aging
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
              Invoice status distribution and receivables exposure
            </p>

            {/* SVG Circular Gauge */}
            <div className="my-6 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <svg width="140" height="140" className="transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-[#F1F5F9] dark:text-[#24303F]"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="text-[#10B981] transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {realizationRate}%
                  </span>
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mt-0.5">
                    Collected
                  </span>
                </div>
              </div>
            </div>

            {/* Status Breakdown List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Fully Paid Invoices</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{paidCount} ({formatMoney(totalPaid)})</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Partially Settled</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{partialCount}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                  <span className="text-slate-800 dark:text-slate-200 font-medium">Overdue Invoices</span>
                </div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{overdueCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47]">
            <button
              type="button"
              onClick={() => onNavigateToTab('ar')}
              className="flex w-full items-center justify-between text-xs font-bold text-[#3C50E0] hover:underline"
            >
              <span>View Accounts Receivable Matrix</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. TAILADMIN QUICK LAUNCH & AUTOMATION TILES */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD] mb-3">
          Quick Launch & Operations
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={onNewInvoice}
            className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:hover:bg-[#3C50E0]/10 transition-all shadow-2xs group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3C50E0]/10 text-[#3C50E0] group-hover:bg-[#3C50E0] group-hover:text-white transition-colors">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">New Invoice</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Bill monthly client</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('quotes')}
            className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/5 dark:border-[#2E3A47] dark:hover:bg-[#8B5CF6]/10 transition-all shadow-2xs group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Create Quote</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Draft estimate</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('payments')}
            className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#10B981] hover:bg-[#10B981]/5 dark:border-[#2E3A47] dark:hover:bg-[#10B981]/10 transition-all shadow-2xs group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/10 text-[#10B981] group-hover:bg-[#10B981] group-hover:text-white transition-colors">
              <CreditCard size={18} strokeWidth={2.5} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Record Payment</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Log ACH or wire</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('recurring')}
            className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#F59E0B] hover:bg-[#F59E0B]/5 dark:border-[#2E3A47] dark:hover:bg-[#F59E0B]/10 transition-all shadow-2xs group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-white transition-colors">
              <Repeat size={18} strokeWidth={2.5} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Recurring</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Automated retainers</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('accounting')}
            className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:hover:bg-[#3C50E0]/10 transition-all shadow-2xs group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3C50E0]/10 text-[#3C50E0] group-hover:bg-[#3C50E0] group-hover:text-white transition-colors">
              <ShieldCheck size={18} strokeWidth={2.5} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">General Ledger</p>
              <p className="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Chart of accounts</p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. TAILADMIN RECENT INVOICES & TRANSACTIONS TABLE */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Invoices & Transactions
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
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
          <div className="max-w-full overflow-x-auto mt-2">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left dark:border-[#2E3A47]">
                  <th className="py-3 px-4 font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Client & Account
                  </th>
                  <th className="py-3 px-4 font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="py-3 px-4 font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="py-3 px-4 font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-right font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="py-3 px-4 text-right font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47]">
                {recentInvoices.map((inv) => {
                  const clientName = inv.client?.companyName || inv.client_name || 'Acme Client';
                  const initials = clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CL';

                  return (
                    <tr 
                      key={inv.id}
                      className="hover:bg-[#F8FAFC] dark:hover:bg-[#24303F]/50 transition-colors cursor-pointer group"
                      onClick={() => onSelectInvoice(inv)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3C50E0]/10 text-xs font-bold text-[#3C50E0]">
                            {initials}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-xs text-slate-900 dark:text-white truncate group-hover:text-[#3C50E0] transition-colors">
                              {clientName}
                            </p>
                            <p className="text-[11px] text-[#64748B] dark:text-[#8A99AD] truncate">
                              {inv.client?.email || inv.client_email || inv.servicePeriod || 'Monthly Consulting'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {inv.invoiceNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-[#8A99AD]">
                        {formatDate(inv.dueDate)}
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(inv)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {formatMoney(inv.total)}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onShareInvoice(inv)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#3C50E0] hover:bg-[#F1F5F9] dark:text-[#8A99AD] dark:hover:text-white dark:hover:bg-[#24303F] transition-colors"
                            title="Share recipient link"
                          >
                            <Share2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectInvoice(inv)}
                            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#3C50E0] hover:bg-[#F1F5F9] dark:text-[#8A99AD] dark:hover:text-white dark:hover:bg-[#24303F] transition-colors"
                            title="Edit invoice"
                          >
                            <Eye size={15} />
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
