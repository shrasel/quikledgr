import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { InvoiceTemplateService } from '../../core/services/invoice-template.service';
import { InvoiceTemplateRendererComponent } from './components/invoice-template-renderer.component';
import { Invoice } from '../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, InvoiceTemplateRendererComponent],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12">
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <a
            routerLink="/invoices"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#3C50E0] dark:text-[#8A99AD] dark:hover:text-[#6574f8] transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            <span>Back to Invoices</span>
          </a>
        </div>

        <div class="flex items-center gap-2.5">
          <!-- Print / PDF Button -->
          <button
            type="button"
            (click)="printInvoice()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24-1.056-.867-2.025-1.782-2.736a4.838 4.838 0 00-.816-.508 4.838 4.838 0 011.02-1.921 4.838 4.838 0 012.355-1.393M6.72 13.829a8.03 8.03 0 005.28 0m-5.28 0A8.04 8.04 0 0112 12m0 0a8.04 8.04 0 015.28 1.829m-5.28-1.829V3m0 0l-3 3m3-3l3 3"/>
            </svg>
            <span>Print / PDF</span>
          </button>

          <!-- Edit Invoice -->
          <a
            [routerLink]="['/invoices', invoice()?.id, 'edit']"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#3C50E0] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
            </svg>
            <span>Edit Invoice</span>
          </a>
        </div>
      </div>

      <!-- Main Render Area -->
      @if (invoice()) {
        <app-invoice-template-renderer
          [invoice]="invoice()!"
          [template]="templateService.defaultTemplate()"
        />
      } @else {
        <div class="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434]">
          <p class="text-sm font-semibold text-slate-800 dark:text-white">Invoice Not Found</p>
          <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1">The requested invoice ID may have been deleted or archived.</p>
          <a routerLink="/invoices" class="mt-4 inline-block text-xs font-bold text-[#3C50E0] hover:underline">
            ← Return to Invoices List
          </a>
        </div>
      }
    </div>
  `
})
export class InvoiceDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  invoiceService = inject(InvoiceService);
  templateService = inject(InvoiceTemplateService);

  invoice = signal<Invoice | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        const found = this.invoiceService.invoices().find(i => String(i.id) === String(id) || String(i.invoiceNumber) === String(id));
        if (found) {
          this.invoice.set(found);
        } else {
          this.invoiceService.refresh().then(() => {
            const recheck = this.invoiceService.invoices().find(i => String(i.id) === String(id) || String(i.invoiceNumber) === String(id));
            if (recheck) {
              this.invoice.set(recheck);
            }
          });
        }
      }
    });
  }

  printInvoice(): void {
    window.print();
  }
}
