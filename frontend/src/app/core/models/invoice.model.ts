export interface InvoiceItem {
  id?: string;
  description: string;
  category?: string;
  quantity: number;
  rate?: number;
  unitPrice?: number;
  amount: number;
}

export interface InvoiceAdditionalCharge {
  id?: string;
  description: string;
  amount: number;
}

export interface InvoiceClient {
  companyName: string;
  name?: string;
  contactName?: string;
  email: string;
  ccEmail?: string;
  address?: string;
  phone?: string;
  taxId?: string;
}

export interface InvoiceIssuer {
  companyName: string;
  legalName?: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftBic?: string;
}

export interface InvoiceWireDetails {
  accountHolderName?: string;
  bankName?: string;
  bankAddress?: string;
  accountNumberOrIban?: string;
  swiftBicCode?: string;
  routingAba?: string;
  achRouting?: string;
  wireReference?: string;
  paymentInstructions?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'void' | 'cancelled' | 'PENDING' | 'PAID' | 'DRAFT' | string;

export interface Invoice {
  id: string;
  organizationId?: string;
  invoiceNumber: string;
  title?: string;
  invoiceDate: string;
  issueDate?: string;
  dueDate: string;
  servicePeriod?: string;
  serviceStartDate?: string;
  serviceEndDate?: string;
  paymentTerms?: string;
  status: InvoiceStatus;
  currency: string;
  currencySymbol?: string;
  subtotal: number;
  additionalChargesTotal?: number;
  discountRate?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  amount_paid?: number;
  balance_due?: number;
  notes?: string;
  agreementComplianceNote?: string;
  client?: InvoiceClient;
  issuer?: InvoiceIssuer;
  items: InvoiceItem[];
  additionalCharges?: InvoiceAdditionalCharge[];
  wireDetails?: InvoiceWireDetails;
  security?: {
    accessPin?: string;
    passcodeHint?: string;
    viewCount?: number;
    lastViewedAt?: string | null;
  };
  client_name?: string;
  client_email?: string;
  createdAt?: string;
}
