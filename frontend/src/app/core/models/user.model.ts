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
}

export interface AuthResponse {
  user: User;
  token: string;
  organizations?: Organization[];
  activeOrganization?: Organization;
}
