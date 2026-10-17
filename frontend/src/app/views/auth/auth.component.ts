import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F1F5F9] dark:bg-[#1A222C] transition-colors duration-200">
      
      <!-- Split Card Container -->
      <div class="w-full max-w-5xl rounded-2xl bg-white shadow-xl dark:bg-[#24303F] border border-[#E2E8F0] dark:border-[#2E3A47] overflow-hidden flex flex-col lg:flex-row">
        
        <!-- LEFT BRAND PANEL (TailAdmin Deep Navy) -->
        <div class="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 lg:p-12 bg-linear-to-br from-[#1C2434] via-[#1A222C] to-[#24303F] text-white relative overflow-hidden border-r border-[#2E3A47]">
          <!-- Ambient decorative light glow -->
          <div class="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#3C50E0]/20 blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"></div>

          <!-- Brand Header -->
          <div class="relative z-10">
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3C50E0] text-white shadow-lg shadow-[#3C50E0]/30">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                </svg>
              </div>
              <div>
                <span class="text-2xl font-black tracking-tight text-white leading-none">QuikLedgr</span>
                <span class="ml-2 inline-block rounded bg-[#3C50E0]/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  v2.0 ANGULAR
                </span>
              </div>
            </div>
            
            <p class="mt-4 text-sm text-[#8A99AD] leading-relaxed max-w-sm">
              Enterprise Double-Entry Accounting, Automated AR Invoicing, and Multi-Tenant Financial Ledger.
            </p>
          </div>

          <!-- Feature Highlights -->
          <div class="my-10 space-y-4 relative z-10">
            <div class="flex items-start gap-3.5">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider">Multi-Tenant Isolation & RBAC</h4>
                <p class="text-xs text-[#8A99AD] mt-0.5">Role-based controls across unlimited business entities and subsidiaries.</p>
              </div>
            </div>

            <div class="flex items-start gap-3.5">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3C50E0]/20 text-[#3C50E0]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider">Automated AR Invoicing</h4>
                <p class="text-xs text-[#8A99AD] mt-0.5">Recurring billing, credit notes, PDF receipts, and integrated payment gateways.</p>
              </div>
            </div>

            <div class="flex items-start gap-3.5">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                </svg>
              </div>
              <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-wider">Audit-Proof Ledger Core</h4>
                <p class="text-xs text-[#8A99AD] mt-0.5">Immutable journal entries adhering to GAAP and IFRS double-entry standards.</p>
              </div>
            </div>
          </div>

          <!-- Bottom Metric Strip -->
          <div class="pt-6 border-t border-[#2E3A47] flex items-center justify-between text-xs text-[#8A99AD] relative z-10">
            <div>
              <span class="font-mono font-bold text-white text-base">99.99%</span>
              <p class="text-[10px] uppercase tracking-wider">Uptime SLA</p>
            </div>
            <div class="h-6 w-[1px] bg-[#2E3A47]"></div>
            <div>
              <span class="font-mono font-bold text-white text-base">SOC 2 Type II</span>
              <p class="text-[10px] uppercase tracking-wider">Security Certified</p>
            </div>
            <div class="h-6 w-[1px] bg-[#2E3A47]"></div>
            <div>
              <span class="font-mono font-bold text-white text-base">256-Bit</span>
              <p class="text-[10px] uppercase tracking-wider">AES Encryption</p>
            </div>
          </div>
        </div>

        <!-- RIGHT FORM PANEL (TailAdmin Clean Form) -->
        <div class="flex-1 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <!-- Top Action Bar (Mode Switcher + Theme Toggle) -->
            <div class="flex items-center justify-between pb-6 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
              <!-- Segmented Pill Switcher -->
              <div class="flex items-center rounded-lg bg-[#F1F5F9] p-1 dark:bg-[#1A222C]">
                <button
                  type="button"
                  (click)="isSignUp.set(false)"
                  [class.bg-white]="!isSignUp()"
                  [class.text-slate-900]="!isSignUp()"
                  [class.shadow-xs]="!isSignUp()"
                  [class.dark:bg-[#24303F]]="!isSignUp()"
                  [class.dark:text-white]="!isSignUp()"
                  [class.text-[#64748B]]="isSignUp()"
                  [class.dark:text-[#8A99AD]]="isSignUp()"
                  class="rounded-md px-4 py-1.5 text-xs font-bold transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  (click)="isSignUp.set(true)"
                  [class.bg-white]="isSignUp()"
                  [class.text-slate-900]="isSignUp()"
                  [class.shadow-xs]="isSignUp()"
                  [class.dark:bg-[#24303F]]="isSignUp()"
                  [class.dark:text-white]="isSignUp()"
                  [class.text-[#64748B]]="!isSignUp()"
                  [class.dark:text-[#8A99AD]]="!isSignUp()"
                  class="rounded-md px-4 py-1.5 text-xs font-bold transition-all cursor-pointer"
                >
                  Create Account
                </button>
              </div>

              <!-- Theme Toggle -->
              <button
                type="button"
                (click)="theme.toggleTheme()"
                class="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-slate-600 hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-[#8A99AD] dark:hover:text-white transition-all cursor-pointer shadow-xs"
                title="Toggle Dark / Light Mode"
              >
                @if (theme.isDark()) {
                  <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
                  </svg>
                } @else {
                  <svg class="w-4 h-4 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                  </svg>
                }
              </button>
            </div>

            <!-- Header Titles -->
            <div class="mt-6">
              <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {{ isSignUp() ? 'Create your QuikLedgr workspace' : 'Welcome back to QuikLedgr' }}
              </h2>
              <p class="text-xs text-[#64748B] dark:text-[#8A99AD] mt-1">
                {{ isSignUp() ? 'Start managing multi-tenant double-entry accounting in seconds.' : 'Enter your enterprise credentials to access your financial ledger.' }}
              </p>
            </div>

            <!-- Error Banner -->
            @if (errorMessage()) {
              <div class="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 dark:bg-rose-900/20 dark:border-rose-800/40 dark:text-rose-300 flex items-start gap-2.5">
                <svg class="w-4 h-4 shrink-0 mt-0.5 text-rose-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <!-- Quick Demo Credentials Selector -->
            <div class="mt-5 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-3.5 dark:border-[#2E3A47] dark:bg-[#1A222C]">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                  1-Click Instant Demo Credentials:
                </span>
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Auto-Fill</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  (click)="fillDemo('admin')"
                  class="flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white dark:hover:border-[#3C50E0] transition-all cursor-pointer shadow-xs"
                >
                  <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>Admin User</span>
                </button>
                <button
                  type="button"
                  (click)="fillDemo('demo')"
                  class="flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-[#3C50E0] hover:bg-[#3C50E0]/5 dark:border-[#2E3A47] dark:bg-[#24303F] dark:text-white dark:hover:border-[#3C50E0] transition-all cursor-pointer shadow-xs"
                >
                  <span class="h-2 w-2 rounded-full bg-[#3C50E0]"></span>
                  <span>Operator User</span>
                </button>
              </div>
            </div>

            <!-- Form -->
            <form (ngSubmit)="handleSubmit()" class="mt-5 space-y-4">
              <!-- Name (if Sign Up) -->
              @if (isSignUp()) {
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div class="relative">
                    <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                    </svg>
                    <input
                      type="text"
                      name="name"
                      [(ngModel)]="name"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-[#64748B] focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white dark:placeholder:text-[#8A99AD] transition-all"
                    />
                  </div>
                </div>
              }

              <!-- Email -->
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Work Email
                </label>
                <div class="relative">
                  <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                  </svg>
                  <input
                    type="email"
                    name="email"
                    [(ngModel)]="email"
                    required
                    placeholder="name@company.com"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-[#64748B] focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white dark:placeholder:text-[#8A99AD] transition-all"
                  />
                </div>
              </div>

              <!-- Password -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  @if (!isSignUp()) {
                    <a href="javascript:void(0)" class="text-[11px] font-semibold text-[#3C50E0] hover:underline">
                      Forgot Password?
                    </a>
                  }
                </div>
                <div class="relative">
                  <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                  </svg>
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    name="password"
                    [(ngModel)]="password"
                    required
                    placeholder="••••••••••••"
                    class="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder:text-[#64748B] focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white dark:placeholder:text-[#8A99AD] transition-all"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-slate-900 dark:text-[#8A99AD] dark:hover:text-white"
                  >
                    @if (showPassword()) {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="isLoading()"
                class="w-full rounded-lg bg-[#3C50E0] py-3 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#3444bf] focus:outline-hidden disabled:opacity-60 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                @if (isLoading()) {
                  <svg class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                } @else {
                  <span>{{ isSignUp() ? 'Create Workspace Account' : 'Sign In to Workspace' }}</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                  </svg>
                }
              </button>
            </form>

            <!-- Divider -->
            <div class="relative my-6 text-center">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-[#E2E8F0] dark:border-[#2E3A47]"></div>
              </div>
              <span class="relative bg-white px-3 text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:bg-[#24303F] dark:text-[#8A99AD]">
                or continue with
              </span>
            </div>

            <!-- Google OAuth Button -->
            <button
              type="button"
              (click)="handleGoogleLogin()"
              class="w-full flex items-center justify-center gap-2.5 rounded-lg border border-[#E2E8F0] bg-white py-2.5 px-4 text-xs font-semibold text-slate-800 shadow-xs hover:bg-[#F8FAFC] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white dark:hover:bg-[#24303F] transition-all cursor-pointer"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google Workspace</span>
            </button>
          </div>

          <!-- Bottom Footer -->
          <div class="mt-8 pt-4 border-t border-[#E2E8F0] dark:border-[#2E3A47] text-center text-[11px] text-[#64748B] dark:text-[#8A99AD]">
            By continuing, you agree to QuikLedgr's
            <a href="javascript:void(0)" class="underline hover:text-[#3C50E0]">Terms of Service</a> and
            <a href="javascript:void(0)" class="underline hover:text-[#3C50E0]">Privacy Policy</a>.
          </div>
        </div>

      </div>
    </div>
  `
})
export class AuthComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);

  isSignUp = signal(false);
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  name = 'Administrator';
  email = 'admin@blukers.com';
  password = 'password123';

  fillDemo(type: 'admin' | 'demo') {
    if (type === 'admin') {
      this.email = 'admin@blukers.com';
      this.password = 'password123';
      this.name = 'System Administrator';
    } else {
      this.email = 'demo@blukers.com';
      this.password = 'demo123';
      this.name = 'Finance Manager';
    }
    this.isSignUp.set(false);
    this.errorMessage.set(null);
  }

  async handleSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      if (this.isSignUp()) {
        await this.auth.register(this.name, this.email, this.password);
      } else {
        await this.auth.login(this.email, this.password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err?.error?.message || err?.message || 'Authentication failed. Please verify credentials.';
      this.errorMessage.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleGoogleLogin() {
    try {
      this.isLoading.set(true);
      await this.auth.loginWithGoogle();
    } catch (err: any) {
      this.errorMessage.set('Google sign-in could not be initiated.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
