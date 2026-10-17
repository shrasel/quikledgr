/**
 * API Client for QuikLedgr
 * Connects frontend to the Node.js / MariaDB backend with automatic JWT token attachment,
 * active Organization context header injection, and graceful offline fallback.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'quikledgr_auth_token';
const ORG_KEY = 'quikledgr_active_org_id';

function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('blukers_auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function getOrgHeader() {
  const orgId = localStorage.getItem(ORG_KEY);
  return orgId ? { 'X-Organization-Id': orgId } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...getOrgHeader(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || `Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    console.warn(`[API] Network error calling ${endpoint}:`, err.message);
    throw err;
  }
}

// 1. Authentication Endpoints
export const authApi = {
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem('blukers_auth_token', data.token);
    }
    if (data.activeOrganization?.id) {
      localStorage.setItem(ORG_KEY, data.activeOrganization.id);
    }
    return data;
  },

  register: async (name, email, password, businessName) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, businessName }),
    });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem('blukers_auth_token', data.token);
    }
    if (data.activeOrganization?.id) {
      localStorage.setItem(ORG_KEY, data.activeOrganization.id);
    }
    return data;
  },

  getConfig: async () => {
    return request('/auth/config');
  },

  googleLogin: async (payload) => {
    const body = typeof payload === 'string'
      ? { credential: payload }
      : (payload?.credential ? payload : { email: payload?.email, name: payload?.name, avatarUrl: payload?.avatarUrl });

    const data = await request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem('blukers_auth_token', data.token);
    }
    if (data.activeOrganization?.id) {
      localStorage.setItem(ORG_KEY, data.activeOrganization.id);
    }
    return data;
  },

  getMe: async () => {
    const data = await request('/auth/me');
    if (data.activeOrganization?.id && !localStorage.getItem(ORG_KEY)) {
      localStorage.setItem(ORG_KEY, data.activeOrganization.id);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('blukers_auth_token');
    localStorage.removeItem(ORG_KEY);
  }
};

// 2. Organization / Multi-Tenant Endpoints
export const organizationApi = {
  getAll: async () => {
    return request('/organizations');
  },

  create: async (orgData) => {
    return request('/organizations', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  },

  getCurrent: async () => {
    return request('/organizations/current');
  },

  updateCurrent: async (data) => {
    return request('/organizations/current', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getMembers: async () => {
    return request('/organizations/current/members');
  },

  inviteMember: async (data) => {
    return request('/organizations/current/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  lockPeriod: async (lockDate) => {
    return request('/organizations/current/lock-books', {
      method: 'POST',
      body: JSON.stringify({ lockDate }),
    });
  },

  getAuditTrail: async (limit = 50) => {
    return request(`/organizations/current/audit-trail?limit=${limit}`);
  },

  setActiveOrgId: (orgId) => {
    if (orgId) {
      localStorage.setItem(ORG_KEY, orgId);
    } else {
      localStorage.removeItem(ORG_KEY);
    }
  },

  getActiveOrgId: () => {
    return localStorage.getItem(ORG_KEY);
  }
};

// 3. Double-Entry Accounting Endpoints
export const accountingApi = {
  getSummary: async () => {
    return request('/accounting/summary');
  },

  getAccounts: async () => {
    return request('/accounting/accounts');
  },

  createAccount: async (accountData) => {
    return request('/accounting/accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  },

  getJournalEntries: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.sourceType) params.append('sourceType', filters.sourceType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString();
    return request(`/accounting/journal-entries${queryString ? '?' + queryString : ''}`);
  },

  createJournalEntry: async (entryData) => {
    return request('/accounting/journal-entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  },

  reverseJournalEntry: async (id, reason) => {
    return request(`/accounting/journal-entries/${encodeURIComponent(id)}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
};

// 4. Dashboard Metrics Endpoints
export const dashboardApi = {
  getStats: async () => {
    return request('/dashboard/stats');
  }
};

// 5. Invoices Endpoints
export const invoiceApi = {
  getAll: async () => {
    return request('/invoices');
  },

  create: async (invoiceData) => {
    return request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  },

  updateStatus: async (id, status) => {
    return request(`/invoices/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id) => {
    return request(`/invoices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
};

// 6. Public Recipient Endpoints
export const publicApi = {
  getMetadata: async (id) => {
    return request(`/public/invoices/${encodeURIComponent(id)}`);
  },

  unlockWithPin: async (id, pin) => {
    return request(`/public/invoices/${encodeURIComponent(id)}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }
};

// 7. Profile Endpoints
export const profileApi = {
  get: async () => {
    return request('/profile');
  },

  update: async (profile, wireDetails, wageSettings = null) => {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify({ profile, wireDetails, wageSettings }),
    });
  }
};
