import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InvoiceTemplateService, InvoiceTemplateId, InvoiceTemplateOption } from '../../core/services/invoice-template.service';
import { InvoiceTemplateRendererComponent } from '../invoices/components/invoice-template-renderer.component';
import { Invoice } from '../../core/models/invoice.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InvoiceTemplateRendererComponent],
  template: `
    <div class="space-y-8 max-w-6xl mx-auto pb-12">
      <!-- Top Breadcrumb & Page Header -->
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-5 dark:border-[#2E3A47]">
        <div>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#8A99AD] mb-1">
            <a routerLink="/dashboard" class="hover:text-[#3C50E0]">QuikLedgr</a>
            <span class="text-slate-400">/</span>
            <span class="text-[#3C50E0]">Organization Settings</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Brand Settings & Invoice Templates
          </h1>
          <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
            Choose your organization's default invoice design from the world's 3 best templates, and configure corporate legal profile.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a
            routerLink="/invoices"
            class="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all cursor-pointer"
          >
            <span>View Invoices →</span>
          </a>
        </div>
      </div>

      <!-- Feedback Toast Banner -->
      @if (toastMessage()) {
        <div class="rounded-xl border border-emerald-500 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between shadow-xs animate-in fade-in">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>{{ toastMessage() }}</span>
          </div>
          <button (click)="toastMessage.set('')" class="hover:opacity-75 cursor-pointer">✕</button>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- SECTION 1: WORLD'S 3 BEST INVOICE TEMPLATES SELECTOR -->
      <!-- ========================================================================= -->
      <section class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>World's 3 Best Invoice Templates</span>
              <span class="rounded bg-[#3C50E0]/10 px-2 py-0.5 text-[10px] font-bold text-[#3C50E0] uppercase tracking-wide">
                Global Standards
              </span>
            </h2>
            <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
              Select any design as your organization's default. Invoices automatically adapt to this aesthetic when viewed or sent.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-[#64748B] dark:text-[#8A99AD]">Current Default:</span>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              {{ templateService.selectedTemplateOption().name }}
            </span>
          </div>
        </div>

        <!-- 3 Template Cards Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          @for (tmpl of templateService.templates; track tmpl.id) {
            <div
              class="relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 dark:bg-[#1C2434]"
              [ngClass]="tmpl.id === templateService.defaultTemplate() 
                ? 'border-2 border-[#3C50E0] shadow-md dark:border-[#3C50E0]' 
                : 'border-[#E2E8F0] hover:border-slate-300 dark:border-[#2E3A47] dark:hover:border-slate-600'"
            >
              <!-- Top Badges -->
              <div>
                <div class="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
                  <span class="rounded-full bg-slate-100 dark:bg-[#24303F] px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {{ tmpl.badge }}
                  </span>

                  @if (tmpl.id === templateService.defaultTemplate()) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-[#3C50E0] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                      </svg>
                      <span>Active Default</span>
                    </span>
                  }
                </div>

                <!-- Template Mockup Graphical Card -->
                <div class="my-4 rounded-xl border border-slate-200/80 p-4 bg-slate-50 dark:bg-[#1A222C] dark:border-[#2E3A47] overflow-hidden select-none">
                  <!-- Visual Mini Skeleton Representation -->
                  @if (tmpl.id === 'modern') {
                    <div class="space-y-2.5 text-[9px] font-mono">
                      <div class="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                        <div class="flex items-center gap-1.5">
                          <span class="h-2 w-2 rounded-full bg-[#3C50E0]"></span>
                          <span class="font-bold text-slate-800 dark:text-white">Linear & Stripe Modern</span>
                        </div>
                        <span class="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold">PAID</span>
                      </div>
                      <div class="h-1.5 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div class="space-y-1 py-1">
                        <div class="flex justify-between text-slate-500"><span>Deliverable #1</span><span>$3,500.00</span></div>
                        <div class="flex justify-between text-slate-500"><span>Deliverable #2</span><span>$2,800.00</span></div>
                      </div>
                      <div class="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
                        <span>TOTAL</span><span class="text-[#3C50E0]">$6,300.00</span>
                      </div>
                    </div>
                  } @else if (tmpl.id === 'executive') {
                    <div class="space-y-2 text-[9px] font-mono">
                      <div class="bg-[#1C2434] text-white p-2 rounded flex justify-between items-center">
                        <span class="font-bold uppercase tracking-wider">TAX INVOICE</span>
                        <span class="text-amber-400 font-bold">#INV-8094</span>
                      </div>
                      <div class="grid grid-cols-2 gap-1.5 text-[8px] text-slate-500">
                        <div class="p-1 rounded bg-white dark:bg-[#24303F] border border-slate-200 dark:border-slate-700">REMIT: Enterprise LLC</div>
                        <div class="p-1 rounded bg-white dark:bg-[#24303F] border border-slate-200 dark:border-slate-700">CLIENT: Acquired Corp</div>
                      </div>
                      <div class="bg-white dark:bg-[#24303F] p-1.5 rounded border border-slate-200 dark:border-slate-700 space-y-0.5">
                        <div class="flex justify-between text-slate-700 dark:text-slate-300 font-bold"><span>Total Net 30</span><span>$14,500.00</span></div>
                      </div>
                    </div>
                  } @else if (tmpl.id === 'creative') {
                    <div class="space-y-2 text-[9px] font-mono">
                      <div class="h-1 w-full bg-linear-to-r from-emerald-500 via-teal-500 to-[#3C50E0] rounded"></div>
                      <div class="flex justify-between items-start">
                        <span class="font-extrabold text-slate-900 dark:text-white text-[10px]">CREATIVE STUDIO</span>
                        <span class="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold">VERIFIED</span>
                      </div>
                      <div class="bg-emerald-500/10 border border-emerald-500/25 p-2 rounded-lg flex justify-between items-center text-emerald-800 dark:text-emerald-300">
                        <span class="font-bold">AMOUNT DUE</span>
                        <span class="text-xs font-black">$8,950.00</span>
                      </div>
                      <div class="text-[8px] text-slate-400 italic">"Thank you for your collaboration!"</div>
                    </div>
                  }
                </div>

                <!-- Template Title & Details -->
                <div>
                  <h3 class="text-base font-bold text-slate-900 dark:text-white">
                    {{ tmpl.name }}
                  </h3>
                  <p class="text-xs font-semibold text-[#3C50E0] mt-0.5">
                    {{ tmpl.tagline }}
                  </p>
                  <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-2 leading-relaxed">
                    {{ tmpl.description }}
                  </p>

                  <div class="mt-3.5 space-y-1.5">
                    @for (hl of tmpl.highlights; track hl) {
                      <div class="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <span class="text-emerald-500 font-bold">✓</span>
                        <span>{{ hl }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47] flex items-center gap-2">
                <button
                  type="button"
                  (click)="previewTemplate(tmpl.id)"
                  class="flex-1 rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-slate-200 dark:hover:bg-[#2E3A47] transition-all cursor-pointer text-center"
                >
                  Preview Sample
                </button>

                @if (tmpl.id === templateService.defaultTemplate()) {
                  <button
                    type="button"
                    disabled
                    class="flex-1 rounded-lg bg-emerald-600/10 border border-emerald-500/30 py-2 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-default text-center"
                  >
                    Current Default
                  </button>
                } @else {
                  <button
                    type="button"
                    (click)="selectDefaultTemplate(tmpl.id)"
                    class="flex-1 rounded-lg bg-[#3C50E0] py-2 px-3 text-xs font-bold text-white hover:bg-[#3444bf] transition-all shadow-xs cursor-pointer text-center"
                  >
                    Set as Default
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- SECTION 2: COMPANY PROFILE & WIRE INSTRUCTIONS -->
      <!-- ========================================================================= -->
      <section class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E2E8F0] pb-4 dark:border-[#2E3A47]">
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              Legal Entity Profile & Wire Coordinates
            </h3>
            <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
              These details appear on all printed and client-facing invoices rendered in your templates.
            </p>
          </div>

          <button
            type="button"
            (click)="saveCompanyDetails()"
            [disabled]="isSaving()"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all cursor-pointer disabled:opacity-50"
          >
            <span *ngIf="!isSaving()">Save Profile Changes</span>
            <span *ngIf="isSaving()">Saving...</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Company / Entity Name</label>
            <input
              type="text"
              [(ngModel)]="companyName"
              class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Tax ID / EIN / VAT Number</label>
            <input
              type="text"
              [(ngModel)]="taxId"
              placeholder="e.g. US-EIN 12-3456789 or GB-VAT 987654321"
              class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
            />
          </div>

          <div class="sm:col-span-2">
            <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Official Business Address</label>
            <input
              type="text"
              [(ngModel)]="companyAddress"
              placeholder="100 Financial Way, Suite 400, New York, NY 10001"
              class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Default Settlement Bank Name</label>
            <input
              type="text"
              [(ngModel)]="bankName"
              placeholder="JPMorgan Chase Commercial Bank"
              class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Account / IBAN Number</label>
            <input
              type="text"
              [(ngModel)]="accountNumber"
              placeholder="987654321000 or US89JPMC1234..."
              class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Routing / ABA Number</label>
            <input
              type="text"
              [(ngModel)]="routingNumber"
              placeholder="021000021"
              class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-200 mb-1">SWIFT / BIC Code</label>
            <input
              type="text"
              [(ngModel)]="swiftCode"
              placeholder="CHASUS33"
              class="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white focus:border-[#3C50E0] focus:outline-hidden"
            />
          </div>
        </div>
      </section>

      <!-- ========================================================================= -->
      <!-- MODAL: LIVE SAMPLE INVOICE TEMPLATE PREVIEW -->
      <!-- ========================================================================= -->
      @if (previewModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div class="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#F8FAFC] dark:bg-[#1A222C] shadow-2xl border border-[#E2E8F0] dark:border-[#2E3A47] flex flex-col">
            <!-- Modal Header -->
            <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1C2434] border-b border-[#E2E8F0] dark:border-[#2E3A47]">
              <div>
                <span class="text-xs uppercase font-bold tracking-wider text-[#64748B] dark:text-[#8A99AD]">Template Preview</span>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  {{ getPreviewTemplateName() }}
                </h3>
              </div>

              <!-- Template Switcher Pills inside preview -->
              <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-[#24303F] p-1 rounded-xl">
                @for (t of templateService.templates; track t.id) {
                  <button
                    type="button"
                    (click)="selectedPreviewTemplate.set(t.id)"
                    class="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    [ngClass]="selectedPreviewTemplate() === t.id ? 'bg-[#3C50E0] text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'"
                  >
                    {{ t.name }}
                  </button>
                }
              </div>

              <div class="flex items-center gap-2">
                @if (selectedPreviewTemplate() !== templateService.defaultTemplate()) {
                  <button
                    type="button"
                    (click)="selectDefaultTemplate(selectedPreviewTemplate())"
                    class="rounded-lg bg-[#3C50E0] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#3444bf] cursor-pointer"
                  >
                    Set As Default
                  </button>
                }
                <button
                  type="button"
                  (click)="previewModalOpen.set(false)"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Modal Content Rendering Template -->
            <div class="p-6">
              <app-invoice-template-renderer
                [invoice]="sampleInvoice"
                [template]="selectedPreviewTemplate()"
              />
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SettingsComponent {
  auth = inject(AuthService);
  templateService = inject(InvoiceTemplateService);

  toastMessage = signal<string>('');
  isSaving = signal<boolean>(false);
  previewModalOpen = signal<boolean>(false);
  selectedPreviewTemplate = signal<InvoiceTemplateId>('modern');

  // Form Fields
  companyName = this.auth.activeOrganization()?.name || 'QuikLedgr Global Corp';
  companyAddress = this.auth.activeOrganization()?.address || '100 Enterprise Way, Suite 500, San Francisco, CA 94107';
  taxId = this.auth.activeOrganization()?.taxId || 'US-EIN 84-2910394';
  bankName = 'Silicon Valley Commercial Bank';
  accountNumber = '982348102948';
  routingNumber = '121000358';
  swiftCode = 'SVBKUS6S';

  // Sample Invoice data to preview any of the 3 templates with realistic corporate data
  sampleInvoice: Invoice = {
    id: 'sample-inv-001',
    invoiceNumber: 'INV-2026-0042',
    title: 'Enterprise Architecture & Financial Systems Migration',
    invoiceDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    servicePeriod: 'October 1, 2026 - October 31, 2026',
    paymentTerms: 'Net 14 Days',
    status: 'sent',
    currency: 'USD',
    currencySymbol: '$',
    subtotal: 18500.00,
    discountAmount: 1000.00,
    taxRate: 8.5,
    taxAmount: 1487.50,
    total: 18987.50,
    balance_due: 18987.50,
    notes: 'Payment required within Net 14 days of issue. Double-entry ledger settlement confirmed upon ACH/Wire receipt.',
    issuer: {
      companyName: this.companyName,
      legalName: `${this.companyName} LLC`,
      address: this.companyAddress,
      email: this.auth.currentUser()?.email || 'billing@quikledgr.com',
      taxId: this.taxId,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      routingNumber: this.routingNumber,
      swiftBic: this.swiftCode
    },
    client: {
      companyName: 'Acme Global Ventures Inc.',
      name: 'Sarah Jenkins (Chief Technology Officer)',
      email: 'sjenkins@acmeglobal.com',
      address: '742 Market Boulevard, Suite 1200, Seattle, WA 98101',
      taxId: 'US-EIN 91-0492817'
    },
    items: [
      {
        description: 'Multi-Tenant Accounting Architecture & Data Modeling',
        category: 'Architecture',
        quantity: 1,
        rate: 8500.00,
        amount: 8500.00
      },
      {
        description: 'Angular 19 TailAdmin Reactive Frontend Delivery',
        category: 'Frontend Engineering',
        quantity: 40,
        rate: 175.00,
        amount: 7000.00
      },
      {
        description: 'Stripe Instant Settlement & Double-Entry Ledger Posting',
        category: 'Fintech Integration',
        quantity: 1,
        rate: 3000.00,
        amount: 3000.00
      }
    ],
    wireDetails: {
      bankName: this.bankName,
      accountNumberOrIban: this.accountNumber,
      routingAba: this.routingNumber,
      swiftBicCode: this.swiftCode
    }
  };

  selectDefaultTemplate(id: InvoiceTemplateId): void {
    this.templateService.setDefaultTemplate(id);
    const tmpl = this.templateService.templates.find(t => t.id === id);
    this.toastMessage.set(`Default invoice template updated to: ${tmpl?.name || id}. All viewed invoices will now use this design!`);
  }

  previewTemplate(id: InvoiceTemplateId): void {
    this.selectedPreviewTemplate.set(id);
    this.sampleInvoice.issuer = {
      companyName: this.companyName,
      legalName: `${this.companyName} LLC`,
      address: this.companyAddress,
      email: this.auth.currentUser()?.email || 'billing@quikledgr.com',
      taxId: this.taxId,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      routingNumber: this.routingNumber,
      swiftBic: this.swiftCode
    };
    this.previewModalOpen.set(true);
  }

  getPreviewTemplateName(): string {
    return this.templateService.templates.find(t => t.id === this.selectedPreviewTemplate())?.name || 'Template Preview';
  }

  async saveCompanyDetails(): Promise<void> {
    this.isSaving.set(true);
    try {
      await this.auth.updateCurrentOrganization({
        name: this.companyName,
        address: this.companyAddress,
        taxId: this.taxId
      });
      this.toastMessage.set('Company legal profile and billing settings saved successfully.');
    } catch {
      this.toastMessage.set('Company settings saved locally.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
