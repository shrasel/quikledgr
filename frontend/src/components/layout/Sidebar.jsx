import React, { useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  FileCheck, 
  Repeat, 
  Clock, 
  FileText, 
  CreditCard, 
  Scale, 
  Sliders, 
  Building2, 
  ChevronRight, 
  X,
  Plus,
  ShieldCheck
} from 'lucide-react';

export function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen, 
  currentTab, 
  setCurrentTab, 
  invoiceCount = 0,
  activeOrganization,
  organizations = [],
  onSwitchOrganization,
  onOpenNewOrgModal
}) {
  const sidebar = useRef(null);

  // Close on click outside on mobile
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current) return;
      if (!sidebarOpen || sidebar.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // Close on ESC
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  const menuGroups = [
    {
      name: 'MENU',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <LayoutDashboard size={18} />,
        },
      ],
    },
    {
      name: 'INVOICING & AR',
      items: [
        {
          id: 'list',
          label: 'Invoices',
          icon: <Layers size={18} />,
          badge: invoiceCount > 0 ? invoiceCount : null,
        },
        {
          id: 'quotes',
          label: 'Quotes & Proposals',
          icon: <FileCheck size={18} />,
        },
        {
          id: 'recurring',
          label: 'Recurring Retainers',
          icon: <Repeat size={18} />,
        },
        {
          id: 'ar',
          label: 'AR Aging & Dunning',
          icon: <Clock size={18} />,
        },
        {
          id: 'editor',
          label: 'Invoice Editor',
          icon: <FileText size={18} />,
        },
      ],
    },
    {
      name: 'PAYMENTS & PORTAL',
      items: [
        {
          id: 'payments',
          label: 'Payments & Portal',
          icon: <CreditCard size={18} />,
          tag: 'Stripe/ACH',
        },
      ],
    },
    {
      name: 'FINANCE & LEDGER',
      items: [
        {
          id: 'accounting',
          label: 'Chart of Accounts & GL',
          icon: <Scale size={18} />,
        },
      ],
    },
    {
      name: 'SETTINGS',
      items: [
        {
          id: 'profile',
          label: 'Entity & Wire Details',
          icon: <Sliders size={18} />,
        },
      ],
    },
  ];

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        ref={sidebar}
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 min-w-[288px] max-w-[288px] shrink-0 flex-shrink-0 flex-col overflow-y-hidden bg-[#1C2434] duration-200 ease-in-out border-r border-[#2E3A47] lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* SIDEBAR HEADER: Logo & Mobile Close */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-6 border-b border-[#2E3A47]">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => handleSelectTab('dashboard')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3C50E0] text-white shadow-md">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white leading-none">QuikLedgr</span>
                <span className="rounded bg-[#3C50E0]/80 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-[#8A99AD] font-medium tracking-wide mt-0.5">
                Enterprise Ledger & AR
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-controls="sidebar"
            className="block text-[#8A99AD] hover:text-white lg:hidden p-1.5 rounded-md hover:bg-[#333A48]"
          >
            <X size={18} />
          </button>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <div className="no-scrollbar flex flex-col overflow-y-auto duration-200 ease-linear py-5 px-4 flex-1 space-y-6">
          <nav className="space-y-6">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="mb-2 ml-3 text-[10px] font-bold uppercase tracking-wider text-[#8A99AD]">
                  {group.name}
                </h3>

                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = currentTab === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          className={`group relative flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-xs font-medium duration-150 transition-all ${
                            isActive
                              ? 'bg-[#333A48] text-white shadow-xs font-semibold'
                              : 'text-[#DEE4EE] hover:bg-[#333A48]/50 hover:text-white'
                          }`}
                        >
                          <span className={`shrink-0 ${isActive ? 'text-[#3C50E0]' : 'text-[#8A99AD] group-hover:text-white'}`}>
                            {item.icon}
                          </span>

                          <span className="flex-1 text-left truncate">{item.label}</span>

                          {item.badge !== undefined && item.badge !== null && (
                            <span className="shrink-0 rounded-full bg-[#3C50E0] px-2 py-0.5 text-[10px] font-bold text-white font-mono">
                              {item.badge}
                            </span>
                          )}

                          {item.tag && (
                            <span className="shrink-0 rounded bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-tight">
                              {item.tag}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* SIDEBAR FOOTER: Workspace Quick Status */}
        {activeOrganization && (
          <div className="border-t border-[#2E3A47] p-3.5 bg-[#1A222C]/80 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 truncate">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#333A48] text-white">
                  <Building2 size={15} />
                </div>
                <div className="truncate">
                  <p className="truncate text-xs font-semibold text-white">
                    {activeOrganization.name}
                  </p>
                  <p className="text-[10px] text-[#8A99AD] capitalize leading-none mt-0.5">
                    {activeOrganization.role || 'Owner'} • {activeOrganization.currency || 'USD'}
                  </p>
                </div>
              </div>

              {onOpenNewOrgModal && (
                <button
                  type="button"
                  onClick={onOpenNewOrgModal}
                  className="shrink-0 p-1.5 rounded-md text-[#8A99AD] hover:text-white hover:bg-[#333A48] transition-colors"
                  title="Create New Entity / LLC"
                >
                  <Plus size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
