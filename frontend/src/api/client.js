/**
 * API Client for QuikLedgr
 * Connects frontend to the Node.js / MariaDB backend with automatic JWT token attachment
 * and graceful fallback to localStorage when operating offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'quikledgr_auth_token';

function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('blukers_auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
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
    // If backend is unreachable (offline/network), allow caller to handle fallback
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
    return data;
  },

  googleLogin: async (email, name, avatarUrl) => {
    const data = await request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name, avatarUrl }),
    });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem('blukers_auth_token', data.token);
    }
    return data;
  },

  getMe: async () => {
    return request('/auth/me');
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('blukers_auth_token');
  }
};

// 2. Dashboard Metrics Endpoints
export const dashboardApi = {
  getStats: async () => {
    return request('/dashboard/stats');
  }
};

// 3. Invoices Endpoints
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

  delete: async (id) => {
    return request(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }
};

// 4. Public Recipient Endpoints (No consultant auth token required)
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

// 5. Profile Endpoints
export const profileApi = {
  get: async () => {
    return request('/profile');
  },

  update: async (profile, wireDetails) => {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify({ profile, wireDetails }),
    });
  }
};
