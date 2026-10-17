import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  Building2, 
  ChevronDown, 
  User, 
  LogOut, 
  Plus, 
  Check, 
  UserPlus, 
  Sliders, 
  X,
  CreditCard,
  FileText,
  Clock
} from 'lucide-react';

export function Header({
  sidebarOpen,
  setSidebarOpen,
  currentTab,
  setCurrentTab,
  theme,
  toggleTheme,
  user,
  activeOrganization,
  organizations = [],
  onSwitchOrganization,
  onOpenNewOrgModal,
  onOpenInviteModal,
  onLogout,
  onNewInvoice
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [notifyDropdownOpen, setNotifyDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef(null);
  const orgDropdownRef = useRef(null);
  const notifyDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(target)) {
        setOrgDropdownOpen(false);
      }
      if (notifyDropdownRef.current && !notifyDropdownRef.current.contains(target)) {
        setNotifyDropdownOpen(false);
      }
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 w-full items-center bg-white dark:bg-[#1C2434] border-b border-[#E2E8F0] dark:border-[#2E3A47] shadow-xs">
      <div className="flex h-full w-full items-center justify-between px-4 md:px-6 2xl:px-8">
        {/* LEFT: Hamburger Toggle & Global Search Bar */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
          {/* Hamburger Toggle Button (TailAdmin style) */}
          <button
            type="button"
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className="z-50 block rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-xs dark:border-[#2E3A47] dark:bg-[#24303F] lg:hidden text-slate-700 dark:text-slate-200 hover:bg-[#F8FAFC]"
          >
            <Menu size={18} />
          </button>

          {/* Search Box */}
          <div className="hidden sm:block relative flex-1 max-w-md">
            <Search 
              size={16} 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#8A99AD]" 
            />
            <input
              type="text"
              placeholder="Search invoices, clients, payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-2 pl-9 pr-12 text-xs font-medium text-slate-900 placeholder-[#64748B] focus:border-[#3C50E0] focus:bg-white focus:outline-hidden dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-white dark:placeholder-[#8A99AD] transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 rounded bg-[#E2E8F0] dark:bg-[#2E3A47] px-1.5 py-0.5 text-[10px] font-mono text-[#64748B] dark:text-[#8A99AD]">
              <span>⌘K</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Actions, Switcher, Theme, Notifications & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Workspace / Organization Dropdown Switcher */}
          {activeOrganization && (
            <div className="relative" ref={orgDropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOrgDropdownOpen(!orgDropdownOpen);
                  setDropdownOpen(false);
                  setNotifyDropdownOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 px-3 text-left hover:bg-[#F1F5F9] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:hover:bg-[#24303F] transition-all shadow-xs"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#3C50E0]/15 text-[#3C50E0] dark:bg-[#3C50E0]/25 shrink-0">
                  <Building2 size={13} />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#8A99AD] leading-none">Entity</span>
                  <span className="max-w-[120px] truncate font-bold text-xs text-slate-800 dark:text-white leading-tight mt-0.5">
                    {activeOrganization.name}
                  </span>
                </div>
                <ChevronDown size={13} className="text-[#64748B] dark:text-[#8A99AD] shrink-0 ml-0.5" />
              </button>

              {/* Workspaces Menu */}
              {orgDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-xl dark:border-[#2E3A47] dark:bg-[#1C2434] animate-in fade-in zoom-in-95 z-50">
                  <div className="px-3 py-2 border-b border-[#E2E8F0] dark:border-[#2E3A47]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#8A99AD]">
                      Business Entities ({organizations.length})
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto py-1">
                    {organizations.map((org) => {
                      const isCurrent = org.id === activeOrganization.id;
                      return (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => {
                            setOrgDropdownOpen(false);
                            onSwitchOrganization?.(org.id);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg p-2 text-left text-xs transition-colors ${
                            isCurrent
                              ? 'bg-[#3C50E0]/10 font-bold text-[#3C50E0] dark:bg-[#3C50E0]/20 dark:text-white'
                              : 'text-slate-700 hover:bg-[#F1F5F9] dark:text-[#DEE4EE] dark:hover:bg-[#24303F]'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate font-semibold">{org.name}</p>
                            <p className="text-[10px] text-[#64748B] dark:text-[#8A99AD] capitalize">
                              {org.role || 'Owner'} • {org.currency || 'USD'}
                            </p>
                          </div>
                          {isCurrent && <Check size={14} className="text-[#3C50E0] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-[#E2E8F0] dark:border-[#2E3A47] pt-1.5 mt-1 space-y-1">
                    {onOpenNewOrgModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrgDropdownOpen(false);
                          onOpenNewOrgModal();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-semibold text-slate-700 hover:bg-[#F1F5F9] dark:text-[#DEE4EE] dark:hover:bg-[#24303F]"
                      >
                        <Plus size={14} className="text-[#3C50E0]" />
                        <span>Add New Entity / LLC</span>
                      </button>
                    )}

                    {onOpenInviteModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrgDropdownOpen(false);
                          onOpenInviteModal();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg p-2 text-xs font-semibold text-slate-700 hover:bg-[#F1F5F9] dark:text-[#DEE4EE] dark:hover:bg-[#24303F]"
                      >
                        <UserPlus size={14} className="text-[#10B981]" />
                        <span>Invite Team Member</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* "+ New Invoice" Quick Button */}
          {onNewInvoice && (
            <button
              type="button"
              onClick={onNewInvoice}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#3C50E0] py-2 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#3444bf] transition-all"
            >
              <Plus size={14} />
              <span>New Invoice</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:text-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-[#8A99AD] dark:hover:text-white transition-all shadow-xs"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifyDropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNotifyDropdownOpen(!notifyDropdownOpen);
                setDropdownOpen(false);
                setOrgDropdownOpen(false);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-slate-700 hover:text-[#3C50E0] dark:border-[#2E3A47] dark:bg-[#1A222C] dark:text-[#8A99AD] dark:hover:text-white transition-all shadow-xs"
            >
              <span className="absolute 1.5 -top-0.5 -right-0.5 z-1 h-2 w-2 rounded-full bg-[#10B981]">
                <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75"></span>
              </span>
              <Bell size={16} />
            </button>

            {notifyDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xl dark:border-[#2E3A47] dark:bg-[#1C2434] animate-in fade-in zoom-in-95 z-50">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 dark:border-[#2E3A47]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Notifications
                  </span>
                  <span className="rounded bg-[#10B981]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#10B981]">
                    3 New
                  </span>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F] flex items-start gap-2">
                    <CreditCard size={14} className="text-[#10B981] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Payment Received</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#8A99AD]">Payment of $350.00 settled via Stripe Card</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F] flex items-start gap-2">
                    <FileText size={14} className="text-[#3C50E0] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Recurring Invoice Generated</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#8A99AD]">Monthly advisory retainer posted to ledger</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#24303F] flex items-start gap-2">
                    <Clock size={14} className="text-[#F59E0B] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Dunning Escalation Active</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#8A99AD]">Automated reminder scheduled for past-due invoice</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown (TailAdmin style) */}
          <div className="relative pl-2 sm:pl-3 border-l border-[#E2E8F0] dark:border-[#2E3A47]" ref={dropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
                setOrgDropdownOpen(false);
                setNotifyDropdownOpen(false);
              }}
              className="flex items-center gap-2.5 text-left p-1 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1A222C] transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-[#3C50E0] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                {user?.name ? user.name.substring(0, 2) : 'US'}
              </div>

              <div className="hidden lg:block text-left">
                <span className="block text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.name || 'Administrator'}
                </span>
                <span className="block text-[10px] text-[#64748B] dark:text-[#8A99AD] capitalize leading-none mt-0.5">
                  {user?.role || 'Consultant'}
                </span>
              </div>

              <ChevronDown size={13} className="text-[#64748B] dark:text-[#8A99AD] hidden lg:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-lg dark:border-[#2E3A47] dark:bg-[#1C2434] animate-in fade-in zoom-in-95 z-50">
                <div className="border-b border-[#E2E8F0] px-3 py-2.5 dark:border-[#2E3A47]">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#8A99AD] truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setCurrentTab('profile');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-[#F1F5F9] dark:text-[#DEE4EE] dark:hover:bg-[#24303F] transition-colors"
                  >
                    <Sliders size={14} className="text-[#64748B] dark:text-[#8A99AD]" />
                    <span>Profile & Wire Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setCurrentTab('accounting');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-slate-700 hover:bg-[#F1F5F9] dark:text-[#DEE4EE] dark:hover:bg-[#24303F] transition-colors"
                  >
                    <Building2 size={14} className="text-[#64748B] dark:text-[#8A99AD]" />
                    <span>General Ledger & COA</span>
                  </button>
                </div>

                <div className="border-t border-[#E2E8F0] pt-1 dark:border-[#2E3A47]">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout?.();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
