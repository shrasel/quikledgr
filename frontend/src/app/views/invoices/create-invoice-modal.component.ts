import { Component, inject, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice, InvoiceItem } from '../../core/models/invoice.model';

@Component({
  selector: 'app-create-invoice-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      (click)="onClose.emit()"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
    >
      <div 
        (click)="$event.stopPropagation()"
        class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-[#1C2434] border border-[#E2E8F0] dark:border-[#2E3A47] flex flex-col cursor-default"
      >
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Create New Invoice</h3>
            <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">Draft and dispatch a client invoice to your double-entry ledger.</p>
          </div>
          <button
            type="button"
            (click)="onClose.emit()"
            class="p-1.5 rounded-lg text-[#64748B] hover:text-slate-900 dark:text-[#8A99AD] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#24303F] cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Form Body -->
        <form (ngSubmit)="saveInvoice()" class="p-6 space-y-5 flex-1">
          <!-- Row 1: Invoice # & Dates -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                [(ngModel)]="invoiceNumber"
                name="invoiceNumber"
                required
                class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-mono font-medium text-slate-900 focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                [(ngModel)]="issueDate"
                name="issueDate"
                required
                class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-medium text-slate-900 focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                [(ngModel)]="dueDate"
                name="dueDate"
                required
                class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-medium text-slate-900 focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
              />
            </div>
          </div>

          <!-- Row 2: Client Info -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Client / Company Name
              </label>
              <input
                type="text"
                [(ngModel)]="clientName"
                name="clientName"
                placeholder="e.g. Acme Corporation"
                required
                class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-medium text-slate-900 focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Client Email (For Delivery)
              </label>
              <input
                type="email"
                [(ngModel)]="clientEmail"
                name="clientEmail"
                placeholder="billing@acme.com"
                required
                class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs font-medium text-slate-900 focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
              />
            </div>
          </div>

          <!-- Row 3: Items Table -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Line Items
              </label>
              <button
                type="button"
                (click)="addItem()"
                class="text-xs font-bold text-[#3C50E0] hover:underline cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            <div class="space-y-2">
              @for (item of items; track $index) {
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    [(ngModel)]="item.description"
                    [name]="'desc_' + $index"
                    placeholder="Description of work or item"
                    class="flex-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-xs text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                  <input
                    type="number"
                    [(ngModel)]="item.quantity"
                    (input)="calculateTotal()"
                    [name]="'qty_' + $index"
                    min="1"
                    placeholder="Qty"
                    class="w-20 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-2 text-xs text-center text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                  <input
                    type="number"
                    [(ngModel)]="item.rate"
                    (input)="calculateTotal()"
                    [name]="'price_' + $index"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    class="w-28 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-2 text-xs text-right font-mono text-slate-900 dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white"
                  />
                  <button
                    type="button"
                    (click)="removeItem($index)"
                    class="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                    [disabled]="items.length === 1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- Total Summary -->
          <div class="pt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47] flex justify-end">
            <div class="text-right">
              <span class="text-xs text-[#64748B] dark:text-[#8A99AD] font-medium">Calculated Total:</span>
              <div class="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {{ formatMoney(totalAmount) }}
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47] flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="onClose.emit()"
              class="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-[#8A99AD] dark:hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="rounded-lg bg-[#3C50E0] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#3444bf] transition-all cursor-pointer disabled:opacity-50"
            >
              {{ isSubmitting() ? 'Saving...' : 'Issue Invoice' }}
            </button>
          </div>
        </form>

      </div>
    </div>
  `
})
export class CreateInvoiceModalComponent {
  invoiceService = inject(InvoiceService);
  auth = inject(AuthService);

  onClose = output<void>();

  isSubmitting = signal(false);

  invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  issueDate = new Date().toISOString().split('T')[0];
  dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  clientName = '';
  clientEmail = '';

  items: InvoiceItem[] = [
    { description: 'Enterprise Monthly Retainer & Support', quantity: 1, rate: 2500, amount: 2500 }
  ];

  totalAmount = 2500;

  addItem() {
    this.items.push({ description: '', quantity: 1, rate: 100, amount: 100 });
    this.calculateTotal();
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
      this.calculateTotal();
    }
  }

  calculateTotal() {
    this.totalAmount = this.items.reduce((sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.rate) || 0)), 0);
  }

  formatMoney(val: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  }

  async saveInvoice() {
    if (!this.clientName) {
      alert('Please enter a client name.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      this.calculateTotal();
      const newInv: Partial<Invoice> = {
        invoiceNumber: this.invoiceNumber,
        invoiceDate: this.issueDate,
        dueDate: this.dueDate,
        status: 'sent',
        currency: 'USD',
        client: {
          companyName: this.clientName,
          name: this.clientName,
          email: this.clientEmail
        },
        items: this.items.map(i => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          rate: Number(i.rate) || 0,
          amount: (Number(i.quantity) || 1) * (Number(i.rate) || 0)
        })),
        subtotal: this.totalAmount,
        total: this.totalAmount
      };

      await this.invoiceService.createInvoice(newInv);
      this.onClose.emit();
    } catch (err) {
      console.error('Failed to create invoice:', err);
      alert('Failed to save invoice.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose.emit();
  }
}
