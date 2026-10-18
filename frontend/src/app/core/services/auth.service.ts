import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, Organization, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly TOKEN_KEY = 'quikledgr_auth_token';
  private readonly USER_KEY = 'quikledgr_user_session';
  private readonly ORG_KEY = 'quikledgr_active_org_id';
  private readonly API_URL = '/api';

  // State Signals
  currentUser = signal<User | null>(this.getStoredUser());
  activeOrganization = signal<Organization | null>(null);
  organizations = signal<Organization[]>([]);
  isLoading = signal<boolean>(false);

  // Computed state
  isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    if (this.currentUser()) {
      this.loadOrganizations().catch(() => {});
    }
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const orgId = localStorage.getItem(this.ORG_KEY);
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (orgId) {
      headers = headers.set('X-Organization-Id', orgId);
    }
    return headers;
  }

  async login(email: string, password: string): Promise<User> {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, {
          email: email.trim().toLowerCase(),
          password
        })
      );
      this.saveSession(res);
      await this.loadOrganizations();
      return res.user;
    } finally {
      this.isLoading.set(false);
    }
  }

  async register(name: string, email: string, password: string, businessName?: string): Promise<User> {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          businessName: businessName?.trim()
        })
      );
      this.saveSession(res);
      await this.loadOrganizations();
      return res.user;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle(credential?: string): Promise<User> {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.API_URL}/auth/google`, { credential })
      );
      this.saveSession(res);
      await this.loadOrganizations();
      return res.user;
    } finally {
      this.isLoading.set(false);
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ORG_KEY);
    this.currentUser.set(null);
    this.activeOrganization.set(null);
    this.organizations.set([]);
  }

  async loadOrganizations(): Promise<Organization[]> {
    try {
      const orgs = await firstValueFrom(
        this.http.get<Organization[]>(`${this.API_URL}/organizations`, {
          headers: this.getAuthHeaders()
        })
      );
      if (Array.isArray(orgs)) {
        this.organizations.set(orgs);
        const savedOrgId = localStorage.getItem(this.ORG_KEY);
        const matched = orgs.find(o => o.id === savedOrgId) || orgs[0];
        if (matched) {
          this.activeOrganization.set(matched);
          localStorage.setItem(this.ORG_KEY, matched.id);
        }
      }
      return orgs;
    } catch (e) {
      console.warn('[AuthService] Could not load organizations:', e);
      return [];
    }
  }

  switchOrganization(orgId: string): void {
    const org = this.organizations().find(o => o.id === orgId);
    if (org) {
      this.activeOrganization.set(org);
      localStorage.setItem(this.ORG_KEY, org.id);
    }
  }

  async createOrganization(name: string, legalName?: string, currency: string = 'USD'): Promise<Organization> {
    const created = await firstValueFrom(
      this.http.post<Organization>(`${this.API_URL}/organizations`, {
        name: name.trim(),
        legalName: legalName?.trim() || name.trim(),
        currency
      }, {
        headers: this.getAuthHeaders()
      })
    );
    this.organizations.update(list => [...list, created]);
    this.switchOrganization(created.id);
    return created;
  }

  async updateCurrentOrganization(data: Partial<Organization>): Promise<Organization> {
    try {
      const updated = await firstValueFrom(
        this.http.put<Organization>(`${this.API_URL}/organizations/current`, data, {
          headers: this.getAuthHeaders()
        })
      );
      if (updated) {
        this.activeOrganization.set(updated);
        this.organizations.update(list =>
          list.map(o => o.id === updated.id ? updated : o)
        );
      }
      return updated;
    } catch (e) {
      // In case of local-only fallback, update local activeOrganization signal
      const curr = this.activeOrganization();
      if (curr) {
        const merged = { ...curr, ...data };
        this.activeOrganization.set(merged);
        this.organizations.update(list =>
          list.map(o => o.id === curr.id ? merged : o)
        );
        return merged;
      }
      throw e;
    }
  }

  private saveSession(res: AuthResponse): void {
    if (res.token) {
      localStorage.setItem(this.TOKEN_KEY, res.token);
    }
    if (res.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      this.currentUser.set(res.user);
    }
    if (res.activeOrganization?.id) {
      localStorage.setItem(this.ORG_KEY, res.activeOrganization.id);
      this.activeOrganization.set(res.activeOrganization);
    }
    if (res.organizations) {
      this.organizations.set(res.organizations);
    }
  }

  private getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
