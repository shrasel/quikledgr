import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Organization } from '../../core/models/user.model';

export type SetupStep = 'welcome' | 'business_details' | 'bank_connect' | 'payments' | 'preview_invoice';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-white text-slate-800 flex flex-col justify-between selection:bg-[#055135] selection:text-white">
      
      <!-- TOP NAVIGATION BAR (Header & Progress Bar) -->
      <div>
        <!-- Top Green Progress Line (Screenshots 2-5) -->
        <div class="w-full bg-[#E2E8F0] h-1.5 overflow-hidden">
          <div 
            class="h-full bg-[#055135] transition-all duration-500 ease-out"
            [style.width.%]="progressPercent()"
          ></div>
        </div>

        <header class="flex items-center justify-between px-6 sm:px-12 py-4 border-b border-slate-100">
          <!-- Logo -->
          <div class="flex items-center gap-2.5">
            <img src="/ql-logo-light.png" alt="QuickLedger" class="h-8 sm:h-9 w-auto object-contain" />
          </div>

          <!-- Center step indicator / Title -->
          <div class="hidden sm:block text-xs font-semibold text-slate-500">
            @if (currentStep() !== 'welcome') {
              <span>Get started &bull; Step {{ getStepNumber() }} of 4</span>
            } @else {
              <span>Welcome Setup</span>
            }
          </div>

          <!-- Right Exit / Skip to Dashboard -->
          <div>
            <button
              type="button"
              (click)="skipToDashboard()"
              class="text-xs font-semibold text-[#055135] hover:underline cursor-pointer"
            >
              Skip setup
            </button>
          </div>
        </header>
      </div>

      <!-- MAIN CONTENT CONTAINER -->
      <main class="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 max-w-5xl w-full mx-auto">
        
        <!-- ============================================================== -->
        <!-- STEP 1: WELCOME SCREEN (Screenshot 1)                          -->
        <!-- ============================================================== -->
        @if (currentStep() === 'welcome') {
          <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <!-- Left Info -->
            <div class="lg:col-span-7 space-y-6">
              <div class="space-y-3">
                <h1 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Welcome!
                </h1>
                <p class="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-snug">
                  Get set up fast with AI<br class="hidden sm:inline" /> and expert guidance
                </p>
                <p class="text-sm text-slate-600 leading-relaxed max-w-md pt-1">
                  Tailored specifically for {{ auth.currentUser()?.name || 'your business' }}. Configure your legal entity, bank connections, and customer invoicing in less than 2 minutes.
                </p>
              </div>

              <div class="pt-2">
                <button
                  type="button"
                  (click)="goToStep('business_details')"
                  class="rounded-md bg-[#055135] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#04402a] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Let's get started
                </button>
              </div>
            </div>

            <!-- Right Floating Feature Badges (Matches Screenshot 1 cloud layout) -->
            <div class="lg:col-span-5 flex flex-col items-center justify-center relative py-6">
              <div class="relative w-full max-w-sm h-80 flex flex-wrap items-center justify-center gap-3">
                
                <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-100 animate-pulse hover:shadow-lg transition-shadow">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#055135] text-white text-[10px]">📈</span>
                  <span>Sales & Get Paid</span>
                </div>

                <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">👥</span>
                  <span>Customer Hub</span>
                </div>

                <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">📁</span>
                  <span>Projects</span>
                </div>

                <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-[10px]">📢</span>
                  <span>Marketing</span>
                </div>

                <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 text-white text-[10px]">🤝</span>
                  <span>Team</span>
                </div>

                <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#055135] text-white text-[10px]">⚖️</span>
                  <span>Accounting</span>
                </div>

                <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-[10px]">💳</span>
                  <span>Expenses & Pay Bills</span>
                </div>

                <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white text-[10px]">🔴</span>
                  <span>Tax</span>
                </div>

                <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px]">📦</span>
                  <span>Inventory</span>
                </div>

              </div>
            </div>
          </div>
        }

        <!-- ============================================================== -->
        <!-- STEP 2: BUSINESS DETAILS INPUT FORM (Screenshot 2)             -->
        <!-- ============================================================== -->
        @if (currentStep() === 'business_details') {
          <div class="w-full max-w-2xl space-y-6">
            <div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Tell us about you and your business
              </h2>
              <p class="text-xs sm:text-sm text-slate-600 mt-1">
                This info will help us make better suggestions for your business. (2 min)
              </p>
            </div>

            <form (ngSubmit)="goToStep('bank_connect')" class="space-y-4 pt-2">
              <!-- Field 1: Legal business name -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Your legal business name
                </label>
                <input
                  type="text"
                  [(ngModel)]="businessName"
                  name="businessName"
                  required
                  placeholder="e.g. Acme Advisory LLC"
                  class="w-full rounded-md border border-slate-300 bg-white py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#055135] focus:ring-1 focus:ring-[#055135] focus:outline-hidden transition-all shadow-2xs"
                />
              </div>

              <!-- Field 2: Role -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  What's your role?
                </label>
                <select
                  [(ngModel)]="userRole"
                  name="userRole"
                  class="w-full rounded-md border border-slate-300 bg-white py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-[#055135] focus:ring-1 focus:ring-[#055135] focus:outline-hidden transition-all shadow-2xs"
                >
                  <option value="" disabled selected>Select...</option>
                  <option value="Owner / Founder">Owner / Founder</option>
                  <option value="Partner">Partner</option>
                  <option value="CFO / Finance Director">CFO / Finance Director</option>
                  <option value="Accountant / Bookkeeper">Accountant / Bookkeeper</option>
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Consultant / Independent">Consultant / Independent</option>
                </select>
              </div>

              <!-- Field 3: Business Tax Type -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Business tax type
                </label>
                <select
                  [(ngModel)]="businessType"
                  name="businessType"
                  class="w-full rounded-md border border-slate-300 bg-white py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-[#055135] focus:ring-1 focus:ring-[#055135] focus:outline-hidden transition-all shadow-2xs"
                >
                  <option value="" disabled selected>Select...</option>
                  <option value="Sole Proprietor">Sole proprietorship / Single member LLC</option>
                  <option value="Partnership">Partnership / Multi-member LLC</option>
                  <option value="S Corporation">S Corporation (S-Corp)</option>
                  <option value="C Corporation">C Corporation (C-Corp)</option>
                  <option value="Nonprofit">Nonprofit (501c3)</option>
                </select>
                <p class="text-[11px] text-slate-500 mt-1">
                  LLC isn't shown because an LLC can be created alongside another business type. For example: sole proprietor as a single member LLC.
                </p>
              </div>

              <!-- Field 4: Industry -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  Industry
                </label>
                <div class="relative">
                  <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                  </svg>
                  <input
                    type="text"
                    [(ngModel)]="industry"
                    name="industry"
                    placeholder="Construction, retail, salon, consulting, technology, etc."
                    class="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#055135] focus:ring-1 focus:ring-[#055135] focus:outline-hidden transition-all shadow-2xs"
                  />
                </div>
                <p class="text-[11px] text-slate-500 mt-1">
                  Begin entering your industry and select the option that fits best.
                </p>
              </div>

              <!-- Field 5: Approximate revenue -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">
                  What was your approximate revenue over the last 12 months?
                </label>
                <select
                  [(ngModel)]="annualRevenue"
                  name="annualRevenue"
                  class="w-full rounded-md border border-slate-300 bg-white py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-[#055135] focus:ring-1 focus:ring-[#055135] focus:outline-hidden transition-all shadow-2xs"
                >
                  <option value="" disabled selected>Select...</option>
                  <option value="Just getting started">Just getting started</option>
                  <option value="Under $50,000">Under $50,000</option>
                  <option value="$50,000 - $250,000">$50,000 - $250,000</option>
                  <option value="$250,000 - $1,000,000">$250,000 - $1,000,000</option>
                  <option value="$1M - $5M">$1M - $5M</option>
                  <option value="$5M+">$5M+</option>
                </select>
              </div>

              <!-- Action Bar (Screenshot 2 footer) -->
              <div class="pt-6 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  (click)="goToStep('welcome')"
                  class="rounded-md border border-[#055135] bg-white px-6 py-2 text-xs sm:text-sm font-semibold text-[#055135] hover:bg-[#055135]/5 transition-all cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  class="rounded-md bg-[#055135] px-7 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#04402a] transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        }

        <!-- ============================================================== -->
        <!-- STEP 3: BANK DETAILS / CONNECTION (Screenshot 3)              -->
        <!-- ============================================================== -->
        @if (currentStep() === 'bank_connect') {
          <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <!-- Left Info & Link Button -->
            <div class="lg:col-span-7 space-y-6">
              <div class="space-y-3">
                <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  Connect your bank to see business finances in one place
                </h2>
                <p class="text-sm text-slate-600 leading-relaxed">
                  We'll import and categorize your transactions automatically, so you can quickly mark them as personal or business for accurate tracking and taxes.
                </p>
              </div>

              <!-- Connected Bank Banner -->
              @if (isBankConnected()) {
                <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-emerald-900">{{ selectedBankName() }} Connected</h4>
                    <p class="text-[11px] text-emerald-700">Account (••••{{ selectedBankLast4() }}) verified and synchronized with General Ledger.</p>
                  </div>
                </div>
              }

              <!-- Actions -->
              <div class="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="goToStep('business_details')"
                    class="rounded-md border border-[#055135] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#055135] hover:bg-[#055135]/5 transition-all cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    (click)="openBankModal()"
                    class="rounded-md bg-[#055135] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#04402a] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                    </svg>
                    <span>{{ isBankConnected() ? 'Change Bank' : 'Link accounts' }}</span>
                  </button>
                </div>

                <button
                  type="button"
                  (click)="goToStep('payments')"
                  class="text-xs sm:text-sm font-semibold text-[#055135] hover:underline cursor-pointer"
                >
                  {{ isBankConnected() ? 'Next step →' : 'Skip for now' }}
                </button>
              </div>
            </div>

            <!-- Right Preview Card (Screenshot 3 Profit & Loss Card) -->
            <div class="lg:col-span-5 flex justify-center">
              <div class="relative w-full max-w-sm rounded-2xl p-1 bg-linear-to-tr from-cyan-400 via-emerald-400 to-green-500 shadow-xl">
                <div class="rounded-xl bg-white p-6 space-y-5">
                  <div>
                    <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                      PROFIT &amp; LOSS
                    </span>
                    <h3 class="text-3xl font-black text-slate-900 font-mono tracking-tight mt-1">
                      $2,500
                    </h3>
                    <p class="text-[11px] text-slate-500 mt-0.5">Net profit for last 30 days</p>
                  </div>

                  <div class="space-y-3 pt-2">
                    <div>
                      <div class="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Income</span>
                        <span class="font-mono">$4,200</span>
                      </div>
                      <div class="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div class="h-full bg-emerald-600 rounded-full w-[75%]"></div>
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Expenses</span>
                        <span class="font-mono">$1,700</span>
                      </div>
                      <div class="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div class="h-full bg-teal-500 rounded-full w-[35%]"></div>
                      </div>
                    </div>
                  </div>

                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Live Bank Feed</span>
                    <span class="font-semibold text-emerald-600">✓ Auto-Categorized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ============================================================== -->
        <!-- STEP 4: PAYMENTS SETUP ($5 ON US - Screenshot 4)               -->
        <!-- ============================================================== -->
        @if (currentStep() === 'payments') {
          <div class="w-full max-w-xl text-center space-y-6">
            <!-- Illustration (Hand with cash + sparkles) -->
            <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#055135]/10 text-[#055135]">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
              </svg>
            </div>

            <div class="space-y-3">
              <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                See how payment works with $5 on us
              </h2>
              <p class="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                To show you how easy it is to get paid, we'll pay your $5 sample invoice after you set up online payments. Just let us know where to send your money.
                <a href="javascript:void(0)" class="text-[#055135] underline font-semibold">See terms</a>
              </p>
            </div>

            <!-- Action Bar -->
            <div class="pt-6 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                (click)="goToStep('bank_connect')"
                class="rounded-md border border-[#055135] bg-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#055135] hover:bg-[#055135]/5 transition-all cursor-pointer"
              >
                Back
              </button>

              <div class="flex items-center gap-4">
                <button
                  type="button"
                  (click)="goToStep('preview_invoice')"
                  class="text-xs sm:text-sm font-semibold text-[#055135] hover:underline cursor-pointer"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  (click)="enablePaymentsAndContinue()"
                  class="rounded-md bg-[#055135] px-7 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#04402a] transition-all cursor-pointer"
                >
                  Set up payments
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ============================================================== -->
        <!-- STEP 5: PREVIEW CUSTOMER INVOICE & FINISH (Screenshot 5)       -->
        <!-- ============================================================== -->
        @if (currentStep() === 'preview_invoice') {
          <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <!-- Left Config -->
            <div class="lg:col-span-6 space-y-6">
              <div class="space-y-2">
                <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Now, preview what your customer will see
                </h2>
                <p class="text-xs sm:text-sm text-slate-600">
                  Send yourself a sample invoice and see how it'll look in your customer's inbox.
                </p>
              </div>

              <!-- Form to email invoice -->
              <div class="space-y-4 pt-2">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email yourself a sample invoice
                </h4>

                <div class="text-xs text-slate-600 space-y-1">
                  <p class="font-bold text-slate-800">Subject</p>
                  <p class="text-slate-600 bg-slate-50 p-2 rounded-md font-medium border border-slate-200">
                    Invoice 0001 from {{ businessName || 'Your Business' }}
                  </p>
                </div>

                <div class="text-xs text-slate-600 space-y-1">
                  <p class="font-bold text-slate-800">From</p>
                  <p class="text-slate-500 font-mono text-[11px]">
                    billing&#64;notification.quikledgr.com
                  </p>
                </div>

                <div class="space-y-1">
                  <label class="block text-xs font-bold text-slate-800">Send to your email</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="email"
                      [(ngModel)]="sampleEmail"
                      placeholder="name@company.com"
                      class="flex-1 rounded-md border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-[#055135] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      (click)="sendSampleInvoice()"
                      [disabled]="isSendingEmail()"
                      class="rounded-md border border-[#055135] bg-white px-4 py-2 text-xs font-bold text-[#055135] hover:bg-[#055135]/5 cursor-pointer disabled:opacity-50"
                    >
                      {{ isSendingEmail() ? 'Sending...' : 'Send' }}
                    </button>
                  </div>
                  @if (emailSentSuccess()) {
                    <p class="text-xs text-emerald-600 font-semibold pt-1">
                      ✓ Sample test invoice simulated to {{ sampleEmail }}!
                    </p>
                  }
                </div>
              </div>

              <!-- Footer Actions -->
              <div class="pt-6 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  (click)="goToStep('payments')"
                  class="rounded-md border border-[#055135] bg-white px-5 py-2 text-xs sm:text-sm font-semibold text-[#055135] hover:bg-[#055135]/5 cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  (click)="finishSetup()"
                  [disabled]="isSaving()"
                  class="rounded-md bg-[#055135] px-7 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#04402a] transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{{ isSaving() ? 'Saving workspace...' : 'Go to Dashboard' }}</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Right Interactive Email Preview Card (Matches Screenshot 5) -->
            <div class="lg:col-span-6">
              <div class="text-right text-[11px] font-semibold text-slate-400 mb-1">Email Preview</div>
              
              <div class="w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden text-center">
                <!-- Mint Green Top Banner -->
                <div class="bg-[#F0FDF4] p-8 border-b border-emerald-100">
                  <h3 class="text-xl font-extrabold text-slate-900">
                    Your invoice is ready!
                  </h3>
                  <p class="text-xs text-slate-500 mt-1">Total $5.00</p>
                  
                  <div class="mt-4">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">BALANCE DUE</span>
                    <span class="text-4xl font-extrabold font-mono text-slate-900 mt-0.5 block">$5.00</span>
                  </div>
                </div>

                <!-- Email Body -->
                <div class="p-8 space-y-6">
                  <p class="text-xs text-slate-600 max-w-sm mx-auto">
                    The email message you write will go here. Thank you for your business!
                  </p>

                  <div>
                    <button
                      type="button"
                      class="rounded-full bg-[#5BB85D] px-8 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition-colors pointer-events-none"
                    >
                      View details
                    </button>
                  </div>

                  <div class="pt-6 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <p class="font-bold text-slate-800">{{ businessName || 'No company name' }}</p>
                    <p class="text-emerald-700 font-medium">{{ sampleEmail || auth.currentUser()?.email }}</p>
                    <p class="text-slate-400 text-[11px]">+1 (641) 819-1496</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

      </main>

      <!-- BOTTOM BRAND FOOTER -->
      <footer class="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        &copy; 2026 QuikLedgr Financial Ledger Systems. All data secured with 256-Bit TLS Bank Encryption.
      </footer>

      <!-- MOCK BANK CONNECT MODAL -->
      @if (showBankModal()) {
        <div 
          (click)="showBankModal.set(false)"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            (click)="$event.stopPropagation()"
            class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 cursor-default"
          >
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 class="text-base font-bold text-slate-900">Select your bank</h4>
                <p class="text-xs text-slate-500">Securely connect bank feed via open banking protocol.</p>
              </div>
              <button
                type="button"
                (click)="showBankModal.set(false)"
                class="text-slate-400 hover:text-slate-800 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div class="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto py-1">
              @for (b of popularBanks; track b.name) {
                <button
                  type="button"
                  (click)="selectBank(b.name, b.last4)"
                  class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#055135] hover:bg-[#055135]/5 transition-all text-left cursor-pointer group"
                >
                  <span class="text-xl">{{ b.icon }}</span>
                  <div class="truncate">
                    <p class="text-xs font-bold text-slate-900 group-hover:text-[#055135] truncate">{{ b.name }}</p>
                    <p class="text-[10px] text-slate-400 font-mono">••••{{ b.last4 }}</p>
                  </div>
                </button>
              }
            </div>

            <div class="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                (click)="showBankModal.set(false)"
                class="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class SetupComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);

  currentStep = signal<SetupStep>('welcome');
  isSaving = signal(false);
  isSendingEmail = signal(false);
  emailSentSuccess = signal(false);
  showBankModal = signal(false);

  // Form Model
  businessName = '';
  userRole = 'Owner / Founder';
  businessType = 'Sole Proprietor';
  industry = 'Consulting & Technology Services';
  annualRevenue = '$50,000 - $250,000';

  // Bank Info
  isBankConnected = signal(false);
  selectedBankName = signal('Chase Business Checking');
  selectedBankLast4 = signal('4829');

  sampleEmail = '';

  popularBanks = [
    { name: 'Chase Bank', last4: '4829', icon: '🏦' },
    { name: 'Bank of America', last4: '9102', icon: '🏛️' },
    { name: 'Wells Fargo', last4: '1240', icon: '🐎' },
    { name: 'Mercury Bank', last4: '7721', icon: '⚡' },
    { name: 'Brex Treasury', last4: '3819', icon: '💳' },
    { name: 'Silicon Valley Bank', last4: '6402', icon: '🌐' },
    { name: 'Citibank N.A.', last4: '5519', icon: '🏢' },
    { name: 'Capital One Business', last4: '8820', icon: '🪙' }
  ];

  progressPercent = computed(() => {
    switch (this.currentStep()) {
      case 'welcome': return 5;
      case 'business_details': return 33;
      case 'bank_connect': return 66;
      case 'payments': return 85;
      case 'preview_invoice': return 100;
    }
  });

  ngOnInit(): void {
    const org = this.auth.activeOrganization();
    const user = this.auth.currentUser();

    if (org?.name) {
      this.businessName = org.name;
    } else if (user?.businessName) {
      this.businessName = user.businessName;
    } else if (user?.name) {
      this.businessName = `${user.name} Advisory LLC`;
    }

    if (org?.userRole) this.userRole = org.userRole;
    if (org?.businessType) this.businessType = org.businessType;
    if (org?.industry) this.industry = org.industry;
    if (org?.annualRevenue) this.annualRevenue = org.annualRevenue;
    if (org?.isBankConnected) {
      this.isBankConnected.set(true);
      if (org.bankName) this.selectedBankName.set(org.bankName);
      if (org.bankAccountLast4) this.selectedBankLast4.set(org.bankAccountLast4);
    }

    this.sampleEmail = user?.email || 'shahjahan.rasell@gmail.com';
  }

  getStepNumber(): number {
    switch (this.currentStep()) {
      case 'business_details': return 1;
      case 'bank_connect': return 2;
      case 'payments': return 3;
      case 'preview_invoice': return 4;
      default: return 1;
    }
  }

  goToStep(step: SetupStep): void {
    this.currentStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openBankModal(): void {
    this.showBankModal.set(true);
  }

  selectBank(name: string, last4: string): void {
    this.selectedBankName.set(name);
    this.selectedBankLast4.set(last4);
    this.isBankConnected.set(true);
    this.showBankModal.set(false);
  }

  enablePaymentsAndContinue(): void {
    this.goToStep('preview_invoice');
  }

  async sendSampleInvoice(): Promise<void> {
    this.isSendingEmail.set(true);
    this.emailSentSuccess.set(false);
    await new Promise(resolve => setTimeout(resolve, 800));
    this.isSendingEmail.set(false);
    this.emailSentSuccess.set(true);
  }

  async finishSetup(): Promise<void> {
    this.isSaving.set(true);
    try {
      const payload: Partial<Organization> = {
        name: this.businessName.trim() || 'My Business LLC',
        legalName: this.businessName.trim() || 'My Business LLC',
        userRole: this.userRole,
        businessType: this.businessType,
        industry: this.industry,
        annualRevenue: this.annualRevenue,
        bankName: this.selectedBankName(),
        bankAccountLast4: this.selectedBankLast4(),
        isBankConnected: this.isBankConnected(),
        setupCompleted: true
      };

      await this.auth.updateCurrentOrganization(payload);
      const activeOrg = this.auth.activeOrganization();
      if (activeOrg) {
        localStorage.setItem(`quikledgr_setup_completed_${activeOrg.id}`, 'true');
      }
      await this.router.navigate(['/dashboard']);
    } catch (e) {
      console.warn('Could not update organization on server, storing locally:', e);
      const activeOrg = this.auth.activeOrganization();
      if (activeOrg) {
        localStorage.setItem(`quikledgr_setup_completed_${activeOrg.id}`, 'true');
      }
      await this.router.navigate(['/dashboard']);
    } finally {
      this.isSaving.set(false);
    }
  }

  async skipToDashboard(): Promise<void> {
    const activeOrg = this.auth.activeOrganization();
    if (activeOrg) {
      localStorage.setItem(`quikledgr_setup_completed_${activeOrg.id}`, 'true');
    }
    await this.router.navigate(['/dashboard']);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showBankModal.set(false);
  }
}
