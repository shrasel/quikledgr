import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

export interface MenuItem {
  id: string;
  label: string;
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
  imports: [CommonModule],
  template: `
    <!-- Mobile Backdrop -->
    @if (sidebarOpen()) {
      <div
        (click)="closeSidebar()"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
      ></div>
    }

    <!-- TailAdmin Sidebar -->
    <aside
      class="fixed left-0 top-0 z-50 flex h-screen w-72 min-w-[288px] max-w-[288px] shrink-0 flex-col overflow-y-hidden bg-[#1C2434] duration-200 ease-in-out border-r border-[#2E3A47] lg:static lg:translate-x-0"
      [class.translate-x-0]="sidebarOpen()"
      [class.shadow-2xl]="sidebarOpen()"
      [class.-translate-x-full]="!sidebarOpen()"
    >
      <!-- Logo Header -->
      <div class="flex h-16 shrink-0 items-center justify-between px-6 border-b border-[#2E3A47]">
        <div 
          class="flex items-center gap-3 cursor-pointer select-none"
          (click)="selectTab('dashboard')"
        >
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3C50E0] text-white shadow-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-lg font-bold tracking-tight text-white leading-none">QuikLedgr</span>
              <span class="rounded bg-[#3C50E0]/80 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                ANGULAR 19
              </span>
            </div>
            <p class="text-[10px] text-[#8A99AD] font-medium tracking-wide mt-1">
              Enterprise Ledger & AR
            </p>
          </div>
        </div>

        <button
          type="button"
          (click)="closeSidebar()"
          class="block text-[#8A99AD] hover:text-white lg:hidden p-1.5 rounded-md hover:bg-[#333A48]"
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
              <h3 class="mb-2.5 ml-3 text-[10px] font-bold uppercase tracking-wider text-[#8A99AD]">
                {{ group.name }}
              </h3>

              <ul class="space-y-1">
                @for (item of group.items; track item.id) {
                  <li>
                    <button
                      type="button"
                      (click)="selectTab(item.id)"
                      class="group relative flex w-full items-center gap-3 rounded-lg py-2.5 px-3.5 text-xs duration-150 transition-all cursor-pointer"
                      [ngClass]="currentTab() === item.id 
                        ? 'bg-[#333A48] text-white font-semibold shadow-xs' 
                        : 'text-[#DEE4EE] hover:bg-[#333A48]/50 hover:text-white font-medium'"
                    >
                      <span 
                        class="shrink-0"
                        [ngClass]="currentTab() === item.id ? 'text-[#3C50E0]' : 'text-[#8A99AD] group-hover:text-white'"
                        [innerHTML]="item.iconSvg"
                      ></span>

                      <span class="flex-1 text-left truncate">{{ item.label }}</span>

                      @if (item.id === 'list' && invoiceCount() > 0) {
                        <span class="shrink-0 rounded-full bg-[#3C50E0] px-2 py-0.5 text-[10px] font-bold text-white font-mono">
                          {{ invoiceCount() }}
                        </span>
                      }

                      @if (item.tag) {
                        <span class="shrink-0 rounded bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-tight">
                          {{ item.tag }}
                        </span>
                      }
                    </button>
                  </li>
                }
              </ul>
            </div>
          }
        </nav>
      </div>

      <!-- Footer Workspace Status -->
      @if (auth.activeOrganization(); as org) {
        <div class="border-t border-[#2E3A47] p-3.5 bg-[#1A222C]/80 shrink-0">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5 truncate">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#333A48] text-white">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"/>
                </svg>
              </div>
              <div class="truncate">
                <p class="truncate text-xs font-semibold text-white">
                  {{ org.name }}
                </p>
                <p class="text-[10px] text-[#8A99AD] capitalize leading-none mt-0.5">
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

  menuGroups: MenuGroup[] = [
    {
      name: 'MENU',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg>'
        }
      ]
    },
    {
      name: 'INVOICING & AR',
      items: [
        {
          id: 'list',
          label: 'Invoices',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"/></svg>'
        },
        {
          id: 'editor',
          label: 'Invoice Editor',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>'
        },
        {
          id: 'quotes',
          label: 'Quotes & Proposals',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
        },
        {
          id: 'recurring',
          label: 'Recurring Retainers',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>'
        },
        {
          id: 'ar',
          label: 'AR Aging & Dunning',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        }
      ]
    },
    {
      name: 'PAYMENTS & PORTAL',
      items: [
        {
          id: 'payments',
          label: 'Payments & Portal',
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
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"/></svg>'
        }
      ]
    },
    {
      name: 'SETTINGS',
      items: [
        {
          id: 'profile',
          label: 'Entity & Wire Details',
          iconSvg: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/></svg>'
        }
      ]
    }
  ];

  selectTab(tabId: string): void {
    this.tabSelected.emit(tabId);
    if (window.innerWidth < 1024) {
      this.closeSidebar();
    }
  }

  closeSidebar(): void {
    this.sidebarOpenChange.emit(false);
  }
}
