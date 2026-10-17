import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Plus, 
  Sun, 
  Moon, 
  Building, 
  LayoutDashboard, 
  LogOut, 
  ChevronDown, 
  Scale, 
  Check, 
  UserPlus,
  Sliders,
  X
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
  const [showComplianceBanner, setShowComplianceBanner] = useState(true);

  return (
    <>
      <header className="navbar no-print">
        <div className="navbar-inner">
          {/* Brand Logo - Minimalist Apple Style */}
          <div 
            className="brand-badge" 
            onClick={() => setCurrentTab('dashboard')} 
            role="button" 
            tabIndex={0}
          >
            <div className="brand-logo-icon">
              <FileText size={17} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <div className="brand-title">
                QuikLedgr
                <span className="brand-tag">v2.0</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation: Apple Segmented Pill Switcher */}
          <nav className="nav-tabs hidden lg:flex" aria-label="Main Navigation">
            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'list' ? 'active' : ''}`}
              onClick={() => setCurrentTab('list')}
            >
              <Layers size={14} />
              <span>Invoices</span>
              {invoiceCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 font-bold ml-0.5">
                  {invoiceCount}
                </span>
              )}
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'editor' ? 'active' : ''}`}
              onClick={() => setCurrentTab('editor')}
            >
              <FileText size={14} />
              <span>Editor</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'accounting' ? 'active' : ''}`}
              onClick={() => setCurrentTab('accounting')}
            >
              <Scale size={14} />
              <span>Accounting</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentTab('profile')}
            >
              <Sliders size={14} />
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
                  <Building size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="max-w-[110px] truncate hidden sm:inline">{activeOrganization.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 uppercase font-semibold text-slate-600 dark:text-slate-300">
                    {activeOrganization.role || 'Owner'}
                  </span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                {showOrgMenu && (
                  <div className="user-dropdown-menu" style={{ width: '250px' }}>
                    <div className="dropdown-user-header">
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
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
                            className={`dropdown-item justify-between ${isSelected ? 'font-semibold bg-slate-50 dark:bg-slate-800/60' : ''}`}
                            onClick={() => {
                              setShowOrgMenu(false);
                              onSwitchOrganization?.(org.id);
                            }}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate text-xs">{org.name}</div>
                              <div className="text-[10px] text-slate-400 capitalize">{org.role} • {org.currency}</div>
                            </div>
                            {isSelected && <Check size={14} className="text-slate-900 dark:text-white shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ borderTop: '1px solid var(--apple-divider)', margin: '0.35rem 0' }} />

                    <button
                      type="button"
                      className="dropdown-item text-xs"
                      onClick={() => {
                        setShowOrgMenu(false);
                        onOpenNewOrgModal?.();
                      }}
                    >
                      <Plus size={13} />
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
                        <UserPlus size={13} />
                        <span>Invite Member (RBAC)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Apple Minimalist Theme Toggle */}
            <button 
              type="button"
              className="btn btn-secondary btn-icon-only"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* New Invoice Action */}
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
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    </div>

                    <button 
                      type="button" 
                      className="dropdown-item"
                      onClick={() => { setCurrentTab('profile'); setShowUserMenu(false); }}
                    >
                      <Sliders size={14} />
                      <span>Banking & Profile Settings</span>
                    </button>

                    <div style={{ borderTop: '1px solid var(--apple-divider)', margin: '0.35rem 0' }} />

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

      {/* Protocol Banner: Understated Apple Information Strip */}
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

      {/* Mobile-First Floating Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav lg:hidden no-print" aria-label="Mobile Navigation">
        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          <div className="mobile-nav-icon-wrap">
            <LayoutDashboard size={18} />
          </div>
          <span className="mobile-nav-label">Dashboard</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'list' ? 'active' : ''}`}
          onClick={() => setCurrentTab('list')}
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
          className={`mobile-nav-item ${currentTab === 'editor' ? 'active' : ''}`}
          onClick={() => setCurrentTab('editor')}
        >
          <div className="mobile-nav-icon-wrap">
            <FileText size={18} />
          </div>
          <span className="mobile-nav-label">Editor</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'accounting' ? 'active' : ''}`}
          onClick={() => setCurrentTab('accounting')}
        >
          <div className="mobile-nav-icon-wrap">
            <Scale size={18} />
          </div>
          <span className="mobile-nav-label">Ledger</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'profile' ? 'active' : ''}`}
          onClick={() => setCurrentTab('profile')}
        >
          <div className="mobile-nav-icon-wrap">
            <Sliders size={18} />
          </div>
          <span className="mobile-nav-label">Settings</span>
        </button>
      </nav>
    </>
  );
}
