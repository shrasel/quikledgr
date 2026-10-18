import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { InvoiceService } from './core/services/invoice.service';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { CreateInvoiceModalComponent } from './views/invoices/create-invoice-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    HeaderComponent,
    CreateInvoiceModalComponent
  ],
  template: `
    <!-- If not authenticated, render the router outlet directly (which routes to /auth) -->
    @if (!auth.isAuthenticated()) {
      <router-outlet />
    } @else {
      <!-- Authenticated TailAdmin Layout Shell -->
      <div class="flex h-screen overflow-hidden bg-[#F1F5F9] dark:bg-[#1A222C] text-slate-800 dark:text-slate-200">
        <!-- Locked TailAdmin Sidebar (Fixed 288px width) -->
        <app-sidebar
          [sidebarOpen]="sidebarOpen()"
          [invoiceCount]="invoiceService.invoices().length"
          (sidebarOpenChange)="sidebarOpen.set($event)"
          (newInvoice)="invoiceService.openCreateModal()"
        />

        <!-- Main Content Area -->
        <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <!-- TailAdmin Fixed Header -->
          <app-header
            [sidebarOpen]="sidebarOpen()"
            (sidebarOpenChange)="sidebarOpen.set($event)"
            (newInvoice)="invoiceService.openCreateModal()"
          />

          <!-- View Router Outlet Container with dedicated page URLs -->
          <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-(--breakpoint-2xl) w-full mx-auto">
            <router-outlet />
          </main>
        </div>
      </div>

      <!-- Create Invoice Modal (Globally Accessible) -->
      @if (invoiceService.isCreateModalOpen()) {
        <app-create-invoice-modal (onClose)="invoiceService.closeCreateModal()" />
      }
    }
  `
})
export class AppComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  invoiceService = inject(InvoiceService);

  sidebarOpen = signal<boolean>(false);

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }
}
