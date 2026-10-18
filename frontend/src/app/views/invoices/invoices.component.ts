import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { InvoiceTemplateService, InvoiceTemplateId } from '../../core/services/invoice-template.service';
import { InvoiceTemplateRendererComponent } from './components/invoice-template-renderer.component';
import { Invoice } from '../../core/models/invoice.model';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InvoiceTemplateRendererComponent],
  template: `
    <div class="space-y-6">
      <!-- 1. HEADER & ACTIONS -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#8A99AD] mb-1">
            <a routerLink="/dashboard" class="hover:text-[#3C50E0] transition-colors">QuikLedgr</a>
            <span class="text-slate-400">/</span>
            <span class="text-[#3C50E0]">Invoices</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Smart Invoicing & Accounts Receivable
          </h1>
          <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
            Manage, generate, and reconcile enterprise client billing and ledger receivables.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            (click)="refreshInvoices()"
            [disabled]="isRefreshing()"
            class="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all cursor-pointer disabled:opacity-50"
          >
            <svg class="w-3.5 h-3.5" [class.animate-spin]="isRefreshing()" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
            </svg>
            <span>Sync</span>
          </button>

          <a
            routerLink="/invoices/create"
            class="inline-flex items-center gap-2 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#3444bf] transition-all cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            <span>Create Invoice</span>
          </a>
        </div>
      </div>

      <!-- Toast Feedback Message -->
      @if (toastMessage()) {
        <div 
          [class]="toastType() === 'error' ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'"
          class="rounded-xl border p-4 text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in duration-200"
        >
          <div class="flex items-center gap-2">
            @if (toastType() === 'error') {
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
            } @else {
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            }
            <span>{{ toastMessage() }}</span>
          </div>
          <button (click)="toastMessage.set('')" class="hover:opacity-75 cursor-pointer">✕</button>
        </div>
      }

      <!-- 2. TAILADMIN 4 KPI STAT CARDS (Matches Dashboard Styling) -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- KPI 1: Total Receivables -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-[#3C50E0]/40 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3C50E0]/10 text-[#3C50E0] dark:bg-[#3C50E0]/20 font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="inline-flex items-center gap-1 rounded-full bg-[#3C50E0]/10 px-2.5 py-0.5 text-xs font-bold text-[#3C50E0]">
              {{ invoices().length }} Total
            </span>
          </div>

          <div class="mt-4">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ formatMoney(totalReceivables()) }}
            </h3>
            <p class="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Total Receivables
            </p>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Portfolio Scope</span>
            <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">Across {{ invoices().length }} documents</span>
          </div>
        </div>

        <!-- KPI 2: Realized Cash Collections -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-emerald-500/40 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {{ realizationRate() }}% Realized
            </span>
          </div>

          <div class="mt-4">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ formatMoney(paidAmount()) }}
            </h3>
            <p class="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Collected Cash
            </p>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Settled Invoices</span>
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ paidCount() }} Settled</span>
          </div>
        </div>

        <!-- KPI 3: Outstanding Receivables -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-amber-500/40 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            @if (overdueCount() > 0) {
              <span class="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                {{ overdueCount() }} Overdue
              </span>
            } @else {
              <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Healthy
              </span>
            }
          </div>

          <div class="mt-4">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ formatMoney(pendingAmount()) }}
            </h3>
            <p class="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Outstanding Balance (AR)
            </p>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Pending Payment</span>
            <span class="font-mono font-semibold text-slate-800 dark:text-slate-200">{{ pendingCount() }} Pending</span>
          </div>
        </div>

        <!-- KPI 4: Overdue Receivables -->
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] hover:border-rose-500/40 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 font-bold">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            @if (overdueCount() > 0) {
              <span class="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                Action Required
              </span>
            } @else {
              <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Zero Arrears
              </span>
            }
          </div>

          <div class="mt-4">
            <h3 class="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {{ overdueCount() > 0 ? formatMoney(overdueAmount()) : '$0.00' }}
            </h3>
            <p class="text-xs font-medium text-[#64748B] dark:text-[#8A99AD] mt-1">
              Overdue / Action Needed
            </p>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 dark:border-[#2E3A47] text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            <span>Arrears Status</span>
            <span class="font-mono font-semibold" [class.text-rose-600]="overdueCount() > 0" [class.dark:text-rose-400]="overdueCount() > 0" [class.text-emerald-600]="overdueCount() === 0" [class.dark:text-emerald-400]="overdueCount() === 0">
              {{ overdueCount() }} Overdue
            </span>
          </div>
        </div>
      </div>

      <!-- 3. INVOICES TABLE CONTAINER -->
      <div class="rounded-xl border border-[#E2E8F0] bg-white shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] overflow-hidden">
        
        <!-- Filter and Search Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-[#E2E8F0] dark:border-[#2E3A47] bg-[#F8FAFC] dark:bg-[#1A222C]">
          <!-- Status Filter Tabs -->
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
            <button
              type="button"
              (click)="selectedStatus.set('OVERDUE')"
              [class.bg-rose-600]="selectedStatus() === 'OVERDUE'"
              [class.text-white]="selectedStatus() === 'OVERDUE'"
              [class.bg-white]="selectedStatus() !== 'OVERDUE'"
              [class.text-[#64748B]]="selectedStatus() !== 'OVERDUE'"
              [class.dark:bg-[#24303F]]="selectedStatus() !== 'OVERDUE'"
              [class.dark:text-[#8A99AD]]="selectedStatus() !== 'OVERDUE'"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Overdue ({{ overdueCount() }})
            </button>
            <button
              type="button"
              (click)="selectedStatus.set('DRAFT')"
              [class.bg-slate-600]="selectedStatus() === 'DRAFT'"
              [class.text-white]="selectedStatus() === 'DRAFT'"
              [class.bg-white]="selectedStatus() !== 'DRAFT'"
              [class.text-[#64748B]]="selectedStatus() !== 'DRAFT'"
              [class.dark:bg-[#24303F]]="selectedStatus() !== 'DRAFT'"
              [class.dark:text-[#8A99AD]]="selectedStatus() !== 'DRAFT'"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Drafts ({{ draftCount() }})
            </button>
          </div>

          <!-- Search & Sort Controls -->
          <div class="flex items-center gap-2">
            <!-- Search Input -->
            <div class="relative w-full sm:w-64">
              <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search invoice #, client, email..."
                class="w-full rounded-lg border border-[#E2E8F0] bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-[#64748B] focus:border-[#3C50E0] focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white dark:placeholder:text-[#8A99AD] transition-all"
              />
              @if (searchQuery()) {
                <button
                  type="button"
                  (click)="searchQuery.set('')"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              }
            </div>

            <!-- Sort Dropdown -->
            <select
              [(ngModel)]="sortBy"
              class="rounded-lg border border-[#E2E8F0] bg-white py-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-slate-200 focus:outline-hidden"
            >
              <option value="NEWEST">Newest Date</option>
              <option value="OLDEST">Oldest Date</option>
              <option value="DUE_SOON">Due Date (Soonest)</option>
              <option value="AMOUNT_HIGH">Amount: High to Low</option>
              <option value="AMOUNT_LOW">Amount: Low to High</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-[#E2E8F0] dark:border-[#2E3A47] bg-[#F8FAFC] dark:bg-[#1A222C] text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                <th class="py-3 px-5">Invoice #</th>
                <th class="py-3 px-5">Client Name</th>
                <th class="py-3 px-5">Issue Date</th>
                <th class="py-3 px-5">Due Date</th>
                <th class="py-3 px-5">Total Amount</th>
                <th class="py-3 px-5">Balance Due</th>
                <th class="py-3 px-5">Status</th>
                <th class="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0] dark:divide-[#2E3A47] text-xs">
              @for (inv of filteredInvoices(); track inv.id) {
                <tr class="hover:bg-[#F8FAFC] dark:hover:bg-[#1A222C]/60 transition-colors">
                  <!-- Invoice ID -->
                  <td class="py-3.5 px-5">
                    <button
                      type="button"
                      (click)="openPreview(inv)"
                      class="font-mono font-bold text-[#3C50E0] dark:text-[#6574f8] hover:underline cursor-pointer text-left"
                      title="View invoice details"
                    >
                      #{{ inv.invoiceNumber || inv.id }}
                    </button>
                    @if (inv.servicePeriod) {
                      <span class="block text-[10px] text-[#64748B] dark:text-[#8A99AD] truncate max-w-[180px]">
                        {{ inv.servicePeriod }}
                      </span>
                    }
                  </td>

                  <!-- Client -->
                  <td class="py-3.5 px-5">
                    <div class="font-semibold text-slate-900 dark:text-white">
                      {{ getClientName(inv) }}
                    </div>
                    <div class="text-[11px] text-[#64748B] dark:text-[#8A99AD]">
                      {{ inv.client?.email || inv.client_email || '—' }}
                    </div>
                  </td>

                  <!-- Issue Date -->
                  <td class="py-3.5 px-5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {{ formatDate(inv.invoiceDate || inv.issueDate) }}
                  </td>

                  <!-- Due Date -->
                  <td class="py-3.5 px-5 font-mono text-[11px]">
                    <span [class]="isPastDue(inv) ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-300'">
                      {{ formatDate(inv.dueDate) }}
                    </span>
                    @if (isPastDue(inv)) {
                      <span class="block text-[9px] font-bold text-rose-500 uppercase">Overdue</span>
                    }
                  </td>

                  <!-- Amount -->
                  <td class="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white">
                    {{ formatMoney(inv.total, inv.currency) }}
                  </td>

                  <!-- Balance Due -->
                  <td class="py-3.5 px-5 font-mono text-xs">
                    @if (inv.balance_due !== undefined && inv.balance_due > 0) {
                      <span class="font-bold text-amber-500">{{ formatMoney(inv.balance_due, inv.currency) }}</span>
                    } @else if (isPaid(inv.status)) {
                      <span class="text-emerald-600 dark:text-emerald-400 font-semibold">$0.00 (Settled)</span>
                    } @else {
                      <span class="text-slate-700 dark:text-slate-300">{{ formatMoney(inv.total, inv.currency) }}</span>
                    }
                  </td>

                  <!-- Status Badge -->
                  <td class="py-3.5 px-5">
                    @if (isPaid(inv.status)) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Paid
                      </span>
                    } @else if (isPastDue(inv)) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        <span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                        Overdue
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
                      <!-- Quick View / Preview Modal -->
                      <button
                        type="button"
                        (click)="openPreview(inv)"
                        title="View / Print Invoice"
                        class="p-1.5 rounded-md text-[#64748B] hover:text-[#3C50E0] hover:bg-[#F1F5F9] dark:text-[#8A99AD] dark:hover:text-white dark:hover:bg-[#24303F] transition-colors cursor-pointer"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </button>

                      <!-- Edit Button -->
                      <a
                        [routerLink]="['/invoices', inv.id, 'edit']"
                        title="Edit Invoice"
                        class="p-1.5 rounded-md text-[#64748B] hover:text-[#3C50E0] hover:bg-[#F1F5F9] dark:text-[#8A99AD] dark:hover:text-white dark:hover:bg-[#24303F] transition-colors cursor-pointer"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                        </svg>
                      </a>

                      <!-- Mark Paid / Status toggle -->
                      @if (!isPaid(inv.status)) {
                        <button
                          type="button"
                          (click)="markAsPaid(inv)"
                          title="Mark as Paid"
                          class="p-1.5 rounded-md text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                          </svg>
                        </button>
                      }

                      <!-- Delete Invoice -->
                      <button
                        type="button"
                        (click)="promptDelete(inv)"
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
                  <td colspan="8" class="py-12 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <div class="h-12 w-12 rounded-full bg-[#3C50E0]/10 flex items-center justify-center text-[#3C50E0] mb-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                        </svg>
                      </div>
                      <h4 class="text-sm font-bold text-slate-800 dark:text-white">No invoices found</h4>
                      <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1 max-w-sm">
                        No billing documents match your selected query or filter. Click below to craft a professional invoice.
                      </p>
                      <a
                        routerLink="/invoices/create"
                        class="mt-4 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all cursor-pointer"
                      >
                        + Create First Invoice
                      </a>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 4. DELETE CONFIRMATION MODAL -->
    @if (invoiceToDelete()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1C2434] border border-[#E2E8F0] dark:border-[#2E3A47] space-y-4">
          <div class="flex items-center gap-3 text-rose-600">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">Delete Invoice?</h3>
              <p class="text-xs text-[#64748B] dark:text-[#8A99AD]">This action cannot be undone.</p>
            </div>
          </div>

          <div class="rounded-xl bg-[#F8FAFC] dark:bg-[#1A222C] p-3 text-xs space-y-1 font-mono">
            <p><span class="text-[#64748B] dark:text-[#8A99AD]">Invoice:</span> #{{ invoiceToDelete()?.invoiceNumber || invoiceToDelete()?.id }}</p>
            <p><span class="text-[#64748B] dark:text-[#8A99AD]">Client:</span> {{ getClientName(invoiceToDelete()!) }}</p>
            <p><span class="text-[#64748B] dark:text-[#8A99AD]">Amount:</span> {{ formatMoney(invoiceToDelete()!.total, invoiceToDelete()!.currency) }}</p>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-300">
            Deleting this invoice will permanently remove the record and reverse associated double-entry accounts receivable postings.
          </p>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              (click)="invoiceToDelete.set(null)"
              class="rounded-lg border border-[#E2E8F0] px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:text-slate-200 dark:hover:bg-[#24303F] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="executeDelete()"
              class="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs cursor-pointer"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    }

    <!-- 5. PREVIEW / PRINT MODAL (Supports World's 3 Best Templates) -->
    @if (previewingInvoice()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div class="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#F8FAFC] dark:bg-[#1A222C] shadow-2xl border border-[#E2E8F0] dark:border-[#2E3A47] flex flex-col">
          
          <!-- Modal Top Toolbar -->
          <div class="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-white dark:bg-[#1C2434] border-b border-[#E2E8F0] dark:border-[#2E3A47]">
            <div class="flex items-center gap-2.5">
              <span class="font-mono text-sm font-bold text-slate-900 dark:text-white">
                #{{ previewingInvoice()?.invoiceNumber || previewingInvoice()?.id }}
              </span>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full capitalize" [class]="isPaid(previewingInvoice()?.status) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'">
                {{ previewingInvoice()?.status }}
              </span>
            </div>

            <!-- Template Switcher Pills -->
            <div class="flex items-center gap-1 bg-slate-100 dark:bg-[#24303F] p-1 rounded-xl">
              <span class="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#8A99AD] px-2 hidden sm:inline">
                Template:
              </span>
              @for (tmpl of templateService.templates; track tmpl.id) {
                <button
                  type="button"
                  (click)="currentPreviewTemplate.set(tmpl.id)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  [ngClass]="currentPreviewTemplate() === tmpl.id 
                    ? 'bg-[#3C50E0] text-white shadow-xs font-bold' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
                >
                  {{ tmpl.name }}
                </button>
              }
            </div>

            <!-- Right Actions -->
            <div class="flex items-center gap-2">
              <a
                [routerLink]="['/invoices', previewingInvoice()?.id]"
                (click)="previewingInvoice.set(null)"
                title="Open Dedicated Full Page"
                class="hidden md:inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:hover:bg-[#24303F] cursor-pointer"
              >
                <span>Full Page ↗</span>
              </a>

              <button
                type="button"
                (click)="printInvoice()"
                class="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:hover:bg-[#24303F] cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24-1.056-.867-2.025-1.782-2.736a4.838 4.838 0 00-.816-.508 4.838 4.838 0 011.02-1.921 4.838 4.838 0 012.355-1.393M6.72 13.829a8.03 8.03 0 005.28 0m-5.28 0A8.04 8.04 0 0112 12m0 0a8.04 8.04 0 015.28 1.829m-5.28-1.829V3m0 0l-3 3m3-3l3 3"/>
                </svg>
                <span>Print</span>
              </button>

              <a
                [routerLink]="['/invoices', previewingInvoice()?.id, 'edit']"
                (click)="previewingInvoice.set(null)"
                class="inline-flex items-center gap-1 rounded-lg bg-[#3C50E0] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#3444bf] cursor-pointer"
              >
                Edit
              </a>

              <button
                type="button"
                (click)="previewingInvoice.set(null)"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Printable Modal Content Rendering Default or Selected Template -->
          <div class="p-4 sm:p-6 flex-1 overflow-y-auto">
            <app-invoice-template-renderer
              [invoice]="previewingInvoice()!"
              [template]="currentPreviewTemplate()"
            />
          </div>
        </div>
      </div>
    }
  `
})
export class InvoicesComponent {
  invoiceService = inject(InvoiceService);
  templateService = inject(InvoiceTemplateService);
  auth = inject(AuthService);
  router = inject(Router);

