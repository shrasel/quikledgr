export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  rate?: number;
  unitPrice?: number;
  amount: number;
}

export interface InvoiceClient {
  companyName: string;
  name?: string;
  contactName?: string;
  email: string;
  address?: string;
  phone?: string;
}

export interface InvoiceIssuer {
  companyName: string;
  legalName?: string;
  email: string;
  phone?: string;
  address?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftBic?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'PENDING' | 'PAID' | 'DRAFT' | string;

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  issueDate?: string;
  dueDate: string;
  servicePeriod?: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  amount_paid?: number;
  balance_due?: number;
  notes?: string;
  client?: InvoiceClient;
  issuer?: InvoiceIssuer;
  items: InvoiceItem[];
  security?: {
    accessPin?: string;
    viewCount?: number;
    lastViewedAt?: string | null;
  };
  client_name?: string;
  client_email?: string;
  createdAt?: string;
}
