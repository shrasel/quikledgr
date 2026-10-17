import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Plus, 
  Sun, 
  Moon, 
  Building2, 
  LayoutDashboard, 
  LogOut, 
  ChevronDown, 
  Scale, 
  Check, 
  UserPlus,
  Sliders,
  X,
  FileCheck,
  Repeat,
  Clock,
  CreditCard,
  MoreHorizontal
} from 'lucide-react';

export function Navbar({ 
  currentTab, 
  setCurrentTab, 
  theme, 
  toggleTheme, 
  onNewInvoice, 
  invoiceCount,
  user,
  organizations = [],
  activeOrganization = null,
  onSwitchOrganization,
  onOpenNewOrgModal,
  onOpenInviteModal,
  onLogout 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showComplianceBanner, setShowComplianceBanner] = useState(true);

  return (
    <>
      <header className="navbar no-print">
        <div className="navbar-inner">
          {/* Brand Logo - Material Design 3 */}
          <div 
            className="brand-badge" 
            onClick={() => setCurrentTab('dashboard')} 
            role="button" 
            tabIndex={0}
          >
            <div className="brand-logo-icon">
              <FileText size={18} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <div className="brand-title">
                QuikLedgr
                <span className="brand-tag">v2.0</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation: Material 3 Horizontal Tabs */}
          <nav className="nav-tabs hidden lg:flex" aria-label="Main Navigation">
            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'list' ? 'active' : ''}`}
              onClick={() => setCurrentTab('list')}
            >
              <Layers size={15} />
              <span>Invoices</span>
              {invoiceCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-semibold ml-0.5 text-slate-800 dark:text-slate-200">
                  {invoiceCount}
                </span>
              )}
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'quotes' ? 'active' : ''}`}
              onClick={() => setCurrentTab('quotes')}
            >
              <FileCheck size={15} />
              <span>Quotes</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'recurring' ? 'active' : ''}`}
              onClick={() => setCurrentTab('recurring')}
            >
              <Repeat size={15} />
              <span>Recurring</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'ar' ? 'active' : ''}`}
              onClick={() => setCurrentTab('ar')}
            >
              <Clock size={15} />
              <span>AR Aging</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'payments' ? 'active' : ''}`}
              onClick={() => setCurrentTab('payments')}
            >
              <CreditCard size={15} />
              <span>Payments</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'editor' ? 'active' : ''}`}
              onClick={() => setCurrentTab('editor')}
            >
              <FileText size={15} />
              <span>Editor</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'accounting' ? 'active' : ''}`}
              onClick={() => setCurrentTab('accounting')}
            >
              <Scale size={15} />
              <span>Accounting</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentTab('profile')}
            >
              <Sliders size={15} />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right Controls: Workspace Pill, Theme Toggle, New Invoice, User Avatar */}
          <div className="navbar-actions">
            {/* Active Workspace Switcher */}
            {activeOrganization && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="org-nav-btn"
                  onClick={() => {
                    setShowOrgMenu(!showOrgMenu);
                    setShowUserMenu(false);
                  }}
                  title="Switch workspace entity"
                >
                  <Building2 size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="max-w-[120px] truncate hidden sm:inline">{activeOrganization.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 uppercase font-semibold text-slate-600 dark:text-slate-300">
                    {activeOrganization.role || 'Owner'}
                  </span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                {showOrgMenu && (
                  <div className="user-dropdown-menu" style={{ width: '250px' }}>
                    <div className="dropdown-user-header">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                        Workspaces ({organizations.length})
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                      {organizations.map((org) => {
                        const isSelected = org.id === activeOrganization.id;
                        return (
                          <button
                            key={org.id}
                            type="button"
                            className={`dropdown-item justify-between ${isSelected ? 'font-semibold bg-slate-100 dark:bg-slate-800' : ''}`}
                            onClick={() => {
                              setShowOrgMenu(false);
                              onSwitchOrganization?.(org.id);
                            }}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate text-xs text-slate-900 dark:text-white">{org.name}</div>
                              <div className="text-[11px] text-slate-500 capitalize">{org.role} • {org.currency}</div>
                            </div>
                            {isSelected && <Check size={14} className="text-slate-900 dark:text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ borderTop: '1px solid var(--md-sys-outline-variant)', margin: '0.35rem 0' }} />

                    <button
                      type="button"
                      className="dropdown-item text-xs"
                      onClick={() => {
                        setShowOrgMenu(false);
                        onOpenNewOrgModal?.();
                      }}
                    >
                      <Plus size={14} />
                      <span>New Business Entity / LLC</span>
                    </button>

                    {['owner', 'admin'].includes(activeOrganization.role) && (
                      <button
                        type="button"
                        className="dropdown-item text-xs"
                        onClick={() => {
                          setShowOrgMenu(false);
                          onOpenInviteModal?.();
                        }}
                      >
                        <UserPlus size={14} />
                        <span>Invite Member (RBAC)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle Button */}
            <button 
              type="button"
              className="btn btn-secondary btn-icon-only"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* New Invoice Action Button */}
            <button 
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={onNewInvoice}
              title="Create new monthly invoice"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">New Invoice</span>
            </button>

            {/* User Profile Avatar & Sheet */}
            {user && (
              <div style={{ position: 'relative' }}>
                <button 
                  type="button" 
                  className="user-nav-btn"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowOrgMenu(false);
                  }}
                  title={user.name}
                >
                  <img 
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'} 
                    alt={user.name} 
                    className="user-nav-avatar"
                  />
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-user-header">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">{user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                    </div>

                    <button 
                      type="button" 
                      className="dropdown-item"
                      onClick={() => { setCurrentTab('profile'); setShowUserMenu(false); }}
                    >
                      <Sliders size={14} />
                      <span>Banking & Profile Settings</span>
                    </button>

                    <div style={{ borderTop: '1px solid var(--md-sys-outline-variant)', margin: '0.35rem 0' }} />

                    <button 
                      type="button" 
                      className="dropdown-item logout-item"
                      onClick={() => { setShowUserMenu(false); onLogout(); }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Protocol Banner: Understated Material Information Strip */}
      {showComplianceBanner && (
        <div className="compliance-banner no-print">
          <div className="compliance-inner">
            <div className="flex items-center gap-2 truncate">
              <span className="compliance-badge">Protocol</span>
              <span className="truncate">
                Submit by 15th of following month to <strong>accounting@blukers.com</strong> (cc: <strong>rosa@blukers.com</strong>).
              </span>
            </div>
            <button 
              type="button" 
              onClick={() => setShowComplianceBanner(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 ml-auto"
              title="Dismiss"
              aria-label="Dismiss banner"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Material Mobile-First Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav lg:hidden no-print" aria-label="Mobile Navigation">
        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setCurrentTab('dashboard'); setShowMobileMore(false); }}
        >
          <div className="mobile-nav-icon-wrap">
            <LayoutDashboard size={18} />
          </div>
          <span className="mobile-nav-label">Dashboard</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'list' ? 'active' : ''}`}
          onClick={() => { setCurrentTab('list'); setShowMobileMore(false); }}
        >
          <div className="mobile-nav-icon-wrap">
            <Layers size={18} />
            {invoiceCount > 0 && (
              <span className="mobile-nav-badge">{invoiceCount}</span>
            )}
          </div>
          <span className="mobile-nav-label">Invoices</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'quotes' ? 'active' : ''}`}
          onClick={() => { setCurrentTab('quotes'); setShowMobileMore(false); }}
        >
          <div className="mobile-nav-icon-wrap">
            <FileCheck size={18} />
          </div>
          <span className="mobile-nav-label">Quotes</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'ar' ? 'active' : ''}`}
          onClick={() => { setCurrentTab('ar'); setShowMobileMore(false); }}
        >
          <div className="mobile-nav-icon-wrap">
            <Clock size={18} />
          </div>
          <span className="mobile-nav-label">AR Aging</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${['payments', 'recurring', 'editor', 'accounting', 'profile'].includes(currentTab) || showMobileMore ? 'active' : ''}`}
          onClick={() => setShowMobileMore(!showMobileMore)}
        >
          <div className="mobile-nav-icon-wrap">
            <MoreHorizontal size={18} />
          </div>
          <span className="mobile-nav-label">More</span>
        </button>
      </nav>

      {/* Mobile More Drawer Overlay */}
      {showMobileMore && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end lg:hidden no-print"
          onClick={() => setShowMobileMore(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-t-2xl p-4 shadow-xl border-t border-slate-200 dark:border-slate-800 space-y-2 mb-16 animate-in slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">More QuikLedgr Tools</span>
              <button 
                type="button" 
                onClick={() => setShowMobileMore(false)}
                className="text-slate-400 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                className={`p-3 rounded-lg text-left border flex flex-col gap-1.5 transition-colors ${
                  currentTab === 'payments' 
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => { setCurrentTab('payments'); setShowMobileMore(false); }}
              >
                <CreditCard size={18} className="text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Payments & Portal</span>
                <span className="text-[10px] text-slate-400">Ledger & checkout</span>
              </button>

              <button
                type="button"
                className={`p-3 rounded-lg text-left border flex flex-col gap-1.5 transition-colors ${
                  currentTab === 'recurring' 
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => { setCurrentTab('recurring'); setShowMobileMore(false); }}
              >
                <Repeat size={18} className="text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Recurring Retainers</span>
                <span className="text-[10px] text-slate-400">Automated billing</span>
              </button>

              <button
                type="button"
                className={`p-3 rounded-lg text-left border flex flex-col gap-1.5 transition-colors ${
                  currentTab === 'accounting' 
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => { setCurrentTab('accounting'); setShowMobileMore(false); }}
              >
                <Scale size={18} className="text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Ledger & COA</span>
                <span className="text-[10px] text-slate-400">Double-entry books</span>
              </button>

              <button
                type="button"
                className={`p-3 rounded-lg text-left border flex flex-col gap-1.5 transition-colors ${
                  currentTab === 'editor' 
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => { setCurrentTab('editor'); setShowMobileMore(false); }}
              >
                <FileText size={18} className="text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Invoice Editor</span>
                <span className="text-[10px] text-slate-400">Live customization</span>
              </button>

              <button
                type="button"
                className={`p-3 rounded-lg text-left border flex flex-col gap-1.5 transition-colors ${
                  currentTab === 'profile' 
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => { setCurrentTab('profile'); setShowMobileMore(false); }}
              >
                <Sliders size={18} className="text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Settings & Wire</span>
                <span className="text-[10px] text-slate-400">Payment details</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
