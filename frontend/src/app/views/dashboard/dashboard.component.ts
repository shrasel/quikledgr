import { Component, inject, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { Invoice } from '../../core/models/invoice.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- 1. BREADCRUMB & PAGE HEADER -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#8A99AD] mb-1">
            <span>QuickLedger</span>
            <span class="text-slate-400">/</span>
            <span class="text-[#3C50E0]">Dashboard</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Financial Dashboard
          </h1>
          <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
            Welcome back, {{ auth.currentUser()?.name || 'Administrator' }}. Real-time cash velocity and receivables status.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="router.navigate(['/payments'])"
            class="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all cursor-pointer"
          >
            <span>Payments Ledger</span>
          </button>

          <button
            type="button"
            (click)="router.navigate(['/invoices/create'])"
            class="inline-flex items-center gap-2 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all cursor-pointer"
          >
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      <!-- 2. TAILADMIN 4 KPI STAT CARDS -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- KPI 1: Total Billed Volume -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-[#3C50E0]/40 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3C50E0]/10 text-[#3C50E0] dark:bg-[#3C50E0]/20 font-bold">
              $
            </div>
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +14.8% ↑
            </span>
          </div>

          <div class="mt-4">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ formatMoney(totalAmount()) }}
            </h3>
            <p class="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Total Billed Volume
            </p>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Active Agreements</span>
            <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ invoiceService.invoices().length }} Invoices</span>
          </div>
        </div>

        <!-- KPI 2: Realized Cash Collections -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-emerald-500/40 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 font-bold">
              ✓
            </div>
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {{ realizationRate() }}% Realized
            </span>
          </div>

          <div class="mt-4">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ formatMoney(totalPaid()) }}
            </h3>
            <p class="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Realized Cash Collections
            </p>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Ledger Status</span>
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">Settled to Bank</span>
          </div>
        </div>

        <!-- KPI 3: Outstanding Receivables -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-amber-500/40 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 font-bold">
              ⏱
            </div>
            @if (overdueCount() > 0) {
              <span class="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                {{ overdueCount() }} Overdue
              </span>
            } @else {
              <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Healthy
              </span>
            }
          </div>

          <div class="mt-4">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ formatMoney(totalBalanceDue()) }}
            </h3>
            <p class="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Outstanding Balance (AR)
            </p>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Unpaid Portfolio</span>
            <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ openCount() }} Open</span>
          </div>
        </div>

        <!-- KPI 4: Monthly Retainers -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-purple-500/40 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 font-bold">
              ⟳
            </div>
            <span class="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400">
              Auto-Pilot
            </span>
          </div>

          <div class="mt-4">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ formatMoney(totalAmount() > 0 ? totalAmount() * 0.65 : 4500) }}
            </h3>
            <p class="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Monthly Contract Retainers
            </p>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Billing Engine</span>
            <span class="font-semibold text-purple-600 dark:text-purple-400">Automated Run</span>
          </div>
        </div>
      </div>

      <!-- 3. CHARTS SECTION -->
      <div class="grid grid-cols-12 gap-5">
        <!-- Velocity Multi-Bar Chart -->
        <div class="col-span-12 rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] xl:col-span-8 flex flex-col justify-between">
          <div>
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  Revenue & Collections Velocity
                </h3>
                <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
                  Monthly billing throughput versus cash settlement realization
                </p>
              </div>

              <div class="flex items-center gap-4">
                <div class="hidden sm:flex items-center gap-3 text-xs font-medium">
                  <div class="flex items-center gap-1.5">
                    <span class="h-3 w-3 rounded-full bg-[#3C50E0]"></span>
                    <span class="text-slate-700 dark:text-slate-300">Billed</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <span class="h-3 w-3 rounded-full bg-[#10B981]"></span>
                    <span class="text-slate-700 dark:text-slate-300">Collected</span>
                  </div>
                </div>

                <div class="inline-flex items-center gap-1 rounded-lg bg-[#F1F5F9] p-1 dark:bg-[#24303F]">
                  @for (tf of ['Day', 'Week', 'Month']; track tf) {
                    <button
                      type="button"
                      (click)="chartTimeframe = tf"
                      class="rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer"
                      [class.bg-white]="chartTimeframe === tf"
                      [class.text-slate-900]="chartTimeframe === tf"
                      [class.shadow-xs]="chartTimeframe === tf"
                      [class.dark:bg-[#1C2434]]="chartTimeframe === tf"
                      [class.dark:text-white]="chartTimeframe === tf"
                      [class.text-[#64748B]]="chartTimeframe !== tf"
                    >
                      {{ tf }}
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Structured Bar Chart -->
            <div class="relative mt-8 h-56 pt-2">
              <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                <div class="border-b border-dashed border-[#E2E8F0] dark:border-[#2E3A47] w-full"></div>
                <div class="border-b border-dashed border-[#E2E8F0] dark:border-[#2E3A47] w-full"></div>
                <div class="border-b border-dashed border-[#E2E8F0] dark:border-[#2E3A47] w-full"></div>
                <div class="border-b border-dashed border-[#E2E8F0] dark:border-[#2E3A47] w-full"></div>
              </div>

              <div class="relative h-full flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6 pb-6">
                @for (item of monthlyData; track item.month) {
                  <div class="flex flex-col items-center flex-1 h-full justify-end group rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#24303F]/40 p-1 transition-colors">
                    <div class="flex items-end justify-center gap-1.5 sm:gap-2.5 w-full">
                      <div
                        [style.height.px]="getBilledHeight(item.billed)"
                        class="w-4 sm:w-7 rounded-t-md bg-[#3C50E0] hover:bg-[#3444bf] transition-all cursor-pointer relative group/bar"
                      >
                        <div class="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar:block bg-slate-900 text-white text-[10px] py-0.5 px-2 rounded-md font-mono z-30 whitespace-nowrap shadow-md">
                          \${{ item.billed.toLocaleString() }}
                        </div>
                      </div>

                      <div
                        [style.height.px]="getCollectedHeight(item.collected)"
                        class="w-4 sm:w-7 rounded-t-md bg-[#10B981] hover:bg-emerald-600 transition-all cursor-pointer relative group/bar2"
                      >
                        <div class="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/bar2:block bg-slate-900 text-white text-[10px] py-0.5 px-2 rounded-md font-mono z-30 whitespace-nowrap shadow-md">
                          \${{ item.collected.toLocaleString() }}
                        </div>
                      </div>
                    </div>

                    <span class="mt-2 text-xs font-bold text-[#64748B] dark:text-[#8A99AD]">
                      {{ item.month }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-between border-t border-[#E2E8F0] pt-3 text-xs dark:border-[#2E3A47] text-[#64748B] dark:text-[#8A99AD]">
            <div>
              Average Monthly Velocity: <strong class="text-slate-900 dark:text-white font-mono">\${{ Math.round(totalAmount() > 0 ? totalAmount() / 6 : 4942).toLocaleString() }}</strong>
            </div>
            <div>
              Net Realization Efficiency: <strong class="text-emerald-600 dark:text-emerald-400 font-mono">{{ realizationRate() }}%</strong>
            </div>
          </div>
        </div>

        <!-- Portfolio Health Circular Gauge -->
        <div class="col-span-12 rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] xl:col-span-4 flex flex-col justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              Portfolio Health & Aging
            </h3>
            <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
              Invoice status distribution and receivables exposure
            </p>

            <div class="my-6 flex items-center justify-center">
              <div class="relative flex items-center justify-center">
                <svg width="140" height="140" class="transform -rotate-90">
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    stroke="currentColor"
                    stroke-width="12"
                    fill="transparent"
                    class="text-[#F1F5F9] dark:text-[#24303F]"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="54"
                    stroke="currentColor"
                    stroke-width="12"
                    stroke-linecap="round"
                    fill="transparent"
                    class="text-[#10B981] transition-all duration-1000 ease-out"
                    [attr.stroke-dasharray]="339.29"
                    [attr.stroke-dashoffset]="getProgressOffset()"
                  />
                </svg>

                <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span class="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {{ realizationRate() }}%
                  </span>
                  <span class="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mt-0.5">
                    Collected
                  </span>
                </div>
              </div>
            </div>

            <!-- Breakdown list -->
            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F]">
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#10B981]"></span>
                  <span class="text-slate-800 dark:text-slate-200 font-medium">Fully Paid Invoices</span>
                </div>
                <span class="font-mono font-bold text-slate-900 dark:text-white">{{ paidCount() }} ({{ formatMoney(totalPaid()) }})</span>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F]">
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#F59E0B]"></span>
                  <span class="text-slate-800 dark:text-slate-200 font-medium">Partially Settled</span>
                </div>
                <span class="font-mono font-bold text-slate-900 dark:text-white">{{ partialCount() }}</span>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F]">
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-[#EF4444]"></span>
                  <span class="text-slate-800 dark:text-slate-200 font-medium">Overdue Invoices</span>
                </div>
                <span class="font-mono font-bold text-rose-600 dark:text-rose-400">{{ overdueCount() }}</span>
              </div>
            </div>
          </div>

          <div class="pt-4 mt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47]">
            <button
              type="button"
              (click)="router.navigate(['/ar'])"
              class="flex w-full items-center justify-between text-xs font-bold text-[#3C50E0] hover:underline cursor-pointer"
            >
              <span>View Accounts Receivable Matrix</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 4. FAST ACTION OPERATIONS BAR -->
      <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
        <div class="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD] mb-3">
          Quick Launch & Operations
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            type="button"
            (click)="invoiceService.openCreateModal(); onNewInvoice.emit()"
            class="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:hover:bg-[#3C50E0]/10 transition-all shadow-2xs group cursor-pointer"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3C50E0]/10 text-[#3C50E0] group-hover:bg-[#3C50E0] group-hover:text-white transition-colors font-bold">
              +
            </div>
            <div class="truncate">
              <p class="text-xs font-bold text-slate-900 dark:text-white truncate">New Invoice</p>
              <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Bill monthly client</p>
            </div>
          </button>

          <button
            type="button"
            (click)="router.navigate(['/quotes'])"
            class="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/5 dark:border-[#2E3A47] dark:hover:bg-[#8B5CF6]/10 transition-all shadow-2xs group cursor-pointer"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors font-bold">
              ✦
            </div>
            <div class="truncate">
              <p class="text-xs font-bold text-slate-900 dark:text-white truncate">Create Quote</p>
              <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Draft estimate</p>
            </div>
          </button>

          <button
            type="button"
            (click)="router.navigate(['/payments'])"
            class="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#10B981] hover:bg-[#10B981]/5 dark:border-[#2E3A47] dark:hover:bg-[#10B981]/10 transition-all shadow-2xs group cursor-pointer"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/10 text-[#10B981] group-hover:bg-[#10B981] group-hover:text-white transition-colors font-bold">
              💳
            </div>
            <div class="truncate">
              <p class="text-xs font-bold text-slate-900 dark:text-white truncate">Record Payment</p>
              <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Log ACH or wire</p>
            </div>
          </button>

          <button
            type="button"
            (click)="router.navigate(['/recurring'])"
            class="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#F59E0B] hover:bg-[#F59E0B]/5 dark:border-[#2E3A47] dark:hover:bg-[#F59E0B]/10 transition-all shadow-2xs group cursor-pointer"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-white transition-colors font-bold">
              ⟳
            </div>
            <div class="truncate">
              <p class="text-xs font-bold text-slate-900 dark:text-white truncate">Recurring</p>
              <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Automated retainers</p>
            </div>
          </button>

          <button
            type="button"
            (click)="router.navigate(['/accounting'])"
            class="flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3.5 text-left hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:hover:bg-[#3C50E0]/10 transition-all shadow-2xs group cursor-pointer"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3C50E0]/10 text-[#3C50E0] group-hover:bg-[#3C50E0] group-hover:text-white transition-colors font-bold">
              ⚖
            </div>
            <div class="truncate">
              <p class="text-xs font-bold text-slate-900 dark:text-white truncate">General Ledger</p>
              <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate">Chart of accounts</p>
            </div>
          </button>
        </div>
      </div>

      <!-- 5. RECENT INVOICES TABLE -->
      <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
        <div class="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              Recent Invoices & Transactions
            </h3>
            <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
              Latest consulting agreements and recipient settlement links
            </p>
          </div>

          <button
            type="button"
            (click)="router.navigate(['/invoices'])"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-[#3C50E0] hover:underline cursor-pointer"
          >
            <span>View All Invoices</span>
            <span>→</span>
          </button>
        </div>

        @if (invoiceService.invoices().length === 0) {
          <div class="py-12 text-center text-[#64748B] dark:text-[#8A99AD] text-xs">
            No invoices on file yet. Click "Create Invoice" to issue your first monthly invoice.
          </div>
        } @else {
          <div class="max-w-full overflow-x-auto mt-2">
            <table class="w-full table-auto">
              <thead>
                <tr class="border-b border-[#E2E8F0] text-left dark:border-[#2E3A47]">
                  <th class="py-3 px-4 font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Client & Account
                  </th>
                  <th class="py-3 px-4 font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th class="py-3 px-4 font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Due Date
                  </th>
                  <th class="py-3 px-4 font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Status
                  </th>
                  <th class="py-3 px-4 text-right font-bold text-[11px] text-slate-500 dark:text-[#8A99AD] uppercase tracking-wider">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47]">
                @for (inv of invoiceService.invoices(); track inv.id) {
                  <tr 
                    class="hover:bg-[#F8FAFC] dark:hover:bg-[#24303F]/50 transition-colors cursor-pointer group"
                    (click)="router.navigate(['/invoices'])"
                  >
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3C50E0]/10 text-xs font-bold text-[#3C50E0]">
                          {{ getInitials(inv) }}
                        </div>
                        <div class="truncate">
                          <p class="font-semibold text-xs text-slate-900 dark:text-white truncate group-hover:text-[#3C50E0] transition-colors">
                            {{ inv.client?.companyName || inv.client_name || 'Acme Client' }}
                          </p>
                          <p class="text-[11px] text-[#64748B] dark:text-[#8A99AD] truncate">
                            {{ inv.client?.email || inv.client_email || inv.servicePeriod || 'Monthly Retainer' }}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td class="py-3.5 px-4">
                      <span class="font-mono font-semibold text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {{ inv.invoiceNumber }}
                      </span>
                    </td>

                    <td class="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-[#8A99AD]">
                      {{ formatDate(inv.dueDate) }}
                    </td>

                    <td class="py-3.5 px-4">
                      @if (inv.status === 'paid' || (inv.balance_due !== undefined && inv.balance_due <= 0.005)) {
                        <span class="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Paid
                        </span>
                      } @else if (inv.status === 'partially_paid' || (inv.amount_paid && inv.amount_paid > 0)) {
                        <span class="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Partial
                        </span>
                      } @else if (inv.status === 'sent') {
                        <span class="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-[#3C50E0] dark:text-blue-400 border border-blue-500/20">
                          Sent
                        </span>
                      } @else {
                        <span class="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-500/20">
                          Draft
                        </span>
                      }
                    </td>

                    <td class="py-3.5 px-4 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {{ formatMoney(inv.total) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class DashboardComponent {
  auth = inject(AuthService);
  invoiceService = inject(InvoiceService);
  router = inject(Router);

  onNavigateTab = output<string>();
  onNewInvoice = output<void>();
  onSelectInvoice = output<Invoice>();

  chartTimeframe = 'Month';
  Math = Math;

  // Computed Metrics
  totalAmount = computed(() => 
    this.invoiceService.invoices().reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
  );

  totalPaid = computed(() =>
    this.invoiceService.invoices().reduce((sum, inv) => {
      if (inv.amount_paid !== undefined && inv.amount_paid !== null) {
        return sum + Number(inv.amount_paid || 0);
      }
      return inv.status === 'paid' ? sum + Number(inv.total || 0) : sum;
    }, 0)
  );

  totalBalanceDue = computed(() =>
    this.invoiceService.invoices().reduce((sum, inv) => {
      if (inv.balance_due !== undefined && inv.balance_due !== null) {
        return sum + Number(inv.balance_due || 0);
      }
      return inv.status !== 'paid' ? sum + Number(inv.total || 0) : sum;
    }, 0)
  );

  paidCount = computed(() =>
    this.invoiceService.invoices().filter(i => i.status === 'paid' || (Number(i.amount_paid || 0) >= Number(i.total || 0) && Number(i.total || 0) > 0)).length
  );

  partialCount = computed(() =>
    this.invoiceService.invoices().filter(i => i.status === 'partially_paid' || (Number(i.amount_paid || 0) > 0 && Number(i.amount_paid || 0) < Number(i.total || 0))).length
  );

  overdueCount = computed(() =>
    this.invoiceService.invoices().filter(i => {
      if (i.status === 'paid') return false;
      const bal = i.balance_due !== undefined ? Number(i.balance_due) : Number(i.total || 0);
      if (bal <= 0 || !i.dueDate) return false;
      return new Date(i.dueDate) < new Date();
    }).length
  );

  openCount = computed(() => 
    this.invoiceService.invoices().length - this.paidCount()
  );

  realizationRate = computed(() => {
    const total = this.totalAmount();
    if (total <= 0) return 0;
    return Math.round((this.totalPaid() / total) * 100);
  });

  monthlyData = [
    { month: 'May', billed: 12500, collected: 11000 },
    { month: 'Jun', billed: 15800, collected: 14200 },
    { month: 'Jul', billed: 18400, collected: 17500 },
    { month: 'Aug', billed: 22100, collected: 20400 },
    { month: 'Sep', billed: 26000, collected: 23800 },
    { month: 'Oct', billed: 29650, collected: 27200 }
  ];

  getBilledHeight(val: number): number {
    return Math.max(16, Math.round((val / 30000) * 160));
  }

  getCollectedHeight(val: number): number {
    return Math.max(10, Math.round((val / 30000) * 160));
  }

  getProgressOffset(): number {
    const circumference = 339.29; // 2 * PI * 54
    const rate = Math.min(Math.max(this.realizationRate(), 0), 100);
    return circumference - (circumference * rate) / 100;
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getInitials(inv: Invoice): string {
    const name = inv.client?.companyName || inv.client_name || 'CL';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
