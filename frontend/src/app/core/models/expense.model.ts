export interface BillItem {
  id?: string;
  bill_id?: string;
  account_id: string;
  account_name?: string;
  account_number?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  is_billable?: boolean;
  client_id?: string;
  markup_percent?: number;
}

export interface BillPayment {
  id: string;
  bill_id: string;
  payment_account_id: string;
  payment_account_name?: string;
  payment_account_number?: string;
  payment_date: string;
  amount: number;
  payment_method: 'ach' | 'check' | 'credit_card' | 'wire' | 'other';
  reference_number?: string;
  notes?: string;
  created_at?: string;
}

export interface Bill {
  id: string;
  organization_id?: string;
  vendor_id: string;
  vendor_name?: string;
  vendor_email?: string;
  is_1099_contractor?: boolean;
  bill_number: string;
  bill_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: 'draft' | 'open' | 'partially_paid' | 'paid' | 'overdue' | 'void';
  notes?: string;
  attachment_url?: string;
  items?: BillItem[];
  payments?: BillPayment[];
  created_at?: string;
}

export interface Expense {
  id: string;
  organization_id?: string;
  account_id?: string;
  expense_account_name?: string;
  expense_account_number?: string;
  payment_account_id?: string;
  payment_account_name?: string;
  payment_account_number?: string;
  vendor_id?: string;
  vendor_name?: string;
  expense_date: string;
  amount: number;
  tax_amount?: number;
  merchant_name: string;
  category?: string;
  description?: string;
  reference_number?: string;
  receipt_url?: string;
  ocr_data?: any;
  is_billable?: boolean;
  client_id?: string;
  client_name?: string;
  markup_percent?: number;
  billable_amount?: number;
  is_invoiced?: boolean;
  created_at?: string;
}

export interface ReceiptOCRResult {
  merchant: string;
  category: string;
  accountNumber: string;
  amount: number;
  tax: number;
  date: string;
  confidence: number;
  rawSnippet?: string;
}

export interface ExpenseSummary {
  totalExpenseAmount: number;
  unbilledAmount: number;
  count: number;
  unbilledCount: number;
}

export interface BillSummary {
  totalOpenAmount: number;
  totalPaidAmount: number;
  totalCount: number;
  openCount: number;
}
