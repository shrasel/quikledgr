export interface User {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  role?: string;
  provider?: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  currency?: string;
  role?: string;
  accountingMethod?: string;
  booksLockedUntil?: string | null;
  userRole?: string;
  businessType?: string;
  industry?: string;
  annualRevenue?: string;
  bankName?: string;
  bankAccountLast4?: string;
  isBankConnected?: boolean;
  setupCompleted?: boolean;
  address?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  organizations?: Organization[];
  activeOrganization?: Organization;
}
