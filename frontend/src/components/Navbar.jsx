import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  ShieldCheck, 
  Plus, 
  Sun, 
  Moon, 
  Building, 
  LayoutDashboard, 
  LogOut, 
  ChevronDown,
  Info,
  X,
  Scale,
  Check,
  UserPlus
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
          {/* Brand Logo */}
          <div className="brand-badge" onClick={() => setCurrentTab('dashboard')} role="button" tabIndex={0}>
            <div className="brand-logo-icon">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <div className="brand-text-wrap">
              <div className="brand-title">
                QuikLedgr
                <span className="brand-tag">QuickBooks Model</span>
              </div>
              <div className="brand-subtitle hidden sm:block">
                Secure Link Invoicing for Monthly Consulting Agreements
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="nav-tabs hidden lg:flex">
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
              className={`nav-tab-btn ${currentTab === 'editor' ? 'active' : ''}`}
              onClick={() => setCurrentTab('editor')}
            >
              <FileText size={15} />
              <span>Invoice Editor</span>
            </button>

            <button 
              type="button"
              className={`nav-tab-btn ${currentTab === 'list' ? 'active' : ''}`}
              onClick={() => setCurrentTab('list')}
            >
              <Layers size={15} />
              <span>Invoices ({invoiceCount})</span>
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
              <Building size={15} />
              <span>Banking & Profile</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="navbar-actions flex items-center gap-2">
            {/* Multi-Tenant Organization Switcher */}
            {activeOrganization && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="org-nav-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  onClick={() => {
                    setShowOrgMenu(!showOrgMenu);
                    setShowUserMenu(false);
                  }}
                  title="Switch business workspace"
                >
                  <Building size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="max-w-[120px] truncate hidden sm:inline">{activeOrganization.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {activeOrganization.role || 'Owner'}
                  </span>
                  <ChevronDown size={13} className="text-slate-400" />
                </button>

                {showOrgMenu && (
                  <div className="user-dropdown-menu" style={{ width: '260px', right: 0 }}>
                    <div className="dropdown-user-header">
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                        Active Workspaces ({organizations.length})
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {organizations.map((org) => {
                        const isSelected = org.id === activeOrganization.id;
                        return (
                          <button
                            key={org.id}
                            type="button"
                            className={`dropdown-item w-full flex items-center justify-between text-left ${isSelected ? 'bg-slate-50 dark:bg-slate-800 font-bold' : ''}`}
                            onClick={() => {
                              setShowOrgMenu(false);
                              onSwitchOrganization?.(org.id);
                            }}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate text-xs text-slate-800 dark:text-slate-200">{org.name}</div>
                              <div className="text-[10px] text-slate-400 capitalize">{org.role} • {org.currency}</div>
                            </div>
                            {isSelected && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.35rem 0' }} />

                    <button
                      type="button"
                      className="dropdown-item text-xs"
                      onClick={() => {
                        setShowOrgMenu(false);
                        onOpenNewOrgModal?.();
                      }}
                    >
                      <Plus size={14} className="text-emerald-600" />
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
                        <UserPlus size={14} className="text-blue-600" />
                        <span>Invite Team Member (RBAC)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button 
              type="button"
              className="btn btn-secondary btn-icon-only"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button 
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              onClick={onNewInvoice}
              title="Create new monthly invoice"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Invoice</span>
            </button>

            {/* User Profile Badge & Menu */}
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
                  <div className="user-nav-text hidden md:flex flex-col text-left">
                    <span className="user-nav-name">{user.name}</span>
                    <span className="user-nav-provider">
                      {user.provider === 'google' ? 'Google Account' : 'Consultant'}
                    </span>
                  </div>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </button>

                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-user-header">
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="dropdown-item"
                      onClick={() => { setCurrentTab('profile'); setShowUserMenu(false); }}
                    >
                      <Building size={15} />
                      <span>Company & Wire Profile</span>
                    </button>

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.35rem 0' }} />

                    <button 
                      type="button" 
                      className="dropdown-item logout-item"
                      onClick={() => { setShowUserMenu(false); onLogout(); }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Compliance Helper Bar */}
      {showComplianceBanner && (
        <div className="compliance-banner no-print">
          <div className="compliance-inner">
            <div className="compliance-info flex items-center flex-wrap gap-1.5">
              <span className="compliance-badge">Consulting Agreement Protocol</span>
              <span className="text-xs sm:text-sm">
                Submit no later than the <strong>15th day</strong> of following month to <strong>accounting@blukers.com</strong> (cc: <strong>rosa@blukers.com</strong>).
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={14} color="#059669" />
              <span>Sensitive wire details encrypted with access code</span>
            </div>
            <button 
              type="button" 
              onClick={() => setShowComplianceBanner(false)}
              className="text-emerald-800 dark:text-emerald-300 hover:opacity-75 p-0.5 ml-auto sm:ml-0"
              title="Dismiss protocol banner"
              aria-label="Dismiss banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav lg:hidden no-print" aria-label="Mobile Navigation">
        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          <div className="mobile-nav-icon-wrap">
            <LayoutDashboard size={20} />
          </div>
          <span className="mobile-nav-label">Dashboard</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'editor' ? 'active' : ''}`}
          onClick={() => setCurrentTab('editor')}
        >
          <div className="mobile-nav-icon-wrap">
            <FileText size={20} />
          </div>
          <span className="mobile-nav-label">Editor</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'list' ? 'active' : ''}`}
          onClick={() => setCurrentTab('list')}
        >
          <div className="mobile-nav-icon-wrap relative">
            <Layers size={20} />
            {invoiceCount > 0 && (
              <span className="mobile-nav-badge">{invoiceCount}</span>
            )}
          </div>
          <span className="mobile-nav-label">Invoices</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'accounting' ? 'active' : ''}`}
          onClick={() => setCurrentTab('accounting')}
        >
          <div className="mobile-nav-icon-wrap">
            <Scale size={20} />
          </div>
          <span className="mobile-nav-label">Ledger</span>
        </button>

        <button 
          type="button" 
          className={`mobile-nav-item ${currentTab === 'profile' ? 'active' : ''}`}
          onClick={() => setCurrentTab('profile')}
        >
          <div className="mobile-nav-icon-wrap">
            <Building size={20} />
          </div>
          <span className="mobile-nav-label">Profile</span>
        </button>
      </nav>
    </>
  );
}
