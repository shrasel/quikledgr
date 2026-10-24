import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { Expense, Bill, ReceiptOCRResult } from '../../core/models/expense.model';
import { Vendor } from '../../core/models/vendor.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- 1. BREADCRUMB & HEADER -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#8A99AD] mb-1">
            <span>QuickLedger</span>
            <span class="text-slate-400">/</span>
            <span class="text-[#3C50E0]">Expenses & Accounts Payable</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Expenses, Vendor Bills & AP Ledger
          </h1>
          <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
            Phase 4: Accounts Payable, intelligent receipt OCR extraction, and IRS 1099 contractor compliance.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="expenseService.refreshAll()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            <span>Sync AP</span>
          </button>

          <button
            type="button"
            (click)="openAddVendorModal()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all cursor-pointer"
          >
            <span>+ New Vendor</span>
          </button>

          <button
            type="button"
            (click)="openCreateBillModal()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#3C50E0] bg-[#3C50E0]/10 px-3.5 py-2 text-xs font-semibold text-[#3C50E0] hover:bg-[#3C50E0]/20 transition-all cursor-pointer"
          >
            <span>+ Add Vendor Bill</span>
          </button>

          <button
            type="button"
            (click)="openRecordExpenseModal()"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            <span>Record Expense (OCR)</span>
          </button>
        </div>
      </div>

      <!-- 2. TAILADMIN KPI STATS STRIP -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- KPI 1: Accounts Payable Balance Due -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">Accounts Payable</span>
            <span class="rounded bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              {{ openBillsCount() }} Open Bills
            </span>
          </div>
          <div class="mt-3">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ formatMoney(totalApBalance()) }}
            </h3>
            <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1">
              Outstanding supplier invoices to pay
            </p>
          </div>
        </div>

        <!-- KPI 2: Direct Expenses Logged -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">Direct Expenses</span>
            <span class="rounded bg-[#3C50E0]/10 px-2 py-0.5 text-[11px] font-bold text-[#3C50E0]">
              {{ expenses().length }} Receipts
            </span>
          </div>
          <div class="mt-3">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ formatMoney(totalExpensesAmount()) }}
            </h3>
            <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1">
              Receipts & card purchases logged
            </p>
          </div>
        </div>

        <!-- KPI 3: Unbilled Client Reimbursables -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">Billable Reimbursables</span>
            <span class="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              +Markup
            </span>
          </div>
          <div class="mt-3">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-amber-500">
              {{ formatMoney(unbilledTotalAmount()) }}
            </h3>
            <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1">
              Ready to add to client invoices
            </p>
          </div>
        </div>

        <!-- KPI 4: 1099 Contractor Compliance -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">1099-NEC Spend</span>
            <span class="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ≥ $600 IRS Rules
            </span>
          </div>
          <div class="mt-3">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {{ formatMoney(contractor1099Total()) }}
            </h3>
            <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1">
              {{ qualifying1099Count() }} qualifying contractor(s)
            </p>
          </div>
        </div>
      </div>

      <!-- 3. TAB CONTROLS STRIP -->
      <div class="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="activeSubTab.set('bills')"
            [class.bg-[#3C50E0]]="activeSubTab() === 'bills'"
            [class.text-white]="activeSubTab() === 'bills'"
            [class.bg-white]="activeSubTab() !== 'bills'"
            [class.text-[#64748B]]="activeSubTab() !== 'bills'"
            [class.dark:bg-[#1C2434]]="activeSubTab() !== 'bills'"
            [class.dark:text-[#8A99AD]]="activeSubTab() !== 'bills'"
            class="rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Vendor Bills (AP)</span>
            <span class="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">{{ bills().length }}</span>
          </button>

          <button
            type="button"
            (click)="activeSubTab.set('expenses')"
            [class.bg-[#3C50E0]]="activeSubTab() === 'expenses'"
            [class.text-white]="activeSubTab() === 'expenses'"
            [class.bg-white]="activeSubTab() !== 'expenses'"
            [class.text-[#64748B]]="activeSubTab() !== 'expenses'"
            [class.dark:bg-[#1C2434]]="activeSubTab() !== 'expenses'"
            [class.dark:text-[#8A99AD]]="activeSubTab() !== 'expenses'"
            class="rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Direct Expenses & Receipts</span>
            <span class="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">{{ expenses().length }}</span>
          </button>

          <button
            type="button"
            (click)="activeSubTab.set('contractors')"
            [class.bg-[#3C50E0]]="activeSubTab() === 'contractors'"
            [class.text-white]="activeSubTab() === 'contractors'"
            [class.bg-white]="activeSubTab() !== 'contractors'"
            [class.text-[#64748B]]="activeSubTab() !== 'contractors'"
            [class.dark:bg-[#1C2434]]="activeSubTab() !== 'contractors'"
            [class.dark:text-[#8A99AD]]="activeSubTab() !== 'contractors'"
            class="rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <span>1099 Contractors</span>
          </button>

          <button
            type="button"
            (click)="activeSubTab.set('unbilled')"
            [class.bg-[#3C50E0]]="activeSubTab() === 'unbilled'"
            [class.text-white]="activeSubTab() === 'unbilled'"
            [class.bg-white]="activeSubTab() !== 'unbilled'"
            [class.text-[#64748B]]="activeSubTab() !== 'unbilled'"
            [class.dark:bg-[#1C2434]]="activeSubTab() !== 'unbilled'"
            [class.dark:text-[#8A99AD]]="activeSubTab() !== 'unbilled'"
            class="rounded-lg px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Unbilled Client Expenses</span>
            @if (unbilledCount() > 0) {
              <span class="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">{{ unbilledCount() }}</span>
            }
          </button>
        </div>

        <div class="relative hidden sm:block w-56">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search records..."
            class="w-full rounded-lg border border-[#E2E8F0] bg-white py-1.5 px-3 text-xs text-slate-800 placeholder:text-[#64748B] focus:border-[#3C50E0] focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white"
          />
        </div>
      </div>

      <!-- 4. SUB-TAB 1: VENDOR BILLS (ACCOUNTS PAYABLE) -->
      @if (activeSubTab() === 'bills') {
        <div class="rounded-xl border border-[#E2E8F0] bg-white shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#E2E8F0] dark:border-[#2E3A47] bg-[#F8FAFC] dark:bg-[#1A222C] text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                  <th class="py-3 px-5">Bill #</th>
                  <th class="py-3 px-5">Vendor / Supplier</th>
                  <th class="py-3 px-5">Bill Date</th>
                  <th class="py-3 px-5">Due Date</th>
                  <th class="py-3 px-5">Total</th>
                  <th class="py-3 px-5">Balance Due</th>
                  <th class="py-3 px-5">Status</th>
                  <th class="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47] text-xs">
                @for (bill of filteredBills(); track bill.id) {
                  <tr class="hover:bg-[#F8FAFC] dark:hover:bg-[#1A222C]/60 transition-colors">
                    <td class="py-3.5 px-5 font-mono font-bold text-[#3C50E0] dark:text-[#6574f8]">
                      {{ bill.bill_number }}
                    </td>
                    <td class="py-3.5 px-5">
                      <div class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{{ bill.vendor_name || 'Vendor' }}</span>
                        @if (bill.is_1099_contractor) {
                          <span class="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">1099</span>
                        }
                      </div>
                      <div class="text-[11px] text-[#64748B] dark:text-[#8A99AD]">
                        {{ bill.vendor_email || 'No email' }}
                      </div>
                    </td>
                    <td class="py-3.5 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {{ bill.bill_date }}
                    </td>
                    <td class="py-3.5 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {{ bill.due_date }}
                    </td>
                    <td class="py-3.5 px-5 font-mono font-semibold text-slate-900 dark:text-white">
                      {{ formatMoney(bill.total_amount) }}
                    </td>
                    <td class="py-3.5 px-5 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {{ formatMoney(bill.balance_due) }}
                    </td>
                    <td class="py-3.5 px-5">
                      @switch (bill.status) {
                        @case ('paid') {
                          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Paid
                          </span>
                        }
                        @case ('partially_paid') {
                          <span class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            Partially Paid
                          </span>
                        }
                        @default {
                          <span class="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Open
                          </span>
                        }
                      }
                    </td>
                    <td class="py-3.5 px-5 text-right">
                      @if (bill.status !== 'paid') {
                        <button
                          type="button"
                          (click)="openPayBillModal(bill)"
                          class="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                        >
                          Pay Bill
                        </button>
                      } @else {
                        <span class="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Settled</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="py-12 text-center text-slate-500">
                      No vendor bills recorded. Click <strong>"+ Add Vendor Bill"</strong> to record supplier payables.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- 5. SUB-TAB 2: DIRECT EXPENSES & RECEIPTS -->
      @if (activeSubTab() === 'expenses') {
        <div class="rounded-xl border border-[#E2E8F0] bg-white shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#E2E8F0] dark:border-[#2E3A47] bg-[#F8FAFC] dark:bg-[#1A222C] text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                  <th class="py-3 px-5">Date</th>
                  <th class="py-3 px-5">Merchant / Payee</th>
                  <th class="py-3 px-5">Category & GL Account</th>
                  <th class="py-3 px-5">Description</th>
                  <th class="py-3 px-5">Billable?</th>
                  <th class="py-3 px-5">Amount</th>
                  <th class="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47] text-xs">
                @for (exp of filteredExpenses(); track exp.id) {
                  <tr class="hover:bg-[#F8FAFC] dark:hover:bg-[#1A222C]/60 transition-colors">
                    <td class="py-3.5 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {{ exp.expense_date }}
                    </td>
                    <td class="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                      {{ exp.merchant_name }}
                    </td>
                    <td class="py-3.5 px-5">
                      <span class="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {{ exp.category || 'General' }}
                      </span>
                    </td>
                    <td class="py-3.5 px-5 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                      {{ exp.description || '—' }}
                    </td>
                    <td class="py-3.5 px-5">
                      @if (exp.is_billable) {
                        <span class="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          Billable ({{ formatMoney(exp.billable_amount || exp.amount) }})
                        </span>
                      } @else {
                        <span class="text-slate-400 text-[11px]">Internal</span>
                      }
                    </td>
                    <td class="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                      {{ formatMoney(exp.amount) }}
                    </td>
                    <td class="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        (click)="deleteExpense(exp.id)"
                        class="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete Expense"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-12 text-center text-slate-500">
                      No expenses logged yet. Click <strong>"Record Expense (OCR)"</strong> to upload receipts.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- 6. SUB-TAB 3: 1099 CONTRACTOR COMPLIANCE -->
      @if (activeSubTab() === 'contractors') {
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-4">
          <div class="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-3">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">IRS 1099-NEC Nonemployee Compensation Summary</h3>
              <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
                Automatically identifies independent contractors exceeding the annual $600 reporting threshold.
              </p>
            </div>
            <span class="rounded bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Tax Year 2026
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-[#E2E8F0] dark:border-[#2E3A47] text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                  <th class="py-2.5 px-4">Contractor / Business Name</th>
                  <th class="py-2.5 px-4">Tax ID (EIN/SSN)</th>
                  <th class="py-2.5 px-4">Bill Payments</th>
                  <th class="py-2.5 px-4">Direct Expenses</th>
                  <th class="py-2.5 px-4">Total Paid (YTD)</th>
                  <th class="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47]">
                @for (c of report1099()?.contractors; track c.id) {
                  <tr class="hover:bg-[#F8FAFC] dark:hover:bg-[#1A222C]/60">
                    <td class="py-3 px-4 font-semibold text-slate-900 dark:text-white">{{ c.name }}</td>
                    <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{{ c.tax_id || 'Missing W-9' }}</td>
                    <td class="py-3 px-4 font-mono">{{ formatMoney(c.bill_payments) }}</td>
                    <td class="py-3 px-4 font-mono">{{ formatMoney(c.direct_expenses) }}</td>
                    <td class="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{{ formatMoney(c.total_paid) }}</td>
                    <td class="py-3 px-4">
                      @if (c.threshold_met) {
                        <span class="rounded bg-rose-500/10 px-2 py-0.5 font-bold text-rose-600 dark:text-rose-400">
                          Form 1099 Required (≥ $600)
                        </span>
                      } @else {
                        <span class="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-500">
                          Below Threshold
                        </span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- 7. SUB-TAB 4: UNBILLED CLIENT EXPENSES -->
      @if (activeSubTab() === 'unbilled') {
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-4">
          <div class="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-3">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Unbilled Client Expenses Queue</h3>
              <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
                Pass-through client reimbursables with markup applied, ready to attach to AR invoices.
              </p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-[#E2E8F0] dark:border-[#2E3A47] text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                  <th class="py-2.5 px-4">Expense Date</th>
                  <th class="py-2.5 px-4">Client</th>
                  <th class="py-2.5 px-4">Merchant / Item</th>
                  <th class="py-2.5 px-4">Cost</th>
                  <th class="py-2.5 px-4">Markup</th>
                  <th class="py-2.5 px-4">Billable to Client</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47]">
                @for (u of unbilledList(); track u.id) {
                  <tr class="hover:bg-[#F8FAFC] dark:hover:bg-[#1A222C]/60">
                    <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{{ u.expense_date }}</td>
                    <td class="py-3 px-4 font-semibold text-slate-900 dark:text-white">{{ u.client_name || 'Client' }}</td>
                    <td class="py-3 px-4 text-slate-700 dark:text-slate-300">{{ u.merchant_name }} - {{ u.description }}</td>
                    <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{{ formatMoney(u.amount) }}</td>
                    <td class="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">+{{ u.markup_percent || 0 }}%</td>
                    <td class="py-3 px-4 font-mono font-bold text-[#3C50E0]">{{ formatMoney(u.billable_amount || u.amount) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-8 text-center text-slate-500">
                      No unbilled expenses currently pending.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL 1: RECORD EXPENSE & RECEIPT OCR -->
      @if (showRecordExpenseModal()) {
        <div 
          (click)="showRecordExpenseModal.set(false)"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            (click)="$event.stopPropagation()"
            class="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-[#1C2434] border border-[#E2E8F0] dark:border-[#2E3A47] cursor-default"
          >
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Record Expense & Receipt OCR</h3>
                <p class="text-xs text-[#64748B] dark:text-[#8A99AD]">Extract receipt fields instantly or enter details manually.</p>
              </div>
              <button
                type="button"
                (click)="showRecordExpenseModal.set(false)"
                class="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- OCR 1-Click Simulation Strip -->
            <div class="p-6 bg-[#F8FAFC] dark:bg-[#1A222C] border-b border-[#E2E8F0] dark:border-[#2E3A47]">
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD] block mb-2">
                1-Click Simulated Receipt Scanner (OCR Pipeline):
              </span>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  (click)="triggerSampleOCR('aws')"
                  class="rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs font-semibold text-slate-800 hover:border-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white cursor-pointer shadow-xs"
                >
                  AWS Cloud ($148.50)
                </button>
                <button
                  type="button"
                  (click)="triggerSampleOCR('uber')"
                  class="rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs font-semibold text-slate-800 hover:border-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white cursor-pointer shadow-xs"
                >
                  Uber Ride ($42.30)
                </button>
                <button
                  type="button"
                  (click)="triggerSampleOCR('staples')"
                  class="rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs font-semibold text-slate-800 hover:border-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white cursor-pointer shadow-xs"
                >
                  Staples Office ($89.88)
                </button>
              </div>
              @if (ocrConfidence() > 0) {
                <div class="mt-2.5 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>✓ Extracted with {{ (ocrConfidence() * 100).toFixed(0) }}% OCR confidence score</span>
                </div>
              }
            </div>

            <form (ngSubmit)="saveExpense()" class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Merchant / Payee
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="expMerchant"
                    name="expMerchant"
                    required
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 focus:border-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Total Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    [(ngModel)]="expAmount"
                    name="expAmount"
                    required
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:border-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="expDate"
                    name="expDate"
                    required
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="expCategory"
                    name="expCategory"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  [(ngModel)]="expDescription"
                  name="expDescription"
                  placeholder="Business rationale / memo"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>

              <!-- Billable Section -->
              <div class="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 dark:border-[#2E3A47] dark:bg-[#1A222C]">
                <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    [(ngModel)]="expIsBillable"
                    name="expIsBillable"
                    class="rounded text-[#3C50E0]"
                  />
                  <span>Billable Reimbursable to Client</span>
                </label>
                @if (expIsBillable) {
                  <div class="mt-3 flex items-center gap-3">
                    <div class="flex-1">
                      <input
                        type="text"
                        [(ngModel)]="expClientName"
                        name="expClientName"
                        placeholder="Client name"
                        class="w-full rounded-lg border border-[#E2E8F0] bg-white py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white"
                      />
                    </div>
                    <div class="w-32 flex items-center gap-1 text-xs">
                      <span class="text-slate-500">+%</span>
                      <input
                        type="number"
                        [(ngModel)]="expMarkupPercent"
                        name="expMarkupPercent"
                        placeholder="15"
                        class="w-full rounded-lg border border-[#E2E8F0] bg-white py-1.5 px-2 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white"
                      />
                    </div>
                  </div>
                }
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] dark:border-[#2E3A47] flex justify-end gap-2">
                <button
                  type="button"
                  (click)="showRecordExpenseModal.set(false)"
                  class="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-[#8A99AD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="rounded-lg bg-[#3C50E0] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#3444bf] cursor-pointer"
                >
                  Save & Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 2: ADD VENDOR BILL (AP) -->
      @if (showCreateBillModal()) {
        <div 
          (click)="showCreateBillModal.set(false)"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            (click)="$event.stopPropagation()"
            class="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-[#1C2434] border border-[#E2E8F0] dark:border-[#2E3A47] cursor-default"
          >
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Record Vendor Bill (Accounts Payable)</h3>
                <p class="text-xs text-[#64748B] dark:text-[#8A99AD]">Logs supplier payable and debits expense account in General Ledger.</p>
              </div>
              <button
                type="button"
                (click)="showCreateBillModal.set(false)"
                class="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form (ngSubmit)="saveBill()" class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Vendor / Supplier
                </label>
                <select
                  [(ngModel)]="billVendorId"
                  name="billVendorId"
                  required
                  class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 focus:border-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                >
                  @for (v of vendors(); track v.id) {
                    <option [value]="v.id">{{ v.name }} {{ v.is_1099_contractor ? '(1099)' : '' }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Bill Number
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="billNumber"
                    name="billNumber"
                    required
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs font-mono text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Total Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    [(ngModel)]="billTotal"
                    name="billTotal"
                    required
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs font-mono font-bold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Bill Date
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="billDate"
                    name="billDate"
                    required
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="billDueDate"
                    name="billDueDate"
                    required
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Item Description / Work Scope
                </label>
                <input
                  type="text"
                  [(ngModel)]="billNotes"
                  name="billNotes"
                  placeholder="e.g. Q4 Cloud migration consulting"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] dark:border-[#2E3A47] flex justify-end gap-2">
                <button
                  type="button"
                  (click)="showCreateBillModal.set(false)"
                  class="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-[#8A99AD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="rounded-lg bg-[#3C50E0] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#3444bf] cursor-pointer"
                >
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 3: PAY VENDOR BILL -->
      @if (showPayBillModal() && selectedBillToPay(); as bill) {
        <div 
          (click)="showPayBillModal.set(false)"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            (click)="$event.stopPropagation()"
            class="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-[#1C2434] border border-[#E2E8F0] dark:border-[#2E3A47] cursor-default"
          >
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Pay Vendor Bill</h3>
                <p class="text-xs text-[#64748B] dark:text-[#8A99AD]">Bill: {{ bill.bill_number }} to {{ bill.vendor_name }}</p>
              </div>
              <button
                type="button"
                (click)="showPayBillModal.set(false)"
                class="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form (ngSubmit)="submitPayBill()" class="p-6 space-y-4">
              <div class="rounded-lg bg-[#F8FAFC] p-3 dark:bg-[#1A222C] border border-[#E2E8F0] dark:border-[#2E3A47]">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-500">Remaining Balance:</span>
                  <span class="font-mono font-bold text-rose-600 dark:text-rose-400">{{ formatMoney(bill.balance_due) }}</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Disbursement Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  [(ngModel)]="payAmount"
                  name="payAmount"
                  [max]="bill.balance_due"
                  required
                  class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs font-mono font-bold text-slate-900 focus:border-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  [(ngModel)]="payMethod"
                  name="payMethod"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                >
                  <option value="ach">ACH Direct Deposit / Bank Wire</option>
                  <option value="credit_card">Business Corporate Card</option>
                  <option value="check">Company Check</option>
                </select>
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] dark:border-[#2E3A47] flex justify-end gap-2">
                <button
                  type="button"
                  (click)="showPayBillModal.set(false)"
                  class="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-[#8A99AD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 cursor-pointer"
                >
                  Record Payment & Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 4: NEW VENDOR -->
      @if (showAddVendorModal()) {
        <div 
          (click)="showAddVendorModal.set(false)"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            (click)="$event.stopPropagation()"
            class="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-[#1C2434] border border-[#E2E8F0] dark:border-[#2E3A47] cursor-default"
          >
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">Add Supplier / Contractor</h3>
                <p class="text-xs text-[#64748B] dark:text-[#8A99AD]">Save supplier details and 1099 compliance tracking.</p>
              </div>
              <button
                type="button"
                (click)="showAddVendorModal.set(false)"
                class="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form (ngSubmit)="saveVendor()" class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  [(ngModel)]="vName"
                  name="vName"
                  required
                  placeholder="e.g. Apex DevOps Consulting LLC"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    [(ngModel)]="vEmail"
                    name="vEmail"
                    placeholder="billing@vendor.com"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Tax ID (EIN/SSN)
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="vTaxId"
                    name="vTaxId"
                    placeholder="XX-XXXXXXX"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs font-mono text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
              </div>

              <div class="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 dark:border-[#2E3A47] dark:bg-[#1A222C]">
                <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    [(ngModel)]="vIs1099"
                    name="vIs1099"
                    class="rounded text-[#3C50E0]"
                  />
                  <span>1099 Independent Contractor (Requires W-9)</span>
                </label>
              </div>

              <div class="pt-3 border-t border-[#E2E8F0] dark:border-[#2E3A47] flex justify-end gap-2">
                <button
                  type="button"
                  (click)="showAddVendorModal.set(false)"
                  class="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-[#8A99AD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="rounded-lg bg-[#3C50E0] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#3444bf] cursor-pointer"
                >
                  Add Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class ExpensesComponent {
  expenseService = inject(ExpenseService);
  auth = inject(AuthService);

  activeSubTab = signal<'bills' | 'expenses' | 'contractors' | 'unbilled'>('bills');
  searchQuery = signal<string>('');

  // Modals state
  showRecordExpenseModal = signal<boolean>(false);
  showCreateBillModal = signal<boolean>(false);
  showPayBillModal = signal<boolean>(false);
  showAddVendorModal = signal<boolean>(false);

  selectedBillToPay = signal<Bill | null>(null);

  // Expense form
  expMerchant = '';
  expAmount = 148.50;
  expDate = new Date().toISOString().split('T')[0];
  expCategory = 'Software & Cloud Hosting';
  expDescription = 'AWS Production Compute & RDS';
  expIsBillable = false;
  expClientName = '';
  expMarkupPercent = 15;
  ocrConfidence = signal<number>(0);

  // Bill form
  billVendorId = '';
  billNumber = `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  billDate = new Date().toISOString().split('T')[0];
  billDueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  billTotal = 1500.00;
  billNotes = 'Technical consulting services sprint';

  // Pay bill form
  payAmount = 0;
  payMethod = 'ach';

  // Vendor form
  vName = '';
  vEmail = '';
  vTaxId = '';
  vIs1099 = true;

  // Computed signals
  expenses = this.expenseService.expenses;
  bills = this.expenseService.bills;
  vendors = this.expenseService.vendors;
  unbilledList = this.expenseService.unbilledExpenses;
  report1099 = this.expenseService.report1099;

  openBillsCount = computed(() => {
    return this.bills().filter(b => ['open', 'partially_paid', 'overdue'].includes(b.status)).length;
  });

  totalApBalance = computed(() => {
    return this.bills()
      .filter(b => ['open', 'partially_paid', 'overdue'].includes(b.status))
      .reduce((s, b) => s + (Number(b.balance_due) || 0), 0);
  });

  totalExpensesAmount = computed(() => {
    return this.expenses().reduce((s, e) => s + (Number(e.amount) || 0), 0);
  });

  unbilledTotalAmount = computed(() => {
    return this.unbilledList().reduce((s, e) => s + (Number(e.billable_amount || e.amount) || 0), 0);
  });

  unbilledCount = computed(() => this.unbilledList().length);

  contractor1099Total = computed(() => {
    return this.report1099()?.total1099Payments || 0;
  });

  qualifying1099Count = computed(() => {
    return this.report1099()?.qualifyingCount || 0;
  });

  filteredBills = computed(() => {
    let list = this.bills();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(b =>
        b.bill_number.toLowerCase().includes(q) ||
        (b.vendor_name && b.vendor_name.toLowerCase().includes(q))
      );
    }
    return list;
  });

  filteredExpenses = computed(() => {
    let list = this.expenses();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(e =>
        e.merchant_name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return list;
  });

  formatMoney(val: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val || 0);
  }

  openRecordExpenseModal() {
    this.ocrConfidence.set(0);
    this.showRecordExpenseModal.set(true);
  }

  openCreateBillModal() {
    if (this.vendors().length > 0) {
      this.billVendorId = this.vendors()[0].id;
    }
    this.billNumber = `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    this.showCreateBillModal.set(true);
  }

  openPayBillModal(bill: Bill) {
    this.selectedBillToPay.set(bill);
    this.payAmount = bill.balance_due;
    this.showPayBillModal.set(true);
  }

  openAddVendorModal() {
    this.vName = '';
    this.vEmail = '';
    this.vTaxId = '';
    this.vIs1099 = true;
    this.showAddVendorModal.set(true);
  }

  async triggerSampleOCR(type: 'aws' | 'uber' | 'staples') {
    const res = await this.expenseService.scanReceipt({ sampleType: type });
    this.expMerchant = res.merchant;
    this.expAmount = res.amount;
    this.expDate = res.date;
    this.expCategory = res.category;
    this.expDescription = `${res.category} expense at ${res.merchant}`;
    this.ocrConfidence.set(res.confidence);
  }

  async saveExpense() {
    await this.expenseService.createExpense({
      merchant_name: this.expMerchant,
      amount: this.expAmount,
      expense_date: this.expDate,
      category: this.expCategory,
      description: this.expDescription,
      is_billable: this.expIsBillable,
      markup_percent: this.expIsBillable ? this.expMarkupPercent : 0,
      client_name: this.expClientName
    });
    this.showRecordExpenseModal.set(false);
  }

  async saveBill() {
    const v = this.vendors().find(vnd => vnd.id === this.billVendorId);
    await this.expenseService.createBill({
      vendor_id: this.billVendorId,
      vendor_name: v ? v.name : 'Vendor',
      bill_number: this.billNumber,
      bill_date: this.billDate,
      due_date: this.billDueDate,
      total_amount: this.billTotal,
      subtotal: this.billTotal,
      notes: this.billNotes
    });
    this.showCreateBillModal.set(false);
  }

  async submitPayBill() {
    const bill = this.selectedBillToPay();
    if (!bill) return;

    await this.expenseService.payBill(bill.id, {
      amount: this.payAmount,
      payment_method: this.payMethod,
      payment_date: new Date().toISOString().split('T')[0]
    });
    this.showPayBillModal.set(false);
  }

  async saveVendor() {
    if (!this.vName.trim()) return;
    await this.expenseService.createVendor({
      name: this.vName,
      email: this.vEmail,
      tax_id: this.vTaxId,
      is_1099_contractor: this.vIs1099
    });
    this.showAddVendorModal.set(false);
  }

  async deleteExpense(id: string) {
    if (confirm('Delete this expense record?')) {
      await this.expenseService.deleteExpense(id);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showRecordExpenseModal.set(false);
    this.showCreateBillModal.set(false);
    this.showPayBillModal.set(false);
    this.showAddVendorModal.set(false);
  }
}
