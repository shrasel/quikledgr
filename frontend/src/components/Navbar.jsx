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
  User,
  ChevronDown
} from 'lucide-react';

export function Navbar({ 
  currentTab, 
  setCurrentTab, 
  theme, 
  toggleTheme, 
  onNewInvoice, 
  invoiceCount,
  user,
  onLogout 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <header className="navbar no-print">
        <div className="navbar-inner">
          {/* Brand Logo */}
          <div className="brand-badge" onClick={() => setCurrentTab('dashboard')}>
            <div className="brand-logo-icon">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <div className="brand-text-wrap">
              <div className="brand-title">
                QuikLedgr
                <span className="brand-tag">QuickBooks Model</span>
              </div>
              <div className="brand-subtitle">
                Secure Link Invoicing for Monthly Consulting Agreements
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="nav-tabs">
            <button 
              className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button 
              className={`nav-tab-btn ${currentTab === 'editor' ? 'active' : ''}`}
              onClick={() => setCurrentTab('editor')}
            >
              <FileText size={16} />
              <span>Invoice Editor</span>
            </button>

            <button 
              className={`nav-tab-btn ${currentTab === 'list' ? 'active' : ''}`}
              onClick={() => setCurrentTab('list')}
            >
              <Layers size={16} />
              <span>Invoices ({invoiceCount})</span>
            </button>

            <button 
              className={`nav-tab-btn ${currentTab === 'profile' ? 'active' : ''}`}
              onClick={() => setCurrentTab('profile')}
            >
              <Building size={16} />
              <span>Banking & Profile</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="navbar-actions">
            <button 
              className="btn btn-secondary btn-icon-only"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              className="btn btn-primary btn-sm"
              onClick={onNewInvoice}
            >
              <Plus size={16} />
              <span>New Invoice</span>
            </button>

            {/* User Profile Badge & Menu */}
            {user && (
              <div style={{ position: 'relative' }}>
                <button 
                  type="button" 
                  className="user-nav-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={user.name}
                >
                  <img 
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'} 
                    alt={user.name} 
                    className="user-nav-avatar"
                  />
                  <div className="user-nav-text">
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user.email}</div>
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
      <div className="compliance-banner no-print">
        <div className="compliance-inner">
          <div className="compliance-info">
            <span className="compliance-badge">Consulting Agreement Protocol</span>
            <span>
              Submit no later than the <strong>15th day</strong> of following month to <strong>accounting@blukers.com</strong> (cc: <strong>rosa@blukers.com</strong>).
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
            <ShieldCheck size={15} color="#059669" />
            <span>Sensitive wire details encrypted with access code</span>
          </div>
        </div>
      </div>
    </>
  );
}
