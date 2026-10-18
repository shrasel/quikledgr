import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { Expense, Bill, ExpenseSummary, BillSummary, ReceiptOCRResult } from '../models/expense.model';
import { Vendor, Contractor1099Report } from '../models/vendor.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private readonly EXPENSES_API = '/api/expenses';
  private readonly BILLS_API = '/api/bills';
  private readonly VENDORS_API = '/api/vendors';

  // Signals
  expenses = signal<Expense[]>([]);
  expenseSummary = signal<ExpenseSummary>({ totalExpenseAmount: 0, unbilledAmount: 0, count: 0, unbilledCount: 0 });

  bills = signal<Bill[]>([]);
  billSummary = signal<BillSummary>({ totalOpenAmount: 0, totalPaidAmount: 0, totalCount: 0, openCount: 0 });

  vendors = signal<Vendor[]>([]);
  unbilledExpenses = signal<Expense[]>([]);
  report1099 = signal<Contractor1099Report | null>(null);

  isLoading = signal<boolean>(false);

  constructor() {
    this.refreshAll();
  }

  async refreshAll(): Promise<void> {
    await Promise.allSettled([
      this.loadExpenses(),
      this.loadBills(),
      this.loadVendors(),
      this.loadUnbilledExpenses(),
      this.load1099Report()
    ]);
  }

  // ================= EXPENSES =================
  async loadExpenses(): Promise<Expense[]> {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<{ summary: ExpenseSummary; expenses: Expense[] }>(this.EXPENSES_API, {
          headers: this.auth.getAuthHeaders()
        })
      );
      if (res && Array.isArray(res.expenses)) {
        this.expenses.set(res.expenses);
        if (res.summary) this.expenseSummary.set(res.summary);
        return res.expenses;
      }
    } catch {
      console.log('[ExpenseService] Using local fallback expenses');
    } finally {
      this.isLoading.set(false);
    }

    const fallback = this.getSeedExpenses();
    this.expenses.set(fallback);
    this.expenseSummary.set({
      totalExpenseAmount: fallback.reduce((s, e) => s + e.amount, 0),
      unbilledAmount: fallback.filter(e => e.is_billable && !e.is_invoiced).reduce((s, e) => s + (e.billable_amount || e.amount), 0),
      count: fallback.length,
      unbilledCount: fallback.filter(e => e.is_billable && !e.is_invoiced).length
    });
    return fallback;
  }

  async createExpense(expenseData: Partial<Expense>): Promise<Expense> {
    this.isLoading.set(true);
    try {
      const created = await firstValueFrom(
        this.http.post<Expense>(this.EXPENSES_API, expenseData, {
          headers: this.auth.getAuthHeaders()
        })
      );
      this.expenses.update(prev => [created, ...prev]);
      await this.loadExpenses();
      return created;
    } catch (err) {
      console.warn('[ExpenseService] Remote create failed, using local insert:', err);
      const local: Expense = {
        id: 'exp_' + Math.random().toString(36).substring(2, 9),
        expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
        amount: Number(expenseData.amount) || 0,
        merchant_name: expenseData.merchant_name || 'Vendor',
        category: expenseData.category || 'General',
        description: expenseData.description,
        is_billable: expenseData.is_billable,
        markup_percent: expenseData.markup_percent || 0,
        billable_amount: (Number(expenseData.amount) || 0) * (1 + (Number(expenseData.markup_percent) || 0) / 100),
        receipt_url: expenseData.receipt_url
      };
      this.expenses.update(prev => [local, ...prev]);
      return local;
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.EXPENSES_API}/${id}`, {
          headers: this.auth.getAuthHeaders()
        })
      );
    } catch {}
    this.expenses.update(prev => prev.filter(e => e.id !== id));
  }

  async loadUnbilledExpenses(): Promise<Expense[]> {
    try {
      const data = await firstValueFrom(
        this.http.get<Expense[]>(`${this.EXPENSES_API}/unbilled`, {
          headers: this.auth.getAuthHeaders()
        })
      );
      if (Array.isArray(data)) {
        this.unbilledExpenses.set(data);
        return data;
      }
    } catch {}
    const unbilled = this.expenses().filter(e => e.is_billable && !e.is_invoiced);
    this.unbilledExpenses.set(unbilled);
    return unbilled;
  }

  async scanReceipt(payload: { receiptText?: string; sampleType?: string }): Promise<ReceiptOCRResult> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; extracted: ReceiptOCRResult }>(
          `${this.EXPENSES_API}/scan-receipt`,
          payload,
          { headers: this.auth.getAuthHeaders() }
        )
      );
      return res.extracted;
    } catch {
      // Local fallback OCR simulation
      return {
        merchant: payload.sampleType === 'aws' ? 'Amazon Web Services (AWS)' :
                  payload.sampleType === 'uber' ? 'Uber Technologies' : 'Staples Office Supplies',
        category: payload.sampleType === 'aws' ? 'Software & Cloud' :
                  payload.sampleType === 'uber' ? 'Travel & Meals' : 'Office Supplies',
        accountNumber: payload.sampleType === 'aws' ? '6100' :
                       payload.sampleType === 'uber' ? '6400' : '6200',
        amount: payload.sampleType === 'aws' ? 148.50 :
                payload.sampleType === 'uber' ? 42.30 : 89.88,
        tax: 5.00,
        date: new Date().toISOString().split('T')[0],
        confidence: 0.96
      };
    }
  }

  // ================= VENDOR BILLS (AP) =================
  async loadBills(): Promise<Bill[]> {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<{ summary: BillSummary; bills: Bill[] }>(this.BILLS_API, {
          headers: this.auth.getAuthHeaders()
        })
      );
      if (res && Array.isArray(res.bills)) {
        this.bills.set(res.bills);
        if (res.summary) this.billSummary.set(res.summary);
        return res.bills;
      }
    } catch {
      console.log('[ExpenseService] Using fallback bills');
    } finally {
      this.isLoading.set(false);
    }

    const fallback = this.getSeedBills();
    this.bills.set(fallback);
    this.billSummary.set({
      totalOpenAmount: fallback.filter(b => ['open', 'partially_paid', 'overdue'].includes(b.status)).reduce((s, b) => s + b.balance_due, 0),
      totalPaidAmount: fallback.reduce((s, b) => s + b.amount_paid, 0),
      totalCount: fallback.length,
      openCount: fallback.filter(b => ['open', 'partially_paid', 'overdue'].includes(b.status)).length
    });
    return fallback;
  }

  async createBill(billData: any): Promise<Bill> {
    this.isLoading.set(true);
    try {
      const created = await firstValueFrom(
        this.http.post<Bill>(this.BILLS_API, billData, {
          headers: this.auth.getAuthHeaders()
        })
      );
      this.bills.update(prev => [created, ...prev]);
      await this.loadBills();
      return created;
    } catch (err) {
      console.warn('[ExpenseService] Remote bill creation fallback:', err);
      const local: Bill = {
        id: 'bil_' + Math.random().toString(36).substring(2, 9),
        vendor_id: billData.vendor_id || 'vnd_1',
        vendor_name: billData.vendor_name || 'Vendor Partner',
        bill_number: billData.bill_number || `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        bill_date: billData.bill_date || new Date().toISOString().split('T')[0],
        due_date: billData.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        subtotal: billData.subtotal || 1500,
        tax_amount: billData.tax_amount || 0,
        total_amount: billData.total_amount || 1500,
        amount_paid: 0,
        balance_due: billData.total_amount || 1500,
        status: 'open'
      };
      this.bills.update(prev => [local, ...prev]);
      return local;
    } finally {
      this.isLoading.set(false);
    }
  }

  async payBill(billId: string, paymentData: any): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.BILLS_API}/${billId}/pay`, paymentData, {
          headers: this.auth.getAuthHeaders()
        })
      );
      await this.loadBills();
    } catch (err) {
      console.warn('[ExpenseService] Local payment fallback:', err);
      this.bills.update(prev => prev.map(b => {
        if (b.id === billId) {
          const amt = Number(paymentData.amount) || b.balance_due;
          const newPaid = b.amount_paid + amt;
          const newBal = Math.max(0, b.total_amount - newPaid);
          return {
            ...b,
            amount_paid: newPaid,
            balance_due: newBal,
            status: newBal <= 0 ? 'paid' : 'partially_paid'
          };
        }
        return b;
      }));
    }
  }

  async deleteBill(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.BILLS_API}/${id}`, {
          headers: this.auth.getAuthHeaders()
        })
      );
    } catch {}
    this.bills.update(prev => prev.filter(b => b.id !== id));
  }

  // ================= VENDORS =================
  async loadVendors(): Promise<Vendor[]> {
    try {
      const data = await firstValueFrom(
        this.http.get<Vendor[]>(this.VENDORS_API, {
          headers: this.auth.getAuthHeaders()
        })
      );
      if (Array.isArray(data)) {
        this.vendors.set(data);
        return data;
      }
    } catch {}

    const seed = this.getSeedVendors();
    this.vendors.set(seed);
    return seed;
  }

  async createVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
    try {
      const created = await firstValueFrom(
        this.http.post<Vendor>(this.VENDORS_API, vendorData, {
          headers: this.auth.getAuthHeaders()
        })
      );
      this.vendors.update(prev => [...prev, created]);
      return created;
    } catch {
      const local: Vendor = {
        id: 'vnd_' + Math.random().toString(36).substring(2, 9),
        name: vendorData.name || 'New Supplier',
        email: vendorData.email,
        phone: vendorData.phone,
        tax_id: vendorData.tax_id,
        is_1099_contractor: vendorData.is_1099_contractor,
        payment_terms: vendorData.payment_terms || 'net_30',
        ytd_spend: 0
      };
      this.vendors.update(prev => [...prev, local]);
      return local;
    }
  }

  async load1099Report(year = new Date().getFullYear()): Promise<Contractor1099Report | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<Contractor1099Report>(`${this.VENDORS_API}/1099-report?year=${year}`, {
          headers: this.auth.getAuthHeaders()
        })
      );
      this.report1099.set(res);
      return res;
    } catch {
      const dummy: Contractor1099Report = {
        taxYear: year,
        total1099Payments: 4850.00,
        qualifyingCount: 2,
        contractors: [
          {
            id: 'vnd_1',
            name: 'Apex DevOps Consulting LLC',
            tax_id: 'XX-XXX4821',
            email: 'devops@apex.com',
            bill_payments: 3500.00,
            direct_expenses: 0,
            total_paid: 3500.00,
            threshold_met: true
          },
          {
            id: 'vnd_2',
            name: 'Elena Rostova (UI/UX Designer)',
            tax_id: 'XXX-XX-9182',
            email: 'elena.design@freelance.org',
            bill_payments: 1350.00,
            direct_expenses: 0,
            total_paid: 1350.00,
            threshold_met: true
          }
        ]
      };
      this.report1099.set(dummy);
      return dummy;
    }
  }

  // ================= SEED DATA =================
  private getSeedExpenses(): Expense[] {
    return [
      {
        id: 'exp_01',
        expense_date: '2026-10-14',
        amount: 148.50,
        tax_amount: 12.25,
        merchant_name: 'Amazon Web Services (AWS)',
        category: 'Software & Cloud Hosting',
        description: 'Production cluster instances and database hosting',
        expense_account_number: '6100',
        expense_account_name: 'Software, Cloud & Hosting',
        is_billable: false
      },
      {
        id: 'exp_02',
        expense_date: '2026-10-12',
        amount: 42.30,
        tax_amount: 3.10,
        merchant_name: 'Uber Technologies',
        category: 'Travel & Meals',
        description: 'Client on-site discovery session airport transfer',
        expense_account_number: '6400',
        expense_account_name: 'Travel, Meals & Entertainment',
        is_billable: true,
        client_name: 'Acme Corporation',
        markup_percent: 15.0,
        billable_amount: 48.65,
        is_invoiced: false
      },
      {
        id: 'exp_03',
        expense_date: '2026-10-05',
        amount: 89.88,
        tax_amount: 5.88,
        merchant_name: 'Staples Office Supplies',
        category: 'Office Supplies',
        description: 'Office paper, toner, and stationary bundle',
        expense_account_number: '6200',
        expense_account_name: 'Office Supplies & Admin',
        is_billable: false
      }
    ];
  }

  private getSeedBills(): Bill[] {
    return [
      {
        id: 'bil_01',
        vendor_id: 'vnd_1',
        vendor_name: 'Apex DevOps Consulting LLC',
        vendor_email: 'devops@apex.com',
        is_1099_contractor: true,
        bill_number: 'BILL-2026-8419',
        bill_date: '2026-10-01',
        due_date: '2026-10-31',
        subtotal: 3500.00,
        tax_amount: 0.00,
        total_amount: 3500.00,
        amount_paid: 1500.00,
        balance_due: 2000.00,
        status: 'partially_paid',
        notes: 'Kubernetes high-availability cluster setup & monitoring sprint'
      },
      {
        id: 'bil_02',
        vendor_id: 'vnd_2',
        vendor_name: 'Elena Rostova (UI/UX Designer)',
        vendor_email: 'elena.design@freelance.org',
        is_1099_contractor: true,
        bill_number: 'BILL-2026-9201',
        bill_date: '2026-10-10',
        due_date: '2026-11-09',
        subtotal: 1350.00,
        tax_amount: 0.00,
        total_amount: 1350.00,
        amount_paid: 0.00,
        balance_due: 1350.00,
        status: 'open',
        notes: 'TailAdmin high-fidelity design system tokens and component specs'
      }
    ];
  }

  private getSeedVendors(): Vendor[] {
    return [
      {
        id: 'vnd_1',
        name: 'Apex DevOps Consulting LLC',
        email: 'devops@apex.com',
        phone: '+1 (555) 234-5678',
        tax_id: 'XX-XXX4821',
        is_1099_contractor: true,
        payment_terms: 'net_30',
        ytd_spend: 3500.00
      },
      {
        id: 'vnd_2',
        name: 'Elena Rostova (UI/UX Designer)',
        email: 'elena.design@freelance.org',
        phone: '+1 (555) 876-5432',
        tax_id: 'XXX-XX-9182',
        is_1099_contractor: true,
        payment_terms: 'net_30',
        ytd_spend: 1350.00
      },
      {
        id: 'vnd_3',
        name: 'Amazon Web Services (AWS)',
        email: 'billing@amazon.com',
        payment_terms: 'due_on_receipt',
        is_1099_contractor: false,
        ytd_spend: 148.50
      }
    ];
  }
}
