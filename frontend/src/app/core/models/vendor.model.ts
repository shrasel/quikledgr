export interface Vendor {
  id: string;
  organization_id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string; // EIN or SSN
  is_1099_contractor?: boolean;
  default_expense_account_id?: string;
  payment_terms?: 'due_on_receipt' | 'net_15' | 'net_30' | 'net_60';
  notes?: string;
  total_bills_amount?: number;
  open_bills_amount?: number;
  direct_expenses_amount?: number;
  ytd_spend?: number;
  created_at?: string;
}

export interface Contractor1099Report {
  taxYear: number;
  total1099Payments: number;
  qualifyingCount: number;
  contractors: {
    id: string;
    name: string;
    tax_id?: string;
    email?: string;
    address?: string;
    bill_payments: number;
    direct_expenses: number;
    total_paid: number;
    threshold_met: boolean;
  }[];
}
