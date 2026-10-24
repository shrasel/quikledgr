import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-generic-tab',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumb & Header -->
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] dark:text-[#8A99AD] mb-1">
            <span>QuickLedger</span>
            <span class="text-slate-400">/</span>
            <span class="text-[#3C50E0] capitalize">{{ tabName() }}</span>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">
            {{ title() }}
          </h1>
          <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
            {{ subtitle() }}
          </p>
        </div>

        <a
          routerLink="/dashboard"
          (click)="onBackToDashboard.emit()"
          class="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1C2434] dark:text-white dark:hover:bg-[#24303F] transition-all cursor-pointer"
        >
          <span>← Back to Dashboard</span>
        </a>
      </div>

      <!-- Feature Card -->
      <div class="rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-xs dark:border-[#2E3A47] dark:bg-[#1C2434] text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3C50E0]/10 text-[#3C50E0] mb-4">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/>
          </svg>
        </div>

        <h3 class="text-lg font-bold text-slate-900 dark:text-white capitalize">
          {{ tabName() }} Ledger & Controls Active
        </h3>
        <p class="mt-2 text-xs text-[#64748B] dark:text-[#8A99AD] max-w-md mx-auto">
          Connected to QuickLedger Multi-Tenant Accounting Engine. Real-time synchronization is enabled for this workspace.
        </p>

        <div class="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Ledger Engine Online & Reconciled</span>
        </div>
      </div>
    </div>
  `
})
export class GenericTabComponent {
  tabName = input.required<string>();
  title = input<string>('Workspace Module');
  subtitle = input<string>('Enterprise financial management and double-entry reconciliation.');
  onBackToDashboard = output<void>();
}
