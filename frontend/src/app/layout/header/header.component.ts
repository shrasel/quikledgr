import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="sticky top-0 z-30 flex h-16 shrink-0 w-full items-center bg-white dark:bg-[#1C2434] border-b border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs">
      <div class="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <!-- LEFT: Hamburger & Global Search -->
        <div class="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
          <button
            type="button"
            (click)="toggleSidebar()"
            class="z-50 block rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-xs dark:border-[#2E3A47] dark:bg-[#24303F] lg:hidden text-slate-700 dark:text-slate-200 hover:bg-[#F8FAFC]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
            </svg>
          </button>

          <!-- Search Box -->
          <div class="hidden sm:block relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input
              type="text"
              placeholder="Search invoices, clients, payments..."
              [(ngModel)]="searchQuery"
              class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-9 pr-12 text-xs font-medium text-slate-900 placeholder:text-[#64748B] focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white dark:placeholder:text-[#8A99AD] transition-all"
            />
            <div class="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 rounded bg-[#E2E8F0] dark:bg-[#2E3A47] px-1.5 py-0.5 text-[10px] font-mono text-[#64748B] dark:text-[#8A99AD]">
              <span>⌘K</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: Workspace, Quick Actions, Theme, Notifications & User Avatar -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Workspace / Entity Selector Dropdown -->
          @if (auth.activeOrganization(); as org) {
            <div class="relative">
              <button
                type="button"
                (click)="toggleOrgDropdown()"
                class="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-left hover:bg-[#F1F5F9] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:hover:bg-[#24303F] transition-all shadow-xs cursor-pointer"
              >
                <div class="flex h-6 w-6 items-center justify-center rounded-md bg-[#3C50E0]/15 text-[#3C50E0] dark:bg-[#3C50E0]/25 shrink-0">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"/>
                  </svg>
                </div>
                <div class="hidden sm:flex flex-col text-left">
                  <span class="text-[9px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#8A99AD] leading-none">Entity</span>
                  <span class="max-w-[120px] truncate font-bold text-xs text-slate-800 dark:text-white leading-tight mt-0.5">
                    {{ org.name }}
                  </span>
                </div>
                <svg class="w-3 h-3 text-[#64748B] dark:text-[#8A99AD] shrink-0 ml-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                </svg>
              </button>

              @if (isOrgDropdownOpen()) {
                <div class="absolute right-0 mt-2 w-72 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-xl dark:border-[#2E3A47] dark:bg-[#1C2434] z-50">
                  <div class="px-3 py-2 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                      Business Entities ({{ auth.organizations().length }})
                    </span>
                  </div>

                  <div class="max-h-56 overflow-y-auto py-1">
                    @for (o of auth.organizations(); track o.id) {
                      <button
                        type="button"
                        (click)="selectOrg(o.id)"
                        class="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors cursor-pointer"
                        [ngClass]="o.id === org.id 
                          ? 'bg-[#3C50E0]/10 font-bold text-[#3C50E0]' 
                          : 'text-slate-700 hover:bg-[#F1F5F9] dark:text-[#DEE4EE] dark:hover:bg-[#24303F]'"
                      >
                        <div class="truncate pr-2">
                          <p class="truncate font-semibold">{{ o.name }}</p>
                          <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] capitalize">
                            {{ o.role || 'Owner' }} • {{ o.currency || 'USD' }}
                          </p>
                        </div>
                        @if (o.id === org.id) {
                          <svg class="w-4 h-4 text-[#3C50E0] shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                          </svg>
                        }
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- "+ New Invoice" Quick Button -->
          <button
            type="button"
            (click)="onNewInvoiceClick()"
            class="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#3C50E0] py-2 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            <span>New Invoice</span>
          </button>

          <!-- Theme Toggle Button -->
          <button
            type="button"
            (click)="themeService.toggleTheme()"
            aria-label="Toggle theme"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:text-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-[#8A99AD] dark:hover:text-white transition-all shadow-xs cursor-pointer"
          >
            @if (themeService.theme() === 'dark') {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
              </svg>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
              </svg>
            }
          </button>

          <!-- Notifications Button -->
          <div class="relative">
            <button
              type="button"
              (click)="toggleNotifyDropdown()"
              class="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:text-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-[#8A99AD] dark:hover:text-white transition-all shadow-xs cursor-pointer"
            >
              <span class="absolute 1.5 -top-0.5 -right-0.5 z-1 h-2 w-2 rounded-full bg-[#10B981]">
                <span class="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75"></span>
              </span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
              </svg>
            </button>

            @if (isNotifyDropdownOpen()) {
              <div class="absolute right-0 mt-2 w-80 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xl dark:border-[#2E3A47] dark:bg-[#1C2434] z-50">
                <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-2 dark:border-[#2E3A47]">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Live Feed
                  </span>
                  <span class="rounded bg-[#10B981]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#10B981]">
                    3 New
                  </span>
                </div>

                <div class="space-y-2 pt-2 text-xs">
                  <div class="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F] flex items-start gap-2">
                    <div class="text-[#10B981] mt-0.5 font-bold">✓</div>
                    <div>
                      <p class="font-semibold text-slate-900 dark:text-white">Payment Received</p>
                      <p class="text-[11px] text-[#64748B] dark:text-[#8A99AD]">$3,500.00 settled to general ledger</p>
                    </div>
                  </div>
                  <div class="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F] flex items-start gap-2">
                    <div class="text-[#3C50E0] mt-0.5 font-bold">⟳</div>
                    <div>
                      <p class="font-semibold text-slate-900 dark:text-white">Recurring Retainer Billed</p>
                      <p class="text-[11px] text-[#64748B] dark:text-[#8A99AD]">Automated monthly contract processed</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- User Profile Dropdown -->
          <div class="relative pl-2 sm:pl-3 border-l border-[#E2E8F0] dark:border-[#2E3A47]">
            <button
              type="button"
              (click)="toggleUserDropdown()"
              class="flex items-center gap-2.5 text-left p-1 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1A222C] transition-colors cursor-pointer"
            >
              <div class="h-8 w-8 rounded-full bg-[#3C50E0] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                {{ getUserInitials() }}
              </div>

              <div class="hidden lg:block text-left">
                <span class="block text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {{ auth.currentUser()?.name || 'Administrator' }}
                </span>
                <span class="block text-[10px] text-[#64748B] dark:text-[#8A99AD] capitalize leading-none mt-0.5">
                  {{ auth.currentUser()?.role || 'Consultant' }}
                </span>
              </div>

              <svg class="w-3.5 h-3.5 text-[#64748B] dark:text-[#8A99AD] hidden lg:block" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
              </svg>
            </button>

            @if (isUserDropdownOpen()) {
              <div class="absolute right-0 mt-2 w-60 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-xl dark:border-[#2E3A47] dark:bg-[#1C2434] z-50">
                <div class="border-b border-[#E2E8F0] px-3 py-2.5 dark:border-[#2E3A47]">
                  <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {{ auth.currentUser()?.name }}
                  </p>
                  <p class="text-[11px] text-[#64748B] dark:text-[#8A99AD] truncate">
                    {{ auth.currentUser()?.email }}
                  </p>
                </div>

                <div class="py-1">
                  <button
                    type="button"
                    (click)="navigateToTab('profile')"
                    class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F1F5F9] dark:text-[#DEE4EE] dark:hover:bg-[#24303F] transition-colors cursor-pointer"
                  >
                    <span>Entity & Wire Settings</span>
                  </button>
                  <button
                    type="button"
                    (click)="navigateToTab('accounting')"
                    class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F1F5F9] dark:text-[#DEE4EE] dark:hover:bg-[#24303F] transition-colors cursor-pointer"
                  >
                    <span>General Ledger & COA</span>
                  </button>
                </div>

                <div class="border-t border-[#E2E8F0] pt-1 dark:border-[#2E3A47]">
                  <button
                    type="button"
                    (click)="logout()"
                    class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  auth = inject(AuthService);
  themeService = inject(ThemeService);
  invoiceService = inject(InvoiceService);
  router = inject(Router);

  sidebarOpen = input<boolean>(false);
  sidebarOpenChange = output<boolean>();
  onNewInvoice = output<void>();
  onTabSelected = output<string>();

  searchQuery = '';
  isOrgDropdownOpen = signal(false);
  isNotifyDropdownOpen = signal(false);
  isUserDropdownOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpenChange.emit(!this.sidebarOpen());
  }

  toggleOrgDropdown(): void {
    this.isOrgDropdownOpen.update(v => !v);
    this.isNotifyDropdownOpen.set(false);
    this.isUserDropdownOpen.set(false);
  }

  toggleNotifyDropdown(): void {
    this.isNotifyDropdownOpen.update(v => !v);
    this.isOrgDropdownOpen.set(false);
    this.isUserDropdownOpen.set(false);
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen.update(v => !v);
    this.isOrgDropdownOpen.set(false);
    this.isNotifyDropdownOpen.set(false);
  }

  selectOrg(orgId: string): void {
    this.auth.switchOrganization(orgId);
    this.isOrgDropdownOpen.set(false);
  }

  onNewInvoiceClick(): void {
    this.invoiceService.openCreateModal();
    this.onNewInvoice.emit();
  }

  navigateToTab(tab: string): void {
    this.isUserDropdownOpen.set(false);
    const target = tab === 'profile' ? '/settings' : `/${tab}`;
    this.router.navigate([target]);
    this.onTabSelected.emit(tab);
  }

  logout(): void {
    this.isUserDropdownOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/auth']);
  }

  getUserInitials(): string {
    const name = this.auth.currentUser()?.name;
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
