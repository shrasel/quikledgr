import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice } from '../../core/models/invoice.model';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- 1. HEADER & ACTIONS -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#8A99AD] mb-1">
            <span>QuikLedgr</span>
            <span class="text-slate-400">/</span>
            <span class="text-[#3C50E0]">Invoices</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Smart Invoicing & Accounts Receivable
          </h1>
          <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
            Manage, generate, and reconcile enterprise client billing and receivables.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="invoiceService.refresh()"
            class="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            <span>Sync</span>
          </button>

          <button
            type="button"
            (click)="onNewInvoice.emit()"
            class="inline-flex items-center gap-2 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      <!-- 2. QUICK STATS SUMMARY STRIP -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
          <span class="text-xs font-medium text-[#64748B] dark:text-[#8A99AD]">Total Receivables</span>
          <h4 class="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {{ formatMoney(totalReceivables()) }}
          </h4>
          <span class="text-[11px] text-[#64748B] dark:text-[#8A99AD] mt-1 block">
            Across {{ invoices().length }} total billing documents
          </span>
        </div>

        <div class="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
          <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Collected Cash</span>
          <h4 class="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {{ formatMoney(paidAmount()) }}
          </h4>
          <span class="text-[11px] text-[#64748B] dark:text-[#8A99AD] mt-1 block">
            {{ paidCount() }} invoices settled
          </span>
        </div>

        <div class="rounded-xl border border-[#E2E8F0] bg-white p-4.5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
          <span class="text-xs font-medium text-amber-500">Outstanding Balance</span>
          <h4 class="text-xl font-bold font-mono text-amber-500 mt-1">
            {{ formatMoney(pendingAmount()) }}
          </h4>
          <span class="text-[11px] text-[#64748B] dark:text-[#8A99AD] mt-1 block">
            {{ pendingCount() }} invoices pending payment
          </span>
        </div>
      </div>

      <!-- 3. INVOICES TABLE CONTAINER -->
      <div class="rounded-xl border border-[#E2E8F0] bg-white shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] overflow-hidden">
        <!-- Filter and Search Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-[#E2E8F0] dark:border-[#2E3A47] bg-[#F8FAFC] dark:bg-[#1A222C]">
          <!-- Status Pills -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              (click)="selectedStatus.set('ALL')"
              [class.bg-[#3C50E0]]="selectedStatus() === 'ALL'"
              [class.text-white]="selectedStatus() === 'ALL'"
              [class.bg-white]="selectedStatus() !== 'ALL'"
              [class.text-[#64748B]]="selectedStatus() !== 'ALL'"
              [class.dark:bg-[#24303F]]="selectedStatus() !== 'ALL'"
              [class.dark:text-[#8A99AD]]="selectedStatus() !== 'ALL'"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              All ({{ invoices().length }})
            </button>
            <button
              type="button"
              (click)="selectedStatus.set('PAID')"
              [class.bg-emerald-600]="selectedStatus() === 'PAID'"
              [class.text-white]="selectedStatus() === 'PAID'"
              [class.bg-white]="selectedStatus() !== 'PAID'"
              [class.text-[#64748B]]="selectedStatus() !== 'PAID'"
              [class.dark:bg-[#24303F]]="selectedStatus() !== 'PAID'"
              [class.dark:text-[#8A99AD]]="selectedStatus() !== 'PAID'"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Paid ({{ paidCount() }})
            </button>
            <button
              type="button"
              (click)="selectedStatus.set('PENDING')"
              [class.bg-amber-500]="selectedStatus() === 'PENDING'"
              [class.text-white]="selectedStatus() === 'PENDING'"
              [class.bg-white]="selectedStatus() !== 'PENDING'"
              [class.text-[#64748B]]="selectedStatus() !== 'PENDING'"
              [class.dark:bg-[#24303F]]="selectedStatus() !== 'PENDING'"
              [class.dark:text-[#8A99AD]]="selectedStatus() !== 'PENDING'"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Pending ({{ pendingCount() }})
            </button>
          </div>

          <!-- Search Input -->
          <div class="relative w-full sm:w-64">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Filter by invoice # or client..."
              class="w-full rounded-lg border border-[#E2E8F0] bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-[#64748B] focus:border-[#3C50E0] focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white dark:placeholder:text-[#8A99AD] transition-all"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-[#E2E8F0] dark:border-[#2E3A47] bg-[#F8FAFC] dark:bg-[#1A222C] text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                <th class="py-3 px-5">Invoice</th>
                <th class="py-3 px-5">Client</th>
                <th class="py-3 px-5">Date</th>
                <th class="py-3 px-5">Due Date</th>
                <th class="py-3 px-5">Amount</th>
                <th class="py-3 px-5">Status</th>
                <th class="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47] text-xs">
              @for (inv of filteredInvoices(); track inv.id) {
                <tr class="hover:bg-[#F8FAFC] dark:hover:bg-[#1A222C]/60 transition-colors">
                  <!-- Invoice ID -->
                  <td class="py-3.5 px-5 font-mono font-bold text-[#3C50E0] dark:text-[#6574f8]">
                    #{{ inv.invoiceNumber || inv.id }}
                  </td>

                  <!-- Client -->
                  <td class="py-3.5 px-5">
                    <div class="font-semibold text-slate-900 dark:text-white">
                      {{ getClientName(inv) }}
                    </div>
                    <div class="text-[11px] text-[#64748B] dark:text-[#8A99AD]">
                      {{ inv.client?.email || inv.client_email || 'billing@client.com' }}
                    </div>
                  </td>

                  <!-- Issue Date -->
                  <td class="py-3.5 px-5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {{ formatDate(inv.invoiceDate || inv.issueDate) }}
                  </td>

                  <!-- Due Date -->
                  <td class="py-3.5 px-5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {{ formatDate(inv.dueDate) }}
                  </td>

                  <!-- Amount -->
                  <td class="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                    {{ formatMoney(inv.total) }}
                  </td>

                  <!-- Status Badge -->
                  <td class="py-3.5 px-5">
                    @if (isPaid(inv.status)) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Paid
                      </span>
                    } @else if (isPending(inv.status)) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Pending
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Draft
                      </span>
                    }
                  </td>

                  <!-- Action Buttons -->
                  <td class="py-3.5 px-5 text-right">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        (click)="previewInvoice(inv)"
                        title="View / Print Invoice"
                        class="p-1.5 rounded-md text-[#64748B] hover:text-[#3C50E0] hover:bg-[#F1F5F9] dark:text-[#8A99AD] dark:hover:text-white dark:hover:bg-[#24303F] transition-colors cursor-pointer"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        (click)="deleteInvoice(inv.id)"
                        title="Delete Invoice"
                        class="p-1.5 rounded-md text-[#64748B] hover:text-rose-600 hover:bg-rose-50 dark:text-[#8A99AD] dark:hover:text-rose-400 dark:hover:bg-rose-900/20 transition-colors cursor-pointer"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-12 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <div class="h-12 w-12 rounded-full bg-[#3C50E0]/10 flex items-center justify-center text-[#3C50E0] mb-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                        </svg>
                      </div>
                      <h4 class="text-sm font-bold text-slate-800 dark:text-white">No invoices found</h4>
                      <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1 max-w-sm">
                        No billing documents match your selected filter. Click below to draft an invoice.
                      </p>
                      <button
                        type="button"
                        (click)="onNewInvoice.emit()"
                        class="mt-4 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all cursor-pointer"
                      >
                        + Create First Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class InvoicesComponent {
  invoiceService = inject(InvoiceService);
  auth = inject(AuthService);

  onNewInvoice = output<void>();

  invoices = this.invoiceService.invoices;
  selectedStatus = signal<'ALL' | 'PAID' | 'PENDING'>('ALL');
  searchQuery = signal('');

  filteredInvoices = computed(() => {
    let list = this.invoices();
    const st = this.selectedStatus();
    if (st === 'PAID') {
      list = list.filter(i => this.isPaid(i.status));
    } else if (st === 'PENDING') {
      list = list.filter(i => this.isPending(i.status));
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(i =>
        (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(q)) ||
        (this.getClientName(i).toLowerCase().includes(q))
      );
    }
    return list;
  });

  totalReceivables = computed(() => {
    return this.invoices().reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  });

  paidAmount = computed(() => {
    return this.invoices()
      .filter(i => this.isPaid(i.status))
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  });

  paidCount = computed(() => {
    return this.invoices().filter(i => this.isPaid(i.status)).length;
  });

  pendingAmount = computed(() => {
    return this.invoices()
      .filter(i => this.isPending(i.status))
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  });

  pendingCount = computed(() => {
    return this.invoices().filter(i => this.isPending(i.status)).length;
  });

  isPaid(status?: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'paid';
  }

  isPending(status?: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'sent' || s === 'pending' || s === 'partially_paid';
  }

  getClientName(inv: Invoice): string {
    return inv.client?.companyName || inv.client?.name || inv.client_name || 'Walk-in Client';
  }

  formatMoney(val: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val || 0);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  previewInvoice(inv: Invoice) {
    this.invoiceService.selectInvoice(inv);
    alert(`Viewing Invoice #${inv.invoiceNumber || inv.id} for ${this.getClientName(inv)}\nTotal: ${this.formatMoney(inv.total)}`);
  }

  async deleteInvoice(id: string) {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await this.invoiceService.deleteInvoice(id);
    }
  }
}
