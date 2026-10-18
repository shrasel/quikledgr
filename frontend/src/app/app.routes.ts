import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { InvoicesComponent } from './views/invoices/invoices.component';
import { InvoiceFormComponent } from './views/invoices/invoice-form.component';
import { ExpensesComponent } from './views/expenses/expenses.component';
import { AuthComponent } from './views/auth/auth.component';
import { SetupComponent } from './views/setup/setup.component';
import { GenericTabComponent } from './views/generic-tab/generic-tab.component';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.parseUrl('/auth');
};

export const guestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    const org = auth.activeOrganization();
    const isCompleted = org?.setupCompleted || (org && localStorage.getItem(`quikledgr_setup_completed_${org.id}`));
    if (!isCompleted) {
      return router.parseUrl('/setup');
    }
    return router.parseUrl('/dashboard');
  }
  return true;
};

export const routes: Routes = [
  { path: 'auth', component: AuthComponent, canActivate: [guestGuard] },
  { path: 'login', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'setup', component: SetupComponent, canActivate: [authGuard] },
  { path: 'onboarding', redirectTo: 'setup', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'invoices', component: InvoicesComponent, canActivate: [authGuard] },
  { path: 'invoices/create', component: InvoiceFormComponent, canActivate: [authGuard] },
  { path: 'invoices/new', redirectTo: 'invoices/create', pathMatch: 'full' },
  { path: 'invoices/:id/edit', component: InvoiceFormComponent, canActivate: [authGuard] },
  { path: 'expenses', component: ExpensesComponent, canActivate: [authGuard] },
  {
    path: 'payments',
    component: GenericTabComponent,
    data: {
      tabName: 'payments',
      title: 'Payments & Embedded Stripe Gateways',
      subtitle: 'Manage incoming ACH payments, Stripe merchant balances, and instant payouts.'
    },
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    component: GenericTabComponent,
    data: {
      tabName: 'customers',
      title: 'Client Accounts & Customer Directory',
      subtitle: 'Enterprise directory of client organizations, credit limits, and billing profiles.'
    },
    canActivate: [authGuard]
  },
  {
    path: 'quotes',
    component: GenericTabComponent,
    data: {
      tabName: 'quotes',
      title: 'Smart Quotes & Interactive Proposals',
      subtitle: 'Generate client proposals, e-signature estimates, and 1-click invoice conversions.'
    },
    canActivate: [authGuard]
  },
  {
    path: 'recurring',
    component: GenericTabComponent,
    data: {
      tabName: 'recurring retainers',
      title: 'Recurring Retainers & Subscriptions',
      subtitle: 'Automated recurring billing cycles, retainer schedules, and scheduled invoice dispatch.'
    },
    canActivate: [authGuard]
  },
  {
    path: 'ar',
    component: GenericTabComponent,
    data: {
      tabName: 'ar aging',
      title: 'AR Aging Summary & Automated Dunning',
      subtitle: 'Aging buckets (Current, 1-30, 31-60, 61-90, 90+ days), late fees, and email sequences.'
    },
    canActivate: [authGuard]
  },
  {
    path: 'accounting',
    component: GenericTabComponent,
    data: {
      tabName: 'general ledger',
      title: 'Chart of Accounts & Double-Entry Ledger',
      subtitle: 'Immutable journal entries, trial balance, and standard GAAP/IFRS accounts hierarchy.'
    },
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    component: GenericTabComponent,
    data: {
      tabName: 'organization settings',
      title: 'Organization Settings & Multi-Tenant Controls',
      subtitle: 'Manage company legal profiles, tax jurisdictions, team members, and wire details.'
    },
    canActivate: [authGuard]
  },
  { path: 'profile', redirectTo: 'settings', pathMatch: 'full' },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
