import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice, InvoiceItem, InvoiceAdditionalCharge } from '../../core/models/invoice.model';

interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 pb-20">
      <!-- 1. TOP BREADCRUMB & ACTION BAR -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-16 z-20 bg-[#F1F5F9]/90 dark:bg-[#1A222C]/90 backdrop-blur-md py-3 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
        <div>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#8A99AD] mb-1">
            <a routerLink="/dashboard" class="hover:text-[#3C50E0] transition-colors">QuikLedgr</a>
            <span class="text-slate-400">/</span>
            <a routerLink="/invoices" class="hover:text-[#3C50E0] transition-colors">Invoices</a>
            <span class="text-slate-400">/</span>
            <span class="text-[#3C50E0] font-bold">{{ isEditMode() ? 'Edit #' + invoiceNumber : 'New Invoice' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {{ isEditMode() ? 'Edit Invoice' : 'Create Smart Invoice' }}
            </h1>
            <span
              [class]="getStatusBadgeClass(status)"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
            >
              <span class="h-1.5 w-1.5 rounded-full" [class]="getStatusDotClass(status)"></span>
              {{ status }}
            </span>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Toggle Live Preview -->
          <button
            type="button"
            (click)="togglePreview()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-slate-200 dark:hover:bg-[#24303F] transition-all cursor-pointer"
          >
            <svg class="w-4 h-4 text-[#3C50E0]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>{{ showPreview() ? 'Hide Preview' : 'Live Preview' }}</span>
          </button>

          <!-- Cancel / Back -->
          <a
            routerLink="/invoices"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#64748B] shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-[#8A99AD] dark:hover:bg-[#24303F] transition-all cursor-pointer"
          >
            Cancel
          </a>

          <!-- Save as Draft -->
          <button
            type="button"
            [disabled]="isSubmitting()"
            (click)="save('draft')"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#3C50E0]/30 bg-[#3C50E0]/10 px-3.5 py-2 text-xs font-bold text-[#3C50E0] hover:bg-[#3C50E0]/20 dark:bg-[#3C50E0]/20 dark:hover:bg-[#3C50E0]/30 transition-all cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>

          <!-- Finalize & Save / Send -->
          <button
            type="button"
            [disabled]="isSubmitting()"
            (click)="save('sent')"
            class="inline-flex items-center gap-2 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#3444bf] transition-all cursor-pointer disabled:opacity-50"
          >
            @if (isSubmitting()) {
              <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Saving...</span>
            } @else {
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
              </svg>
              <span>{{ isEditMode() ? 'Update & Post Invoice' : 'Finalize & Post Invoice' }}</span>
            }
          </button>
        </div>
      </div>

      <!-- Toast Feedback Message -->
      @if (feedbackMessage()) {
        <div 
          [class]="feedbackType() === 'error' ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'"
          class="rounded-xl border p-4 text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in duration-200"
        >
          <div class="flex items-center gap-2">
            @if (feedbackType() === 'error') {
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
            } @else {
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            }
            <span>{{ feedbackMessage() }}</span>
          </div>
          <button (click)="feedbackMessage.set('')" class="hover:opacity-75 cursor-pointer">✕</button>
        </div>
      }

      <!-- 2. MAIN LAYOUT: SPLIT VIEW (EDITOR + LIVE PREVIEW) -->
      <div class="grid grid-cols-1 gap-6" [class.lg:grid-cols-12]="showPreview()">
        
        <!-- INVOICE BUILDER FORM -->
        <div [class]="showPreview() ? 'lg:col-span-7' : 'w-full'" class="space-y-6">
          
          <!-- CARD 1: DOCUMENT HEADER & PRIMARY METRICS -->
          <div class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-4">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#3C50E0]">Commercial Billing Document</span>
                <input
                  type="text"
                  [(ngModel)]="documentTitle"
                  placeholder="Document Title (e.g. CONSULTING SERVICES INVOICE)"
                  class="block text-lg font-bold text-slate-900 dark:text-white bg-transparent border-0 p-0 focus:outline-hidden focus:ring-0 placeholder:text-slate-400 mt-0.5"
                />
              </div>

              <!-- Currency & Status Selector -->
              <div class="flex items-center gap-3">
                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD] mb-1">
                    Currency
                  </label>
                  <select
                    [(ngModel)]="selectedCurrency"
                    (change)="onCurrencyChange()"
                    class="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs font-bold text-slate-800 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
                  >
                    @for (curr of currencies; track curr.code) {
                      <option [value]="curr.code">{{ curr.code }} ({{ curr.symbol }})</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD] mb-1">
                    Status
                  </label>
                  <select
                    [(ngModel)]="status"
                    class="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs font-bold text-slate-800 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0] focus:outline-hidden capitalize"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent / Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="void">Void</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Invoice Number, Dates & Payment Terms Preset -->
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Invoice Number <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="invoiceNumber"
                    required
                    placeholder="INV-2026-0001"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-mono font-bold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Issue Date <span class="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  [(ngModel)]="invoiceDate"
                  (change)="recalculateDueDate()"
                  required
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-medium text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Payment Terms
                </label>
                <select
                  [(ngModel)]="paymentTermsPreset"
                  (change)="onTermsPresetChange()"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-semibold text-slate-800 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
                >
                  <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_30">Net 30 Days</option>
                  <option value="NET_45">Net 45 Days</option>
                  <option value="NET_60">Net 60 Days</option>
                  <option value="CUSTOM">Custom Terms</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Due Date <span class="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  [(ngModel)]="dueDate"
                  required
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-medium text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <!-- Service Period / Engagement Headline -->
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Engagement Reference / Service Period
              </label>
              <input
                type="text"
                [(ngModel)]="servicePeriod"
                placeholder="e.g. November 2026 Cloud Architecture & Systems Consulting"
                class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-medium text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <!-- CARD 2: ISSUER (FROM) & CLIENT (BILL TO) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- FROM: Issuer -->
            <div class="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-3">
              <div class="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-full bg-[#3C50E0]"></span>
                  From (Your Business)
                </span>
                <span class="text-[10px] text-[#3C50E0] font-semibold">Active Entity</span>
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-0.5">Company Name</label>
                <input
                  type="text"
                  [(ngModel)]="issuerName"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs font-semibold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-0.5">Contact Email</label>
                  <input
                    type="email"
                    [(ngModel)]="issuerEmail"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-0.5">Tax ID / EIN</label>
                  <input
                    type="text"
                    [(ngModel)]="issuerTaxId"
                    placeholder="XX-XXXXXXX"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-0.5">Business Address</label>
                <textarea
                  [(ngModel)]="issuerAddress"
                  rows="2"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                ></textarea>
              </div>
            </div>

            <!-- TO: Client -->
            <div class="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-3">
              <div class="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Bill To (Client Organization) <span class="text-rose-500">*</span>
                </span>
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-0.5">Client Company Name <span class="text-rose-500">*</span></label>
                <input
                  type="text"
                  [(ngModel)]="clientName"
                  required
                  placeholder="e.g. Acme Corporation"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs font-semibold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0]"
                />
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-0.5">Primary Email <span class="text-rose-500">*</span></label>
                  <input
                    type="email"
                    [(ngModel)]="clientEmail"
                    required
                    placeholder="billing@acme.com"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0]"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-0.5">CC Email (AP Lead)</label>
                  <input
                    type="email"
                    [(ngModel)]="clientCcEmail"
                    placeholder="ap@acme.com"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-0.5">Billing Address</label>
                <textarea
                  [(ngModel)]="clientAddress"
                  rows="2"
                  placeholder="100 Enterprise Way, Suite 400, San Francisco, CA"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- CARD 3: ADVANCED LINE ITEMS GRID -->
          <div class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-4">
            <div class="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-3">
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Billable Line Items & Deliverables</h3>
                <p class="text-[11px] text-[#64748B] dark:text-[#8A99AD]">Specify services, hourly rates, or project deliverable milestones.</p>
              </div>
              <button
                type="button"
                (click)="addLineItem()"
                class="inline-flex items-center gap-1.5 rounded-lg bg-[#3C50E0]/10 px-3 py-1.5 text-xs font-bold text-[#3C50E0] hover:bg-[#3C50E0]/20 dark:bg-[#3C50E0]/20 dark:hover:bg-[#3C50E0]/30 transition-all cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                <span>Add Item</span>
              </button>
            </div>

            <!-- Items Table -->
            <div class="space-y-3">
              @for (item of items; track $index) {
                <div class="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1A222C]/70 p-3.5 space-y-2.5 transition-all">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-mono font-bold text-[#64748B] dark:text-[#8A99AD]">#{{ $index + 1 }}</span>
                        <!-- Category Preset -->
                        <select
                          [(ngModel)]="item.category"
                          class="rounded-md border border-[#E2E8F0] bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#24303F] focus:outline-hidden"
                        >
                          <option value="consulting">Consulting</option>
                          <option value="development">Engineering / Dev</option>
                          <option value="deliverable">Deliverable Milestone</option>
                          <option value="retainer">Monthly Retainer</option>
                          <option value="design">Design & UX</option>
                          <option value="reimbursable">Reimbursable Expense</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        [(ngModel)]="item.description"
                        required
                        placeholder="Description of services or deliverable milestone..."
                        class="w-full rounded-lg border border-[#E2E8F0] bg-white py-1.5 px-3 text-xs font-medium text-slate-900 dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
                      />
                    </div>

                    <!-- Quantity, Rate, Amount & Delete -->
                    <div class="flex items-end gap-2.5 shrink-0 pt-3 sm:pt-0">
                      <div class="w-20">
                        <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-1 text-center">Qty / Hrs</label>
                        <input
                          type="number"
                          step="any"
                          [(ngModel)]="item.quantity"
                          (input)="updateItemAmount(item)"
                          min="0"
                          class="w-full text-center rounded-lg border border-[#E2E8F0] bg-white py-1.5 px-2 text-xs font-mono font-bold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white"
                        />
                      </div>

                      <div class="w-24">
                        <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-1 text-right">Rate ({{ currencySymbol() }})</label>
                        <input
                          type="number"
                          step="any"
                          [(ngModel)]="item.rate"
                          (input)="updateItemAmount(item)"
                          min="0"
                          class="w-full text-right rounded-lg border border-[#E2E8F0] bg-white py-1.5 px-2 text-xs font-mono font-bold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white"
                        />
                      </div>

                      <div class="w-28 text-right">
                        <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-1">Amount</label>
                        <div class="py-1.5 px-2 font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {{ formatMoney(item.amount) }}
                        </div>
                      </div>

                      <button
                        type="button"
                        [disabled]="items.length === 1"
                        (click)="removeItem($index)"
                        title="Remove Item"
                        class="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-20"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Pre-Approved Additional Pass-Through Charges -->
            <div class="pt-2 border-t border-[#E2E8F0] dark:border-[#2E3A47]">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pre-Approved Additional Charges & Pass-Through Expenses
                </span>
                <button
                  type="button"
                  (click)="addAdditionalCharge()"
                  class="text-[11px] font-bold text-[#3C50E0] hover:underline cursor-pointer"
                >
                  + Add Surcharge / Fee
                </button>
              </div>

              @for (charge of additionalCharges; track $index) {
                <div class="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    [(ngModel)]="charge.description"
                    placeholder="e.g. AWS Cloud Infrastructure Pass-Through"
                    class="flex-1 rounded-lg border border-[#E2E8F0] bg-white py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                  <div class="w-32 relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">{{ currencySymbol() }}</span>
                    <input
                      type="number"
                      step="any"
                      [(ngModel)]="charge.amount"
                      placeholder="0.00"
                      class="w-full text-right rounded-lg border border-[#E2E8F0] bg-white py-1.5 pl-6 pr-3 text-xs font-mono font-bold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    (click)="removeAdditionalCharge($index)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- CARD 4: TAX, DISCOUNT & TOTALS BREAKDOWN -->
          <div class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-4">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-3">
              Adjustments, Tax & Totals Breakdown
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Left: Discount & Tax Config -->
              <div class="space-y-4">
                <!-- Discount Configuration -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Discount
                    </label>
                    <div class="flex items-center rounded-lg bg-[#F1F5F9] dark:bg-[#24303F] p-0.5 text-[10px] font-bold">
                      <button
                        type="button"
                        (click)="discountType = 'percent'"
                        [class.bg-white]="discountType === 'percent'"
                        [class.dark:bg-[#1C2434]]="discountType === 'percent'"
                        [class.text-[#3C50E0]]="discountType === 'percent'"
                        class="px-2 py-0.5 rounded-md cursor-pointer transition-all"
                      >
                        % Percent
                      </button>
                      <button
                        type="button"
                        (click)="discountType = 'fixed'"
                        [class.bg-white]="discountType === 'fixed'"
                        [class.dark:bg-[#1C2434]]="discountType === 'fixed'"
                        [class.text-[#3C50E0]]="discountType === 'fixed'"
                        class="px-2 py-0.5 rounded-md cursor-pointer transition-all"
                      >
                        Fixed ({{ currencySymbol() }})
                      </button>
                    </div>
                  </div>
                  <div class="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      [(ngModel)]="discountValue"
                      placeholder="0"
                      class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-mono font-bold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0]"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {{ discountType === 'percent' ? '%' : currencySymbol() }}
                    </span>
                  </div>
                </div>

                <!-- Tax Configuration -->
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Sales Tax / VAT Rate (%)
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      [(ngModel)]="taxRate"
                      placeholder="0.00"
                      class="flex-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-mono font-bold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0]"
                    />
                    <!-- Preset Quick Tax Pills -->
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        (click)="taxRate = 0"
                        class="px-2 py-1.5 rounded-md border border-[#E2E8F0] dark:border-[#2E3A47] text-[10px] font-bold hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] cursor-pointer"
                      >
                        0%
                      </button>
                      <button
                        type="button"
                        (click)="taxRate = 8.25"
                        class="px-2 py-1.5 rounded-md border border-[#E2E8F0] dark:border-[#2E3A47] text-[10px] font-bold hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] cursor-pointer"
                      >
                        8.25%
                      </button>
                      <button
                        type="button"
                        (click)="taxRate = 10"
                        class="px-2 py-1.5 rounded-md border border-[#E2E8F0] dark:border-[#2E3A47] text-[10px] font-bold hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] cursor-pointer"
                      >
                        10%
                      </button>
                      <button
                        type="button"
                        (click)="taxRate = 20"
                        class="px-2 py-1.5 rounded-md border border-[#E2E8F0] dark:border-[#2E3A47] text-[10px] font-bold hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] cursor-pointer"
                      >
                        20%
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Real-Time Totals Column -->
              <div class="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1A222C] p-4 space-y-2.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-[#64748B] dark:text-[#8A99AD]">Subtotal</span>
                  <span class="font-mono font-bold text-slate-800 dark:text-white">{{ formatMoney(subtotal()) }}</span>
                </div>

                @if (additionalChargesTotal() > 0) {
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-[#64748B] dark:text-[#8A99AD]">Additional Charges</span>
                    <span class="font-mono font-bold text-slate-800 dark:text-white">+{{ formatMoney(additionalChargesTotal()) }}</span>
                  </div>
                }

                @if (calculatedDiscount() > 0) {
                  <div class="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({{ discountType === 'percent' ? discountValue + '%' : 'Fixed' }})</span>
                    <span class="font-mono font-bold">-{{ formatMoney(calculatedDiscount()) }}</span>
                  </div>
                }

                @if (calculatedTax() > 0) {
                  <div class="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Tax ({{ taxRate }}%)</span>
                    <span class="font-mono font-bold">+{{ formatMoney(calculatedTax()) }}</span>
                  </div>
                }

                <div class="border-t border-[#E2E8F0] dark:border-[#2E3A47] pt-2.5 flex items-center justify-between">
                  <span class="text-sm font-bold text-slate-900 dark:text-white">Total Amount</span>
                  <span class="text-xl font-bold font-mono text-[#3C50E0] dark:text-[#6574f8]">
                    {{ formatMoney(calculatedTotal()) }}
                  </span>
                </div>

                @if (isEditMode() && amountPaid > 0) {
                  <div class="flex items-center justify-between text-xs pt-1 text-emerald-600 dark:text-emerald-400">
                    <span>Amount Settled / Paid</span>
                    <span class="font-mono font-bold">-{{ formatMoney(amountPaid) }}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs font-bold text-amber-500 pt-1">
                    <span>Remaining Balance Due</span>
                    <span class="font-mono font-bold">{{ formatMoney(calculatedBalanceDue()) }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- CARD 5: SENSITIVE WIRE TRANSFER & BANK DETAILS (COLLAPSIBLE / CUSTOMIZABLE) -->
          <div class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-4">
            <div class="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-3">
              <div class="flex items-center gap-2">
                <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5M4.5 21V10.5"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Wire Transfer & Banking Settlement Instructions</h3>
                  <p class="text-[11px] text-[#64748B] dark:text-[#8A99AD]">Printed directly onto client statements for rapid direct deposit.</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-1">Account Holder Name</label>
                <input
                  type="text"
                  [(ngModel)]="wireAccountHolder"
                  placeholder="Legal Entity Name"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-1">Bank Name</label>
                <input
                  type="text"
                  [(ngModel)]="wireBankName"
                  placeholder="e.g. JPMorgan Chase"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-1">Account Number / IBAN</label>
                <input
                  type="text"
                  [(ngModel)]="wireAccountNumber"
                  placeholder="•••• •••• ••••"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs font-mono text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-1">SWIFT / BIC Code</label>
                <input
                  type="text"
                  [(ngModel)]="wireSwiftBic"
                  placeholder="CHASUS33"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs font-mono text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-1">Routing Number (ABA / ACH)</label>
                <input
                  type="text"
                  [(ngModel)]="wireRoutingNumber"
                  placeholder="021000021"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs font-mono text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] mb-1">Wire Memo / Reference</label>
                <input
                  type="text"
                  [(ngModel)]="wireReference"
                  [placeholder]="'INV-' + invoiceNumber"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                />
              </div>
            </div>
          </div>

          <!-- CARD 6: SECURITY PIN & NOTES / LEGAL TERMS -->
          <div class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-4">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-3">
              Client Portal Security PIN & Terms
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Client Portal Access PIN (Optional)
                </label>
                <input
                  type="text"
                  [(ngModel)]="accessPin"
                  maxlength="6"
                  placeholder="e.g. 123456"
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-mono font-bold text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0]"
                />
                <span class="text-[10px] text-[#64748B] dark:text-[#8A99AD] mt-1 block">
                  6-digit security PIN required if shared via public link.
                </span>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Passcode Hint
                </label>
                <input
                  type="text"
                  [(ngModel)]="passcodeHint"
                  placeholder="Last 4 digits of your business phone..."
                  class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0]"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Client Notes & Payment Remittance Instructions
              </label>
              <textarea
                [(ngModel)]="notes"
                rows="2"
                placeholder="Thank you for your business. Please include invoice number on all remittances."
                class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0]"
              ></textarea>
            </div>

            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Agreement & Compliance Statement
              </label>
              <input
                type="text"
                [(ngModel)]="agreementComplianceNote"
                placeholder="Submitted in accordance with Master Services Agreement dated Jan 15, 2026."
                class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white focus:border-[#3C50E0]"
              />
            </div>
          </div>

          <!-- DANGER ZONE: DELETE INVOICE (ONLY IN EDIT MODE) -->
          @if (isEditMode()) {
            <div class="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs dark:border-rose-900/30 dark:bg-rose-950/10 flex items-center justify-between">
              <div>
                <h4 class="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">Danger Zone</h4>
                <p class="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                  Permanently remove this billing document and reverse related accounts receivable ledger postings.
                </p>
              </div>
              <button
                type="button"
                (click)="confirmDelete()"
                class="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
              >
                Delete Invoice
              </button>
            </div>
          }
        </div>

        <!-- RIGHT SIDE: LIVE INTERACTIVE INVOICE PREVIEW -->
        @if (showPreview()) {
          <div class="lg:col-span-5 space-y-4 sticky top-36">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">Live Document Canvas</span>
              <button
                type="button"
                (click)="printInvoice()"
                class="text-xs font-semibold text-[#3C50E0] hover:underline cursor-pointer flex items-center gap-1"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24-1.056-.867-2.025-1.782-2.736a4.838 4.838 0 00-.816-.508 4.838 4.838 0 011.02-1.921 4.838 4.838 0 012.355-1.393M6.72 13.829a8.03 8.03 0 005.28 0m-5.28 0A8.04 8.04 0 0112 12m0 0a8.04 8.04 0 015.28 1.829m-5.28-1.829V3m0 0l-3 3m3-3l3 3"/>
                </svg>
                <span>Print / PDF View</span>
              </button>
            </div>

            <!-- Printable Sheet Card -->
            <div class="rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-lg dark:border-[#2E3A47] dark:bg-[#1C2434] text-slate-800 dark:text-slate-100 text-xs space-y-6">
              <!-- Top Row: Entity & Document Header -->
              <div class="flex justify-between items-start border-b border-[#E2E8F0] dark:border-[#2E3A47] pb-5">
                <div>
                  <h2 class="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {{ issuerName || 'QuikLedgr Enterprise LLC' }}
                  </h2>
                  <p class="text-[11px] text-[#64748B] dark:text-[#8A99AD] mt-0.5 whitespace-pre-line">
                    {{ issuerAddress || 'Corporate Accounting Headquarters' }}
                  </p>
                  @if (issuerTaxId) {
                    <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] mt-0.5">Tax ID: {{ issuerTaxId }}</p>
                  }
                </div>

                <div class="text-right">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#3C50E0] block">
                    {{ documentTitle }}
                  </span>
                  <span class="text-lg font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
                    #{{ invoiceNumber || 'DRAFT' }}
                  </span>
                  <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block" [class]="getStatusBadgeClass(status)">
                    {{ status }}
                  </span>
                </div>
              </div>

              <!-- Bill To & Key Dates -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-[10px] font-bold uppercase text-[#64748B] dark:text-[#8A99AD] block mb-1">Billed To</span>
                  <p class="font-bold text-slate-900 dark:text-white">{{ clientName || 'Client Name' }}</p>
                  <p class="text-[11px] text-[#64748B] dark:text-[#8A99AD]">{{ clientEmail || 'client@email.com' }}</p>
                  @if (clientAddress) {
                    <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] mt-0.5 whitespace-pre-line">{{ clientAddress }}</p>
                  }
                </div>

                <div class="text-right space-y-1">
                  <div>
                    <span class="text-[10px] text-[#64748B] dark:text-[#8A99AD] block">Invoice Date</span>
                    <span class="font-mono font-bold">{{ formatDate(invoiceDate) }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] text-[#64748B] dark:text-[#8A99AD] block">Due Date</span>
                    <span class="font-mono font-bold text-[#3C50E0]">{{ formatDate(dueDate) }}</span>
                  </div>
                  @if (servicePeriod) {
                    <div>
                      <span class="text-[10px] text-[#64748B] dark:text-[#8A99AD] block">Period</span>
                      <span class="text-[10px] font-medium">{{ servicePeriod }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Line Items Summary -->
              <div class="border-t border-b border-[#E2E8F0] dark:border-[#2E3A47] py-3">
                <table class="w-full text-left">
                  <thead>
                    <tr class="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#8A99AD] border-b border-[#E2E8F0] dark:border-[#2E3A47]">
                      <th class="pb-1.5">Description</th>
                      <th class="pb-1.5 text-center">Qty</th>
                      <th class="pb-1.5 text-right">Rate</th>
                      <th class="pb-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#E2E8F0]/50 dark:divide-[#2E3A47]/50 text-xs">
                    @for (item of items; track $index) {
                      <tr>
                        <td class="py-2 pr-2">
                          <p class="font-semibold">{{ item.description || 'Consulting Services' }}</p>
                          <span class="text-[10px] text-[#64748B] dark:text-[#8A99AD] uppercase">{{ item.category }}</span>
                        </td>
                        <td class="py-2 text-center font-mono">{{ item.quantity }}</td>
                        <td class="py-2 text-right font-mono">{{ formatMoney(item.rate || 0) }}</td>
                        <td class="py-2 text-right font-mono font-bold">{{ formatMoney(item.amount) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Financial Totals -->
              <div class="space-y-1.5 text-right text-xs">
                <div class="flex justify-between">
                  <span class="text-[#64748B] dark:text-[#8A99AD]">Subtotal:</span>
                  <span class="font-mono font-semibold">{{ formatMoney(subtotal()) }}</span>
                </div>
                @if (additionalChargesTotal() > 0) {
                  <div class="flex justify-between">
                    <span class="text-[#64748B] dark:text-[#8A99AD]">Pass-Through Charges:</span>
                    <span class="font-mono font-semibold">+{{ formatMoney(additionalChargesTotal()) }}</span>
                  </div>
                }
                @if (calculatedDiscount() > 0) {
                  <div class="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount:</span>
                    <span class="font-mono font-semibold">-{{ formatMoney(calculatedDiscount()) }}</span>
                  </div>
                }
                @if (calculatedTax() > 0) {
                  <div class="flex justify-between">
                    <span class="text-[#64748B] dark:text-[#8A99AD]">Tax ({{ taxRate }}%):</span>
                    <span class="font-mono font-semibold">+{{ formatMoney(calculatedTax()) }}</span>
                  </div>
                }
                <div class="flex justify-between text-base font-bold pt-2 border-t border-[#E2E8F0] dark:border-[#2E3A47] text-slate-900 dark:text-white">
                  <span>Total Due:</span>
                  <span class="font-mono text-[#3C50E0]">{{ formatMoney(calculatedTotal()) }}</span>
                </div>
              </div>

              <!-- Wire Details in Preview -->
              @if (wireBankName || wireAccountNumber) {
                <div class="rounded-lg bg-[#F8FAFC] dark:bg-[#1A222C] p-3 text-[10px] space-y-1">
                  <span class="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">Remittance / Wire Info</span>
                  <p class="font-mono">Bank: {{ wireBankName }} | Account: {{ wireAccountNumber }}</p>
                  @if (wireSwiftBic || wireRoutingNumber) {
                    <p class="font-mono">Routing/ABA: {{ wireRoutingNumber }} | SWIFT: {{ wireSwiftBic }}</p>
                  }
                </div>
              }

              @if (notes) {
                <div class="text-[10px] text-[#64748B] dark:text-[#8A99AD] italic border-t border-[#E2E8F0] dark:border-[#2E3A47] pt-2">
                  {{ notes }}
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class InvoiceFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);
  private auth = inject(AuthService);

  isEditMode = signal<boolean>(false);
  invoiceId = signal<string>('');
  isSubmitting = signal<boolean>(false);
  showPreview = signal<boolean>(true);
  feedbackMessage = signal<string>('');
  feedbackType = signal<'success' | 'error'>('success');

  // Currency options
  currencies: CurrencyOption[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  ];

  // Document Fields
  documentTitle = 'CONSULTING SERVICES INVOICE';
  invoiceNumber = '';
  selectedCurrency = 'USD';
  status = 'draft';
  invoiceDate = new Date().toISOString().split('T')[0];
  dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  paymentTermsPreset = 'NET_15';
  servicePeriod = '';

  // Issuer Fields (auto-filled from organization)
  issuerName = '';
  issuerEmail = '';
  issuerAddress = '';
  issuerTaxId = '';

  // Client Fields
  clientName = '';
  clientEmail = '';
  clientCcEmail = '';
  clientAddress = '';

  // Line items
  items: InvoiceItem[] = [
    {
      description: 'Cloud Architecture & Enterprise Engineering',
      category: 'consulting',
      quantity: 1,
      rate: 4500,
      amount: 4500
    }
  ];

  // Additional charges
  additionalCharges: InvoiceAdditionalCharge[] = [];

  // Discounts & Taxes
  discountType: 'percent' | 'fixed' = 'percent';
  discountValue = 0;
  taxRate = 0;

  // Existing balances (for edit mode)
  amountPaid = 0;

  // Banking Details
  wireAccountHolder = '';
  wireBankName = '';
  wireAccountNumber = '';
  wireSwiftBic = '';
  wireRoutingNumber = '';
  wireReference = '';

  // Security & Notes
  accessPin = '';
  passcodeHint = '';
  notes = 'Thank you for your business. Remittances are payable via ACH or direct wire transfer.';
  agreementComplianceNote = 'Submitted in accordance with Consulting Services Agreement.';

  // Currency symbol computed
  currencySymbol = computed(() => {
    const found = this.currencies.find(c => c.code === this.selectedCurrency);
    return found ? found.symbol : '$';
  });

  // Financial Computations
  subtotal = computed(() => {
    return this.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  });

  additionalChargesTotal = computed(() => {
    return this.additionalCharges.reduce((acc, chg) => acc + (Number(chg.amount) || 0), 0);
  });

  calculatedDiscount = computed(() => {
    const base = this.subtotal() + this.additionalChargesTotal();
    if (this.discountType === 'percent') {
      return (base * (Number(this.discountValue) || 0)) / 100;
    }
    return Number(this.discountValue) || 0;
  });

  calculatedTax = computed(() => {
    const base = Math.max(0, this.subtotal() + this.additionalChargesTotal() - this.calculatedDiscount());
    return (base * (Number(this.taxRate) || 0)) / 100;
  });

  calculatedTotal = computed(() => {
    const total = this.subtotal() + this.additionalChargesTotal() - this.calculatedDiscount() + this.calculatedTax();
    return Math.max(0, total);
  });

  calculatedBalanceDue = computed(() => {
    return Math.max(0, this.calculatedTotal() - this.amountPaid);
  });

  ngOnInit(): void {
    // Fill default issuer from active organization
    const activeOrg = this.auth.activeOrganization();
    if (activeOrg) {
      this.issuerName = activeOrg.legalName || activeOrg.name || 'QuikLedgr Enterprise LLC';
      this.selectedCurrency = activeOrg.currency || 'USD';
      this.wireAccountHolder = this.issuerName;
      this.wireBankName = activeOrg.bankName || 'JPMorgan Chase Bank';
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'create' && id !== 'new') {
      this.isEditMode.set(true);
      this.invoiceId.set(id);
      this.loadExistingInvoice(id);
    } else {
      // Auto-generate invoice number
      this.invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      this.wireReference = 'INV-' + this.invoiceNumber;
    }
  }

  async loadExistingInvoice(id: string): Promise<void> {
    const inv = await this.invoiceService.getInvoiceById(id);
    if (!inv) {
      this.feedbackMessage.set('Invoice not found.');
      this.feedbackType.set('error');
      return;
    }

    this.invoiceNumber = inv.invoiceNumber || inv.id;
    this.documentTitle = inv.title || 'CONSULTING SERVICES INVOICE';
    this.status = inv.status || 'draft';
    this.selectedCurrency = inv.currency || 'USD';
    this.invoiceDate = inv.invoiceDate ? inv.invoiceDate.split('T')[0] : this.invoiceDate;
    this.dueDate = inv.dueDate ? inv.dueDate.split('T')[0] : this.dueDate;
    this.servicePeriod = inv.servicePeriod || '';
    this.amountPaid = Number(inv.amount_paid) || 0;

    // Client
    if (inv.client) {
      this.clientName = inv.client.companyName || inv.client.name || '';
      this.clientEmail = inv.client.email || '';
      this.clientCcEmail = inv.client.ccEmail || '';
      this.clientAddress = inv.client.address || '';
    } else {
      this.clientName = inv.client_name || '';
      this.clientEmail = inv.client_email || '';
    }

    // Line items
    if (inv.items && inv.items.length > 0) {
      this.items = inv.items.map(it => ({
        description: it.description,
        category: it.category || 'consulting',
        quantity: Number(it.quantity) || 1,
        rate: Number(it.rate !== undefined ? it.rate : it.unitPrice) || 0,
        amount: Number(it.amount) || 0
      }));
    }

    // Additional Charges
    if (inv.additionalCharges && inv.additionalCharges.length > 0) {
      this.additionalCharges = inv.additionalCharges.map(chg => ({
        description: chg.description,
        amount: Number(chg.amount) || 0
      }));
    }

    // Wire Details
    if (inv.wireDetails) {
      this.wireAccountHolder = inv.wireDetails.accountHolderName || this.wireAccountHolder;
      this.wireBankName = inv.wireDetails.bankName || this.wireBankName;
      this.wireAccountNumber = inv.wireDetails.accountNumberOrIban || '';
      this.wireSwiftBic = inv.wireDetails.swiftBicCode || '';
      this.wireRoutingNumber = inv.wireDetails.routingAba || inv.wireDetails.achRouting || '';
      this.wireReference = inv.wireDetails.wireReference || ('INV-' + this.invoiceNumber);
    }

    // Security & Notes
    if (inv.security) {
      this.passcodeHint = inv.security.passcodeHint || '';
    }
    this.notes = inv.notes || this.notes;
    this.agreementComplianceNote = inv.agreementComplianceNote || this.agreementComplianceNote;

    // Discount & Tax rates if present
    if (inv.taxRate) this.taxRate = inv.taxRate;
    if (inv.discountAmount) {
      this.discountType = 'fixed';
      this.discountValue = inv.discountAmount;
    }
  }

  addLineItem(): void {
    this.items.push({
      description: '',
      category: 'consulting',
      quantity: 1,
      rate: 150,
      amount: 150
    });
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  }

  updateItemAmount(item: InvoiceItem): void {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    item.amount = qty * rate;
  }

  addAdditionalCharge(): void {
    this.additionalCharges.push({
      description: 'Reimbursable Expense / Technology Fee',
      amount: 250
    });
  }

  removeAdditionalCharge(index: number): void {
    this.additionalCharges.splice(index, 1);
  }

  onCurrencyChange(): void {
    // Trigger signal recalculation
  }

  onTermsPresetChange(): void {
    const base = new Date(this.invoiceDate || Date.now());
    let daysToAdd = 15;
    if (this.paymentTermsPreset === 'DUE_ON_RECEIPT') daysToAdd = 0;
    else if (this.paymentTermsPreset === 'NET_15') daysToAdd = 15;
    else if (this.paymentTermsPreset === 'NET_30') daysToAdd = 30;
    else if (this.paymentTermsPreset === 'NET_45') daysToAdd = 45;
    else if (this.paymentTermsPreset === 'NET_60') daysToAdd = 60;
    else return;

    base.setDate(base.getDate() + daysToAdd);
    this.dueDate = base.toISOString().split('T')[0];
  }

  recalculateDueDate(): void {
    this.onTermsPresetChange();
  }

  togglePreview(): void {
    this.showPreview.update(v => !v);
  }

  printInvoice(): void {
    window.print();
  }

  async save(targetStatus: string): Promise<void> {
    if (!this.invoiceNumber.trim()) {
      this.feedbackMessage.set('Please enter a valid invoice number.');
      this.feedbackType.set('error');
      return;
    }

    if (!this.clientName.trim() || !this.clientEmail.trim()) {
      this.feedbackMessage.set('Please enter the client company name and contact email.');
      this.feedbackType.set('error');
      return;
    }

    this.isSubmitting.set(true);
    this.feedbackMessage.set('');

    const payload: Partial<Invoice> = {
      title: this.documentTitle,
      invoiceNumber: this.invoiceNumber,
      status: targetStatus,
      currency: this.selectedCurrency,
      currencySymbol: this.currencySymbol(),
      invoiceDate: this.invoiceDate,
      dueDate: this.dueDate,
      servicePeriod: this.servicePeriod,
      paymentTerms: this.paymentTermsPreset,
      subtotal: this.subtotal(),
      additionalChargesTotal: this.additionalChargesTotal(),
      discountAmount: this.calculatedDiscount(),
      discountRate: this.discountType === 'percent' ? this.discountValue : 0,
      taxAmount: this.calculatedTax(),
      taxRate: this.taxRate,
      total: this.calculatedTotal(),
      notes: this.notes,
      agreementComplianceNote: this.agreementComplianceNote,
      client: {
        companyName: this.clientName,
        email: this.clientEmail,
        ccEmail: this.clientCcEmail,
        address: this.clientAddress
      },
      issuer: {
        companyName: this.issuerName,
        email: this.issuerEmail,
        address: this.issuerAddress,
        taxId: this.issuerTaxId
      },
      items: this.items,
      additionalCharges: this.additionalCharges,
      wireDetails: {
        accountHolderName: this.wireAccountHolder,
        bankName: this.wireBankName,
        accountNumberOrIban: this.wireAccountNumber,
        swiftBicCode: this.wireSwiftBic,
        routingAba: this.wireRoutingNumber,
        achRouting: this.wireRoutingNumber,
        wireReference: this.wireReference || ('INV-' + this.invoiceNumber),
        paymentInstructions: 'ACH or Direct Wire to ' + (this.wireBankName || 'our corporate treasury')
      },
      security: {
        accessPin: this.accessPin || undefined,
        passcodeHint: this.passcodeHint || undefined
      }
    };

    try {
      if (this.isEditMode()) {
        await this.invoiceService.updateInvoice(this.invoiceId(), payload);
        this.feedbackMessage.set('Invoice #' + this.invoiceNumber + ' successfully updated!');
        this.feedbackType.set('success');
      } else {
        const created = await this.invoiceService.createInvoice(payload);
        this.feedbackMessage.set('Invoice #' + created.invoiceNumber + ' successfully created and posted to general ledger!');
        this.feedbackType.set('success');
      }

      setTimeout(() => {
        this.router.navigate(['/invoices']);
      }, 1200);
    } catch (err: any) {
      this.feedbackMessage.set(err?.message || 'Failed to save invoice. Please check locked accounting period or fields.');
      this.feedbackType.set('error');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async confirmDelete(): Promise<void> {
    if (confirm(`Are you sure you want to permanently delete Invoice #${this.invoiceNumber}? This will reverse all associated AR accounting records.`)) {
      try {
        await this.invoiceService.deleteInvoice(this.invoiceId());
        this.router.navigate(['/invoices']);
      } catch (err: any) {
        alert(err?.message || 'Failed to delete invoice.');
      }
    }
  }

  formatMoney(val: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.selectedCurrency || 'USD',
      minimumFractionDigits: 2
    }).format(val || 0);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return d;
    }
  }

  getStatusBadgeClass(st: string): string {
    const s = (st || '').toLowerCase();
    if (s === 'paid') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    if (s === 'sent' || s === 'pending') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    if (s === 'void' || s === 'cancelled') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
  }

  getStatusDotClass(st: string): string {
    const s = (st || '').toLowerCase();
    if (s === 'paid') return 'bg-emerald-500';
    if (s === 'sent' || s === 'pending') return 'bg-amber-500 animate-pulse';
    if (s === 'void' || s === 'cancelled') return 'bg-rose-500';
    return 'bg-slate-400';
  }
}
