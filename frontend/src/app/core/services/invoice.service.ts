import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Invoice } from '../models/invoice.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly API_URL = '/api/invoices';
  private readonly LOCAL_STORAGE_KEY = 'quikledgr_invoices';

  // Signals
  invoices = signal<Invoice[]>([]);
  selectedInvoice = signal<Invoice | null>(null);
  isLoading = signal<boolean>(false);

  constructor() {
    this.loadInvoices();
  }

  refresh(): Promise<Invoice[]> {
    return this.loadInvoices();
  }

  selectInvoice(inv: Invoice | null): void {
    this.selectedInvoice.set(inv);
  }

  async loadInvoices(): Promise<Invoice[]> {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<Invoice[]>(this.API_URL, {
          headers: this.auth.getAuthHeaders()
        })
      );
      if (Array.isArray(data) && data.length > 0) {
        this.invoices.set(data);
        if (!this.selectedInvoice()) {
          this.selectedInvoice.set(data[0]);
        }
        this.saveToLocal(data);
        return data;
      }
    } catch {
      console.log('[InvoiceService] Using local invoices fallback');
    } finally {
      this.isLoading.set(false);
    }

    const local = this.getFromLocal();
    this.invoices.set(local);
    if (!this.selectedInvoice() && local.length > 0) {
      this.selectedInvoice.set(local[0]);
    }
    return local;
  }

  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    const newInvoice: Invoice = {
      id: 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      invoiceNumber: 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      servicePeriod: 'Monthly Consulting Advisory',
      status: 'draft',
      currency: 'USD',
      subtotal: invoice.subtotal || 4500,
      total: invoice.total || 4500,
      amount_paid: 0,
      balance_due: invoice.total || 4500,
      client: invoice.client || {
        companyName: 'Acme Global Ventures',
        contactName: 'Operations Lead',
        email: 'billing@acmeglobal.com'
      },
      items: invoice.items || [
        { description: 'Cloud Architecture & Fractional CTO Retainer', quantity: 1, rate: 4500, amount: 4500 }
      ],
      ...invoice
    } as Invoice;

    try {
      const remote = await firstValueFrom(
        this.http.post<Invoice>(this.API_URL, newInvoice, {
          headers: this.auth.getAuthHeaders()
        })
      );
      if (remote?.id) {
        this.invoices.update(list => [remote, ...list]);
        this.selectedInvoice.set(remote);
        this.saveToLocal(this.invoices());
        return remote;
      }
    } catch {
      // Local fallback
    }

    this.invoices.update(list => [newInvoice, ...list]);
    this.selectedInvoice.set(newInvoice);
    this.saveToLocal(this.invoices());
    return newInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/${id}`, {
          headers: this.auth.getAuthHeaders()
        })
      );
    } catch {}

    this.invoices.update(list => list.filter(i => i.id !== id));
    this.saveToLocal(this.invoices());
    if (this.selectedInvoice()?.id === id) {
      this.selectedInvoice.set(this.invoices()[0] || null);
    }
  }

  private saveToLocal(list: Invoice[]): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  private getFromLocal(): Invoice[] {
    try {
      const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}

    // Default Seed Invoices
    return [
      {
        id: 'INV-2026-1427',
        invoiceNumber: 'INV-2026-1427',
        invoiceDate: '2026-11-01',
        dueDate: '2026-11-15',
        servicePeriod: 'November 2026 Retainer',
        status: 'partially_paid',
        currency: 'USD',
        subtotal: 8550,
        total: 8550,
        amount_paid: 3500,
        balance_due: 5050,
        client: { companyName: 'Acme Global Ventures', email: 'billing@acmeglobal.com' },
        items: [{ description: 'Executive Advisory & Systems Auditing', quantity: 1, rate: 8550, amount: 8550 }]
      },
      {
        id: 'INV-2026-4262',
        invoiceNumber: 'INV-2026-4262',
        invoiceDate: '2026-10-15',
        dueDate: '2026-11-01',
        servicePeriod: 'October 2026 Sprint',
        status: 'sent',
        currency: 'USD',
        subtotal: 4200,
        total: 4200,
        amount_paid: 0,
        balance_due: 4200,
        client: { companyName: 'TechCorp International', email: 'finance@techcorp.com' },
        items: [{ description: 'Full-Stack Engineering & Microservices', quantity: 1, rate: 4200, amount: 4200 }]
      },
      {
        id: 'INV-2026-5120',
        invoiceNumber: 'INV-2026-5120',
        invoiceDate: '2026-10-01',
        dueDate: '2026-10-15',
        servicePeriod: 'September 2026 Closing',
        status: 'paid',
        currency: 'USD',
        subtotal: 6200,
        total: 6200,
        amount_paid: 6200,
        balance_due: 0,
        client: { companyName: 'Apex Data Labs', email: 'accounts@apexlabs.io' },
        items: [{ description: 'Data Pipeline Engineering & BigQuery ELT', quantity: 1, rate: 6200, amount: 6200 }]
      }
    ];
  }
}
