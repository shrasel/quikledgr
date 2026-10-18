import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../../core/models/invoice.model';
import { InvoiceTemplateId, InvoiceTemplateService } from '../../../core/services/invoice-template.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-invoice-template-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (invoice(); as inv) {
      <div [ngSwitch]="resolvedTemplate">

        <!-- ========================================================================= -->
        <!-- 1. MODERN MINIMALIST TEMPLATE (Stripe & Linear Inspired) -->
        <!-- ========================================================================= -->
        <div *ngSwitchCase="'modern'" class="bg-white text-slate-800 p-6 sm:p-10 font-sans border border-slate-200 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0">
          <!-- Top Row: Brand & Status -->
          <div class="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full bg-[#3C50E0]"></span>
                <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {{ inv.issuer?.companyName || auth.activeOrganization()?.name || 'QuikLedgr Enterprise LLC' }}
                </h2>
              </div>
              <p class="text-xs text-slate-500 mt-1 max-w-sm">
                {{ inv.issuer?.address || auth.activeOrganization()?.address || 'Corporate Headquarters & Financial Operations' }}
              </p>
              @if (inv.issuer?.taxId) {
                <p class="text-[11px] text-slate-400 mt-0.5">Tax ID / VAT: {{ inv.issuer?.taxId }}</p>
              }
            </div>

            <div class="text-left sm:text-right">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
                [ngClass]="{
                  'bg-emerald-50 text-emerald-700 border border-emerald-200': isPaid(inv.status),
                  'bg-rose-50 text-rose-700 border border-rose-200': isPastDue(inv),
                  'bg-amber-50 text-amber-700 border border-amber-200': isPending(inv.status) && !isPastDue(inv),
                  'bg-slate-100 text-slate-700 border border-slate-200': !isPaid(inv.status) && !isPastDue(inv) && !isPending(inv.status)
                }">
                <span class="h-1.5 w-1.5 rounded-full" [ngClass]="isPaid(inv.status) ? 'bg-emerald-500' : (isPastDue(inv) ? 'bg-rose-500' : 'bg-amber-500')"></span>
                <span>{{ inv.status }}</span>
              </div>

              <div class="font-mono text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                #{{ inv.invoiceNumber || inv.id }}
              </div>
              <div class="text-xs text-slate-500 mt-1 space-y-0.5">
                <p><span class="text-slate-400">Issued:</span> {{ formatDate(inv.invoiceDate || inv.issueDate) }}</p>
                <p class="font-semibold text-slate-700"><span class="text-slate-400 font-normal">Due:</span> {{ formatDate(inv.dueDate) }}</p>
              </div>
            </div>
          </div>

          <!-- Metadata & Client Section -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Billed To</span>
              <h4 class="font-bold text-sm text-slate-900">{{ getClientName(inv) }}</h4>
              <p class="text-slate-600 mt-0.5">{{ inv.client?.email || inv.client_email || 'client@organization.com' }}</p>
              @if (inv.client?.address) {
                <p class="text-slate-500 mt-1">{{ inv.client?.address }}</p>
              }
              @if (inv.client?.taxId) {
                <p class="text-slate-400 mt-1">Tax ID: {{ inv.client?.taxId }}</p>
              }
            </div>

            <div class="space-y-2 sm:text-right">
              @if (inv.servicePeriod) {
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service Period</span>
                  <span class="font-medium text-slate-800">{{ inv.servicePeriod }}</span>
                </div>
              }
              @if (inv.paymentTerms) {
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Terms</span>
                  <span class="font-medium text-slate-800">{{ inv.paymentTerms }}</span>
                </div>
              }
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Currency</span>
                <span class="font-mono font-bold text-slate-800">{{ inv.currency || 'USD' }}</span>
              </div>
            </div>
          </div>

          <!-- Line Items Table -->
          <div class="py-6">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th class="pb-3 font-semibold">Description</th>
                  <th class="pb-3 text-center font-semibold">Qty</th>
                  <th class="pb-3 text-right font-semibold">Rate</th>
                  <th class="pb-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of inv.items; track $index) {
                  <tr>
                    <td class="py-3.5 pr-4">
                      <p class="font-semibold text-slate-900">{{ item.description }}</p>
                      @if (item.category) {
                        <span class="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 mt-1">
                          {{ item.category }}
                        </span>
                      }
                    </td>
                    <td class="py-3.5 text-center font-mono text-slate-600">{{ item.quantity }}</td>
                    <td class="py-3.5 text-right font-mono text-slate-600">{{ formatMoney(item.rate !== undefined ? item.rate : (item.unitPrice || 0), inv.currency) }}</td>
                    <td class="py-3.5 text-right font-mono font-bold text-slate-900">{{ formatMoney(item.amount, inv.currency) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Totals Summary Grid -->
          <div class="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
            <!-- Left: Wire Banking Quick Box -->
            <div class="w-full sm:w-1/2">
              @if (inv.wireDetails?.bankName) {
                <div class="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Direct Wire / ACH Coordinates
                  </span>
                  <div class="font-mono text-[11px] space-y-0.5">
                    <p><span class="text-slate-400">Bank:</span> {{ inv.wireDetails?.bankName }}</p>
                    <p><span class="text-slate-400">Account / IBAN:</span> {{ inv.wireDetails?.accountNumberOrIban }}</p>
                    <p><span class="text-slate-400">Routing / ABA:</span> {{ inv.wireDetails?.routingAba || inv.wireDetails?.achRouting }}</p>
                    @if (inv.wireDetails?.swiftBicCode) {
                      <p><span class="text-slate-400">SWIFT/BIC:</span> {{ inv.wireDetails?.swiftBicCode }}</p>
                    }
                  </div>
                </div>
              }
              @if (inv.notes) {
                <p class="text-xs text-slate-500 italic mt-3">{{ inv.notes }}</p>
              }
            </div>

            <!-- Right: Calculations & Total Amount -->
            <div class="w-full sm:w-5/12 space-y-2 text-xs text-right">
              <div class="flex justify-between py-1 text-slate-600">
                <span>Subtotal</span>
                <span class="font-mono font-medium">{{ formatMoney(inv.subtotal || 0, inv.currency) }}</span>
              </div>

              @if (inv.discountAmount) {
                <div class="flex justify-between py-1 text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span class="font-mono">-{{ formatMoney(inv.discountAmount, inv.currency) }}</span>
                </div>
              }

              @if (inv.taxAmount) {
                <div class="flex justify-between py-1 text-slate-600">
                  <span>Tax {{ inv.taxRate ? '(' + inv.taxRate + '%)' : '' }}</span>
                  <span class="font-mono font-medium">+{{ formatMoney(inv.taxAmount, inv.currency) }}</span>
                </div>
              }

              @if (inv.additionalChargesTotal) {
                <div class="flex justify-between py-1 text-slate-600">
                  <span>Additional Fees</span>
                  <span class="font-mono font-medium">+{{ formatMoney(inv.additionalChargesTotal, inv.currency) }}</span>
                </div>
              }

              <div class="flex justify-between items-baseline pt-3 border-t-2 border-slate-900 text-slate-900">
                <span class="text-sm font-bold">Total Due</span>
                <span class="font-mono text-2xl font-bold text-[#3C50E0]">
                  {{ formatMoney(inv.total, inv.currency) }}
                </span>
              </div>

              @if (inv.balance_due !== undefined && inv.balance_due < inv.total) {
                <div class="flex justify-between pt-1 text-xs font-semibold text-emerald-600">
                  <span>Balance Outstanding</span>
                  <span class="font-mono">{{ formatMoney(inv.balance_due, inv.currency) }}</span>
                </div>
              }
            </div>
          </div>
        </div>


        <!-- ========================================================================= -->
        <!-- 2. EXECUTIVE ENTERPRISE TEMPLATE (QuickBooks & Big 4 Standard) -->
        <!-- ========================================================================= -->
        <div *ngSwitchCase="'executive'" class="bg-white text-slate-800 font-sans border-2 border-[#1C2434] rounded-xl shadow-md overflow-hidden print:border-none print:shadow-none">
          <!-- Corporate Top Header Band -->
          <div class="bg-[#1C2434] text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div class="inline-flex items-center gap-2 bg-[#333A48] px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-slate-200 mb-2">
                Official Commercial Document
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
                {{ inv.issuer?.companyName || auth.activeOrganization()?.name || 'QuikLedgr Enterprise LLC' }}
              </h2>
              <p class="text-xs text-slate-300 mt-1 max-w-md">
                {{ inv.issuer?.legalName || inv.issuer?.companyName }} • Registration & Ledger Accounts Division
              </p>
              @if (inv.issuer?.taxId) {
                <p class="text-xs text-slate-400 mt-0.5 font-mono">Tax / EIN / VAT ID: {{ inv.issuer?.taxId }}</p>
              }
            </div>

            <div class="text-left sm:text-right bg-[#24303F] border border-[#333A48] rounded-lg p-3.5 sm:min-w-[200px]">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">TAX INVOICE</span>
              <span class="font-mono text-xl font-black text-white block mt-0.5">
                #{{ inv.invoiceNumber || inv.id }}
              </span>
              <div class="mt-2 text-xs text-slate-300 space-y-0.5">
                <p><span class="text-slate-400">Date:</span> {{ formatDate(inv.invoiceDate || inv.issueDate) }}</p>
                <p class="font-bold text-amber-400"><span class="text-slate-400 font-normal">Terms Due:</span> {{ formatDate(inv.dueDate) }}</p>
              </div>
            </div>
          </div>

          <div class="p-6 sm:p-8 space-y-6">
            <!-- Formal Two-Box Entity Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="border border-slate-300 rounded-lg p-4 bg-slate-50/60">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1 mb-2">
                  1. Remit / Vendor Details
                </span>
                <p class="font-bold text-slate-900 text-sm">{{ inv.issuer?.companyName || auth.activeOrganization()?.name }}</p>
                <p class="text-slate-600 mt-1">{{ inv.issuer?.address || auth.activeOrganization()?.address || 'Corporate Headquarters' }}</p>
                <p class="text-slate-600">{{ inv.issuer?.email || auth.currentUser()?.email }}</p>
              </div>

              <div class="border border-slate-300 rounded-lg p-4 bg-slate-50/60">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1 mb-2">
                  2. Bill To / Debtor Entity
                </span>
                <p class="font-bold text-slate-900 text-sm">{{ getClientName(inv) }}</p>
                <p class="text-slate-600 mt-1">{{ inv.client?.email || inv.client_email }}</p>
                @if (inv.client?.address) {
                  <p class="text-slate-600">{{ inv.client?.address }}</p>
                }
                @if (inv.client?.taxId) {
                  <p class="font-mono text-slate-500 mt-0.5">Client Tax Registration: {{ inv.client?.taxId }}</p>
                }
              </div>
            </div>

            <!-- Structured Zebra Table -->
            <div class="border border-slate-300 rounded-lg overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#F1F5F9] border-b border-slate-300 text-[11px] font-extrabold uppercase text-slate-700">
                  <tr>
                    <th class="py-2.5 px-4 w-12 text-center">#</th>
                    <th class="py-2.5 px-4">Item & Scope Description</th>
                    <th class="py-2.5 px-4 text-center w-20">Quantity</th>
                    <th class="py-2.5 px-4 text-right w-28">Unit Rate</th>
                    <th class="py-2.5 px-4 text-right w-32">Total Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  @for (item of inv.items; track $index) {
                    <tr [class.bg-slate-50]="($index % 2) === 1">
                      <td class="py-3 px-4 text-center font-mono text-slate-400">{{ $index + 1 }}</td>
                      <td class="py-3 px-4">
                        <span class="font-bold text-slate-900">{{ item.description }}</span>
                        @if (item.category) {
                          <span class="ml-2 font-mono text-[10px] text-slate-500">[{{ item.category }}]</span>
                        }
                      </td>
                      <td class="py-3 px-4 text-center font-mono font-medium">{{ item.quantity }}</td>
                      <td class="py-3 px-4 text-right font-mono">{{ formatMoney(item.rate !== undefined ? item.rate : (item.unitPrice || 0), inv.currency) }}</td>
                      <td class="py-3 px-4 text-right font-mono font-bold text-slate-900">{{ formatMoney(item.amount, inv.currency) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Bottom Remittance & Formal Accounting Summary -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div class="space-y-4">
                @if (inv.wireDetails?.bankName) {
                  <div class="border border-slate-300 rounded-lg p-4 bg-slate-50 text-xs">
                    <h5 class="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
                      Official Bank Remittance Coordinates
                    </h5>
                    <div class="font-mono text-xs space-y-1">
                      <div class="flex justify-between"><span class="text-slate-500">Beneficiary Bank:</span> <span class="font-bold">{{ inv.wireDetails?.bankName }}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500">Account / IBAN:</span> <span class="font-bold">{{ inv.wireDetails?.accountNumberOrIban }}</span></div>
                      <div class="flex justify-between"><span class="text-slate-500">ABA / Routing:</span> <span class="font-bold">{{ inv.wireDetails?.routingAba || inv.wireDetails?.achRouting }}</span></div>
                      @if (inv.wireDetails?.swiftBicCode) {
                        <div class="flex justify-between"><span class="text-slate-500">SWIFT / BIC:</span> <span class="font-bold">{{ inv.wireDetails?.swiftBicCode }}</span></div>
                      }
                      <div class="flex justify-between border-t border-slate-200 pt-1 text-[11px]"><span class="text-slate-500">Ref Code:</span> <span>INV-{{ inv.invoiceNumber || inv.id }}</span></div>
                    </div>
                  </div>
                }

                <!-- Signatory Line -->
                <div class="pt-4 border-t border-slate-200 flex justify-between items-end text-xs">
                  <div>
                    <div class="w-48 border-b-2 border-slate-400 mb-1"></div>
                    <span class="text-[10px] text-slate-500 uppercase tracking-wider">Authorized Officer Signature</span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">Date: {{ formatDate(inv.invoiceDate || inv.issueDate) }}</span>
                </div>
              </div>

              <!-- Accounting Box Summary -->
              <div class="border-2 border-slate-300 rounded-lg p-5 bg-slate-50 space-y-2 text-xs">
                <div class="flex justify-between text-slate-600">
                  <span>Gross Invoice Subtotal</span>
                  <span class="font-mono font-bold">{{ formatMoney(inv.subtotal || 0, inv.currency) }}</span>
                </div>

                @if (inv.discountAmount) {
                  <div class="flex justify-between text-emerald-600 font-bold">
                    <span>Approved Commercial Discount</span>
                    <span class="font-mono">-{{ formatMoney(inv.discountAmount, inv.currency) }}</span>
                  </div>
                }

                @if (inv.taxAmount) {
                  <div class="flex justify-between text-slate-600">
                    <span>Statutory Tax Assessment</span>
                    <span class="font-mono font-bold">+{{ formatMoney(inv.taxAmount, inv.currency) }}</span>
                  </div>
                }

                <div class="border-t-2 border-b-2 border-slate-900 py-2.5 my-2 flex justify-between items-center text-slate-900">
                  <span class="text-sm font-extrabold uppercase">TOTAL PAYABLE AMOUNT</span>
                  <span class="font-mono text-2xl font-black text-[#1C2434]">
                    {{ formatMoney(inv.total, inv.currency) }}
                  </span>
                </div>

                <div class="text-[10px] text-slate-500 text-center italic">
                  Payment is governed by Standard Commercial Terms. Interest accrues past due date.
                </div>
              </div>
            </div>
          </div>
        </div>


        <!-- ========================================================================= -->
        <!-- 3. CREATIVE STUDIO TEMPLATE (Figma & Editorial Agency Aesthetic) -->
        <!-- ========================================================================= -->
        <div *ngSwitchCase="'creative'" class="bg-white text-slate-800 font-sans border border-slate-200 rounded-2xl shadow-lg overflow-hidden print:border-none print:shadow-none">
          <!-- Colorful Modern Agency Ribbon Header -->
          <div class="h-2.5 w-full bg-linear-to-r from-emerald-500 via-[#3C50E0] to-purple-600"></div>

          <div class="p-6 sm:p-10 space-y-6">
            <!-- Asymmetric Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-500 to-[#3C50E0] text-white font-black text-xl shadow-md">
                    {{ (inv.issuer?.companyName || auth.activeOrganization()?.name || 'Q')[0] }}
                  </div>
                  <div>
                    <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                      {{ inv.issuer?.companyName || auth.activeOrganization()?.name || 'Creative Studio Inc.' }}
                    </h2>
                    <span class="text-xs font-semibold text-emerald-600">Partner Delivery & Project Billing</span>
                  </div>
                </div>
                <p class="text-xs text-slate-500 mt-2 max-w-sm">
                  {{ inv.issuer?.address || auth.activeOrganization()?.address || 'Design District & Innovation Studio' }}
                </p>
              </div>

              <div class="text-left sm:text-right">
                <span class="text-xs font-mono font-bold tracking-widest text-[#3C50E0] uppercase">
                  INVOICE SPECIFICATION
                </span>
                <h1 class="text-3xl font-black tracking-tight text-slate-900 font-mono mt-0.5">
                  #{{ inv.invoiceNumber || inv.id }}
                </h1>
                <div class="flex items-center gap-2 mt-2 sm:justify-end">
                  <span class="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-extrabold text-emerald-600 uppercase">
                    {{ inv.status }}
                  </span>
                </div>
              </div>
            </div>

            <!-- HERO CALLOUT CARD: Amount Due & Date -->
            <div class="rounded-2xl bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-[#3C50E0]/10 border border-emerald-500/25 p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Amount Due for Settlement
                </span>
                <span class="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-700 tracking-tight">
                  {{ formatMoney(inv.total, inv.currency) }}
                </span>
              </div>

              <div class="flex flex-col sm:items-end text-xs">
                <span class="rounded-lg bg-white/80 backdrop-blur-xs border border-slate-200 px-3 py-1 font-semibold text-slate-800 shadow-2xs">
                  Payable by: <span class="font-bold text-slate-900">{{ formatDate(inv.dueDate) }}</span>
                </span>
                <span class="text-[11px] text-slate-500 mt-1">Payment Method: Instant Wire / ACH / Card</span>
              </div>
            </div>

            <!-- Client & Project Scope Information -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div class="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Client Partner</span>
                <p class="font-bold text-sm text-slate-900">{{ getClientName(inv) }}</p>
                <p class="text-slate-600 mt-0.5">{{ inv.client?.email || inv.client_email }}</p>
              </div>

              <div class="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Engagement Timeline</span>
                <p class="font-bold text-sm text-slate-900">{{ inv.servicePeriod || 'Milestone Delivery' }}</p>
                <p class="text-slate-500 mt-0.5">Terms: {{ inv.paymentTerms || 'Due on Receipt' }}</p>
              </div>

              <div class="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Issue Date</span>
                <p class="font-bold text-sm text-slate-900">{{ formatDate(inv.invoiceDate || inv.issueDate) }}</p>
                <p class="text-emerald-600 font-semibold mt-0.5">Status: Verified Ledger</p>
              </div>
            </div>

            <!-- Line Items Table -->
            <div class="rounded-xl border border-slate-200 overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th class="py-3 px-4">Deliverable / Creative Work</th>
                    <th class="py-3 px-4 text-center w-24">Hours / Qty</th>
                    <th class="py-3 px-4 text-right w-28">Rate</th>
                    <th class="py-3 px-4 text-right w-32">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of inv.items; track $index) {
                    <tr class="hover:bg-slate-50/60 transition-colors">
                      <td class="py-3.5 px-4">
                        <span class="font-bold text-slate-900">{{ item.description }}</span>
                        @if (item.category) {
                          <span class="ml-2 inline-flex items-center rounded-md bg-purple-50 text-purple-700 px-2 py-0.5 text-[10px] font-semibold border border-purple-200">
                            {{ item.category }}
                          </span>
                        }
                      </td>
                      <td class="py-3.5 px-4 text-center font-mono text-slate-600">{{ item.quantity }}</td>
                      <td class="py-3.5 px-4 text-right font-mono text-slate-600">{{ formatMoney(item.rate !== undefined ? item.rate : (item.unitPrice || 0), inv.currency) }}</td>
                      <td class="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{{ formatMoney(item.amount, inv.currency) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Bottom: Client Appreciation & Totals -->
            <div class="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
              <div class="w-full sm:w-1/2 space-y-4">
                <!-- Warm Client Appreciation Note -->
                <div class="rounded-xl bg-purple-50/60 border border-purple-100 p-4 text-xs">
                  <span class="font-bold text-purple-900 block mb-1">❤️ Thank You For Your Collaboration!</span>
                  <p class="text-purple-700">
                    {{ inv.notes || 'It has been a pleasure delivering this engagement with you. We appreciate your prompt settlement!' }}
                  </p>
                </div>

                @if (inv.wireDetails?.bankName) {
                  <div class="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 font-mono">
                    <span class="font-sans font-bold text-[10px] uppercase text-slate-400 block mb-1">Instant Bank Transfer</span>
                    <p>{{ inv.wireDetails?.bankName }} • IBAN/Acct: {{ inv.wireDetails?.accountNumberOrIban }} • Routing: {{ inv.wireDetails?.routingAba || inv.wireDetails?.achRouting }}</p>
                  </div>
                }
              </div>

              <!-- Summary Stack -->
              <div class="w-full sm:w-5/12 space-y-2 text-xs text-right">
                <div class="flex justify-between py-1 text-slate-600">
                  <span>Scope Subtotal</span>
                  <span class="font-mono font-medium">{{ formatMoney(inv.subtotal || 0, inv.currency) }}</span>
                </div>

                @if (inv.discountAmount) {
                  <div class="flex justify-between py-1 text-emerald-600 font-medium">
                    <span>Creative Partner Discount</span>
                    <span class="font-mono">-{{ formatMoney(inv.discountAmount, inv.currency) }}</span>
                  </div>
                }

                @if (inv.taxAmount) {
                  <div class="flex justify-between py-1 text-slate-600">
                    <span>Tax</span>
                    <span class="font-mono font-medium">+{{ formatMoney(inv.taxAmount, inv.currency) }}</span>
                  </div>
                }

                <div class="flex justify-between items-baseline pt-3 border-t-2 border-emerald-500 text-slate-900">
                  <span class="text-sm font-bold">Total Investment</span>
                  <span class="font-mono text-2xl font-black text-emerald-600">
                    {{ formatMoney(inv.total, inv.currency) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    }
  `
})
export class InvoiceTemplateRendererComponent {
  invoice = input.required<Invoice>();
  template = input<InvoiceTemplateId>();

  templateService = inject(InvoiceTemplateService);
  auth = inject(AuthService);

  get resolvedTemplate(): InvoiceTemplateId {
    return this.template() || this.templateService.activeTemplate() || this.templateService.defaultTemplate() || 'modern';
  }

  isPaid(status?: string): boolean {
    return (status || '').toLowerCase() === 'paid';
  }

  isPending(status?: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'sent' || s === 'pending' || s === 'partially_paid';
  }

  isPastDue(inv: Invoice): boolean {
    if (this.isPaid(inv.status) || (inv.status || '').toLowerCase() === 'draft') return false;
    if (!inv.dueDate) return false;
    return new Date(inv.dueDate) < new Date();
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
}
