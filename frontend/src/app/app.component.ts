import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { InvoiceService } from './core/services/invoice.service';
import { AuthComponent } from './views/auth/auth.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { InvoicesComponent } from './views/invoices/invoices.component';
import { CreateInvoiceModalComponent } from './views/invoices/create-invoice-modal.component';
import { GenericTabComponent } from './views/generic-tab/generic-tab.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AuthComponent,
    SidebarComponent,
    HeaderComponent,
    DashboardComponent,
    InvoicesComponent,
    CreateInvoiceModalComponent,
    GenericTabComponent
  ],
  template: `
    <!-- If not authenticated, render the TailAdmin Auth View -->
    @if (!auth.isAuthenticated()) {
      <app-auth />
    } @else {
      <!-- Authenticated TailAdmin Layout Shell -->
      <div class="flex h-screen overflow-hidden bg-[#F1F5F9] dark:bg-[#1A222C] text-slate-800 dark:text-slate-200">
        <!-- Locked TailAdmin Sidebar (Fixed 288px width) -->
        <app-sidebar
          [currentTab]="activeTab()"
          [sidebarOpen]="sidebarOpen()"
          (tabSelected)="setActiveTab($event)"
          (close)="sidebarOpen.set(false)"
          (newInvoice)="openCreateModal()"
        />

        <!-- Main Content Area -->
        <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <!-- TailAdmin Fixed Header -->
          <app-header
            [sidebarOpen]="sidebarOpen()"
            (toggle)="toggleSidebar()"
            (newInvoice)="openCreateModal()"
          />

          <!-- View Router Outlet Container -->
          <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-(--breakpoint-2xl) w-full mx-auto">
            @switch (activeTab()) {
              @case ('dashboard') {
                <app-dashboard
                  (onNavigateTab)="setActiveTab($event)"
                  (onNewInvoice)="openCreateModal()"
                />
              }
              @case ('invoices') {
                <app-invoices
                  (onNewInvoice)="openCreateModal()"
                />
              }
              @case ('payments') {
                <app-generic-tab
                  tabName="Payments & Embedded Stripe Gateways"
                  title="Payments & Embedded Stripe Gateways"
                  subtitle="Manage incoming ACH payments, Stripe merchant balances, and instant payouts."
                  (onBackToDashboard)="setActiveTab('dashboard')"
                />
              }
              @case ('customers') {
                <app-generic-tab
                  tabName="Client Accounts & Customer Directory"
                  title="Client Accounts & Customer Directory"
                  subtitle="Enterprise directory of client organizations, credit limits, and billing profiles."
                  (onBackToDashboard)="setActiveTab('dashboard')"
                />
              }
              @case ('expenses') {
                <app-generic-tab
                  tabName="Expense Management & OCR Receipts"
                  title="Expense Management & OCR Receipts"
                  subtitle="Accounts Payable ledger, vendor invoice scanning, and receipt OCR processing."
                  (onBackToDashboard)="setActiveTab('dashboard')"
                />
              }
              @case ('banking') {
                <app-generic-tab
                  tabName="Bank Accounts & Live Plaid Feeds"
                  title="Bank Accounts & Live Plaid Feeds"
                  subtitle="Real-time bank statements, automatic rule matching, and ledger reconciliation."
                  (onBackToDashboard)="setActiveTab('dashboard')"
                />
              }
              @case ('reports') {
                <app-generic-tab
                  tabName="Financial Reporting & GAAP Statements"
                  title="Financial Reporting & GAAP Statements"
                  subtitle="Income Statement (P&L), Balance Sheet, AR/AP Aging, and Cash Flow analytics."
                  (onBackToDashboard)="setActiveTab('dashboard')"
                />
              }
              @case ('settings') {
                <app-generic-tab
                  tabName="Organization Settings & Multi-Tenant Controls"
                  title="Organization Settings & Multi-Tenant Controls"
                  subtitle="Tenant management, chart of accounts, tax jurisdictions, and team roles."
                  (onBackToDashboard)="setActiveTab('dashboard')"
                />
              }
              @default {
                <app-dashboard
                  (onNavigateTab)="setActiveTab($event)"
                  (onNewInvoice)="openCreateModal()"
                />
              }
            }
          </main>
        </div>
      </div>

      <!-- Create Invoice Modal -->
      @if (showCreateModal()) {
        <app-create-invoice-modal (onClose)="showCreateModal.set(false)" />
      }
    }
  `
})
export class AppComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  invoiceService = inject(InvoiceService);

  activeTab = signal<string>('dashboard');
  sidebarOpen = signal<boolean>(false);
  showCreateModal = signal<boolean>(false);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    this.sidebarOpen.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }
}
