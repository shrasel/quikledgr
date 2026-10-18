import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export interface MenuItem {
  id: string;
  label: string;
  route: string;
  iconSvg: string;
  tag?: string;
}

export interface MenuGroup {
  name: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Backdrop -->
    @if (sidebarOpen()) {
      <div
        (click)="closeSidebar()"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
      ></div>
    }

    <!-- TailAdmin Sidebar (Light by default, Dark when switched) -->
    <aside
      class="fixed left-0 top-0 z-50 flex h-screen w-72 min-w-[288px] max-w-[288px] shrink-0 flex-col overflow-y-hidden bg-white dark:bg-[#1C2434] duration-200 ease-in-out border-r border-[#E2E8F0] dark:border-[#2E3A47] lg:static lg:translate-x-0"
      [class.translate-x-0]="sidebarOpen()"
      [class.shadow-2xl]="sidebarOpen()"
      [class.-translate-x-full]="!sidebarOpen()"
    >
      <!-- Logo Header -->
      <div class="flex h-16 shrink-0 items-center justify-between px-6 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
        <a 
          routerLink="/dashboard"
          (click)="onLinkClick()"
          class="flex items-center gap-3 cursor-pointer select-none"
        >
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3C50E0] text-white shadow-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">QuikLedgr</span>
              <span class="rounded bg-[#3C50E0]/80 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                ANGULAR 19
              </span>
            </div>
            <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] font-medium tracking-wide mt-1">
              Enterprise Ledger & AR
            </p>
          </div>
        </a>

        <button
          type="button"
          (click)="closeSidebar()"
          class="block text-slate-500 hover:text-slate-800 dark:text-[#8A99AD] dark:hover:text-white lg:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#333A48]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Navigation Items -->
      <div class="no-scrollbar flex flex-col overflow-y-auto duration-200 ease-linear py-6 px-4 flex-1">
        <nav class="space-y-6">
          @for (group of menuGroups; track group.name) {
            <div>
              <h3 class="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                {{ group.name }}
              </h3>

              <ul class="space-y-1">
                @for (item of group.items; track item.id) {
                  <li>
                    <a
                      [routerLink]="item.route"
                      routerLinkActive="bg-[#3C50E0]/10 text-[#3C50E0] font-bold shadow-xs dark:bg-[#333A48] dark:text-white"
                      [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                      #rla="routerLinkActive"
                      (click)="onLinkClick()"
                      class="group relative flex w-full items-center gap-3 rounded-lg py-2.5 px-3.5 text-xs duration-150 transition-all cursor-pointer text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-[#DEE4EE] dark:hover:bg-[#333A48]/50 dark:hover:text-white font-medium"
                    >
                      <span 
                        class="shrink-0"
                        [ngClass]="rla.isActive ? 'text-[#3C50E0]' : 'text-slate-400 group-hover:text-slate-700 dark:text-[#8A99AD] dark:group-hover:text-white'"
                        [innerHTML]="item.iconSvg"
                      ></span>

                      <span class="flex-1 text-left truncate">{{ item.label }}</span>

                      @if (item.id === 'invoices' && invoiceCount() > 0) {
                        <span class="shrink-0 rounded-full bg-[#3C50E0] px-2 py-0.5 text-[10px] font-bold text-white font-mono">
                          {{ invoiceCount() }}
                        </span>
                      }

                      @if (item.tag) {
                        <span class="shrink-0 rounded bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                          {{ item.tag }}
                        </span>
                      }
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </nav>
      </div>

      <!-- Footer Workspace Status -->
      @if (auth.activeOrganization(); as org) {
        <div class="border-t border-[#E2E8F0] dark:border-[#2E3A47] p-3.5 bg-slate-50/90 dark:bg-[#1A222C]/80 shrink-0">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 truncate">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-700 dark:bg-[#333A48] dark:text-white">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"/>
                </svg>
              </div>
              <div class="truncate">
                <p class="truncate text-xs font-semibold text-slate-900 dark:text-white">
                  {{ org.name }}
                </p>
                <p class="text-[10px] text-[#64748B] dark:text-[#8A99AD] capitalize leading-none mt-0.5">
                  {{ org.role || 'Owner' }} • {{ org.currency || 'USD' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    </aside>
  `
})
export class SidebarComponent {
  auth = inject(AuthService);

  sidebarOpen = input<boolean>(false);
  currentTab = input<string>('dashboard');
  invoiceCount = input<number>(0);

  sidebarOpenChange = output<boolean>();
  tabSelected = output<string>();
  newInvoice = output<void>();

  menuGroups: MenuGroup[] = [
    {
      name: 'MENU',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          route: '/dashboard',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>'
        }
      ]
    },
    {
      name: 'INVOICING & AR',
      items: [
        {
          id: 'invoices',
          label: 'Invoices',
          route: '/invoices',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"/></svg>'
        },
        {
          id: 'quotes',
          label: 'Quotes & Proposals',
          route: '/quotes',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
        },
        {
          id: 'recurring',
          label: 'Recurring Retainers',
          route: '/recurring',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>'
        },
        {
          id: 'ar',
          label: 'AR Aging & Dunning',
          route: '/ar',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        },
        {
          id: 'customers',
          label: 'Clients & Directory',
          route: '/customers',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>'
        }
      ]
    },
    {
      name: 'EXPENSES & AP',
      items: [
        {
          id: 'expenses',
          label: 'Expenses & AP Bills',
          route: '/expenses',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
          tag: 'OCR/1099'
        }
      ]
    },
    {
      name: 'PAYMENTS & PORTAL',
      items: [
        {
          id: 'payments',
          label: 'Payments & Portal',
          route: '/payments',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>',
          tag: 'Stripe/ACH'
        }
      ]
    },
    {
      name: 'FINANCE & LEDGER',
      items: [
        {
          id: 'accounting',
          label: 'Chart of Accounts & GL',
          route: '/accounting',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"/></svg>'
        }
      ]
    },
    {
      name: 'SETTINGS',
      items: [
        {
          id: 'profile',
          label: 'Settings & Templates',
          route: '/settings',
          tag: '3 Styles',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/></svg>'
        },
        {
          id: 'setup',
          label: 'Setup Wizard',
          route: '/setup',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/></svg>',
          tag: 'QuickBooks'
        }
      ]
    }
  ];

  onLinkClick(): void {
    if (window.innerWidth < 1024) {
      this.closeSidebar();
    }
  }

  closeSidebar(): void {
    this.sidebarOpenChange.emit(false);
  }
}