  currentPreviewTemplate = signal<InvoiceTemplateId>(this.templateService.defaultTemplate());
  invoices = this.invoiceService.invoices;
  selectedStatus = signal<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE' | 'DRAFT'>('ALL');
  searchQuery = signal<string>('');
  sortBy = signal<'NEWEST' | 'OLDEST' | 'DUE_SOON' | 'AMOUNT_HIGH' | 'AMOUNT_LOW'>('NEWEST');

  isRefreshing = signal<boolean>(false);
  invoiceToDelete = signal<Invoice | null>(null);
  previewingInvoice = signal<Invoice | null>(null);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');

  filteredInvoices = computed(() => {
    let list = [...this.invoices()];
    const st = this.selectedStatus();

    if (st === 'PAID') {
      list = list.filter(i => this.isPaid(i.status));
    } else if (st === 'PENDING') {
      list = list.filter(i => this.isPending(i.status) && !this.isPastDue(i));
    } else if (st === 'OVERDUE') {
      list = list.filter(i => this.isPastDue(i));
    } else if (st === 'DRAFT') {
      list = list.filter(i => (i.status || '').toLowerCase() === 'draft');
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(i =>
        (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(q)) ||
        (i.id && i.id.toLowerCase().includes(q)) ||
        (this.getClientName(i).toLowerCase().includes(q)) ||
        (i.client?.email && i.client.email.toLowerCase().includes(q)) ||
        (i.servicePeriod && i.servicePeriod.toLowerCase().includes(q)) ||
        (i.items && i.items.some(it => it.description && it.description.toLowerCase().includes(q)))
      );
    }

    // Sort
    const sort = this.sortBy();
    list.sort((a, b) => {
      const dateA = new Date(a.invoiceDate || a.issueDate || 0).getTime();
      const dateB = new Date(b.invoiceDate || b.issueDate || 0).getTime();
      const dueA = new Date(a.dueDate || 0).getTime();
      const dueB = new Date(b.dueDate || 0).getTime();
      const amtA = Number(a.total) || 0;
      const amtB = Number(b.total) || 0;

      if (sort === 'NEWEST') return dateB - dateA;
      if (sort === 'OLDEST') return dateA - dateB;
      if (sort === 'DUE_SOON') return dueA - dueB;
      if (sort === 'AMOUNT_HIGH') return amtB - amtA;
      if (sort === 'AMOUNT_LOW') return amtA - amtB;
      return 0;
    });

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

  realizationRate = computed(() => {
    const total = this.totalReceivables();
    return total > 0 ? Math.round((this.paidAmount() / total) * 100) : 0;
  });

  pendingAmount = computed(() => {
    return this.invoices()
      .filter(i => !this.isPaid(i.status) && (i.status || '').toLowerCase() !== 'draft')
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  });

  pendingCount = computed(() => {
    return this.invoices().filter(i => this.isPending(i.status)).length;
  });

  draftCount = computed(() => {
    return this.invoices().filter(i => (i.status || '').toLowerCase() === 'draft').length;
  });

  overdueCount = computed(() => {
    return this.invoices().filter(i => this.isPastDue(i)).length;
  });

  overdueAmount = computed(() => {
    return this.invoices()
      .filter(i => this.isPastDue(i))
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  });

  isPaid(status?: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'paid';
  }

  isPending(status?: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'sent' || s === 'pending' || s === 'partially_paid';
  }

  isPastDue(inv: Invoice): boolean {
    if (this.isPaid(inv.status) || (inv.status || '').toLowerCase() === 'draft') return false;
    if (!inv.dueDate) return false;
    const due = new Date(inv.dueDate);
    const now = new Date();
    return due < now;
  }

  getClientName(inv: Invoice): string {
    return inv.client?.companyName || inv.client?.name || inv.client_name || 'Walk-in Client';
  }

  formatMoney(val: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
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

  async refreshInvoices(): Promise<void> {
    this.isRefreshing.set(true);
    try {
      await this.invoiceService.refresh();
      this.toastMessage.set('Invoices synchronized with ledger.');
      this.toastType.set('success');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  openPreview(inv: Invoice): void {
    this.currentPreviewTemplate.set(this.templateService.defaultTemplate());
    this.previewingInvoice.set(inv);
  }

  printInvoice(): void {
    window.print();
  }

  async markAsPaid(inv: Invoice): Promise<void> {
    try {
      await this.invoiceService.updateStatus(inv.id, 'paid');
      this.toastMessage.set(`Invoice #${inv.invoiceNumber || inv.id} marked as Paid.`);
      this.toastType.set('success');
    } catch {
      this.toastMessage.set('Failed to update invoice status.');
      this.toastType.set('error');
    }
  }

  promptDelete(inv: Invoice): void {
    this.invoiceToDelete.set(inv);
  }

  async executeDelete(): Promise<void> {
    const inv = this.invoiceToDelete();
    if (!inv) return;

    try {
      await this.invoiceService.deleteInvoice(inv.id);
      this.toastMessage.set(`Invoice #${inv.invoiceNumber || inv.id} permanently deleted.`);
      this.toastType.set('success');
      this.invoiceToDelete.set(null);
    } catch (err: any) {
      this.toastMessage.set(err?.message || 'Failed to delete invoice.');
      this.toastType.set('error');
    }
  }
}
